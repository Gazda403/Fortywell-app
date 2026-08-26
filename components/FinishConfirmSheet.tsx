/**
 * FinishConfirmSheet
 * ─────────────────────────────────────────────────────────────────────────────
 * Bottom sheet asking "Are you sure you want to finish?" with stats preview
 * and an explicit classification selector: "Was this your Main Session, or something else?"
 */

import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Modal, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  CheckCircle2,
  Flame,
  Target,
  Dumbbell,
  Sun,
  Moon,
  Circle,
  HelpCircle,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { fontFamilies } from '../theme/typography';
import { ResetSlot } from '../types/rhythm';

interface Props {
  visible: boolean;
  completedSets: number;
  totalSets: number;
  durationSeconds: number;
  volumeKg: number;
  onConfirm: (slot: ResetSlot) => void;
  onCancel: () => void;
}

function fmt(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const SLOT_OPTIONS: {
  slot: ResetSlot;
  label: string;
  badge: string;
  icon: any;
  accent: string;
}[] = [
  {
    slot: 'main',
    label: 'Main Session',
    badge: 'CORE WORKOUT',
    icon: Dumbbell,
    accent: colors.primary,
  },
  {
    slot: 'morning',
    label: 'Morning Session',
    badge: 'WAKE-UP',
    icon: Sun,
    accent: colors.sage,
  },
  {
    slot: 'night',
    label: 'Night Time Session',
    badge: 'WIND-DOWN',
    icon: Moon,
    accent: colors.rose,
  },
];

export function FinishConfirmSheet({
  visible,
  completedSets,
  totalSets,
  durationSeconds,
  volumeKg,
  onConfirm,
  onCancel,
}: Props) {
  const [selectedSlot, setSelectedSlot] = useState<ResetSlot>('main');
  const sheetY = useSharedValue(500);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setSelectedSlot('main');
      sheetY.value = withSpring(0, { damping: 20, stiffness: 150 });
      backdropOpacity.value = withTiming(1, { duration: 220 });
    } else {
      sheetY.value = withTiming(500, { duration: 250 });
      backdropOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const pct = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;

  const handleSelectSlot = (slot: ResetSlot) => {
    setSelectedSlot(slot);
    try {
      if (Platform.OS !== 'web') {
        Haptics.selectionAsync();
      }
    } catch (_) {}
  };

  const handleConfirm = () => {
    try {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (_) {}
    onConfirm(selectedSlot);
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <View style={s.root}>
        <Animated.View style={[s.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
        </Animated.View>

        <Animated.View style={[s.sheet, sheetStyle]}>
          <View style={s.handle} />

          <Text style={s.title}>Finish Workout?</Text>
          <Text style={s.subtitle}>Here's how you did today</Text>

          {/* Quick Stats */}
          <View style={s.statsRow}>
            <View style={s.stat}>
              <CheckCircle2 size={18} color={colors.sage} />
              <Text style={s.statVal}>{completedSets}/{totalSets}</Text>
              <Text style={s.statLbl}>SETS</Text>
            </View>
            <View style={s.divider} />
            <View style={s.stat}>
              <Flame size={18} color={colors.primaryDark} />
              <Text style={s.statVal}>{fmt(durationSeconds)}</Text>
              <Text style={s.statLbl}>TIME</Text>
            </View>
            <View style={s.divider} />
            <View style={s.stat}>
              <Target size={18} color={colors.warning} />
              <Text style={s.statVal}>{volumeKg}kg</Text>
              <Text style={s.statLbl}>VOLUME</Text>
            </View>
          </View>

          {/* Completion bar */}
          <View style={s.barWrap}>
            <View style={s.barTrack}>
              <LinearGradient
                colors={[colors.sage, colors.sageDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[s.barFill, { width: `${pct}%` }]}
              />
            </View>
            <Text style={s.barTxt}>{pct}% complete</Text>
          </View>

          {/* Slot Classification Question */}
          <View style={s.classifyBox}>
            <View style={s.classifyHeader}>
              <HelpCircle size={13} color={colors.primaryDark} strokeWidth={2} />
              <Text style={s.classifyQuestion}>
                Was this your Main Session, or something else?
              </Text>
            </View>

            <View style={s.slotOptionsRow}>
              {SLOT_OPTIONS.map((opt) => {
                const isSelected = selectedSlot === opt.slot;
                const IconComp = opt.icon;

                return (
                  <Pressable
                    key={opt.slot}
                    onPress={() => handleSelectSlot(opt.slot)}
                    style={[
                      s.slotOptionPill,
                      isSelected && [s.slotOptionPillSelected, { borderColor: opt.accent }],
                    ]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
                  >
                    <IconComp
                      size={14}
                      color={isSelected ? opt.accent : colors.textTertiary}
                      strokeWidth={2}
                    />
                    <Text
                      style={[
                        s.slotOptionText,
                        isSelected && [s.slotOptionTextSelected, { color: colors.textPrimary }],
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Finish */}
          <Pressable style={s.finishBtn} onPress={handleConfirm}>
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              style={s.finishGrad}
            >
              <Text style={s.finishTxt}>YES, CONFIRM & LOG WORKOUT 🎉</Text>
            </LinearGradient>
          </Pressable>

          {/* Keep going */}
          <Pressable style={s.keepBtn} onPress={onCancel}>
            <Text style={s.keepTxt}>Keep Going</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(28,21,17,0.55)',
  },
  sheet: {
    backgroundColor: '#FAF8F5',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    alignItems: 'center',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(101,78,60,0.18)',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontFamily: fontFamilies.soria,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: fontFamilies.monoRegular,
    color: colors.textTertiary,
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 14,
    width: '100%',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(101,78,60,0.08)',
  },
  stat: { flex: 1, alignItems: 'center', gap: 3 },
  divider: { width: 1, height: 36, backgroundColor: 'rgba(101,78,60,0.1)' },
  statVal: { fontSize: 15, fontFamily: fontFamilies.monoBold, color: colors.textPrimary },
  statLbl: { fontSize: 8.5, fontFamily: fontFamilies.monoMedium, color: colors.textTertiary, letterSpacing: 0.8 },
  barWrap: {
    width: '100%',
    marginBottom: 14,
    gap: 4,
  },
  barTrack: {
    height: 6,
    backgroundColor: 'rgba(146,169,117,0.15)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 3 },
  barTxt: {
    fontSize: 9.5,
    fontFamily: fontFamilies.monoMedium,
    color: colors.textTertiary,
    textAlign: 'right',
  },

  // Classify Box
  classifyBox: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  classifyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  classifyQuestion: {
    fontSize: 11.5,
    fontFamily: fontFamilies.sansSemiBold,
    color: colors.textPrimary,
  },
  slotOptionsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  slotOptionPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: colors.surfaceCard,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.borderSubtle,
  },
  slotOptionPillSelected: {
    backgroundColor: '#FFFFFF',
  },
  slotOptionText: {
    fontSize: 10.5,
    fontFamily: fontFamilies.sansMedium,
    color: colors.textTertiary,
  },
  slotOptionTextSelected: {
    fontFamily: fontFamilies.sansSemiBold,
  },

  finishBtn: { width: '100%', borderRadius: 16, overflow: 'hidden', marginBottom: 8 },
  finishGrad: { paddingVertical: 14, alignItems: 'center' },
  finishTxt: { fontSize: 12, fontFamily: fontFamilies.monoBold, color: '#FFF', letterSpacing: 1 },
  keepBtn: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(101,78,60,0.07)',
    alignItems: 'center',
  },
  keepTxt: { fontSize: 11.5, fontFamily: fontFamilies.monoMedium, color: colors.textPrimary, letterSpacing: 0.5 },
});

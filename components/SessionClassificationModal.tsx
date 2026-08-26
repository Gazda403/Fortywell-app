import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  Sun,
  Dumbbell,
  Moon,
  CheckCircle2,
  Circle,
  Sparkles,
  HelpCircle,
  X,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { fontFamilies } from '../theme/typography';
import { ResetSlot } from '../types/rhythm';

interface Props {
  visible: boolean;
  initialSlot?: ResetSlot;
  onConfirm: (slot: ResetSlot) => void;
  onCancel: () => void;
}

const SLOT_OPTIONS: {
  slot: ResetSlot;
  title: string;
  badge?: string;
  badgeColor?: string;
  subtitle: string;
  icon: any;
  accentColor: string;
  bgTint: string;
}[] = [
  {
    slot: 'main',
    title: 'Main Session',
    badge: 'CORE WORKOUT',
    badgeColor: colors.primaryDark,
    subtitle: 'Primary strength, mobility, or exercise session of the day',
    icon: Dumbbell,
    accentColor: colors.primary,
    bgTint: 'rgba(201, 99, 116, 0.08)',
  },
  {
    slot: 'morning',
    title: 'Morning Session',
    badge: 'WAKE-UP',
    badgeColor: colors.sageDark,
    subtitle: 'Joint fluidity, spinal wake-up & nervous system activation',
    icon: Sun,
    accentColor: colors.sage,
    bgTint: 'rgba(146, 169, 117, 0.08)',
  },
  {
    slot: 'night',
    title: 'Night Time Session',
    badge: 'OPTIONAL WIND-DOWN',
    badgeColor: colors.textTertiary,
    subtitle: 'Restorative stretch, walk, reading, or relaxing hobby',
    icon: Moon,
    accentColor: colors.rose,
    bgTint: 'rgba(208, 120, 135, 0.08)',
  },
];

export function SessionClassificationModal({
  visible,
  initialSlot = 'main',
  onConfirm,
  onCancel,
}: Props) {
  const [selectedSlot, setSelectedSlot] = useState<ResetSlot>(initialSlot);
  const sheetY = useSharedValue(400);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setSelectedSlot(initialSlot);
      sheetY.value = withSpring(0, { damping: 20, stiffness: 150 });
      backdropOpacity.value = withTiming(1, { duration: 220 });
    } else {
      sheetY.value = withTiming(400, { duration: 250 });
      backdropOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible, initialSlot]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

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

          {/* Header */}
          <View style={s.headerRow}>
            <View style={s.kickerRow}>
              <HelpCircle size={13} color={colors.primaryDark} strokeWidth={2} />
              <Text style={s.kicker}>SESSION CLASSIFICATION</Text>
            </View>
            <Pressable onPress={onCancel} hitSlop={10} style={s.closeBtn}>
              <X size={16} color={colors.textTertiary} />
            </Pressable>
          </View>

          <Text style={s.title}>Was this your Main Session, or something else?</Text>
          <Text style={s.subtitle}>
            A workout can happen anytime of day. Confirm which slot this completion counts toward so your rhythm history stays accurate.
          </Text>

          {/* Options */}
          <View style={s.optionsList}>
            {SLOT_OPTIONS.map((opt) => {
              const isSelected = selectedSlot === opt.slot;
              const IconComp = opt.icon;

              return (
                <Pressable
                  key={opt.slot}
                  onPress={() => handleSelectSlot(opt.slot)}
                  style={[
                    s.optionCard,
                    isSelected && [s.optionCardSelected, { borderColor: opt.accentColor, backgroundColor: opt.bgTint }],
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                >
                  <View style={[s.iconBox, { backgroundColor: isSelected ? opt.accentColor : 'rgba(101,78,60,0.08)' }]}>
                    <IconComp size={18} color={isSelected ? '#FFFFFF' : colors.textPrimary} strokeWidth={2} />
                  </View>

                  <View style={s.optionInfo}>
                    <View style={s.optionTitleRow}>
                      <Text style={[s.optionTitle, isSelected && { color: colors.textPrimary }]}>
                        {opt.title}
                      </Text>
                      {opt.badge && (
                        <View style={[s.optBadge, { borderColor: opt.accentColor + '44' }]}>
                          <Text style={[s.optBadgeText, { color: opt.badgeColor }]}>{opt.badge}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={s.optionDesc}>{opt.subtitle}</Text>
                  </View>

                  <View style={s.radioCircle}>
                    {isSelected ? (
                      <CheckCircle2 size={22} color={opt.accentColor} strokeWidth={2.2} />
                    ) : (
                      <Circle size={22} color={colors.borderMedium} strokeWidth={1.8} />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* Confirm Button */}
          <Pressable style={s.confirmBtn} onPress={handleConfirm}>
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              style={s.confirmGrad}
            >
              <Sparkles size={14} color="#FFF" strokeWidth={2} />
              <Text style={s.confirmTxt}>CONFIRM & LOG COMPLETION</Text>
            </LinearGradient>
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
    backgroundColor: 'rgba(28,21,17,0.6)',
  },
  sheet: {
    backgroundColor: '#FAF8F5',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(101,78,60,0.18)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  kicker: {
    fontSize: 9.5,
    fontFamily: fontFamilies.monoBold,
    letterSpacing: 1.5,
    color: colors.primaryDark,
  },
  closeBtn: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontFamily: fontFamilies.soria,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 26,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 12.5,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 18,
  },
  optionsList: {
    gap: 10,
    marginBottom: 20,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: colors.borderSubtle,
    gap: 12,
  },
  optionCardSelected: {
    ...Platform.select({
      ios: {
        shadowColor: '#2A2320',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
      default: { boxShadow: '0 3px 8px rgba(42,35,32,0.08)' },
    }),
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionInfo: {
    flex: 1,
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
    flexWrap: 'wrap',
  },
  optionTitle: {
    fontSize: 14,
    fontFamily: fontFamilies.sansSemiBold,
    color: colors.textPrimary,
  },
  optBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    borderWidth: 1,
  },
  optBadgeText: {
    fontSize: 8.5,
    fontFamily: fontFamilies.monoBold,
    letterSpacing: 0.5,
  },
  optionDesc: {
    fontSize: 11,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textTertiary,
    lineHeight: 15,
  },
  radioCircle: {
    width: 26,
    alignItems: 'center',
  },
  confirmBtn: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  confirmGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
  },
  confirmTxt: {
    fontSize: 12.5,
    fontFamily: fontFamilies.monoBold,
    color: '#FFF',
    letterSpacing: 1.2,
  },
});

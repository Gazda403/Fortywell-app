/**
 * CancelWorkoutSheet
 * ─────────────────────────────────────────────────────────────────────────────
 * Bottom sheet asking "Are you sure you want to cancel?" when a user
 * tries to dismiss or cancel an active workout.
 */

import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Modal, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { AlertTriangle } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { fontFamilies } from '../theme/typography';

const { height: H } = Dimensions.get('window');

interface Props {
  visible: boolean;
  onKeepGoing: () => void;
  onDiscard: () => void;
}

export function CancelWorkoutSheet({ visible, onKeepGoing, onDiscard }: Props) {
  const sheetY = useSharedValue(300);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      sheetY.value = withSpring(0, { damping: 20, stiffness: 150 });
      backdropOpacity.value = withTiming(1, { duration: 220 });
    } else {
      sheetY.value = withTiming(300, { duration: 250 });
      backdropOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <View style={s.root}>
        <Animated.View style={[s.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onKeepGoing} />
        </Animated.View>

        <Animated.View style={[s.sheet, sheetStyle]}>
          {/* Handle */}
          <View style={s.handle} />

          {/* Warning icon */}
          <View style={s.iconBox}>
            <AlertTriangle size={32} color={colors.primaryDark} />
          </View>

          <Text style={s.title}>Cancel Workout?</Text>
          <Text style={s.body}>
            Your current workout progress and logged sets will not be saved.
            {'\n'}This cannot be undone.
          </Text>

          {/* Discard — destructive */}
          <Pressable style={s.discardBtn} onPress={onDiscard}>
            <Text style={s.discardTxt}>DISCARD WORKOUT</Text>
          </Pressable>

          {/* Keep going — safe */}
          <Pressable style={s.keepBtn} onPress={onKeepGoing}>
            <Text style={s.keepTxt}>Keep Going</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(28,21,17,0.55)',
  },
  sheet: {
    backgroundColor: '#FAF8F5',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(101,78,60,0.18)',
    marginBottom: 20,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(201,99,116,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontFamily: fontFamilies.soria,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  body: {
    fontSize: 13,
    fontFamily: fontFamilies.monoRegular,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  discardBtn: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 14,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    marginBottom: 10,
  },
  discardTxt: {
    fontSize: 12,
    fontFamily: fontFamilies.monoBold,
    color: '#FFF',
    letterSpacing: 1.2,
  },
  keepBtn: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 14,
    backgroundColor: 'rgba(101,78,60,0.07)',
    alignItems: 'center',
  },
  keepTxt: {
    fontSize: 12,
    fontFamily: fontFamilies.monoMedium,
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
});

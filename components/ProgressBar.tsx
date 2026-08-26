import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../theme/colors';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  category?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  currentStep,
  totalSteps,
  category,
}) => {
  const progressPercent = Math.min(100, Math.max(0, (currentStep / totalSteps) * 100));
  const progressShared = useSharedValue(progressPercent);

  useEffect(() => {
    progressShared.value = withTiming(progressPercent, { duration: 400 });
  }, [progressPercent, progressShared]);

  const animatedBarStyle = useAnimatedStyle(() => ({
    width: `${progressShared.value}%`,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.category}>
          {category?.toUpperCase() ?? 'ONBOARDING'}
        </Text>
        <Text style={styles.stepCounter}>
          {currentStep} / {totalSteps}
        </Text>
      </View>

      {/* Segmented dot track — more editorial than a single bar */}
      <View style={styles.dotsRow}>
        {Array.from({ length: totalSteps }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i < currentStep ? styles.dotFilled : styles.dotEmpty,
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  category: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2.5,
    color: colors.textTertiary,
  },
  stepCounter: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 1,
    color: colors.textTertiary,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    flex: 1,
    height: 2,
    borderRadius: 1,
  },
  dotFilled: {
    backgroundColor: colors.primary,
  },
  dotEmpty: {
    backgroundColor: colors.border,
  },
});

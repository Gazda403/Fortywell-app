import React, { useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, Pressable, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme/colors';
import { QuizOption } from '../types/onboarding';

interface OptionCardProps {
  option: QuizOption;
  isSelected: boolean;
  onPress: (id: string) => void;
  isMultiSelect?: boolean;
}

const OptionCardComponent: React.FC<OptionCardProps> = ({
  option,
  isSelected,
  onPress,
  isMultiSelect = false,
}) => {
  const selectProgress = useSharedValue(isSelected ? 1 : 0);
  const pressScale = useSharedValue(1);

  useEffect(() => {
    selectProgress.value = withTiming(isSelected ? 1 : 0, { duration: 200 });
  }, [isSelected, selectProgress]);

  const handlePressIn = () => {
    pressScale.value = withSpring(0.985, { damping: 20, stiffness: 300 });
  };

  const handlePressOut = useCallback(() => {
    pressScale.value = withSpring(1, { damping: 18, stiffness: 250 });
  }, [pressScale]);

  const handlePress = () => {
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch {
      // fallback
    }
    onPress(option.id);
  };

  // Animated row background
  const animatedRowStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      selectProgress.value,
      [0, 1],
      ['transparent', 'rgba(201, 99, 116, 0.06)']
    ),
    transform: [{ scale: pressScale.value }],
  }));

  // Animated left accent bar
  const accentBarStyle = useAnimatedStyle(() => ({
    opacity: selectProgress.value,
    transform: [{ scaleY: selectProgress.value }],
  }));

  // Animated indicator fill
  const indicatorFillStyle = useAnimatedStyle(() => ({
    opacity: selectProgress.value,
    transform: [{ scale: selectProgress.value }],
  }));

  return (
    <Animated.View style={[styles.row, animatedRowStyle]}>
      {/* Rose left accent bar — visible only when selected */}
      <Animated.View style={[styles.accentBar, accentBarStyle]} />

      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.pressable}
        accessibilityRole={isMultiSelect ? 'checkbox' : 'radio'}
        accessibilityState={{ selected: isSelected }}
        accessibilityLabel={`${option.title}${option.subtitle ? `. ${option.subtitle}` : ''}`}
      >
        {/* Text content */}
        <View style={styles.textBlock}>
          <View style={styles.titleRow}>
            <Text
              style={[
                styles.optionTitle,
                isSelected && styles.optionTitleSelected,
              ]}
            >
              {option.title}
            </Text>
            {option.badge && (
              <View style={[styles.badge, isSelected && styles.badgeSelected]}>
                <Text style={[styles.badgeText, isSelected && styles.badgeTextSelected]}>
                  {option.badge}
                </Text>
              </View>
            )}
          </View>
          {option.subtitle && (
            <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
          )}
        </View>

        {/* Right indicator — circle for radio, square for checkbox */}
        <View style={[styles.indicator, isSelected && styles.indicatorSelected]}>
          <Animated.View style={[styles.indicatorInner, indicatorFillStyle]}>
            <View style={styles.indicatorDot} />
          </Animated.View>
        </View>
      </Pressable>

      {/* Bottom separator line */}
      <View style={styles.separator} />
    </Animated.View>
  );
};

// Memoized — re-renders only when selection or identity changes
export const OptionCard = React.memo(OptionCardComponent, (prev, next) =>
  prev.isSelected === next.isSelected &&
  prev.option.id === next.option.id &&
  prev.isMultiSelect === next.isMultiSelect
);

const styles = StyleSheet.create({
  row: {
    position: 'relative',
    borderRadius: 4,
    overflow: 'hidden',
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3.5,
    backgroundColor: colors.primary,
    borderRadius: 2,
    zIndex: 2,
  },
  pressable: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingLeft: 22,
    paddingRight: 22,
    minHeight: 70,
  },
  textBlock: {
    flex: 1,
    paddingRight: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 3,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
    lineHeight: 22,
    color: colors.textPrimary,
  },
  optionTitleSelected: {
    color: colors.primary,
  },
  optionSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    letterSpacing: 0.1,
    lineHeight: 19,
    color: colors.textTertiary,
    marginTop: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(101, 78, 60, 0.08)',
  },
  badgeSelected: {
    backgroundColor: 'rgba(201, 99, 116, 0.12)',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    lineHeight: 13,
    textTransform: 'uppercase',
    color: colors.textTertiary,
  },
  badgeTextSelected: {
    color: colors.primary,
  },
  indicator: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  indicatorSelected: {
    borderColor: colors.primary,
  },
  indicatorInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  separator: {
    height: 1,
    marginLeft: 22,
    marginRight: 22,
    backgroundColor: colors.borderSubtle,
  },
});

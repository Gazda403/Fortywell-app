import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Platform,
  Dimensions,
  AccessibilityInfo,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  FadeIn,
  FadeOut,
  SlideInUp,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Sparkles, ArrowRight, Check, Compass, X } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { typography, fontFamilies } from '../theme/typography';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export interface ElementRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type SpotlightTargetKey =
  | 'todaySessions'
  | 'readinessStrip'
  | 'navCoach'
  | 'navRhythm'
  | 'navGarden';

export type TargetRectsMap = Partial<Record<SpotlightTargetKey, ElementRect>>;

interface SpotlightTourProps {
  visible: boolean;
  targetRects?: TargetRectsMap;
  onComplete: () => void;
  onSkip: () => void;
}

interface TourStep {
  id: number;
  type: 'intro' | 'spotlight' | 'outro';
  targetKey?: SpotlightTargetKey;
  kicker: string;
  stepNumber?: number;
  totalSpotlightSteps?: number;
  headline: string;
  description: string;
  buttonText: string;
  tooltipPosition?: 'top' | 'bottom';
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 0,
    type: 'intro',
    kicker: 'WELCOME TO FORTYWELL',
    headline: "Let's take a quick look around",
    description:
      'A 30-second guided tour to show you how Fortywell adapts to your body, energy, and hormonal rhythm each day.',
    buttonText: 'Show me around',
  },
  {
    id: 1,
    type: 'spotlight',
    targetKey: 'todaySessions',
    kicker: 'YOUR DAILY STRUCTURE',
    stepNumber: 1,
    totalSpotlightSteps: 5,
    headline: 'Your 3 Daily Sessions',
    description:
      'This is your day, broken into three simple sessions — Morning, Main, and Night Time. Each session is tailored to your energy and joints.',
    buttonText: 'Next',
    tooltipPosition: 'bottom',
  },
  {
    id: 2,
    type: 'spotlight',
    targetKey: 'readinessStrip',
    kicker: 'WEEKLY CADENCE & GOALS',
    stepNumber: 2,
    totalSpotlightSteps: 5,
    headline: 'Your Rhythm & Goals',
    description:
      'Track your active streak, daily target duration, and weekly session milestones at a glance.',
    buttonText: 'Next',
    tooltipPosition: 'bottom',
  },
  {
    id: 3,
    type: 'spotlight',
    targetKey: 'navCoach',
    kicker: 'AI COACHING',
    stepNumber: 3,
    totalSpotlightSteps: 5,
    headline: 'Your AI Coach',
    description:
      "Your Coach explains why today's plan looks the way it does, provides hormone-aware insights, and is always ready for your questions.",
    buttonText: 'Next',
    tooltipPosition: 'top',
  },
  {
    id: 4,
    type: 'spotlight',
    targetKey: 'navRhythm',
    kicker: 'WEEKLY CYCLICAL FLOW',
    stepNumber: 4,
    totalSpotlightSteps: 5,
    headline: 'Rhythm & Cycle',
    description:
      'See your whole week at a glance, sync your cycle phase, and reschedule or adjust sessions without guilt.',
    buttonText: 'Next',
    tooltipPosition: 'top',
  },
  {
    id: 5,
    type: 'spotlight',
    targetKey: 'navGarden',
    kicker: 'LIVING PROGRESS',
    stepNumber: 5,
    totalSpotlightSteps: 5,
    headline: 'Your Living Garden',
    description:
      'Every session you complete helps your garden grow — nurture your consistency and watch your joint vitality bloom.',
    buttonText: 'Next',
    tooltipPosition: 'top',
  },
  {
    id: 6,
    type: 'outro',
    kicker: 'READY TO BEGIN',
    headline: "You're all set!",
    description:
      'You are ready to start Day 1. You can revisit this guided tour anytime from your Profile settings at the top right.',
    buttonText: "Let's begin",
  },
];

// Fallback viewport coordinates for targets if dynamic measurement is pending
const FALLBACK_RECTS: Record<SpotlightTargetKey, ElementRect> = {
  todaySessions: {
    x: 16,
    y: Math.max(340, SCREEN_H * 0.42),
    width: SCREEN_W - 32,
    height: 190,
  },
  readinessStrip: {
    x: 20,
    y: Math.max(250, SCREEN_H * 0.31),
    width: SCREEN_W - 40,
    height: 75,
  },
  navCoach: {
    x: SCREEN_W * 0.28,
    y: SCREEN_H - 85,
    width: SCREEN_W * 0.22,
    height: 60,
  },
  navRhythm: {
    x: SCREEN_W * 0.52,
    y: SCREEN_H - 85,
    width: SCREEN_W * 0.22,
    height: 60,
  },
  navGarden: {
    x: SCREEN_W * 0.74,
    y: SCREEN_H - 85,
    width: SCREEN_W * 0.22,
    height: 60,
  },
};

export const SpotlightTour: React.FC<SpotlightTourProps> = ({
  visible,
  targetRects = {},
  onComplete,
  onSkip,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);

  // Pulse glow animation around the spotlight cutout
  const pulseGlow = useSharedValue(1);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      setPrefersReducedMotion(enabled);
    });
  }, []);

  useEffect(() => {
    if (visible && !prefersReducedMotion) {
      pulseGlow.value = withRepeat(
        withSequence(
          withTiming(1.18, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1,
        true
      );
    } else {
      pulseGlow.value = 1;
    }
  }, [visible, prefersReducedMotion]);

  const currentStep = TOUR_STEPS[currentStepIndex];

  // Resolve target coordinates with fallback
  const targetRect = useMemo((): ElementRect | null => {
    if (currentStep.type !== 'spotlight' || !currentStep.targetKey) {
      return null;
    }
    const dynamic = targetRects[currentStep.targetKey];
    if (dynamic && dynamic.width > 0 && dynamic.height > 0) {
      return dynamic;
    }
    return FALLBACK_RECTS[currentStep.targetKey];
  }, [currentStep, targetRects]);

  const handleNext = useCallback(() => {
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch {}

    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      onComplete();
    }
  }, [currentStepIndex, onComplete]);

  const handleSkip = useCallback(() => {
    try {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    } catch {}
    onSkip();
  }, [onSkip]);

  const haloAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseGlow.value }],
    opacity: 0.75,
  }));

  if (!visible) return null;

  // Tooltip positioning
  const padding = 10;
  const targetX = targetRect ? targetRect.x - padding : 0;
  const targetY = targetRect ? targetRect.y - padding : 0;
  const targetW = targetRect ? targetRect.width + padding * 2 : 0;
  const targetH = targetRect ? targetRect.height + padding * 2 : 0;

  // Calculate tooltip placement
  const isBottomNav =
    currentStep.tooltipPosition === 'top' ||
    currentStep.targetKey === 'navCoach' ||
    currentStep.targetKey === 'navRhythm' ||
    currentStep.targetKey === 'navGarden';

  const bottomOffset = targetRect
    ? Math.max(120, SCREEN_H - targetY + 24)
    : 120;

  const tooltipTop = targetRect
    ? Math.min(SCREEN_H - 280, targetY + targetH + 16)
    : (SCREEN_H - 320) / 2;

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
      {/* ── CHARCOAL BACKDROP WITH SPOTLIGHT HOLE ── */}
      {currentStep.type === 'spotlight' && targetRect ? (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
          {/* Top dark block */}
          <View
            style={[
              styles.backdropBlock,
              {
                top: 0,
                left: 0,
                right: 0,
                height: Math.max(0, targetY),
              },
            ]}
          />
          {/* Bottom dark block */}
          <View
            style={[
              styles.backdropBlock,
              {
                top: targetY + targetH,
                left: 0,
                right: 0,
                bottom: 0,
              },
            ]}
          />
          {/* Left dark block */}
          <View
            style={[
              styles.backdropBlock,
              {
                top: targetY,
                left: 0,
                width: Math.max(0, targetX),
                height: targetH,
              },
            ]}
          />
          {/* Right dark block */}
          <View
            style={[
              styles.backdropBlock,
              {
                top: targetY,
                left: targetX + targetW,
                right: 0,
                height: targetH,
              },
            ]}
          />

          {/* ── PULSING ROSE SPOTLIGHT FRAME ── */}
          <View
            style={[
              styles.spotlightFrame,
              {
                top: targetY,
                left: targetX,
                width: targetW,
                height: targetH,
              },
            ]}
            pointerEvents="box-none"
          >
            <Animated.View style={[styles.spotlightHalo, haloAnimatedStyle]} />
            <Pressable
              style={StyleSheet.absoluteFillObject}
              onPress={handleNext}
              accessibilityLabel="Tap highlighted area to continue"
            />
          </View>
        </View>
      ) : (
        /* Full dark background for intro & outro */
        <View style={[StyleSheet.absoluteFillObject, styles.backdropBlock]} />
      )}

      {/* ── SKIP TOUR LINK (ALWAYS VISIBLE AT TOP RIGHT) ── */}
      <View style={styles.topBar}>
        <View style={styles.brandBadge}>
          <Text style={styles.brandBadgeText}>✦ FORTYWELL TOUR</Text>
        </View>
        <Pressable
          style={styles.skipBtn}
          onPress={handleSkip}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Skip guided tour"
        >
          <Text style={styles.skipBtnText}>Skip tour</Text>
          <X size={14} color={colors.textInverse} />
        </Pressable>
      </View>

      {/* ── TOOLTIP / DIALOG CARD ── */}
      {currentStep.type === 'spotlight' ? (
        <Animated.View
          key={`step-${currentStep.id}`}
          entering={FadeIn.duration(260)}
          style={[
            styles.tooltipCard,
            isBottomNav
              ? { bottom: bottomOffset }
              : { top: tooltipTop },
          ]}
        >
          {/* Header Row: Step counter */}
          <View style={styles.cardHeaderRow}>
            <View style={styles.stepBadge}>
              <View style={styles.stepBadgeDot} />
              <Text style={styles.stepBadgeText}>
                STEP {currentStep.stepNumber} OF {currentStep.totalSpotlightSteps}
              </Text>
            </View>
            <Text style={styles.cardKicker}>{currentStep.kicker}</Text>
          </View>

          {/* Headline */}
          <Text style={styles.cardHeadline}>{currentStep.headline}</Text>

          {/* Description */}
          <Text style={styles.cardDescription}>{currentStep.description}</Text>

          {/* Progress Dots & Next Button Row */}
          <View style={styles.cardFooterRow}>
            <View style={styles.dotsRow}>
              {[1, 2, 3, 4, 5].map((s) => {
                const isActive = s === currentStep.stepNumber;
                return (
                  <View
                    key={s}
                    style={[
                      styles.dot,
                      isActive && styles.dotActive,
                      s < (currentStep.stepNumber || 1) && styles.dotCompleted,
                    ]}
                  />
                );
              })}
            </View>

            <Pressable
              style={styles.nextBtn}
              onPress={handleNext}
              accessibilityRole="button"
              accessibilityLabel={currentStep.buttonText}
            >
              <Text style={styles.nextBtnText}>{currentStep.buttonText}</Text>
              <ArrowRight size={15} color="#FFFFFF" strokeWidth={2.5} />
            </Pressable>
          </View>
        </Animated.View>
      ) : (
        /* Intro / Outro Center Modal Card */
        <View style={styles.centerModalWrap} pointerEvents="box-none">
          <Animated.View
            key={`modal-${currentStep.id}`}
            entering={FadeIn.duration(300)}
            style={styles.modalCard}
          >
            <View style={styles.modalIconCircle}>
              {currentStep.type === 'intro' ? (
                <Compass size={28} color={colors.primary} />
              ) : (
                <Sparkles size={28} color={colors.primary} />
              )}
            </View>

            <Text style={styles.modalKicker}>{currentStep.kicker}</Text>
            <Text style={styles.modalHeadline}>{currentStep.headline}</Text>
            <Text style={styles.modalDescription}>{currentStep.description}</Text>

            <Pressable
              style={styles.modalPrimaryBtn}
              onPress={handleNext}
              accessibilityRole="button"
              accessibilityLabel={currentStep.buttonText}
            >
              <Text style={styles.modalPrimaryBtnText}>{currentStep.buttonText}</Text>
              <ArrowRight size={16} color="#FFFFFF" strokeWidth={2.4} />
            </Pressable>

            {currentStep.type === 'intro' && (
              <Pressable
                style={styles.modalSkipBtn}
                onPress={handleSkip}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Skip tour and explore on my own"
              >
                <Text style={styles.modalSkipBtnText}>Skip and explore on my own</Text>
              </Pressable>
            )}
          </Animated.View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  // Charcoal backdrop with 78% opacity (never pure black)
  backdropBlock: {
    position: 'absolute',
    backgroundColor: 'rgba(58, 53, 50, 0.78)',
  },

  // Spotlight Cutout & Glowing Halo
  spotlightFrame: {
    position: 'absolute',
    borderRadius: 20,
    borderWidth: 2.5,
    borderColor: colors.rose,
    zIndex: 100,
    ...Platform.select({
      ios: {
        shadowColor: colors.rose,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 14,
      },
      android: { elevation: 8 },
      default: {
        boxShadow: '0 0 20px rgba(208, 120, 135, 0.65)',
      },
    }),
  },
  spotlightHalo: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(208, 120, 135, 0.5)',
  },

  // Top Bar with Skip Tour link
  topBar: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 18 : 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 200,
  },
  brandBadge: {
    backgroundColor: 'rgba(42, 35, 32, 0.7)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(245, 239, 230, 0.2)',
  },
  brandBadgeText: {
    fontSize: 9,
    fontFamily: fontFamilies.monoBold,
    letterSpacing: 1.4,
    color: colors.textInverse,
  },
  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(42, 35, 32, 0.75)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 239, 230, 0.25)',
  },
  skipBtnText: {
    fontSize: 12,
    fontFamily: fontFamilies.sansMedium,
    color: colors.textInverse,
  },

  // Tooltip card (anchored near spotlight)
  tooltipCard: {
    position: 'absolute',
    left: 20,
    right: 20,
    backgroundColor: colors.surfaceCard,
    borderRadius: 24,
    padding: 22,
    zIndex: 150,
    borderWidth: 1.5,
    borderColor: 'rgba(208, 120, 135, 0.25)',
    ...Platform.select({
      ios: {
        shadowColor: '#2A2320',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.22,
        shadowRadius: 20,
      },
      android: { elevation: 12 },
      default: {
        boxShadow: '0 12px 32px rgba(42, 35, 32, 0.28)',
      },
    }),
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  stepBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.surfaceCardSelected,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.primarySoft,
  },
  stepBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.rose,
  },
  stepBadgeText: {
    fontSize: 9,
    fontFamily: fontFamilies.monoBold,
    letterSpacing: 1,
    color: colors.primaryDark,
  },
  cardKicker: {
    fontSize: 10,
    fontFamily: fontFamilies.sansSemiBold,
    letterSpacing: 1.2,
    color: colors.textTertiary,
    textTransform: 'uppercase',
  },
  cardHeadline: {
    fontSize: 20,
    fontFamily: fontFamilies.soria,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 13.5,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 18,
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.borderMedium,
  },
  dotActive: {
    width: 20,
    backgroundColor: colors.rose,
  },
  dotCompleted: {
    backgroundColor: colors.sageDark,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.rose,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    ...Platform.select({
      ios: {
        shadowColor: colors.rose,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: { elevation: 4 },
      default: {},
    }),
  },
  nextBtnText: {
    fontSize: 13,
    fontFamily: fontFamilies.sansBold,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  // Center Modal Card (Intro & Outro steps)
  centerModalWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 150,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.surfaceCard,
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(208, 120, 135, 0.25)',
    ...Platform.select({
      ios: {
        shadowColor: '#2A2320',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.3,
        shadowRadius: 24,
      },
      android: { elevation: 16 },
      default: {
        boxShadow: '0 16px 40px rgba(42, 35, 32, 0.32)',
      },
    }),
  },
  modalIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.surfaceCardSelected,
    borderWidth: 1.5,
    borderColor: colors.borderSelected,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalKicker: {
    fontSize: 10,
    fontFamily: fontFamilies.monoBold,
    letterSpacing: 1.8,
    color: colors.primary,
    marginBottom: 6,
  },
  modalHeadline: {
    fontSize: 24,
    fontFamily: fontFamilies.soria,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.4,
    marginBottom: 10,
  },
  modalDescription: {
    fontSize: 14,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    backgroundColor: colors.rose,
    paddingVertical: 16,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: colors.rose,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
      },
      android: { elevation: 6 },
      default: {},
    }),
  },
  modalPrimaryBtnText: {
    fontSize: 15,
    fontFamily: fontFamilies.sansBold,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  modalSkipBtn: {
    marginTop: 14,
    paddingVertical: 6,
  },
  modalSkipBtnText: {
    fontSize: 13,
    fontFamily: fontFamilies.sansMedium,
    color: colors.textTertiary,
    textDecorationLine: 'underline',
  },
});

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
  withRepeat,
  withSequence,
  FadeIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  ArrowRight,
  Compass,
  Sparkles,
  Sun,
  BarChart2,
  Bot,
  Activity,
  Leaf,
  X,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { fontFamilies } from '../theme/typography';

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
  accentColor: string;
  iconBg: string;
  Icon: React.ComponentType<{ size: number; color: string; strokeWidth?: number }>;
  tag?: string;
}

const ROSE = '#C9465B';
const SAGE = '#708655';
const AMBER = '#B07A35';
const VIOLET = '#7C65A5';
const TEAL = '#3D8B8B';

const TOUR_STEPS: TourStep[] = [
  {
    id: 0,
    type: 'intro',
    kicker: 'WELCOME TO FORTYWELL',
    headline: "Let's take a quick look around",
    description: 'A 30-second tour showing you how Fortywell adapts to your body and hormonal rhythm every single day.',
    buttonText: 'Show me around',
    accentColor: ROSE,
    iconBg: 'rgba(201,70,91,0.12)',
    Icon: Compass,
  },
  {
    id: 1,
    type: 'spotlight',
    targetKey: 'todaySessions',
    kicker: 'YOUR DAILY STRUCTURE',
    stepNumber: 1,
    totalSpotlightSteps: 5,
    headline: 'Your 3 Daily Sessions',
    description: 'Morning warmup, main workout, and a night-time wind-down — each auto-tailored to your joints and energy for today.',
    buttonText: 'Next',
    accentColor: ROSE,
    iconBg: 'rgba(201,70,91,0.1)',
    Icon: Sun,
    tag: 'Morning Warmup  •  Main Workout  •  Night Wind-Down',
  },
  {
    id: 2,
    type: 'spotlight',
    targetKey: 'readinessStrip',
    kicker: 'WEEKLY CADENCE & GOALS',
    stepNumber: 2,
    totalSpotlightSteps: 5,
    headline: 'Your Streak & Weekly Goals',
    description: "See your active streak, daily session target, and how many sessions you've hit this week vs. your personal goal.",
    buttonText: 'Next',
    accentColor: AMBER,
    iconBg: 'rgba(176,122,53,0.1)',
    Icon: BarChart2,
    tag: 'Active Streak  •  Daily Target  •  Weekly Consistency',
  },
  {
    id: 3,
    type: 'spotlight',
    targetKey: 'navCoach',
    kicker: 'AI COACHING',
    stepNumber: 3,
    totalSpotlightSteps: 5,
    headline: 'Your AI Coach',
    description: "Tap Coach to get hormone-aware insights and ask why today's plan looks the way it does. Available 24/7.",
    buttonText: 'Next',
    accentColor: VIOLET,
    iconBg: 'rgba(124,101,165,0.1)',
    Icon: Bot,
    tag: '24/7 Hormone-aware coaching & guidance',
  },
  {
    id: 4,
    type: 'spotlight',
    targetKey: 'navRhythm',
    kicker: 'WEEKLY CYCLICAL FLOW',
    stepNumber: 4,
    totalSpotlightSteps: 5,
    headline: 'Rhythm & Cycle View',
    description: 'See your whole week at a glance, sync your cycle phase, and reschedule or swap sessions without guilt.',
    buttonText: 'Next',
    accentColor: TEAL,
    iconBg: 'rgba(61,139,139,0.1)',
    Icon: Activity,
    tag: 'Weekly Rhythm  •  Cycle Phase Sync',
  },
  {
    id: 5,
    type: 'spotlight',
    targetKey: 'navGarden',
    kicker: 'LIVING PROGRESS',
    stepNumber: 5,
    totalSpotlightSteps: 5,
    headline: 'Your Living Garden',
    description: 'Every session you complete makes your garden grow — a beautiful, living record of your consistency and joint health.',
    buttonText: 'Next',
    accentColor: SAGE,
    iconBg: 'rgba(112,134,85,0.1)',
    Icon: Leaf,
    tag: 'Visual garden progress with every completed session',
  },
  {
    id: 6,
    type: 'outro',
    kicker: 'READY TO BEGIN',
    headline: "You're all set!",
    description: 'Start your first session below. You can replay this tour anytime from the Settings icon at the top right.',
    buttonText: "Let's begin",
    accentColor: ROSE,
    iconBg: 'rgba(201,70,91,0.12)',
    Icon: Sparkles,
  },
];

const INTRO_FEATURES = [
  { Icon: Sun, color: ROSE, label: 'Your 3 daily sessions' },
  { Icon: BarChart2, color: AMBER, label: 'Streak & weekly goals' },
  { Icon: Bot, color: VIOLET, label: '24/7 AI Coach' },
  { Icon: Activity, color: TEAL, label: 'Rhythm & Cycle view' },
  { Icon: Leaf, color: SAGE, label: 'Living Garden progress' },
];

const FALLBACK_RECTS: Record<SpotlightTargetKey, ElementRect> = {
  todaySessions: { x: 16, y: Math.max(320, SCREEN_H * 0.40), width: SCREEN_W - 32, height: 200 },
  readinessStrip: { x: 16, y: Math.max(220, SCREEN_H * 0.29), width: SCREEN_W - 32, height: 80 },
  navCoach:  { x: SCREEN_W * 0.22, y: SCREEN_H - 82, width: SCREEN_W * 0.18, height: 60 },
  navRhythm: { x: SCREEN_W * 0.52, y: SCREEN_H - 82, width: SCREEN_W * 0.18, height: 60 },
  navGarden: { x: SCREEN_W * 0.72, y: SCREEN_H - 82, width: SCREEN_W * 0.22, height: 60 },
};

const SPOTLIGHT_PAD = 10;
const SAFE_M = 20;
const TOOLTIP_H = 210;
const TOP_BAR_H = Platform.OS === 'web' ? 62 : 102;

export const SpotlightTour: React.FC<SpotlightTourProps> = ({
  visible,
  targetRects = {},
  onComplete,
  onSkip,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);
  const pulseGlow = useSharedValue(1);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setPrefersReducedMotion);
  }, []);

  // Reset to step 0 whenever tour becomes visible
  useEffect(() => {
    if (visible) setCurrentStepIndex(0);
  }, [visible]);

  useEffect(() => {
    if (visible && !prefersReducedMotion) {
      pulseGlow.value = withRepeat(
        withSequence(withTiming(1.15, { duration: 900 }), withTiming(1, { duration: 900 })),
        -1,
        true
      );
    } else {
      pulseGlow.value = 1;
    }
  }, [visible, prefersReducedMotion]);

  const currentStep = TOUR_STEPS[currentStepIndex];

  const targetRect = useMemo((): ElementRect | null => {
    if (currentStep.type !== 'spotlight' || !currentStep.targetKey) return null;
    const dyn = targetRects[currentStep.targetKey];
    if (dyn && dyn.width > 0 && dyn.height > 0) return dyn;
    return FALLBACK_RECTS[currentStep.targetKey];
  }, [currentStep, targetRects]);

  const handleNext = useCallback(() => {
    try { if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setCurrentStepIndex((p) => p + 1);
    } else {
      onComplete();
    }
  }, [currentStepIndex, onComplete]);

  const handleSkip = useCallback(() => {
    try { if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); } catch {}
    onSkip();
  }, [onSkip]);

  const haloStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulseGlow.value }], opacity: 0.55 }));

  if (!visible) return null;

  // Spotlight geometry
  const sX = targetRect ? targetRect.x - SPOTLIGHT_PAD : 0;
  const sY = targetRect ? targetRect.y - SPOTLIGHT_PAD : 0;
  const sW = targetRect ? targetRect.width  + SPOTLIGHT_PAD * 2 : 0;
  const sH = targetRect ? targetRect.height + SPOTLIGHT_PAD * 2 : 0;

  // Smart tooltip placement: above spotlight if spotlight is in bottom 55%, else below
  const spotMidY = sY + sH / 2;
  const inBottom = spotMidY > SCREEN_H * 0.55;
  let ttTop: number;
  let arrowDown: boolean;
  if (targetRect) {
    if (inBottom) {
      ttTop = Math.max(TOP_BAR_H + 8, sY - TOOLTIP_H - 16);
      arrowDown = true;
    } else {
      ttTop = Math.min(SCREEN_H - TOOLTIP_H - SAFE_M, sY + sH + 16);
      arrowDown = false;
    }
    ttTop = Math.max(TOP_BAR_H + 8, Math.min(SCREEN_H - TOOLTIP_H - SAFE_M, ttTop));
  } else {
    ttTop = (SCREEN_H - TOOLTIP_H) / 2;
    arrowDown = false;
  }

  // Arrow horizontal position aligned to spotlight center, clamped
  const spotMidX = sX + sW / 2;
  const arrowLeft = Math.max(24, Math.min(SCREEN_W - 44, spotMidX - SAFE_M));

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
      {/* BACKDROP WITH HOLE */}
      {currentStep.type === 'spotlight' && targetRect ? (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
          <View style={[s.bg, { top: 0, left: 0, right: 0, height: Math.max(0, sY) }]} />
          <View style={[s.bg, { top: sY + sH, left: 0, right: 0, bottom: 0 }]} />
          <View style={[s.bg, { top: sY, left: 0, width: Math.max(0, sX), height: sH }]} />
          <View style={[s.bg, { top: sY, left: sX + sW, right: 0, height: sH }]} />
          <View
            style={[s.frame, { top: sY, left: sX, width: sW, height: sH, borderColor: currentStep.accentColor }]}
            pointerEvents="box-none"
          >
            <Animated.View style={[s.halo, haloStyle, { borderColor: currentStep.accentColor + '55' }]} />
            <Pressable style={StyleSheet.absoluteFillObject} onPress={handleNext} accessibilityLabel="Tap to continue" />
          </View>
        </View>
      ) : (
        <View style={[StyleSheet.absoluteFillObject, s.bg]} />
      )}

      {/* TOP BAR */}
      <View style={s.topBar}>
        <View style={s.badge}>
          <Text style={s.badgeText}>✦ FORTYWELL TOUR</Text>
        </View>
        <Pressable style={s.skipBtn} onPress={handleSkip} hitSlop={14} accessibilityRole="button" accessibilityLabel="Skip tour">
          <Text style={s.skipText}>Skip</Text>
          <X size={13} color="rgba(255,255,255,0.9)" />
        </Pressable>
      </View>

      {/* PROGRESS BAR */}
      {currentStep.type === 'spotlight' && currentStep.stepNumber != null && (
        <View style={s.progressWrap}>
          {[1, 2, 3, 4, 5].map((n) => (
            <View
              key={n}
              style={[
                s.seg,
                n < currentStep.stepNumber!  && { backgroundColor: currentStep.accentColor, opacity: 0.45 },
                n === currentStep.stepNumber! && { backgroundColor: currentStep.accentColor, flex: 1.8 },
                n > currentStep.stepNumber!  && { backgroundColor: 'rgba(255,255,255,0.18)' },
              ]}
            />
          ))}
        </View>
      )}

      {/* TOOLTIP (spotlight steps) */}
      {currentStep.type === 'spotlight' ? (
        <Animated.View
          key={`tt-${currentStep.id}`}
          entering={FadeIn.duration(220)}
          style={[s.tooltip, { top: ttTop, borderColor: currentStep.accentColor + '40' }]}
        >
          {/* Arrow */}
          {targetRect && (
            <View
              style={[
                s.arrow,
                arrowDown ? { bottom: -10, transform: [{ rotate: '180deg' }] } : { top: -10 },
                { left: arrowLeft, borderBottomColor: currentStep.accentColor + '70' },
              ]}
            />
          )}

          {/* Header */}
          <View style={s.ttHeader}>
            <View style={[s.ttIcon, { backgroundColor: currentStep.iconBg }]}>
              <currentStep.Icon size={16} color={currentStep.accentColor} strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.ttKicker, { color: currentStep.accentColor }]}>
                STEP {currentStep.stepNumber} OF {currentStep.totalSpotlightSteps}  ·  {currentStep.kicker}
              </Text>
              <Text style={s.ttHeadline}>{currentStep.headline}</Text>
            </View>
          </View>

          <Text style={s.ttDesc}>{currentStep.description}</Text>

          {currentStep.tag && (
            <View style={[s.tagPill, { backgroundColor: currentStep.accentColor + '15', borderColor: currentStep.accentColor + '35' }]}>
              <Text style={[s.tagText, { color: currentStep.accentColor }]}>{currentStep.tag}</Text>
            </View>
          )}

          <View style={s.ttFooter}>
            <Text style={s.tapHint}>or tap the highlighted area</Text>
            <Pressable
              style={[s.nextBtn, { backgroundColor: currentStep.accentColor }]}
              onPress={handleNext}
              accessibilityRole="button"
              accessibilityLabel={currentStep.buttonText}
            >
              <Text style={s.nextText}>{currentStep.buttonText}</Text>
              <ArrowRight size={14} color="#FFF" strokeWidth={2.5} />
            </Pressable>
          </View>
        </Animated.View>
      ) : (
        /* CENTER MODAL (intro/outro) */
        <View style={s.centerWrap} pointerEvents="box-none">
          <Animated.View key={`mod-${currentStep.id}`} entering={FadeIn.duration(300)} style={s.modal}>
            <View style={[s.modalIcon, { backgroundColor: currentStep.iconBg }]}>
              <currentStep.Icon size={30} color={currentStep.accentColor} strokeWidth={1.8} />
            </View>

            <Text style={[s.modalKicker, { color: currentStep.accentColor }]}>{currentStep.kicker}</Text>
            <Text style={s.modalHeadline}>{currentStep.headline}</Text>
            <Text style={s.modalDesc}>{currentStep.description}</Text>

            {currentStep.type === 'intro' && (
              <View style={s.featureList}>
                {INTRO_FEATURES.map((f) => (
                  <View key={f.label} style={s.featureRow}>
                    <View style={[s.featureIconBadge, { backgroundColor: f.color + '18' }]}>
                      <f.Icon size={13} color={f.color} strokeWidth={2.2} />
                    </View>
                    <Text style={s.featureLabel}>{f.label}</Text>
                  </View>
                ))}
              </View>
            )}

            <Pressable
              style={[s.primaryBtn, { backgroundColor: currentStep.accentColor }]}
              onPress={handleNext}
              accessibilityRole="button"
              accessibilityLabel={currentStep.buttonText}
            >
              <Text style={s.primaryBtnText}>{currentStep.buttonText}</Text>
              <ArrowRight size={16} color="#FFF" strokeWidth={2.4} />
            </Pressable>

            {currentStep.type === 'intro' && (
              <Pressable style={s.skipLink} onPress={handleSkip} hitSlop={10}>
                <Text style={s.skipLinkText}>Skip — I'll explore on my own</Text>
              </Pressable>
            )}
          </Animated.View>
        </View>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  bg: {
    position: 'absolute',
    backgroundColor: 'rgba(22,15,10,0.83)',
  },
  frame: {
    position: 'absolute',
    borderRadius: 18,
    borderWidth: 2,
    zIndex: 100,
    ...Platform.select({
      ios: { shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.85, shadowRadius: 16 },
      android: { elevation: 8 },
      default: {},
    }),
  },
  halo: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  topBar: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 18 : 52,
    left: 20, right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 300,
  },
  badge: {
    backgroundColor: 'rgba(28,18,12,0.82)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  badgeText: {
    fontSize: 9,
    fontFamily: fontFamilies.monoBold,
    letterSpacing: 1.4,
    color: 'rgba(255,255,255,0.9)',
  },
  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(28,18,12,0.82)',
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  skipText: {
    fontSize: 12,
    fontFamily: fontFamilies.sansMedium,
    color: 'rgba(255,255,255,0.9)',
  },
  progressWrap: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 58 : 90,
    left: 20, right: 20,
    flexDirection: 'row',
    gap: 4,
    zIndex: 300,
    height: 3,
  },
  seg: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },
  tooltip: {
    position: 'absolute',
    left: SAFE_M, right: SAFE_M,
    backgroundColor: colors.surfaceCard ?? '#FDF7F3',
    borderRadius: 22,
    padding: 18,
    zIndex: 200,
    borderWidth: 1.5,
    ...Platform.select({
      ios: { shadowColor: '#1A0A05', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.22, shadowRadius: 18 },
      android: { elevation: 14 },
      default: { boxShadow: '0 10px 30px rgba(18,8,4,0.3)' },
    }),
  },
  arrow: {
    position: 'absolute',
    width: 0, height: 0,
    borderLeftWidth: 9, borderRightWidth: 9, borderBottomWidth: 10,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    zIndex: 1,
  },
  ttHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  ttIcon: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, marginTop: 2,
  },
  ttKicker: {
    fontSize: 8.5,
    fontFamily: fontFamilies.monoBold,
    letterSpacing: 0.7,
    marginBottom: 3,
    textTransform: 'uppercase',
  },
  ttHeadline: {
    fontSize: 17,
    fontFamily: fontFamilies.soria ?? fontFamilies.sansBold,
    fontWeight: '700',
    color: colors.textPrimary ?? '#1A0C06',
    letterSpacing: -0.3,
  },
  ttDesc: {
    fontSize: 13,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textSecondary ?? '#6B5C52',
    lineHeight: 19,
    marginBottom: 10,
  },
  tagPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  tagText: {
    fontSize: 10.5,
    fontFamily: fontFamilies.sansMedium,
    letterSpacing: 0.2,
  },
  ttFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tapHint: {
    fontSize: 10.5,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textTertiary ?? '#9E8D84',
    fontStyle: 'italic',
    flex: 1,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 13,
  },
  nextText: {
    fontSize: 13,
    fontFamily: fontFamilies.sansBold,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  centerWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 200,
  },
  modal: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.surfaceCard ?? '#FDF7F3',
    borderRadius: 28,
    padding: 26,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(201,70,91,0.2)',
    ...Platform.select({
      ios: { shadowColor: '#1A0A05', shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.28, shadowRadius: 24 },
      android: { elevation: 18 },
      default: { boxShadow: '0 16px 40px rgba(18,8,4,0.34)' },
    }),
  },
  modalIcon: {
    width: 64, height: 64, borderRadius: 32,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
  },
  modalKicker: {
    fontSize: 10,
    fontFamily: fontFamilies.monoBold,
    letterSpacing: 1.8,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  modalHeadline: {
    fontSize: 22,
    fontFamily: fontFamilies.soria ?? fontFamilies.sansBold,
    fontWeight: '700',
    color: colors.textPrimary ?? '#1A0C06',
    textAlign: 'center',
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  modalDesc: {
    fontSize: 14,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textSecondary ?? '#6B5C52',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 16,
  },
  featureList: {
    width: '100%',
    backgroundColor: 'rgba(201,70,91,0.06)',
    borderRadius: 14,
    padding: 14,
    gap: 8,
    marginBottom: 18,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureIconBadge: {
    width: 24,
    height: 24,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureLabel: {
    fontSize: 13,
    fontFamily: fontFamilies.sansMedium,
    color: colors.textPrimary ?? '#1A0C06',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    paddingVertical: 15,
    borderRadius: 16,
  },
  primaryBtnText: {
    fontSize: 15,
    fontFamily: fontFamilies.sansBold,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  skipLink: {
    marginTop: 14,
    paddingVertical: 6,
  },
  skipLinkText: {
    fontSize: 13,
    fontFamily: fontFamilies.sansMedium,
    color: colors.textTertiary ?? '#9E8D84',
    textDecorationLine: 'underline',
  },
});

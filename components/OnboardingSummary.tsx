import React, { useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, ActivityIndicator, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import {
  Sparkles,
  ShieldCheck,
  Clock,
  BatteryCharging,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Heart,
  Home,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { OnboardingAnswers } from '../types/onboarding';

interface OnboardingSummaryProps {
  firstName?: string;
  answers: OnboardingAnswers;
  isSaving: boolean;
  saveError: string | null;
  onComplete: () => void;
  onReview: () => void;
}

const FOCUS_LABELS: Record<string, string> = {
  joint_mobility: 'Joint Mobility & Ease',
  daily_energy: 'Vitality & All-Day Energy',
  pelvic_core: 'Complete Body Strength',
  posture_relief: 'Relieve Pain (Neck, Back & Hips)',
  deep_sleep: 'Restorative Sleep & Calm',
};

const ENERGY_LABELS: Record<string, string> = {
  frequently_tired: 'Gentle Pacing (Low Fatigue)',
  moderate: 'Adaptive & Cyclical Energy',
  high: 'Progressive Strength & Longevity',
};

const TIME_LABELS: Record<string, string> = {
  '15_min': '10–15 mins daily micro-practice',
  '30_min': '20–30 mins balanced flow',
  '45_min': '40–45 mins comprehensive mobility',
};

const LOCATION_LABELS: Record<string, string> = {
  home: 'Home Training Space',
  gym: 'Full Gym & Studio Access',
  hybrid: 'Hybrid (Home & Gym)',
};

const EQUIPMENT_LABELS: Record<string, string> = {
  resistance_bands: 'Resistance Bands',
  dumbbells: 'Dumbbells',
  parallettes: 'Parallettes',
  barbell: 'Barbell & Plates',
  yoga_mat_blocks: 'Yoga Mat & Blocks',
  kettlebell: 'Kettlebells',
  pull_up_bar: 'Pull-Up Bar',
  none: 'Bodyweight Only',
};

export const OnboardingSummary: React.FC<OnboardingSummaryProps> = ({
  firstName,
  answers,
  isSaving,
  saveError,
  onComplete,
  onReview,
}) => {
  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(20);
  const badgeScale = useSharedValue(0.8);

  const primaryFocus = answers.target_focus?.[0]
    ? FOCUS_LABELS[answers.target_focus[0]] || 'Joint Longevity'
    : 'Hormone-Aware Wellness';

  useEffect(() => {
    cardOpacity.value = withTiming(1, { duration: 500 });
    cardTranslateY.value = withSpring(0, { damping: 14, stiffness: 120 });
    badgeScale.value = withDelay(200, withSpring(1, { damping: 12, stiffness: 160 }));
  }, []);

  const handleStartPress = () => {
    try {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {
      // safe fallback
    }
    onComplete();
  };

  const animatedCardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslateY.value }],
  }));

  const animatedBadgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }],
  }));

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Editorial Badge & Title */}
      <View style={styles.header}>
        <Animated.View style={[styles.heroIconCircle, animatedBadgeStyle]}>
          <Sparkles size={28} color={colors.primary} />
        </Animated.View>
        <Text style={styles.kicker}>YOUR PERSONALIZED PROTOCOL</Text>
        <Text style={[typography.hero, styles.heroTitle]}>
          {firstName ? `Got it, ${firstName}.` : 'Tailored for Your Body & Rhythm'}
        </Text>
        <Text style={[typography.body, styles.heroSubtitle]}>
          {firstName
            ? `${primaryFocus} is your focus. We’ve calibrated your daily rhythm to protect your joints and elevate your energy.`
            : 'We’ve calibrated your movement library to nurture joints, balance energy, and respect your daily schedule.'}
        </Text>
      </View>

      {/* ── 3-PART DAILY STRUCTURE REVEAL ── */}
      <View style={styles.structureCard}>
        <Text style={styles.structureHeaderKicker}>YOUR DAILY 3-PART RHYTHM</Text>
        <View style={styles.structureRow}>
          <View style={styles.structureDot} />
          <View style={styles.structureTextWrap}>
            <Text style={styles.structureTitle}>Morning Session</Text>
            <Text style={styles.structureDesc}>5–10 min Joint Fluidity & Nervous System Wakeup</Text>
          </View>
        </View>
        <View style={styles.structureDivider} />
        <View style={styles.structureRow}>
          <View style={[styles.structureDot, { backgroundColor: colors.primary }]} />
          <View style={styles.structureTextWrap}>
            <Text style={styles.structureTitle}>Main Session</Text>
            <Text style={styles.structureDesc}>Functional Strength, Mobility & Bone Density</Text>
          </View>
        </View>
        <View style={styles.structureDivider} />
        <View style={styles.structureRow}>
          <View style={[styles.structureDot, { backgroundColor: colors.peach }]} />
          <View style={styles.structureTextWrap}>
            <Text style={styles.structureTitle}>Night Time Session</Text>
            <Text style={styles.structureDesc}>Restorative Wind-Down & Sleep Preparation</Text>
          </View>
        </View>
      </View>

      {/* Summary Card */}
      <Animated.View style={[styles.summaryCard, animatedCardStyle]}>
        {/* Focus Areas */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <Heart size={16} color={colors.primary} />
            <Text style={styles.sectionLabel}>PRIMARY FOCUS AREAS</Text>
          </View>
          <View style={styles.tagsWrapper}>
            {answers.target_focus.map((focus) => (
              <View key={focus} style={styles.tagPill}>
                <Text style={styles.tagText}>{FOCUS_LABELS[focus] || focus}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.divider} />

        {/* Joint Protection Safeguards */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <ShieldCheck size={16} color={colors.sageDark} />
            <Text style={[styles.sectionLabel, { color: colors.sageDark }]}>
              PROTECTIVE MODIFICATIONS ACTIVE
            </Text>
          </View>
          <View style={styles.tagsWrapper}>
            {answers.joint_sensitivities.map((joint) => (
              <View key={joint} style={[styles.tagPill, styles.tagPillSage]}>
                <Text style={[styles.tagText, styles.tagTextSage]}>
                  {joint === 'none'
                    ? 'Full Range of Motion (No Limitations)'
                    : `Protected: ${joint.replace('_', ' ').toUpperCase()}`}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.divider} />

        {/* Energy & Time Cadence */}
        <View style={styles.metricsRow}>
          <View style={styles.metricCol}>
            <View style={styles.metricIconRow}>
              <BatteryCharging size={16} color={colors.primary} />
              <Text style={styles.metricLabel}>ENERGY PACING</Text>
            </View>
            <Text style={styles.metricValue}>
              {answers.energy_baseline ? ENERGY_LABELS[answers.energy_baseline] : 'Adaptive'}
            </Text>
          </View>

          <View style={styles.verticalDivider} />

          <View style={styles.metricCol}>
            <View style={styles.metricIconRow}>
              <Clock size={16} color={colors.primary} />
              <Text style={styles.metricLabel}>DAILY WINDOW</Text>
            </View>
            <Text style={styles.metricValue}>
              {answers.time_commitment ? TIME_LABELS[answers.time_commitment] : '15–30 mins'}
            </Text>
            {answers.weekly_frequency ? (
              <Text style={styles.metricSubValue}>
                {answers.weekly_frequency} / week
              </Text>
            ) : null}
          </View>
        </View>

        {answers.training_location && (
          <>
            <View style={styles.divider} />
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeaderRow}>
                <Home size={16} color={colors.primary} />
                <Text style={styles.sectionLabel}>TRAINING ENVIRONMENT</Text>
              </View>
              <Text style={styles.environmentTitle}>
                {LOCATION_LABELS[answers.training_location] || answers.training_location}
              </Text>
              {answers.equipment && answers.equipment.length > 0 && (
                <View style={[styles.tagsWrapper, { marginTop: 8 }]}>
                  {answers.equipment.map((eq) => (
                    <View key={eq} style={styles.tagPill}>
                      <Text style={styles.tagText}>{EQUIPMENT_LABELS[eq] || eq}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </>
        )}
      </Animated.View>

      {/* Supabase Save Status Notification */}
      <View style={styles.statusBox}>
        {isSaving ? (
          <View style={styles.statusRow}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.statusText}>Saving protocol to your Fortywell profile...</Text>
          </View>
        ) : saveError ? (
          <View style={styles.statusRow}>
            <RefreshCw size={14} color={colors.error} />
            <Text style={[styles.statusText, { color: colors.error }]}>
              {saveError} (Saved locally)
            </Text>
          </View>
        ) : (
          <View style={styles.statusRow}>
            <CheckCircle2 size={16} color={colors.sage} />
            <Text style={[styles.statusText, { color: colors.sageDark }]}>
              Profile synchronized to Supabase
            </Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <Pressable
          onPress={handleStartPress}
          style={styles.primaryButton}
          disabled={isSaving}
          android_ripple={{ color: colors.primaryDark }}
          accessibilityRole="button"
          accessibilityLabel="Begin my first mobility flow"
          accessibilityState={{ disabled: isSaving }}
        >
          <Text style={typography.button}>Begin My First Mobility Flow</Text>
          <ArrowRight size={18} color={colors.textInverse} strokeWidth={2.4} />
        </Pressable>

        <Pressable
          onPress={onReview}
          style={styles.secondaryButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Review or edit my answers"
        >
          <Text style={styles.secondaryButtonText}>Review or edit my answers</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  heroIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surfaceCardSelected,
    borderWidth: 1.5,
    borderColor: colors.borderSelected,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  kicker: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    color: colors.primary,
    marginBottom: 8,
  },
  heroTitle: {
    textAlign: 'center',
    marginBottom: 10,
    color: colors.textPrimary,
  },
  heroSubtitle: {
    textAlign: 'center',
    color: colors.textSecondary,
    lineHeight: 22,
    maxWidth: 320,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: 20,
    marginVertical: 14,
    ...Platform.select({
      ios: {
        shadowColor: colors.textPrimary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
      default: {},
    }),
  },
  sectionBlock: {
    marginVertical: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: colors.primary,
  },
  tagsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  environmentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    lineHeight: 20,
    marginBottom: 4,
  },
  tagPill: {
    backgroundColor: colors.surfaceCardSelected,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primarySoft,
  },
  tagPillSage: {
    backgroundColor: colors.sageSoft,
    borderColor: 'transparent',
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primaryDark,
  },
  tagTextSage: {
    color: colors.sageDark,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginVertical: 14,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  metricCol: {
    flex: 1,
  },
  verticalDivider: {
    width: 1,
    height: 48,
    backgroundColor: colors.borderSubtle,
    marginHorizontal: 12,
  },
  metricIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.textTertiary,
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    lineHeight: 18,
  },
  metricSubValue: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 2,
  },
  statusBox: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  actionContainer: {
    marginTop: 10,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      default: {},
    }),
  },
  structureCard: {
    backgroundColor: colors.surfaceCard,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    ...Platform.select({
      ios: {
        shadowColor: '#2A2320',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  structureHeaderKicker: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: colors.textTertiary,
    marginBottom: 12,
  },
  structureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  structureDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.sageDark,
  },
  structureTextWrap: {
    flex: 1,
  },
  structureTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  structureDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  structureDivider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginVertical: 10,
    marginLeft: 22,
  },
  secondaryButton: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
});

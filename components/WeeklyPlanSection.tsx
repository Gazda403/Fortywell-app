/**
 * WeeklyPlanSection — Premium adaptive weekly workout plan UI
 *
 * Shows:
 *  1. Section header with week label + adaptation badge
 *  2. AI Coach message card (dark hero style)
 *  3. Horizontal scrolling workout cards, one per planned session
 *  4. Tappable — opens the WorkoutDetailModal for each session
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  Sparkles,
  Bot,
  ChevronRight,
  Clock,
  Flame,
  ShieldCheck,
  Zap,
  RotateCcw,
  Flower2,
  TrendingUp,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { fontFamilies } from '../theme/typography';
import { WeeklyPlan } from '../lib/useWeeklyPlan';
import { Workout } from '../hooks/useWorkouts';

// ─── Types ────────────────────────────────────────────────────────────────────

interface WeeklyPlanSectionProps {
  plan: WeeklyPlan | null;
  loading?: boolean;
  completedSlugs?: Set<string>;
  onWorkoutPress?: (workout: Workout) => void;
  onRefresh?: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

type AdaptationMode = 'debut' | 'push' | 'maintain' | 'restore';

function detectMode(plan: WeeklyPlan): AdaptationMode {
  if (plan.isFirstWeek) return 'debut';
  if (plan.adaptationNotes.includes('+1 block')) return 'push';
  if (plan.adaptationNotes.includes('reduced')) return 'restore';
  return 'maintain';
}

const MODE_META: Record<AdaptationMode, {
  label: string;
  icon: React.ElementType;
  gradientColors: [string, string];
  badgeColor: string;
  badgeBg: string;
}> = {
  debut: {
    label: 'WEEK 1 · YOUR DEBUT',
    icon: Sparkles,
    gradientColors: ['#F39EB0', '#C9465B'],
    badgeColor: '#FFFFFF',
    badgeBg: 'rgba(255,255,255,0.18)',
  },
  push: {
    label: 'PROGRESSION WEEK',
    icon: TrendingUp,
    gradientColors: ['#C9465B', '#8B2240'],
    badgeColor: '#FFFFFF',
    badgeBg: 'rgba(255,255,255,0.16)',
  },
  maintain: {
    label: 'CONSISTENCY WEEK',
    icon: Flame,
    gradientColors: ['#E07B8A', '#C9465B'],
    badgeColor: '#FFFFFF',
    badgeBg: 'rgba(255,255,255,0.16)',
  },
  restore: {
    label: 'RECOVERY WEEK',
    icon: Flower2,
    gradientColors: ['#92A975', '#5E7847'],
    badgeColor: '#FFFFFF',
    badgeBg: 'rgba(255,255,255,0.18)',
  },
};

/** Returns short equipment label. */
function equipLabel(eq: string): string {
  switch (eq) {
    case 'home_bodyweight': return 'BODYWEIGHT';
    case 'home_dumbbells_bands': return 'DUMBBELLS';
    case 'gym_machines_free_weights': return 'GYM';
    default: return eq.replace(/_/g, ' ').toUpperCase();
  }
}

/** Workout card gradient per index for variety. */
const CARD_GRADIENTS: [string, string][] = [
  ['#F2D0D5', '#D8E8CF'],
  ['#EAD8C0', '#D5E2D0'],
  ['#F5D6DC', '#E6DAF0'],
  ['#E3DEC3', '#D0E3DB'],
  ['#F0E8D8', '#DDE8D5'],
  ['#EBD8E8', '#D8DFEB'],
  ['#F4DECA', '#E2EFD5'],
];

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Small badge pill. */
const Badge: React.FC<{ text: string; style?: object }> = ({ text, style }) => (
  <View style={[styles.badge, style]}>
    <Text style={styles.badgeText}>{text}</Text>
  </View>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export const WeeklyPlanSection: React.FC<WeeklyPlanSectionProps> = ({
  plan,
  loading,
  completedSlugs = new Set(),
  onWorkoutPress,
  onRefresh,
}) => {
  const [expanded, setExpanded] = useState(true);

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (loading || !plan) {
    return (
      <View style={styles.container}>
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionKicker}>THIS WEEK'S PROGRAMME</Text>
            <Text style={styles.sectionTitle}>Generating Your Plan…</Text>
          </View>
        </View>
        <View style={styles.skeletonCard}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.skeletonText}>Adapting to your profile</Text>
        </View>
      </View>
    );
  }

  const mode = detectMode(plan);
  const meta = MODE_META[mode];
  const ModeIcon = meta.icon;
  const completedCount = plan.workouts.filter((w) => completedSlugs.has(w.slug)).length;

  return (
    <View style={styles.container}>
      {/* ── Section Header ────────────────────────────────────────────────── */}
      <View style={styles.sectionHeaderRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionKicker}>THIS WEEK'S PROGRAMME</Text>
          <Text style={styles.sectionTitle}>Adaptive Weekly Plan</Text>
          <Text style={styles.sectionSubtitle}>{plan.weekLabel}</Text>
        </View>

        <View style={styles.headerRight}>
          <View style={styles.progressPill}>
            <Text style={styles.progressPillText}>
              {completedCount}/{plan.sessionsCount}
            </Text>
          </View>
          {onRefresh && (
            <Pressable
              onPress={() => {
                try { if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (_) {}
                onRefresh();
              }}
              hitSlop={10}
              style={styles.refreshBtn}
            >
              <RotateCcw size={14} color={colors.textTertiary} />
            </Pressable>
          )}
        </View>
      </View>

      {/* ── Coach Message Card ────────────────────────────────────────────── */}
      <Pressable
        style={styles.coachCardOuter}
        onPress={() => setExpanded((p) => !p)}
        accessibilityRole="button"
        accessibilityLabel="Toggle coach message"
      >
        <LinearGradient
          colors={meta.gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.coachCardGradient}
        >
          {/* Top row: mode badge + icon */}
          <View style={styles.coachCardTopRow}>
            <View style={[styles.modeBadge, { backgroundColor: meta.badgeBg }]}>
              <ModeIcon size={11} color={meta.badgeColor} />
              <Text style={[styles.modeBadgeText, { color: meta.badgeColor }]}>
                {meta.label}
              </Text>
            </View>
            <View style={styles.coachIconCircle}>
              <Bot size={14} color="#FFFFFF" />
            </View>
          </View>

          {/* Coach message text */}
          <Text
            style={styles.coachMessageText}
            numberOfLines={expanded ? undefined : 2}
          >
            {plan.coachMessage}
          </Text>

          {/* Adaptation note */}
          {expanded && (
            <View style={styles.adaptNoteRow}>
              <Sparkles size={10} color="rgba(255,255,255,0.7)" />
              <Text style={styles.adaptNoteText}>{plan.adaptationNotes}</Text>
            </View>
          )}

          {/* Week progress mini bar */}
          <View style={styles.progressBarWrap}>
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${plan.sessionsCount > 0
                      ? (completedCount / plan.sessionsCount) * 100
                      : 0}%`,
                  },
                ]}
              />
            </View>
            <Text style={styles.progressBarLabel}>
              {completedCount} of {plan.sessionsCount} sessions done
            </Text>
          </View>
        </LinearGradient>
      </Pressable>

      {/* ── Workout Cards Carousel ────────────────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.carouselContent}
        snapToInterval={230}
        decelerationRate="fast"
      >
        {plan.workouts.map((workout, idx) => {
          const isCompleted = completedSlugs.has(workout.slug);
          const cardGrad = CARD_GRADIENTS[idx % CARD_GRADIENTS.length];

          return (
            <Pressable
              key={workout.slug}
              style={styles.sessionCard}
              onPress={() => {
                try { if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (_) {}
                onWorkoutPress?.(workout);
              }}
              accessibilityRole="button"
              accessibilityLabel={`Session ${idx + 1}: ${workout.title}`}
            >
              {/* Card gradient background */}
              <LinearGradient
                colors={isCompleted ? ['#92A975', '#5E7847'] : cardGrad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />

              {/* Session number + completion tick */}
              <View style={styles.sessionCardTopRow}>
                <View style={styles.sessionNumBadge}>
                  <Text style={styles.sessionNumText}>
                    SESSION {idx + 1}
                  </Text>
                </View>
                {isCompleted && (
                  <View style={styles.completedTick}>
                    <ShieldCheck size={14} color="#FFFFFF" />
                  </View>
                )}
              </View>

              {/* Workout title */}
              <Text
                style={[
                  styles.sessionCardTitle,
                  isCompleted && styles.sessionCardTitleCompleted,
                ]}
                numberOfLines={3}
              >
                {workout.title}
              </Text>

              {/* Meta row: duration + energy */}
              <View style={styles.sessionMetaRow}>
                <View style={styles.sessionMetaItem}>
                  <Clock size={10} color={isCompleted ? 'rgba(255,255,255,0.8)' : colors.textSecondary} />
                  <Text style={[styles.sessionMetaText, isCompleted && { color: 'rgba(255,255,255,0.85)' }]}>
                    {workout.duration_minutes}m
                  </Text>
                </View>
                <View style={styles.sessionMetaItem}>
                  <Zap size={10} color={isCompleted ? 'rgba(255,255,255,0.8)' : colors.textSecondary} />
                  <Text style={[styles.sessionMetaText, isCompleted && { color: 'rgba(255,255,255,0.85)' }]}>
                    {workout.energy_level.toUpperCase()}
                  </Text>
                </View>
              </View>

              {/* Focus tags */}
              <View style={styles.sessionTagsRow}>
                {workout.joint_sensitivities_safe.slice(0, 2).map((s) => (
                  <View key={s} style={[styles.sessionTag, isCompleted && styles.sessionTagCompleted]}>
                    <Text style={[styles.sessionTagText, isCompleted && styles.sessionTagTextCompleted]}>
                      {s.toUpperCase()} SAFE
                    </Text>
                  </View>
                ))}
                <View style={[styles.sessionTag, isCompleted && styles.sessionTagCompleted]}>
                  <Text style={[styles.sessionTagText, isCompleted && styles.sessionTagTextCompleted]}>
                    {equipLabel(workout.equipment)}
                  </Text>
                </View>
              </View>

              {/* Start CTA arrow */}
              <View style={styles.sessionCardFooter}>
                <Text style={[styles.sessionStartText, isCompleted && { color: 'rgba(255,255,255,0.7)' }]}>
                  {isCompleted ? 'COMPLETED' : 'START SESSION'}
                </Text>
                <View style={[styles.sessionArrowBtn, isCompleted && styles.sessionArrowBtnCompleted]}>
                  <ChevronRight
                    size={12}
                    color={isCompleted ? '#5E7847' : colors.primaryDark}
                  />
                </View>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    marginBottom: 4,
  },

  // ── Section header
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  sectionKicker: {
    fontFamily: fontFamilies.monoBold,
    fontSize: 10,
    letterSpacing: 1.4,
    color: colors.textTertiary,
    marginBottom: 3,
  },
  sectionTitle: {
    fontFamily: fontFamilies.soria,
    fontSize: 22,
    color: colors.textPrimary,
    lineHeight: 28,
  },
  sectionSubtitle: {
    fontFamily: fontFamilies.monoRegular,
    fontSize: 10,
    color: colors.textTertiary,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressPill: {
    backgroundColor: colors.primarySoft,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  progressPillText: {
    fontFamily: fontFamilies.monoBold,
    fontSize: 11,
    color: colors.primaryDark,
    fontWeight: '600',
  },
  refreshBtn: {
    padding: 4,
  },

  // ── Loading skeleton
  skeletonCard: {
    marginHorizontal: 20,
    backgroundColor: colors.surfaceCard,
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  skeletonText: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 13,
    color: colors.textTertiary,
  },

  // ── Coach message card
  coachCardOuter: {
    marginHorizontal: 20,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#C9465B',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.28,
        shadowRadius: 14,
      },
      android: { elevation: 8 },
      web: { boxShadow: '0 6px 24px rgba(201,70,91,0.22)' },
    }),
  },
  coachCardGradient: {
    padding: 20,
    gap: 12,
  },
  coachCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  modeBadgeText: {
    fontFamily: fontFamilies.monoBold,
    fontSize: 9,
    letterSpacing: 1.2,
    fontWeight: '700',
  },
  coachIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coachMessageText: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 14.5,
    lineHeight: 22,
    color: '#FFFFFF',
    fontWeight: '400',
  },
  adaptNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.12)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  adaptNoteText: {
    fontFamily: fontFamilies.monoRegular,
    fontSize: 10,
    color: 'rgba(255,255,255,0.75)',
    flex: 1,
  },
  progressBarWrap: {
    gap: 5,
    marginTop: 4,
  },
  progressBarTrack: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  progressBarLabel: {
    fontFamily: fontFamilies.monoRegular,
    fontSize: 9.5,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.6,
  },

  // ── Carousel
  carouselContent: {
    paddingLeft: 20,
    paddingRight: 8,
    gap: 12,
  },
  sessionCard: {
    width: 218,
    minHeight: 220,
    borderRadius: 20,
    overflow: 'hidden',
    padding: 16,
    gap: 10,
    justifyContent: 'space-between',
    ...Platform.select({
      ios: {
        shadowColor: '#2A2320',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
      },
      android: { elevation: 5 },
      web: { boxShadow: '0 4px 16px rgba(42,35,32,0.1)' },
    }),
  },
  sessionCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sessionNumBadge: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  sessionNumText: {
    fontFamily: fontFamilies.monoBold,
    fontSize: 9,
    letterSpacing: 1.2,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  completedTick: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionCardTitle: {
    fontFamily: fontFamilies.soria,
    fontSize: 16,
    lineHeight: 21,
    color: colors.textPrimary,
    flex: 1,
  },
  sessionCardTitleCompleted: {
    color: '#FFFFFF',
  },
  sessionMetaRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  sessionMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  sessionMetaText: {
    fontFamily: fontFamilies.monoRegular,
    fontSize: 10,
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  sessionTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  sessionTag: {
    backgroundColor: 'rgba(0,0,0,0.07)',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  sessionTagCompleted: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  sessionTagText: {
    fontFamily: fontFamilies.monoBold,
    fontSize: 8.5,
    letterSpacing: 0.8,
    color: colors.textSecondary,
  },
  sessionTagTextCompleted: {
    color: 'rgba(255,255,255,0.85)',
  },
  sessionCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sessionStartText: {
    fontFamily: fontFamilies.monoBold,
    fontSize: 9.5,
    letterSpacing: 1.2,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  sessionArrowBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionArrowBtnCompleted: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },

  // ── Inline badge (not used currently, reserved)
  badge: {
    backgroundColor: colors.primarySoft,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontFamily: fontFamilies.monoBold,
    fontSize: 9,
    letterSpacing: 1,
    color: colors.primaryDark,
  },
});

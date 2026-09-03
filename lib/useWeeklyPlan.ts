/**
 * useWeeklyPlan — Adaptive Weekly Workout Plan Engine
 *
 * Generates a fresh, personalised workout plan every week based on:
 *  - User quiz profile (targets, joint sensitivities, energy, equipment, frequency)
 *  - Last week's actual performance (completions, mood, energy check-ins)
 *  - Workout library scores from the recommendation engine
 *
 * The plan is persisted in Supabase (`adaptive_weekly_plans` table) so it
 * survives app restarts and is shared across devices.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { OnboardingAnswers } from '../types/onboarding';
import { Workout } from '../hooks/useWorkouts';
import { getPersonalizedRecommendations } from './recommendationEngine';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WeeklyPlan {
  weekKey: string;               // e.g. "2026-W35"
  weekLabel: string;             // e.g. "Week 35 · Aug 25 – Aug 31"
  sessionsCount: number;         // how many workouts this week
  workouts: Workout[];           // ordered list of this week's workouts
  coachMessage: string;          // personalised intro from the AI coach
  adaptationNotes: string;       // brief note on how last week influenced this plan
  lastWeekCompletions: number;
  isFirstWeek: boolean;
  generatedAt: string;
}

export interface UseWeeklyPlanResult {
  plan: WeeklyPlan | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns "YYYY-WNN" for the week containing `date` (Monday-anchored). */
function getISOWeekKey(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  // Shift so Monday = 0
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  const year = monday.getFullYear();
  // ISO week number
  const startOfYear = new Date(year, 0, 1);
  const weekNum = Math.ceil(
    ((monday.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7
  );
  return `${year}-W${String(weekNum).padStart(2, '0')}`;
}

/** Returns "Aug 25 – Aug 31" style label for the week. */
function getWeekLabel(weekKey: string): string {
  try {
    const [year, wPart] = weekKey.split('-W');
    const weekNum = parseInt(wPart, 10);
    const jan1 = new Date(parseInt(year, 10), 0, 1);
    const dayOffset = jan1.getDay() === 0 ? 1 : 8 - jan1.getDay();
    const monday = new Date(parseInt(year, 10), 0, dayOffset + (weekNum - 1) * 7);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const fmt = (d: Date) =>
      d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${fmt(monday)} – ${fmt(sunday)}`;
  } catch {
    return '';
  }
}

/** Parse weekly_frequency string like "3–4 days" → integer target (lower bound). */
function parseSessionTarget(weekly_frequency?: string | null): number {
  if (!weekly_frequency) return 3;
  const match = weekly_frequency.match(/(\d+)/);
  return match ? Math.max(1, Math.min(7, parseInt(match[1], 10))) : 3;
}

/** Derive a YYYY-MM-DD string from a Date. */
function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ─── Coach Message Templates ───────────────────────────────────────────────────

interface PlanContext {
  firstName: string;
  isFirstWeek: boolean;
  lastCompletions: number;
  sessionsCount: number;
  primaryFocus: string;
  energyBaseline: string | null;
  lastAvgEnergy: number;
  weekLabel: string;
  adaptationMode: 'push' | 'maintain' | 'restore' | 'debut';
}

function buildCoachMessage(ctx: PlanContext): string {
  const name = ctx.firstName || 'there';

  if (ctx.isFirstWeek || ctx.adaptationMode === 'debut') {
    const focusText = ctx.primaryFocus
      ? ctx.primaryFocus.replace(/_/g, ' ')
      : 'joint vitality';
    return (
      `Welcome to your first FortyWell week, ${name}. ` +
      `I've built ${ctx.sessionsCount} sessions calibrated to your profile — focused on ${focusText}. ` +
      `Start at your own pace. Every rep counts.`
    );
  }

  if (ctx.adaptationMode === 'push') {
    return (
      `Strong week, ${name} — you hit ${ctx.lastCompletions} of ${ctx.sessionsCount} sessions. ` +
      `This week I've slightly progressed the challenge: longer holds, more blocks, or new movement patterns. ` +
      `Your body is ready. Let's build on that momentum.`
    );
  }

  if (ctx.adaptationMode === 'restore') {
    return (
      `${name}, last week showed some fatigue — that's honest data. ` +
      `This week I've dialled the intensity back: shorter sessions, gentler pacing, more mobility work. ` +
      `Recovery is training. Honour it.`
    );
  }

  // maintain
  return (
    `Solid consistency, ${name}. You completed ${ctx.lastCompletions} sessions last week — ` +
    `exactly the right rhythm. This week keeps the same structure with fresh exercise variety ` +
    `to prevent adaptation plateau. Same energy, new stimulus.`
  );
}

/** Brief note on HOW adaptation was applied. */
function buildAdaptationNote(ctx: PlanContext): string {
  if (ctx.isFirstWeek) return 'Plan calibrated from quiz profile. No prior data yet.';
  if (ctx.adaptationMode === 'push')
    return `+1 block complexity vs last week. Energy avg: ${ctx.lastAvgEnergy.toFixed(1)}/5.`;
  if (ctx.adaptationMode === 'restore')
    return `Intensity reduced. Last week: ${ctx.lastCompletions}/${ctx.sessionsCount} sessions completed.`;
  return `Variety rotated. ${ctx.lastCompletions}/${ctx.sessionsCount} sessions completed last week.`;
}

// ─── Plan Selection Algorithm ─────────────────────────────────────────────────

/**
 * Selects `count` workouts from the scored library for this week.
 * Rules:
 * 1. No duplicate workouts from last week (if we have that data)
 * 2. Distribute across energy levels for variety (low / moderate / high)
 * 3. Respect joint sensitivities and equipment always
 * 4. On 'restore' mode — prefer low/restorative energy
 * 5. On 'push' mode — include at least one moderate/high energy
 */
function selectWeeklyWorkouts(
  scoredWorkouts: Workout[],
  count: number,
  adaptationMode: 'push' | 'maintain' | 'restore' | 'debut',
  lastWeekSlugs: string[] = []
): Workout[] {
  // Filter out last-week's exact workouts to prevent repetition
  const fresh = scoredWorkouts.filter((w) => !lastWeekSlugs.includes(w.slug));
  const pool = fresh.length >= count ? fresh : scoredWorkouts; // fall back if library too small

  if (adaptationMode === 'restore') {
    // Prefer low/restorative energy
    const lowFirst = [
      ...pool.filter((w) => w.energy_level === 'low'),
      ...pool.filter((w) => w.energy_level === 'moderate'),
      ...pool.filter((w) => w.energy_level === 'high'),
    ];
    return lowFirst.slice(0, count);
  }

  if (adaptationMode === 'push') {
    // Must include at least one high-energy if available
    const highEnergy = pool.filter((w) => w.energy_level === 'high');
    const rest = pool.filter((w) => w.energy_level !== 'high');
    const selected: Workout[] = [];
    if (highEnergy.length > 0) selected.push(highEnergy[0]);
    for (const w of rest) {
      if (selected.length >= count) break;
      if (!selected.find((s) => s.slug === w.slug)) selected.push(w);
    }
    return selected.slice(0, count);
  }

  // debut / maintain — take top scored variety
  const selected: Workout[] = [];
  const energyCounts: Record<string, number> = { low: 0, moderate: 0, high: 0 };

  for (const w of pool) {
    if (selected.length >= count) break;
    // Limit same energy level to avoid monotony
    if (energyCounts[w.energy_level] >= Math.ceil(count / 2)) continue;
    selected.push(w);
    energyCounts[w.energy_level]++;
  }

  // Fill any remaining slots if strict variety wasn't possible
  if (selected.length < count) {
    for (const w of pool) {
      if (selected.length >= count) break;
      if (!selected.find((s) => s.slug === w.slug)) {
        selected.push(w);
      }
    }
  }

  return selected.slice(0, count);
}

// ─── Cache key ────────────────────────────────────────────────────────────────
const LOCAL_PLAN_CACHE_KEY = '@fortywell_weekly_plan_v1';

function planCacheKey(userId?: string | null) {
  return userId ? `${LOCAL_PLAN_CACHE_KEY}_${userId}` : LOCAL_PLAN_CACHE_KEY;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useWeeklyPlan(
  allWorkouts: Workout[],
  answers?: OnboardingAnswers | null,
  firstName?: string
): UseWeeklyPlanResult {
  const [plan, setPlan] = useState<WeeklyPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const generateAndSavePlan = useCallback(
    async (force = false): Promise<void> => {
      if (!allWorkouts || allWorkouts.length === 0) {
        if (isMountedRef.current) setLoading(false);
        return;
      }

      const currentWeekKey = getISOWeekKey();

      // ── 0. Resolve user ID ─────────────────────────────────────────────────
      let userId: string | null = null;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        userId = user?.id || null;
      } catch (_) {}

      // ── 1. Check local cache first (user-scoped) ───────────────────────────
      if (!force) {
        try {
          const cached = await AsyncStorage.getItem(planCacheKey(userId));
          if (cached) {
            const parsed: WeeklyPlan = JSON.parse(cached);
            if (parsed.weekKey === currentWeekKey) {
              // Rehydrate workout objects (cache stores slugs only)
              const rehydrated = parsed.workouts
                .map((pw: any) => allWorkouts.find((w) => w.slug === pw.slug) || pw)
                .filter(Boolean);
              if (rehydrated.length > 0) {
                if (isMountedRef.current) {
                  setPlan({ ...parsed, workouts: rehydrated });
                  setLoading(false);
                }
                return;
              }
            }
          }
        } catch (_) {}
      }

      // ── 2. Try Supabase for existing plan ─────────────────────────────────
      if (userId) {
        try {
          const { data: existingPlan } = await supabase
            .from('adaptive_weekly_plans')
            .select('*')
            .eq('user_id', userId)
            .eq('week_key', currentWeekKey)
            .maybeSingle();

          // Check if this existing plan was incorrectly saved with fatigue message for a brand new user
          const hasBogusFatigue = existingPlan?.coach_message?.includes('some fatigue') && (!existingPlan?.last_week_completions || existingPlan?.last_week_completions === 0);

          if (existingPlan && !force && !hasBogusFatigue) {
            const slugs: string[] = existingPlan.workout_slugs || [];
            const workouts = slugs
              .map((slug: string) => allWorkouts.find((w) => w.slug === slug))
              .filter(Boolean) as Workout[];

            if (workouts.length > 0) {
              const rehydrated: WeeklyPlan = {
                weekKey: existingPlan.week_key,
                weekLabel: getWeekLabel(existingPlan.week_key),
                sessionsCount: existingPlan.sessions_count,
                workouts,
                coachMessage: existingPlan.coach_message || '',
                adaptationNotes: existingPlan.adaptation_notes || '',
                lastWeekCompletions: existingPlan.last_week_completions || 0,
                isFirstWeek: existingPlan.last_week_completions === 0,
                generatedAt: existingPlan.generated_at,
              };
              if (isMountedRef.current) {
                setPlan(rehydrated);
                setLoading(false);
              }
              // Update local cache
              try {
                await AsyncStorage.setItem(planCacheKey(userId), JSON.stringify(rehydrated));
              } catch (_) {}
              return;
            }
          }
        } catch (_) {}
      }

      // ── 3. Generate a new plan ─────────────────────────────────────────────

      // 3a. Fetch last week's performance from Supabase
      const lastWeekKey = getISOWeekKey(
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      );
      let lastWeekCompletions = 0;
      let lastAvgEnergy = 3;
      let lastAvgMood = 3;
      let lastWeekSlugs: string[] = [];
      let hasPriorWeekPlan = false;
      let hasAnyPriorCompletedLogs = false;

      if (userId) {
        try {
          // Check if the user has EVER completed any workouts in the past
          const { data: allLogs } = await supabase
            .from('workout_logs')
            .select('id')
            .eq('user_id', userId)
            .eq('status', 'completed')
            .limit(5);

          if (allLogs && allLogs.length > 0) {
            hasAnyPriorCompletedLogs = true;
          }

          // Completed workout logs from last 7–14 days
          const lastWeekStart = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
          const lastWeekEnd = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          const { data: logs } = await supabase
            .from('workout_logs')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'completed')
            .gte('date', toDateStr(lastWeekStart))
            .lte('date', toDateStr(lastWeekEnd));

          if (logs && logs.length > 0) {
            lastWeekCompletions = logs.length;
            lastWeekSlugs = logs
              .map((l: any) => l.workout_slug || '')
              .filter(Boolean);
          }

          // Feeling check-ins from last 7 days
          const { data: checkins } = await supabase
            .from('feeling_checkins')
            .select('mood, energy')
            .eq('user_id', userId)
            .gte('date', toDateStr(lastWeekStart));

          if (checkins && checkins.length > 0) {
            lastAvgEnergy =
              checkins.reduce((s: number, c: any) => s + (c.energy || 3), 0) /
              checkins.length;
            lastAvgMood =
              checkins.reduce((s: number, c: any) => s + (c.mood || 3), 0) /
              checkins.length;
          }

          // Previous week's plan slugs (to avoid repetition)
          const { data: lastPlan } = await supabase
            .from('adaptive_weekly_plans')
            .select('workout_slugs')
            .eq('user_id', userId)
            .eq('week_key', lastWeekKey)
            .maybeSingle();

          if (lastPlan) {
            hasPriorWeekPlan = true;
            if (lastPlan.workout_slugs) {
              lastWeekSlugs = [...lastWeekSlugs, ...lastPlan.workout_slugs];
            }
          }
        } catch (_) {}
      }

      // 3b. Determine adaptation mode
      const sessionsCount = parseSessionTarget(answers?.weekly_frequency);
      // If there are no prior logs or prior plans, this is Debut / First Week
      const isFirstWeek = !hasPriorWeekPlan && !hasAnyPriorCompletedLogs && lastWeekCompletions === 0;

      let adaptationMode: 'push' | 'maintain' | 'restore' | 'debut' = 'debut';
      if (!isFirstWeek) {
        const completionRate = sessionsCount > 0 ? lastWeekCompletions / sessionsCount : 0;
        const isLowEnergy = lastAvgEnergy < 2.5;
        const isLowMood = lastAvgMood < 2.5;

        if (completionRate >= 1.0 && !isLowEnergy) {
          adaptationMode = 'push';
        } else if (isLowEnergy || isLowMood || completionRate < 0.4) {
          adaptationMode = 'restore';
        } else {
          adaptationMode = 'maintain';
        }
      }

      // 3c. Score workouts with the recommendation engine
      const { curatedWorkouts } = getPersonalizedRecommendations(allWorkouts, answers);

      // 3d. Select this week's workouts
      const selectedWorkouts = selectWeeklyWorkouts(
        curatedWorkouts,
        sessionsCount,
        adaptationMode,
        lastWeekSlugs
      );

      // 3e. Build coach message
      const primaryFocus =
        answers?.target_focus?.[0] ||
        selectedWorkouts[0]?.target_focus?.[0] ||
        'joint vitality';

      const msgCtx: PlanContext = {
        firstName: firstName || '',
        isFirstWeek,
        lastCompletions: lastWeekCompletions,
        sessionsCount,
        primaryFocus,
        energyBaseline: answers?.energy_baseline || null,
        lastAvgEnergy,
        weekLabel: getWeekLabel(currentWeekKey),
        adaptationMode,
      };

      const coachMessage = buildCoachMessage(msgCtx);
      const adaptationNotes = buildAdaptationNote(msgCtx);
      const weekLabel = getWeekLabel(currentWeekKey);

      const newPlan: WeeklyPlan = {
        weekKey: currentWeekKey,
        weekLabel,
        sessionsCount,
        workouts: selectedWorkouts,
        coachMessage,
        adaptationNotes,
        lastWeekCompletions,
        isFirstWeek,
        generatedAt: new Date().toISOString(),
      };

      // ── 4. Persist ─────────────────────────────────────────────────────────
      if (userId) {
        try {
          await supabase.from('adaptive_weekly_plans').upsert(
            {
              user_id: userId,
              week_key: currentWeekKey,
              sessions_count: sessionsCount,
              workout_slugs: selectedWorkouts.map((w) => w.slug),
              coach_message: coachMessage,
              adaptation_notes: adaptationNotes,
              last_week_completions: lastWeekCompletions,
              last_week_avg_energy: lastAvgEnergy,
              last_week_avg_mood: lastAvgMood,
              generated_at: newPlan.generatedAt,
            },
            { onConflict: 'user_id,week_key' }
          );
        } catch (_) {}
      }

      try {
        await AsyncStorage.setItem(LOCAL_PLAN_CACHE_KEY, JSON.stringify(newPlan));
      } catch (_) {}

      if (isMountedRef.current) {
        setPlan(newPlan);
        setLoading(false);
      }
    },
    [allWorkouts, answers, firstName]
  );

  // Run on mount and whenever the workout library or answers change
  useEffect(() => {
    if (allWorkouts && allWorkouts.length > 0) {
      setLoading(true);
      generateAndSavePlan();
    }
  }, [generateAndSavePlan]);

  return {
    plan,
    loading,
    refresh: () => generateAndSavePlan(true),
  };
}

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DayRhythmSummary,
  WeeklyThemePlan,
  ResetTimingPreference,
  CycleTrackingData,
  ResetSlot,
  SlotStatus,
  CyclePhase,
  NightActivityType,
  NightSessionActivityLog,
  DaySlotInfo,
} from '../types/rhythm';

const STORAGE_KEY_COMPLETED_DATES = '@fortywell_completed_dates_v1';

async function persistCompletedDate(dateStr: string) {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_COMPLETED_DATES);
    const existing: string[] = raw ? JSON.parse(raw) : [];
    if (!existing.includes(dateStr)) {
      existing.push(dateStr);
      await AsyncStorage.setItem(STORAGE_KEY_COMPLETED_DATES, JSON.stringify(existing));
    }
  } catch (_) {}
}

export const NIGHT_ACTIVITIES = [
  {
    type: 'walk' as NightActivityType,
    label: 'Short Walk',
    sublabel: 'Gentle post-dinner stroll to support digestion & calm cortisol',
    iconName: 'Footprints',
    suggestedDuration: '~20 min',
  },
  {
    type: 'reading' as NightActivityType,
    label: 'Mindful Reading',
    sublabel: 'Immersive screen-free wind-down to signal sleep onset',
    iconName: 'BookOpen',
    suggestedDuration: '~20 min',
  },
  {
    type: 'hobby' as NightActivityType,
    label: 'Hobby & Creative Flow',
    sublabel: 'Low-arousal creative craft, journaling, or tactile focus',
    iconName: 'Palette',
    suggestedDuration: '~20 min',
  },
  {
    type: 'stretch' as NightActivityType,
    label: 'Evening Stretch & Mobility',
    sublabel: 'Spine & hip decompression with restorative diaphragmatic breathing',
    iconName: 'Flower2',
    suggestedDuration: '~20 min',
  },
  {
    type: 'custom' as NightActivityType,
    label: 'Type Your Own',
    sublabel: 'Personalized wind-down (e.g. herbal tea, breathwork, journaling)',
    iconName: 'Sparkles',
    suggestedDuration: '~20 min',
  },
];

const DEFAULT_TIMING_PREFS: ResetTimingPreference[] = [
  {
    slot: 'morning',
    label: 'Morning Session',
    sublabel: 'Joint fluidity & nervous system calibration',
    reminderTime: '7:00 AM',
    reminderEnabled: true,
  },
  {
    slot: 'main',
    label: 'Main Session',
    sublabel: 'Core strength & functional movement',
    reminderTime: '12:30 PM',
    reminderEnabled: true,
  },
  {
    slot: 'night',
    label: 'Night Time Session',
    sublabel: 'Flexible restorative wind-down • ~20 min suggested',
    reminderTime: '8:30 PM',
    reminderEnabled: true,
    isOptional: true,
  },
];

const DEFAULT_WEEKLY_THEME: WeeklyThemePlan = {
  themeTitle: 'Lymphatic Flow',
  themeSubtitle: 'Gentle circulation & joint ease',
  weekNumber: 2,
  totalWeeks: 4,
  focusAreas: ['Spine Decompression', 'Pelvic Stability', 'Breathwork'],
};

// Calculate Monday-Sunday dates for the current week
function getCurrentWeekDates(): {
  date: Date;
  dateStr: string;
  dayLabel: string;
  fullDayName: string;
  isToday: boolean;
  isPast: boolean;
}[] {
  const now = new Date();
  const currentDay = now.getDay(); // 0 is Sunday, 1 is Monday...
  const distToMonday = currentDay === 0 ? -6 : 1 - currentDay;

  const monday = new Date(now);
  monday.setDate(now.getDate() + distToMonday);

  const dayLabels = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  const fullNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const week = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')}`;
    const isToday = d.toDateString() === now.toDateString();
    const isPast = d < now && !isToday;

    week.push({
      date: d,
      dateStr,
      dayLabel: dayLabels[i],
      fullDayName: fullNames[i],
      isToday,
      isPast,
    });
  }
  return week;
}

function calculatePhaseDetails(
  cycleStartDateStr?: string,
  cycleLengthDays = 28
): {
  phase: CyclePhase;
  dayNumber: number;
  headline: string;
  body: string;
} {
  if (!cycleStartDateStr) {
    return {
      phase: 'Follicular Phase',
      dayNumber: 6,
      headline: 'Energy building — good window for strength work this week.',
      body: 'Rising estrogen supports muscle protein synthesis and recovery. Optimal for intentional, progressive movement.',
    };
  }

  const start = new Date(cycleStartDateStr);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - start.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const currentCycleDay = (diffDays % cycleLengthDays) + 1;

  if (currentCycleDay <= 5) {
    return {
      phase: 'Menstrual Phase',
      dayNumber: currentCycleDay,
      headline: 'Gentle restoration — prioritize joint mobility and ease.',
      body: 'Progesterone and estrogen are low. Keep movement low-intensity to honor your body’s natural renewal process.',
    };
  } else if (currentCycleDay <= 13) {
    return {
      phase: 'Follicular Phase',
      dayNumber: currentCycleDay,
      headline: 'Energy building — good window for strength work this week.',
      body: 'Rising estrogen supports muscle protein synthesis and recovery. Optimal for intentional, progressive movement.',
    };
  } else if (currentCycleDay <= 17) {
    return {
      phase: 'Ovulatory Phase',
      dayNumber: currentCycleDay,
      headline: 'Peak stamina — great time for purposeful cadence and core tone.',
      body: 'Estrogen and testosterone peak. Your joints appreciate clear alignment and purposeful pacing.',
    };
  } else {
    return {
      phase: 'Luteal Phase',
      dayNumber: currentCycleDay,
      headline: 'Steady pacing — emphasize nervous system downshift.',
      body: 'Progesterone rises, increasing core temperature. Decompressing the spine and hips supports steady energy.',
    };
  }
}

export function useRhythmData(answers?: any) {
  const [timingPreferences, setTimingPreferences] = useState<ResetTimingPreference[]>(DEFAULT_TIMING_PREFS);
  const [weeklyTheme, setWeeklyTheme] = useState<WeeklyThemePlan>(DEFAULT_WEEKLY_THEME);
  const [cycleData, setCycleData] = useState<CycleTrackingData>({
    optedIn: false,
    cycleStartDate: undefined,
    cycleLengthDays: 28,
    currentPhase: undefined,
    cycleDay: undefined,
    guidanceHeadline: 'Add your cycle or hormonal stage to unlock adaptive pacing and recovery windows.',
    guidanceBody:
      'Completely optional. When enabled, your movement pace and recovery recommendations adapt naturally to your hormonal rhythm.',
  });

  const [nightLogsByDate, setNightLogsByDate] = useState<Record<string, NightSessionActivityLog>>({});
  const [slotMetadataByDate, setSlotMetadataByDate] = useState<
    Record<string, Record<ResetSlot, Partial<DaySlotInfo>>>
  >({});
  const [restDaysByDate, setRestDaysByDate] = useState<Record<string, boolean>>({});

  // Real initial completion states — all days start as 'planned' (0 fake completions)
  const [completedSlotsByDate, setCompletedSlotsByDate] = useState<Record<string, Record<ResetSlot, SlotStatus>>>(() => {
    const weekDays = getCurrentWeekDates();
    const map: Record<string, Record<ResetSlot, SlotStatus>> = {};

    weekDays.forEach((w) => {
      map[w.dateStr] = {
        morning: 'planned',
        main: 'planned',
        night: 'planned',
      };
    });

    return map;
  });

  // Fetch Supabase data
  useEffect(() => {
    async function loadData() {
      try {
        // 1. Weekly Plan
        const { data: planData } = await supabase
          .from('weekly_plans')
          .select('*')
          .eq('is_active', true)
          .limit(1)
          .maybeSingle();

        if (planData) {
          setWeeklyTheme({
            id: planData.id,
            themeTitle: planData.theme_title,
            themeSubtitle: planData.theme_subtitle,
            weekNumber: planData.week_number,
            totalWeeks: planData.total_weeks,
            focusAreas: planData.focus_areas,
          });
        }

        // 2. Timing Preferences
        const { data: prefData } = await supabase
          .from('reset_timing_preferences')
          .select('*');

        if (prefData && prefData.length > 0) {
          setTimingPreferences((prev) =>
            prev.map((item) => {
              const matched = prefData.find((p: any) => p.slot === item.slot);
              if (matched) {
                return {
                  ...item,
                  reminderTime: matched.reminder_time,
                  reminderEnabled: matched.reminder_enabled,
                };
              }
              return item;
            })
          );
        }

        // 3. Cycle Tracking
        const { data: cycleRow } = await supabase
          .from('cycle_tracking')
          .select('*')
          .limit(1)
          .maybeSingle();

        if (cycleRow) {
          const phaseInfo = calculatePhaseDetails(cycleRow.cycle_start_date, cycleRow.cycle_length_days);
          setCycleData({
            optedIn: cycleRow.opted_in,
            cycleStartDate: cycleRow.cycle_start_date,
            cycleLengthDays: cycleRow.cycle_length_days,
            currentPhase: phaseInfo.phase,
            cycleDay: phaseInfo.dayNumber,
            guidanceHeadline: phaseInfo.headline,
            guidanceBody: phaseInfo.body,
          });
        }

        // 4. Workout Logs
        const { data: logs } = await supabase
          .from('workout_logs')
          .select('*');

        if (logs && logs.length > 0) {
          setCompletedSlotsByDate((prev) => {
            const next = { ...prev };
            logs.forEach((log: any) => {
              const slotKey = (log.session_slot || log.slot) as ResetSlot;
              if (slotKey === 'morning' || slotKey === 'main' || slotKey === 'night') {
                if (!next[log.date]) {
                  next[log.date] = { morning: 'planned', main: 'planned', night: 'planned' };
                }
                next[log.date][slotKey] = log.status;
              }
            });
            return next;
          });
        }

        // 5. Night Session Activity Logs
        const { data: nightLogs } = await supabase
          .from('night_session_activity_log')
          .select('*');

        if (nightLogs && nightLogs.length > 0) {
          const nMap: Record<string, NightSessionActivityLog> = {};
          nightLogs.forEach((nl: any) => {
            nMap[nl.date] = {
              id: nl.id,
              date: nl.date,
              activityType: nl.activity_type,
              customActivityTitle: nl.notes || undefined,
              durationMinutes: nl.duration_minutes,
              notes: nl.notes,
            };
          });
          setNightLogsByDate(nMap);
        }
      } catch (_) {}
    }

    loadData();
  }, []);

  // Generate personalized "Why This Today" micro-explanation
  const getWhyThisTodayExplanation = useCallback((dateStr: string, isPast: boolean) => {
    const focusTheme = weeklyTheme?.themeTitle || 'Lymphatic Flow';
    const phase = cycleData.currentPhase || 'Follicular Phase';

    if (phase === 'Follicular Phase') {
      return `Chosen for your ${focusTheme} focus & rising estrogen window — ideal for joint-friendly strength & lean muscle stimulus.`;
    } else if (phase === 'Ovulatory Phase') {
      return `Calibrated for peak stamina & dynamic core bracing during your high-vitality window.`;
    } else if (phase === 'Luteal Phase') {
      return `Prioritizes spine decompression & steady pacing to respect your progesterone downshift.`;
    } else if (phase === 'Menstrual Phase') {
      return `Low-impact restorative flow designed for pelvic ease and nervous system replenishment.`;
    }
    return `Programmed to support balanced full-body joint vitality, posture alignment & bone density.`;
  }, [cycleData.currentPhase, weeklyTheme?.themeTitle]);

  // Construct 7-day view
  const weekDays: DayRhythmSummary[] = useMemo(() => {
    const rawDays = getCurrentWeekDates();
    return rawDays.map((d) => {
      const isRestDay = restDaysByDate[d.dateStr] || false;
      const slotMap = completedSlotsByDate[d.dateStr] || {
        morning: 'planned',
        main: 'planned',
        night: 'planned',
      };

      const morningPref = timingPreferences.find((p) => p.slot === 'morning')?.reminderTime || '7:00 AM';
      const mainPref = timingPreferences.find((p) => p.slot === 'main')?.reminderTime || '12:30 PM';
      const nightPref = timingPreferences.find((p) => p.slot === 'night')?.reminderTime || '8:30 PM';

      const nightLog = nightLogsByDate[d.dateStr];
      const slotMeta = slotMetadataByDate[d.dateStr] || ({} as Record<ResetSlot, Partial<DaySlotInfo>>);

      const mainWorkoutTitle = 'Knee-Safe Core & Glute Ignition';
      const nightActivityType = nightLog?.activityType || 'stretch';
      const nightCustomTitle = nightLog?.customActivityTitle || undefined;

      const slots: Record<ResetSlot, DaySlotInfo> = {
        morning: {
          slot: 'morning',
          label: 'Morning Session',
          descriptor: 'Joint fluidity & nervous system calibration',
          status: isRestDay ? 'rest' : slotMap.morning,
          scheduledTime: morningPref,
          completedAt: slotMap.morning === 'completed' ? '7:15 AM' : undefined,
          workoutTitle: 'Morning Joint Fluidity & Spinal Wake-Up',
          durationMinutes: 12,
          isOptional: false,
          skippedReason: slotMeta.morning?.skippedReason,
          rescheduledTo: slotMeta.morning?.rescheduledTo,
          ...slotMeta.morning,
        },
        main: {
          slot: 'main',
          label: 'Main Session',
          descriptor: 'Strength, functional movement & bone density stimulus',
          status: isRestDay ? 'rest' : slotMap.main,
          scheduledTime: mainPref,
          completedAt: slotMap.main === 'completed' ? '12:45 PM' : undefined,
          workoutTitle: mainWorkoutTitle,
          durationMinutes: 20,
          whyThisToday: getWhyThisTodayExplanation(d.dateStr, d.isPast),
          isOptional: false,
          skippedReason: slotMeta.main?.skippedReason,
          rescheduledTo: slotMeta.main?.rescheduledTo,
          ...slotMeta.main,
        },
        night: {
          slot: 'night',
          label: 'Night Time Session',
          descriptor: 'Flexible restorative wind-down • ~20 min suggested',
          status: isRestDay ? 'rest' : slotMap.night,
          scheduledTime: nightPref,
          completedAt: slotMap.night === 'completed' ? '8:45 PM' : undefined,
          workoutTitle: nightCustomTitle ? `Wind-Down: ${nightCustomTitle}` : undefined,
          durationMinutes: nightLog?.durationMinutes || 20,
          isOptional: true,
          nightActivity: nightActivityType,
          customActivityTitle: nightCustomTitle,
          skippedReason: slotMeta.night?.skippedReason,
          rescheduledTo: slotMeta.night?.rescheduledTo,
          ...slotMeta.night,
        },
      };

      const completedCount = Object.values(slots).filter((s) => s.status === 'completed').length;

      return {
        date: d.dateStr,
        dayLabel: d.dayLabel,
        fullDayName: d.fullDayName,
        dayNumber: d.date.getDate(),
        isToday: d.isToday,
        isPast: d.isPast,
        isRestDay,
        slots,
        completedCount,
      };
    });
  }, [
    completedSlotsByDate,
    getWhyThisTodayExplanation,
    nightLogsByDate,
    restDaysByDate,
    slotMetadataByDate,
    timingPreferences,
  ]);

  // Toggle slot completion status (optimistic + Supabase + local persist)
  const toggleSlotStatus = useCallback(async (dateStr: string, slot: ResetSlot) => {
    let nextStatus: SlotStatus = 'completed';
    setCompletedSlotsByDate((prev) => {
      const currentStatus = prev[dateStr]?.[slot] || 'planned';
      nextStatus = currentStatus === 'completed' ? 'planned' : 'completed';

      return {
        ...prev,
        [dateStr]: {
          ...(prev[dateStr] || { morning: 'planned', main: 'planned', night: 'planned' }),
          [slot]: nextStatus,
        },
      };
    });

    // Persist date locally so Garden updates immediately
    await persistCompletedDate(dateStr);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        await supabase
          .from('workout_logs')
          .upsert(
            {
              user_id: user.id,
              date: dateStr,
              slot,
              session_slot: slot,
              status: nextStatus,
              completed_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,date,slot' }
          );
      }
    } catch (_) {}
  }, []);

  // Complete a confirmed session slot with timestamp
  const completeSessionSlot = useCallback(
    async (
      dateStr: string,
      slot: ResetSlot,
      activityType?: NightActivityType,
      notes?: string,
      customActivityTitle?: string
    ) => {
      setCompletedSlotsByDate((prev) => ({
        ...prev,
        [dateStr]: {
          ...(prev[dateStr] || { morning: 'planned', main: 'planned', night: 'planned' }),
          [slot]: 'completed',
        },
      }));

      // Persist date locally so Garden/Streak updates immediately
      await persistCompletedDate(dateStr);

      if (slot === 'night' && activityType) {
        setNightLogsByDate((prev) => ({
          ...prev,
          [dateStr]: {
            date: dateStr,
            activityType,
            customActivityTitle: customActivityTitle || notes || (activityType === 'custom' ? 'Custom Wind-Down' : undefined),
            durationMinutes: 20,
            notes: notes || customActivityTitle,
          },
        }));

        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user?.id) {
            await supabase
              .from('night_session_activity_log')
              .upsert(
                {
                  user_id: user.id,
                  date: dateStr,
                  activity_type: activityType,
                  duration_minutes: 20,
                  notes: customActivityTitle || notes || null,
                },
                { onConflict: 'user_id,date,activity_type' }
              );
          }
        } catch (_) {}
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          await supabase
            .from('workout_logs')
            .upsert(
              {
                user_id: user.id,
                date: dateStr,
                slot,
                session_slot: slot,
                status: 'completed',
                completed_at: new Date().toISOString(),
              },
              { onConflict: 'user_id,date,slot' }
            );
        }
      } catch (_) {}
    },
    []
  );

  // Log Night Time Activity specifically (with custom input support)
  const logNightActivity = useCallback(
    async (
      dateStr: string,
      activityType: NightActivityType,
      durationMinutes = 20,
      notes?: string,
      customActivityTitle?: string
    ) => {
      await completeSessionSlot(dateStr, 'night', activityType, notes, customActivityTitle);
    },
    [completeSessionSlot]
  );

  // Skip a session slot gracefully (No-guilt restoration)
  const skipSessionSlot = useCallback(
    (dateStr: string, slot: ResetSlot, reason = 'Resting today — Honoring recovery') => {
      setCompletedSlotsByDate((prev) => ({
        ...prev,
        [dateStr]: {
          ...(prev[dateStr] || { morning: 'planned', main: 'planned', night: 'planned' }),
          [slot]: 'skipped',
        },
      }));

      setSlotMetadataByDate((prev) => ({
        ...prev,
        [dateStr]: {
          ...(prev[dateStr] || {}),
          [slot]: {
            status: 'skipped',
            skippedReason: reason,
          },
        },
      }));
    },
    []
  );

  // Reschedule a session slot
  const rescheduleSessionSlot = useCallback(
    (dateStr: string, slot: ResetSlot, newTarget = 'Tomorrow • 12:30 PM') => {
      setCompletedSlotsByDate((prev) => ({
        ...prev,
        [dateStr]: {
          ...(prev[dateStr] || { morning: 'planned', main: 'planned', night: 'planned' }),
          [slot]: 'rescheduled',
        },
      }));

      setSlotMetadataByDate((prev) => ({
        ...prev,
        [dateStr]: {
          ...(prev[dateStr] || {}),
          [slot]: {
            status: 'rescheduled',
            rescheduledTo: newTarget,
          },
        },
      }));
    },
    []
  );

  // Toggle a full Planned Rest Day
  const toggleRestDay = useCallback((dateStr: string, isRest?: boolean) => {
    setRestDaysByDate((prev) => {
      const nextState = isRest !== undefined ? isRest : !prev[dateStr];
      return {
        ...prev,
        [dateStr]: nextState,
      };
    });
  }, []);

  // Update timing preference
  const updateTimingPreference = useCallback(
    async (slot: ResetSlot, reminderTime: string, reminderEnabled: boolean) => {
      setTimingPreferences((prev) =>
        prev.map((item) => (item.slot === slot ? { ...item, reminderTime, reminderEnabled } : item))
      );

      try {
        await supabase
          .from('reset_timing_preferences')
          .upsert(
            {
              slot,
              reminder_time: reminderTime,
              reminder_enabled: reminderEnabled,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,slot' }
          );
      } catch (_) {}
    },
    []
  );

  // Toggle cycle opt-in
  const toggleCycleOptIn = useCallback(
    async (optedIn: boolean, startDate = '2026-08-18') => {
      const phaseInfo = calculatePhaseDetails(startDate, 28);
      setCycleData({
        optedIn,
        cycleStartDate: startDate,
        cycleLengthDays: 28,
        currentPhase: phaseInfo.phase,
        cycleDay: phaseInfo.dayNumber,
        guidanceHeadline: phaseInfo.headline,
        guidanceBody: phaseInfo.body,
      });

      try {
        await supabase
          .from('cycle_tracking')
          .upsert(
            {
              opted_in: optedIn,
              cycle_start_date: startDate,
              cycle_length_days: 28,
              current_phase: phaseInfo.phase,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
          );
      } catch (_) {}
    },
    []
  );

  // Update cycle start date and length (called from CycleSetupSheet)
  const updateCycleStart = useCallback(
    async (startDate: string, cycleLengthDays: number) => {
      const phaseInfo = calculatePhaseDetails(startDate, cycleLengthDays);
      setCycleData({
        optedIn: true,
        cycleStartDate: startDate,
        cycleLengthDays,
        currentPhase: phaseInfo.phase,
        cycleDay: phaseInfo.dayNumber,
        guidanceHeadline: phaseInfo.headline,
        guidanceBody: phaseInfo.body,
      });

      try {
        await supabase
          .from('cycle_tracking')
          .upsert(
            {
              opted_in: true,
              cycle_start_date: startDate,
              cycle_length_days: cycleLengthDays,
              current_phase: phaseInfo.phase,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
          );
      } catch (_) {}
    },
    []
  );

  return {
    weekDays,
    weeklyTheme,
    timingPreferences,
    cycleData,
    nightLogsByDate,
    toggleSlotStatus,
    completeSessionSlot,
    logNightActivity,
    skipSessionSlot,
    rescheduleSessionSlot,
    toggleRestDay,
    updateTimingPreference,
    toggleCycleOptIn,
    updateCycleStart,
  };
}

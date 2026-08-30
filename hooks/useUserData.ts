import { useState, useEffect, useCallback, useMemo } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { OnboardingAnswers } from '../types/onboarding';

const STORAGE_KEY_WALKTHROUGH = '@fortywell_has_seen_walkthrough_v1';
const STORAGE_KEY_COMPLETED_DATES = '@fortywell_completed_dates_v1';

export interface UserProfile {
  id?: string;
  fullName: string;
  greetingName: string;
  monogram: string;
  email?: string;
  targetFocus: string[];
  jointSensitivities: string[];
  energyBaseline?: string | null;
  timeCommitment?: string | null;
  weeklyFrequency?: string;
  hasSeenWalkthrough?: boolean;
  createdAt?: string | null;
  isEmailVerified?: boolean;
  subscriptionStatus?: string | null;
  subscriptionEndsAt?: string | null;
}

export interface LifetimeStats {
  totalWorkouts: number;
  totalVolumeKg: number;
  currentStreak: number;
  totalTimeHours: number;
}

export interface WeekDayProgress {
  dayLabel: string; // 'MON', 'TUE', etc.
  fullDayName: string; // 'Monday', 'Tuesday', etc.
  dayNum: string; // '21', '22', etc.
  dateStr: string; // 'YYYY-MM-DD'
  isToday: boolean;
  isCompleted: boolean;
  isPast: boolean;
}

export interface FeelingCheckinRecord {
  id?: string;
  date: string;
  mood: number;
  energy: number;
  notes?: string;
}

export interface TopExerciseItem {
  name: string;
  sets: number;
  muscle: string;
  tag: string;
}

export interface GardenProgress {
  currentLevel: number;
  daysCompletedInLevel: number;
  daysRequiredInLevel: number;
  daysToNextLevel: number;
  totalActiveDays: number;
  levelName: string;
  levelDesc: string;
  hasEnoughDataForTrends: boolean;
  vitalityTrends: {
    months: string[];
    consistency: number[];
    mobility: number[];
    fluidity: number[];
  };
}

const GARDEN_LEVEL_METAS = [
  { level: 1, name: 'Meadow Dawn', desc: 'Fresh green meadow & serene lotus pond' },
  { level: 2, name: 'Wildflower Bloom', desc: 'Gentle blooming daisies and sweet buttercups' },
  { level: 3, name: 'Sunlit Canopy', desc: 'Golden afternoon rays through lush trees' },
  { level: 4, name: 'Luminous Flora', desc: 'Evening warmth with bioluminescent petals' },
  { level: 5, name: 'Ethereal Haven', desc: 'Vibrant rainbow canopy & dancing starlight' },
  { level: 6, name: 'Celestial Sanctuary', desc: 'Full cosmic bloom of eternal joint vitality' },
];

function getISODateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// In-memory module cache to eliminate redundant Supabase round-trips
let cachedUserProfile: UserProfile | null = null;
let cachedLifetimeStats: LifetimeStats | null = null;
let cachedCompletedDatesSet: Set<string> | null = null;
let cachedFeelingCheckins: FeelingCheckinRecord[] | null = null;
let lastUserDataFetchTime = 0;
let pendingFetchPromise: Promise<void> | null = null;
const CACHE_TTL_MS = 60000; // 60 seconds

export function useUserData(answers?: OnboardingAnswers | null) {
  const [loading, setLoading] = useState(!cachedUserProfile);
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    if (cachedUserProfile) return cachedUserProfile;
    return {
      fullName: '',
      greetingName: 'Welcome',
      monogram: 'W',
      targetFocus: answers?.target_focus || [],
      jointSensitivities: answers?.joint_sensitivities || [],
      energyBaseline: answers?.energy_baseline,
      timeCommitment: answers?.time_commitment,
      weeklyFrequency: answers?.weekly_frequency || '3–4 days',
      hasSeenWalkthrough: true, // Default to true on initial render to prevent unexpected popup flashes
    };
  });

  const [lifetimeStats, setLifetimeStats] = useState<LifetimeStats>(() => {
    return cachedLifetimeStats || {
      totalWorkouts: 0,
      totalVolumeKg: 0,
      currentStreak: 0,
      totalTimeHours: 0,
    };
  });

  const [completedDatesSet, setCompletedDatesSet] = useState<Set<string>>(() => {
    return cachedCompletedDatesSet || new Set();
  });
  const [feelingCheckins, setFeelingCheckins] = useState<FeelingCheckinRecord[]>(() => {
    return cachedFeelingCheckins || [];
  });
  const [topExercises, setTopExercises] = useState<TopExerciseItem[]>([
    { name: 'Cat-Cow Segmental Mobility', sets: 24, muscle: 'Spine & Lumbar', tag: 'Mobility' },
    { name: 'Iso-Hold Glute Bridge with Heel Drive', sets: 32, muscle: 'Glutes & Pelvic', tag: 'Strength' },
    { name: 'Deadbug with Opposite Arm/Leg Reach', sets: 28, muscle: 'Deep Core', tag: 'Stability' },
    { name: 'Dumbbell Romanian Deadlift', sets: 18, muscle: 'Hamstrings', tag: 'Posterior' },
  ]);

  // Fetch Supabase data for the current user (with deduplication & cache)
  const loadUserData = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && cachedUserProfile && now - lastUserDataFetchTime < CACHE_TTL_MS) {
      setLoading(false);
      return;
    }

    if (pendingFetchPromise) {
      await pendingFetchPromise;
      if (cachedUserProfile) {
        setUserProfile(cachedUserProfile);
        if (cachedLifetimeStats) setLifetimeStats(cachedLifetimeStats);
        if (cachedCompletedDatesSet) setCompletedDatesSet(cachedCompletedDatesSet);
        if (cachedFeelingCheckins) setFeelingCheckins(cachedFeelingCheckins);
        setLoading(false);
      }
      return;
    }

    pendingFetchPromise = (async () => {
      try {
        setLoading(true);

        // 1. Get current auth user
        const { data: { user } } = await supabase.auth.getUser();

        let profileData: any = null;
        if (user?.id) {
          const { data: pData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();
          profileData = pData;
        }

        // Profile details
        let name = '';
        if (profileData?.first_name) {
          name = profileData.first_name;
        } else if (user?.user_metadata?.full_name) {
          name = user.user_metadata.full_name;
        } else if (user?.email) {
          name = user.email.split('@')[0];
        }

        const firstName = name.split(' ')[0] || '';
        const greeting = firstName ? `Hi, ${firstName}` : 'Welcome';
        const mono = firstName ? firstName.charAt(0).toUpperCase() : 'W';

        // Check persistent local AsyncStorage & localStorage for walkthrough completion
        let localHasSeenWalkthrough = false;
        try {
          const storedVal = await AsyncStorage.getItem(STORAGE_KEY_WALKTHROUGH);
          const userKeyVal = user?.id ? await AsyncStorage.getItem(`@fortywell_walkthrough_${user.id}`) : null;
          if (storedVal === 'true' || userKeyVal === 'true') {
            localHasSeenWalkthrough = true;
          } else if (typeof window !== 'undefined' && window.localStorage) {
            const lsVal = window.localStorage.getItem(STORAGE_KEY_WALKTHROUGH);
            const lsUserVal = user?.id ? window.localStorage.getItem(`@fortywell_walkthrough_${user.id}`) : null;
            if (lsVal === 'true' || lsUserVal === 'true') {
              localHasSeenWalkthrough = true;
            }
          }
        } catch (_) {}

        const hasSeen = localHasSeenWalkthrough || Boolean(profileData?.has_seen_walkthrough);

        const newProfile: UserProfile = {
          id: user?.id,
          fullName: name,
          greetingName: greeting,
          monogram: mono,
          email: user?.email,
          targetFocus: answers?.target_focus || profileData?.target_focus || [],
          jointSensitivities: answers?.joint_sensitivities || profileData?.joint_sensitivities || [],
          energyBaseline: answers?.energy_baseline || profileData?.energy_baseline || null,
          timeCommitment: answers?.time_commitment || profileData?.time_commitment || null,
          weeklyFrequency: answers?.weekly_frequency || profileData?.weekly_frequency || '3–4 days',
          hasSeenWalkthrough: hasSeen,
          createdAt: profileData?.created_at || user?.created_at || null,
          isEmailVerified: Boolean(user?.email_confirmed_at || profileData?.is_email_verified),
          subscriptionStatus: profileData?.subscription_status || 'free_trial',
          subscriptionEndsAt: profileData?.subscription_ends_at || null,
        };

        cachedUserProfile = newProfile;
        setUserProfile(newProfile);

      // 2. Fetch completed workout logs (from Supabase + Local AsyncStorage cache)
      const completedDates = new Set<string>();
      let totalMinutes = 0;
      let totalVolume = 0;
      let totalWorkoutsCount = 0;

      // Load local cached completed dates first
      try {
        const localDatesJson = await AsyncStorage.getItem(STORAGE_KEY_COMPLETED_DATES);
        if (localDatesJson) {
          const parsed = JSON.parse(localDatesJson);
          if (Array.isArray(parsed)) {
            parsed.forEach((d: string) => {
              if (d && typeof d === 'string') completedDates.add(d);
            });
          }
        }
      } catch (_) {}

      // Load pending logs from useOfflineSync
      try {
        const pendingJson = await AsyncStorage.getItem('@fortywell_pending_workout_logs');
        if (pendingJson) {
          const pendingLogs = JSON.parse(pendingJson);
          if (Array.isArray(pendingLogs)) {
            pendingLogs.forEach((p: any) => {
              if (p.date) completedDates.add(p.date);
              totalMinutes += Math.round(Number(p.durationSeconds || 1200) / 60);
              totalVolume += Number(p.volumeKg || 0);
              totalWorkoutsCount += 1;
            });
          }
        }
      } catch (_) {}

      // Load Supabase logs
      const exerciseCounts = new Map<string, number>();
      try {
        const { data: logs } = await supabase
          .from('workout_logs')
          .select('*')
          .eq('status', 'completed');

        if (logs && logs.length > 0) {
          logs.forEach((l: any) => {
            if (l.date) {
              completedDates.add(l.date);
            }
            totalMinutes += Number(l.duration_minutes || 20);
            totalVolume += Number(l.volume_kg || 0);
            totalWorkoutsCount += 1;

            if (l.exercises_json) {
              try {
                const parsed = typeof l.exercises_json === 'string' ? JSON.parse(l.exercises_json) : l.exercises_json;
                if (Array.isArray(parsed)) {
                  parsed.forEach((ex: any) => {
                    if (ex.name) {
                      const doneSets = Array.isArray(ex.sets)
                        ? ex.sets.filter((s: any) => s.completed).length || ex.sets.length
                        : 3;
                      exerciseCounts.set(ex.name, (exerciseCounts.get(ex.name) || 0) + doneSets);
                    }
                  });
                }
              } catch (_) {}
            }
          });
        }
      } catch (_) {}

      if (exerciseCounts.size > 0) {
        const topList: TopExerciseItem[] = Array.from(exerciseCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name, sets]) => ({
            name,
            sets,
            muscle: 'Functional Chains',
            tag: 'Core & Mobility',
          }));
        setTopExercises(topList);
      }

      // Cache merged dates to local storage
      try {
        await AsyncStorage.setItem(
          STORAGE_KEY_COMPLETED_DATES,
          JSON.stringify(Array.from(completedDates))
        );
      } catch (_) {}

      setCompletedDatesSet(new Set(completedDates));

      // 3. Compute Streak
      let streak = 0;
      const today = new Date();
      const todayStr = getISODateStr(today);
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const yesterdayStr = getISODateStr(yesterday);

      // Streak starts if completed today or yesterday
      let checkDate = new Date(today);
      if (!completedDates.has(todayStr) && completedDates.has(yesterdayStr)) {
        checkDate = yesterday;
      }

      if (completedDates.has(getISODateStr(checkDate))) {
        while (completedDates.has(getISODateStr(checkDate))) {
          streak += 1;
          checkDate.setDate(checkDate.getDate() - 1);
        }
      }

      const newStats: LifetimeStats = {
        totalWorkouts: Math.max(totalWorkoutsCount, completedDates.size),
        totalVolumeKg: totalVolume,
        currentStreak: streak,
        totalTimeHours: Number((totalMinutes / 60).toFixed(1)),
      };

      cachedLifetimeStats = newStats;
      setLifetimeStats(newStats);

      // 4. Fetch feeling check-ins
      try {
        const { data: checkinRows } = await supabase
          .from('feeling_checkins')
          .select('*')
          .order('date', { ascending: true });

        if (checkinRows && checkinRows.length > 0) {
          const parsedFeelings = checkinRows.map((r: any) => ({
            id: r.id,
            date: r.date,
            mood: r.mood,
            energy: r.energy,
            notes: r.notes,
          }));
          cachedFeelingCheckins = parsedFeelings;
          setFeelingCheckins(parsedFeelings);
        } else {
          cachedFeelingCheckins = [];
          setFeelingCheckins([]);
        }
      } catch (_) {
        cachedFeelingCheckins = [];
        setFeelingCheckins([]);
      }
      lastUserDataFetchTime = Date.now();
    } catch (_) {
      // Graceful fallback
    } finally {
      pendingFetchPromise = null;
      setLoading(false);
    }
  })();

  await pendingFetchPromise;
}, []);

  useEffect(() => {
    loadUserData();

    // 1. AppState listener: immediately refresh when user returns from mobile browser checkout
    const appStateSub = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        loadUserData(true);
      }
    });

    // 2. Supabase Realtime channel: instant update when Lemon Squeezy webhook writes to profiles table
    let channel: any = null;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          channel = supabase
            .channel(`public:profiles:${user.id}`)
            .on(
              'postgres_changes',
              {
                event: 'UPDATE',
                schema: 'public',
                table: 'profiles',
                filter: `id=eq.${user.id}`,
              },
              (payload) => {
                const updated = payload.new as any;
                if (updated) {
                  setUserProfile((prev) => ({
                    ...prev,
                    subscriptionStatus: updated.subscription_status || prev.subscriptionStatus,
                    subscriptionEndsAt: updated.subscription_ends_at || prev.subscriptionEndsAt,
                  }));
                  if (cachedUserProfile) {
                    cachedUserProfile.subscriptionStatus = updated.subscription_status || cachedUserProfile.subscriptionStatus;
                    cachedUserProfile.subscriptionEndsAt = updated.subscription_ends_at || cachedUserProfile.subscriptionEndsAt;
                  }
                }
              }
            )
            .subscribe();
        }
      } catch (_) {}
    })();

    return () => {
      appStateSub.remove();
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [loadUserData]);

  // Log feeling check-in to Supabase
  const logFeeling = useCallback(
    async (mood: number, energy: number, notes?: string) => {
      const today = getISODateStr(new Date());
      const newEntry: FeelingCheckinRecord = {
        date: today,
        mood,
        energy,
        notes,
      };

      setFeelingCheckins((prev) => [
        ...prev.filter((c) => c.date !== today),
        newEntry,
      ]);

      try {
        await supabase.from('feeling_checkins').upsert(
          {
            date: today,
            mood,
            energy,
            notes,
            created_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,date' }
        );
      } catch (_) {}
    },
    []
  );

  const markWalkthroughCompleted = useCallback(async () => {
    setUserProfile((prev) => ({ ...prev, hasSeenWalkthrough: true }));
    if (cachedUserProfile) {
      cachedUserProfile.hasSeenWalkthrough = true;
    }
    try {
      await AsyncStorage.setItem(STORAGE_KEY_WALKTHROUGH, 'true');
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY_WALKTHROUGH, 'true');
      }
    } catch (_) {}
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        try {
          await AsyncStorage.setItem(`@fortywell_walkthrough_${user.id}`, 'true');
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem(`@fortywell_walkthrough_${user.id}`, 'true');
          }
        } catch (_) {}
        await supabase
          .from('profiles')
          .update({ has_seen_walkthrough: true, updated_at: new Date().toISOString() })
          .eq('id', user.id);
      }
    } catch (err) {
      console.warn('Could not save walkthrough completion:', err);
    }
  }, []);

  const verifyEmailWithOtp = useCallback(async (code: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error('No account email found.');

      const cleanToken = code.trim();
      const { error } = await supabase.auth.verifyOtp({
        email: user.email.toLowerCase(),
        token: cleanToken,
        type: 'signup',
      });

      if (error) {
        const { error: error2 } = await supabase.auth.verifyOtp({
          email: user.email.toLowerCase(),
          token: cleanToken,
          type: 'email',
        });
        if (error2) throw error;
      }

      await supabase.from('profiles').update({
        is_email_verified: true,
        updated_at: new Date().toISOString(),
      }).eq('id', user.id);

      setUserProfile((prev) => ({ ...prev, isEmailVerified: true }));
      if (cachedUserProfile) cachedUserProfile.isEmailVerified = true;
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Invalid or expired verification code.' };
    }
  }, []);

  const resendVerificationEmail = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error('No account email found.');

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email.toLowerCase(),
      });
      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Could not send verification email.' };
    }
  }, []);

  // Compute 7 days of the current week (Monday to Sunday) with real completion status
  const currentWeekDays: WeekDayProgress[] = useMemo(() => {
    const now = new Date();
    const currentDay = now.getDay();
    const distToMonday = currentDay === 0 ? -6 : 1 - currentDay;

    const monday = new Date(now);
    monday.setDate(now.getDate() + distToMonday);

    const dayLabels = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    const fullNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    const week: WeekDayProgress[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = getISODateStr(d);
      const isToday = d.toDateString() === now.toDateString();
      const isPast = d < now && !isToday;
      const isCompleted = completedDatesSet.has(dateStr);

      week.push({
        dayLabel: dayLabels[i],
        fullDayName: fullNames[i],
        dayNum: String(d.getDate()),
        dateStr,
        isToday,
        isCompleted,
        isPast,
      });
    }
    return week;
  }, [completedDatesSet]);

  // Compute Garden Level & Dynamic Vitality Trends
  const gardenProgress: GardenProgress = useMemo(() => {
    const totalActiveDays = completedDatesSet.size;

    let level = 1;
    if (totalActiveDays >= 36) level = 6;
    else if (totalActiveDays >= 29) level = 5;
    else if (totalActiveDays >= 22) level = 4;
    else if (totalActiveDays >= 15) level = 3;
    else if (totalActiveDays >= 8) level = 2;
    else level = 1;

    const meta = GARDEN_LEVEL_METAS.find((m) => m.level === level) || GARDEN_LEVEL_METAS[0];
    const daysCompletedInLevel = totalActiveDays % 7;
    const daysToNextLevel = 7 - daysCompletedInLevel;

    // Build real 10-month timeline dynamically
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const months: string[] = [];
    const consistency: number[] = [];
    const mobility: number[] = [];
    const fluidity: number[] = [];

    for (let i = 9; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mName = monthNames[d.getMonth()];
      const y = d.getFullYear();
      const m = d.getMonth();
      months.push(mName);

      let countInMonth = 0;
      completedDatesSet.forEach((dateStr) => {
        const parts = dateStr.split('-');
        if (parts.length >= 2) {
          const dy = parseInt(parts[0], 10);
          const dm = parseInt(parts[1], 10);
          if (dy === y && dm === m + 1) {
            countInMonth++;
          }
        }
      });

      // Target ~12 sessions/mo
      const cPct = countInMonth > 0 ? Math.min(100, Math.round((countInMonth / 12) * 100)) : 0;
      const mPts = countInMonth > 0 ? Math.min(50, countInMonth * 5) : 0;
      const fHrs = countInMonth > 0 ? Math.min(30, countInMonth * 3) : 0;

      consistency.push(cPct);
      mobility.push(mPts);
      fluidity.push(fHrs);
    }

    const hasEnoughData = totalActiveDays >= 1 || feelingCheckins.length >= 1;

    return {
      currentLevel: level,
      daysCompletedInLevel,
      daysRequiredInLevel: 7,
      daysToNextLevel,
      totalActiveDays,
      levelName: meta.name,
      levelDesc: meta.desc,
      hasEnoughDataForTrends: hasEnoughData,
      vitalityTrends: {
        months,
        consistency,
        mobility,
        fluidity,
      },
    };
  }, [completedDatesSet, feelingCheckins]);

  const recordCompletedWorkout = useCallback(
    async (dateStr?: string, minutes: number = 20, volumeKg: number = 0) => {
      const today = dateStr || getISODateStr(new Date());
      setCompletedDatesSet((prev) => {
        const next = new Set(prev);
        next.add(today);
        AsyncStorage.setItem(
          STORAGE_KEY_COMPLETED_DATES,
          JSON.stringify(Array.from(next))
        ).catch(() => {});
        return next;
      });

      setLifetimeStats((prev) => ({
        ...prev,
        totalWorkouts: prev.totalWorkouts + 1,
        totalTimeHours: Math.round(((prev.totalTimeHours * 60 + minutes) / 60) * 10) / 10,
        totalVolumeKg: prev.totalVolumeKg + volumeKg,
      }));
    },
    []
  );

  return {
    loading,
    userProfile,
    lifetimeStats,
    currentWeekDays,
    gardenProgress,
    feelingCheckins,
    topExercises,
    logFeeling,
    recordCompletedWorkout,
    markWalkthroughCompleted,
    verifyEmailWithOtp,
    resendVerificationEmail,
    refreshUserData: loadUserData,
  };
}

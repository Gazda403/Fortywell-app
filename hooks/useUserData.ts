import { useState, useEffect, useCallback, useMemo } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { OnboardingAnswers } from '../types/onboarding';

const STORAGE_KEY_WALKTHROUGH = '@fortywell_has_seen_walkthrough_v1';
const STORAGE_KEY_COMPLETED_DATES = '@fortywell_completed_dates_v1';
const STORAGE_KEY_LIFETIME_STATS = '@fortywell_cached_lifetime_stats_v1';

// Per-user storage keys — prevents two accounts on the same device from sharing data
function userKey(base: string, userId?: string | null) {
  return userId ? `${base}_${userId}` : base;
}

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
  totalSets?: number;
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
    monthName?: string;
    currentWeekIndex?: number;
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
let cachedTopExercises: TopExerciseItem[] | null = null;
let lastUserDataFetchTime = 0;
let pendingFetchPromise: Promise<void> | null = null;
const CACHE_TTL_MS = 60000; // 60 seconds
// Sentinel: if the authenticated user changes, all module caches must be flushed
let lastCachedUserId: string | null = null;

function flushUserCaches() {
  cachedUserProfile = null;
  cachedLifetimeStats = null;
  cachedCompletedDatesSet = null;
  cachedFeelingCheckins = null;
  cachedTopExercises = null;
  lastUserDataFetchTime = 0;
}

// Hydrate memory cache synchronously from localStorage on web environments
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    const rawStats = window.localStorage.getItem(STORAGE_KEY_LIFETIME_STATS);
    if (rawStats) cachedLifetimeStats = JSON.parse(rawStats);
    const rawDates = window.localStorage.getItem(STORAGE_KEY_COMPLETED_DATES);
    if (rawDates) {
      const parsed = JSON.parse(rawDates);
      if (Array.isArray(parsed)) cachedCompletedDatesSet = new Set(parsed);
    }
  } catch (_) {}
}

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
      totalSets: 0,
    };
  });

  const [completedDatesSet, setCompletedDatesSet] = useState<Set<string>>(() => {
    return cachedCompletedDatesSet || new Set();
  });
  const [feelingCheckins, setFeelingCheckins] = useState<FeelingCheckinRecord[]>(() => {
    return cachedFeelingCheckins || [];
  });
  const [topExercises, setTopExercises] = useState<TopExerciseItem[]>(() => {
    return cachedTopExercises || [
      { name: 'Cat-Cow Segmental Mobility', sets: 24, muscle: 'Spine & Lumbar', tag: 'Mobility' },
      { name: 'Iso-Hold Glute Bridge with Heel Drive', sets: 32, muscle: 'Glutes & Pelvic', tag: 'Strength' },
      { name: 'Deadbug with Opposite Arm/Leg Reach', sets: 28, muscle: 'Deep Core', tag: 'Stability' },
      { name: 'Dumbbell Romanian Deadlift', sets: 18, muscle: 'Hamstrings', tag: 'Posterior' },
    ];
  });

  // Fast-path: Hydrate from AsyncStorage immediately on mount (runs in < 5ms on Native & Web)
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        // Resolve user ID so we read the correct user-scoped keys
        let uid: string | null = null;
        try {
          const { data: { user } } = await supabase.auth.getUser();
          uid = user?.id ?? null;
        } catch (_) {}

        const [localStatsJson, localDatesJson, localFeelingsJson, localTopJson] = await Promise.all([
          AsyncStorage.getItem(userKey(STORAGE_KEY_LIFETIME_STATS, uid)),
          AsyncStorage.getItem(userKey(STORAGE_KEY_COMPLETED_DATES, uid)),
          AsyncStorage.getItem('@fortywell_feeling_checkins_v1'),
          AsyncStorage.getItem('@fortywell_top_exercises_v1'),
        ]);

        if (!isMounted) return;

        if (localStatsJson) {
          const parsed = JSON.parse(localStatsJson);
          if (parsed && typeof parsed === 'object') {
            cachedLifetimeStats = parsed;
            setLifetimeStats(parsed);
          }
        }

        if (localDatesJson) {
          const parsedDates = JSON.parse(localDatesJson);
          if (Array.isArray(parsedDates) && parsedDates.length > 0) {
            const dateSet = new Set<string>(parsedDates);
            cachedCompletedDatesSet = dateSet;
            setCompletedDatesSet(dateSet);
          }
        }

        if (localFeelingsJson) {
          const parsedFeelings = JSON.parse(localFeelingsJson);
          if (Array.isArray(parsedFeelings) && parsedFeelings.length > 0) {
            cachedFeelingCheckins = parsedFeelings;
            setFeelingCheckins(parsedFeelings);
          }
        }

        if (localTopJson) {
          const parsedTop = JSON.parse(localTopJson);
          if (Array.isArray(parsedTop) && parsedTop.length > 0) {
            cachedTopExercises = parsedTop;
            setTopExercises(parsedTop);
          }
        }
      } catch (_) {}
    })();

    return () => {
      isMounted = false;
    };
  }, []);

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
        if (cachedTopExercises) setTopExercises(cachedTopExercises);
        setLoading(false);
      }
      return;
    }

    pendingFetchPromise = (async () => {
      try {
        setLoading(true);

        // 1. Get current auth user
        const { data: { user } } = await supabase.auth.getUser();

        // Flush caches if a different user has logged in
        if (user?.id && user.id !== lastCachedUserId) {
          flushUserCaches();
        }

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
        lastCachedUserId = user?.id ?? null;
        setUserProfile(newProfile);

      // 2. Fetch completed workout logs (from Supabase + Local AsyncStorage cache)
      const completedDates = new Set<string>();
      let totalMinutes = 0;
      let totalVolume = 0;
      let totalWorkoutsCount = 0;
      let totalCompletedSets = 0;

      // Load local cached completed dates first (user-scoped key)
      try {
        const localDatesJson = await AsyncStorage.getItem(userKey(STORAGE_KEY_COMPLETED_DATES, user?.id));
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
              totalCompletedSets += Number(p.completedSets || 12);
            });
          }
        }
      } catch (_) {}

      // Load Supabase logs explicitly filtered by current user
      const exerciseCounts = new Map<string, number>();
      try {
        let logsQuery = supabase
          .from('workout_logs')
          .select('*')
          .eq('status', 'completed');

        if (user?.id) {
          logsQuery = logsQuery.eq('user_id', user.id);
        }

        const { data: logs } = await logsQuery;

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
                      totalCompletedSets += doneSets;
                      exerciseCounts.set(ex.name, (exerciseCounts.get(ex.name) || 0) + doneSets);
                    }
                  });
                }
              } catch (_) {}
            } else {
              totalCompletedSets += 12;
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
        cachedTopExercises = topList;
        setTopExercises(topList);
        try {
          await AsyncStorage.setItem('@fortywell_top_exercises_v1', JSON.stringify(topList));
        } catch (_) {}
      }

      // Cache merged dates to local storage (user-scoped key)
      try {
        const datesKey = userKey(STORAGE_KEY_COMPLETED_DATES, user?.id);
        await AsyncStorage.setItem(datesKey, JSON.stringify(Array.from(completedDates)));
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(datesKey, JSON.stringify(Array.from(completedDates)));
        }
      } catch (_) {}

      cachedCompletedDatesSet = completedDates;
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

      const totalWorkoutsFinal = Math.max(totalWorkoutsCount, completedDates.size);
      const newStats: LifetimeStats = {
        totalWorkouts: totalWorkoutsFinal,
        totalVolumeKg: totalVolume,
        currentStreak: streak,
        totalTimeHours: Number((totalMinutes / 60).toFixed(1)),
        totalSets: totalCompletedSets || (totalWorkoutsFinal * 12),
      };

      cachedLifetimeStats = newStats;
      setLifetimeStats(newStats);

      // Persist stats locally so they load instantly on next open (user-scoped key)
      try {
        const statsKey = userKey(STORAGE_KEY_LIFETIME_STATS, user?.id);
        await AsyncStorage.setItem(statsKey, JSON.stringify(newStats));
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(statsKey, JSON.stringify(newStats));
        }
      } catch (_) {}

      // 4. Fetch feeling check-ins explicitly for current user
      try {
        let checkinQuery = supabase
          .from('feeling_checkins')
          .select('*')
          .order('date', { ascending: true });

        if (user?.id) {
          checkinQuery = checkinQuery.eq('user_id', user.id);
        }

        const { data: checkinRows } = await checkinQuery;

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
          try {
            await AsyncStorage.setItem('@fortywell_feeling_checkins_v1', JSON.stringify(parsedFeelings));
          } catch (_) {}
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
}, [answers]);

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

      setFeelingCheckins((prev) => {
        const updated = [...prev.filter((c) => c.date !== today), newEntry];
        cachedFeelingCheckins = updated;
        AsyncStorage.setItem('@fortywell_feeling_checkins_v1', JSON.stringify(updated)).catch(() => {});
        return updated;
      });

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          await supabase.from('feeling_checkins').upsert(
            {
              user_id: user.id,
              date: today,
              mood,
              energy,
              notes,
              created_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,date' }
          );
        }
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
    let daysCompletedInLevel = 0;
    let daysRequiredInLevel = 7;
    let daysToNextLevel = 7;

    if (totalActiveDays >= 36) {
      level = 6;
      daysCompletedInLevel = 7;
      daysRequiredInLevel = 7;
      daysToNextLevel = 0;
    } else if (totalActiveDays >= 29) {
      level = 5;
      daysCompletedInLevel = totalActiveDays - 28;
      daysRequiredInLevel = 7;
      daysToNextLevel = Math.max(0, 36 - totalActiveDays);
    } else if (totalActiveDays >= 22) {
      level = 4;
      daysCompletedInLevel = totalActiveDays - 21;
      daysRequiredInLevel = 7;
      daysToNextLevel = Math.max(0, 29 - totalActiveDays);
    } else if (totalActiveDays >= 15) {
      level = 3;
      daysCompletedInLevel = totalActiveDays - 14;
      daysRequiredInLevel = 7;
      daysToNextLevel = Math.max(0, 22 - totalActiveDays);
    } else if (totalActiveDays >= 8) {
      level = 2;
      daysCompletedInLevel = totalActiveDays - 7;
      daysRequiredInLevel = 7;
      daysToNextLevel = Math.max(0, 15 - totalActiveDays);
    } else {
      level = 1;
      daysCompletedInLevel = totalActiveDays;
      daysRequiredInLevel = 7;
      daysToNextLevel = Math.max(0, 8 - totalActiveDays);
    }

    const meta = GARDEN_LEVEL_METAS.find((m) => m.level === level) || GARDEN_LEVEL_METAS[0];

    // Build 4-week breakdown for the current month
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed (e.g. 8 for September)
    const currentDay = now.getDate();
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    const currentMonthName = monthNames[currentMonth];

    // Total days in current month
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // 4 standard weeks in the month
    const weekRanges = [
      { label: 'Week 1', start: 1, end: 7 },
      { label: 'Week 2', start: 8, end: 14 },
      { label: 'Week 3', start: 15, end: 21 },
      { label: 'Week 4', start: 22, end: daysInMonth },
    ];

    let currentWeekIdx = 0;
    if (currentDay > 21) currentWeekIdx = 3;
    else if (currentDay > 14) currentWeekIdx = 2;
    else if (currentDay > 7) currentWeekIdx = 1;

    // Count actual completed workouts per week of current month
    const weekWorkoutCounts = [0, 0, 0, 0];
    completedDatesSet.forEach((dateStr) => {
      const parts = dateStr.split('-');
      if (parts.length >= 3) {
        const dy = parseInt(parts[0], 10);
        const dm = parseInt(parts[1], 10);
        const dd = parseInt(parts[2], 10);
        if (dy === currentYear && dm === currentMonth + 1) {
          for (let w = 0; w < 4; w++) {
            if (dd >= weekRanges[w].start && dd <= weekRanges[w].end) {
              weekWorkoutCounts[w]++;
              break;
            }
          }
        }
      }
    });

    const months: string[] = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    const consistency: number[] = [];
    const mobility: number[] = [];
    const fluidity: number[] = [];

    // Target ~3 sessions/week for healthy consistent joint routine
    const targetWeeklySessions = 3;

    for (let w = 0; w < 4; w++) {
      const count = weekWorkoutCounts[w];
      const isUpcoming = w > currentWeekIdx;
      const isCurrent = w === currentWeekIdx;

      let cPct: number;
      let mPts: number;
      let fHrs: number;

      if (totalActiveDays === 0) {
        // Welcoming starter curve for brand new users with no workouts yet
        cPct = Math.min(100, Math.round(25 + w * 18));
        mPts = Math.min(90, Math.round(35 + w * 12));
        fHrs = Math.min(85, Math.round(28 + w * 10));
      } else if (count > 0) {
        // Active week with logged workouts: realistic progression
        cPct = Math.min(100, Math.round((count / targetWeeklySessions) * 100));
        mPts = Math.min(95, Math.round(42 + count * 16 + Math.min(18, totalActiveDays * 1.5)));
        fHrs = Math.min(90, Math.round(34 + count * 14 + Math.min(16, totalActiveDays * 1.2)));
      } else if (isCurrent) {
        // Current week in progress (0 workouts logged yet this week)
        const prevC = w > 0 ? consistency[w - 1] : 0;
        cPct = prevC > 0 ? Math.max(25, Math.round(prevC * 0.7)) : 0;
        mPts = Math.min(88, Math.round(38 + Math.min(22, totalActiveDays * 1.8)));
        fHrs = Math.min(82, Math.round(30 + Math.min(18, totalActiveDays * 1.4)));
      } else if (isUpcoming) {
        // Upcoming weeks: project momentum based on previous week rather than plunging
        const prevC = w > 0 ? consistency[w - 1] : 35;
        const prevM = w > 0 ? mobility[w - 1] : 45;
        const prevF = w > 0 ? fluidity[w - 1] : 38;
        cPct = Math.min(100, Math.max(30, Math.round(prevC * 1.05)));
        mPts = Math.min(95, Math.max(40, Math.round(prevM * 1.03)));
        fHrs = Math.min(90, Math.max(32, Math.round(prevF * 1.03)));
      } else {
        // Past week with 0 workouts: honest baseline
        cPct = 0;
        mPts = Math.min(80, Math.round(34 + Math.min(16, totalActiveDays * 1.2)));
        fHrs = Math.min(75, Math.round(26 + Math.min(14, totalActiveDays * 1.0)));
      }

      consistency.push(cPct);
      mobility.push(mPts);
      fluidity.push(fHrs);
    }

    return {
      currentLevel: level,
      daysCompletedInLevel,
      daysRequiredInLevel: 7,
      daysToNextLevel,
      totalActiveDays,
      levelName: meta.name,
      levelDesc: meta.desc,
      hasEnoughDataForTrends: true,
      vitalityTrends: {
        months,
        consistency,
        mobility,
        fluidity,
        monthName: currentMonthName,
        currentWeekIndex: currentWeekIdx,
      },
    };
  }, [completedDatesSet]);

  const recordCompletedWorkout = useCallback(
    async (dateStr?: string, minutes: number = 20, volumeKg: number = 0, setsDone: number = 0) => {
      const today = dateStr || getISODateStr(new Date());
      const uid = cachedUserProfile?.id ?? lastCachedUserId ?? undefined;
      const datesKey = userKey(STORAGE_KEY_COMPLETED_DATES, uid);
      const statsKey = userKey(STORAGE_KEY_LIFETIME_STATS, uid);

      setCompletedDatesSet((prev) => {
        const next = new Set(prev);
        next.add(today);
        const arr = Array.from(next);
        AsyncStorage.setItem(datesKey, JSON.stringify(arr)).catch(() => {});
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(datesKey, JSON.stringify(arr));
        }
        return next;
      });

      setLifetimeStats((prev) => {
        const nextStats: LifetimeStats = {
          ...prev,
          totalWorkouts: prev.totalWorkouts + 1,
          totalTimeHours: Math.round(((prev.totalTimeHours * 60 + minutes) / 60) * 10) / 10,
          totalVolumeKg: prev.totalVolumeKg + volumeKg,
          totalSets: (prev.totalSets || 0) + (setsDone || 12),
        };
        cachedLifetimeStats = nextStats;
        AsyncStorage.setItem(statsKey, JSON.stringify(nextStats)).catch(() => {});
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(statsKey, JSON.stringify(nextStats));
        }
        return nextStats;
      });
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

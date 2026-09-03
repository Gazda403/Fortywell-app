import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { setSoundEffectsEnabled, setHapticsEnabled } from './audioManager';

export const STORAGE_KEY_SETTINGS = '@fortywell_settings_v1';

function settingsKey(userId?: string | null) {
  return userId ? `${STORAGE_KEY_SETTINGS}_${userId}` : STORAGE_KEY_SETTINGS;
}

export interface AppSettings {
  notifMorning: boolean;
  notifWorkout: boolean;
  notifPhase: boolean;
  notifWeekly: boolean;
  soundMilestone: boolean;
  soundAmbient: boolean;
  hapticFeedback: boolean;
  adaptiveRecs: boolean;
  cycleSync: boolean;
  restDayInsights: boolean;
  analyticsOptIn: boolean;
  crashReports: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  notifMorning: true,
  notifWorkout: true,
  notifPhase: true,
  notifWeekly: true,
  soundMilestone: true,
  soundAmbient: false,
  hapticFeedback: true,
  adaptiveRecs: true,
  cycleSync: true,
  restDayInsights: true,
  analyticsOptIn: true,
  crashReports: true,
};

let inMemorySettings: AppSettings = { ...DEFAULT_SETTINGS };
let _settingsUserId: string | null = null;

/**
 * Load settings synchronously/cached from memory or storage
 */
export async function getStoredSettings(userId?: string | null): Promise<AppSettings> {
  const key = settingsKey(userId);
  _settingsUserId = userId || null;
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      inMemorySettings = { ...DEFAULT_SETTINGS, ...parsed };
      // Apply audio/haptics side effects
      setSoundEffectsEnabled(inMemorySettings.soundMilestone);
      setHapticsEnabled(inMemorySettings.hapticFeedback);
      return inMemorySettings;
    }
  } catch (_) {}
  return inMemorySettings;
}

/**
 * Save settings to AsyncStorage and cloud Supabase profile
 */
export async function saveStoredSettings(newSettings: Partial<AppSettings>, userId?: string | null): Promise<AppSettings> {
  const merged: AppSettings = {
    ...inMemorySettings,
    ...newSettings,
  };
  inMemorySettings = merged;

  // Apply side-effects immediately
  if (newSettings.soundMilestone !== undefined) {
    setSoundEffectsEnabled(newSettings.soundMilestone);
  }
  if (newSettings.hapticFeedback !== undefined) {
    setHapticsEnabled(newSettings.hapticFeedback);
  }

  const key = settingsKey(userId ?? _settingsUserId);

  // 1. Persist locally (user-scoped key)
  try {
    await AsyncStorage.setItem(key, JSON.stringify(merged));
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, JSON.stringify(merged));
    }
  } catch (_) {}

  // 2. Sync to Supabase cloud profile if authenticated
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id) {
      await supabase
        .from('profiles')
        .update({
          settings: merged,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
    }
  } catch (_) {}

  return merged;
}

/**
 * React Hook for consuming and modifying persistent settings
 */
export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings>(inMemorySettings);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      // 1. Resolve user ID (used for scoped storage keys)
      let userId: string | null = null;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        userId = user?.id ?? null;
      } catch (_) {}

      // 2. Load from user-scoped local cache
      const local = await getStoredSettings(userId);
      if (isMounted) {
        setSettings(local);
        setLoaded(true);
      }

      // 3. Load from Supabase to catch cross-device updates
      try {
        if (userId) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('settings')
            .eq('id', userId)
            .maybeSingle();

          if (profile?.settings && typeof profile.settings === 'object' && isMounted) {
            const merged = { ...local, ...profile.settings };
            setSettings(merged);
            inMemorySettings = merged;
            await AsyncStorage.setItem(settingsKey(userId), JSON.stringify(merged));
          }
        }
      } catch (_) {}
    }

    load();
    return () => { isMounted = false; };
  }, []);

  const updateSetting = useCallback(async <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      saveStoredSettings(next);
      return next;
    });
  }, []);

  const updateAllSettings = useCallback(async (partial: Partial<AppSettings>) => {
    const updated = await saveStoredSettings(partial);
    setSettings(updated);
  }, []);

  return {
    settings,
    loaded,
    updateSetting,
    updateAllSettings,
  };
}

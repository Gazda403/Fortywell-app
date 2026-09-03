/**
 * useSavedSessions.ts
 * -------------------
 * Manages saved workout sessions with full exercise data.
 *
 * - Save completed workouts with all exercise/set/rep/weight data
 * - View saved sessions list
 * - Load/replay a saved session
 * - Stored locally via AsyncStorage (offline-first)
 * - Syncs to Supabase when online
 */

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

export interface SavedSessionExercise {
  name: string;
  sets: Array<{
    setNumber: number;
    reps: number;
    weight: number;
    completed: boolean;
  }>;
}

export interface SavedSession {
  id: string;
  workoutSlug: string;
  workoutTitle: string;
  completedAt: string; // ISO date
  durationSeconds: number;
  completedSets: number;
  totalSets: number;
  totalVolumeKg: number;
  exercises: SavedSessionExercise[];
  // User's feeling data at time of save
  mood?: number;
  energy?: number;
}

const STORAGE_KEY_PREFIX = '@fortywell_saved_sessions_v1';

function storageKey(userId: string | undefined) {
  return userId ? `${STORAGE_KEY_PREFIX}_${userId}` : STORAGE_KEY_PREFIX;
}

interface SavedSessionsHook {
  savedSessions: SavedSession[];
  saveSession: (session: Omit<SavedSession, 'id' | 'completedAt'>) => Promise<boolean>;
  deleteSession: (sessionId: string) => Promise<void>;
  getSessionById: (sessionId: string) => SavedSession | undefined;
  isLoading: boolean;
}

// ─── Module-level cache ───────────────────────────────────────────────────────

let _cachedSessions: SavedSession[] = [];
let _lastUserId: string | null = null;
let _listeners: Array<(sessions: SavedSession[]) => void> = [];

function notifyListeners(sessions: SavedSession[]) {
  _cachedSessions = sessions;
  _listeners.forEach((fn) => fn([...sessions]));
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useSavedSessions(): SavedSessionsHook {
  const [savedSessions, setSavedSessionsState] = useState<SavedSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Subscribe to module-level listener
  useEffect(() => {
    const listener = (sessions: SavedSession[]) => setSavedSessionsState([...sessions]);
    _listeners.push(listener);
    return () => {
      _listeners = _listeners.filter((l) => l !== listener);
    };
  }, []);

  // Load from AsyncStorage + Supabase on mount
  useEffect(() => {
    (async () => {
      // 1. Identify current user first
      let userId: string | undefined;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        userId = user?.id;
      } catch (_) {}

      const key = storageKey(userId);

      // 2. If user switched, flush stale module cache
      if (userId && userId !== _lastUserId) {
        _cachedSessions = [];
        _lastUserId = userId;
        notifyListeners([]);
      }

      // 3. Load from user-scoped local storage immediately
      try {
        const raw = await AsyncStorage.getItem(key);
        if (raw) {
          const sessions: SavedSession[] = JSON.parse(raw);
          notifyListeners(sessions);
        }
      } catch (_) {}

      // 4. Sync with Supabase (silent, background)
      try {
        if (!userId) {
          setIsLoading(false);
          return;
        }

        const { data: rows } = await supabase
          .from('saved_sessions')
          .select('*')
          .eq('user_id', userId)
          .order('completed_at', { ascending: false });

        if (rows && rows.length > 0) {
          const remoteSessions: SavedSession[] = rows.map((r: any) => ({
            id: r.id,
            workoutSlug: r.workout_slug,
            workoutTitle: r.workout_title,
            completedAt: r.completed_at,
            durationSeconds: r.duration_seconds,
            completedSets: r.completed_sets,
            totalSets: r.total_sets,
            totalVolumeKg: r.total_volume_kg,
            exercises: r.exercises || [],
            mood: r.mood,
            energy: r.energy,
          }));

          // Merge: prefer remote, add any local-only (pending upload) sessions
          const remoteIds = new Set(remoteSessions.map(s => s.id));
          const merged = [...remoteSessions];
          _cachedSessions.forEach(s => {
            if (!remoteIds.has(s.id)) merged.push(s);
          });

          // Sort by date descending
          merged.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

          notifyListeners(merged);
          await AsyncStorage.setItem(key, JSON.stringify(merged));
        }
      } catch (_) {
        // No internet — already have local data
      }

      setIsLoading(false);
    })();
  }, []);

  const saveSession = useCallback(async (sessionData: Omit<SavedSession, 'id' | 'completedAt'>): Promise<boolean> => {
    const newSession: SavedSession = {
      ...sessionData,
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      completedAt: new Date().toISOString(),
    };

    // Optimistic local update
    const updated = [newSession, ..._cachedSessions];
    notifyListeners(updated);

    // Persist locally
    try {
      await AsyncStorage.setItem(storageKey(_lastUserId ?? undefined), JSON.stringify(updated));
    } catch (_) {
      return false;
    }

    // Sync to Supabase (fire-and-forget)
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return true;

      await supabase.from('saved_sessions').upsert({
        id: newSession.id,
        user_id: user.id,
        workout_slug: newSession.workoutSlug,
        workout_title: newSession.workoutTitle,
        completed_at: newSession.completedAt,
        duration_seconds: newSession.durationSeconds,
        completed_sets: newSession.completedSets,
        total_sets: newSession.totalSets,
        total_volume_kg: newSession.totalVolumeKg,
        exercises: newSession.exercises,
        mood: newSession.mood,
        energy: newSession.energy,
      }, { onConflict: 'id' });
    } catch (_) {
      // Offline — local state is already correct, will sync next time
    }

    return true;
  }, []);

  const deleteSession = useCallback(async (sessionId: string) => {
    // Optimistic local update
    const updated = _cachedSessions.filter(s => s.id !== sessionId);
    notifyListeners(updated);

    // Persist locally
    try {
      await AsyncStorage.setItem(storageKey(_lastUserId ?? undefined), JSON.stringify(updated));
    } catch (_) {}

    // Sync to Supabase
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return;

      await supabase
        .from('saved_sessions')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', user.id);
    } catch (_) {}
  }, []);

  const getSessionById = useCallback((sessionId: string): SavedSession | undefined => {
    return _cachedSessions.find(s => s.id === sessionId);
  }, []);

  return {
    savedSessions: _cachedSessions,
    saveSession,
    deleteSession,
    getSessionById,
    isLoading,
  };
}

/**
 * Convert a workout summary to a saveable session format
 */
export function summaryToSessionData(
  workoutSlug: string,
  workoutTitle: string,
  summary: {
    durationSeconds: number;
    completedSets: number;
    totalSets: number;
    totalVolumeKg: number;
    exercises: Array<{
      name: string;
      sets: Array<{ completed: boolean; reps: number; weight: number }>;
    }>;
  },
  mood?: number,
  energy?: number
): Omit<SavedSession, 'id' | 'completedAt'> {
  return {
    workoutSlug,
    workoutTitle,
    durationSeconds: summary.durationSeconds,
    completedSets: summary.completedSets,
    totalSets: summary.totalSets,
    totalVolumeKg: summary.totalVolumeKg,
    exercises: summary.exercises.map(ex => ({
      name: ex.name,
      sets: ex.sets.map((s, idx) => ({
        setNumber: idx + 1,
        reps: s.reps,
        weight: s.weight,
        completed: s.completed,
      })),
    })),
    mood,
    energy,
  };
}
/**
 * useOfflineSync.ts
 * -----------------
 * Offline Workout Protection — two-layer safety net:
 *
 * Layer 1 — In-Progress Checkpoint:
 *   Every 30s during a workout, saves the live session state to AsyncStorage.
 *   If the app crashes or loses connection, on next open the user can resume.
 *
 * Layer 2 — Pending Log Queue:
 *   If a completed workout fails to write to Supabase (no internet), it's
 *   queued locally as a pending log. On reconnect (detected via NetInfo),
 *   all pending logs are automatically synced and cleared.
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { supabase } from './supabase';

const KEY_ACTIVE_SESSION = '@fortywell_active_session_v1';
const KEY_PENDING_LOGS = '@fortywell_pending_logs_v1';

export interface ActiveSessionCheckpoint {
  workoutSlug: string;
  workoutTitle: string;
  workoutData?: any; // full Workout object for restoration
  exercises: any[];
  elapsedSeconds: number;
  startedAt: string; // ISO string of when the workout began
  savedAt: string;
  // ── Pause / Resume tracking ───────────────────────
  isPaused?: boolean;
  pausedAt?: string;       // ISO string of when user paused
  totalPausedMs?: number;  // accumulated paused time so timer never drifts
  // ── Current position (for lock-screen metadata) ──
  currentExerciseIndex?: number;
  currentSetIndex?: number;
}

export interface PendingWorkoutLog {
  id: string; // local UUID
  workoutSlug: string;
  workoutTitle: string;
  date: string;
  durationSeconds: number;
  completedSets: number;
  totalSets: number;
  volumeKg: number;
  exercises: any[];
  completedAt: string;
}

// ─── Save in-progress session checkpoint ────────────────────────────────────

export async function saveActiveSessionCheckpoint(
  checkpoint: Omit<ActiveSessionCheckpoint, 'savedAt'>
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      KEY_ACTIVE_SESSION,
      JSON.stringify({ ...checkpoint, savedAt: new Date().toISOString() })
    );
  } catch (_) {}
}

export async function getActiveSessionCheckpoint(): Promise<ActiveSessionCheckpoint | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY_ACTIVE_SESSION);
    if (!raw) return null;
    return JSON.parse(raw) as ActiveSessionCheckpoint;
  } catch (_) {
    return null;
  }
}

export async function clearActiveSessionCheckpoint(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY_ACTIVE_SESSION);
  } catch (_) {}
}

// ─── Pending log queue ───────────────────────────────────────────────────────

async function getPendingLogs(): Promise<PendingWorkoutLog[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY_PENDING_LOGS);
    if (!raw) return [];
    return JSON.parse(raw) as PendingWorkoutLog[];
  } catch (_) {
    return [];
  }
}

async function savePendingLogs(logs: PendingWorkoutLog[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY_PENDING_LOGS, JSON.stringify(logs));
  } catch (_) {}
}

export async function enqueuePendingLog(log: Omit<PendingWorkoutLog, 'id'>): Promise<void> {
  const current = await getPendingLogs();
  const withId: PendingWorkoutLog = {
    ...log,
    id: Math.random().toString(36).slice(2),
  };
  await savePendingLogs([...current, withId]);
}

export async function syncPendingLogs(): Promise<{ synced: number; failed: number }> {
  const pending = await getPendingLogs();
  if (pending.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;
  const remaining: PendingWorkoutLog[] = [];

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) return { synced: 0, failed: pending.length };

    for (const log of pending) {
      try {
        const { error } = await supabase.from('workout_logs').insert({
          user_id: user.id,
          workout_slug: log.workoutSlug,
          workout_title: log.workoutTitle,
          date: log.date,
          duration_minutes: Math.round(log.durationSeconds / 60),
          completed_sets: log.completedSets,
          total_sets: log.totalSets,
          volume_kg: log.volumeKg,
          exercises_json: JSON.stringify(log.exercises),
          status: 'completed',
          sync_status: 'synced',
          created_at: log.completedAt,
        });

        if (error) {
          remaining.push(log);
          failed++;
        } else {
          synced++;
        }
      } catch (_) {
        remaining.push(log);
        failed++;
      }
    }
  } catch (_) {
    return { synced: 0, failed: pending.length };
  }

  await savePendingLogs(remaining);
  return { synced, failed };
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useOfflineSync() {
  const [hasPendingLogs, setHasPendingLogs] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const isOnlineRef = useRef(true);
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check pending logs on mount
  useEffect(() => {
    getPendingLogs().then((logs) => setHasPendingLogs(logs.length > 0));
  }, []);

  // Listen to network state changes — auto-sync when back online
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(async (state) => {
      const wasOffline = !isOnlineRef.current;
      isOnlineRef.current = !!(state.isConnected && state.isInternetReachable);

      // Came back online → trigger sync
      if (wasOffline && isOnlineRef.current) {
        // Small delay to let connection stabilize
        if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = setTimeout(async () => {
          const logs = await getPendingLogs();
          if (logs.length > 0) {
            setIsSyncing(true);
            await syncPendingLogs();
            const remaining = await getPendingLogs();
            setHasPendingLogs(remaining.length > 0);
            setIsSyncing(false);
          }
        }, 1500);
      }
    });

    return () => {
      unsubscribe();
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, []);

  const triggerSync = useCallback(async () => {
    setIsSyncing(true);
    await syncPendingLogs();
    const remaining = await getPendingLogs();
    setHasPendingLogs(remaining.length > 0);
    setIsSyncing(false);
  }, []);

  return {
    hasPendingLogs,
    isSyncing,
    triggerSync,
    saveCheckpoint: saveActiveSessionCheckpoint,
    clearCheckpoint: clearActiveSessionCheckpoint,
    getCheckpoint: getActiveSessionCheckpoint,
    enqueuePendingLog,
  };
}

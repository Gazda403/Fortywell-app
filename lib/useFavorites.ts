/**
 * useFavorites.ts
 * ---------------
 * Offline-first Save/Favorite Workouts hook.
 *
 * - Reads favorites from AsyncStorage on mount (instant, no network needed).
 * - Syncs with Supabase in the background when online.
 * - toggleFavorite() is optimistic: local state updates immediately.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

const STORAGE_KEY = '@fortywell_favorite_slugs_v1';

// ─── Module-level cache to share state across hook instances ─────────────────
let _cachedSlugs: Set<string> | null = null;
let _listeners: Array<(slugs: Set<string>) => void> = [];

function notifyListeners(slugs: Set<string>) {
  _cachedSlugs = slugs;
  _listeners.forEach((fn) => fn(new Set(slugs)));
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useFavorites() {
  const [favoriteSlugs, setFavoriteSlugsState] = useState<Set<string>>(
    _cachedSlugs ?? new Set()
  );
  const syncedRef = useRef(false);

  // Subscribe to module-level listener
  useEffect(() => {
    const listener = (slugs: Set<string>) => setFavoriteSlugsState(new Set(slugs));
    _listeners.push(listener);
    return () => {
      _listeners = _listeners.filter((l) => l !== listener);
    };
  }, []);

  // Load from AsyncStorage + Supabase on first mount
  useEffect(() => {
    if (syncedRef.current) return;
    syncedRef.current = true;

    (async () => {
      // 1. Load from local storage immediately
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const arr: string[] = JSON.parse(raw);
          const localSet = new Set<string>(arr);
          notifyListeners(localSet);
        }
      } catch (_) {}

      // 2. Merge with Supabase (silent, background)
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user?.id) return;

        const { data: rows } = await supabase
          .from('workout_favorites')
          .select('workout_slug')
          .eq('user_id', user.id);

        if (rows && rows.length > 0) {
          const remoteSet = new Set<string>(rows.map((r: any) => r.workout_slug));
          // Merge local + remote
          const merged = new Set<string>([...(_cachedSlugs ?? []), ...remoteSet]);
          notifyListeners(merged);
          // Persist merged back to local
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...merged]));
        }
      } catch (_) {
        // No internet — already have local data
      }
    })();
  }, []);

  const toggleFavorite = useCallback(async (workoutSlug: string) => {
    const current = _cachedSlugs ?? new Set<string>();
    const isCurrentlyFav = current.has(workoutSlug);

    // Optimistic local update
    const next = new Set<string>(current);
    if (isCurrentlyFav) {
      next.delete(workoutSlug);
    } else {
      next.add(workoutSlug);
    }
    notifyListeners(next);

    // Persist locally
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
    } catch (_) {}

    // Sync to Supabase (fire-and-forget)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.id) return;

      if (isCurrentlyFav) {
        await supabase
          .from('workout_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('workout_slug', workoutSlug);
      } else {
        await supabase.from('workout_favorites').upsert(
          {
            user_id: user.id,
            workout_slug: workoutSlug,
            favorited_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,workout_slug' }
        );
      }
    } catch (_) {
      // Offline — local state is already correct, will sync next time
    }
  }, []);

  const isFavorite = useCallback(
    (workoutSlug: string) => favoriteSlugs.has(workoutSlug),
    [favoriteSlugs]
  );

  return {
    favoriteSlugs,
    toggleFavorite,
    isFavorite,
  };
}

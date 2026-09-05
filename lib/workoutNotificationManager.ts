import { Platform } from 'react-native';
import { WorkoutSessionMetadata } from './workoutSessionManager';

class WorkoutNotificationManager {
  private permissionGranted: boolean = false;
  private activeNotification: any = null;
  private lastUpdateMs: number = 0;

  constructor() {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'Notification' in window) {
      this.permissionGranted = Notification.permission === 'granted';
    }
  }

  /**
   * Prompts the user for notification permissions.
   * Best called during a user gesture (like clicking "Start Workout").
   */
  public async requestPermission(): Promise<boolean> {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }

    try {
      if (Notification.permission === 'granted') {
        this.permissionGranted = true;
        return true;
      }

      if (Notification.permission !== 'denied') {
        const status = await Notification.requestPermission();
        this.permissionGranted = status === 'granted';
        return this.permissionGranted;
      }
    } catch (_) {}

    return false;
  }

  /**
   * Display or update the ongoing lock screen notification with current workout progress
   */
  public async showOrUpdate(metadata: WorkoutSessionMetadata): Promise<void> {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    // Check permission state if not known
    if (!this.permissionGranted && 'Notification' in window) {
      this.permissionGranted = Notification.permission === 'granted';
    }

    if (!this.permissionGranted) return;

    const {
      workoutTitle,
      currentExerciseName,
      currentExerciseIndex,
      totalExercises,
      currentSetIndex,
      totalSetsInExercise,
      completedSetsTotal,
      totalSetsAll,
      isPaused,
    } = metadata;

    const title = isPaused
      ? `⏸️ Paused • ${workoutTitle || 'FortyWell Workout'}`
      : `🟢 Active • ${workoutTitle || 'FortyWell Workout'}`;

    const exLabel = totalExercises > 1 ? `Ex ${currentExerciseIndex + 1}/${totalExercises}: ` : '';
    const setLabel = totalSetsInExercise > 0 ? `Set ${currentSetIndex + 1}/${totalSetsInExercise}` : '';
    const overallLabel = totalSetsAll > 0 ? `(${completedSetsTotal}/${totalSetsAll} done)` : '';

    const bodyParts = [
      `${exLabel}${currentExerciseName || 'In Progress'}`,
      setLabel,
      overallLabel,
    ].filter(Boolean);

    const body = bodyParts.join(' • ');

    const options = {
      body,
      icon: '/apple-touch-icon.png',
      badge: '/apple-touch-icon.png',
      tag: 'active-workout',
      renotify: false,
      silent: true,
      requireInteraction: true,
      data: { url: '/' },
    };

    // 1. Try sending via Service Worker (preferred for Mobile Chrome / Android / iOS PWA)
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (registration && registration.active) {
          registration.active.postMessage({
            type: 'SHOW_WORKOUT_NOTIFICATION',
            title,
            options,
          });
          return;
        }
      } catch (_) {}
    }

    // 2. Fallback to direct Window Notification
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        if (this.activeNotification) {
          try {
            this.activeNotification.close();
          } catch (_) {}
        }
        this.activeNotification = new Notification(title, options);
      }
    } catch (_) {}
  }

  /**
   * Clear the active workout notification from the lock screen
   */
  public async clear(): Promise<void> {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    // 1. Tell Service Worker to dismiss notification
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (registration && registration.active) {
          registration.active.postMessage({
            type: 'CLEAR_WORKOUT_NOTIFICATION',
          });
        }
      } catch (_) {}
    }

    // 2. Clear window notification instance if any
    if (this.activeNotification) {
      try {
        this.activeNotification.close();
      } catch (_) {}
      this.activeNotification = null;
    }
  }
}

export const workoutNotificationManager = new WorkoutNotificationManager();

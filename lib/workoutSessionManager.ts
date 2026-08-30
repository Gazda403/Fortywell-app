/**
 * workoutSessionManager.ts
 * ─────────────────────────────────────────────────────────────
 * FortyWell Background Workout & Media Session Engine
 *
 * Provides:
 * 1. Screen Wake Lock API — keeps phone screen awake during active exercise.
 * 2. Background Audio Keep-Alive — prevents mobile browsers (iOS WebKit / Android Chrome)
 *    from throttling/suspending the tab when the phone locks or is switched away.
 * 3. Media Session API (Spotify-style Lock Screen Controls) — displays rich workout
 *    notification on iOS Lock Screen, Dynamic Island, Android Notification shade,
 *    and Bluetooth headsets, with action handlers (Next Set, Pause, Resume).
 * 4. Accurate Wall-Clock synchronization.
 */

import { Platform } from 'react-native';

// 1-second silent WAV base64 data URI to keep the audio pipeline open in background
const SILENT_AUDIO_URI =
  'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

export interface WorkoutSessionMetadata {
  workoutTitle: string;
  workoutSlug?: string;
  currentExerciseName: string;
  currentExerciseIndex: number;
  totalExercises: number;
  currentSetIndex: number;
  totalSetsInExercise: number;
  currentSetReps: string;
  currentSetWeight?: string;
  completedSetsTotal: number;
  totalSetsAll: number;
  elapsedSeconds: number;
  isPaused: boolean;
  exerciseImageUrl?: string;
}

export interface WorkoutSessionCallbacks {
  onNextSet?: () => void;
  onPrevSet?: () => void;
  onTogglePause?: () => void;
  onFinish?: () => void;
}

class WorkoutSessionManager {
  private isRunning: boolean = false;
  private wakeLockSentinel: any = null;
  private audioElement: HTMLAudioElement | null = null;
  private callbacks: WorkoutSessionCallbacks = {};
  private currentMetadata: WorkoutSessionMetadata | null = null;
  private visibilityHandler: (() => void) | null = null;

  /**
   * Start or resume background session with Screen Wake Lock & Media Controls
   */
  public async startSession(
    initialMetadata: WorkoutSessionMetadata,
    callbacks: WorkoutSessionCallbacks
  ): Promise<void> {
    this.callbacks = callbacks;
    this.currentMetadata = initialMetadata;
    this.isRunning = true;

    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    // 1. Initialize Screen Wake Lock
    await this.requestWakeLock();

    // 2. Setup Visibility Listener for wake lock auto-reacquisition
    this.setupVisibilityListener();

    // 3. Start Background Audio Keep-Alive
    this.startAudioKeepAlive();

    // 4. Register Media Session (Spotify-style Lockscreen Card)
    this.updateMediaSession(initialMetadata);
  }

  /**
   * Update active exercise/set info displayed on the lock screen / notification
   */
  public updateMediaSession(metadata: WorkoutSessionMetadata): void {
    this.currentMetadata = metadata;
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    if (!('mediaSession' in navigator)) return;

    try {
      const {
        workoutTitle,
        currentExerciseName,
        currentExerciseIndex,
        totalExercises,
        currentSetIndex,
        totalSetsInExercise,
        currentSetReps,
        currentSetWeight,
        completedSetsTotal,
        totalSetsAll,
        isPaused,
      } = metadata;

      const exerciseProgress = totalExercises > 0 ? `Ex ${currentExerciseIndex + 1}/${totalExercises}: ` : '';
      const setProgress = totalSetsInExercise > 0 ? `Set ${currentSetIndex + 1}/${totalSetsInExercise}` : '';
      const weightDetail = currentSetWeight && currentSetWeight.trim() ? ` (${currentSetWeight} kg)` : '';
      const repsDetail = currentSetReps ? ` • ${currentSetReps} reps${weightDetail}` : '';
      const overallProgress = totalSetsAll > 0 ? ` [${completedSetsTotal}/${totalSetsAll} sets done]` : '';

      navigator.mediaSession.metadata = new MediaMetadata({
        title: workoutTitle || 'FortyWell Active Workout',
        artist: `${exerciseProgress}${currentExerciseName || 'Active Routine'}`,
        album: `${setProgress}${repsDetail}${overallProgress}`,
        artwork: [
          { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
          { src: '/web-app-manifest-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/web-app-manifest-512x512.png', sizes: '512x512', type: 'image/png' },
        ],
      });

      navigator.mediaSession.playbackState = isPaused ? 'paused' : 'playing';

      // Attach system lockscreen action listeners
      this.attachMediaSessionHandlers();
    } catch (_) {}
  }

  /**
   * Screen Wake Lock API: Prevent phone from dimming/sleeping during workout
   */
  private async requestWakeLock(): Promise<void> {
    if (Platform.OS !== 'web' || typeof navigator === 'undefined') return;
    if (!('wakeLock' in navigator)) return;

    try {
      // If already active, don't re-request
      if (this.wakeLockSentinel && !this.wakeLockSentinel.released) return;

      this.wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
      this.wakeLockSentinel.addEventListener('release', () => {
        // Released (e.g. user briefly backgrounded)
      });
    } catch (_) {}
  }

  private async releaseWakeLock(): Promise<void> {
    if (this.wakeLockSentinel) {
      try {
        await this.wakeLockSentinel.release();
      } catch (_) {}
      this.wakeLockSentinel = null;
    }
  }

  /**
   * Listen to tab visibility to restore wake lock and keep state synced
   */
  private setupVisibilityListener(): void {
    if (typeof document === 'undefined') return;

    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
    }

    this.visibilityHandler = () => {
      if (document.visibilityState === 'visible' && this.isRunning) {
        this.requestWakeLock();
        if (this.currentMetadata) {
          this.updateMediaSession(this.currentMetadata);
        }
      }
    };

    document.addEventListener('visibilitychange', this.visibilityHandler);
  }

  /**
   * Start a looping audio element to maintain active WebKit / Chrome media context
   */
  private startAudioKeepAlive(): void {
    if (typeof document === 'undefined') return;

    try {
      if (!this.audioElement) {
        this.audioElement = document.createElement('audio');
        this.audioElement.src = SILENT_AUDIO_URI;
        this.audioElement.loop = true;
        this.audioElement.volume = 0.01;
        this.audioElement.setAttribute('playsinline', 'true');
        this.audioElement.setAttribute('webkit-playsinline', 'true');
        this.audioElement.style.display = 'none';
        document.body.appendChild(this.audioElement);
      }

      this.audioElement.play().catch(() => {
        // Autoplay may wait for user interaction, which is triggered when starting workout
      });
    } catch (_) {}
  }

  private stopAudioKeepAlive(): void {
    if (this.audioElement) {
      try {
        this.audioElement.pause();
        this.audioElement.currentTime = 0;
        if (this.audioElement.parentNode) {
          this.audioElement.parentNode.removeChild(this.audioElement);
        }
      } catch (_) {}
      this.audioElement = null;
    }
  }

  /**
   * Attach hardware / lockscreen handlers (Lockscreen Next, Prev, Play, Pause)
   */
  private attachMediaSessionHandlers(): void {
    if (!('mediaSession' in navigator)) return;

    try {
      navigator.mediaSession.setActionHandler('play', () => {
        if (this.callbacks.onTogglePause) this.callbacks.onTogglePause();
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        if (this.callbacks.onTogglePause) this.callbacks.onTogglePause();
      });

      // "Next Track" -> Checked current set and moves forward!
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        if (this.callbacks.onNextSet) this.callbacks.onNextSet();
      });

      // "Previous Track" -> Goes to previous set
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        if (this.callbacks.onPrevSet) this.callbacks.onPrevSet();
      });

      navigator.mediaSession.setActionHandler('stop', () => {
        if (this.callbacks.onFinish) this.callbacks.onFinish();
      });
    } catch (_) {}
  }

  /**
   * End workout session and release all locks and media players
   */
  public endSession(): void {
    this.isRunning = false;
    this.currentMetadata = null;
    this.callbacks = {};

    this.releaseWakeLock();
    this.stopAudioKeepAlive();

    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'mediaSession' in navigator) {
      try {
        navigator.mediaSession.playbackState = 'none';
        navigator.mediaSession.metadata = null;
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
        navigator.mediaSession.setActionHandler('nexttrack', null);
        navigator.mediaSession.setActionHandler('previoustrack', null);
        navigator.mediaSession.setActionHandler('stop', null);
      } catch (_) {}
    }

    if (typeof document !== 'undefined' && this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = null;
    }
  }
}

export const workoutSessionManager = new WorkoutSessionManager();

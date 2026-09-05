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
import { workoutNotificationManager } from './workoutNotificationManager';

function getSilentAudioSource(): string {
  try {
    if (typeof window !== 'undefined' && typeof Blob !== 'undefined') {
      const sampleRate = 8000;
      const numSamples = sampleRate * 2; // 2 seconds of valid audio
      const buffer = new ArrayBuffer(44 + numSamples);
      const view = new DataView(buffer);
      view.setUint32(0, 0x52494646, false); // 'RIFF'
      view.setUint32(4, 36 + numSamples, true);
      view.setUint32(8, 0x57415645, false); // 'WAVE'
      view.setUint32(12, 0x666d7420, false); // 'fmt '
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true); // PCM
      view.setUint16(22, 1, true); // Mono
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate, true);
      view.setUint16(32, 1, true);
      view.setUint16(34, 8, true); // 8-bit
      view.setUint32(36, 0x64617461, false); // 'data'
      view.setUint32(40, numSamples, true);
      new Uint8Array(buffer, 44).fill(128); // Midpoint silence
      return URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }));
    }
  } catch (_) {}
  return 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
}

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
   * MUST be called directly inside a user tap/click handler (e.g. "Start Workout" button).
   * Browsers block audio autoplay unless triggered synchronously during a user gesture.
   * This primes the audio context so MediaSession lock screen controls will appear.
   */
  public primeAudio(): void {
    if (Platform.OS !== 'web' || typeof document === 'undefined' || !document.body) return;

    // Prompt for notification permission during the user gesture
    workoutNotificationManager.requestPermission().catch(() => {});

    try {
      if (!this.audioElement) {
        this.audioElement = document.createElement('audio');
        this.audioElement.src = getSilentAudioSource();
        this.audioElement.loop = true;
        this.audioElement.volume = 0.01;
        this.audioElement.setAttribute('playsinline', 'true');
        this.audioElement.setAttribute('webkit-playsinline', 'true');
        this.audioElement.setAttribute('preload', 'auto');
        this.audioElement.style.display = 'none';
        document.body.appendChild(this.audioElement);
      }

      // This play() call works because we are inside a user gesture
      this.audioElement.play().catch(() => {});
    } catch (_) {}
  }

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

    // Request notification permission & display initial active workout lock screen card
    workoutNotificationManager.requestPermission().catch(() => {});
    workoutNotificationManager.showOrUpdate(initialMetadata);

    // 1. Initialize Screen Wake Lock
    await this.requestWakeLock();

    // 2. Setup Visibility Listener for wake lock auto-reacquisition
    this.setupVisibilityListener();

    // 3. Start Background Audio Keep-Alive (if not already primed via primeAudio())
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

    // Update lock screen system notification
    workoutNotificationManager.showOrUpdate(metadata);

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

      if (typeof window !== 'undefined' && 'MediaMetadata' in window) {
        navigator.mediaSession.metadata = new (window as any).MediaMetadata({
          title: workoutTitle || 'FortyWell Active Workout',
          artist: `${exerciseProgress}${currentExerciseName || 'Active Routine'}`,
          album: `${setProgress}${repsDetail}${overallProgress}`,
          artwork: [
            { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
            { src: '/web-app-manifest-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: '/web-app-manifest-512x512.png', sizes: '512x512', type: 'image/png' },
          ],
        });
      }

      if ('playbackState' in navigator.mediaSession) {
        navigator.mediaSession.playbackState = isPaused ? 'paused' : 'playing';
      }

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
      if (this.wakeLockSentinel) {
        this.wakeLockSentinel.addEventListener('release', () => {
          // Released (e.g. user briefly backgrounded)
        });
      }
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
      if (!this.isRunning) return;

      if (document.visibilityState === 'visible') {
        this.requestWakeLock();
        if (this.currentMetadata) {
          this.updateMediaSession(this.currentMetadata);
        }
      } else if (document.visibilityState === 'hidden') {
        // Phone screen just locked or user switched apps -> push fresh lock screen update
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
    if (typeof document === 'undefined' || !document.body) return;

    try {
      if (!this.audioElement) {
        this.audioElement = document.createElement('audio');
        this.audioElement.src = getSilentAudioSource();
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

    const setHandler = (action: MediaSessionAction, handler: (() => void) | null) => {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch (_) {}
    };

    setHandler('play', () => {
      if (this.callbacks.onTogglePause) this.callbacks.onTogglePause();
    });

    setHandler('pause', () => {
      if (this.callbacks.onTogglePause) this.callbacks.onTogglePause();
    });

    // "Next Track" -> Checked current set and moves forward!
    setHandler('nexttrack', () => {
      if (this.callbacks.onNextSet) this.callbacks.onNextSet();
    });

    // "Previous Track" -> Goes to previous set
    setHandler('previoustrack', () => {
      if (this.callbacks.onPrevSet) this.callbacks.onPrevSet();
    });

    setHandler('stop', () => {
      if (this.callbacks.onFinish) this.callbacks.onFinish();
    });
  }

  /**
   * End workout session and release all locks and media players
   */
  public endSession(): void {
    this.isRunning = false;
    this.currentMetadata = null;
    this.callbacks = {};

    // Dismiss active workout lock screen notification
    workoutNotificationManager.clear();

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

/**
 * FortyWell Sound & Audio Engine
 * ─────────────────────────────────────────────────────────────
 * Provides restorative, studio-grade audio synthesis for workout
 * milestones, set completions, streak celebrations, and interactive cues.
 * Uses Web Audio API for zero-latency, beautiful harmonic chords with
 * soft decay envelopes, without needing external network audio assets.
 */

import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

let soundEffectsEnabled = true;
let hapticsEnabled = true;

export function setSoundEffectsEnabled(enabled: boolean) {
  soundEffectsEnabled = enabled;
}

export function setHapticsEnabled(enabled: boolean) {
  hapticsEnabled = enabled;
}

// Audio Context Singleton for Web
let audioCtx: any = null;

function getAudioContext(): any {
  if (Platform.OS !== "web") return null;
  try {
    if (typeof window === "undefined") return null;
    const AudioContextClass =
      (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    return audioCtx;
  } catch (_) {
    return null;
  }
}

/**
 * Synthesize a warm harmonic chime chord with natural decay
 */
function playToneChord(
  freqs: number[],
  duration: number = 1.6,
  type: OscillatorType = "sine",
  volume: number = 0.15
) {
  if (!soundEffectsEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  freqs.forEach((freq, idx) => {
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);

      const startTime = now + idx * 0.04;
      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.exponentialRampToValueAtTime(volume / freqs.length, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.00001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration + 0.1);
    } catch (_) {}
  });
}

/**
 * ── WORKOUT MILESTONE CELEBRATION CHIME ──
 * Glorious, restorative major 9th crystal chord (F4, A4, C5, E5, G5)
 * Inspired by luxury wellness spas and Tibetan singing bowls
 */
export function playWorkoutCelebrationChime() {
  if (hapticsEnabled) {
    try {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (_) {}
  }

  // 349.23Hz (F4), 440.0Hz (A4), 523.25Hz (C5), 659.25Hz (E5), 783.99Hz (G5)
  playToneChord([349.23, 440.0, 523.25, 659.25, 783.99], 2.8, "sine", 0.22);
}

/**
 * ── SET COMPLETED / CHECKED AUDIO ──
 * Crisp, uplifting dual-tone glass ping
 */
export function playSetCompleteSound() {
  if (hapticsEnabled) {
    try {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (_) {}
  }

  playToneChord([587.33, 880.0], 0.6, "sine", 0.12);
}

/**
 * ── STREAK / GARDEN BLOOM CHIME ──
 * Ascending golden triad (C5 -> E5 -> G5 -> C6)
 */
export function playStreakMilestoneSound() {
  if (hapticsEnabled) {
    try {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (_) {}
  }

  const ctx = getAudioContext();
  if (!ctx || !soundEffectsEnabled) return;
  const now = ctx.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.5];

  notes.forEach((freq, i) => {
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + i * 0.09);

      const st = now + i * 0.09;
      gain.gain.setValueAtTime(0.0001, st);
      gain.gain.exponentialRampToValueAtTime(0.12, st + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.00001, st + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(st);
      osc.stop(st + 1.3);
    } catch (_) {}
  });
}

/**
 * ── TIMER COUNTDOWN / REST INTERVAL BEEP ──
 * Calming wooden metronome tick
 */
export function playTimerIntervalSound() {
  playToneChord([440.0], 0.18, "triangle", 0.08);
}

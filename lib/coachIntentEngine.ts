import { supabase } from "./supabase";
import { OnboardingAnswers } from "../types/onboarding";

export type IntentType =
  | "goal_preference"
  | "feeling_checkin"
  | "workout_request"
  | "question"
  | "general_chat";

export interface TrainingPreference {
  muscleGroup?: string;
  intensityDesire?: "light" | "moderate" | "heavy";
  goalType?: "strength" | "mobility" | "endurance" | "flexibility" | "fat_loss";
  rawText: string;
  savedAt: string;
}

export interface IntentResult {
  intent: IntentType;
  confidence: number;
  coachReply: string;
  shouldSaveToDb: boolean;
  trainingPreference?: TrainingPreference;
  extractedTopics?: string[];
}

const MUSCLE_KEYWORDS: Record<string, string> = {
  glute: "glutes", glutes: "glutes", booty: "glutes", "hip thrust": "glutes",
  bulgarian: "glutes", "posterior chain": "glutes",
  leg: "legs", legs: "legs", quad: "legs", quads: "legs", hamstring: "legs",
  hamstrings: "legs", squat: "legs", deadlift: "legs", lunge: "legs",
  core: "core", abs: "core", ab: "core", plank: "core", "pelvic floor": "core",
  "upper body": "upper body", shoulder: "upper body", shoulders: "upper body",
  arm: "upper body", arms: "upper body", chest: "upper body",
  "full body": "full body", "whole body": "full body",
};

const GOAL_KEYWORDS: Record<string, TrainingPreference["goalType"]> = {
  strength: "strength", strong: "strength", "build muscle": "strength", lift: "strength",
  mobility: "mobility", flexible: "flexibility", flexibility: "flexibility", stretch: "flexibility",
  endurance: "endurance", cardio: "endurance", stamina: "endurance",
  "fat loss": "fat_loss", "lose weight": "fat_loss", burn: "fat_loss", lean: "fat_loss",
};

const INTENSITY_KEYWORDS: Record<string, TrainingPreference["intensityDesire"]> = {
  light: "light", easy: "light", gentle: "light", recovery: "light",
  moderate: "moderate", medium: "moderate",
  heavy: "heavy", hard: "heavy", intense: "heavy", challenging: "heavy",
};

const GOAL_TRIGGERS = [
  "i want to", "i want more", "i'd like to", "let's focus on",
  "focus on", "work on", "train my", "train the", "build my",
  "target my", "target the", "can we do more", "more of",
  "prioritize", "next week", "going forward", "from now on",
];

const WORKOUT_REQUEST_TRIGGERS = [
  "give me a workout", "what should i do", "workout today",
  "today's workout", "what do you recommend", "plan for today",
  "exercise today", "what exercise", "should i train", "make me a",
];

const QUESTION_TRIGGERS = [
  "what is", "what are", "how do", "how does", "why do", "why does",
  "can you explain", "explain", "tell me about", "how many",
  "how often", "what does", "is it okay",
];

const FEELING_TRIGGERS = [
  "feeling", "feel", "sore", "tired", "exhausted", "hurt", "pain",
  "slept", "sleep", "energy is", "low energy", "stressed", "anxious",
  "stiff", "tight", "ache",
];

export function detectIntent(input: string, answers?: OnboardingAnswers | null): IntentResult {
  const text = input.toLowerCase().trim();

  const hasGoalTrigger = GOAL_TRIGGERS.some((p) => text.includes(p));
  const detectedMuscle = Object.keys(MUSCLE_KEYWORDS).find((k) => text.includes(k));
  const detectedGoal = Object.keys(GOAL_KEYWORDS).find((k) => text.includes(k));

  if (hasGoalTrigger && (detectedMuscle || detectedGoal)) {
    const muscleGroup = detectedMuscle ? MUSCLE_KEYWORDS[detectedMuscle] : undefined;
    const goalType = detectedGoal ? GOAL_KEYWORDS[detectedGoal] : undefined;
    const intensityKey = Object.keys(INTENSITY_KEYWORDS).find((k) => text.includes(k));
    const intensityDesire = intensityKey ? INTENSITY_KEYWORDS[intensityKey] : undefined;
    const pref: TrainingPreference = { muscleGroup, goalType, intensityDesire, rawText: input, savedAt: new Date().toISOString() };
    return {
      intent: "goal_preference",
      confidence: 0.92,
      shouldSaveToDb: true,
      trainingPreference: pref,
      extractedTopics: [
        muscleGroup ? `Focus: ${muscleGroup}` : null,
        goalType ? `Goal: ${goalType}` : null,
        intensityDesire ? `Intensity: ${intensityDesire}` : null,
      ].filter(Boolean) as string[],
      coachReply: buildGoalReply(pref, answers),
    };
  }

  if (WORKOUT_REQUEST_TRIGGERS.some((t) => text.includes(t))) {
    return { intent: "workout_request", confidence: 0.88, shouldSaveToDb: false, coachReply: buildWorkoutReply(answers) };
  }

  if (QUESTION_TRIGGERS.some((t) => text.includes(t))) {
    return { intent: "question", confidence: 0.85, shouldSaveToDb: false, coachReply: buildQuestionReply(text, answers) };
  }

  if (FEELING_TRIGGERS.some((t) => text.includes(t))) {
    return { intent: "feeling_checkin", confidence: 0.87, shouldSaveToDb: true, coachReply: "" };
  }

  return { intent: "general_chat", confidence: 0.75, shouldSaveToDb: false, coachReply: buildGeneralReply(text, answers) };
}

function buildGoalReply(pref: TrainingPreference, answers?: OnboardingAnswers | null): string {
  const name = answers?.first_name ? `, ${answers.first_name.split(" ")[0]}` : "";
  const { muscleGroup, goalType, intensityDesire } = pref;

  if (muscleGroup === "glutes") {
    return `Love it${name}! Glute development is one of the most functional goals you can have — strong glutes protect your hips, knees, and lower back.\n\nI've saved this to your training profile. Starting next week your sessions will prioritize:\n• Bulgarian Split Squats — unilateral strength & balance\n• Hip Thrusts — peak glute contraction\n• Romanian Deadlifts — posterior chain lengthening\n• Glute Bridges — pelvic floor integration${intensityDesire ? `\n\nIntensity preference saved: ${intensityDesire}.` : ""}\n\nYour Rhythm schedule will reflect this going forward. Ready to build?`;
  }

  if (muscleGroup === "core") {
    return `Solid goal${name} — a strong core is the foundation of every other movement.\n\nI've logged this to your profile. Your upcoming sessions will feature:\n• Dead Bugs — anti-rotation stability\n• Pallof Press — lateral core bracing\n• Bird Dogs — spinal neutral control\n• Plank Variations — progressive endurance\n\nThis will carry into how your Rhythm plan is structured from now on.`;
  }

  if (muscleGroup === "legs") {
    return `Great call${name} — strong legs are your metabolic engine and joint protection.\n\nYour upcoming workouts will prioritize:\n• Squats & Lunges — load progression\n• Single-leg work — balance and symmetry\n• Romanian Deadlifts — hamstring balance\n\nSaved to your profile — this shapes your next training week!`;
  }

  if (muscleGroup === "upper body") {
    return `Excellent${name} — upper body strength improves posture and everyday function.\n\nSaved to your profile. Sessions will emphasize:\n• Push/Pull balance — rows, face pulls, pressing\n• Shoulder stability — overhead injury prevention\n• Scapular control — long-term shoulder health\n\nBalanced against your joint sensitivity profile to keep it sustainable.`;
  }

  if (goalType === "strength") {
    return `Strength is one of the best long-term investments you can make${name}.\n\nI've updated your training preference:\n• Progressive overload on compound lifts\n• Longer rest periods (90–120s) for quality reps\n• Volume tracking week to week\n\nYour upcoming sessions will reflect this shift. Let's build!`;
  }

  if (goalType === "flexibility" || goalType === "mobility") {
    return `Mobility is often the missing link${name} — it makes every movement safer and more effective.\n\nI've updated your profile. Sessions will include:\n• Deep joint mobility flows\n• Loaded stretching for fascial release\n• Breathwork-integrated cooldowns\n\nThis is now woven into your daily rhythm.`;
  }

  const focusLabel = muscleGroup || goalType || "your new focus";
  return `Got it${name} — I've saved **${focusLabel}** as a priority in your training profile.\n\nThis will influence workout selection and sequencing going forward. Your next recommendations will reflect this goal, and I'll track progress week to week.\n\nAnything else you'd like to adjust?`;
}

function buildWorkoutReply(answers?: OnboardingAnswers | null): string {
  const name = answers?.first_name ? answers.first_name.split(" ")[0] : "";
  const time = answers?.time_commitment;
  const location = answers?.training_location;
  const timeLabel = time === "15_min" ? "15 minutes" : time === "45_min" ? "45 minutes" : "25–30 minutes";
  const locationLabel = location === "gym" ? "at the gym" : "at home";
  return `Here's your personalized session for today${name ? `, ${name}` : ""} — built for ${timeLabel} ${locationLabel}.\n\nHead to the **Today** tab — your recommended workout is already queued and adapted to your profile and this week's rhythm.\n\nNeed me to adjust anything before you start?`;
}

function buildQuestionReply(text: string, answers?: OnboardingAnswers | null): string {
  if (text.includes("progressive overload")) {
    return `**Progressive overload** means gradually increasing the demand on your body so your muscles keep adapting.\n\nIn practice:\n• Add 1–2 reps per set each week\n• Add 1–2.5kg when your current weight feels easy\n• Reduce rest time while keeping the same load\n\nWithout progression, you plateau. With it, you grow. Small steps compound into big changes over months.`;
  }
  if (text.includes("warm up") || text.includes("warmup")) {
    return `A warmup prepares your nervous system, joints, and muscles for the load ahead.\n\nWithout it:\n• Cold muscles have lower force output\n• Joints lack lubrication (synovial fluid needs movement)\n• Injury risk spikes\n\nA good warmup: 3–5 min light movement, dynamic stretches for today's muscles, 1–2 activation sets. Always included in your FortyWell sessions.`;
  }
  if (text.includes("rest day") || text.includes("how often") || text.includes("how many days")) {
    const freq = answers?.weekly_frequency || "3–4 days";
    return `Based on your profile, you're working toward **${freq}** per week — which is ideal.\n\nRest days are when adaptation actually happens:\n• Muscle protein synthesis peaks 24–48h after training\n• The nervous system resets and rebuilds capacity\n• Sleep quality on rest days directly impacts next session strength\n\nI recommend gentle walks or mobility on rest days — not zero movement.`;
  }
  return `Great question. Every body responds differently, and the best answer accounts for your specific energy, joint sensitivity, and goals — all of which I'm tracking for you.\n\nShare a bit more context and I can give you a much more specific answer. What's prompting this today?`;
}

function buildGeneralReply(text: string, answers?: OnboardingAnswers | null): string {
  const name = answers?.first_name ? answers.first_name.split(" ")[0] : "";
  const greeting = name ? `Hey ${name}!` : "Hey!";
  if (text.includes("thank")) return `Of course — that's what I'm here for. Keep showing up, even on the days it feels small. Consistency is the real superpower. 💪`;
  if (text.includes("good morning") || text.includes("morning")) return `${greeting} Good morning! How's your body feeling today? Log your energy and mood above to personalize your session. Even 10 minutes of intentional movement can shift your entire day.`;
  if (text.includes("hello") || text.includes("hi ") || text.includes("hey")) return `${greeting} I'm here and ready to help you build a stronger, more resilient body — one session at a time.\n\nTell me how you're feeling, what you want to train, or just ask me anything about recovery, workouts, or your goals.`;
  return `${greeting} I'm listening. Tell me how you're feeling, what you want to work on, or ask me anything — I'm here to help you move better and feel stronger every day.`;
}

export async function saveTrainingPreference(userId: string, preference: TrainingPreference): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: profile } = await supabase.from("profiles").select("coach_training_preferences").eq("id", userId).maybeSingle();
    const existing: TrainingPreference[] = profile?.coach_training_preferences || [];
    const updated = [preference, ...existing].slice(0, 10);
    const { error } = await supabase.from("profiles").update({ coach_training_preferences: updated, updated_at: new Date().toISOString() }).eq("id", userId);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

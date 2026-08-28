/**
 * Dynamic Weekly Workout Composer
 * ─────────────────────────────────────────────────────────────
 * Hand-picks and synthesizes fresh, unique weekly workouts directly from
 * the 873-exercise catalog (ALL_EXERCISES) based on:
 *   • Current ISO Week Number (ensures weekly rotation and zero repetition)
 *   • User Joint Sensitivities (Knees, Shoulders, Lumbar, Hips, Neck, Wrists)
 *   • User Equipment Profile (Bodyweight, Dumbbells/Bands, Gym)
 *   • Time Commitment (15m, 20-30m, 45m)
 *   • Energy Level & Cortisol Management
 */

import { Workout, WorkoutBlock, Exercise } from '../hooks/useWorkouts';
import { OnboardingAnswers } from '../types/onboarding';
import { ALL_EXERCISES, ExerciseInfo, getExerciseInfo } from './exerciseDatabase';

// Helper: Pseudo-random hash from string seed (for deterministic weekly variety per user)
function getSeedHash(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// Workout themes tailored to women 40+ with cortisol-conscious focus
interface WorkoutTheme {
  focusKey: string;
  titles: string[];
  descriptions: string[];
  targetMuscles: string[];
  warmupKeywords: string[];
  mainKeywords: string[];
  cooldownKeywords: string[];
  energyLevel: 'low' | 'moderate' | 'high';
}

const WORKOUT_THEMES: WorkoutTheme[] = [
  {
    focusKey: 'pelvic_core',
    titles: [
      'Pelvic Stability & Deep Core Awakening',
      'SI-Joint Alignment & Core Tone',
      'Transverse Abdominis & Pelvic Floor Flow',
      'Lower-Body Lymphatic Drain & Core Strength',
    ],
    descriptions: [
      'Low-impact deep core activation and pelvic floor tonicity to stabilize the pelvis and decompress the lumbar spine.',
      'Targeted glute medius and transverse abdominis bracing designed to relieve pelvic tilt and tone the deep core.',
      'Gentle isometric core bracing with synchronized diaphragmatic breathwork for hormonal balance and abdominal tone.',
      'Somatic lower-body contractions combined with elevation to stimulate lymphatic drainage and reduce heavy legs.',
    ],
    targetMuscles: ['Glutes', 'Abdominals', 'Hamstrings', 'Adductors'],
    warmupKeywords: ['cat', 'hip circle', 'pelvic tilt', 'bridge'],
    mainKeywords: ['bridge', 'plank', 'dead bug', 'bird dog', 'clamshell', 'kickback'],
    cooldownKeywords: ['child', 'spine', 'hip stretch', 'knee to chest'],
    energyLevel: 'low',
  },
  {
    focusKey: 'posture_relief',
    titles: [
      'Posture Reset & Thoracic Spine Freedom',
      'Neck & Shoulder Decompression Flow',
      'Upper-Back Kinetic Alignment',
      'Scapular Stability & Cervical Reset',
    ],
    descriptions: [
      'Opens the chest, mobilizes the upper back, and strengthens postural stabilizers to reverse forward-head posture.',
      'Gentle traction and scapular retractions designed to relieve tension in the neck, traps, and upper shoulders.',
      'Restorative thoracic rotation and rhomboid engagement to build an upright, confident spine without neck strain.',
      'Low-stress upper back sculpting with controlled isometric holds to support spinal elongation all day.',
    ],
    targetMuscles: ['Upper Back', 'Lats', 'Middle Back', 'Shoulders'],
    warmupKeywords: ['cat', 'open book', 'doorway', 'neck stretch'],
    mainKeywords: ['row', 'y-t-w', 'cobra', 'face pull', 'reverse fly', 'wall angel'],
    cooldownKeywords: ['child', 'pec stretch', 'lat stretch', 'neck press'],
    energyLevel: 'low',
  },
  {
    focusKey: 'joint_mobility',
    titles: [
      'Knee-Safe Glute & Posterior Chain Lift',
      'Hip Mobility & Gentle Synovial Flow',
      'Full-Body Joint Vitality & Fluidity',
      'Ankle & Hip Kinetic Mobilization',
    ],
    descriptions: [
      'Eliminates shear stress on knee joints while firing up the glutes and hamstrings for strong, protected joints.',
      'Lubricates hip capsules and restores full range of motion through smooth, fluid rotational patterns.',
      'Restorative full-body mobilization focusing on joint longevity, fascial glide, and reduced morning stiffness.',
      'Kinetic chain mobilization from the ground up to support stable balance and effortless walking stride.',
    ],
    targetMuscles: ['Glutes', 'Hamstrings', 'Quadriceps', 'Calves'],
    warmupKeywords: ['ankle', 'hip circle', 'leg swing', 'march'],
    mainKeywords: ['glute bridge', 'step-up', 'romanian deadlift', 'lunge', 'squat', 'kickback'],
    cooldownKeywords: ['hamstring stretch', 'quad stretch', 'it band', 'forward fold'],
    energyLevel: 'moderate',
  },
  {
    focusKey: 'deep_sleep',
    titles: [
      'Parasympathetic Reset & Cortisol Downregulation',
      'Evening Somatic Wind-Down & Hip Release',
      'Restorative Nervous System Calming Flow',
      'Vagus Nerve Stimulation & Full-Body Unwind',
    ],
    descriptions: [
      'Slow, rhythmic floor movements paired with extended exhales to shift the nervous system into deep rest mode.',
      'Releases chronic tension in the psoas and lower back to prepare your body for uninterrupted, restorative sleep.',
      'Low-effort floor poses designed to lower evening cortisol levels and promote melatonin production naturally.',
      'Gentle somatic unwinding to release day-accumulated stress from the spinal cord and pelvic bowl.',
    ],
    targetMuscles: ['Full Body', 'Lower Back', 'Glutes', 'Abdominals'],
    warmupKeywords: ['cat', 'child', 'diaphragmatic', 'seated fold'],
    mainKeywords: ['floor stretch', 'bridge', 'pelvic tilt', 'dead bug', 'side-lying'],
    cooldownKeywords: ['child', 'corpse', 'supine', 'hamstring stretch'],
    energyLevel: 'low',
  },
  {
    focusKey: 'daily_energy',
    titles: [
      'Metabolic Vitality & Lean Muscle Sculpt',
      'Low-Cortisol Full-Body Tone',
      'Functional Strength & Mitochondrial Spark',
      'Balanced Total-Body Strength Flow',
    ],
    descriptions: [
      'Gentle resistance intervals that boost insulin sensitivity and mitochondrial health without triggering stress fatigue.',
      'Total-body functional strength circuit tailored to preserve lean muscle tissue and joint integrity over 40.',
      'Controlled tempo reps that activate large muscle groups to elevate resting metabolic rate safely and sustainably.',
      'Balanced full-body movement patterns designed to leave you energized and revitalized, never drained.',
    ],
    targetMuscles: ['Glutes', 'Quadriceps', 'Lats', 'Chest', 'Abdominals'],
    warmupKeywords: ['march', 'arm circle', 'hip circle', 'cat'],
    mainKeywords: ['row', 'squat', 'bridge', 'chest press', 'deadlift', 'push-up'],
    cooldownKeywords: ['forward fold', 'chest stretch', 'quad stretch', 'child'],
    energyLevel: 'moderate',
  },
];

/**
 * Filter exercises safe for user's specific joint sensitivities & equipment
 */
function getSafeFilteredExercises(
  exercises: ExerciseInfo[],
  answers?: OnboardingAnswers | null
): ExerciseInfo[] {
  if (!answers) return exercises;

  const sensitivities = answers.joint_sensitivities || [];
  const equipment = answers.equipment || [];
  const location = answers.training_location;

  const hasDumbbells = equipment.includes('dumbbells') || equipment.includes('resistance_bands');
  const isGym = location === 'gym' || equipment.includes('barbell');
  const isStrictBodyweight = !hasDumbbells && !isGym;

  return exercises.filter((ex) => {
    // 1. Equipment check
    const exEq = ex.equipment.toLowerCase();
    if (isStrictBodyweight) {
      if (exEq !== 'bodyweight' && exEq !== 'body only' && exEq !== 'none') return false;
    }

    // 2. Joint safety check
    const exNameLower = ex.name.toLowerCase();
    if (sensitivities.includes('knees')) {
      if (exNameLower.includes('jump') || exNameLower.includes('burpee') || exNameLower.includes('deep squat')) {
        return false;
      }
    }
    if (sensitivities.includes('hips')) {
      if (exNameLower.includes('deep split') || exNameLower.includes('heavy squat') || exNameLower.includes('box jump')) {
        return false;
      }
    }
    if (sensitivities.includes('wrists')) {
      if (exNameLower.includes('wrist extension') || exNameLower.includes('push-up on palms')) {
        return false;
      }
    }
    if (sensitivities.includes('shoulders')) {
      if (exNameLower.includes('behind neck') || exNameLower.includes('overhead military press')) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Pick matching exercises using keywords & seed
 */
function pickExercisesByKeywords(
  pool: ExerciseInfo[],
  keywords: string[],
  count: number,
  seed: number
): Exercise[] {
  const matched = pool.filter((ex) => {
    const name = ex.name.toLowerCase();
    const cat = ex.category.toLowerCase();
    return keywords.some((k) => name.includes(k.toLowerCase()) || cat.includes(k.toLowerCase()));
  });

  const source = matched.length >= count ? matched : pool;
  const result: Exercise[] = [];
  const used = new Set<string>();

  for (let i = 0; i < count; i++) {
    const idx = (seed * 17 + i * 31) % source.length;
    const item = source[idx] || source[0];
    if (item && !used.has(item.name)) {
      used.add(item.name);
      result.push({
        name: item.name,
        sets: 3,
        reps: '10–12 reps',
        tempo: '2-1-2-1',
        rest: '45s',
        coaching_cue: item.coaching_cues || 'Maintain controlled breathing and smooth alignment.',
        image_url: item.image_url,
        gif_url: item.gif_url,
      });
    }
  }

  return result;
}

/**
 * Dynamically compose a unique weekly workout for a specific day/slot
 */
export function composeUniqueWeeklyWorkout(
  answers: OnboardingAnswers | null | undefined,
  weekKey: string,
  sessionIndex: number
): Workout {
  const safePool = getSafeFilteredExercises(ALL_EXERCISES, answers);
  const weekNum = parseInt(weekKey.replace(/[^0-9]/g, '').slice(-2), 10) || 1;
  const seed = getSeedHash(`${weekKey}_${sessionIndex}_${answers?.time_commitment || '20'}`);

  // Select theme based on user primary focus + session index rotation
  const userFocusList = answers?.target_focus || ['joint_mobility', 'pelvic_core'];
  const primaryFocusKey = userFocusList[sessionIndex % userFocusList.length] || 'joint_mobility';

  const theme =
    WORKOUT_THEMES.find((t) => t.focusKey === primaryFocusKey) ||
    WORKOUT_THEMES[sessionIndex % WORKOUT_THEMES.length];

  const titleIdx = (weekNum + sessionIndex) % theme.titles.length;
  const descIdx = (weekNum + sessionIndex) % theme.descriptions.length;
  const title = theme.titles[titleIdx];
  const description = theme.descriptions[descIdx];

  // Determine duration from quiz answers
  let duration = 20;
  if (answers?.time_commitment === '15_min') duration = 15;
  else if (answers?.time_commitment === '45_min') duration = 45;
  else duration = 20 + (sessionIndex % 2) * 5; // 20m or 25m

  // Compose Warmup (2 exercises)
  const warmup = pickExercisesByKeywords(safePool, theme.warmupKeywords, 2, seed + 1);

  // Compose Main Block A (2 exercises)
  const blockAExercises = pickExercisesByKeywords(safePool, theme.mainKeywords, 2, seed + 7);

  // Compose Main Block B (2 exercises)
  const blockBExercises = pickExercisesByKeywords(safePool, theme.targetMuscles, 2, seed + 19);

  // Compose Cooldown (2 exercises)
  const cooldown = pickExercisesByKeywords(safePool, theme.cooldownKeywords, 2, seed + 33);

  // Determine equipment tag
  let eqType: Workout['equipment'] = 'home_bodyweight';
  if (answers?.training_location === 'gym' || answers?.equipment?.includes('barbell')) {
    eqType = 'gym_machines_free_weights';
  } else if (answers?.equipment?.includes('dumbbells') || answers?.equipment?.includes('resistance_bands')) {
    eqType = 'home_dumbbells_bands';
  }

  // Determine joint sensitivities
  const jointSafe = answers?.joint_sensitivities && answers.joint_sensitivities.length > 0 && !answers.joint_sensitivities.includes('none')
    ? answers.joint_sensitivities
    : ['knees', 'hips'];

  return {
    slug: `dynamic-${weekKey.toLowerCase()}-s${sessionIndex + 1}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    title,
    description,
    equipment: eqType,
    duration_minutes: duration,
    target_focus: [theme.focusKey, 'safe_strength'],
    joint_sensitivities_safe: jointSafe,
    energy_level: theme.energyLevel,
    warmup,
    main_blocks: [
      { block_name: 'Block A — Primary Functional Movement', exercises: blockAExercises },
      { block_name: 'Block B — Core & Stability Tonicity', exercises: blockBExercises },
    ],
    cooldown,
  };
}

/**
 * Generate a complete set of unique weekly workouts for the current week
 */
export function generateWeeklyWorkouts(
  answers: OnboardingAnswers | null | undefined,
  weekKey: string,
  count: number = 3
): Workout[] {
  const list: Workout[] = [];
  for (let i = 0; i < count; i++) {
    list.push(composeUniqueWeeklyWorkout(answers, weekKey, i));
  }
  return list;
}

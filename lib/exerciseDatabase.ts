import fullExercisesRaw from '../assets/full_exercises.json';

export interface RawExercise {
  id: string;
  name: string;
  force?: string;
  level?: string;
  mechanic?: string;
  equipment?: string;
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
  instructions?: string[];
  category?: string;
  images?: string[];
}

export interface ExerciseInfo {
  id: string;
  name: string;
  category: string;
  equipment: string;
  level: string;
  force?: string;
  mechanic?: string;
  joint_safety: string[];
  primary_muscles: string[];
  secondary_muscles: string[];
  image_url: string;
  gif_url?: string;
  description: string;
  instructions: string[];
  coaching_cues: string;
}

const GITHUB_RAW = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises';

function toCdnUrl(url: string): string {
  if (!url) return url;
  return url.replace(
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises',
    'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises'
  );
}

function capitalize(s: string): string {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');
}

// Convert raw exercise entry to rich ExerciseInfo
export function formatRawExercise(raw: RawExercise): ExerciseInfo {
  const primary = (raw.primaryMuscles || []).map(capitalize);
  const secondary = (raw.secondaryMuscles || []).map(capitalize);
  const imgPath = raw.images && raw.images.length > 0 ? raw.images[0] : `${raw.id}/0.jpg`;
  const gifPath = raw.images && raw.images.length > 1 ? raw.images[1] : imgPath;

  const jointSafety: string[] = ['Joint Conscious'];
  const eq = raw.equipment ? capitalize(raw.equipment) : 'Bodyweight';

  if (eq === 'Body only' || eq === 'Bodyweight') jointSafety.push('Low Impact');
  if (primary.includes('Glutes') || primary.includes('Hamstrings')) jointSafety.push('Knee Safe');
  if (primary.includes('Abdominals')) jointSafety.push('Lumbar Safe');

  return {
    id: raw.id,
    name: raw.name,
    category: raw.category ? capitalize(raw.category) : 'Strength',
    equipment: eq,
    level: raw.level ? capitalize(raw.level) : 'Beginner',
    force: raw.force ? capitalize(raw.force) : undefined,
    mechanic: raw.mechanic ? capitalize(raw.mechanic) : undefined,
    joint_safety: jointSafety,
    primary_muscles: primary.length > 0 ? primary : ['Full Body'],
    secondary_muscles: secondary,
    image_url: `${GITHUB_RAW}/${imgPath}`,
    gif_url: `${GITHUB_RAW}/${gifPath}`,
    description: (raw.instructions || []).slice(0, 2).join(' ') || `${raw.name} exercise protocol.`,
    instructions: raw.instructions && raw.instructions.length > 0 ? raw.instructions : [
      'Position yourself with correct spinal alignment and engaged core.',
      'Perform movement slowly under full muscular tension.',
      'Return smoothly to initial position.'
    ],
    coaching_cues: `Maintain steady breath. Keep movement controlled through full range of motion.`,
  };
}

// Index of all 873 formatted exercises
export const ALL_EXERCISES: ExerciseInfo[] = (fullExercisesRaw as RawExercise[]).map(formatRawExercise);

// Comprehensive alias mappings for custom/seed exercise names to verified free-exercise-db IDs
const ALIAS_MAP: Record<string, string> = {
  // Mobility, Warmups & Stretches
  'cat-cow segmental mobility': 'cat_stretch',
  'cat-cow + thread-the-needle': 'cat_stretch',
  'cat-cow': 'cat_stretch',
  'cat cow': 'cat_stretch',
  'cat stretch': 'cat_stretch',
  'lying hip circles': 'standing_hip_circles',
  'dynamic hip mobilization leg swings': 'one-legged_cable_kickback',
  'leg swing (forward/back)': 'one-legged_cable_kickback',
  'dynamic leg swings': 'one-legged_cable_kickback',
  'high-knee march in place': 'step-up_with_knee_raise',
  '1-min high-knee march': 'step-up_with_knee_raise',
  'brisk march in place': 'step-up_with_knee_raise',
  'thoracic foam roll': 'lower_back-smr',
  'foam roll thoracic spine': 'lower_back-smr',
  'open book stretch (side-lying)': 'side-lying_floor_stretch',
  'open book stretch': 'side-lying_floor_stretch',
  'prone cobra (arms at sides)': 'lower_back-smr',
  'wall angels (elbows low)': 'overhead_stretch',
  'wall angels (low elbow variation)': 'overhead_stretch',
  'prone y-t-w hold': 'middle_back_stretch',
  'quadruped shoulder tap': 'plank',
  'child\'s pose with diaphragmatic breathing': 'childs_pose',
  'seated neck side stretch': 'side_neck_stretch',
  'chin tuck + cervical retraction': 'neck_press',
  'standing hip flexor stretch': 'intermediate_hip_flexor_and_quad_stretch',
  'static hip flexor stretch': 'intermediate_hip_flexor_and_quad_stretch',
  'seated forward fold': 'seated_floor_hamstring_stretch',
  'standing forward fold': 'hamstring_stretch',
  '90/90 hip rotation (seated)': 'it_band_and_glute_stretch',
  '90/90 hip rotation flow': 'it_band_and_glute_stretch',
  '90/90 hip stretch': 'it_band_and_glute_stretch',
  'pelvic tilts': 'pelvic_tilt_into_bridge',
  'pelvic tilt': 'pelvic_tilt_into_bridge',
  'doorway pec stretch': 'behind_head_chest_stretch',
  'doorway pec stretch (low, mid, high position)': 'behind_head_chest_stretch',
  'doorframe row (bodyweight pull)': 'bodyweight_mid_row',
  'foam roller chest opening (t-spine extension)': 'chest_stretch_on_stability_ball',
  'ankle cars (controlled articular rotations)': 'ankle_circles',
  'wall ankle stretch (knee drives over pinky toe)': 'calf_stretch_hands_against_wall',
  'calf stretch on step': 'calf_stretch_hands_against_wall',
  'deep achilles stretch (knee bent, heel down)': 'calf_stretch_elbows_against_wall',
  'lat stretch (wall assisted)': 'latissimus_dorsi-smr',
  'chest opening stretch on foam roller': 'chest_stretch_on_stability_ball',
  'forearm stretch (both directions)': 'wrist_circles',
  'full-body roll-down stretch': 'dynamic_back_stretch',

  // Core & Glute Bridges
  'iso-hold glute bridge with heel drive': 'butt_lift_bridge',
  'bilateral glute bridge (slow)': 'butt_lift_bridge',
  'banded glute bridge with dumbbell on hips': 'butt_lift_bridge',
  'supported bridge pose (pillow under sacrum)': 'butt_lift_bridge',
  'single-leg glute bridge': 'single_leg_glute_bridge',
  'single leg glute bridge': 'single_leg_glute_bridge',
  'deadbug with opposite arm/leg reach': 'dead_bug',
  'deadbug': 'dead_bug',
  'slow-motion deadbug (3-second pace)': 'dead_bug',
  'lying clamshells': 'side_bridge',
  'clamshell': 'side_bridge',
  'clamshell (controlled)': 'side_bridge',
  'bird-dog hold': 'bent-knee_hip_raise',
  'bird-dog (anti-rotation focus)': 'bent-knee_hip_raise',
  'bird-dog': 'bent-knee_hip_raise',
  'side-lying hip abduction': 'side_bridge',
  'banded hip abduction (standing)': 'standing_hip_circles',
  'lying figure-4 glute stretch': 'it_band_and_glute_stretch',
  'lying figure-4 (piriformis release)': 'piriformis-smr',
  'figure-4 glute stretch': 'it_band_and_glute_stretch',
  'pigeon pose (or figure-4 if knee sensitive)': 'it_band_and_glute_stretch',
  'pigeon pose (or figure-4)': 'it_band_and_glute_stretch',
  'supine spinal twist': 'russian_twist',
  'lying knee-to-chest hug (both legs)': 'knee_across_the_body',
  'mcgill modified curl-up': 'crunches',
  'pilates toe taps': 'bent-knee_hip_raise',
  'forearm plank with hip dip': 'plank',

  // Strength & Conditioning
  'bodyweight box squat': 'box_squat',
  'dumbbell bulgarian split squat': 'dumbbell_lunges',
  'reverse lunge (slow eccentric)': 'crossover_reverse_lunge',
  'incline push-up on counter': 'incline_push-up',
  'band pull-apart (chest level)': 'band_pull_apart',
  'band pull-apart (chest height)': 'band_pull_apart',
  'dumbbell bent-over row': 'bent_over_two-dumbbell_row',
  'dumbbell bent-over row (heavy)': 'bent_over_two-dumbbell_row',
  'chest-supported dumbbell row': 'bent_over_two-dumbbell_row',
  'dumbbell kickback (hip extension)': 'one-legged_cable_kickback',
  'dumbbell overhead press (seated)': 'seated_dumbbell_press',
  'farmer\'s carry (bilateral)': 'farmers_walk',
  'single-leg romanian deadlift touch-down': 'romanian_deadlift',
  'band chest press (forearm loop)': 'pushups',
  'band lateral raise (ankle cuff on wrist)': 'side_lateral_raise',
  'hammer curl (neutral grip)': 'hammer_curls',
  'overhead tricep extension (band)': 'standing_dumbbell_triceps_extension',
  '5-min incline treadmill walk': 'walking_treadmill',
  'barbell back squat': 'barbell_squat',
  'cable pull-through (glute hinge)': 'pull_through',
  'cable pull-through (hip hinge)': 'pull_through',
  'chest press machine': 'leverage_chest_press',
  'lat pulldown (wide grip)': 'wide-grip_lat_pulldown',
  'seated cable row (close grip)': 'seated_cable_rows',
  'dumbbell incline press': 'incline_dumbbell_press',
  'pec deck / machine fly (forearms on pads)': 'butterfly',
  'cable lateral raise (ankle cuff on forearm)': 'side_lateral_raise',
  'machine row (neutral grip handles)': 'seated_cable_rows',
  'banded spanish squat (band behind knees)': 'bodyweight_squat',
  'terminal knee extension (band tke)': 'bodyweight_squat',
  'lateral dumbbell step-up (low box, slow eccentric)': 'step-up_with_knee_raise',
  'brisk bike or rower': 'rowing_stationary',
  'deep squat hold with ankle oscillation': 'bodyweight_squat',

  // Relaxation & Breathing
  '4-7-8 breathing': 'childs_pose',
  'box breathing (4-4-4-4)': 'childs_pose',
  'savasana with diaphragmatic breathing': 'childs_pose',
  'savasana': 'childs_pose',
  'legs-up-the-wall (viparita karani)': 'seated_floor_hamstring_stretch'
};

// Fast map for O(1) lookup by exact name or ID
const EXERCISE_MAP: Record<string, ExerciseInfo> = {};
ALL_EXERCISES.forEach((ex) => {
  EXERCISE_MAP[ex.name.toLowerCase()] = ex;
  EXERCISE_MAP[ex.id.toLowerCase()] = ex;
});

// Map aliases to database entries
Object.entries(ALIAS_MAP).forEach(([alias, targetId]) => {
  const lowerTarget = targetId.toLowerCase();
  if (EXERCISE_MAP[lowerTarget]) {
    EXERCISE_MAP[alias.toLowerCase()] = EXERCISE_MAP[lowerTarget];
  }
});

/**
 * Intelligent keyword-based heuristic matcher for unmapped exercises
 */
function findClosestExercise(query: string): ExerciseInfo {
  const q = query.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const words = q.split(' ').filter(w => w.length > 2 && !['with', 'and', 'for', 'the', 'low', 'high', 'side', 'slow', 'both', 'into', 'from'].includes(w));

  let best: ExerciseInfo = ALL_EXERCISES[0];
  let maxScore = -1;

  for (const ex of ALL_EXERCISES) {
    const exName = ex.name.toLowerCase();
    const exId = ex.id.toLowerCase();
    let score = 0;

    if (exName === q || exId === q) score += 100;
    if (exName.includes(q) || q.includes(exName)) score += 50;

    for (const w of words) {
      if (exName.includes(w)) score += 10;
      if (exId.includes(w)) score += 10;
    }

    if (score > maxScore) {
      maxScore = score;
      best = ex;
    }
  }
  return best;
}

/**
 * Get detailed exercise info by name or ID, guaranteed to return working images
 */
export function getExerciseInfo(name: string): ExerciseInfo {
  if (!name) return ALL_EXERCISES[0];

  const lower = name.toLowerCase().trim();
  if (EXERCISE_MAP[lower]) {
    const res = EXERCISE_MAP[lower];
    return { ...res, image_url: toCdnUrl(res.image_url), gif_url: res.gif_url ? toCdnUrl(res.gif_url) : undefined };
  }

  // Check alias map
  if (ALIAS_MAP[lower]) {
    const targetKey = ALIAS_MAP[lower].toLowerCase();
    if (EXERCISE_MAP[targetKey]) {
      const res = EXERCISE_MAP[targetKey];
      return { ...res, name, image_url: toCdnUrl(res.image_url), gif_url: res.gif_url ? toCdnUrl(res.gif_url) : undefined };
    }
  }

  // Partial match search
  const found = ALL_EXERCISES.find(e => e.name.toLowerCase().includes(lower) || lower.includes(e.name.toLowerCase()));
  if (found) {
    EXERCISE_MAP[lower] = found;
    return { ...found, image_url: toCdnUrl(found.image_url), gif_url: found.gif_url ? toCdnUrl(found.gif_url) : undefined };
  }

  // Intelligent closest match fallback with guaranteed working image URLs
  const matched = findClosestExercise(name);
  const fallback: ExerciseInfo = {
    ...matched,
    id: name.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, ''),
    name,
    image_url: toCdnUrl(matched.image_url),
    gif_url: matched.gif_url ? toCdnUrl(matched.gif_url) : toCdnUrl(matched.image_url),
  };

  EXERCISE_MAP[lower] = fallback;
  return fallback;
}

/**
 * Filter exercises by query string, category, and muscle group
 */
export function searchExercises(
  query: string,
  categoryFilter?: string,
  muscleFilter?: string,
  limit = 100
): ExerciseInfo[] {
  const q = query.toLowerCase().trim();
  let results = ALL_EXERCISES;

  if (categoryFilter && categoryFilter !== 'All') {
    const catLower = categoryFilter.toLowerCase();
    results = results.filter(e => e.category.toLowerCase() === catLower);
  }

  if (muscleFilter && muscleFilter !== 'All') {
    const mLower = muscleFilter.toLowerCase();
    results = results.filter(e =>
      e.primary_muscles.some(m => m.toLowerCase().includes(mLower)) ||
      e.secondary_muscles.some(m => m.toLowerCase().includes(mLower))
    );
  }

  if (q) {
    results = results.filter(e =>
      e.name.toLowerCase().includes(q) ||
      e.equipment.toLowerCase().includes(q) ||
      e.primary_muscles.some(m => m.toLowerCase().includes(q))
    );
  }

  return results.slice(0, limit);
}

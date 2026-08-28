import { Workout } from '../hooks/useWorkouts';
import { OnboardingAnswers } from '../types/onboarding';
import { generateWeeklyWorkouts } from './dynamicWorkoutGenerator';

export interface ScoredWorkout {
  workout: Workout;
  score: number;
  matchReasons: string[];
}

export interface RecommendationResult {
  featuredWorkout: Workout;
  curatedWorkouts: Workout[];
  matchReason: string;
  readinessScore: number;
  pacingLabel: string;
  sessionTarget: string;
}

function getCurrentISOWeekKey(): string {
  const now = new Date();
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

/**
 * Intelligent workout scoring and recommendation engine based on quiz answers
 */
export function getPersonalizedRecommendations(
  allWorkouts: Workout[],
  answers?: OnboardingAnswers | null
): RecommendationResult {
  if (!allWorkouts || allWorkouts.length === 0) {
    throw new Error('No workouts provided to recommendation engine');
  }

  // Generate dynamic weekly workouts for the current week
  const weekKey = getCurrentISOWeekKey();
  const dynamicWeeklyWorkouts = generateWeeklyWorkouts(answers, weekKey, 4);

  // Combine dynamic weekly specials + base library
  const candidatePool = [
    ...dynamicWeeklyWorkouts,
    ...allWorkouts.filter((w) => !dynamicWeeklyWorkouts.some((dw) => dw.slug === w.slug)),
  ];

  // If no quiz answers provided yet, return balanced defaults
  if (!answers) {
    const defaultFeatured = candidatePool[0] || allWorkouts[0];
    return {
      featuredWorkout: defaultFeatured,
      curatedWorkouts: candidatePool,
      matchReason: 'Calibrated for balanced full-body joint vitality & core stability.',
      readinessScore: 94,
      pacingLabel: '20–30 min',
      sessionTarget: '2 / 4',
    };
  }

  const {
    target_focus = [],
    joint_sensitivities = [],
    energy_baseline,
    time_commitment,
    training_location,
    equipment = [],
    weekly_frequency,
  } = answers;

  // Determine user equipment profile
  const hasDumbbellsOrBands =
    equipment.includes('dumbbells') ||
    equipment.includes('resistance_bands') ||
    equipment.includes('kettlebell');
  const isGym = training_location === 'gym' || equipment.includes('barbell');
  const isStrictBodyweight =
    !hasDumbbellsOrBands &&
    !isGym &&
    (equipment.includes('none') || equipment.includes('yoga_mat_blocks') || equipment.length === 0);

  // Score each workout
  const scoredList: ScoredWorkout[] = candidatePool.map((workout) => {
    let score = 50; // base score
    const reasons: string[] = [];

    // Weekly Dynamic Hand-Pick Bonus (+35 points)
    if (workout.slug.startsWith('dynamic-')) {
      score += 35;
      reasons.push('Weekly Special');
    }

    // 1. Equipment Match (+30 points)
    if (isGym && workout.equipment === 'gym_machines_free_weights') {
      score += 35;
      reasons.push('Gym Equipment');
    } else if (hasDumbbellsOrBands && workout.equipment === 'home_dumbbells_bands') {
      score += 30;
      reasons.push('Dumbbells & Bands');
    } else if (workout.equipment === 'home_bodyweight') {
      if (isStrictBodyweight) {
        score += 35;
        reasons.push('Zero Equipment');
      } else {
        score += 15; // Bodyweight is always accessible
      }
    } else if (isStrictBodyweight) {
      score -= 40; // Penalize if user has no equipment but workout requires it
    }

    // 2. Joint Sensitivity Match (+25 points per match, -30 for mismatch)
    if (joint_sensitivities && joint_sensitivities.length > 0 && !joint_sensitivities.includes('none')) {
      let isSafeForUser = true;
      for (const sensitivity of joint_sensitivities) {
        if (workout.joint_sensitivities_safe.includes(sensitivity)) {
          score += 25;
          reasons.push(`${sensitivity.toUpperCase()} Safe`);
        }
      }
      // If workout is explicitly tagged as safe for user's needs
      if (reasons.some((r) => r.includes('Safe'))) {
        score += 15;
      }
    }

    // 3. Time Commitment Match (+20 points)
    if (time_commitment === '15_min') {
      if (workout.duration_minutes <= 15) {
        score += 25;
        reasons.push('15-Min Express');
      } else if (workout.duration_minutes > 30) {
        score -= 20;
      }
    } else if (time_commitment === '30_min') {
      if (workout.duration_minutes >= 20 && workout.duration_minutes <= 30) {
        score += 20;
        reasons.push('30-Min Flow');
      }
    } else if (time_commitment === '45_min') {
      if (workout.duration_minutes >= 40) {
        score += 25;
        reasons.push('45-Min Deep Build');
      }
    }

    // 4. Energy Level Alignment (+20 points)
    if (energy_baseline === 'frequently_tired') {
      if (workout.energy_level === 'low') {
        score += 30;
        reasons.push('Restorative / Low Cortisol');
      } else if (workout.energy_level === 'high') {
        score -= 25;
      }
    } else if (energy_baseline === 'high') {
      if (workout.energy_level === 'high') {
        score += 25;
        reasons.push('High Output');
      }
    } else {
      // Moderate energy
      if (workout.energy_level === 'moderate' || workout.energy_level === 'low') {
        score += 15;
      }
    }

    // 5. Target Focus Match (+20 points)
    for (const focus of target_focus) {
      if (focus === 'joint_mobility' && workout.target_focus.includes('joint_mobility')) {
        score += 20;
        reasons.push('Mobility Focus');
      }
      if (focus === 'pelvic_core' && (workout.target_focus.includes('pelvic_control') || workout.target_focus.includes('core_stability'))) {
        score += 25;
        reasons.push('Pelvic & Core Tone');
      }
      if (focus === 'posture_relief' && workout.target_focus.includes('posture_correction')) {
        score += 25;
        reasons.push('Posture Alignment');
      }
      if (focus === 'deep_sleep' && (workout.target_focus.includes('sleep_quality') || workout.target_focus.includes('nervous_system_regulation'))) {
        score += 30;
        reasons.push('Parasympathetic Sleep Reset');
      }
      if (focus === 'daily_energy' && (workout.target_focus.includes('full_body_strength') || workout.target_focus.includes('safe_strength'))) {
        score += 15;
        reasons.push('Vitality Boost');
      }
    }

    return { workout, score, matchReasons: reasons };
  });

  // Sort descending by score
  scoredList.sort((a, b) => b.score - a.score);

  const featured = scoredList[0]?.workout || allWorkouts[0];
  const topReasons = scoredList[0]?.matchReasons || [];

  // Generate dynamic personalized coaching reason
  let reasonText = 'Personalized based on your quiz profile.';
  if (topReasons.length > 0) {
    reasonText = `Custom-calibrated for ${topReasons.slice(0, 3).join(', ')}.`;
  }

  // Calculate readiness & pacing metrics
  const readiness = energy_baseline === 'frequently_tired' ? 78 : energy_baseline === 'high' ? 96 : 88;
  const pacing =
    time_commitment === '15_min' ? '15 min' : time_commitment === '45_min' ? '45 min' : '20–30 min';
  const targetSessions = weekly_frequency ? `1 / ${weekly_frequency.split('–')[0] || 3}` : '1 / 3';

  return {
    featuredWorkout: featured,
    curatedWorkouts: scoredList.map((s) => s.workout),
    matchReason: reasonText,
    readinessScore: readiness,
    pacingLabel: pacing,
    sessionTarget: targetSessions,
  };
}

// data/fitnessPrograms.ts
// FortyWell 30-Day Digital Fitness Programs

export interface ProgramDay {
  day: number;
  title: string;
  focus: string;
  isRest: boolean;
  durationMinutes: number;
  workout?: ProgramWorkout;
}

export interface ProgramWorkout {
  slug: string;
  title: string;
  description: string;
  equipment: 'home_bodyweight' | 'home_dumbbells_bands' | 'gym_machines_free_weights';
  duration_minutes: number;
  target_focus: string[];
  joint_sensitivities_safe: string[];
  energy_level: 'low' | 'moderate' | 'high';
  warmup: ProgramExercise[];
  main_blocks: ProgramBlock[];
  cooldown: ProgramExercise[];
}

export interface ProgramBlock {
  block_name: string;
  exercises: ProgramExercise[];
}

export interface ProgramExercise {
  name: string;
  sets?: number;
  reps?: string;
  tempo?: string;
  rest?: string;
  coaching_cue?: string;
  duration?: string;
  notes?: string;
}

export interface DietTip {
  title: string;
  body: string;
  icon: 'flame' | 'leaf' | 'droplet' | 'clock' | 'heart';
}

export interface FitnessProgram {
  id: string;
  name: string;
  subtitle: string;
  tag: string;
  tagColor: string;
  gradientColors: [string, string];
  price: number;
  originalPrice: number;
  badge: string;
  description: string;
  durationDays: number;
  sessionsPerWeek: number;
  sessionDuration: string;
  equipment: string;
  goalSummary: string[];
  weeklyStructure: { week: string; focus: string; desc: string }[];
  dietTips: DietTip[];
  coachingNotes: string[];
  days: ProgramDay[];
}

// ─────────────────────────────────────────────────────────────────────────────
// PROGRAM 1 — 30-Day Weight Loss Reset
// ─────────────────────────────────────────────────────────────────────────────

function makeWeightLossDay(day: number): ProgramDay {
  const week = Math.ceil(day / 7);
  const isRest = day % 7 === 4 || day % 7 === 0;
  if (isRest) {
    return {
      day,
      title: `Recovery & Hydration (Day ${day})`,
      focus: 'Active Rest, Walking & Deep Sleep',
      isRest: true,
      durationMinutes: 0,
    };
  }

  const routines = [
    {
      title: 'Metabolic Wake-Up',
      focus: 'Full Body Low-Impact Circuit',
      duration: 30,
      exercises: [
        { name: 'Wall Push-Ups', sets: 3, reps: '12', rest: '30s', coaching_cue: 'Keep neck long, core engaged' },
        { name: 'Chair Squats (sit to stand)', sets: 3, reps: '12', rest: '45s', coaching_cue: 'Drive through heels, pause at top' },
        { name: 'Standing March with Arm Reach', sets: 3, reps: '45s', rest: '20s', coaching_cue: 'Light impact, gentle cardio elevation' },
        { name: 'Dead Bug', sets: 3, reps: '8 each side', rest: '30s', coaching_cue: 'Lower back remains firmly on mat' },
      ],
    },
    {
      title: 'Aerobic Fat Burn & Stride',
      focus: 'Brisk Walk & Interval Rhythm',
      duration: 35,
      exercises: [
        { name: 'Brisk Outdoor or Treadmill Walk', duration: '20 min', coaching_cue: 'Slightly elevated breathing, easy conversational pace' },
        { name: 'Standing Hip Abductions', sets: 3, reps: '15 each', rest: '30s', coaching_cue: 'Stabilize posture, fire outer glutes' },
        { name: 'Glute Bridge Holds', sets: 3, reps: '12 (3s hold)', rest: '40s', coaching_cue: 'Squeeze glutes at top of movement' },
      ],
    },
    {
      title: 'Lower Body Sculpt & Burn',
      focus: 'Hips, Quads & Glute Activation',
      duration: 35,
      exercises: [
        { name: 'Assisted Reverse Lunges', sets: 3, reps: '10 each', rest: '45s', coaching_cue: 'Hold sturdy chair or countertop for knee safety' },
        { name: 'Sumo Squats', sets: 3, reps: '12', rest: '40s', coaching_cue: 'Wider stance, knees track in line with toes' },
        { name: 'Calf Raises with Wall Support', sets: 3, reps: '20', rest: '30s', coaching_cue: 'Controlled tempo, pause at peak contraction' },
        { name: 'Side-Lying Clamshells', sets: 3, reps: '15 each', rest: '30s', coaching_cue: 'Keep hips stacked, activate glute medius' },
      ],
    },
    {
      title: 'Core Stability & Metabolic Flow',
      focus: 'Deep Core, Obliques & Posture',
      duration: 30,
      exercises: [
        { name: 'Forearm Plank (Knee option)', sets: 3, duration: '25-40s', rest: '45s', coaching_cue: 'Straight line from shoulders to hips' },
        { name: 'Bird Dog Extensions', sets: 3, reps: '10 each', rest: '30s', coaching_cue: 'Lengthen spine without arching lower back' },
        { name: 'Standing High Knee Taps', sets: 3, reps: '40s', rest: '20s', coaching_cue: 'Bring knee to palm level rhythmically' },
      ],
    },
    {
      title: 'Full Body Metabolic Finisher',
      focus: 'Compound Calorie Burner',
      duration: 40,
      exercises: [
        { name: 'Incline Push-Ups on Bench', sets: 3, reps: '10-12', rest: '40s', coaching_cue: 'Elbows track at 45 degree angle' },
        { name: 'Bodyweight Squats with Pulse', sets: 3, reps: '12', rest: '45s', coaching_cue: 'Add 1 pulse at bottom of rep' },
        { name: 'Step Jacks (Low Impact)', sets: 4, reps: '30s', rest: '20s', coaching_cue: 'Fast tempo without jarring knees' },
        { name: 'Seated Leg Lifts', sets: 3, reps: '12', rest: '30s', coaching_cue: 'Chest high, fire lower abdominals' },
      ],
    },
  ];

  const routine = routines[(day - 1) % routines.length];

  return {
    day,
    title: `Day ${day}: ${routine.title}`,
    focus: routine.focus,
    isRest: false,
    durationMinutes: routine.duration,
    workout: {
      slug: `weight-loss-day-${day}`,
      title: `30-Day Weight Loss — Day ${day}: ${routine.title}`,
      description: `Targeted session for Day ${day}. Focus on clean execution and progressive metabolic stimulation.`,
      equipment: 'home_bodyweight',
      duration_minutes: routine.duration,
      target_focus: ['fat_burn', 'cardio', 'core'],
      joint_sensitivities_safe: ['knees', 'hips', 'lower_back'],
      energy_level: week >= 3 ? 'high' : 'moderate',
      warmup: [
        { name: 'Arm Swings & Torso Rotations', duration: '90s', coaching_cue: 'Loosen thoracic spine and shoulders' },
        { name: 'Hip Openers & Gentle Squat Warmup', duration: '90s', coaching_cue: 'Open hip capsules without forcing' },
      ],
      main_blocks: [
        {
          block_name: routine.title,
          exercises: routine.exercises,
        },
      ],
      cooldown: [
        { name: 'Hamstring & Calf Reach', duration: '60s each', coaching_cue: 'Breathe into the posterior chain' },
        { name: 'Chest Opener & Deep Diaphragmatic Breath', duration: '2 min', coaching_cue: '4s inhale, 6s exhale to lower heart rate' },
      ],
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// PROGRAM 2 — 30-Day Strength Routine
// ─────────────────────────────────────────────────────────────────────────────

function makeStrengthDay(day: number): ProgramDay {
  const week = Math.ceil(day / 7);
  const isRest = day % 7 === 0 || day % 7 === 4;
  if (isRest) {
    return {
      day,
      title: `Rest & Muscle Synthesis (Day ${day})`,
      focus: 'Protein intake, hydration and recovery',
      isRest: true,
      durationMinutes: 0,
    };
  }

  const routines = [
    {
      title: 'Upper Body Push & Pull Foundation',
      focus: 'Chest, Shoulders & Upper Back',
      duration: 35,
      exercises: [
        { name: 'Push-Up Progression (Knees or Full)', sets: 4, reps: '8-12', rest: '60s', coaching_cue: 'Control down for 3 seconds, explode up' },
        { name: 'Doorframe or Towel Rows', sets: 4, reps: '12', rest: '60s', coaching_cue: 'Drive elbows back, squeeze shoulder blades together' },
        { name: 'Overhead Arm Press with Resistance', sets: 3, reps: '12', rest: '45s', coaching_cue: 'Keep ribs tucked, avoid arching lower spine' },
        { name: 'Chair Tricep Dips', sets: 3, reps: '10-12', rest: '45s', coaching_cue: 'Back stays close to chair edge' },
      ],
    },
    {
      title: 'Lower Body Strength & Glute Armor',
      focus: 'Quads, Hamstrings & Hip Power',
      duration: 40,
      exercises: [
        { name: 'Goblet Squats (or Bodyweight)', sets: 4, reps: '12-15', rest: '60s', coaching_cue: 'Deep hip hinge, knees stay tracking over toes' },
        { name: 'Bulgarian Split Squat / Static Lunge', sets: 3, reps: '10 each leg', rest: '60s', coaching_cue: 'Load front heel, maintain vertical chest' },
        { name: 'Single-Leg Glute Bridges', sets: 3, reps: '12 each side', rest: '45s', coaching_cue: 'Hold 2s at peak tension' },
        { name: 'Standing Calf Raises', sets: 3, reps: '20', rest: '30s', coaching_cue: 'Full extension at top, slow descent' },
      ],
    },
    {
      title: 'Core Fortress & Posture Reinforcement',
      focus: 'Deep Transverse Abdominis & Lower Back',
      duration: 30,
      exercises: [
        { name: 'Extended Forearm Plank', sets: 4, duration: '35-50s', rest: '45s', coaching_cue: 'Tuck pelvis slightly, squeeze glutes and quads' },
        { name: 'Dead Bug with Pause', sets: 3, reps: '10 each side', rest: '40s', coaching_cue: 'Opposite limbs extend simultaneously with zero lower back lift' },
        { name: 'Side Plank with Hip Dip', sets: 3, reps: '10 each side', rest: '40s', coaching_cue: 'Modify on lower knee if necessary' },
      ],
    },
    {
      title: 'Total Body Hypertrophy Circuit',
      focus: 'High Density Muscular Endurance',
      duration: 40,
      exercises: [
        { name: 'Squat to Overhead Press', sets: 4, reps: '10-12', rest: '60s', coaching_cue: 'Use leg drive to push weight overhead' },
        { name: 'Reverse Lunges with Torso Rotation', sets: 3, reps: '8 each leg', rest: '45s', coaching_cue: 'Engage rotational core strength' },
        { name: 'Floor Diamond Push-Ups or Incline Push-Ups', sets: 3, reps: '10', rest: '45s', coaching_cue: 'Emphasize triceps and inner chest' },
        { name: 'Superman Back Extensions', sets: 3, reps: '12', rest: '30s', coaching_cue: 'Lift chest and thighs, pause for 2 counts' },
      ],
    },
  ];

  const routine = routines[(day - 1) % routines.length];

  return {
    day,
    title: `Day ${day}: ${routine.title}`,
    focus: routine.focus,
    isRest: false,
    durationMinutes: routine.duration + week * 2,
    workout: {
      slug: `strength-day-${day}`,
      title: `30-Day Strength — Day ${day}: ${routine.title}`,
      description: `Week ${week} progressive resistance work designed to stimulate lean muscle mass and bone density.`,
      equipment: 'home_bodyweight',
      duration_minutes: routine.duration + week * 2,
      target_focus: ['strength', 'hypertrophy', 'bone_density'],
      joint_sensitivities_safe: ['knees', 'shoulders', 'hips'],
      energy_level: week >= 3 ? 'high' : 'moderate',
      warmup: [
        { name: 'Arm Circles & Hug Stretches', duration: '60s', coaching_cue: 'Activate shoulder rotators' },
        { name: 'Bodyweight Squat to Stand', duration: '90s', coaching_cue: 'Gradually increase hip depth' },
      ],
      main_blocks: [
        {
          block_name: routine.title,
          exercises: routine.exercises,
        },
      ],
      cooldown: [
        { name: 'Doorway Chest & Bicep Stretch', duration: '60s', coaching_cue: 'Gently lean forward until comfortable stretch is felt' },
        { name: 'Seated Figure-Four Hip Stretch', duration: '60s each', coaching_cue: 'Relieve tension in outer hips and glutes' },
      ],
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// PROGRAM 3 — 30-Day Stretching & Mobility
// ─────────────────────────────────────────────────────────────────────────────

function makeStretchDay(day: number): ProgramDay {
  const week = Math.ceil(day / 7);
  const isRest = day % 7 === 0;
  if (isRest) {
    return {
      day,
      title: `Restorative Reset (Day ${day})`,
      focus: 'Mindful Breathing & Full Nervous System Recovery',
      isRest: true,
      durationMinutes: 0,
    };
  }

  const routines = [
    {
      title: 'Hip Flexor, Psoas & Lower Back Decompression',
      focus: 'Relieve Sitting Stiffness & Lumbar Compression',
      duration: 25,
      exercises: [
        { name: 'Half-Kneeling Hip Flexor Stretch', duration: '90s each side', coaching_cue: 'Posterior pelvic tilt, do not arch lower back' },
        { name: 'Reclined Figure-Four Piriformis Stretch', duration: '90s each side', coaching_cue: 'Flex ankles to protect knees' },
        { name: 'Child’s Pose with Lateral Walkout', duration: '2 min', coaching_cue: 'Walk hands left and right to lengthen lats' },
        { name: 'Supine Knees-to-Chest Rocking', duration: '2 min', coaching_cue: 'Gently massage sacrum and lumbar spine' },
      ],
    },
    {
      title: 'Thoracic Spine, Neck & Shoulder Unwind',
      focus: 'Forward Head Posture & Tech Neck Relief',
      duration: 25,
      exercises: [
        { name: 'Cat-Cow Spinal Articulation', duration: '2 min', coaching_cue: 'Initiate motion from tailbone to head' },
        { name: 'Thread the Needle T-Spine Rotation', duration: '90s each side', coaching_cue: 'Exhale as hand glides underneath torso' },
        { name: 'Supported Doorframe Chest Opener', duration: '90s each side', coaching_cue: 'Stretch pec minor and anterior shoulder capsule' },
        { name: 'Seated Levator Scapulae & Neck Stretch', duration: '60s each side', coaching_cue: 'Look toward opposite armpit with gentle touch' },
      ],
    },
    {
      title: 'Hamstring, Calf & Posterior Kinetic Chain',
      focus: 'Lower Body Flexibility & Joint Space',
      duration: 30,
      exercises: [
        { name: 'Strap or Towel Assisted Hamstring Stretch', duration: '2 min each leg', coaching_cue: 'Keep knee soft, engage quad to release hamstring' },
        { name: 'Downward Dog Heel Pedaling', duration: '2 min', coaching_cue: 'Press chest toward thighs, alternate heel drives' },
        { name: 'Seated Butterfly (Baddha Konasana)', duration: '2 min', coaching_cue: 'Hinged at hips with long neutral spine' },
        { name: 'Ankle Dorsiflexion Mobility Drills', sets: 2, reps: '15 each ankle', rest: '20s', coaching_cue: 'Drive knee past toes over second toe' },
      ],
    },
    {
      title: 'Full Body Fluid Mobility & Spinal Waves',
      focus: 'Total Joint Articulation & Circulation',
      duration: 30,
      exercises: [
        { name: 'World’s Greatest Stretch', sets: 2, reps: '6 each side', coaching_cue: 'Lunge, drop elbow, rotate arm toward sky' },
        { name: 'Cobra / Sphinx to Child’s Pose Flow', duration: '3 min', coaching_cue: 'Move dynamically with inhalation and exhalation' },
        { name: 'Deep Squat Hold (Supported on Mat/Wall)', duration: '90s', coaching_cue: 'Elbows pry knees open, chest broad' },
        { name: 'Supine Windshield Wipers', duration: '2 min', coaching_cue: 'Drop knees side to side with arms in T position' },
      ],
    },
  ];

  const routine = routines[(day - 1) % routines.length];

  return {
    day,
    title: `Day ${day}: ${routine.title}`,
    focus: routine.focus,
    isRest: false,
    durationMinutes: routine.duration,
    workout: {
      slug: `mobility-day-${day}`,
      title: `30-Day Mobility — Day ${day}: ${routine.title}`,
      description: `Restorative mobility sequence designed to open joints, enhance synovial fluid flow, and reduce pain.`,
      equipment: 'home_bodyweight',
      duration_minutes: routine.duration,
      target_focus: ['flexibility', 'mobility', 'joint_health'],
      joint_sensitivities_safe: ['knees', 'shoulders', 'hips', 'lower_back', 'neck'],
      energy_level: 'low',
      warmup: [
        { name: 'Standing Pelvic Circles & Side Bends', duration: '2 min', coaching_cue: 'Smooth continuous motion' },
      ],
      main_blocks: [
        {
          block_name: routine.title,
          exercises: routine.exercises,
        },
      ],
      cooldown: [
        { name: 'Legs-Up-The-Wall (Viparita Karani)', duration: '3 min', coaching_cue: 'Drain venous blood from lower extremities, quiet nervous system' },
        { name: 'Parasympathetic Body Scan', duration: '2 min', coaching_cue: 'Soft face, soft shoulders, deep belly breath' },
      ],
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT: All 3 Programs
// ─────────────────────────────────────────────────────────────────────────────

export const FITNESS_PROGRAMS: FitnessProgram[] = [
  {
    id: 'weight-loss-reset',
    name: '30-Day Weight Loss Reset',
    subtitle: 'Burn Fat, Rebuild Energy & Reset Your Metabolism',
    tag: 'FAT LOSS',
    tagColor: '#C07050',
    gradientColors: ['#D07887', '#9F4252'],
    price: 19.99,
    originalPrice: 39.99,
    badge: '50% OFF',
    description: 'A clinically designed 30-day program for adults 40+ that combines low-impact cardio, metabolic circuits, and evidence-based nutrition guidance to ignite sustainable fat loss without destroying your joints.',
    durationDays: 30,
    sessionsPerWeek: 5,
    sessionDuration: '25–40 min',
    equipment: 'No equipment required (pure bodyweight)',
    goalSummary: [
      'Ignite resting metabolic rate & burn visceral fat',
      'Target 2–4 kg healthy reduction over 30 days',
      'Zero jumping or high-impact joint strain',
      'Sustain energy levels throughout the afternoon',
    ],
    weeklyStructure: [
      { week: 'Week 1', focus: 'Metabolic Awakening', desc: 'Activate cellular fat burning, establish consistent movement patterns, and reduce chronic fluid retention.' },
      { week: 'Week 2', focus: 'Mitochondrial Acceleration', desc: 'Slightly elevate work-to-rest ratios to stimulate aerobic mitochondrial density and energy output.' },
      { week: 'Week 3', focus: 'Thermogenic Escalation', desc: 'Compound movements paired with steady-state cardio to target stubborn midsection fat stores.' },
      { week: 'Week 4', focus: 'Metabolic Lockdown & Maintenance', desc: 'Cement permanent habit loops, lean tone preservation, and peak fat oxidation protocols.' },
    ],
    dietTips: [
      { title: 'Prioritize 30g Protein at Breakfast', body: 'Starting your morning with 25-35g of protein halts morning cortisol-driven muscle breakdown, stimulates peptide YY (satiety hormone), and curbs mid-afternoon sugar cravings.', icon: 'flame' },
      { title: 'Eliminate Liquid Calories First', body: 'Liquid sugars (sweetened coffees, fruit juices, sodas) bypass satiety signals in the brain. Switching to pure water, mineral water with lemon, and green tea saves 300+ daily calories effortlessly.', icon: 'droplet' },
      { title: 'The 80/20 Whole Food Foundation', body: 'Eat single-ingredient, unprocessed foods 80% of the time: lean proteins, wild fish, cruciferous vegetables, berries, olive oil, and quinoa. Leave 20% for social flexibility without guilt.', icon: 'leaf' },
      { title: 'Chrononutrition: Close Kitchen 3 Hours Before Bed', body: 'Digestive activity late at night impairs melatonin secretion and growth hormone pulses. Fasting for 12-14 hours overnight accelerates autophagy and overnight fat mobilization.', icon: 'clock' },
      { title: 'Electrolytes & High-Mineral Hydration', body: 'During initial fat loss, insulin drops and kidneys shed sodium and water. Drink 2.5L of water daily with a pinch of unrefined sea salt to prevent headaches and fatigue.', icon: 'droplet' },
      { title: 'Anti-Inflammatory Spice Infusion', body: 'Incorporate turmeric with black pepper, fresh ginger, and Ceylon cinnamon into daily meals to lower fasting blood glucose spikes and reduce systemic joint inflammation.', icon: 'heart' },
    ],
    coachingNotes: [
      'Weight fluctuations of 1-2kg day-to-day are driven by water and glycogen, not body fat. Focus on weekly trends.',
      'If joints feel sore, transition that day’s workout to the brisk walk recovery session.',
      'Sleep quality is the strongest predictor of fat loss efficiency in individuals 40+. Aim for 7.5 hours minimum.',
      'Never starve yourself. Severe caloric restriction down-regulates thyroid conversion (T4 to T3).',
    ],
    days: Array.from({ length: 30 }, (_, i) => makeWeightLossDay(i + 1)),
  },

  {
    id: 'strength-routine',
    name: '30-Day Strength Routine',
    subtitle: 'Build Functional Muscle, Bone Density & Vitality',
    tag: 'STRENGTH',
    tagColor: '#708655',
    gradientColors: ['#92A975', '#4A6A35'],
    price: 19.99,
    originalPrice: 39.99,
    badge: '50% OFF',
    description: 'A structured progressive resistance program designed specifically for individuals over 40. Protect against age-related sarcopenia, fortify bone mineral density, and develop resilient joints using bodyweight and minimal props.',
    durationDays: 30,
    sessionsPerWeek: 5,
    sessionDuration: '30–45 min',
    equipment: 'Bodyweight (optional resistance bands or dumbbells)',
    goalSummary: [
      'Increase functional muscular strength by 20–35%',
      'Stimulate osteoblast activity for bone density',
      'Correct rounded shoulder posture & weak glutes',
      'Enhance insulin sensitivity via muscle glucose uptake',
    ],
    weeklyStructure: [
      { week: 'Week 1', focus: 'Neuromuscular Priming', desc: 'Re-establish mind-muscle connection and joint tracking before applying intense training stress.' },
      { week: 'Week 2', focus: 'Structural Hypertrophy', desc: 'Increase time-under-tension on eccentric phases to recruit high-threshold motor units.' },
      { week: 'Week 3', focus: 'Force Capacity Escalation', desc: 'Higher volume circuits designed to challenge muscular endurance and functional durability.' },
      { week: 'Week 4', focus: 'Peak Functional Power', desc: 'Integrate dynamic compound movements that translate directly to daily energy and injury resistance.' },
    ],
    dietTips: [
      { title: '1.6g to 2.0g Protein Per Kilogram', body: 'Due to anabolic resistance after age 40, your muscles require higher leucine thresholds to initiate muscle protein synthesis. Distribute protein evenly across 3-4 meals.', icon: 'flame' },
      { title: 'Creatine Monohydrate Supplementation', body: 'Taking 5 grams of pure creatine monohydrate daily increases intramuscular phosphocreatine, boosting strength output, cellular hydration, and cognitive processing speed.', icon: 'leaf' },
      { title: 'Pre-Workout Complex Carbohydrates', body: 'Consume a small portion of complex carbohydrates (oatmeal, sweet potato, banana) 60-90 minutes prior to lifting to optimize muscular glycogen stores for strength.', icon: 'clock' },
      { title: 'Collagen Peptides & Vitamin C', body: 'Supplement with 10-15g hydrolyzed collagen paired with 50mg Vitamin C 45 minutes before strength sessions to enhance tendon and ligament collagen synthesis.', icon: 'heart' },
      { title: 'Magnesium Glycinate at Bedtime', body: 'Taking 300-400mg magnesium glycinate relaxes tight muscle fibers, promotes deep restorative delta sleep, and optimizes nighttime testosterone/GH production.', icon: 'droplet' },
      { title: 'Minimize Alcohol Post-Training', body: 'Alcohol intake post-workout stunts muscle protein synthesis by up to 37% and disrupts REM sleep repair. Save celebrations for dedicated recovery days.', icon: 'leaf' },
    ],
    coachingNotes: [
      'Progressive overload can be achieved by slowing the tempo (3s down) just as effectively as adding heavy weight.',
      'Mild muscle soreness 24-48 hours post-workout is normal adaptation. Joint or tendon pain is a signal to modify.',
      'Control every single repetition. Momentum takes the tension away from muscle fibers.',
      'Rest intervals between sets are essential for ATP replenishment—never rush between challenging sets.',
    ],
    days: Array.from({ length: 30 }, (_, i) => makeStrengthDay(i + 1)),
  },

  {
    id: 'stretching-mobility',
    name: '30-Day Stretching & Mobility',
    subtitle: 'Move Without Pain, Sleep Deeper & Free Your Joints',
    tag: 'MOBILITY',
    tagColor: '#6B7FC4',
    gradientColors: ['#9BA8D8', '#4A5598'],
    price: 19.99,
    originalPrice: 39.99,
    badge: '50% OFF',
    description: 'A restorative daily mobility practice targeting the 4 key zones that tighten with age: hip flexors, thoracic spine, hamstrings, and neck. Dissolve morning stiffness, improve posture, and regain effortless fluid movement.',
    durationDays: 30,
    sessionsPerWeek: 6,
    sessionDuration: '20–30 min',
    equipment: 'FortyWell Mat (or carpet/towel)',
    goalSummary: [
      'Expand active joint range of motion by 30–50%',
      'Eliminate chronic morning lower back and neck stiffness',
      'Decompress vertebrae after prolonged daily sitting',
      'Activate parasympathetic vagal tone for deep sleep',
    ],
    weeklyStructure: [
      { week: 'Week 1', focus: 'Fascial Hydration & Release', desc: 'Gentle exploratory stretching to lubricate tight connective tissue and assess baseline mobility.' },
      { week: 'Week 2', focus: 'Pelvic & Lumbar Decompression', desc: 'Target psoas, piriformis, and lumbar fascia to alleviate chronic back tension and hip tightness.' },
      { week: 'Week 3', focus: 'Thoracic & Upper Cross Realignment', desc: 'Open chest, neck, and mid-back to counteract modern screen posture and restore thoracic rotation.' },
      { week: 'Week 4', focus: 'Full-Body Kinematic Harmony', desc: 'Flow-based mobility integrations allowing your body to move freely, symmetrically, and without hesitation.' },
    ],
    dietTips: [
      { title: 'Deep Hydration for Fascial Tissue', body: 'Fascia is composed mostly of water and collagen. Chronic mild dehydration causes fascial sheets to adhere and stiffen. Drink 500ml water first thing upon waking.', icon: 'droplet' },
      { title: 'Omega-3 Fatty Acids (EPA/DHA)', body: '2000mg of combined EPA/DHA from wild fish or algae oil suppresses pro-inflammatory prostaglandins (PGE2), reducing joint stiffness and morning aches.', icon: 'heart' },
      { title: 'Tart Cherry Juice Concentrate', body: 'Rich in anthocyanins and natural melatonin, tart cherry extract significantly reduces joint soreness, improves sleep onset, and accelerates soft tissue recovery.', icon: 'leaf' },
      { title: 'Bone Broth or Gelatin Stocks', body: 'Traditional bone broths provide bioavailable glycine, proline, and hydroxyproline—the exact building blocks needed to repair joint cartilage and synovial membranes.', icon: 'flame' },
      { title: 'Reduce High-Glycemic Refined Sugars', body: 'Excess circulating glucose binds to collagen fibers in a process called glycation (AGEs), making connective tissues brittle, stiff, and prone to injury.', icon: 'clock' },
      { title: 'Turmeric (Curcumin) Golden Milk', body: 'Warm golden milk (almond milk, turmeric, black pepper, cinnamon, dash of honey) before bed decreases systemic inflammatory markers while you sleep.', icon: 'heart' },
    ],
    coachingNotes: [
      'Never force a stretch into sharp or radiating pain. Aim for a gentle "sweet ache" rated 5–6 out of 10.',
      'Breathing regulates muscle tone. Long, slow exhales signal the nervous system to let go of defensive tension.',
      'Evening mobility sessions are ideal because body temperature is naturally higher and joints are warmer.',
      'Consistency is ten times more impactful than intensity. 20 minutes daily will change how your body feels.',
    ],
    days: Array.from({ length: 30 }, (_, i) => makeStretchDay(i + 1)),
  },
];

export const PROGRAMS_BUNDLE_PRICE = 39.99;
export const PROGRAMS_BUNDLE_ORIGINAL = 119.97;

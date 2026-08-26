import { QuizStepDefinition, EquipmentOption } from '../types/onboarding';

export const HOME_EQUIPMENT_OPTIONS: { id: EquipmentOption; label: string; sublabel: string }[] = [
  { id: 'resistance_bands', label: 'Resistance Bands', sublabel: 'Loop bands, long elastic bands' },
  { id: 'dumbbells', label: 'Dumbbells', sublabel: 'Light to medium hand weights' },
  { id: 'parallettes', label: 'Parallettes', sublabel: 'Floor bars for wrist protection & elevation' },
  { id: 'barbell', label: 'Barbell & Plates', sublabel: 'Full or compact bar setup' },
  { id: 'kettlebell', label: 'Kettlebells', sublabel: 'Single or pair weights' },
  { id: 'yoga_mat_blocks', label: 'Yoga Mat & Blocks', sublabel: 'Joint cushioning and mobility props' },
  { id: 'pull_up_bar', label: 'Pull-Up Bar / Rings', sublabel: 'Doorway bar or suspension straps' },
  { id: 'none', label: 'Bodyweight Only', sublabel: 'Zero equipment needed' },
];

export const QUIZ_STEPS: QuizStepDefinition[] = [
  {
    id: 1,
    stepNumber: 1,
    totalSteps: 5,
    category: 'Your Intentions',
    title: 'Where would you like to direct your energy?',
    description: 'Choose what resonates most with your body right now. You can select more than one.',
    isMultiSelect: true,
    field: 'target_focus',
    minSelections: 1,
    options: [
      {
        id: 'joint_mobility',
        title: 'Joint Mobility & Ease',
        subtitle: 'Fluid hips, knees, and effortless everyday movement',
      },
      {
        id: 'daily_energy',
        title: 'Vitality & All-Day Energy',
        subtitle: 'Overcome afternoon crashes, feel alive by evening',
      },
      {
        id: 'pelvic_core',
        title: 'Complete Body Strength',
        subtitle: 'Full-body functional power from core to extremities',
      },
      {
        id: 'posture_relief',
        title: 'Relieve Pain',
        subtitle: 'Back, neck & hip tension — targeted and lasting relief',
      },
      {
        id: 'deep_sleep',
        title: 'Restorative Sleep & Calm',
        subtitle: 'Wind down rituals that rebuild your nervous system',
      },
    ],
  },
  {
    id: 2,
    stepNumber: 2,
    totalSteps: 5,
    category: 'Your Energy',
    title: 'How does your energy tend to feel lately?',
    description: 'Honest answers help us pace your protocol correctly.',
    isMultiSelect: false,
    field: 'energy_baseline',
    options: [
      {
        id: 'frequently_tired',
        title: 'Often Depleted',
        subtitle: 'Running on empty most days — need gentle restoration',
        badge: 'Gentle',
      },
      {
        id: 'moderate',
        title: 'Cycles & Fluctuates',
        subtitle: 'Some good days, some heavy ones — unpredictable',
        badge: 'Adaptive',
      },
      {
        id: 'high',
        title: 'Strong & Consistent',
        subtitle: 'Energy is reliable — ready to build and progress',
        badge: 'Progressive',
      },
    ],
  },
  {
    id: 3,
    stepNumber: 3,
    totalSteps: 5,
    category: 'Body Awareness',
    title: 'Any joints that need extra care or protection?',
    description: 'We\'ll modify movements to work with your body, never against it.',
    isMultiSelect: true,
    field: 'joint_sensitivities',
    options: [
      {
        id: 'knees',
        title: 'Knees',
        subtitle: 'Stiffness, aching, or instability in knee joints',
      },
      {
        id: 'hips',
        title: 'Hips & SI Joint',
        subtitle: 'Tightness, clicking, or sacroiliac pain',
      },
      {
        id: 'shoulders',
        title: 'Shoulders & Neck',
        subtitle: 'Tension, restricted rotation, or impingement',
      },
      {
        id: 'wrists',
        title: 'Wrists & Hands',
        subtitle: 'Sensitivity during weight-bearing or grip work',
      },
      {
        id: 'none',
        title: 'No Sensitivities',
        subtitle: 'Full range — no joint modifications needed',
        badge: 'Full Range',
      },
    ],
  },
  {
    id: 4,
    stepNumber: 4,
    totalSteps: 5,
    category: 'Your Schedule',
    title: 'How much daily time can you realistically commit?',
    description: 'We\'ll design sessions that fit your life — not the other way around.',
    isMultiSelect: false,
    field: 'time_commitment',
    options: [
      {
        id: '15_min',
        title: '10–15 Minutes',
        subtitle: 'Micro-practices woven into your morning or evening',
        badge: 'Micro',
      },
      {
        id: '30_min',
        title: '20–30 Minutes',
        subtitle: 'A balanced flow — enough to feel the shift',
        badge: 'Balanced',
      },
      {
        id: '45_min',
        title: '40–45 Minutes',
        subtitle: 'Deep comprehensive mobility work, 4–5 days weekly',
        badge: 'Immersive',
      },
    ],
  },
  {
    id: 5,
    stepNumber: 5,
    totalSteps: 5,
    category: 'Your Space',
    title: 'Where will you be doing your workouts?',
    description: 'We\'ll customize your program for home floor space, full gym, or a mix.',
    isMultiSelect: false,
    field: 'training_location',
    options: [
      {
        id: 'home',
        title: 'Home Training',
        subtitle: 'Living room, bedroom, or dedicated home floor space',
        badge: 'Home',
      },
      {
        id: 'gym',
        title: 'Gym or Studio',
        subtitle: 'Full equipment access, machines, cables & free weights',
        badge: 'Gym',
      },
      {
        id: 'hybrid',
        title: 'Both (Home & Gym)',
        subtitle: 'Flexible flows for home days and gym sessions',
        badge: 'Flexible',
      },
    ],
  },
];

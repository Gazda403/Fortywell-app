export type TargetFocusOption =
  | 'joint_mobility'
  | 'daily_energy'
  | 'pelvic_core'
  | 'posture_relief'
  | 'deep_sleep';

export type EnergyBaselineOption =
  | 'frequently_tired'
  | 'moderate'
  | 'high';

export type JointSensitivityOption =
  | 'knees'
  | 'hips'
  | 'shoulders'
  | 'wrists'
  | 'none';

export type TimeCommitmentOption =
  | '15_min'
  | '30_min'
  | '45_min';

export type TrainingLocationOption =
  | 'home'
  | 'gym'
  | 'hybrid';

export type EquipmentOption =
  | 'resistance_bands'
  | 'dumbbells'
  | 'parallettes'
  | 'barbell'
  | 'yoga_mat_blocks'
  | 'kettlebell'
  | 'pull_up_bar'
  | 'none';

export interface OnboardingAnswers {
  first_name?: string;
  target_focus: TargetFocusOption[];
  energy_baseline: EnergyBaselineOption | null;
  joint_sensitivities: JointSensitivityOption[];
  time_commitment: TimeCommitmentOption | null;
  weekly_frequency?: string;
  training_location: TrainingLocationOption | null;
  equipment: EquipmentOption[];
}

export interface ProfileRecord {
  id?: string;
  first_name?: string | null;
  target_focus: string[];
  time_commitment: string | null;
  weekly_frequency?: string | null;
  joint_sensitivities: string[];
  energy_baseline: string | null;
  training_location?: string | null;
  equipment?: string[];
  has_completed_onboarding: boolean;
  has_seen_walkthrough?: boolean;
  updated_at?: string;
}

export interface QuizOption<T = string> {
  id: T;
  title: string;
  subtitle?: string;
  badge?: string;
  iconName?: string;
}

export interface QuizStepDefinition {
  id: number;
  stepNumber: number;
  totalSteps: number;
  category: string;
  title: string;
  description: string;
  isMultiSelect: boolean;
  field: keyof OnboardingAnswers;
  options: QuizOption[];
  minSelections?: number;
}

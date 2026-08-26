export type ResetSlot = 'morning' | 'main' | 'night';

export type SlotStatus = 'completed' | 'planned' | 'skipped' | 'rescheduled' | 'rest' | 'none';

export type NightActivityType = 'walk' | 'reading' | 'hobby' | 'stretch' | 'custom';

export interface NightActivityOption {
  type: NightActivityType;
  label: string;
  sublabel: string;
  iconName: string;
  suggestedDuration: string; // e.g. '~20 min'
}

export interface NightSessionActivityLog {
  id?: string;
  date: string;
  activityType: NightActivityType;
  customActivityTitle?: string;
  durationMinutes?: number;
  notes?: string;
}

export interface DaySlotInfo {
  slot: ResetSlot;
  label: string; // 'Morning Session', 'Main Session', 'Night Time Session'
  descriptor: string; // e.g. 'Joint fluidity & nervous system calibration'
  status: SlotStatus;
  scheduledTime: string;
  completedAt?: string;
  workoutTitle?: string;
  durationMinutes?: number;
  whyThisToday?: string; // Micro-explanation
  skippedReason?: string;
  rescheduledTo?: string;
  isOptional?: boolean;
  nightActivity?: NightActivityType;
  customActivityTitle?: string;
  notes?: string;
}

export interface DayRhythmSummary {
  date: string; // YYYY-MM-DD
  dayLabel: string; // 'MON', 'TUE', etc.
  fullDayName: string; // 'Monday', 'Tuesday', etc.
  dayNumber: number; // 21, 22, etc.
  isToday: boolean;
  isPast: boolean;
  isRestDay?: boolean;
  restDayNote?: string;
  slots: Record<ResetSlot, DaySlotInfo>;
  completedCount: number;
}

export interface WeeklyThemePlan {
  id?: string;
  themeTitle: string; // e.g. "Lymphatic Flow"
  themeSubtitle?: string; // e.g. "Gentle circulation & joint ease"
  weekNumber: number; // e.g. 2
  totalWeeks: number; // e.g. 4
  focusAreas?: string[];
}

export interface ResetTimingPreference {
  slot: ResetSlot;
  label: string;
  sublabel: string;
  reminderTime: string; // e.g. '7:00 AM'
  reminderEnabled: boolean;
  isOptional?: boolean;
}

export type CyclePhase =
  | 'Menstrual Phase'
  | 'Follicular Phase'
  | 'Ovulatory Phase'
  | 'Luteal Phase'
  | 'Gentle Rhythm';

export interface CycleTrackingData {
  optedIn: boolean;
  cycleStartDate?: string; // YYYY-MM-DD
  cycleLengthDays: number;
  currentPhase?: CyclePhase;
  cycleDay?: number;
  guidanceHeadline?: string;
  guidanceBody?: string;
}

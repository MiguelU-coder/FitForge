// Manual type definitions since Prisma client may not be generated
export const ExerciseType = {
  COMPOUND: 'COMPOUND',
  ISOLATION: 'ISOLATION',
} as const;
export type ExerciseType = (typeof ExerciseType)[keyof typeof ExerciseType];

export const FatigueLevel = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
} as const;
export type FatigueLevel = (typeof FatigueLevel)[keyof typeof FatigueLevel];

export const ProgramPhase = {
  HYPERTROPHY: 'HYPERTROPHY',
  INTENSITY: 'INTENSITY',
  DELOAD: 'DELOAD',
} as const;
export type ProgramPhase = (typeof ProgramPhase)[keyof typeof ProgramPhase];

// ─── Backward-compat exports ────────────────────────────────────────────────

export const VOLUME_PER_LEVEL = {
  BEGINNER: { min: 8, max: 12 },
  IRREGULAR: { min: 10, max: 14 },
  MEDIUM: { min: 12, max: 16 },
  ADVANCED: { min: 14, max: 20 },
};

export const PHASE_REPS = {
  HYPERTROPHY: { min: 10, max: 12 },
  INTENSITY: { min: 6, max: 8 },
};

export const PROGRESSION_NOTE = '8-12 reps. Cuando llegues a 12, sube peso.';

export const EXERCISE_DISTRIBUTION = {
  COMPOUND_MAIN: 1,
  COMPOUND_SECONDARY: 1,
  ISOLATION: 2,
};

export const FATIGUE_LIMIT_PER_DAY = 2;

// ─── Movement pattern values (mirror DB enum) ───────────────────────────────

export type MovementPattern =
  | 'SQUAT'
  | 'HINGE'
  | 'PUSH_HORIZONTAL'
  | 'PUSH_VERTICAL'
  | 'PULL_HORIZONTAL'
  | 'PULL_VERTICAL'
  | 'LUNGE'
  | 'CORE'
  | 'CARRY';

// ─── Core interfaces ─────────────────────────────────────────────────────────

export interface MovementSlot {
  movementPattern: MovementPattern | null;
  muscleTarget?: string;
  sets: number;
  /** When equal, represents a fixed rep target */
  repsMin: number;
  /** When equal, represents a fixed rep target */
  repsMax: number;
  isHeavy?: boolean;
  isCoreOrCardio?: boolean;
  restSeconds: number;
  notes?: string;
}

export interface DayConfig {
  dayName: string;
  focus: string;
  slots: MovementSlot[];
}

export interface SplitConfig {
  splitName: string;
  daysPerWeek: number;
  /** 'AB' = day templates cycle (e.g. A/B/A, B/A/B); 'FIXED' = days run in order */
  rotationMode: 'AB' | 'FIXED';
  days: DayConfig[];
}

// ─── Rest period constants ───────────────────────────────────────────────────

export const REST_SECONDS = {
  BEGINNER: 150,
  IRREGULAR: 120,
  MEDIUM: 90,
  ADVANCED_COMPOUND: 180,
  ADVANCED_ISOLATION: 90,
  /** Core/accessory work — short rest for isolation exercises */
  ISOLATION_SHORT: 60,
  /** PPL split accessory slots */
  PPL_ACCESSORY: 75,
} as const;

// ─── Split definitions ───────────────────────────────────────────────────────

/**
 * Full Body 2-day split for IRREGULAR users (minimal frequency).
 * A/B rotation ensures full body coverage across the week.
 */
const FULL_BODY_2DAY_SPLIT: SplitConfig = {
  splitName: 'FULL_BODY_2DAY',
  daysPerWeek: 2,
  rotationMode: 'AB',
  days: [
    {
      dayName: 'Day A',
      focus: 'Full Body — Squat + Push/Pull Horizontal',
      slots: [
        { movementPattern: 'SQUAT', sets: 3, repsMin: 8, repsMax: 8, isHeavy: true, restSeconds: REST_SECONDS.BEGINNER, notes: 'Main compound' },
        { movementPattern: 'PUSH_HORIZONTAL', sets: 3, repsMin: 8, repsMax: 8, restSeconds: REST_SECONDS.BEGINNER, notes: 'Main compound' },
        { movementPattern: 'PULL_HORIZONTAL', sets: 3, repsMin: 10, repsMax: 10, restSeconds: REST_SECONDS.BEGINNER },
        { movementPattern: 'CORE', sets: 3, repsMin: 30, repsMax: 30, isCoreOrCardio: true, restSeconds: REST_SECONDS.ISOLATION_SHORT, notes: '30s hold' },
      ],
    },
    {
      dayName: 'Day B',
      focus: 'Full Body — Hinge + Push/Pull Vertical',
      slots: [
        { movementPattern: 'HINGE', sets: 3, repsMin: 8, repsMax: 8, isHeavy: true, restSeconds: REST_SECONDS.BEGINNER, notes: 'Main compound' },
        { movementPattern: 'PUSH_VERTICAL', sets: 3, repsMin: 10, repsMax: 10, restSeconds: REST_SECONDS.BEGINNER },
        { movementPattern: 'PULL_VERTICAL', sets: 3, repsMin: 10, repsMax: 10, restSeconds: REST_SECONDS.BEGINNER },
        { movementPattern: null, muscleTarget: 'bicep', sets: 2, repsMin: 12, repsMax: 12, restSeconds: REST_SECONDS.ISOLATION_SHORT },
      ],
    },
  ],
};

/**
 * Full Body 3-day split for BEGINNER users (optimal frequency for novices).
 * A/B/A rotation provides balanced stimulus with recovery.
 */
const FULL_BODY_3DAY_SPLIT: SplitConfig = {
  splitName: 'FULL_BODY_3DAY',
  daysPerWeek: 3,
  rotationMode: 'AB',
  days: [
    {
      dayName: 'Day A',
      focus: 'Full Body — Squat + Push/Pull',
      slots: [
        { movementPattern: 'SQUAT', sets: 3, repsMin: 8, repsMax: 8, isHeavy: true, restSeconds: REST_SECONDS.BEGINNER, notes: 'Main compound' },
        { movementPattern: 'PUSH_HORIZONTAL', sets: 3, repsMin: 8, repsMax: 8, restSeconds: REST_SECONDS.BEGINNER, notes: 'Main compound' },
        { movementPattern: 'PULL_HORIZONTAL', sets: 3, repsMin: 10, repsMax: 10, restSeconds: REST_SECONDS.BEGINNER },
        { movementPattern: 'CORE', sets: 3, repsMin: 30, repsMax: 30, isCoreOrCardio: true, restSeconds: REST_SECONDS.ISOLATION_SHORT, notes: '30s hold' },
      ],
    },
    {
      dayName: 'Day B',
      focus: 'Full Body — Hinge + Vertical',
      slots: [
        { movementPattern: 'HINGE', sets: 3, repsMin: 5, repsMax: 5, isHeavy: true, restSeconds: REST_SECONDS.BEGINNER, notes: 'Main compound' },
        { movementPattern: 'PUSH_VERTICAL', sets: 3, repsMin: 10, repsMax: 10, restSeconds: REST_SECONDS.BEGINNER },
        { movementPattern: 'PULL_VERTICAL', sets: 3, repsMin: 10, repsMax: 10, restSeconds: REST_SECONDS.BEGINNER },
      ],
    },
  ],
};

/**
 * Upper/Lower 4-day split for MEDIUM (intermediate) users.
 * Provides higher frequency and volume for continued progress.
 */
const UPPER_LOWER_SPLIT: SplitConfig = {
  splitName: 'UPPER_LOWER',
  daysPerWeek: 4,
  rotationMode: 'FIXED',
  days: [
    {
      dayName: 'Upper A',
      focus: 'Upper — Strength',
      slots: [
        { movementPattern: 'PUSH_HORIZONTAL', sets: 4, repsMin: 6, repsMax: 8, isHeavy: true, restSeconds: REST_SECONDS.MEDIUM },
        { movementPattern: 'PULL_HORIZONTAL', sets: 4, repsMin: 6, repsMax: 8, restSeconds: REST_SECONDS.MEDIUM },
        { movementPattern: 'PUSH_VERTICAL', sets: 3, repsMin: 8, repsMax: 8, restSeconds: REST_SECONDS.MEDIUM },
        { movementPattern: 'PULL_VERTICAL', muscleTarget: 'bicep', sets: 3, repsMin: 10, repsMax: 10, restSeconds: REST_SECONDS.MEDIUM },
        { movementPattern: null, muscleTarget: 'tricep', sets: 3, repsMin: 10, repsMax: 10, restSeconds: REST_SECONDS.MEDIUM },
      ],
    },
    {
      dayName: 'Lower A',
      focus: 'Lower — Quad',
      slots: [
        { movementPattern: 'SQUAT', sets: 4, repsMin: 6, repsMax: 8, isHeavy: true, restSeconds: REST_SECONDS.MEDIUM },
        { movementPattern: 'HINGE', muscleTarget: 'leg_curl_rdl', sets: 3, repsMin: 10, repsMax: 10, restSeconds: REST_SECONDS.MEDIUM },
        { movementPattern: 'LUNGE', sets: 3, repsMin: 10, repsMax: 10, restSeconds: REST_SECONDS.MEDIUM },
        { movementPattern: null, muscleTarget: 'calf', sets: 4, repsMin: 12, repsMax: 12, restSeconds: REST_SECONDS.ISOLATION_SHORT },
      ],
    },
    {
      dayName: 'Upper B',
      focus: 'Upper — Hypertrophy',
      slots: [
        { movementPattern: 'PUSH_HORIZONTAL', muscleTarget: 'incline', sets: 3, repsMin: 8, repsMax: 10, restSeconds: REST_SECONDS.MEDIUM },
        { movementPattern: 'PULL_VERTICAL', sets: 3, repsMin: 8, repsMax: 10, restSeconds: REST_SECONDS.MEDIUM },
        { movementPattern: 'PUSH_VERTICAL', muscleTarget: 'lateral', sets: 3, repsMin: 15, repsMax: 15, restSeconds: REST_SECONDS.ISOLATION_SHORT },
        { movementPattern: 'PULL_HORIZONTAL', muscleTarget: 'bicep', sets: 3, repsMin: 12, repsMax: 12, restSeconds: REST_SECONDS.ISOLATION_SHORT },
      ],
    },
    {
      dayName: 'Lower B',
      focus: 'Lower — Posterior Chain',
      slots: [
        { movementPattern: 'HINGE', muscleTarget: 'rdl', sets: 4, repsMin: 8, repsMax: 8, isHeavy: true, restSeconds: REST_SECONDS.MEDIUM },
        { movementPattern: 'LUNGE', sets: 3, repsMin: 10, repsMax: 10, restSeconds: REST_SECONDS.MEDIUM },
        { movementPattern: null, muscleTarget: 'isolation', sets: 3, repsMin: 12, repsMax: 12, restSeconds: REST_SECONDS.ISOLATION_SHORT },
      ],
    },
  ],
};

const PPL_SPLIT: SplitConfig = {
  splitName: 'PPL_SIMPLE',
  daysPerWeek: 3,
  rotationMode: 'FIXED',
  days: [
    {
      dayName: 'Push',
      focus: 'Push — Chest, Shoulders, Triceps',
      slots: [
        { movementPattern: 'PUSH_HORIZONTAL', sets: 3, repsMin: 8, repsMax: 8, isHeavy: true, restSeconds: REST_SECONDS.MEDIUM },
        { movementPattern: 'PUSH_VERTICAL', sets: 3, repsMin: 12, repsMax: 12, restSeconds: REST_SECONDS.MEDIUM },
        { movementPattern: 'PUSH_HORIZONTAL', muscleTarget: 'dips_isolation', sets: 3, repsMin: 12, repsMax: 15, restSeconds: REST_SECONDS.PPL_ACCESSORY },
        { movementPattern: null, muscleTarget: 'tricep', sets: 3, repsMin: 8, repsMax: 10, restSeconds: REST_SECONDS.PPL_ACCESSORY },
        { movementPattern: 'PUSH_VERTICAL', muscleTarget: 'lateral', sets: 3, repsMin: 12, repsMax: 12, restSeconds: REST_SECONDS.ISOLATION_SHORT },
      ],
    },
    {
      dayName: 'Pull',
      focus: 'Pull — Back, Biceps',
      slots: [
        { movementPattern: 'PULL_VERTICAL', muscleTarget: 'pullup', sets: 3, repsMin: 6, repsMax: 6, isHeavy: true, restSeconds: REST_SECONDS.MEDIUM },
        { movementPattern: 'PULL_HORIZONTAL', sets: 3, repsMin: 10, repsMax: 12, restSeconds: REST_SECONDS.MEDIUM },
        { movementPattern: 'PULL_VERTICAL', muscleTarget: 'pullover', sets: 3, repsMin: 15, repsMax: 20, restSeconds: REST_SECONDS.PPL_ACCESSORY },
        { movementPattern: null, muscleTarget: 'bicep', sets: 3, repsMin: 10, repsMax: 10, restSeconds: REST_SECONDS.ISOLATION_SHORT },
      ],
    },
    {
      dayName: 'Legs',
      focus: 'Legs — Quad, Hinge, Calves',
      slots: [
        { movementPattern: 'SQUAT', sets: 3, repsMin: 4, repsMax: 4, isHeavy: true, restSeconds: REST_SECONDS.MEDIUM, notes: '~80% 1RM' },
        { movementPattern: 'HINGE', sets: 3, repsMin: 10, repsMax: 10, restSeconds: REST_SECONDS.MEDIUM },
        { movementPattern: 'SQUAT', muscleTarget: 'machine', sets: 3, repsMin: 15, repsMax: 15, restSeconds: REST_SECONDS.PPL_ACCESSORY },
        { movementPattern: null, muscleTarget: 'quad_isolation', sets: 3, repsMin: 10, repsMax: 12, restSeconds: REST_SECONDS.ISOLATION_SHORT },
        { movementPattern: null, muscleTarget: 'hamstring_isolation', sets: 3, repsMin: 10, repsMax: 12, restSeconds: REST_SECONDS.ISOLATION_SHORT },
        { movementPattern: null, muscleTarget: 'calf', sets: 3, repsMin: 10, repsMax: 12, restSeconds: REST_SECONDS.ISOLATION_SHORT },
      ],
    },
  ],
};

const PPL_AB_SPLIT: SplitConfig = {
  splitName: 'PPL_AB',
  daysPerWeek: 6,
  rotationMode: 'FIXED',
  days: [
    {
      dayName: 'Legs 1',
      focus: 'Legs — Quad Focus',
      slots: [
        { movementPattern: 'SQUAT', sets: 3, repsMin: 4, repsMax: 4, isHeavy: true, restSeconds: REST_SECONDS.ADVANCED_COMPOUND, notes: '~80% 1RM' },
        { movementPattern: 'HINGE', muscleTarget: 'rdl', sets: 3, repsMin: 10, repsMax: 10, restSeconds: REST_SECONDS.ADVANCED_COMPOUND },
        { movementPattern: 'SQUAT', muscleTarget: 'leg_press', sets: 3, repsMin: 15, repsMax: 15, restSeconds: REST_SECONDS.ADVANCED_COMPOUND },
        { movementPattern: null, muscleTarget: 'quad_isolation', sets: 3, repsMin: 10, repsMax: 12, restSeconds: REST_SECONDS.ADVANCED_ISOLATION },
        { movementPattern: null, muscleTarget: 'hamstring_isolation', sets: 3, repsMin: 10, repsMax: 12, restSeconds: REST_SECONDS.ADVANCED_ISOLATION },
        { movementPattern: null, muscleTarget: 'calf', sets: 3, repsMin: 10, repsMax: 12, restSeconds: REST_SECONDS.ADVANCED_ISOLATION },
      ],
    },
    {
      dayName: 'Push A',
      focus: 'Push — Chest Focus',
      slots: [
        { movementPattern: 'PUSH_HORIZONTAL', sets: 3, repsMin: 8, repsMax: 8, isHeavy: true, restSeconds: REST_SECONDS.ADVANCED_COMPOUND },
        { movementPattern: 'PUSH_VERTICAL', sets: 3, repsMin: 12, repsMax: 12, restSeconds: REST_SECONDS.ADVANCED_COMPOUND },
        { movementPattern: 'PUSH_HORIZONTAL', muscleTarget: 'dips', sets: 3, repsMin: 12, repsMax: 15, restSeconds: REST_SECONDS.ADVANCED_ISOLATION },
        { movementPattern: null, muscleTarget: 'tricep', sets: 3, repsMin: 8, repsMax: 10, restSeconds: REST_SECONDS.ADVANCED_ISOLATION },
        { movementPattern: 'PUSH_VERTICAL', muscleTarget: 'lateral', sets: 3, repsMin: 12, repsMax: 12, restSeconds: REST_SECONDS.ADVANCED_ISOLATION },
      ],
    },
    {
      dayName: 'Pull A',
      focus: 'Pull — Lat Focus',
      slots: [
        { movementPattern: 'PULL_VERTICAL', muscleTarget: 'pullup', sets: 3, repsMin: 6, repsMax: 6, isHeavy: true, restSeconds: REST_SECONDS.ADVANCED_COMPOUND },
        { movementPattern: 'PULL_HORIZONTAL', muscleTarget: 'row', sets: 3, repsMin: 10, repsMax: 12, restSeconds: REST_SECONDS.ADVANCED_COMPOUND },
        { movementPattern: 'PULL_VERTICAL', muscleTarget: 'pullover', sets: 3, repsMin: 15, repsMax: 20, restSeconds: REST_SECONDS.ADVANCED_ISOLATION },
        { movementPattern: null, muscleTarget: 'bicep', sets: 3, repsMin: 10, repsMax: 10, restSeconds: REST_SECONDS.ADVANCED_ISOLATION },
      ],
    },
    {
      dayName: 'Legs 2',
      focus: 'Legs — Posterior Chain Focus',
      slots: [
        { movementPattern: 'HINGE', muscleTarget: 'deadlift', sets: 3, repsMin: 3, repsMax: 3, isHeavy: true, restSeconds: REST_SECONDS.ADVANCED_COMPOUND, notes: 'Heavy' },
        { movementPattern: 'SQUAT', muscleTarget: 'hack_squat', sets: 3, repsMin: 10, repsMax: 12, restSeconds: REST_SECONDS.ADVANCED_COMPOUND },
        { movementPattern: null, muscleTarget: 'hip_thrust', sets: 2, repsMin: 15, repsMax: 15, restSeconds: REST_SECONDS.ADVANCED_ISOLATION },
        { movementPattern: null, muscleTarget: 'hamstring_curl', sets: 2, repsMin: 10, repsMax: 12, restSeconds: REST_SECONDS.ADVANCED_ISOLATION },
      ],
    },
    {
      dayName: 'Push B',
      focus: 'Push — Shoulder Focus',
      slots: [
        { movementPattern: 'PUSH_VERTICAL', muscleTarget: 'overhead_press', sets: 4, repsMin: 4, repsMax: 4, isHeavy: true, restSeconds: REST_SECONDS.ADVANCED_COMPOUND, notes: 'Heavy' },
        { movementPattern: 'PUSH_HORIZONTAL', muscleTarget: 'close_grip', sets: 3, repsMin: 10, repsMax: 10, restSeconds: REST_SECONDS.ADVANCED_COMPOUND },
        { movementPattern: null, muscleTarget: 'chest_fly_cable', sets: 3, repsMin: 12, repsMax: 12, restSeconds: REST_SECONDS.ADVANCED_ISOLATION },
        { movementPattern: null, muscleTarget: 'tricep', sets: 3, repsMin: 10, repsMax: 10, restSeconds: REST_SECONDS.ADVANCED_ISOLATION },
        { movementPattern: 'PUSH_VERTICAL', muscleTarget: 'lateral', sets: 3, repsMin: 15, repsMax: 15, restSeconds: REST_SECONDS.ADVANCED_ISOLATION },
      ],
    },
    {
      dayName: 'Pull B',
      focus: 'Pull — Mid-Back Focus',
      slots: [
        { movementPattern: 'PULL_VERTICAL', muscleTarget: 'lat_pulldown', sets: 3, repsMin: 10, repsMax: 12, isHeavy: true, restSeconds: REST_SECONDS.ADVANCED_COMPOUND },
        { movementPattern: 'PULL_HORIZONTAL', muscleTarget: 'chest_supported_row', sets: 3, repsMin: 10, repsMax: 10, restSeconds: REST_SECONDS.ADVANCED_COMPOUND },
        { movementPattern: null, muscleTarget: 'face_pull', sets: 3, repsMin: 15, repsMax: 20, restSeconds: REST_SECONDS.ADVANCED_ISOLATION },
        { movementPattern: 'PULL_VERTICAL', muscleTarget: 'shrugs', sets: 3, repsMin: 15, repsMax: 15, restSeconds: REST_SECONDS.ADVANCED_ISOLATION },
        { movementPattern: null, muscleTarget: 'bicep', sets: 3, repsMin: 10, repsMax: 10, restSeconds: REST_SECONDS.ADVANCED_ISOLATION },
      ],
    },
  ],
};

// ─── Level → split map ───────────────────────────────────────────────────────

export type TrainingLevel = 'BEGINNER' | 'IRREGULAR' | 'MEDIUM' | 'ADVANCED';

/**
 * Days per week by training level - CORRECTED VALUES
 * - BEGINNER: 3 days (Full Body A/B/A) - optimal for novices
 * - IRREGULAR: 2 days (Full Body A/B) - minimal effective dose
 * - MEDIUM: 4 days (Upper/Lower or Push/Pull/Legs/Upper)
 * - ADVANCED: 5 days (Push/Pull/Legs/Upper/Legs Hypertrophy)
 */
export const LEVEL_FREQUENCY: Record<TrainingLevel, number> = {
  BEGINNER: 3,
  IRREGULAR: 2,
  MEDIUM: 4,
  ADVANCED: 5,
};

export const LEVEL_SPLIT_MAP: Record<TrainingLevel, SplitConfig> = {
  BEGINNER: FULL_BODY_3DAY_SPLIT,
  IRREGULAR: FULL_BODY_2DAY_SPLIT,
  MEDIUM: UPPER_LOWER_SPLIT,
  ADVANCED: PPL_AB_SPLIT,
};

// ─── Periodization ──────────────────────────────────────────────────────────

export type TrainingPhaseLabel = 'HYPERTROPHY' | 'INTENSITY' | 'DELOAD';

export interface PhaseConfig {
  label: TrainingPhaseLabel;
  weeks: [number, number];
  repsMin: number;
  repsMax: number;
  progressionStrategy: 'SET_INCREMENT' | 'PERCENT_1RM' | 'DELOAD';
  volumeMultiplier: number;
  rirTarget: Record<TrainingLevel, number>;
  notes?: string;
}

export const PERIODIZATION_CONFIG: PhaseConfig[] = [
  {
    label: 'HYPERTROPHY',
    weeks: [1, 4],
    repsMin: 10,
    repsMax: 12,
    progressionStrategy: 'SET_INCREMENT',
    volumeMultiplier: 1.0,
    rirTarget: { BEGINNER: 3, IRREGULAR: 2, MEDIUM: 2, ADVANCED: 1 },
    notes: 'Higher reps, moderate load. Add 1 set each week.',
  },
  {
    label: 'INTENSITY',
    weeks: [5, 8],
    repsMin: 4,
    repsMax: 8,
    progressionStrategy: 'PERCENT_1RM',
    volumeMultiplier: 0.85,
    rirTarget: { BEGINNER: 2, IRREGULAR: 1, MEDIUM: 1, ADVANCED: 0 },
    notes: 'Lower reps, heavier load. Progress via %1RM.',
  },
  {
    label: 'DELOAD',
    weeks: [9, 9],
    repsMin: 8,
    repsMax: 10,
    progressionStrategy: 'DELOAD',
    volumeMultiplier: 0.5,
    rirTarget: { BEGINNER: 4, IRREGULAR: 4, MEDIUM: 4, ADVANCED: 3 },
    notes: 'ADVANCED only. 50% volume, same weight, full recovery.',
  },
];

export function getPhaseForWeek(week: number, level: TrainingLevel): PhaseConfig {
  if (level === 'ADVANCED' && week === 9) {
    return PERIODIZATION_CONFIG[2];
  }
  return week <= 4 ? PERIODIZATION_CONFIG[0] : PERIODIZATION_CONFIG[1];
}

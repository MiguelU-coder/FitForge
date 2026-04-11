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
      focus: 'Full Body — Legs + Push + Pull',
      slots: [
        { movementPattern: 'SQUAT', muscleTarget: 'leg_press', sets: 3, repsMin: 6, repsMax: 8, isHeavy: true, restSeconds: REST_SECONDS.BEGINNER, notes: 'Leg Press / Hack Squat' },
        { movementPattern: 'PUSH_HORIZONTAL', sets: 3, repsMin: 6, repsMax: 8, restSeconds: REST_SECONDS.BEGINNER, notes: 'Machine Chest Press' },
        { movementPattern: 'PULL_HORIZONTAL', sets: 3, repsMin: 8, repsMax: 10, restSeconds: REST_SECONDS.BEGINNER, notes: 'Barbell Row' },
        { movementPattern: 'HINGE', muscleTarget: 'rdl', sets: 2, repsMin: 8, repsMax: 10, restSeconds: REST_SECONDS.BEGINNER, notes: 'Romanian Deadlift' },
        { movementPattern: 'PUSH_VERTICAL', muscleTarget: 'lateral', sets: 2, repsMin: 12, repsMax: 15, restSeconds: REST_SECONDS.ISOLATION_SHORT, notes: 'Lateral Raise' },
        { movementPattern: null, muscleTarget: 'tricep', sets: 2, repsMin: 10, repsMax: 12, restSeconds: REST_SECONDS.ISOLATION_SHORT, notes: 'Tricep Pushdown' },
        { movementPattern: null, muscleTarget: 'bicep', sets: 2, repsMin: 10, repsMax: 12, restSeconds: REST_SECONDS.ISOLATION_SHORT, notes: 'Barbell Curl' },
      ],
    },
    {
      dayName: 'Day B',
      focus: 'Full Body — Deadlift + Press + Pull',
      slots: [
        { movementPattern: 'HINGE', muscleTarget: 'deadlift', sets: 3, repsMin: 4, repsMax: 6, isHeavy: true, restSeconds: REST_SECONDS.BEGINNER, notes: 'Deadlift' },
        { movementPattern: 'PUSH_HORIZONTAL', muscleTarget: 'incline', sets: 3, repsMin: 8, repsMax: 10, restSeconds: REST_SECONDS.BEGINNER, notes: 'Incline DB Press' },
        { movementPattern: 'PULL_VERTICAL', sets: 3, repsMin: 8, repsMax: 10, restSeconds: REST_SECONDS.BEGINNER, notes: 'Lat Pulldown' },
        { movementPattern: 'SQUAT', sets: 2, repsMin: 10, repsMax: 12, restSeconds: REST_SECONDS.PPL_ACCESSORY, notes: 'Leg Press' },
        { movementPattern: 'PULL_HORIZONTAL', muscleTarget: 'face_pull', sets: 2, repsMin: 12, repsMax: 15, restSeconds: REST_SECONDS.ISOLATION_SHORT, notes: 'Face Pull' },
        { movementPattern: null, muscleTarget: 'tricep', sets: 2, repsMin: 10, repsMax: 12, restSeconds: REST_SECONDS.ISOLATION_SHORT, notes: 'Skull Crusher' },
        { movementPattern: null, muscleTarget: 'bicep', sets: 2, repsMin: 10, repsMax: 12, restSeconds: REST_SECONDS.ISOLATION_SHORT, notes: 'Barbell Curl' },
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
      focus: 'Full Body — Squat + Push + Pull',
      slots: [
        { movementPattern: 'SQUAT', muscleTarget: 'leg_press', sets: 3, repsMin: 6, repsMax: 8, isHeavy: true, restSeconds: REST_SECONDS.BEGINNER, notes: 'Leg Press / Hack Squat' },
        { movementPattern: 'PUSH_HORIZONTAL', sets: 3, repsMin: 6, repsMax: 8, restSeconds: REST_SECONDS.BEGINNER, notes: 'Machine Chest Press' },
        { movementPattern: 'PULL_HORIZONTAL', sets: 3, repsMin: 8, repsMax: 10, restSeconds: REST_SECONDS.BEGINNER, notes: 'Barbell Row' },
        { movementPattern: null, muscleTarget: 'calf', sets: 3, repsMin: 12, repsMax: 15, restSeconds: REST_SECONDS.ISOLATION_SHORT, notes: 'Calf Raise' },
        { movementPattern: null, muscleTarget: 'tricep', sets: 2, repsMin: 10, repsMax: 12, restSeconds: REST_SECONDS.ISOLATION_SHORT, notes: 'Tricep Pushdown' },
      ],
    },
    {
      dayName: 'Day B',
      focus: 'Full Body — Deadlift + Press + Pull-Up',
      slots: [
        { movementPattern: 'HINGE', muscleTarget: 'deadlift', sets: 3, repsMin: 4, repsMax: 6, isHeavy: true, restSeconds: REST_SECONDS.BEGINNER, notes: 'Deadlift' },
        { movementPattern: 'PUSH_VERTICAL', sets: 3, repsMin: 8, repsMax: 10, restSeconds: REST_SECONDS.BEGINNER, notes: 'Overhead Press' },
        { movementPattern: 'PULL_VERTICAL', muscleTarget: 'pullup', sets: 3, repsMin: 6, repsMax: 8, isHeavy: true, restSeconds: REST_SECONDS.BEGINNER, notes: 'Pull-Up' },
        { movementPattern: 'HINGE', muscleTarget: 'leg_curl_rdl', sets: 3, repsMin: 10, repsMax: 12, restSeconds: REST_SECONDS.BEGINNER, notes: 'Leg Curl' },
        { movementPattern: null, muscleTarget: 'bicep', sets: 2, repsMin: 10, repsMax: 12, restSeconds: REST_SECONDS.ISOLATION_SHORT, notes: 'Barbell Curl' },
      ],
    },
    {
      dayName: 'Day C',
      focus: 'Full Body — Legs + Incline + Row',
      slots: [
        { movementPattern: 'SQUAT', sets: 3, repsMin: 10, repsMax: 12, restSeconds: REST_SECONDS.BEGINNER, notes: 'Leg Press' },
        { movementPattern: 'PUSH_HORIZONTAL', muscleTarget: 'incline', sets: 3, repsMin: 8, repsMax: 10, restSeconds: REST_SECONDS.BEGINNER, notes: 'Incline DB Press' },
        { movementPattern: 'PULL_HORIZONTAL', sets: 3, repsMin: 10, repsMax: 12, restSeconds: REST_SECONDS.BEGINNER, notes: 'Seated Row' },
        { movementPattern: 'PUSH_VERTICAL', muscleTarget: 'lateral', sets: 3, repsMin: 12, repsMax: 15, restSeconds: REST_SECONDS.ISOLATION_SHORT, notes: 'Lateral Raise' },
        { movementPattern: null, muscleTarget: 'calf', sets: 3, repsMin: 12, repsMax: 15, restSeconds: REST_SECONDS.ISOLATION_SHORT, notes: 'Calf Raise' },
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
        { movementPattern: 'PUSH_HORIZONTAL', sets: 4, repsMin: 6, repsMax: 8, isHeavy: true, restSeconds: REST_SECONDS.MEDIUM, notes: 'Machine Chest Press' },
        { movementPattern: 'PULL_HORIZONTAL', sets: 4, repsMin: 6, repsMax: 8, restSeconds: REST_SECONDS.MEDIUM, notes: 'Barbell Row' },
        { movementPattern: 'PUSH_VERTICAL', sets: 3, repsMin: 8, repsMax: 10, restSeconds: REST_SECONDS.MEDIUM, notes: 'Overhead Press' },
        { movementPattern: 'PULL_VERTICAL', sets: 3, repsMin: 8, repsMax: 10, restSeconds: REST_SECONDS.MEDIUM, notes: 'Lat Pulldown' },
        { movementPattern: null, muscleTarget: 'tricep', sets: 3, repsMin: 10, repsMax: 12, restSeconds: REST_SECONDS.MEDIUM, notes: 'Tricep Pushdown' },
        { movementPattern: null, muscleTarget: 'bicep', sets: 3, repsMin: 10, repsMax: 12, restSeconds: REST_SECONDS.MEDIUM, notes: 'Barbell Curl' },
      ],
    },
    {
      dayName: 'Lower A',
      focus: 'Lower — Quad Focus',
      slots: [
        { movementPattern: 'SQUAT', muscleTarget: 'leg_press', sets: 4, repsMin: 6, repsMax: 8, isHeavy: true, restSeconds: REST_SECONDS.MEDIUM, notes: 'Leg Press / Hack Squat' },
        { movementPattern: 'HINGE', muscleTarget: 'rdl', sets: 3, repsMin: 8, repsMax: 10, restSeconds: REST_SECONDS.MEDIUM, notes: 'Romanian Deadlift' },
        { movementPattern: 'SQUAT', sets: 3, repsMin: 10, repsMax: 12, restSeconds: REST_SECONDS.PPL_ACCESSORY, notes: 'Leg Press' },
        { movementPattern: null, muscleTarget: 'hamstring_curl', sets: 3, repsMin: 10, repsMax: 12, restSeconds: REST_SECONDS.MEDIUM, notes: 'Leg Curl' },
        { movementPattern: null, muscleTarget: 'calf', sets: 4, repsMin: 12, repsMax: 15, restSeconds: REST_SECONDS.ISOLATION_SHORT, notes: 'Calf Raise' },
      ],
    },
    {
      dayName: 'Upper B',
      focus: 'Upper — Hypertrophy',
      slots: [
        { movementPattern: 'PUSH_HORIZONTAL', muscleTarget: 'incline', sets: 3, repsMin: 8, repsMax: 10, restSeconds: REST_SECONDS.MEDIUM, notes: 'Incline DB Press' },
        { movementPattern: 'PULL_VERTICAL', muscleTarget: 'pullup', sets: 3, repsMin: 6, repsMax: 8, isHeavy: true, restSeconds: REST_SECONDS.MEDIUM, notes: 'Pull-Up' },
        { movementPattern: 'PULL_HORIZONTAL', sets: 3, repsMin: 10, repsMax: 12, restSeconds: REST_SECONDS.MEDIUM, notes: 'Seated Row' },
        { movementPattern: 'PUSH_VERTICAL', muscleTarget: 'lateral', sets: 3, repsMin: 12, repsMax: 15, restSeconds: REST_SECONDS.ISOLATION_SHORT, notes: 'Lateral Raise' },
        { movementPattern: null, muscleTarget: 'tricep', sets: 3, repsMin: 10, repsMax: 12, restSeconds: REST_SECONDS.MEDIUM, notes: 'Skull Crusher' },
        { movementPattern: null, muscleTarget: 'bicep', sets: 3, repsMin: 10, repsMax: 12, restSeconds: REST_SECONDS.MEDIUM, notes: 'Barbell Curl' },
      ],
    },
    {
      dayName: 'Lower B',
      focus: 'Lower — Posterior Chain',
      slots: [
        { movementPattern: 'HINGE', muscleTarget: 'deadlift', sets: 3, repsMin: 4, repsMax: 6, isHeavy: true, restSeconds: REST_SECONDS.MEDIUM, notes: 'Deadlift' },
        { movementPattern: 'LUNGE', sets: 3, repsMin: 10, repsMax: 12, restSeconds: REST_SECONDS.MEDIUM, notes: 'Bulgarian Split Squat' },
        { movementPattern: null, muscleTarget: 'quad_isolation', sets: 3, repsMin: 12, repsMax: 15, restSeconds: REST_SECONDS.MEDIUM, notes: 'Leg Extension' },
        { movementPattern: null, muscleTarget: 'hamstring_curl', sets: 3, repsMin: 10, repsMax: 12, restSeconds: REST_SECONDS.MEDIUM, notes: 'Leg Curl' },
        { movementPattern: null, muscleTarget: 'calf', sets: 4, repsMin: 12, repsMax: 15, restSeconds: REST_SECONDS.ISOLATION_SHORT, notes: 'Calf Raise' },
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
      dayName: 'Push A',
      focus: 'Push — Chest',
      slots: [
        { movementPattern: 'PUSH_HORIZONTAL', sets: 4, repsMin: 6, repsMax: 8, isHeavy: true, restSeconds: REST_SECONDS.ADVANCED_COMPOUND, notes: 'Machine Chest Press' },
        { movementPattern: 'PUSH_HORIZONTAL', muscleTarget: 'incline', sets: 3, repsMin: 8, repsMax: 10, restSeconds: REST_SECONDS.ADVANCED_COMPOUND, notes: 'Incline DB Press' },
        { movementPattern: 'PUSH_VERTICAL', sets: 3, repsMin: 8, repsMax: 10, restSeconds: REST_SECONDS.ADVANCED_COMPOUND, notes: 'Overhead Press' },
        { movementPattern: 'PUSH_VERTICAL', muscleTarget: 'lateral', sets: 3, repsMin: 12, repsMax: 15, restSeconds: REST_SECONDS.ADVANCED_ISOLATION, notes: 'Lateral Raise' },
        { movementPattern: null, muscleTarget: 'tricep', sets: 3, repsMin: 10, repsMax: 12, restSeconds: REST_SECONDS.ADVANCED_ISOLATION, notes: 'Tricep Pushdown' },
      ],
    },
    {
      dayName: 'Pull A',
      focus: 'Pull — Lats',
      slots: [
        { movementPattern: 'PULL_VERTICAL', muscleTarget: 'pullup', sets: 4, repsMin: 6, repsMax: 8, isHeavy: true, restSeconds: REST_SECONDS.ADVANCED_COMPOUND, notes: 'Pull-Up' },
        { movementPattern: 'PULL_HORIZONTAL', sets: 3, repsMin: 8, repsMax: 10, restSeconds: REST_SECONDS.ADVANCED_COMPOUND, notes: 'Barbell Row' },
        { movementPattern: 'PULL_VERTICAL', sets: 3, repsMin: 10, repsMax: 12, restSeconds: REST_SECONDS.ADVANCED_COMPOUND, notes: 'Lat Pulldown' },
        { movementPattern: 'PULL_HORIZONTAL', muscleTarget: 'face_pull', sets: 3, repsMin: 12, repsMax: 15, restSeconds: REST_SECONDS.ADVANCED_ISOLATION, notes: 'Face Pull' },
        { movementPattern: null, muscleTarget: 'bicep', sets: 3, repsMin: 10, repsMax: 12, restSeconds: REST_SECONDS.ADVANCED_ISOLATION, notes: 'Barbell Curl' },
      ],
    },
    {
      dayName: 'Legs A',
      focus: 'Legs — Quads',
      slots: [
        { movementPattern: 'SQUAT', muscleTarget: 'hack_squat', sets: 4, repsMin: 6, repsMax: 8, isHeavy: true, restSeconds: REST_SECONDS.ADVANCED_COMPOUND, notes: 'Hack Squat' },
        { movementPattern: 'SQUAT', sets: 3, repsMin: 10, repsMax: 12, restSeconds: REST_SECONDS.ADVANCED_COMPOUND, notes: 'Leg Press' },
        { movementPattern: null, muscleTarget: 'quad_isolation', sets: 3, repsMin: 12, repsMax: 15, restSeconds: REST_SECONDS.ADVANCED_ISOLATION, notes: 'Leg Extension' },
        { movementPattern: null, muscleTarget: 'hamstring_curl', sets: 3, repsMin: 10, repsMax: 12, restSeconds: REST_SECONDS.ADVANCED_ISOLATION, notes: 'Leg Curl' },
        { movementPattern: null, muscleTarget: 'calf', sets: 4, repsMin: 12, repsMax: 15, restSeconds: REST_SECONDS.ADVANCED_ISOLATION, notes: 'Calf Raise' },
      ],
    },
    {
      dayName: 'Push B',
      focus: 'Push — Shoulders',
      slots: [
        { movementPattern: 'PUSH_VERTICAL', muscleTarget: 'overhead_press', sets: 4, repsMin: 5, repsMax: 6, isHeavy: true, restSeconds: REST_SECONDS.ADVANCED_COMPOUND, notes: 'Overhead Press' },
        { movementPattern: 'PUSH_HORIZONTAL', muscleTarget: 'incline', sets: 3, repsMin: 8, repsMax: 10, restSeconds: REST_SECONDS.ADVANCED_COMPOUND, notes: 'Incline DB Press' },
        { movementPattern: 'PUSH_HORIZONTAL', sets: 3, repsMin: 12, repsMax: 15, restSeconds: REST_SECONDS.ADVANCED_ISOLATION, notes: 'Cable Fly' },
        { movementPattern: 'PUSH_VERTICAL', muscleTarget: 'lateral', sets: 4, repsMin: 12, repsMax: 15, restSeconds: REST_SECONDS.ADVANCED_ISOLATION, notes: 'Lateral Raise' },
        { movementPattern: null, muscleTarget: 'tricep', sets: 3, repsMin: 10, repsMax: 12, restSeconds: REST_SECONDS.ADVANCED_ISOLATION, notes: 'Skull Crusher' },
      ],
    },
    {
      dayName: 'Pull B',
      focus: 'Pull — Mid-Back',
      slots: [
        { movementPattern: 'PULL_VERTICAL', sets: 3, repsMin: 10, repsMax: 12, restSeconds: REST_SECONDS.ADVANCED_COMPOUND, notes: 'Lat Pulldown' },
        { movementPattern: 'PULL_HORIZONTAL', sets: 3, repsMin: 10, repsMax: 12, restSeconds: REST_SECONDS.ADVANCED_COMPOUND, notes: 'Seated Row' },
        { movementPattern: 'PULL_HORIZONTAL', muscleTarget: 'chest_supported_row', sets: 3, repsMin: 10, repsMax: 12, restSeconds: REST_SECONDS.ADVANCED_COMPOUND, notes: 'Chest Supported Row' },
        { movementPattern: 'PULL_HORIZONTAL', muscleTarget: 'face_pull', sets: 3, repsMin: 15, repsMax: 20, restSeconds: REST_SECONDS.ADVANCED_ISOLATION, notes: 'Face Pull' },
        { movementPattern: null, muscleTarget: 'bicep', sets: 3, repsMin: 10, repsMax: 12, restSeconds: REST_SECONDS.ADVANCED_ISOLATION, notes: 'Barbell Curl' },
      ],
    },
    {
      dayName: 'Legs B',
      focus: 'Legs — Posterior',
      slots: [
        { movementPattern: 'HINGE', muscleTarget: 'deadlift', sets: 3, repsMin: 3, repsMax: 5, isHeavy: true, restSeconds: REST_SECONDS.ADVANCED_COMPOUND, notes: 'Deadlift' },
        { movementPattern: 'HINGE', muscleTarget: 'rdl', sets: 3, repsMin: 8, repsMax: 10, restSeconds: REST_SECONDS.ADVANCED_COMPOUND, notes: 'Romanian Deadlift' },
        { movementPattern: null, muscleTarget: 'hip_thrust', sets: 3, repsMin: 10, repsMax: 12, restSeconds: REST_SECONDS.ADVANCED_ISOLATION, notes: 'Hip Thrust' },
        { movementPattern: null, muscleTarget: 'hamstring_curl', sets: 3, repsMin: 10, repsMax: 12, restSeconds: REST_SECONDS.ADVANCED_ISOLATION, notes: 'Leg Curl' },
        { movementPattern: null, muscleTarget: 'calf', sets: 4, repsMin: 12, repsMax: 15, restSeconds: REST_SECONDS.ADVANCED_ISOLATION, notes: 'Calf Raise' },
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

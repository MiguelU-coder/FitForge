// src/modules/routines/config/default-routines.ts
// Default routines with hardcoded exercise names per level, day, and slot
// Used for fuzzy matching against DB exercises

export type TrainingLevel = 'BEGINNER' | 'IRREGULAR' | 'MEDIUM' | 'ADVANCED';

export interface DefaultExerciseSlot {
  /** Exercise name to search in DB (partial match supported) */
  exerciseName: string;
  /** Fallback muscle if name not found */
  fallbackMuscle: string;
  /** Sets for this slot */
  sets: number;
  /** Reps range */
  reps: string;
  /** Rest in seconds */
  restSeconds: number;
  /** Notes for the user */
  notes?: string;
}

export interface DefaultDay {
  dayName: string;
  focus: string;
  slots: DefaultExerciseSlot[];
}

export interface DefaultRoutine {
  level: TrainingLevel;
  split: string;
  daysPerWeek: number;
  days: DefaultDay[];
}

// ─── IRREGULAR: Full Body 2-day ────────────────────────────────────────────────

const IRREGULAR_FULL_BODY: DefaultRoutine = {
  level: 'IRREGULAR',
  split: 'FULL_BODY',
  daysPerWeek: 2,
  days: [
    {
      dayName: 'Day A',
      focus: 'Full Body — Legs + Push + Pull',
      slots: [
        { exerciseName: 'Leg Press', fallbackMuscle: 'QUADS', sets: 3, reps: '6-8', restSeconds: 150, notes: 'Leg Press / Hack Squat' },
        { exerciseName: 'Chest Press', fallbackMuscle: 'CHEST', sets: 3, reps: '6-8', restSeconds: 150, notes: 'Machine Chest Press' },
        { exerciseName: 'Barbell Row', fallbackMuscle: 'BACK', sets: 3, reps: '8-10', restSeconds: 150, notes: 'Barbell Row' },
        { exerciseName: 'Romanian Deadlift', fallbackMuscle: 'HAMSTRINGS', sets: 2, reps: '8-10', restSeconds: 150, notes: 'Romanian Deadlift' },
        { exerciseName: 'Lateral Raise', fallbackMuscle: 'SHOULDERS', sets: 2, reps: '12-15', restSeconds: 60, notes: 'Lateral Raise' },
        { exerciseName: 'Tricep Pushdown', fallbackMuscle: 'TRICEPS', sets: 2, reps: '10-12', restSeconds: 60, notes: 'Tricep Pushdown' },
        { exerciseName: 'Barbell Curl', fallbackMuscle: 'BICEPS', sets: 2, reps: '10-12', restSeconds: 60, notes: 'Barbell Curl' },
      ],
    },
    {
      dayName: 'Day B',
      focus: 'Full Body — Deadlift + Press + Pull',
      slots: [
        { exerciseName: 'Deadlift', fallbackMuscle: 'BACK', sets: 3, reps: '4-6', restSeconds: 150, notes: 'Deadlift' },
        { exerciseName: 'Incline Dumbbell Press', fallbackMuscle: 'CHEST', sets: 3, reps: '8-10', restSeconds: 150, notes: 'Incline DB Press' },
        { exerciseName: 'Lat Pulldown', fallbackMuscle: 'LATS', sets: 3, reps: '8-10', restSeconds: 150, notes: 'Lat Pulldown' },
        { exerciseName: 'Leg Press', fallbackMuscle: 'QUADS', sets: 2, reps: '10-12', restSeconds: 75, notes: 'Leg Press' },
        { exerciseName: 'Face Pull', fallbackMuscle: 'TRAPS', sets: 2, reps: '12-15', restSeconds: 60, notes: 'Face Pull' },
        { exerciseName: 'Skull Crusher', fallbackMuscle: 'TRICEPS', sets: 2, reps: '10-12', restSeconds: 60, notes: 'Skull Crusher' },
        { exerciseName: 'Barbell Curl', fallbackMuscle: 'BICEPS', sets: 2, reps: '10-12', restSeconds: 60, notes: 'Barbell Curl' },
      ],
    },
  ],
};

// ─── BEGINNER: Full Body 3-day ───────────────────────────────────────────

const BEGINNER_FULL_BODY: DefaultRoutine = {
  level: 'BEGINNER',
  split: 'FULL_BODY',
  daysPerWeek: 3,
  days: [
    {
      dayName: 'Day A',
      focus: 'Full Body — Squat + Push + Pull',
      slots: [
        { exerciseName: 'Leg Press', fallbackMuscle: 'QUADS', sets: 3, reps: '6-8', restSeconds: 150, notes: 'Leg Press / Hack Squat' },
        { exerciseName: 'Chest Press', fallbackMuscle: 'CHEST', sets: 3, reps: '6-8', restSeconds: 150, notes: 'Machine Chest Press' },
        { exerciseName: 'Barbell Row', fallbackMuscle: 'BACK', sets: 3, reps: '8-10', restSeconds: 150, notes: 'Barbell Row' },
        { exerciseName: 'Calf Raise', fallbackMuscle: 'CALVES', sets: 3, reps: '12-15', restSeconds: 60, notes: 'Calf Raise' },
        { exerciseName: 'Tricep Pushdown', fallbackMuscle: 'TRICEPS', sets: 2, reps: '10-12', restSeconds: 60, notes: 'Tricep Pushdown' },
      ],
    },
    {
      dayName: 'Day B',
      focus: 'Full Body — Deadlift + Press + Pull-Up',
      slots: [
        { exerciseName: 'Deadlift', fallbackMuscle: 'BACK', sets: 3, reps: '4-6', restSeconds: 150, notes: 'Deadlift' },
        { exerciseName: 'Overhead Press', fallbackMuscle: 'SHOULDERS', sets: 3, reps: '8-10', restSeconds: 150, notes: 'Overhead Press' },
        { exerciseName: 'Pull-Up', fallbackMuscle: 'LATS', sets: 3, reps: '6-8', restSeconds: 150, notes: 'Pull-Up' },
        { exerciseName: 'Leg Curl', fallbackMuscle: 'HAMSTRINGS', sets: 3, reps: '10-12', restSeconds: 150, notes: 'Leg Curl' },
        { exerciseName: 'Barbell Curl', fallbackMuscle: 'BICEPS', sets: 2, reps: '10-12', restSeconds: 60, notes: 'Barbell Curl' },
      ],
    },
    {
      dayName: 'Day C',
      focus: 'Full Body — Legs + Incline + Row',
      slots: [
        { exerciseName: 'Leg Press', fallbackMuscle: 'QUADS', sets: 3, reps: '10-12', restSeconds: 150, notes: 'Leg Press' },
        { exerciseName: 'Incline Dumbbell Press', fallbackMuscle: 'CHEST', sets: 3, reps: '8-10', restSeconds: 150, notes: 'Incline DB Press' },
        { exerciseName: 'Seated Row', fallbackMuscle: 'BACK', sets: 3, reps: '10-12', restSeconds: 150, notes: 'Seated Row' },
        { exerciseName: 'Lateral Raise', fallbackMuscle: 'SHOULDERS', sets: 3, reps: '12-15', restSeconds: 60, notes: 'Lateral Raise' },
        { exerciseName: 'Calf Raise', fallbackMuscle: 'CALVES', sets: 3, reps: '12-15', restSeconds: 60, notes: 'Calf Raise' },
      ],
    },
  ],
};

// ─── MEDIUM: Upper/Lower 4-day ─────────────────────────────────────────

const MEDIUM_UPPER_LOWER: DefaultRoutine = {
  level: 'MEDIUM',
  split: 'UPPER_LOWER',
  daysPerWeek: 4,
  days: [
    {
      dayName: 'Upper A',
      focus: 'Upper — Strength',
      slots: [
        { exerciseName: 'Chest Press', fallbackMuscle: 'CHEST', sets: 4, reps: '6-8', restSeconds: 90, notes: 'Machine Chest Press' },
        { exerciseName: 'Barbell Row', fallbackMuscle: 'BACK', sets: 4, reps: '6-8', restSeconds: 90, notes: 'Barbell Row' },
        { exerciseName: 'Overhead Press', fallbackMuscle: 'SHOULDERS', sets: 3, reps: '8-10', restSeconds: 90, notes: 'Overhead Press' },
        { exerciseName: 'Lat Pulldown', fallbackMuscle: 'LATS', sets: 3, reps: '8-10', restSeconds: 90, notes: 'Lat Pulldown' },
        { exerciseName: 'Tricep Pushdown', fallbackMuscle: 'TRICEPS', sets: 3, reps: '10-12', restSeconds: 90, notes: 'Tricep Pushdown' },
        { exerciseName: 'Barbell Curl', fallbackMuscle: 'BICEPS', sets: 3, reps: '10-12', restSeconds: 90, notes: 'Barbell Curl' },
      ],
    },
    {
      dayName: 'Lower A',
      focus: 'Lower — Quad Focus',
      slots: [
        { exerciseName: 'Leg Press', fallbackMuscle: 'QUADS', sets: 4, reps: '6-8', restSeconds: 90, notes: 'Leg Press / Hack Squat' },
        { exerciseName: 'Romanian Deadlift', fallbackMuscle: 'HAMSTRINGS', sets: 3, reps: '8-10', restSeconds: 90, notes: 'Romanian Deadlift' },
        { exerciseName: 'Leg Press', fallbackMuscle: 'QUADS', sets: 3, reps: '10-12', restSeconds: 75, notes: 'Leg Press' },
        { exerciseName: 'Leg Curl', fallbackMuscle: 'HAMSTRINGS', sets: 3, reps: '10-12', restSeconds: 90, notes: 'Leg Curl' },
        { exerciseName: 'Calf Raise', fallbackMuscle: 'CALVES', sets: 4, reps: '12-15', restSeconds: 60, notes: 'Calf Raise' },
      ],
    },
    {
      dayName: 'Upper B',
      focus: 'Upper — Hypertrophy',
      slots: [
        { exerciseName: 'Incline Dumbbell Press', fallbackMuscle: 'CHEST', sets: 3, reps: '8-10', restSeconds: 90, notes: 'Incline DB Press' },
        { exerciseName: 'Pull-Up', fallbackMuscle: 'LATS', sets: 3, reps: '6-8', restSeconds: 90, notes: 'Pull-Up' },
        { exerciseName: 'Seated Row', fallbackMuscle: 'BACK', sets: 3, reps: '10-12', restSeconds: 90, notes: 'Seated Row' },
        { exerciseName: 'Lateral Raise', fallbackMuscle: 'SHOULDERS', sets: 3, reps: '12-15', restSeconds: 60, notes: 'Lateral Raise' },
        { exerciseName: 'Skull Crusher', fallbackMuscle: 'TRICEPS', sets: 3, reps: '10-12', restSeconds: 90, notes: 'Skull Crusher' },
        { exerciseName: 'Barbell Curl', fallbackMuscle: 'BICEPS', sets: 3, reps: '10-12', restSeconds: 90, notes: 'Barbell Curl' },
      ],
    },
    {
      dayName: 'Lower B',
      focus: 'Lower — Posterior Chain',
      slots: [
        { exerciseName: 'Deadlift', fallbackMuscle: 'BACK', sets: 3, reps: '4-6', restSeconds: 90, notes: 'Deadlift' },
        { exerciseName: 'Bulgarian Split Squat', fallbackMuscle: 'QUADS', sets: 3, reps: '10-12', restSeconds: 90, notes: 'Bulgarian Split Squat' },
        { exerciseName: 'Leg Extension', fallbackMuscle: 'QUADS', sets: 3, reps: '12-15', restSeconds: 90, notes: 'Leg Extension' },
        { exerciseName: 'Leg Curl', fallbackMuscle: 'HAMSTRINGS', sets: 3, reps: '10-12', restSeconds: 90, notes: 'Leg Curl' },
        { exerciseName: 'Calf Raise', fallbackMuscle: 'CALVES', sets: 4, reps: '12-15', restSeconds: 60, notes: 'Calf Raise' },
      ],
    },
  ],
};

// ─── ADVANCED: PPL 6-day ────────────────────────────────────────────────

const ADVANCED_PPL: DefaultRoutine = {
  level: 'ADVANCED',
  split: 'PPL',
  daysPerWeek: 6,
  days: [
    {
      dayName: 'Push A',
      focus: 'Push — Chest',
      slots: [
        { exerciseName: 'Chest Press', fallbackMuscle: 'CHEST', sets: 4, reps: '6-8', restSeconds: 180, notes: 'Machine Chest Press' },
        { exerciseName: 'Incline Dumbbell Press', fallbackMuscle: 'CHEST', sets: 3, reps: '8-10', restSeconds: 180, notes: 'Incline DB Press' },
        { exerciseName: 'Overhead Press', fallbackMuscle: 'SHOULDERS', sets: 3, reps: '8-10', restSeconds: 180, notes: 'Overhead Press' },
        { exerciseName: 'Lateral Raise', fallbackMuscle: 'SHOULDERS', sets: 3, reps: '12-15', restSeconds: 90, notes: 'Lateral Raise' },
        { exerciseName: 'Tricep Pushdown', fallbackMuscle: 'TRICEPS', sets: 3, reps: '10-12', restSeconds: 90, notes: 'Tricep Pushdown' },
      ],
    },
    {
      dayName: 'Pull A',
      focus: 'Pull — Lats',
      slots: [
        { exerciseName: 'Pull-Up', fallbackMuscle: 'LATS', sets: 4, reps: '6-8', restSeconds: 180, notes: 'Pull-Up' },
        { exerciseName: 'Barbell Row', fallbackMuscle: 'BACK', sets: 3, reps: '8-10', restSeconds: 180, notes: 'Barbell Row' },
        { exerciseName: 'Lat Pulldown', fallbackMuscle: 'LATS', sets: 3, reps: '10-12', restSeconds: 180, notes: 'Lat Pulldown' },
        { exerciseName: 'Face Pull', fallbackMuscle: 'TRAPS', sets: 3, reps: '12-15', restSeconds: 90, notes: 'Face Pull' },
        { exerciseName: 'Barbell Curl', fallbackMuscle: 'BICEPS', sets: 3, reps: '10-12', restSeconds: 90, notes: 'Barbell Curl' },
      ],
    },
    {
      dayName: 'Legs A',
      focus: 'Legs — Quads',
      slots: [
        { exerciseName: 'Hack Squat', fallbackMuscle: 'QUADS', sets: 4, reps: '6-8', restSeconds: 180, notes: 'Hack Squat' },
        { exerciseName: 'Leg Press', fallbackMuscle: 'QUADS', sets: 3, reps: '10-12', restSeconds: 180, notes: 'Leg Press' },
        { exerciseName: 'Leg Extension', fallbackMuscle: 'QUADS', sets: 3, reps: '12-15', restSeconds: 90, notes: 'Leg Extension' },
        { exerciseName: 'Leg Curl', fallbackMuscle: 'HAMSTRINGS', sets: 3, reps: '10-12', restSeconds: 90, notes: 'Leg Curl' },
        { exerciseName: 'Calf Raise', fallbackMuscle: 'CALVES', sets: 4, reps: '12-15', restSeconds: 90, notes: 'Calf Raise' },
      ],
    },
    {
      dayName: 'Push B',
      focus: 'Push — Shoulders',
      slots: [
        { exerciseName: 'Overhead Press', fallbackMuscle: 'SHOULDERS', sets: 4, reps: '5-6', restSeconds: 180, notes: 'Overhead Press' },
        { exerciseName: 'Incline Dumbbell Press', fallbackMuscle: 'CHEST', sets: 3, reps: '8-10', restSeconds: 180, notes: 'Incline DB Press' },
        { exerciseName: 'Cable Fly', fallbackMuscle: 'CHEST', sets: 3, reps: '12-15', restSeconds: 90, notes: 'Cable Fly' },
        { exerciseName: 'Lateral Raise', fallbackMuscle: 'SHOULDERS', sets: 4, reps: '12-15', restSeconds: 90, notes: 'Lateral Raise' },
        { exerciseName: 'Skull Crusher', fallbackMuscle: 'TRICEPS', sets: 3, reps: '10-12', restSeconds: 90, notes: 'Skull Crusher' },
      ],
    },
    {
      dayName: 'Pull B',
      focus: 'Pull — Mid-Back',
      slots: [
        { exerciseName: 'Lat Pulldown', fallbackMuscle: 'LATS', sets: 3, reps: '10-12', restSeconds: 180, notes: 'Lat Pulldown' },
        { exerciseName: 'Seated Row', fallbackMuscle: 'BACK', sets: 3, reps: '10-12', restSeconds: 180, notes: 'Seated Row' },
        { exerciseName: 'Chest Supported Row', fallbackMuscle: 'BACK', sets: 3, reps: '10-12', restSeconds: 180, notes: 'Chest Supported Row' },
        { exerciseName: 'Face Pull', fallbackMuscle: 'TRAPS', sets: 3, reps: '15-20', restSeconds: 90, notes: 'Face Pull' },
        { exerciseName: 'Barbell Curl', fallbackMuscle: 'BICEPS', sets: 3, reps: '10-12', restSeconds: 90, notes: 'Barbell Curl' },
      ],
    },
    {
      dayName: 'Legs B',
      focus: 'Legs — Posterior',
      slots: [
        { exerciseName: 'Deadlift', fallbackMuscle: 'BACK', sets: 3, reps: '3-5', restSeconds: 180, notes: 'Deadlift' },
        { exerciseName: 'Romanian Deadlift', fallbackMuscle: 'HAMSTRINGS', sets: 3, reps: '8-10', restSeconds: 180, notes: 'Romanian Deadlift' },
        { exerciseName: 'Hip Thrust', fallbackMuscle: 'GLUTES', sets: 3, reps: '10-12', restSeconds: 90, notes: 'Hip Thrust' },
        { exerciseName: 'Leg Curl', fallbackMuscle: 'HAMSTRINGS', sets: 3, reps: '10-12', restSeconds: 90, notes: 'Leg Curl' },
        { exerciseName: 'Calf Raise', fallbackMuscle: 'CALVES', sets: 4, reps: '12-15', restSeconds: 90, notes: 'Calf Raise' },
      ],
    },
  ],
};

// ─── Export by level ────────────────────────────────────────────────────

export const DEFAULT_ROUTINES: Record<TrainingLevel, DefaultRoutine> = {
  IRREGULAR: IRREGULAR_FULL_BODY,
  BEGINNER: BEGINNER_FULL_BODY,
  MEDIUM: MEDIUM_UPPER_LOWER,
  ADVANCED: ADVANCED_PPL,
};

export function getDefaultRoutine(level: TrainingLevel): DefaultRoutine {
  return DEFAULT_ROUTINES[level];
}

// ─── Goal-based adjustments ───────────────────────────────────────────

export type TrainingGoal = 'GAIN_MUSCLE_MASS' | 'LOSE_FAT' | 'KEEP_FIT' | 'GET_STRONGER';

export interface GoalAdjustment {
  setsMultiplier: number;
  repsRange: string;
  restSeconds: number;
}

/**
 * Adjust reps/sets based on training goal.
 * GAIN_MUSCLE_MASS: higher sets, medium reps
 * LOSE_FAT: medium sets, higher reps, more rest
 * KEEP_FIT: same as GAIN_MUSCLE_MASS
 * GET_STRONGER: lower reps heavier
 */
export const GOAL_ADJUSTMENTS: Record<TrainingGoal, GoalAdjustment> = {
  GAIN_MUSCLE_MASS: { setsMultiplier: 1.2, repsRange: '8-10', restSeconds: 150 },
  LOSE_FAT: { setsMultiplier: 1.0, repsRange: '12-15', restSeconds: 90 },
  KEEP_FIT: { setsMultiplier: 1.0, repsRange: '8-12', restSeconds: 120 },
  GET_STRONGER: { setsMultiplier: 1.0, repsRange: '4-6', restSeconds: 180 },
};

export function adjustForGoal(
  slot: DefaultExerciseSlot,
  goal: TrainingGoal | undefined,
): DefaultExerciseSlot {
  if (!goal || goal === 'GET_STRONGER') {
    return slot;
  }

  const adjustment = GOAL_ADJUSTMENTS[goal];
  const adjustedSets = Math.round(slot.sets * adjustment.setsMultiplier);

  return {
    ...slot,
    sets: Math.max(2, adjustedSets),
    reps: adjustment.repsRange,
    restSeconds: adjustment.restSeconds,
  };
}
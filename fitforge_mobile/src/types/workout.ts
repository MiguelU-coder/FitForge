// src/types/workout.ts
// Port of workout_models.dart and routines_provider.dart Routine models

export interface SetLog {
  id: string;
  setNumber: number;
  setType: 'WARMUP' | 'WORKING' | 'DROP' | 'FAILURE';
  weightKg?: number;
  weightKgLeft?: number;
  weightKgRight?: number;
  reps?: number;
  repsLeft?: number;
  repsRight?: number;
  rir?: number;
  rpe?: number;
  durationSeconds?: number;
  distanceM?: number;
  isPr: boolean;
  isFailed: boolean;
  completedAt?: string;
}

export interface ExerciseBlock {
  id: string;
  exerciseId: string;
  exerciseName: string;
  primaryMuscles: string[];
  isUnilateral: boolean;
  sortOrder: number;
  sets: SetLog[];
  imageUrl?: string;
  restSeconds?: number;
}

export interface WorkoutSession {
  id: string;
  name: string;
  startedAt: string;
  finishedAt?: string;
  durationSeconds?: number;
  perceivedExertion?: number;
  bodyWeightKg?: number;
  notes?: string;
  exerciseBlocks: ExerciseBlock[];
  exerciseBlockCount?: number;
}

export interface LastPerformanceSet {
  weightKg?: number;
  reps?: number;
}

export interface LastPerformance {
  date: string;
  sets: LastPerformanceSet[];
}

export interface RoutineItem {
  id: string;
  exerciseId: string;
  exerciseName: string;
  primaryMuscles: string[];
  sortOrder: number;
  targetSets?: number;
  targetReps?: number;
  targetRir?: number;
}

export interface RoutineTemplate {
  id: string;
  programId: string;
  name: string;
  dayOfWeek?: number;
  sortOrder: number;
  items: RoutineItem[];
}

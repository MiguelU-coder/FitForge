// src/types/exercise.ts
// Port of exercise_model.dart

import { AppConstants } from '../constants';

export interface Exercise {
  id: string;
  name: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipment?: string;
  movementPattern?: string;
  isUnilateral: boolean;
  isCustom: boolean;
  imageUrl?: string;
  isExternal: boolean;
}

export interface ExercisesPage {
  exercises: Exercise[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ExerciseFilters {
  search: string;
  muscle?: string;
  equipment?: string;
  useExternal: boolean;
}

// ── Parse function (handles relative image URLs) ──
export function parseExercise(json: Record<string, unknown>): Exercise {
  let imageUrl: string | undefined;
  const raw = json.imageUrl as string | undefined;
  if (raw) {
    if (raw.startsWith('http')) {
      imageUrl = raw;
    } else {
      const base = new URL(AppConstants.baseUrl);
      imageUrl = `${base.origin}${raw}`;
    }
  }

  return {
    id: json.id as string,
    name: json.name as string,
    primaryMuscles: (json.primaryMuscles as string[]) ?? [],
    secondaryMuscles: (json.secondaryMuscles as string[]) ?? [],
    equipment: json.equipment as string | undefined,
    movementPattern: json.movementPattern as string | undefined,
    isUnilateral: (json.isUnilateral as boolean) ?? false,
    isCustom: (json.isCustom as boolean) ?? false,
    imageUrl,
    isExternal: (json.isExternal as boolean) ?? false,
  };
}

export function parseExercisesPage(json: Record<string, unknown>): ExercisesPage {
  return {
    exercises: ((json.exercises as Record<string, unknown>[]) ?? []).map(parseExercise),
    total: json.total as number,
    page: json.page as number,
    totalPages: json.totalPages as number,
  };
}

// ── Filter constants ──
export const MUSCLE_GROUPS = [
  'CHEST', 'BACK', 'SHOULDERS', 'BICEPS', 'TRICEPS',
  'QUADS', 'HAMSTRINGS', 'GLUTES', 'CALVES', 'ABS',
  'LATS', 'TRAPS', 'CORE', 'FOREARMS', 'HIP_FLEXORS',
] as const;

export const EQUIPMENT_LIST = [
  'BARBELL', 'DUMBBELL', 'CABLE', 'MACHINE',
  'BODYWEIGHT', 'KETTLEBELL', 'RESISTANCE_BAND',
] as const;

export function formatLabel(s: string): string {
  return s.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

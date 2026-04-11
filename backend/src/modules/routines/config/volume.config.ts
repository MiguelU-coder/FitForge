// backend/src/modules/routines/config/volume.config.ts
/**
 * Minimum weekly volume per muscle group based on hypertrophy research.
 * References:
 * - Schoenfeld et al. (2017): Dose-response relationship between training volume and muscle growth
 * - ACSM Guidelines: Minimum effective volume for hypertrophy
 *
 * Values represent MINIMUM sets per week for trained individuals.
 * Advanced lifters may require 1.5-2x these values for continued progress.
 */

export interface MuscleVolumeConfig {
  muscleGroup: string;
  minSetsPerWeek: number;
  optimalSetsPerWeek: number;
  maxRecoveryableSets: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export const WEEKLY_VOLUME_CONFIG: Record<string, MuscleVolumeConfig> = {
  // Upper Body Push
  CHEST: {
    muscleGroup: 'CHEST',
    minSetsPerWeek: 10,
    optimalSetsPerWeek: 14,
    maxRecoveryableSets: 20,
    priority: 'HIGH',
  },
  SHOULDERS: {
    muscleGroup: 'SHOULDERS',
    minSetsPerWeek: 8,
    optimalSetsPerWeek: 12,
    maxRecoveryableSets: 18,
    priority: 'HIGH',
  },
  TRICEPS: {
    muscleGroup: 'TRICEPS',
    minSetsPerWeek: 6,
    optimalSetsPerWeek: 10,
    maxRecoveryableSets: 16,
    priority: 'MEDIUM',
  },

  // Upper Body Pull
  BACK: {
    muscleGroup: 'BACK',
    minSetsPerWeek: 10,
    optimalSetsPerWeek: 14,
    maxRecoveryableSets: 20,
    priority: 'HIGH',
  },
  LATS: {
    muscleGroup: 'LATS',
    minSetsPerWeek: 8,
    optimalSetsPerWeek: 12,
    maxRecoveryableSets: 16,
    priority: 'HIGH',
  },
  TRAPS: {
    muscleGroup: 'TRAPS',
    minSetsPerWeek: 6,
    optimalSetsPerWeek: 10,
    maxRecoveryableSets: 14,
    priority: 'MEDIUM',
  },
  BICEPS: {
    muscleGroup: 'BICEPS',
    minSetsPerWeek: 6,
    optimalSetsPerWeek: 10,
    maxRecoveryableSets: 16,
    priority: 'MEDIUM',
  },

  // Lower Body
  QUADS: {
    muscleGroup: 'QUADS',
    minSetsPerWeek: 12,
    optimalSetsPerWeek: 16,
    maxRecoveryableSets: 22,
    priority: 'HIGH',
  },
  HAMSTRINGS: {
    muscleGroup: 'HAMSTRINGS',
    minSetsPerWeek: 8,
    optimalSetsPerWeek: 12,
    maxRecoveryableSets: 18,
    priority: 'HIGH',
  },
  GLUTES: {
    muscleGroup: 'GLUTES',
    minSetsPerWeek: 8,
    optimalSetsPerWeek: 12,
    maxRecoveryableSets: 18,
    priority: 'HIGH',
  },
  CALVES: {
    muscleGroup: 'CALVES',
    minSetsPerWeek: 4,
    optimalSetsPerWeek: 8,
    maxRecoveryableSets: 12,
    priority: 'LOW',
  },

  // Core
  ABS: {
    muscleGroup: 'ABS',
    minSetsPerWeek: 4,
    optimalSetsPerWeek: 8,
    maxRecoveryableSets: 12,
    priority: 'LOW',
  },
};

/**
 * Muscle groups that must be covered in every weekly routine.
 * These are the primary tracking categories for volume validation.
 */
export const REQUIRED_MUSCLE_GROUPS = [
  'CHEST',
  'BACK',
  'SHOULDERS',
  'BICEPS',
  'TRICEPS',
  'QUADS',
  'HAMSTRINGS',
  'GLUTES',
  'CALVES',
  'ABS',
] as const;

export type RequiredMuscleGroup = (typeof REQUIRED_MUSCLE_GROUPS)[number];

/**
 * Get minimum sets for a muscle group.
 * @param muscleGroup - Muscle group name
 * @returns Minimum sets per week (defaults to 6 if not configured)
 */
export function getMinSetsForMuscle(muscleGroup: string): number {
  return WEEKLY_VOLUME_CONFIG[muscleGroup]?.minSetsPerWeek ?? 6;
}

/**
 * Check if a muscle group has reached minimum weekly volume.
 */
export function isVolumeSufficient(muscleGroup: string, currentSets: number): boolean {
  const minSets = getMinSetsForMuscle(muscleGroup);
  return currentSets >= minSets;
}

/**
 * Get remaining sets needed to reach minimum volume.
 */
export function getRemainingSets(muscleGroup: string, currentSets: number): number {
  const minSets = getMinSetsForMuscle(muscleGroup);
  return Math.max(0, minSets - currentSets);
}

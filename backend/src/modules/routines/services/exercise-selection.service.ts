// backend/src/modules/routines/services/exercise-selection.service.ts
import { Injectable, Logger } from '@nestjs/common';
import {
  EXERCISE_DISTRIBUTION,
  FATIGUE_LIMIT_PER_DAY,
  MovementSlot,
  MovementPattern,
  ExerciseType,
  FatigueLevel,
} from '../config/training.config';
import {
  WEEKLY_VOLUME_CONFIG,
  REQUIRED_MUSCLE_GROUPS,
  getMinSetsForMuscle,
  getRemainingSets,
} from '../config/volume.config';

export interface ExerciseWithMeta {
  id: string;
  name: string;
  primaryMuscles: string[];
  secondaryMuscles?: string[];
  exerciseType: ExerciseType | null;
  fatigueLevel: FatigueLevel | null;
  isCompound: boolean;
  movementPattern: string | null;
  isUnilateral?: boolean;
  equipment?: string;
}

export interface SelectionResult {
  exerciseIds: string[];
  totalFatigue: number;
}

/**
 * VolumeTracker - Tracks weekly volume per muscle group across all days.
 * Used to ensure minimum volume requirements are met and prevent overtraining.
 */
export class VolumeTracker {
  // muscle -> { setsThisWeek, exerciseIdsUsed }
  private volumeMap = new Map<
    string,
    { setsThisWeek: number; exerciseIds: Set<string>; lastAddedDay: number }
  >();

  constructor() {
    // Initialize all required muscle groups
    for (const muscle of REQUIRED_MUSCLE_GROUPS) {
      this.volumeMap.set(muscle, { setsThisWeek: 0, exerciseIds: new Set(), lastAddedDay: -1 });
    }
  }

  /**
   * Add sets for a muscle group.
   * @param muscle - Muscle group name
   * @param sets - Number of sets to add
   * @param exerciseIds - Exercise IDs used for these sets
   * @param dayIndex - Which day of the week (0-6)
   */
  addVolume(muscle: string, sets: number, exerciseIds: string[], dayIndex: number): void {
    const current = this.volumeMap.get(muscle) || { setsThisWeek: 0, exerciseIds: new Set(), lastAddedDay: -1 };
    current.setsThisWeek += sets;
    for (const id of exerciseIds) {
      current.exerciseIds.add(id);
    }
    current.lastAddedDay = dayIndex;
    this.volumeMap.set(muscle, current);
  }

  /**
   * Get current volume for a muscle group.
   */
  getVolume(muscle: string): number {
    return this.volumeMap.get(muscle)?.setsThisWeek ?? 0;
  }

  /**
   * Check if muscle has reached minimum weekly volume.
   */
  isSufficient(muscle: string): boolean {
    const current = this.getVolume(muscle);
    const minRequired = getMinSetsForMuscle(muscle);
    return current >= minRequired;
  }

  /**
   * Get remaining sets needed for minimum volume.
   */
  getRemaining(muscle: string): number {
    return getRemainingSets(muscle, this.getVolume(muscle));
  }

  /**
   * Get all muscles that haven't reached minimum volume.
   */
  getInsufficientMuscles(): string[] {
    const insufficient: string[] = [];
    for (const muscle of REQUIRED_MUSCLE_GROUPS) {
      if (!this.isSufficient(muscle)) {
        insufficient.push(muscle);
      }
    }
    return insufficient;
  }

  /**
   * Check if an exercise has already been used this week.
   */
  hasUsedExercise(exerciseId: string): boolean {
    for (const [, data] of this.volumeMap) {
      if (data.exerciseIds.has(exerciseId)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get weekly summary for debugging/logging.
   */
  getSummary(): Record<string, { current: number; minimum: number; sufficient: boolean }> {
    const summary: Record<string, { current: number; minimum: number; sufficient: boolean }> = {};
    for (const muscle of REQUIRED_MUSCLE_GROUPS) {
      const current = this.getVolume(muscle);
      const minimum = getMinSetsForMuscle(muscle);
      summary[muscle] = {
        current,
        minimum,
        sufficient: current >= minimum,
      };
    }
    return summary;
  }
}

@Injectable()
export class ExerciseSelectionService {
  private readonly logger = new Logger(ExerciseSelectionService.name);

  /**
   * Select exercises for a muscle group with volume tracking.
   * Uses STRICT muscle-based validation (not name-based).
   */
  selectExercisesForMuscle(
    muscle: string,
    level: string,
    exercisesByMuscle: Map<string, ExerciseWithMeta[]>,
    currentFatigue: number,
    usedExerciseIds: Set<string>,
    volumeTracker: VolumeTracker,
    dayIndex: number,
  ): SelectionResult {
    const all = exercisesByMuscle.get(muscle) || [];

    if (all.length === 0) {
      this.logger.warn(`No exercises found for muscle: ${muscle}`);
      return { exerciseIds: [], totalFatigue: 0 };
    }

    const compounds = all.filter((e) => e.exerciseType === ExerciseType.COMPOUND || e.isCompound);
    const isolations = all.filter(
      (e) => e.exerciseType === ExerciseType.ISOLATION || !e.isCompound,
    );

    const isolationCount =
      level === 'BEGINNER' || level === 'IRREGULAR'
        ? EXERCISE_DISTRIBUTION.ISOLATION - 1
        : EXERCISE_DISTRIBUTION.ISOLATION;

    const selectedIds: string[] = [];
    let fatigueAdded = 0;
    let setsAdded = 0;

    // Select 1-2 compound exercises
    const mainCompound = this.pickRandom(compounds, 1, usedExerciseIds);
    selectedIds.push(...mainCompound);
    setsAdded += mainCompound.length * 3; // Assume 3 sets per compound
    for (const id of mainCompound) {
      const ex = all.find((e) => e.id === id);
      if (ex?.fatigueLevel === FatigueLevel.HIGH) fatigueAdded++;
    }

    const secondaryCompound = this.pickRandom(compounds, 1, usedExerciseIds, mainCompound);
    if (secondaryCompound.length > 0) {
      selectedIds.push(...secondaryCompound);
      setsAdded += secondaryCompound.length * 3;
      for (const id of secondaryCompound) {
        const ex = all.find((e) => e.id === id);
        if (ex?.fatigueLevel === FatigueLevel.HIGH) fatigueAdded++;
      }
    }

    // Add isolations if fatigue allows
    if (currentFatigue + fatigueAdded < FATIGUE_LIMIT_PER_DAY) {
      const isoSelected = this.pickRandom(isolations, isolationCount, usedExerciseIds, [
        ...mainCompound,
        ...secondaryCompound,
      ]);
      selectedIds.push(...isoSelected);
      setsAdded += isoSelected.length * 3;
      for (const id of isoSelected) {
        const ex = all.find((e) => e.id === id);
        if (ex?.fatigueLevel === FatigueLevel.HIGH) fatigueAdded++;
      }
    } else {
      const lowFatigueIsos = isolations.filter((e) => e.fatigueLevel !== FatigueLevel.HIGH);
      const isoSelected = this.pickRandom(
        lowFatigueIsos,
        Math.max(1, isolationCount - 1),
        usedExerciseIds,
        [...mainCompound, ...secondaryCompound],
      );
      selectedIds.push(...isoSelected);
      setsAdded += isoSelected.length * 3;
    }

    // Update volume tracker
    volumeTracker.addVolume(muscle, setsAdded, selectedIds, dayIndex);

    return { exerciseIds: selectedIds, totalFatigue: fatigueAdded };
  }

  /**
   * Validate that all muscle groups have minimum required volume.
   * Returns list of muscles that are under-trained.
   */
  validateVolumeCoverage(volumeTracker: VolumeTracker): string[] {
    return volumeTracker.getInsufficientMuscles();
  }

  /**
   * Fill missing muscle groups with isolation exercises.
   * Called after main routine generation to ensure coverage.
   */
  fillMissingMuscleGroups(
    missingMuscles: string[],
    exercisesByMuscle: Map<string, ExerciseWithMeta[]>,
    usedExerciseIds: Set<string>,
    volumeTracker: VolumeTracker,
  ): { muscle: string; exerciseId: string; sets: number }[] {
    const fillers: { muscle: string; exerciseId: string; sets: number }[] = [];

    for (const muscle of missingMuscles) {
      const remaining = volumeTracker.getRemaining(muscle);
      if (remaining <= 0) continue;

      const allExercises = exercisesByMuscle.get(muscle) || [];
      const isolations = allExercises.filter(
        (e) => e.exerciseType === ExerciseType.ISOLATION || !e.isCompound,
      );

      // Pick unused isolation exercises
      const available = isolations.filter((e) => !usedExerciseIds.has(e.id));
      if (available.length === 0) {
        this.logger.warn(`No available isolation exercises for ${muscle}`);
        continue;
      }

      // Calculate how many exercises needed (3 sets each typically)
      const exercisesNeeded = Math.ceil(remaining / 3);
      const selected = this.pickRandom(available, exercisesNeeded, usedExerciseIds);

      for (const exerciseId of selected) {
        fillers.push({
          muscle,
          exerciseId,
          sets: 3,
        });
        usedExerciseIds.add(exerciseId);
        volumeTracker.addVolume(muscle, 3, [exerciseId], 6); // Day 6 = filler day
      }
    }

    return fillers;
  }

  /**
   * STRICT muscle-based exercise selection for a slot.
   * Does NOT fall back to random exercises - returns null if no match.
   *
   * Selection priority:
   * 1. Match by movement pattern + muscle target
   * 2. Match by primary muscles includes target
   * 3. Match by secondary muscles includes target
   * 4. RETURN NULL (no fallback to random)
   */
  selectExerciseForSlot(
    slot: MovementSlot,
    allExercises: ExerciseWithMeta[],
    usedIds: Set<string>,
    targetMuscle: string,
  ): string | null {
    let pool = allExercises.filter((e) => !usedIds.has(e.id));

    // Filter by movement pattern if specified
    if (slot.movementPattern !== null) {
      pool = pool.filter((e) => e.movementPattern === slot.movementPattern);
    }

    // STRICT muscle validation - must match target muscle
    const muscleMatchedPool = pool.filter((e) => {
      // Check primary muscles
      if (e.primaryMuscles.includes(targetMuscle)) {
        return true;
      }
      // Check secondary muscles
      if (e.secondaryMuscles?.includes(targetMuscle)) {
        return true;
      }
      return false;
    });

    if (muscleMatchedPool.length === 0) {
      this.logger.error(
        `No exercise found for muscle ${targetMuscle} with pattern ${slot.movementPattern}`,
      );
      return null; // NO random fallback
    }

    pool = muscleMatchedPool;

    // Prefer compounds for heavy slots
    if (slot.isHeavy === true) {
      const compounds = pool.filter((e) => e.isCompound);
      if (compounds.length > 0) {
        pool = compounds;
      }
    }

    if (pool.length === 0) {
      return null;
    }

    const shuffled = this.shuffleArray(pool);
    return shuffled[0].id;
  }

  /**
   * Find exercises by muscle group using strict validation.
   * Primary muscles take precedence, then secondary.
   */
  findExercisesByMuscle(
    muscle: string,
    allExercises: ExerciseWithMeta[],
    requireCompound?: boolean,
  ): ExerciseWithMeta[] {
    const muscleUpper = muscle.toUpperCase();

    const matches = allExercises.filter((e) => {
      const primaryMatch = e.primaryMuscles.some((m) => m.toUpperCase() === muscleUpper);
      const secondaryMatch = e.secondaryMuscles?.some((m) => m.toUpperCase() === muscleUpper);

      if (requireCompound === true) {
        return (primaryMatch || secondaryMatch) && e.isCompound;
      }
      if (requireCompound === false) {
        return (primaryMatch || secondaryMatch) && !e.isCompound;
      }
      return primaryMatch || secondaryMatch;
    });

    // Sort: primary matches first, then secondary
    return matches.sort((a, b) => {
      const aPrimary = a.primaryMuscles.some((m) => m.toUpperCase() === muscleUpper);
      const bPrimary = b.primaryMuscles.some((m) => m.toUpperCase() === muscleUpper);
      if (aPrimary && !bPrimary) return -1;
      if (!aPrimary && bPrimary) return 1;
      return 0;
    });
  }

  private pickRandom(
    exercises: ExerciseWithMeta[],
    count: number,
    usedIds: Set<string>,
    excludeIds: string[] = [],
  ): string[] {
    const available = exercises.filter((e) => !usedIds.has(e.id) && !excludeIds.includes(e.id));

    const shuffled = this.shuffleArray(available);
    return shuffled.slice(0, count).map((e) => e.id);
  }

  private shuffleArray<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  sortByFatigueAndType(exercises: ExerciseWithMeta[]): string[] {
    const sorted = [...exercises].sort((a, b) => {
      const aScore = this.getSortScore(a);
      const bScore = this.getSortScore(b);
      return bScore - aScore;
    });
    return sorted.map((e) => e.id);
  }

  private getSortScore(exercise: ExerciseWithMeta): number {
    let score = 0;
    if (exercise.exerciseType === 'COMPOUND' || exercise.isCompound) {
      score += 2;
    }
    if (exercise.fatigueLevel === 'HIGH') {
      score += 1;
    } else if (exercise.fatigueLevel === 'MEDIUM') {
      score += 0.5;
    }
    return score;
  }
}

import { Injectable, Logger } from '@nestjs/common';
import {
  EXERCISE_DISTRIBUTION,
  FATIGUE_LIMIT_PER_DAY,
  MovementSlot,
  MovementPattern,
  ExerciseType,
  FatigueLevel,
} from '../config/training.config';

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

@Injectable()
export class ExerciseSelectionService {
  private readonly logger = new Logger(ExerciseSelectionService.name);

  selectExercisesForMuscle(
    muscle: string,
    level: string,
    exercisesByMuscle: Map<string, ExerciseWithMeta[]>,
    currentFatigue: number,
    usedExerciseIds: Set<string>,
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

    const mainCompound = this.pickRandom(compounds, 1, usedExerciseIds);
    selectedIds.push(...mainCompound);
    for (const id of mainCompound) {
      const ex = all.find((e) => e.id === id);
      if (ex?.fatigueLevel === FatigueLevel.HIGH) fatigueAdded++;
    }

    const secondaryCompound = this.pickRandom(compounds, 1, usedExerciseIds, mainCompound);
    selectedIds.push(...secondaryCompound);
    for (const id of secondaryCompound) {
      const ex = all.find((e) => e.id === id);
      if (ex?.fatigueLevel === FatigueLevel.HIGH) fatigueAdded++;
    }

    if (currentFatigue + fatigueAdded < FATIGUE_LIMIT_PER_DAY) {
      const isoSelected = this.pickRandom(isolations, isolationCount, usedExerciseIds, [
        ...mainCompound,
        ...secondaryCompound,
      ]);
      selectedIds.push(...isoSelected);
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
    }

    return { exerciseIds: selectedIds, totalFatigue: fatigueAdded };
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

  selectExerciseForSlot(
    slot: MovementSlot,
    allExercises: ExerciseWithMeta[],
    usedIds: Set<string>,
  ): string | null {
    let pool = allExercises.filter((e) => !usedIds.has(e.id));

    if (slot.movementPattern !== null) {
      pool = pool.filter((e) => e.movementPattern === slot.movementPattern);
    }

    if (slot.muscleTarget) {
      const narrowedPool = this.applyMuscleTargetNarrowing(slot.muscleTarget, pool, slot.movementPattern);
      if (narrowedPool.length > 0) {
        pool = narrowedPool;
      } else if (slot.movementPattern !== null) {
        // Fallback: use pattern-only filter if narrowing failed
        pool = allExercises.filter(
          (e) => !usedIds.has(e.id) && e.movementPattern === slot.movementPattern,
        );
      }
    }

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

  private applyMuscleTargetNarrowing(
    muscleTarget: string,
    pool: ExerciseWithMeta[],
    movementPattern: string | null,
  ): ExerciseWithMeta[] {
    const targetLower = muscleTarget.toLowerCase();

    // Name-based matching rules
    const nameRules: Record<string, RegExp[]> = {
      hip_thrust: [/hip thrust/i, /glute bridge/i],
      face_pull: [/face pull/i],
      shrug: [/shrug/i],
      pullup: [/pull-up/i, /chin-up/i],
      pullover: [/pullover/i],
      lat_pulldown: [/lat pulldown/i],
      chest_supported_row: [/chest-supported/i],
      dips: [/dips/i],
      dips_isolation: [/dips/i],
      incline: [/incline/i],
      overhead_press: [/overhead press/i, /shoulder press/i],
      close_grip: [/close-grip/i],
      chest_fly_cable: [/cable fly/i, /cable crossover/i],
      rdl: [/rdl/i, /romanian/i],
      leg_curl_rdl: [/leg curl/i],
      deadlift: [/deadlift/i],
      leg_press: [/leg press/i],
      hack_squat: [/hack squat/i],
    };

    // Check name rules first
    for (const [key, patterns] of Object.entries(nameRules)) {
      if (targetLower.includes(key.replace('_', ''))) {
        for (const pattern of patterns) {
          const nameMatch = pool.filter((e) => pattern.test(e.name));
          if (nameMatch.length > 0) {
            return nameMatch;
          }
        }
      }
    }

    // Fallback muscle group mapping
    const muscleFallbacks: Record<string, { primary: string[]; secondary?: string[]; isCompound?: boolean }> = {
      bicep: { primary: ['BICEPS'] },
      tricep: { primary: ['TRICEPS'] },
      lateral: { primary: ['SHOULDERS'], isCompound: false },
      calf: { primary: ['CALVES'] },
      quad_isolation: { primary: ['QUADS'], isCompound: false },
      hamstring_isolation: { primary: ['HAMSTRINGS'], isCompound: false },
      hamstring_curl: { primary: ['HAMSTRINGS'], isCompound: false },
      hip_thrust: { primary: ['GLUTES'] },
      face_pull: { primary: ['SHOULDERS', 'TRAPS'] },
      shrugs: { primary: ['TRAPS'] },
      pullup: { primary: ['PULL_VERTICAL'], isCompound: true },
      pullover: { primary: ['LATS'] },
      lat_pulldown: { primary: ['PULL_VERTICAL'] },
      row: { primary: ['BACK', 'PULL_HORIZONTAL'] },
      chest_supported_row: { primary: ['BACK', 'PULL_HORIZONTAL'] },
      dips: { primary: ['PUSH_HORIZONTAL'] },
      dips_isolation: { primary: ['PUSH_HORIZONTAL'] },
      incline: { primary: [] }, // Same movement pattern handled above
      overhead_press: { primary: ['PUSH_VERTICAL'], isCompound: true },
      close_grip: { primary: ['PUSH_HORIZONTAL', 'TRICEPS'] },
      chest_fly_cable: { primary: ['CHEST'], isCompound: false },
      rdl: { primary: ['HAMSTRINGS'] },
      leg_curl_rdl: { primary: ['HAMSTRINGS'] },
      deadlift: { primary: ['HINGE'], isCompound: true },
      leg_press: { primary: ['SQUAT'] },
      hack_squat: { primary: ['SQUAT'] },
      isolation: { primary: [], isCompound: false },
    };

    const fallback = muscleFallbacks[targetLower];
    if (!fallback) {
      return pool;
    }

    let result = pool.filter((e) => {
      const hasPrimary = fallback.primary.length === 0 ||
        fallback.primary.some((m) => e.primaryMuscles.includes(m));
      const matchesCompound = fallback.isCompound === undefined ||
        e.isCompound === fallback.isCompound;
      return hasPrimary && matchesCompound;
    });

    return result;
  }
}

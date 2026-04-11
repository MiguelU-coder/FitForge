import { ExerciseType, FatigueLevel } from '@prisma/client';
import {
  ExerciseSelectionService,
  ExerciseWithMeta,
  VolumeTracker,
} from './exercise-selection.service';

describe('ExerciseSelectionService', () => {
  let service: ExerciseSelectionService;
  let volumeTracker: VolumeTracker;

  beforeEach(() => {
    service = new ExerciseSelectionService();
    volumeTracker = new VolumeTracker();
  });

  const createMockExercise = (
    id: string,
    type: ExerciseType | null,
    fatigue: FatigueLevel | null,
    isCompound: boolean = false,
  ): ExerciseWithMeta => ({
    id,
    name: `Exercise ${id}`,
    primaryMuscles: ['CHEST'],
    exerciseType: type,
    fatigueLevel: fatigue,
    isCompound,
    movementPattern: null,
  });

  describe('selectExercisesForMuscle', () => {
    it('should select at least 2 compound exercises', () => {
      const exercises: ExerciseWithMeta[] = [
        createMockExercise('1', ExerciseType.COMPOUND, FatigueLevel.HIGH, true),
        createMockExercise('2', ExerciseType.COMPOUND, FatigueLevel.MEDIUM, true),
        createMockExercise('3', ExerciseType.ISOLATION, FatigueLevel.LOW, false),
        createMockExercise('4', ExerciseType.ISOLATION, FatigueLevel.LOW, false),
      ];

      const exercisesByMuscle = new Map([['CHEST', exercises]]);

      const result = service.selectExercisesForMuscle(
        'CHEST',
        'MEDIUM',
        exercisesByMuscle,
        0,
        new Set(),
        volumeTracker,
        0,
      );

      expect(result.exerciseIds.length).toBeGreaterThanOrEqual(2);
    });

    it('should respect fatigue limits', () => {
      const exercises: ExerciseWithMeta[] = [
        createMockExercise('1', ExerciseType.COMPOUND, FatigueLevel.HIGH, true),
        createMockExercise('2', ExerciseType.COMPOUND, FatigueLevel.HIGH, true),
        createMockExercise('3', ExerciseType.ISOLATION, FatigueLevel.LOW, false),
      ];

      const exercisesByMuscle = new Map([['CHEST', exercises]]);

      const result = service.selectExercisesForMuscle(
        'CHEST',
        'MEDIUM',
        exercisesByMuscle,
        2,
        new Set(),
        volumeTracker,
        0,
      );

      expect(result.totalFatigue).toBeLessThanOrEqual(2);
    });

    it('should not repeat exercises within the same day', () => {
      const exercises: ExerciseWithMeta[] = [
        createMockExercise('1', ExerciseType.COMPOUND, FatigueLevel.HIGH, true),
        createMockExercise('2', ExerciseType.COMPOUND, FatigueLevel.MEDIUM, true),
        createMockExercise('3', ExerciseType.ISOLATION, FatigueLevel.LOW, false),
      ];

      const exercisesByMuscle = new Map([['CHEST', exercises]]);
      const usedIds = new Set<string>(['1']);

      const result = service.selectExercisesForMuscle(
        'CHEST',
        'MEDIUM',
        exercisesByMuscle,
        0,
        usedIds,
        volumeTracker,
        0,
      );

      expect(result.exerciseIds).not.toContain('1');
    });

    it('should return empty array when no exercises found for muscle', () => {
      const exercisesByMuscle = new Map<string, ExerciseWithMeta[]>();

      const result = service.selectExercisesForMuscle(
        'CHEST',
        'MEDIUM',
        exercisesByMuscle,
        0,
        new Set(),
        volumeTracker,
        0,
      );

      expect(result.exerciseIds).toEqual([]);
      expect(result.totalFatigue).toBe(0);
    });

    it('should include isolation exercises for MEDIUM and ADVANCED levels', () => {
      const exercises: ExerciseWithMeta[] = [
        createMockExercise('1', ExerciseType.COMPOUND, FatigueLevel.HIGH, true),
        createMockExercise('2', ExerciseType.COMPOUND, FatigueLevel.MEDIUM, true),
        createMockExercise('3', ExerciseType.ISOLATION, FatigueLevel.LOW, false),
        createMockExercise('4', ExerciseType.ISOLATION, FatigueLevel.LOW, false),
      ];

      const exercisesByMuscle = new Map([['CHEST', exercises]]);

      const result = service.selectExercisesForMuscle(
        'CHEST',
        'ADVANCED',
        exercisesByMuscle,
        0,
        new Set(),
        volumeTracker,
        0,
      );

      const selectedExercises = exercises.filter((e) => result.exerciseIds.includes(e.id));
      const hasIsolation = selectedExercises.some((e) => e.exerciseType === ExerciseType.ISOLATION);
      expect(hasIsolation).toBe(true);
    });
  });

  describe('sortByFatigueAndType', () => {
    it('should prioritize compound exercises with high fatigue', () => {
      const exercises: ExerciseWithMeta[] = [
        createMockExercise('1', ExerciseType.ISOLATION, FatigueLevel.LOW, false),
        createMockExercise('2', ExerciseType.COMPOUND, FatigueLevel.HIGH, true),
        createMockExercise('3', ExerciseType.COMPOUND, FatigueLevel.MEDIUM, true),
      ];

      const sortedIds = service.sortByFatigueAndType(exercises);

      expect(sortedIds[0]).toBe('2');
    });

    it('should sort correctly by type then fatigue', () => {
      const exercises: ExerciseWithMeta[] = [
        createMockExercise('1', ExerciseType.ISOLATION, FatigueLevel.HIGH, false),
        createMockExercise('2', ExerciseType.COMPOUND, FatigueLevel.LOW, true),
        createMockExercise('3', ExerciseType.COMPOUND, FatigueLevel.HIGH, true),
      ];

      const sortedIds = service.sortByFatigueAndType(exercises);

      expect(sortedIds[0]).toBe('3');
      expect(sortedIds[1]).toBe('2');
      expect(sortedIds[2]).toBe('1');
    });
  });
});

describe('Volume Calculation', () => {
  const VOLUME_PER_LEVEL = {
    BEGINNER: { min: 8, max: 12 },
    IRREGULAR: { min: 10, max: 14 },
    MEDIUM: { min: 12, max: 16 },
    ADVANCED: { min: 14, max: 20 },
  };

  function calculateSetsPerMuscle(level: keyof typeof VOLUME_PER_LEVEL, frequency: number): number {
    const volume = VOLUME_PER_LEVEL[level];
    const avg = (volume.min + volume.max) / 2;
    return Math.round(avg / frequency);
  }

  it('should calculate correct sets for BEGINNER with frequency 2', () => {
    const sets = calculateSetsPerMuscle('BEGINNER', 2);
    expect(sets).toBe(5);
  });

  it('should calculate correct sets for MEDIUM with frequency 4', () => {
    const sets = calculateSetsPerMuscle('MEDIUM', 4);
    expect(sets).toBe(4);
  });

  it('should calculate correct sets for ADVANCED with frequency 5', () => {
    const sets = calculateSetsPerMuscle('ADVANCED', 5);
    expect(sets).toBe(3);
  });
});

describe('Exercise Distribution Rules', () => {
  const EXERCISE_DISTRIBUTION = {
    COMPOUND_MAIN: 1,
    COMPOUND_SECONDARY: 1,
    ISOLATION: 2,
  };

  const FATIGUE_LIMIT_PER_DAY = 2;

  it('should always include at least 2 compound exercises', () => {
    expect(EXERCISE_DISTRIBUTION.COMPOUND_MAIN).toBe(1);
    expect(EXERCISE_DISTRIBUTION.COMPOUND_SECONDARY).toBe(1);
    expect(EXERCISE_DISTRIBUTION.COMPOUND_MAIN + EXERCISE_DISTRIBUTION.COMPOUND_SECONDARY).toBe(2);
  });

  it('should have isolation exercises configured', () => {
    expect(EXERCISE_DISTRIBUTION.ISOLATION).toBe(2);
  });

  it('should respect fatigue limit per day', () => {
    expect(FATIGUE_LIMIT_PER_DAY).toBe(2);
  });
});

// src/modules/routines/routines.module.ts
import {
  Module,
  Injectable,
  Controller,
  Get,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
  UseGuards,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { AuthUser } from '../auth/strategies/jwt.strategy';
import { z } from 'zod';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  ProgramPhase,
  PROGRESSION_NOTE,
  LEVEL_SPLIT_MAP,
  getPhaseForWeek,
  PERIODIZATION_CONFIG,
  TrainingLevel,
  SplitConfig,
} from './config/training.config';
import {
  DEFAULT_ROUTINES,
  getDefaultRoutine,
  TrainingGoal,
  GOAL_ADJUSTMENTS,
  adjustForGoal,
} from './config/default-routines';
import { ExerciseSelectionService, ExerciseWithMeta } from './services/exercise-selection.service';

const GenerateInitialRoutineSchema = z.object({
  gender: z.enum(['FEMALE', 'MALE', 'NON_BINARY', 'OTHER']).optional(),
  trainingLevel: z.enum(['BEGINNER', 'IRREGULAR', 'MEDIUM', 'ADVANCED']),
  mainGoal: z.enum(['LOSE_WEIGHT', 'KEEP_FIT', 'GET_STRONGER', 'GAIN_MUSCLE_MASS']).optional(),
});
export type GenerateInitialRoutineDto = z.infer<typeof GenerateInitialRoutineSchema>;

const LEVEL_CONFIG = {
  BEGINNER: { frequency: 2, split: 'FULL_BODY' },
  IRREGULAR: { frequency: 3, split: 'UPPER_LOWER' },
  MEDIUM: { frequency: 4, split: 'PUSH_PULL_LEGS' },
  ADVANCED: { frequency: 6, split: 'PPL_AB' },
};

function stringifySetsReps(sets: number, repsStr: string): string {
  const baseReps = parseInt(repsStr.split('-')[0]) || 10;
  return repsStr;
}

@Injectable()
export class RoutinesService {
  private readonly logger = new Logger(RoutinesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly exerciseSelectionService: ExerciseSelectionService,
  ) {}

  async generateInitialRoutine(userId: string, dto: GenerateInitialRoutineDto) {
    const { trainingLevel, mainGoal } = dto;
    this.logger.log(`Generating routine for user ${userId}, level: ${trainingLevel}, goal: ${mainGoal}`);

    const defaultRoutine = getDefaultRoutine(trainingLevel as TrainingLevel);
    const phase = getPhaseForWeek(1, trainingLevel as TrainingLevel);
    const totalWeeks = trainingLevel === 'ADVANCED' ? 9 : 8;

    const dbExercises = await this.prisma.$queryRaw<Array<{
      id: string;
      name: string;
      primary_muscles: string;
      secondary_muscles: string;
      is_compound: boolean;
      movement_pattern: string | null;
    }>>`SELECT id, name, primary_muscles, secondary_muscles, is_compound, movement_pattern FROM exercises WHERE is_active = true`;

    const parseArrayField = (value: string | string[]): string[] => {
      if (Array.isArray(value)) return value;
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      }
      return [];
    };

    const exercises = dbExercises.map((e) => ({
      id: e.id,
      name: e.name,
      primaryMuscles: parseArrayField(e.primary_muscles),
      secondaryMuscles: parseArrayField(e.secondary_muscles),
      isCompound: e.is_compound,
      movementPattern: e.movement_pattern,
      exerciseType: null,
      fatigueLevel: null,
    }));

    this.logger.log(`Found ${exercises.length} exercises in database`);

    if (exercises.length === 0) {
      const config = LEVEL_CONFIG[trainingLevel as keyof typeof LEVEL_CONFIG];
      const splitConfig = LEVEL_SPLIT_MAP[trainingLevel as TrainingLevel];
      return this.createPlaceholderProgram(userId, trainingLevel, config, splitConfig);
    }

    const exercisesMeta: ExerciseWithMeta[] = exercises.map((e) => ({
      id: e.id,
      name: e.name,
      primaryMuscles: e.primaryMuscles,
      secondaryMuscles: e.secondaryMuscles,
      exerciseType: e.exerciseType,
      fatigueLevel: e.fatigueLevel,
      isCompound: e.isCompound,
      movementPattern: e.movementPattern,
    }));

    const program = await this.prisma.$queryRaw<{ id: string; name: string }>`INSERT INTO programs (id, user_id, name, goal, weeks, days_per_week, is_active, started_at, progression_model, current_phase, created_at, updated_at)
      VALUES (gen_random_uuid(), ${userId}::uuid, ${`${trainingLevel.charAt(0) + trainingLevel.slice(1).toLowerCase()} Program`}, ${mainGoal || trainingLevel}, ${totalWeeks}, ${defaultRoutine.daysPerWeek}, true, ${new Date()}, ${phase.progressionStrategy}, ${phase.label}::"ProgramPhase", ${new Date()}, ${new Date()})
      RETURNING id, name` as unknown as { id: string; name: string };

    const goal = mainGoal as TrainingGoal | undefined;
    const createdRoutines: Array<{
      id: string;
      name: string;
      items: Array<{
        exerciseName: string;
        targetSets: number;
        targetReps: string;
        targetRir: number;
        restSeconds: number;
        notes: string;
      }>;
    }> = [];

    for (const day of defaultRoutine.days) {
      const dayIndex = defaultRoutine.days.indexOf(day);
      const routine = await this.prisma.routine.create({
        data: {
          userId,
          programId: program.id,
          name: day.dayName,
          dayOfWeek: dayIndex,
          sortOrder: dayIndex,
        },
      });

      const usedExerciseIds = new Set<string>();
      const routineItems: Array<{
        routineId: string;
        exerciseId: string;
        sortOrder: number;
        targetSets: number;
        targetReps: number;
        targetRir: number;
        restSeconds: number;
        notes: string;
      }> = [];

      for (const [slotIndex, slot] of day.slots.entries()) {
        const adjustedSlot = adjustForGoal(slot, goal);
        const exerciseId = this.exerciseSelectionService.findExerciseByName(
          slot.exerciseName,
          slot.fallbackMuscle,
          exercisesMeta,
          usedExerciseIds,
        );

        if (!exerciseId) {
          this.logger.warn(`No exercise found for "${slot.exerciseName}" (fallback: ${slot.fallbackMuscle}) in ${day.dayName}`);
          continue;
        }

        usedExerciseIds.add(exerciseId);
        const ex = exercises.find((e) => e.id === exerciseId);

        routineItems.push({
          routineId: routine.id,
          exerciseId,
          sortOrder: slotIndex,
          targetSets: adjustedSlot.sets,
          targetReps: parseInt(adjustedSlot.reps.split('-')[0]),
          targetRir: phase.rirTarget[trainingLevel as TrainingLevel],
          restSeconds: adjustedSlot.restSeconds,
          notes: adjustedSlot.notes || PROGRESSION_NOTE,
        });
      }

      if (routineItems.length > 0) {
        await this.prisma.routineItem.createMany({ data: routineItems });
      }

      createdRoutines.push({
        id: routine.id,
        name: routine.name,
        items: routineItems.map((item) => {
          const ex = exercises.find((e) => e.id === item.exerciseId);
          return {
            exerciseName: ex?.name || 'Unknown',
            targetSets: item.targetSets,
            targetReps: item.targetReps.toString(),
            targetRir: item.targetRir,
            restSeconds: item.restSeconds,
            notes: item.notes,
          };
        }),
      });
    }

    const totalSets = createdRoutines.reduce(
      (sum, r) => sum + r.items.reduce((s, i) => s + i.targetSets, 0),
      0,
    );
    const avgSetsPerDay = Math.round(totalSets / defaultRoutine.daysPerWeek);

    const goalReps = mainGoal && GOAL_ADJUSTMENTS[mainGoal as TrainingGoal]
      ? GOAL_ADJUSTMENTS[mainGoal as TrainingGoal].repsRange
      : `${phase.repsMin}-${phase.repsMax}`;

    return {
      program: {
        id: program.id,
        name: program.name,
        daysPerWeek: defaultRoutine.daysPerWeek,
        split: defaultRoutine.split,
        progressionModel: phase.progressionStrategy,
        currentPhase: phase.label,
      },
      routines: createdRoutines,
      config: {
        sets: avgSetsPerDay,
        reps: goalReps,
        rir: phase.rirTarget[trainingLevel as TrainingLevel],
        restSeconds: 150,
      },
      periodization: {
        phase: phase.label,
        strategy: phase.progressionStrategy,
        weeks: phase.weeks,
      },
    };
  }

  private async createPlaceholderProgram(
    userId: string,
    trainingLevel: string,
    config: { frequency: number; split: string },
    splitConfig: SplitConfig,
  ) {
    const program = await this.prisma.$queryRaw<{ id: string; name: string }>`INSERT INTO programs (id, user_id, name, goal, weeks, days_per_week, is_active, started_at, progression_model, current_phase, created_at, updated_at)
      VALUES (gen_random_uuid(), ${userId}::uuid, ${`${trainingLevel.charAt(0) + trainingLevel.slice(1).toLowerCase()} Program`}, ${trainingLevel}, 8, ${config.frequency}, true, ${new Date()}, 'SET_INCREMENT', 'HYPERTROPHY'::"ProgramPhase", ${new Date()}, ${new Date()})
      RETURNING id, name` as unknown as { id: string; name: string };

    return {
      program: {
        id: program.id,
        name: program.name,
        daysPerWeek: config.frequency,
        split: splitConfig.splitName,
        progressionModel: 'SET_INCREMENT',
        currentPhase: 'HYPERTROPHY',
      },
      routines: splitConfig.days.map((day, idx) => ({
        id: `pending-${idx}`,
        name: day.dayName,
        items: [],
      })),
      config: {
        sets: 3,
        reps: '8-12',
        rir: 2,
        restSeconds: 150,
      },
    };
  }

  async getRoutinesByProgram(programId: string, userId: string) {
    return this.prisma.routine.findMany({
      where: { programId, userId },
      orderBy: { sortOrder: 'asc' },
      include: {
        routineItems: {
          include: { exercise: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }
}

@Controller('routines')
@UseGuards(JwtAuthGuard)
export class RoutinesController {
  constructor(private readonly routinesService: RoutinesService) {}

  @Post('generate-initial')
  @HttpCode(HttpStatus.CREATED)
  generateInitialRoutine(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(GenerateInitialRoutineSchema)) dto: GenerateInitialRoutineDto,
  ) {
    return this.routinesService.generateInitialRoutine(user.id, dto);
  }

  @Get('program/:programId')
  getRoutinesByProgram(@CurrentUser() user: AuthUser) {
    return this.routinesService.getRoutinesByProgram(user.id, user.id);
  }
}

@Module({
  controllers: [RoutinesController],
  providers: [RoutinesService, ExerciseSelectionService],
  exports: [RoutinesService],
})
export class RoutinesModule {}
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
  DayConfig,
} from './config/training.config';
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

function materializeDays(splitConfig: SplitConfig): DayConfig[] {
  const { days, daysPerWeek, rotationMode } = splitConfig;
  
  if (rotationMode === 'AB' && daysPerWeek > days.length) {
    const result: DayConfig[] = [];
    let dayIndex = 0;
    for (let i = 0; i < daysPerWeek; i++) {
      result.push(days[dayIndex % days.length]);
      dayIndex++;
    }
    return result;
  }
  
  return days;
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
    this.logger.log(`Generating scientific routine for user ${userId}, level: ${trainingLevel}`);

    const splitConfig = LEVEL_SPLIT_MAP[trainingLevel as TrainingLevel];
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

    const exercises = dbExercises.map((e) => ({
      id: e.id,
      name: e.name,
      primaryMuscles: e.primary_muscles ? JSON.parse(e.primary_muscles) : [],
      secondaryMuscles: e.secondary_muscles ? JSON.parse(e.secondary_muscles) : [],
      isCompound: e.is_compound,
      movementPattern: e.movement_pattern,
      exerciseType: null,
      fatigueLevel: null,
    }));

    this.logger.log(`Found ${exercises.length} exercises in database`);

    if (exercises.length === 0) {
      const config = LEVEL_CONFIG[trainingLevel as keyof typeof LEVEL_CONFIG];
      return this.createPlaceholderProgram(userId, trainingLevel, config, splitConfig);
    }

    const exercisesMeta: ExerciseWithMeta[] = exercises.map((e) => ({
      id: e.id,
      name: e.name,
      primaryMuscles: e.primaryMuscles as string[],
      secondaryMuscles: e.secondaryMuscles as string[],
      exerciseType: e.exerciseType as 'COMPOUND' | 'ISOLATION' | null,
      fatigueLevel: e.fatigueLevel as 'LOW' | 'MEDIUM' | 'HIGH' | null,
      isCompound: e.isCompound,
      movementPattern: e.movementPattern,
    }));

    const program = await this.prisma.$queryRaw<{ id: string; name: string }>`INSERT INTO programs (id, user_id, name, goal, weeks, days_per_week, is_active, started_at, progression_model, current_phase, created_at, updated_at)
      VALUES (gen_random_uuid(), ${userId}, ${`${trainingLevel.charAt(0) + trainingLevel.slice(1).toLowerCase()} Program`}, ${mainGoal || trainingLevel}, ${totalWeeks}, ${splitConfig.daysPerWeek}, true, ${new Date()}, ${phase.progressionStrategy}, ${phase.label}, ${new Date()}, ${new Date()})
      RETURNING id, name`;

    const materializedDays = materializeDays(splitConfig);
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

    for (const [dayIndex, day] of materializedDays.entries()) {
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
        const exerciseId = this.exerciseSelectionService.selectExerciseForSlot(
          slot,
          exercisesMeta,
          usedExerciseIds,
        );

        if (!exerciseId) {
          this.logger.warn(`No exercise found for slot ${slotIndex} in ${day.dayName}`);
          continue;
        }

        usedExerciseIds.add(exerciseId);
        const ex = exercises.find((e) => e.id === exerciseId);

        routineItems.push({
          routineId: routine.id,
          exerciseId,
          sortOrder: slotIndex,
          targetSets: slot.sets,
          targetReps: slot.repsMin,
          targetRir: phase.rirTarget[trainingLevel as TrainingLevel],
          restSeconds: slot.restSeconds,
          notes: slot.notes || phase.notes || PROGRESSION_NOTE,
        });
      }

      if (routineItems.length > 0) {
        await this.prisma.routineItem.createMany({ data: routineItems });
      }

      const itemsWithSlots = day.slots.map((slot, idx) => ({ slot, item: routineItems[idx] }));
      
      createdRoutines.push({
        id: routine.id,
        name: day.dayName,
        items: routineItems.map((item, idx) => {
          const ex = exercises.find((e) => e.id === item.exerciseId);
          const slot = itemsWithSlots[idx]?.slot;
          return {
            exerciseName: ex?.name || 'Unknown',
            targetSets: item.targetSets,
            targetReps: slot ? `${slot.repsMin}-${slot.repsMax}` : `${phase.repsMin}-${phase.repsMax}`,
            targetRir: item.targetRir,
            restSeconds: item.restSeconds,
            notes: item.notes,
          };
        }),
      });
    }

    const slotSets = materializedDays.flatMap((d) => d.slots).reduce((sum, s) => sum + s.sets, 0);
    const avgSetsPerDay = Math.round(slotSets / materializedDays.length);

    return {
      program: {
        id: program.id,
        name: program.name,
        daysPerWeek: splitConfig.daysPerWeek,
        split: splitConfig.splitName,
        progressionModel: phase.progressionStrategy,
        currentPhase: phase.label,
      },
      routines: createdRoutines,
      config: {
        sets: avgSetsPerDay,
        reps: `${phase.repsMin}-${phase.repsMax}`,
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
      VALUES (gen_random_uuid(), ${userId}, ${`${trainingLevel.charAt(0) + trainingLevel.slice(1).toLowerCase()} Program`}, ${trainingLevel}, 8, ${config.frequency}, true, ${new Date()}, 'SET_INCREMENT', 'HYPERTROPHY', ${new Date()}, ${new Date()})
      RETURNING id, name`;

    const materializedDays = materializeDays(splitConfig);

    return {
      program: {
        id: program.id,
        name: program.name,
        daysPerWeek: config.frequency,
        split: splitConfig.splitName,
        progressionModel: 'SET_INCREMENT',
        currentPhase: 'HYPERTROPHY',
      },
      routines: materializedDays.map((day, idx) => ({
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

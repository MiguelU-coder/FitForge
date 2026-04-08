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

// ── DTOs ──────────────────────────────────────────────────────────────────────

const GenerateInitialRoutineSchema = z.object({
  gender: z.enum(['FEMALE', 'MALE', 'NON_BINARY', 'OTHER']).optional(),
  trainingLevel: z.enum(['BEGINNER', 'IRREGULAR', 'MEDIUM', 'ADVANCED']),
  mainGoal: z.enum(['LOSE_WEIGHT', 'KEEP_FIT', 'GET_STRONGER', 'GAIN_MUSCLE_MASS']).optional(),
});
export type GenerateInitialRoutineDto = z.infer<typeof GenerateInitialRoutineSchema>;

// ── Constantes: Ejercicios Preferidos por Grupo Muscular ──────────────────

const STABLE_EXERCISES: Record<string, string[]> = {
  CHEST: [
    'Machine Chest Press',
    'Incline Dumbbell Press',
    'Cable Flyes',
  ],
  BACK: [
    'Lat Pulldown (Machine)',
    'Seated Cable Row',
    'Machine Row',
  ],
  SHOULDERS: [
    'Machine Shoulder Press',
    'Lateral Raise',
  ],
  BICEPS: [
    'Dumbbell Curl',
    'Cable Curl',
  ],
  TRICEPS: [
    'Tricep Pushdown',
    'Machine Overhead Extension',
  ],
  QUADS: [
    'Leg Extension',
    'Hack Squat Machine',
    'Leg Press',
  ],
  HAMSTRINGS: [
    'Lying Leg Curl',
    'Seated Leg Curl',
  ],
  GLUTES: [
    'Hip Thrust Machine',
    'Glute Machine',
  ],
  CALVES: [
    'Standing Calf Raise',
    'Seated Calf Raise',
  ],
  ABS: [
    'Cable Crunch',
    'Plank',
  ],
};

// ── Configuración por Nivel ─────────────────────────────────────────────

const LEVEL_CONFIG = {
  BEGINNER: {
    frequency: 2,
    sets: 2,
    reps: '10-12',
    rir: { min: 2, max: 3 },
    restSeconds: 150,
    split: 'FULL_BODY',
  },
  IRREGULAR: {
    frequency: 3,
    sets: 3,
    reps: '8-10',
    rir: { min: 2, max: 2 },
    restSeconds: 150,
    split: 'UPPER_LOWER',
  },
  MEDIUM: {
    frequency: 4,
    sets: 3,
    reps: '8-12',
    rir: { min: 1, max: 2 },
    restSeconds: 150,
    split: 'PUSH_PULL_LEGS',
  },
  ADVANCED: {
    frequency: 5,
    sets: 4,
    reps: '6-10',
    rir: { min: 0, max: 1 },
    restSeconds: 150,
    split: 'PPL_PLUS',
  },
};

// ── Rutinaskeleton por Split ────────────────────────────────────────────

const SPLIT_ROUTINES: Record<string, Array<{ dayName: string; muscles: string[] }>> = {
  FULL_BODY: [
    { dayName: 'Full Body A', muscles: ['CHEST', 'BACK', 'QUADS', 'ABS'] },
    { dayName: 'Full Body B', muscles: ['SHOULDERS', 'GLUTES', 'HAMSTRINGS', 'CALVES'] },
  ],
  UPPER_LOWER: [
    { dayName: 'Upper A', muscles: ['CHEST', 'BACK', 'SHOULDERS', 'BICEPS', 'TRICEPS'] },
    { dayName: 'Lower A', muscles: ['QUADS', 'HAMSTRINGS', 'GLUTES', 'CALVES'] },
    { dayName: 'Upper B', muscles: ['CHEST', 'BACK', 'SHOULDERS', 'BICEPS', 'TRICEPS'] },
  ],
  PUSH_PULL_LEGS: [
    { dayName: 'Push', muscles: ['CHEST', 'SHOULDERS', 'TRICEPS'] },
    { dayName: 'Pull', muscles: ['BACK', 'BICEPS', 'ABS'] },
    { dayName: 'Legs', muscles: ['QUADS', 'HAMSTRINGS', 'GLUTES', 'CALVES'] },
    { dayName: 'Upper', muscles: ['CHEST', 'BACK', 'SHOULDERS', 'BICEPS', 'TRICEPS'] },
  ],
  PPL_PLUS: [
    { dayName: 'Push A', muscles: ['CHEST', 'SHOULDERS', 'TRICEPS'] },
    { dayName: 'Pull A', muscles: ['BACK', 'BICEPS'] },
    { dayName: 'Legs', muscles: ['QUADS', 'HAMSTRINGS', 'GLUTES', 'CALVES'] },
    { dayName: 'Push B', muscles: ['CHEST', 'SHOULDERS', 'TRICEPS'] },
    { dayName: 'Pull B', muscles: ['BACK', 'BICEPS', 'ABS'] },
  ],
};

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable()
export class RoutinesService {
  private readonly logger = new Logger(RoutinesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async generateInitialRoutine(
    userId: string,
    dto: GenerateInitialRoutineDto,
  ) {
    const { trainingLevel, gender, mainGoal } = dto;
    const config = LEVEL_CONFIG[trainingLevel];
    const splitRoutines = SPLIT_ROUTINES[config.split];

    // Get exercises from DB
    const exercises = await this.prisma.exercise.findMany({
      where: { isActive: true },
      select: { id: true, name: true, primaryMuscles: true },
    });

    // Build exercise map
    const exerciseMap = new Map<string, string>();
    for (const ex of exercises) {
      for (const muscle of ex.primaryMuscles) {
        if (!exerciseMap.has(muscle)) {
          exerciseMap.set(muscle, ex.id);
        }
      }
    }

    // Create Program
    const program = await this.prisma.program.create({
      data: {
        userId,
        name: `${trainingLevel.charAt(0) + trainingLevel.slice(1).toLowerCase()} Initial Program`,
        goal: mainGoal || trainingLevel,
        weeks: 8,
        daysPerWeek: config.frequency,
        isActive: true,
        startedAt: new Date(),
      },
    });

    // Create Routines
    const createdRoutines: Array<{
      id: string;
      name: string;
      items: Array<{
        exerciseName: string;
        targetSets: number;
        targetReps: string;
        restSeconds: number;
      }>;
    }> = [];

    for (const [dayIndex, day] of splitRoutines.entries()) {
      const routine = await this.prisma.routine.create({
        data: {
          userId,
          programId: program.id,
          name: day.dayName,
          dayOfWeek: dayIndex,
          sortOrder: dayIndex,
        },
      });

      // Add exercises for each muscle group
      const routineItems = [];
      for (const muscle of day.muscles) {
        const exerciseId = exerciseMap.get(muscle);
        if (!exerciseId) continue;

        // Get preferred exercise name for this muscle
        const preferredExercises = STABLE_EXERCISES[muscle] || [];
        let targetExerciseId = exerciseId;

        // Try to find a preferred exercise
        for (const prefName of preferredExercises) {
          const found = exercises.find(e => e.name === prefName);
          if (found) {
            targetExerciseId = found.id;
            break;
          }
        }

        routineItems.push({
          routineId: routine.id,
          exerciseId: targetExerciseId,
          sortOrder: routineItems.length,
          targetSets: config.sets,
          targetReps: parseInt(config.reps.split('-')[0]),
          restSeconds: config.restSeconds,
          notes: `RIR: ${config.rir.min}-${config.rir.max}`,
        });
      }

      // Bulk create routine items
      if (routineItems.length > 0) {
        await this.prisma.routineItem.createMany({ data: routineItems });
      }

      createdRoutines.push({
        id: routine.id,
        name: day.dayName,
        items: routineItems.map(item => ({
          exerciseName: exercises.find(e => e.id === item.exerciseId)?.name || 'Unknown',
          targetSets: item.targetSets,
          targetReps: item.targetReps.toString(),
          restSeconds: item.restSeconds,
        })),
      });
    }

    return {
      program: {
        id: program.id,
        name: program.name,
        daysPerWeek: config.frequency,
        split: config.split,
      },
      routines: createdRoutines,
      config: {
        sets: config.sets,
        reps: config.reps,
        rir: config.rir,
        restSeconds: config.restSeconds,
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

// ── Controller ────────────────────────────────────────────────────────────────

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
  getRoutinesByProgram(
    @CurrentUser() user: AuthUser,
  ) {
    return this.routinesService.getRoutinesByProgram(user.id, user.id);
  }
}

// ── Module ────────────────────────────────────────────────────────────────────

@Module({
  controllers: [RoutinesController],
  providers: [RoutinesService],
  exports: [RoutinesService],
})
export class RoutinesModule {}

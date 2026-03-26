// src/modules/workout/workout.module.ts
//
// ─────────────────────────────────────────────────────────────────────────────
// FitForge — Workout Module (merged)
//
// Base: tu módulo original (Prisma + Zod + rutas completas)
// Añadido: capa de eventos Phase 1 (BullMQ + Redis pub/sub + n8n forwarding)
//
// Cambios respecto a tu versión original:
//   1. Se inyecta EventProducerService (de EventsModule)
//   2. startSession     → emite WORKOUT_STARTED
//   3. finishSession    → emite WORKOUT_COMPLETED
//   4. Nuevo método     → recordSet() + emite SET_RECORDED + PR_DETECTED
//   5. checkAndUpdatePR → detecta PRs en sets individuales
//   6. AddSetSchema / AddSetDto + ruta POST sessions/:id/blocks/:blockId/sets
//   7. EventsModule importado en el @Module
//
// ─────────────────────────────────────────────────────────────────────────────

import {
  Module,
  Injectable,
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { BullModule } from '@nestjs/bullmq';
import { z } from 'zod';

import { PrismaService } from '../../database/prisma.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { AuthUser } from '../auth/strategies/jwt.strategy';
import { AiBridgeModule, AiBridgeService } from '../ai-bridge/ai-bridge.module';
import { ExercisesModule, ExercisesService } from '../excercises/exercises.module';

// Phase 1 event system
import { EventsModule } from '../events/events.module';
import { EventProducerService } from '../events/event-producer.service';
import type { PRType } from '../events/event.types';

// ─── Schemas / DTOs (tuyos — sin cambios) ────────────────────────────────────

export const StartSessionSchema = z.object({
  name: z.string().max(150).trim().optional(),
  routineId: z.string().uuid().optional(),
  bodyWeightKg: z.number().min(20).max(500).optional(),
});
export type StartSessionDto = z.infer<typeof StartSessionSchema>;

export const FinishSessionSchema = z.object({
  notes: z.string().max(1000).optional(),
  perceivedExertion: z.number().int().min(1).max(10).optional(),
});
export type FinishSessionDto = z.infer<typeof FinishSessionSchema>;

export const AddBlockSchema = z.object({
  exerciseId: z.string().min(1),
  sortOrder: z.number().int().min(0),
  supersetGroup: z.number().int().min(1).optional(),
  blockType: z.enum(['NORMAL', 'SUPERSET', 'DROP_SET', 'MYOREP']).default('NORMAL'),
  restSeconds: z.number().int().min(0).max(600).optional(),
  notes: z.string().max(500).optional(),
});
export type AddBlockDto = z.infer<typeof AddBlockSchema>;

export const ReorderBlocksSchema = z.object({
  blocks: z
    .array(
      z.object({
        id: z.string().uuid(),
        sortOrder: z.number().int().min(0),
      }),
    )
    .min(2),
});
export type ReorderBlocksDto = z.infer<typeof ReorderBlocksSchema>;

// ── Nuevo: schema para registrar un set individual ────────────────────────────

export const AddSetSchema = z.object({
  setNumber: z.number().int().min(1),
  weightKg: z.number().min(0),
  reps: z.number().int().min(1).max(200),
  rpe: z.number().min(1).max(10).optional(),
  rir: z.number().int().min(0).max(10).optional(),
  setType: z.enum(['WARMUP', 'WORKING', 'DROP', 'MYOREP']).default('WORKING'),
  isFailed: z.boolean().default(false),
});
export type AddSetDto = z.infer<typeof AddSetSchema>;

// ─── Internal types ───────────────────────────────────────────────────────────

interface ExerciseBlockWithMuscles {
  exercise: { primaryMuscles: string[]; name: string; id: string };
  sets: {
    id: string;
    setNumber: number;
    weightKg: number | null;
    reps: number | null;
    rpe: number | null;
    setType: string;
    isFailed: boolean;
  }[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class WorkoutsService {
  private readonly logger = new Logger(WorkoutsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiBridge: AiBridgeService,
    private readonly exercisesService: ExercisesService,
    private readonly eventProducer: EventProducerService, // ← Phase 1
    @InjectQueue('pr-check') private readonly prQueue: Queue,
    @InjectQueue('ai-recommend') private readonly aiQueue: Queue,
    @InjectQueue('volume-agg') private readonly volQueue: Queue,
  ) {}

  // ── Sessions ──────────────────────────────────────────────────────────────

  async startSession(userId: string, dto: StartSessionDto) {
    // Auto-cerrar sesión activa si lleva más de 12h abierta
    const activeSession = await this.prisma.workoutSession.findFirst({
      where: { userId, finishedAt: null },
      select: { id: true, startedAt: true },
    });

    if (activeSession) {
      const hoursOpen = (Date.now() - activeSession.startedAt.getTime()) / 3_600_000;
      if (hoursOpen > 12) {
        await this.prisma.workoutSession.update({
          where: { id: activeSession.id },
          data: { finishedAt: new Date() },
        });
      }
    }

    // Si viene de una rutina, clonar sus ítems
    let routineItemsToClone: any[] = [];
    if (dto.routineId) {
      const routine = await this.prisma.routine.findUnique({
        where: { id: dto.routineId },
        include: { routineItems: { orderBy: { sortOrder: 'asc' } } },
      });
      if (routine) {
        routineItemsToClone = routine.routineItems;
        if (!dto.name) dto.name = routine.name;
      }
    }

    const exerciseBlocksData = routineItemsToClone.map((item) => {
      const setsData = [];
      const numSets = item.targetSets ?? 0;
      for (let i = 1; i <= numSets; i++) {
        setsData.push({
          setNumber: i,
          setType: 'WORKING' as import('@prisma/client').SetType,
          reps: item.targetReps,
          rir: item.targetRir,
        });
      }
      return {
        sortOrder: item.sortOrder,
        restSeconds: item.restSeconds,
        notes: item.notes,
        exercise: { connect: { id: item.exerciseId } },
        sets: { create: setsData },
      };
    });

    const session = await this.prisma.workoutSession.create({
      data: {
        userId,
        routineId: dto.routineId,
        name: dto.name ?? `Workout ${new Date().toLocaleDateString()}`,
        bodyWeightKg: dto.bodyWeightKg,
        startedAt: new Date(),
        exerciseBlocks: { create: exerciseBlocksData },
      },
      select: {
        id: true,
        name: true,
        startedAt: true,
        routineId: true,
        routine: {
          select: {
            name: true,
            routineItems: { include: { exercise: true }, orderBy: { sortOrder: 'asc' } },
          },
        },
        exerciseBlocks: {
          orderBy: { sortOrder: 'asc' },
          include: { exercise: true, sets: { orderBy: { setNumber: 'asc' } } },
        },
      },
    });

    // ── Phase 1: emitir WORKOUT_STARTED ──────────────────────────────────────
    await this.eventProducer
      .emitWorkoutStarted({
        userId,
        workoutId: session.id,
        templateId: dto.routineId ?? null,
        plannedExercises: routineItemsToClone.map((i) => i.exerciseId),
      })
      .catch((e: Error) =>
        this.logger.warn(`WORKOUT_STARTED event failed (non-blocking): ${e.message}`),
      );

    this.logger.log(`Session started: ${session.id} user:${userId}`);
    return session;
  }

  async getActiveSession(userId: string) {
    return this.prisma.workoutSession.findFirst({
      where: { userId, finishedAt: null },
      include: {
        exerciseBlocks: {
          orderBy: { sortOrder: 'asc' },
          include: { exercise: true, sets: { orderBy: { setNumber: 'asc' } } },
        },
      },
    });
  }

  async finishSession(userId: string, sessionId: string, dto: FinishSessionDto) {
    const session = await this.prisma.workoutSession.findFirst({
      where: { id: sessionId, userId },
    });
    if (!session) throw new NotFoundException('Session not found');

    // Idempotent: si ya estaba terminada devolverla sin re-emitir eventos
    if (session.finishedAt) {
      this.logger.log(`Session ${sessionId} already finished. Returning existing record.`);
      return this.prisma.workoutSession.findUnique({
        where: { id: sessionId },
        include: {
          exerciseBlocks: {
            include: {
              exercise: { select: { primaryMuscles: true } },
              sets: { where: { setType: 'WORKING', isFailed: false } },
            },
          },
        },
      });
    }

    const finishedAt = new Date();
    const durationSeconds = Math.floor((finishedAt.getTime() - session.startedAt.getTime()) / 1000);

    const updated = await this.prisma.workoutSession.update({
      where: { id: sessionId },
      data: {
        finishedAt,
        durationSeconds,
        notes: dto.notes,
        perceivedExertion: dto.perceivedExertion,
      },
      include: {
        exerciseBlocks: {
          include: {
            exercise: { select: { primaryMuscles: true, name: true, id: true } },
            sets: { where: { setType: 'WORKING', isFailed: false } },
          },
        },
      },
    });

    const muscleGroups = [
      ...new Set(
        (updated.exerciseBlocks as ExerciseBlockWithMuscles[]).flatMap(
          (b) => b.exercise.primaryMuscles,
        ),
      ),
    ];

    const exerciseIds = [
      ...new Set((updated.exerciseBlocks as ExerciseBlockWithMuscles[]).map((b) => b.exercise.id)),
    ];

    const totalSets = (updated.exerciseBlocks as ExerciseBlockWithMuscles[]).reduce(
      (acc, b) => acc + b.sets.length,
      0,
    );

    const totalVolumeLoad = (updated.exerciseBlocks as ExerciseBlockWithMuscles[])
      .flatMap((b) => b.sets)
      .reduce((acc, s) => acc + (s.weightKg ?? 0) * (s.reps ?? 0), 0);

    // Tus colas originales
    await this.volQueue
      .add('aggregate', { userId, sessionId, muscleGroups }, { delay: 2000 })
      .catch((e: Error) => this.logger.warn(`Volume queue error: ${e.message}`));

    // Invalidar caché de IA
    await this.aiBridge.invalidateUserCache(userId);

    // ── Phase 1: emitir WORKOUT_COMPLETED ────────────────────────────────────
    await this.eventProducer
      .emitWorkoutCompleted({
        userId,
        workoutId: sessionId,
        durationMinutes: Math.round(durationSeconds / 60),
        totalSets,
        totalVolumeLoad,
        exerciseIds,
      })
      .catch((e: Error) =>
        this.logger.warn(`WORKOUT_COMPLETED event failed (non-blocking): ${e.message}`),
      );

    this.logger.log(`Session ${sessionId} finished. Duration: ${durationSeconds}s`);
    return updated;
  }

  async cancelSession(userId: string, sessionId: string) {
    const session = await this.prisma.workoutSession.findFirst({
      where: { id: sessionId, userId, finishedAt: null },
    });
    if (!session) throw new NotFoundException('Active session not found');

    await this.prisma.workoutSession.delete({ where: { id: sessionId } });
    return { cancelled: true };
  }

  // ── Sets — nuevo (Phase 1) ────────────────────────────────────────────────

  async recordSet(userId: string, sessionId: string, blockId: string, dto: AddSetDto) {
    // Verificar que el bloque pertenece a una sesión activa del usuario
    const block = await this.prisma.exerciseBlock.findFirst({
      where: {
        id: blockId,
        sessionId,
        session: { userId, finishedAt: null },
      },
      include: {
        exercise: { select: { id: true, name: true } },
        session: { select: { id: true } },
      },
    });
    if (!block) throw new NotFoundException('Exercise block not found or session is not active');

    const volumeLoad = (dto.weightKg ?? 0) * (dto.reps ?? 0);

    // Persistir el set en Prisma
    const newSet = await this.prisma.set.create({
      data: {
        blockId,
        setNumber: dto.setNumber,
        setType: dto.setType,
        weightKg: dto.weightKg,
        reps: dto.reps,
        rpe: dto.rpe,
        rir: dto.rir,
        isFailed: dto.isFailed,
      },
    });

    // ── PR detection (solo para sets de trabajo no fallidos) ─────────────────
    const shouldCheckPR =
      dto.setType === 'WORKING' && !dto.isFailed && dto.weightKg > 0 && dto.reps > 0;
    let prResult: Awaited<ReturnType<typeof this.checkAndUpdatePR>> | null = null;

    if (shouldCheckPR) {
      prResult = await this.checkAndUpdatePR(userId, {
        id: newSet.id,
        exerciseId: block.exercise.id,
        volumeLoad,
        weightKg: dto.weightKg,
        reps: dto.reps,
      });
    }

    // ── Phase 1: emitir SET_RECORDED ─────────────────────────────────────────
    await this.eventProducer
      .emitSetRecorded({
        userId,
        workoutId: sessionId,
        setId: newSet.id,
        exerciseId: block.exercise.id,
        exerciseName: block.exercise.name,
        setNumber: dto.setNumber,
        weight: dto.weightKg ?? 0,
        reps: dto.reps ?? 0,
        rpe: dto.rpe ?? null,
        volumeLoad,
      })
      .catch((e: Error) =>
        this.logger.warn(`SET_RECORDED event failed (non-blocking): ${e.message}`),
      );

    // ── Phase 1: emitir PR_DETECTED si aplica ────────────────────────────────
    if (prResult?.isPR) {
      await this.eventProducer
        .emitPRDetected({
          userId,
          workoutId: sessionId,
          setId: newSet.id,
          exerciseId: block.exercise.id,
          exerciseName: block.exercise.name,
          prType: prResult.prType!,
          newValue: prResult.newValue!,
          previousValue: prResult.previousValue,
          improvementPct: prResult.improvementPct,
        })
        .catch((e: Error) =>
          this.logger.warn(`PR_DETECTED event failed (non-blocking): ${e.message}`),
        );
    }

    return { ...newSet, pr: prResult?.isPR ? prResult : null };
  }

  // ── PR Detection (privado) ────────────────────────────────────────────────

  private async checkAndUpdatePR(
    userId: string,
    set: { id: string; exerciseId: string; volumeLoad: number; weightKg: number; reps: number },
  ): Promise<{
    isPR: boolean;
    prType?: PRType;
    newValue?: number;
    previousValue: number | null;
    improvementPct: number | null;
  }> {
    // Comparamos volumeLoad (weight × reps) como indicador de PR de set
    const existing = await this.prisma.personalRecord.findFirst({
      where: { userId, exerciseId: set.exerciseId, prType: 'MAX_VOLUME_SESSION' },
      orderBy: { value: 'desc' },
    });

    const previousValue = existing?.value ? Number(existing.value) : null;

    if (!existing || set.volumeLoad > previousValue!) {
      await this.prisma.personalRecord.upsert({
        where: {
          // unique constraint: userId_exerciseId_prType
          userId_exerciseId_prType: {
            userId,
            exerciseId: set.exerciseId,
            prType: 'MAX_VOLUME_SESSION',
          },
        },
        create: {
          userId,
          exerciseId: set.exerciseId,
          prType: 'MAX_VOLUME_SESSION',
          value: set.volumeLoad,
          achievedAt: new Date(),
        },
        update: {
          value: set.volumeLoad,
          achievedAt: new Date(),
        },
      });

      const improvementPct = previousValue
        ? Math.round(((set.volumeLoad - previousValue) / previousValue) * 1000) / 10
        : null;

      return {
        isPR: true,
        prType: 'volume_load' as PRType,
        newValue: set.volumeLoad,
        previousValue,
        improvementPct,
      };
    }

    return { isPR: false, previousValue: null, improvementPct: null };
  }

  // ── Queries ───────────────────────────────────────────────────────────────

  async getLastPerformance(userId: string, exerciseId: string) {
    // Resolve external IDs (e.g. 'ext_SpYC0Kp') to internal UUIDs
    let resolvedExerciseId = exerciseId;
    if (exerciseId.startsWith('ext_')) {
      const externalId = exerciseId.replace('ext_', '');
      const exercise = await this.prisma.exercise.findFirst({
        where: { externalId },
        select: { id: true },
      });
      if (!exercise) return null;   // not yet imported — no history
      resolvedExerciseId = exercise.id;
    }

    const lastBlock = await this.prisma.exerciseBlock.findFirst({
      where: {
        exerciseId: resolvedExerciseId,
        session: { userId, finishedAt: { not: null } },
      },
      orderBy: { session: { startedAt: 'desc' } },
      include: {
        sets: {
          where: { setType: 'WORKING', isFailed: false },
          orderBy: { setNumber: 'asc' },
        },
      },
    });

    if (!lastBlock || lastBlock.sets.length === 0) return null;

    return {
      date: lastBlock.sessionId,
      sets: lastBlock.sets.map((s) => ({ weightKg: s.weightKg, reps: s.reps })),
    };
  }

  async getSessionHistory(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [sessions, total] = await Promise.all([
      this.prisma.workoutSession.findMany({
        where: { userId, finishedAt: { not: null } },
        skip,
        take: limit,
        orderBy: { startedAt: 'desc' },
        include: {
          exerciseBlocks: {
            orderBy: { sortOrder: 'asc' },
            include: {
              exercise: { select: { id: true, name: true, primaryMuscles: true, isUnilateral: true } },
              sets: { orderBy: { setNumber: 'asc' } },
            },
          },
        },
      }),
      this.prisma.workoutSession.count({ where: { userId, finishedAt: { not: null } } }),
    ]);

    return { sessions, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getSessionDetail(userId: string, sessionId: string) {
    const session = await this.prisma.workoutSession.findFirst({
      where: { id: sessionId, userId },
      include: {
        routine: { select: { id: true, name: true } },
        exerciseBlocks: {
          orderBy: { sortOrder: 'asc' },
          include: {
            exercise: {
              select: {
                id: true,
                name: true,
                primaryMuscles: true,
                equipment: true,
                isUnilateral: true,
              },
            },
            sets: { orderBy: { setNumber: 'asc' } },
          },
        },
      },
    });
    if (!session) throw new NotFoundException('Session not found');
    return session;
  }

  // ── Blocks ────────────────────────────────────────────────────────────────

  async addBlock(userId: string, sessionId: string, dto: AddBlockDto) {
    const session = await this.prisma.workoutSession.findFirst({
      where: { id: sessionId, userId, finishedAt: null },
    });
    if (!session) throw new NotFoundException('Active session not found');

    let finalExerciseId = dto.exerciseId;
    if (finalExerciseId.startsWith('ext_')) {
      const externalId = finalExerciseId.replace('ext_', '');
      finalExerciseId = await this.exercisesService.importOrUpdateExternalExercise(externalId);
    }

    return this.prisma.exerciseBlock.create({
      data: {
        sessionId,
        exerciseId: finalExerciseId,
        sortOrder: dto.sortOrder,
        supersetGroup: dto.supersetGroup,
        blockType: dto.blockType,
        restSeconds: dto.restSeconds,
        notes: dto.notes,
      },
      include: {
        exercise: { select: { id: true, name: true, isUnilateral: true } },
        sets: true,
      },
    });
  }

  async deleteBlock(userId: string, sessionId: string, blockId: string) {
    const block = await this.prisma.exerciseBlock.findFirst({
      where: { id: blockId, sessionId, session: { userId } },
    });
    if (!block) throw new NotFoundException('Block not found');

    await this.prisma.exerciseBlock.delete({ where: { id: blockId } });
    return { deleted: true };
  }

  async reorderBlocks(userId: string, sessionId: string, dto: ReorderBlocksDto) {
    const session = await this.prisma.workoutSession.findFirst({
      where: { id: sessionId, userId, finishedAt: null },
    });
    if (!session) throw new NotFoundException('Active session not found');

    await this.prisma.$transaction(
      dto.blocks.map((b) =>
        this.prisma.exerciseBlock.update({
          where: { id: b.id, sessionId },
          data: { sortOrder: b.sortOrder },
        }),
      ),
    );

    return { reordered: true };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Controller
// ─────────────────────────────────────────────────────────────────────────────

@Controller('workouts')
export class WorkoutsController {
  constructor(private readonly workoutsService: WorkoutsService) {}

  // Sessions
  @Post('sessions/start')
  @HttpCode(HttpStatus.CREATED)
  startSession(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(StartSessionSchema)) dto: StartSessionDto,
  ) {
    return this.workoutsService.startSession(user.id, dto);
  }

  @Get('sessions/active')
  getActiveSession(@CurrentUser() user: AuthUser) {
    return this.workoutsService.getActiveSession(user.id);
  }

  @Patch('sessions/:id/finish')
  finishSession(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(FinishSessionSchema)) dto: FinishSessionDto,
  ) {
    return this.workoutsService.finishSession(user.id, id, dto);
  }

  @Delete('sessions/:id')
  cancelSession(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.workoutsService.cancelSession(user.id, id);
  }

  // Sets — nuevo (Phase 1)
  // POST /workouts/sessions/:id/blocks/:blockId/sets
  @Post('sessions/:id/blocks/:blockId/sets')
  @HttpCode(HttpStatus.CREATED)
  recordSet(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) sessionId: string,
    @Param('blockId', ParseUUIDPipe) blockId: string,
    @Body(new ZodValidationPipe(AddSetSchema)) dto: AddSetDto,
  ) {
    return this.workoutsService.recordSet(user.id, sessionId, blockId, dto);
  }

  // Queries
  @Get('exercises/:exerciseId/last-performance')
  getLastPerformance(@CurrentUser() user: AuthUser, @Param('exerciseId') exerciseId: string) {
    return this.workoutsService.getLastPerformance(user.id, exerciseId);
  }

  @Get('sessions')
  getHistory(
    @CurrentUser() user: AuthUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.workoutsService.getSessionHistory(
      user.id,
      parseInt(page ?? '1'),
      parseInt(limit ?? '20'),
    );
  }

  @Get('sessions/:id')
  getSessionDetail(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.workoutsService.getSessionDetail(user.id, id);
  }

  // Blocks
  @Post('sessions/:id/blocks')
  @HttpCode(HttpStatus.CREATED)
  addBlock(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(AddBlockSchema)) dto: AddBlockDto,
  ) {
    return this.workoutsService.addBlock(user.id, id, dto);
  }

  @Delete('sessions/:id/blocks/:blockId')
  deleteBlock(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) sessionId: string,
    @Param('blockId', ParseUUIDPipe) blockId: string,
  ) {
    return this.workoutsService.deleteBlock(user.id, sessionId, blockId);
  }

  @Patch('sessions/:id/blocks/reorder')
  reorderBlocks(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(ReorderBlocksSchema)) dto: ReorderBlocksDto,
  ) {
    return this.workoutsService.reorderBlocks(user.id, id, dto);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Module
// ─────────────────────────────────────────────────────────────────────────────

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'pr-check' },
      { name: 'ai-recommend' },
      { name: 'volume-agg' },
    ),
    AiBridgeModule,
    ExercisesModule,
    EventsModule, // ← Phase 1: provee EventProducerService
  ],
  controllers: [WorkoutsController],
  providers: [WorkoutsService],
  exports: [WorkoutsService],
})
export class WorkoutModule {}

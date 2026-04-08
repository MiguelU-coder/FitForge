// src/modules/sets/sets.module.ts
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
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../shared/redis.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { AuthUser } from '../auth/strategies/jwt.strategy';
import { z } from 'zod';

// ── 1RM Estimation — exportado para el PR processor ───────────────────────────

export function estimate1RM(weightKg: number, reps: number, rir: number): number {
  const repsToFailure = reps + rir;
  if (repsToFailure <= 0) return weightKg;

  const epley = weightKg * (1 + repsToFailure / 30);
  const rtf = Math.min(repsToFailure, 36);
  const brzycki = weightKg * (36 / (37 - rtf));

  // Ponderado: Brzycki mejor para rangos bajos (≤10 reps al fallo)
  const best = repsToFailure <= 10 ? 0.4 * epley + 0.6 * brzycki : 0.6 * epley + 0.4 * brzycki;

  return Math.round(best * 100) / 100;
}

// ── DTOs ──────────────────────────────────────────────────────────────────────
// CLAVE: Definir el schema BASE separado del schema con .refine().
// .partial() solo funciona en ZodObject, no en ZodEffects (resultado de .refine()).
// UpdateSetSchema usa el BASE para poder llamar .partial() sin errores.

const AddSetBaseSchema = z.object({
  setNumber: z.number().int().min(1).max(30),
  setType: z
    .enum(['WARMUP', 'WORKING', 'FAILURE', 'DROP', 'MYOREP_ACTIVATE', 'MYOREP', 'PARTIAL'])
    .default('WORKING'),
  weightKg: z.number().min(0).max(1500).optional(),
  weightKgLeft: z.number().min(0).max(750).optional(),
  weightKgRight: z.number().min(0).max(750).optional(),
  reps: z.number().int().min(0).max(1000).optional(),
  repsLeft: z.number().int().min(0).max(500).optional(),
  repsRight: z.number().int().min(0).max(500).optional(),
  rir: z.number().int().min(0).max(10).optional(),
  rpe: z.number().min(6).max(10).optional(),
  durationSeconds: z.number().int().min(0).max(86400).optional(),
  distanceM: z.number().min(0).max(200000).optional(),
  isFailed: z.boolean().default(false),
  isSkipped: z.boolean().default(false),
  unlog: z.boolean().optional(),
  notes: z.string().max(300).optional(),
});

// Schema completo (para POST — crear set)
export const AddSetSchema = AddSetBaseSchema;

// Schema parcial para PATCH — sin .refine() para que .partial() funcione
export const UpdateSetSchema = AddSetBaseSchema.partial();

export type AddSetDto = z.infer<typeof AddSetSchema>;
export type UpdateSetDto = z.infer<typeof UpdateSetSchema>;

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable()
export class SetsService {
  private readonly logger = new Logger(SetsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    @InjectQueue('pr-check') private readonly prQueue: Queue,
    @InjectQueue('ai-recommend') private readonly aiQueue: Queue,
  ) {}

  async addSet(userId: string, blockId: string, dto: AddSetDto): Promise<unknown> {
    // 1. Verificar ownership: block → session activa → usuario
    const block = await this.prisma.exerciseBlock.findFirst({
      where: {
        id: blockId,
        session: { userId, finishedAt: null },
      },
      include: {
        exercise: {
          select: { id: true, primaryMuscles: true, isUnilateral: true },
        },
        session: { select: { id: true } },
      },
    });

    if (!block) {
      throw new NotFoundException('Block not found or session already finished');
    }

    // 2. Crear el set
    const set = await this.prisma.set.create({
      data: {
        blockId,
        setNumber: dto.setNumber,
        setType: dto.setType,
        weightKg: dto.weightKg,
        weightKgLeft: dto.weightKgLeft,
        weightKgRight: dto.weightKgRight,
        reps: dto.reps,
        repsLeft: dto.repsLeft,
        repsRight: dto.repsRight,
        rir: dto.rir,
        rpe: dto.rpe,
        durationSeconds: dto.durationSeconds,
        distanceM: dto.distanceM,
        isFailed: dto.isFailed,
        isSkipped: dto.isSkipped,
        notes: dto.notes,
        completedAt: new Date(),
      },
    });

    // 3. Disparar eventos solo para sets de trabajo reales
    const isWorkingSet =
      dto.setType === 'WORKING' &&
      !dto.isFailed &&
      dto.weightKg !== undefined &&
      dto.reps !== undefined &&
      dto.reps > 0;

    if (isWorkingSet) {
      const rir = dto.rir ?? 0;

      this.prQueue
        .add(
          'check',
          {
            setId: set.id,
            userId,
            exerciseId: block.exerciseId,
            weightKg: dto.weightKg!,
            reps: dto.reps!,
            rir,
          },
          { priority: 1 },
        )
        .catch((e: Error) => this.logger.warn(`PR queue: ${e.message}`));

      this.aiQueue
        .add(
          'recommend',
          {
            userId,
            exerciseId: block.exerciseId,
            sessionId: block.session.id,
            lastSet: { weightKg: dto.weightKg!, reps: dto.reps!, rir },
          },
          { priority: 5, delay: 1000 },
        )
        .catch((e: Error) => this.logger.warn(`AI queue: ${e.message}`));
    }

    return set;
  }

  async updateSet(
    userId: string,
    blockId: string,
    setId: string,
    dto: UpdateSetDto,
  ): Promise<unknown> {
    const block = await this.prisma.exerciseBlock.findFirst({
      where: {
        id: blockId,
        session: { userId, finishedAt: null },
      },
      include: {
        exercise: {
          select: { id: true, primaryMuscles: true, isUnilateral: true },
        },
        session: { select: { id: true } },
      },
    });

    if (!block) {
      throw new NotFoundException('Block not found or session already finished');
    }

    const set = await this.prisma.set.findFirst({
      where: { id: setId, blockId },
    });
    if (!set) throw new NotFoundException('Set not found');

    const updatedSet = await this.prisma.set.update({
      where: { id: setId },
      data: {
        ...(dto.weightKg !== undefined && { weightKg: dto.weightKg }),
        ...(dto.reps !== undefined && { reps: dto.reps }),
        ...(dto.rir !== undefined && { rir: dto.rir }),
        ...(dto.rpe !== undefined && { rpe: dto.rpe }),
        ...(dto.isFailed !== undefined && { isFailed: dto.isFailed }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.durationSeconds !== undefined && { durationSeconds: dto.durationSeconds }),
        ...(dto.distanceM !== undefined && { distanceM: dto.distanceM }),
        completedAt: dto.unlog === true ? null : (set.completedAt ?? new Date()),
      },
    });

    // 3. Disparar eventos si es la primera vez que se completa (was null)
    if (!set.completedAt) {
      const finalSetType = dto.setType ?? set.setType;
      const finalIsFailed = dto.isFailed ?? set.isFailed;
      const finalWeightKg = dto.weightKg ?? set.weightKg;
      const finalReps = dto.reps ?? set.reps;
      const finalRir = dto.rir ?? set.rir;

      const isWorkingSet =
        finalSetType === 'WORKING' &&
        !finalIsFailed &&
        finalWeightKg !== null &&
        finalWeightKg !== undefined &&
        finalReps !== null &&
        finalReps !== undefined &&
        finalReps > 0;

      if (isWorkingSet) {
        const rir = finalRir ?? 0;

        this.prQueue
          .add(
            'check',
            {
              setId: updatedSet.id,
              userId,
              exerciseId: block.exerciseId,
              weightKg: finalWeightKg!,
              reps: finalReps!,
              rir,
            },
            { priority: 1 },
          )
          .catch((e: Error) => this.logger.warn(`PR queue: ${e.message}`));

        this.aiQueue
          .add(
            'recommend',
            {
              userId,
              exerciseId: block.exerciseId,
              sessionId: block.session.id,
              lastSet: { weightKg: finalWeightKg!, reps: finalReps!, rir },
            },
            { priority: 5, delay: 1000 },
          )
          .catch((e: Error) => this.logger.warn(`AI queue: ${e.message}`));
      }
    }

    return updatedSet;
  }

  async deleteSet(userId: string, blockId: string, setId: string): Promise<{ deleted: boolean }> {
    const set = await this.prisma.set.findFirst({
      where: { id: setId, blockId, block: { session: { userId } } },
    });
    if (!set) throw new NotFoundException('Set not found');

    await this.prisma.set.delete({ where: { id: setId } });
    return { deleted: true };
  }

  async getBlockSets(userId: string, blockId: string): Promise<unknown> {
    const block = await this.prisma.exerciseBlock.findFirst({
      where: { id: blockId, session: { userId } },
      include: {
        sets: { orderBy: { setNumber: 'asc' } },
        exercise: { select: { id: true, name: true, isUnilateral: true } },
      },
    });
    if (!block) throw new NotFoundException('Block not found');
    return block;
  }

  generateWarmup(
    workingWeightKg: number,
  ): Array<{ setNumber: number; weightKg: number; reps: number; pct: number }> {
    type Step = { pct: number; reps: number };

    const scheme: Step[] =
      workingWeightKg < 40
        ? [
            { pct: 0.5, reps: 10 },
            { pct: 0.75, reps: 5 },
          ]
        : workingWeightKg < 80
          ? [
              { pct: 0.4, reps: 12 },
              { pct: 0.6, reps: 8 },
              { pct: 0.8, reps: 4 },
            ]
          : [
              { pct: 0.4, reps: 10 },
              { pct: 0.6, reps: 6 },
              { pct: 0.75, reps: 4 },
              { pct: 0.9, reps: 2 },
            ];

    return scheme.map((s: Step, i: number) => ({
      setNumber: i + 1,
      weightKg: Math.round((s.pct * workingWeightKg) / 2.5) * 2.5,
      reps: s.reps,
      pct: s.pct,
    }));
  }
}

// ── Controller ────────────────────────────────────────────────────────────────

@Controller('workouts/blocks')
export class SetsController {
  constructor(private readonly setsService: SetsService) {}

  @Get(':blockId/sets')
  getBlockSets(
    @CurrentUser() user: AuthUser,
    @Param('blockId', ParseUUIDPipe) blockId: string,
  ): Promise<unknown> {
    return this.setsService.getBlockSets(user.id, blockId);
  }

  @Post(':blockId/sets')
  @HttpCode(HttpStatus.CREATED)
  addSet(
    @CurrentUser() user: AuthUser,
    @Param('blockId', ParseUUIDPipe) blockId: string,
    @Body(new ZodValidationPipe(AddSetSchema)) dto: AddSetDto,
  ): Promise<unknown> {
    return this.setsService.addSet(user.id, blockId, dto);
  }

  @Patch(':blockId/sets/:setId')
  updateSet(
    @CurrentUser() user: AuthUser,
    @Param('blockId', ParseUUIDPipe) blockId: string,
    @Param('setId', ParseUUIDPipe) setId: string,
    @Body(new ZodValidationPipe(UpdateSetSchema)) dto: UpdateSetDto,
  ): Promise<unknown> {
    return this.setsService.updateSet(user.id, blockId, setId, dto);
  }

  @Delete(':blockId/sets/:setId')
  deleteSet(
    @CurrentUser() user: AuthUser,
    @Param('blockId', ParseUUIDPipe) blockId: string,
    @Param('setId', ParseUUIDPipe) setId: string,
  ): Promise<{ deleted: boolean }> {
    return this.setsService.deleteSet(user.id, blockId, setId);
  }

  @Get('warmup')
  getWarmup(
    @Query('workingWeight') weight: string,
  ): Array<{ setNumber: number; weightKg: number; reps: number; pct: number }> {
    return this.setsService.generateWarmup(parseFloat(weight ?? '60'));
  }
}

// ── Module ────────────────────────────────────────────────────────────────────

@Module({
  imports: [BullModule.registerQueue({ name: 'pr-check' }, { name: 'ai-recommend' })],
  controllers: [SetsController],
  providers: [SetsService],
  exports: [SetsService],
})
export class SetsModule {}

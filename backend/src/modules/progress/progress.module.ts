// src/modules/progress/progress.module.ts
import {
  Module,
  Injectable,
  Controller,
  Get,
  Param,
  Query,
  ParseUUIDPipe,
  Logger,
} from '@nestjs/common';
import { BullModule, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { MuscleGroup } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../shared/redis.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../auth/strategies/jwt.strategy';
import { estimate1RM } from '../sets/sets.module';

// ── Internal types ────────────────────────────────────────────────────────────

interface SetRow {
  weightKg: { toString(): string } | null;
  reps: number | null;
  rir: number | null;
  completedAt: Date;
  block: { session: { startedAt: Date } };
}

interface VolumeData {
  sets: number;
  volumeKg: number;
  totalRir: number;
  rirCount: number;
}

interface VolumeRanges {
  mev: number;
  mav: number;
  mrv: number;
}

// MEV/MAV/MRV según Mike Israetel (RP Strength)
const VOLUME_RANGES: Record<string, VolumeRanges> = {
  CHEST: { mev: 8, mav: 16, mrv: 22 },
  BACK: { mev: 10, mav: 18, mrv: 25 },
  SHOULDERS: { mev: 8, mav: 16, mrv: 22 },
  BICEPS: { mev: 8, mav: 14, mrv: 20 },
  TRICEPS: { mev: 8, mav: 14, mrv: 18 },
  QUADS: { mev: 8, mav: 16, mrv: 22 },
  HAMSTRINGS: { mev: 6, mav: 12, mrv: 18 },
  GLUTES: { mev: 4, mav: 12, mrv: 20 },
  CALVES: { mev: 8, mav: 16, mrv: 24 },
  ABS: { mev: 8, mav: 16, mrv: 20 },
};

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable()
export class ProgressService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async getAllPRs(userId: string): Promise<unknown> {
    const cacheKey = `prs:${userId}`;
    const cached = await this.redis.getJson<unknown[]>(cacheKey);
    if (cached) return cached;

    const prs = await this.prisma.personalRecord.findMany({
      where: { userId },
      include: {
        exercise: {
          select: {
            id: true,
            name: true,
            primaryMuscles: true,
            equipment: true,
          },
        },
      },
      orderBy: { achievedAt: 'desc' },
    });

    await this.redis.setJson(cacheKey, prs, 5 * 60);
    return prs;
  }

  async getExercisePRs(userId: string, exerciseId: string): Promise<unknown> {
    return this.prisma.personalRecord.findMany({
      where: { userId, exerciseId },
      orderBy: { achievedAt: 'desc' },
    });
  }

  async get1RMHistory(
    userId: string,
    exerciseId: string,
    limit = 30,
  ): Promise<
    Array<{
      date: Date;
      estimated1RM: number;
      weightKg: number;
      reps: number;
      rir: number;
    }>
  > {
    const sets = await this.prisma.set.findMany({
      where: {
        setType: 'WORKING',
        isFailed: false,
        isSkipped: false,
        weightKg: { not: null },
        reps: { not: null },
        block: { exerciseId, session: { userId } },
      },
      orderBy: { completedAt: 'desc' },
      take: limit * 3,
      select: {
        weightKg: true,
        reps: true,
        rir: true,
        completedAt: true,
        block: { select: { session: { select: { startedAt: true } } } },
      },
    });

    // Mejor 1RM por sesión
    const bySession = new Map<string, SetRow>();

    for (const set of sets as unknown as SetRow[]) {
      const key = set.block.session.startedAt.toISOString().split('T')[0]!;
      const prev = bySession.get(key);
      const wt = set.weightKg ? +set.weightKg.toString() : 0;
      const wPrev = prev?.weightKg ? +prev.weightKg.toString() : 0;
      const prev1RM = prev ? estimate1RM(wPrev, prev.reps ?? 0, prev.rir ?? 0) : 0;
      const this1RM = estimate1RM(wt, set.reps ?? 0, set.rir ?? 0);

      if (this1RM > prev1RM) bySession.set(key, set);
    }

    return Array.from(bySession.values())
      .slice(0, limit)
      .map((s: SetRow) => {
        const wt = s.weightKg ? +s.weightKg.toString() : 0;
        return {
          date: s.block.session.startedAt,
          estimated1RM: estimate1RM(wt, s.reps ?? 0, s.rir ?? 0),
          weightKg: wt,
          reps: s.reps ?? 0,
          rir: s.rir ?? 0,
        };
      });
  }

  async getWeeklyVolume(userId: string, weeks = 8): Promise<unknown> {
    const since = new Date();
    since.setDate(since.getDate() - weeks * 7);

    return this.prisma.weeklyVolumeSummary.findMany({
      where: { userId, weekStart: { gte: since } },
      orderBy: [{ weekStart: 'desc' }, { totalSets: 'desc' }],
    });
  }

  async getCurrentWeekVolume(userId: string): Promise<unknown> {
    const monday = this.getMonday(new Date());

    const summary = await this.prisma.weeklyVolumeSummary.findMany({
      where: { userId, weekStart: monday },
      orderBy: { totalSets: 'desc' },
    });

    return summary.map((s) => {
      const ranges: VolumeRanges = VOLUME_RANGES[s.muscleGroup] ?? { mev: 6, mav: 12, mrv: 18 };
      const totalSets = s.totalSets;
      const status =
        totalSets < ranges.mev ? 'under_mev' : totalSets > ranges.mrv ? 'over_mrv' : 'optimal';

      return { ...s, ranges, status };
    });
  }

  private getMonday(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    d.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
    d.setHours(0, 0, 0, 0);
    return d;
  }
}

// ── Volume Aggregator Processor ───────────────────────────────────────────────

@Processor('volume-agg', { concurrency: 3 })
export class VolumeAggProcessor extends WorkerHost {
  private readonly logger = new Logger(VolumeAggProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(
    job: Job<{ userId: string; sessionId: string; muscleGroups: MuscleGroup[] }>,
  ): Promise<void> {
    const { userId, sessionId } = job.data;

    const sets = await this.prisma.set.findMany({
      where: {
        setType: 'WORKING',
        isFailed: false,
        isSkipped: false,
        block: { sessionId },
      },
      include: {
        block: {
          include: {
            exercise: { select: { primaryMuscles: true } },
          },
        },
      },
    });

    if (sets.length === 0) return;

    const volumeByMuscle = new Map<MuscleGroup, VolumeData>();

    for (const set of sets) {
      for (const muscle of set.block.exercise.primaryMuscles) {
        const existing: VolumeData = volumeByMuscle.get(muscle as MuscleGroup) ?? {
          sets: 0,
          volumeKg: 0,
          totalRir: 0,
          rirCount: 0,
        };

        const weight = set.weightKg ? +set.weightKg : 0;
        const reps = set.reps ?? 0;

        existing.sets += 1;
        existing.volumeKg += weight * reps;
        if (set.rir != null) {
          existing.totalRir += set.rir;
          existing.rirCount += 1;
        }

        volumeByMuscle.set(muscle as MuscleGroup, existing);
      }
    }

    const session = await this.prisma.workoutSession.findUnique({
      where: { id: sessionId },
      select: { startedAt: true },
    });
    if (!session) return;

    const weekStart = this.getMonday(session.startedAt);

    await Promise.all(
      Array.from(volumeByMuscle.entries()).map(([muscle, data]: [MuscleGroup, VolumeData]) =>
        this.prisma.weeklyVolumeSummary.upsert({
          where: {
            userId_weekStart_muscleGroup: { userId, weekStart, muscleGroup: muscle },
          },
          create: {
            userId,
            weekStart,
            muscleGroup: muscle,
            totalSets: data.sets,
            totalVolumeKg: data.volumeKg,
            avgRir: data.rirCount > 0 ? data.totalRir / data.rirCount : null,
            sessionCount: 1,
          },
          update: {
            totalSets: { increment: data.sets },
            totalVolumeKg: { increment: data.volumeKg },
            sessionCount: { increment: 1 },
          },
        }),
      ),
    );

    this.logger.log(`Volume aggregated: session ${sessionId}, ${volumeByMuscle.size} muscles`);
  }

  private getMonday(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    d.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
    d.setHours(0, 0, 0, 0);
    return d;
  }
}

// ── Controller ────────────────────────────────────────────────────────────────

@Controller('progress')
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Get('prs')
  getAllPRs(@CurrentUser() user: AuthUser): Promise<unknown> {
    return this.progressService.getAllPRs(user.id);
  }

  @Get('prs/:exerciseId')
  getExercisePRs(
    @CurrentUser() user: AuthUser,
    @Param('exerciseId') exerciseId: string,
  ): Promise<unknown> {
    return this.progressService.getExercisePRs(user.id, exerciseId);
  }

  @Get('1rm-history/:exerciseId')
  get1RMHistory(
    @CurrentUser() user: AuthUser,
    @Param('exerciseId') exerciseId: string,
    @Query('limit') limit?: string,
  ): Promise<unknown> {
    return this.progressService.get1RMHistory(user.id, exerciseId, parseInt(limit ?? '30'));
  }

  @Get('volume')
  getWeeklyVolume(@CurrentUser() user: AuthUser, @Query('weeks') weeks?: string): Promise<unknown> {
    return this.progressService.getWeeklyVolume(user.id, parseInt(weeks ?? '8'));
  }

  @Get('volume/current')
  getCurrentWeekVolume(@CurrentUser() user: AuthUser): Promise<unknown> {
    return this.progressService.getCurrentWeekVolume(user.id);
  }
}

// ── Module ────────────────────────────────────────────────────────────────────

@Module({
  imports: [BullModule.registerQueue({ name: 'volume-agg' })],
  controllers: [ProgressController],
  providers: [ProgressService, VolumeAggProcessor],
  exports: [ProgressService],
})
export class ProgressModule {}

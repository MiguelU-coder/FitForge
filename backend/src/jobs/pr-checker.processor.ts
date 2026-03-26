// src/jobs/pr-check.processor.ts
// Detecta PRs automáticamente después de cada set

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../database/prisma.service';
import { estimate1RM } from '../modules/sets/sets.module';

interface PrCheckJobData {
  setId: string;
  userId: string;
  exerciseId: string;
  weightKg: number;
  reps: number;
  rir: number;
}

@Processor('pr-check', {
  concurrency: 10, // Procesar hasta 10 simultáneamente
})
export class PrCheckProcessor extends WorkerHost {
  private readonly logger = new Logger(PrCheckProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(
    job: Job<PrCheckJobData>,
  ): Promise<{ isPr: boolean; prType?: string; value?: number }> {
    const { setId, userId, exerciseId, weightKg, reps, rir } = job.data;

    const results: Array<{ type: string; value: number; isNew: boolean }> = [];

    // ── 1. 1RM estimado ────────────────────────────────────────────────────
    const estimated1RM = estimate1RM(weightKg, reps, rir);

    const existing1RM = await this.prisma.personalRecord.findUnique({
      where: {
        userId_exerciseId_prType: {
          userId,
          exerciseId,
          prType: 'ONE_RM_ESTIMATED',
        },
      },
    });

    if (!existing1RM || estimated1RM > +existing1RM.value) {
      await this.prisma.personalRecord.upsert({
        where: {
          userId_exerciseId_prType: {
            userId,
            exerciseId,
            prType: 'ONE_RM_ESTIMATED',
          },
        },
        create: {
          userId,
          exerciseId,
          prType: 'ONE_RM_ESTIMATED',
          value: estimated1RM,
          achievedAt: new Date(),
        },
        update: {
          value: estimated1RM,
          achievedAt: new Date(),
        },
      });
      results.push({ type: '1RM_ESTIMATED', value: estimated1RM, isNew: true });
    }

    // ── 2. Max weight ───────────────────────────────────────────────────────
    const existingMaxWeight = await this.prisma.personalRecord.findUnique({
      where: {
        userId_exerciseId_prType: {
          userId,
          exerciseId,
          prType: 'MAX_WEIGHT',
        },
      },
    });

    if (!existingMaxWeight || weightKg > +existingMaxWeight.value) {
      await this.prisma.personalRecord.upsert({
        where: {
          userId_exerciseId_prType: {
            userId,
            exerciseId,
            prType: 'MAX_WEIGHT',
          },
        },
        create: {
          userId,
          exerciseId,
          prType: 'MAX_WEIGHT',
          value: weightKg,
          achievedAt: new Date(),
        },
        update: {
          value: weightKg,
          achievedAt: new Date(),
        },
      });
      results.push({ type: 'MAX_WEIGHT', value: weightKg, isNew: true });
    }

    // ── 3. Marcar el set como PR si hay alguno nuevo ────────────────────────
    const hasNewPr = results.some((r) => r.isNew);

    if (hasNewPr) {
      await this.prisma.set.update({
        where: { id: setId },
        data: { isPr: true },
      });

      this.logger.log(
        `🏆 New PR for user ${userId.slice(0, 8)}... exercise ${exerciseId.slice(0, 8)}...: ` +
          results.map((r) => `${r.type}=${r.value}`).join(', '),
      );
    }

    return {
      isPr: hasNewPr,
      prType: results[0]?.type,
      value: results[0]?.value,
    };
  }
}

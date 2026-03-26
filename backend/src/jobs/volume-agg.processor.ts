// src/jobs/volume-agg.processor.ts
//
// Processor BullMQ para agregar volumen semanal por grupo muscular.
//
// Se dispara al finalizar cada sesión (WorkoutsService.finishSession).
// Calcula sets totales, volumen en kg y RIR promedio por músculo
// y hace upsert en la tabla weekly_volume_summary.
//
// Esta tabla alimenta:
//   - GET /progress/volume/current  → dashboard de volumen semanal
//   - Indicadores MEV / MAV / MRV  → saber si el usuario entrena suficiente
//   - AI service                   → contexto de fatiga acumulada
//
// El processor está separado de progress.module.ts para:
//   - Poder importarlo en JobsModule sin crear dependencias circulares
//   - Tener su propio contexto de logging
//   - Ser testeado de forma independiente

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { MuscleGroup } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../shared/redis.service';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface VolumeAggJobData {
  userId: string;
  sessionId: string;
  muscleGroups: MuscleGroup[]; // Lista de músculos entrenados (para logs)
}

interface MuscleVolume {
  sets: number;
  volumeKg: number;
  totalRir: number;
  rirCount: number;
}

// ── Processor ─────────────────────────────────────────────────────────────────

@Processor('volume-agg', { concurrency: 3 })
export class VolumeAggProcessor extends WorkerHost {
  private readonly logger = new Logger(VolumeAggProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {
    super();
  }

  async process(job: Job<VolumeAggJobData>): Promise<void> {
    const { userId, sessionId } = job.data;

    // ── 1. Obtener todos los sets de trabajo de la sesión ───────────────────
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

    if (sets.length === 0) {
      this.logger.debug(`No working sets found for session ${sessionId}`);
      return;
    }

    // ── 2. Agrupar volumen por grupo muscular primario ──────────────────────
    const volumeByMuscle = new Map<MuscleGroup, MuscleVolume>();

    for (const set of sets) {
      for (const muscle of set.block.exercise.primaryMuscles) {
        const key = muscle as MuscleGroup;
        const acc: MuscleVolume = volumeByMuscle.get(key) ?? {
          sets: 0,
          volumeKg: 0,
          totalRir: 0,
          rirCount: 0,
        };

        const weight = set.weightKg ? +set.weightKg : 0;
        const reps = set.reps ?? 0;

        acc.sets += 1;
        acc.volumeKg += weight * reps;

        if (set.rir != null) {
          acc.totalRir += set.rir;
          acc.rirCount += 1;
        }

        volumeByMuscle.set(key, acc);
      }
    }

    // ── 3. Calcular inicio de semana (lunes) ────────────────────────────────
    const session = await this.prisma.workoutSession.findUnique({
      where: { id: sessionId },
      select: { startedAt: true },
    });

    if (!session) {
      this.logger.warn(`Session ${sessionId} not found during volume aggregation`);
      return;
    }

    const weekStart = this.getMonday(session.startedAt);

    // ── 4. Upsert por músculo en parallel ───────────────────────────────────
    const upserts = Array.from(volumeByMuscle.entries()).map(
      ([muscle, data]: [MuscleGroup, MuscleVolume]) => {
        const avgRir =
          data.rirCount > 0 ? Math.round((data.totalRir / data.rirCount) * 10) / 10 : null;

        return this.prisma.weeklyVolumeSummary.upsert({
          where: {
            userId_weekStart_muscleGroup: {
              userId,
              weekStart,
              muscleGroup: muscle,
            },
          },
          create: {
            userId,
            weekStart,
            muscleGroup: muscle,
            totalSets: data.sets,
            totalVolumeKg: data.volumeKg,
            avgRir,
            sessionCount: 1,
          },
          update: {
            // Incrementar — puede haber múltiples sesiones en la misma semana
            totalSets: { increment: data.sets },
            totalVolumeKg: { increment: data.volumeKg },
            sessionCount: { increment: 1 },
            // avgRir: no actualizar en update (es un resumen simple del primer cálculo)
          },
        });
      },
    );

    await Promise.all(upserts);

    // ── 5. Invalidar caché del volumen semanal ──────────────────────────────
    // Para que el endpoint /progress/volume/current devuelva datos frescos
    await this.redis
      .del(`volume:current:${userId}`)
      .catch((e: Error) => this.logger.warn(`Cache invalidation failed: ${e.message}`));

    this.logger.log(
      `✅ Volume aggregated — session: ${sessionId.slice(0, 8)}... ` +
        `user: ${userId.slice(0, 8)}... ` +
        `muscles: ${Array.from(volumeByMuscle.keys()).join(', ')} ` +
        `total_sets: ${sets.length}`,
    );
  }

  // Obtener el lunes de la semana de una fecha dada
  private getMonday(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay(); // 0=Dom, 1=Lun ... 6=Sáb
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }
}

// src/jobs/ai-recommend.processor.ts
//
// Processor BullMQ para sugerencias de sobrecarga progresiva IA.
//
// Flujo:
//   1. SetsService dispara el job después de cada set de trabajo
//   2. Este processor revisa caché Redis — si hay sugerencia reciente, la devuelve
//   3. Si no hay caché, llama al microservicio Python FastAPI
//   4. Guarda la respuesta en Redis (TTL 1h) para no llamar en cada set
//   5. Si el AI service falla → fallback a algoritmo local (no bloquea al usuario)
//
// El resultado NO se devuelve al usuario directamente.
// La app móvil lo obtiene vía GET /workouts/sessions/:id (campo aiSuggestion).
// Para MVP: guardar en Redis con key ai:rec:{userId}:{exerciseId}
// y que el endpoint de sesión activa lo incluya si existe.

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bullmq';
import { RedisService, RedisDb } from '../shared/redis.service';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AiRecommendJobData {
  userId: string;
  exerciseId: string;
  sessionId: string;
  lastSet: {
    weightKg: number;
    reps: number;
    rir: number;
  };
}

export interface AiRecommendation {
  suggestedWeightKg: number;
  suggestedReps: number;
  suggestedRir: number;
  rationale: string;
  confidence: number; // 0–1
  strategy: 'progressive_overload' | 'deload' | 'maintain' | 'technique';
  generatedAt: string; // ISO datetime
}

// Respuesta del microservicio Python FastAPI
interface AiServiceResponse {
  suggested_weight_kg: number;
  suggested_reps: number;
  suggested_rir: number;
  rationale: string;
  confidence: number;
  strategy: string;
}

// ── Fallback local (cuando el AI service no responde) ─────────────────────────
// Algoritmo conservador: +2.5kg si RIR ≥ 2, mantener si RIR = 1, bajar si RIR = 0

function localFallback(weightKg: number, reps: number, rir: number): AiRecommendation {
  let suggestedWeight = weightKg;
  let rationale = '';
  let strategy: AiRecommendation['strategy'] = 'maintain';

  if (rir >= 3) {
    // Mucho margen — subir peso
    suggestedWeight = Math.round((weightKg + 2.5) / 2.5) * 2.5;
    rationale = `RIR ${rir} indicates sufficient capacity. Increase load by 2.5kg.`;
    strategy = 'progressive_overload';
  } else if (rir === 2) {
    // Margen justo — subir 1.25kg o mantener
    suggestedWeight = Math.round((weightKg + 1.25) / 1.25) * 1.25;
    rationale = `RIR 2 allows a small load increase.`;
    strategy = 'progressive_overload';
  } else if (rir === 1) {
    rationale = `RIR 1 — maintain current load and focus on technique.`;
    strategy = 'maintain';
  } else {
    // RIR 0 — al fallo, reducir para la siguiente sesión
    suggestedWeight = Math.max(weightKg - 2.5, 20);
    rationale = `RIR 0 detected. Reduce load to manage fatigue next session.`;
    strategy = 'deload';
  }

  return {
    suggestedWeightKg: suggestedWeight,
    suggestedReps: reps,
    suggestedRir: 2,
    rationale,
    confidence: 0.6, // menor confianza porque es fallback
    strategy,
    generatedAt: new Date().toISOString(),
  };
}

// ── Processor ─────────────────────────────────────────────────────────────────

@Processor('ai-recommend', {
  concurrency: 5, // Hasta 5 llamadas al AI service simultáneas
})
export class AiRecommendProcessor extends WorkerHost {
  private readonly logger = new Logger(AiRecommendProcessor.name);

  // TTL del caché: 1h — no llamar al AI en cada set del mismo ejercicio
  private readonly CACHE_TTL_SECONDS = 60 * 60;

  constructor(
    private readonly redis: RedisService,
    private readonly config: ConfigService,
  ) {
    super();
  }

  async process(job: Job<AiRecommendJobData>): Promise<AiRecommendation> {
    const { userId, exerciseId, lastSet } = job.data;

    // ── 1. Revisar caché ────────────────────────────────────────────────────
    const cacheKey = `ai:rec:${userId}:${exerciseId}`;
    const cached = await this.redis.getJson<AiRecommendation>(cacheKey, RedisDb.CACHE);

    if (cached) {
      this.logger.debug(`Cache hit: ${cacheKey}`);
      return cached;
    }

    // ── 2. Llamar al microservicio Python ───────────────────────────────────
    const aiUrl = this.config.get<string>('AI_SERVICE_URL', 'http://localhost:8000');
    const aiSecret = this.config.get<string>('AI_SERVICE_SECRET', '');
    const timeoutMs = this.config.get<number>('AI_SERVICE_TIMEOUT_MS', 5000);

    let recommendation: AiRecommendation;

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(`${aiUrl}/ai/suggestion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(aiSecret ? { Authorization: `Bearer ${aiSecret}` } : {}),
        },
        body: JSON.stringify({
          userId,
          exerciseId,
          exerciseName: 'Unknown',
          targetReps: lastSet.reps,
          targetRir: 2,
          setsDoneToday: [
            {
              setNumber: 1,
              setType: 'WORKING',
              weightKg: lastSet.weightKg,
              reps: lastSet.reps,
              rir: lastSet.rir,
            },
          ],
          lastSessionSets: [],
        }),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        throw new Error(`AI service responded ${response.status}`);
      }

      const data = (await response.json()) as any;

      const suggestedWeightKg: number =
        typeof data?.suggested_weight === 'number'
          ? data.suggested_weight
          : typeof data?.suggested_weight_kg === 'number'
            ? data.suggested_weight_kg
            : lastSet.weightKg;

      recommendation = {
        suggestedWeightKg,
        suggestedReps:
          typeof data?.suggested_reps === 'number' ? data.suggested_reps : lastSet.reps,
        suggestedRir: typeof data?.suggested_rir === 'number' ? data.suggested_rir : 2,
        rationale:
          typeof data?.reasoning === 'string' ? data.reasoning : 'AI suggestion generated.',
        confidence: typeof data?.confidence === 'number' ? data.confidence : 0.7,
        strategy: 'progressive_overload',
        generatedAt: new Date().toISOString(),
      };

      this.logger.debug(
        `AI recommendation for exercise ${exerciseId.slice(0, 8)}...: ` +
          `${recommendation.suggestedWeightKg}kg × ${recommendation.suggestedReps} @ RIR${recommendation.suggestedRir}`,
      );
    } catch (error: unknown) {
      // Fallback silencioso — el usuario nunca ve el error
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.warn(`AI service unavailable, using local fallback: ${msg}`);

      recommendation = localFallback(lastSet.weightKg, lastSet.reps, lastSet.rir);
    }

    // ── 3. Guardar en caché Redis ────────────────────────────────────────────
    await this.redis
      .setJson(cacheKey, recommendation, this.CACHE_TTL_SECONDS, RedisDb.CACHE)
      .catch((e: Error) => this.logger.warn(`Failed to cache recommendation: ${e.message}`));

    return recommendation;
  }
}

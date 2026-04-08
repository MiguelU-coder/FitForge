// ─────────────────────────────────────────────────────────────────────────────
// FitForge — Event Consumers (BullMQ Workers)
//
// Each processor handles one queue.
// Responsibilities: validate payload, call AI service, handle side-effects.
// Actual AI calls are implemented in Phase 2 (ai-client.service.ts).
// ─────────────────────────────────────────────────────────────────────────────

import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

import {
  SetRecordedPayload,
  WorkoutCompletedPayload,
  PRDetectedPayload,
  FatigueThresholdPayload,
} from './event.types';
import { QUEUE } from '../../jobs/queue.config';
import { EventProducerService } from './event-producer.service';
import { RedisService } from '../../shared/redis.service';

// ─────────────────────────────────────────────────────────────────────────────
// 1. SET_ANALYSIS consumer
// ─────────────────────────────────────────────────────────────────────────────

@Processor(QUEUE.SET_ANALYSIS, { concurrency: 10 })
export class SetAnalysisConsumer extends WorkerHost {
  private readonly logger = new Logger(SetAnalysisConsumer.name);

  constructor(
    private readonly redis: RedisService,
    private readonly eventProducer: EventProducerService,
    // AiClientService injected in Phase 2
  ) {
    super();
  }

  async process(job: Job<SetRecordedPayload>): Promise<void> {
    const payload = job.data;
    this.logger.log(`Processing SET_RECORDED for user:${payload.userId} set:${payload.setId}`);

    // ── Phase 2 placeholder: call AI service ─────────────────────────────────
    // const analysis = await this.aiClient.analyseSet(payload);
    // const { fatigueScore, estimatedOneRM, nextSetRecommendation } = analysis;
    //
    // if (fatigueScore > 0.75) {
    //   await this.eventProducer.emitFatigueThreshold({ ... });
    // }

    // ── Publish coaching card to Redis pub/sub (WebSocket pickup) ────────────
    await this.redis.cache.publish(
      `user:${payload.userId}:coaching`,
      JSON.stringify({
        type: 'SET_FEEDBACK',
        setId: payload.setId,
        exerciseId: payload.exerciseId,
        // Populated by AI service in Phase 2
        analysis: null,
        timestamp: new Date().toISOString(),
      }),
    );
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error): void {
    this.logger.error(
      `SET_ANALYSIS job ${job.id} failed (attempt ${job.attemptsMade}): ${error.message}`,
    );
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job): void {
    this.logger.debug(`SET_ANALYSIS job ${job.id} completed`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. WORKOUT_COMPLETED consumer
// ─────────────────────────────────────────────────────────────────────────────

@Processor(QUEUE.WORKOUT_COMPLETED, { concurrency: 5 })
export class WorkoutCompletedConsumer extends WorkerHost {
  private readonly logger = new Logger(WorkoutCompletedConsumer.name);

  constructor(
    private readonly redis: RedisService,
    private readonly eventProducer: EventProducerService,
  ) {
    super();
  }

  async process(job: Job<WorkoutCompletedPayload>): Promise<void> {
    const payload = job.data;
    this.logger.log(
      `Processing WORKOUT_COMPLETED for user:${payload.userId} workout:${payload.workoutId}`,
    );

    // ── Phase 2 placeholder: progressive overload + fatigue assessment ───────
    // const [overload, fatigue] = await Promise.all([
    //   this.aiClient.calculateProgressiveOverload(payload),
    //   this.aiClient.calculateFatigue(payload.userId),
    // ]);
    // await this.nextSessionPlanService.upsert(payload.userId, overload);

    // Notify Flutter via WebSocket
    await this.redis.cache.publish(
      `user:${payload.userId}:coaching`,
      JSON.stringify({
        type: 'WORKOUT_COMPLETE_SUMMARY',
        workoutId: payload.workoutId,
        timestamp: new Date().toISOString(),
      }),
    );
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error): void {
    this.logger.error(`WORKOUT_COMPLETED job ${job.id} failed: ${error.message}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. PR_DETECTED consumer
// ─────────────────────────────────────────────────────────────────────────────

@Processor(QUEUE.PR_DETECTED, { concurrency: 5 })
export class PRDetectedConsumer extends WorkerHost {
  private readonly logger = new Logger(PRDetectedConsumer.name);

  constructor(private readonly redis: RedisService) {
    super();
  }

  async process(job: Job<PRDetectedPayload>): Promise<void> {
    const payload = job.data;
    this.logger.log(
      `Processing PR_DETECTED for user:${payload.userId} exercise:${payload.exerciseName}`,
    );

    // Push PR celebration event to WebSocket immediately (latency-sensitive)
    await this.redis.cache.publish(
      `user:${payload.userId}:coaching`,
      JSON.stringify({
        type: 'PR_CELEBRATION',
        exerciseName: payload.exerciseName,
        prType: payload.prType,
        newValue: payload.newValue,
        improvementPct: payload.improvementPct,
        timestamp: new Date().toISOString(),
      }),
    );
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error): void {
    this.logger.error(`PR_DETECTED job ${job.id} failed: ${error.message}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. FATIGUE_CHECK consumer
// ─────────────────────────────────────────────────────────────────────────────

@Processor(QUEUE.FATIGUE_CHECK, { concurrency: 3 })
export class FatigueCheckConsumer extends WorkerHost {
  private readonly logger = new Logger(FatigueCheckConsumer.name);

  constructor(private readonly redis: RedisService) {
    super();
  }

  async process(job: Job<FatigueThresholdPayload>): Promise<void> {
    const payload = job.data;
    this.logger.warn(
      `FATIGUE_THRESHOLD for user:${payload.userId} score:${payload.fatigueScore} status:${payload.fatigueStatus}`,
    );

    // Push fatigue alert to WebSocket
    await this.redis.cache.publish(
      `user:${payload.userId}:coaching`,
      JSON.stringify({
        type: 'FATIGUE_ALERT',
        fatigueScore: payload.fatigueScore,
        fatigueStatus: payload.fatigueStatus,
        tsb: payload.tsb,
        timestamp: new Date().toISOString(),
      }),
    );
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error): void {
    this.logger.error(`FATIGUE_CHECK job ${job.id} failed: ${error.message}`);
  }
}

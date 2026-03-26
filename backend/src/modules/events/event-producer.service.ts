// ─────────────────────────────────────────────────────────────────────────────
// FitForge — Event Producer Service
//
// Single entry point for publishing ALL domain events.
// Responsibilities:
//   1. Persist event to event_log table (audit trail)
//   2. Enqueue job in the correct BullMQ queue
//   3. Publish to Redis pub/sub for real-time WebSocket delivery
//   4. Forward to n8n via HTTP webhook
// ─────────────────────────────────────────────────────────────────────────────

import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue }        from '@nestjs/bullmq';
import { Queue }              from 'bullmq';
import { HttpService }        from '@nestjs/axios';
import { randomUUID }         from 'crypto';
import { firstValueFrom }     from 'rxjs';
import { RedisService, RedisDb } from '../../shared/redis.service';

import {
  AnyEventPayload,
  FitForgeEvent,
  SetRecordedPayload,
  WorkoutStartedPayload,
  WorkoutCompletedPayload,
  PRDetectedPayload,
  FatigueThresholdPayload,
} from './event.types';
import { QUEUE, QUEUE_JOB_OPTIONS } from '../../jobs/queue.config';
import { PrismaService } from '../../database/prisma.service';

// ─── Queue → Event routing table ─────────────────────────────────────────────

const EVENT_QUEUE_MAP: Record<FitForgeEvent, string> = {
  [FitForgeEvent.SET_RECORDED]:    QUEUE.SET_ANALYSIS,
  [FitForgeEvent.WORKOUT_STARTED]: QUEUE.SET_ANALYSIS,    // light job — session init
  [FitForgeEvent.WORKOUT_COMPLETED]: QUEUE.WORKOUT_COMPLETED,
  [FitForgeEvent.PR_DETECTED]:     QUEUE.PR_DETECTED,
  [FitForgeEvent.FATIGUE_THRESHOLD]: QUEUE.FATIGUE_CHECK,
};

// ─── n8n webhook URLs (one per event type) ───────────────────────────────────

const N8N_WEBHOOK_MAP: Record<FitForgeEvent, string> = {
  [FitForgeEvent.SET_RECORDED]:      `${process.env.N8N_BASE_URL}/webhook/set-recorded`,
  [FitForgeEvent.WORKOUT_STARTED]:   `${process.env.N8N_BASE_URL}/webhook/workout-started`,
  [FitForgeEvent.WORKOUT_COMPLETED]: `${process.env.N8N_BASE_URL}/webhook/workout-completed`,
  [FitForgeEvent.PR_DETECTED]:       `${process.env.N8N_BASE_URL}/webhook/pr-detected`,
  [FitForgeEvent.FATIGUE_THRESHOLD]: `${process.env.N8N_BASE_URL}/webhook/fatigue-threshold`,
};

// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class EventProducerService {
  private readonly logger = new Logger(EventProducerService.name);

  constructor(
    @InjectQueue(QUEUE.SET_ANALYSIS)      private setAnalysisQueue:      Queue,
    @InjectQueue(QUEUE.WORKOUT_COMPLETED) private workoutCompletedQueue: Queue,
    @InjectQueue(QUEUE.PR_DETECTED)       private prDetectedQueue:       Queue,
    @InjectQueue(QUEUE.FATIGUE_CHECK)     private fatigueCheckQueue:     Queue,
    private readonly prisma:              PrismaService,
    private readonly redis:               RedisService,
    private readonly httpService:         HttpService,
  ) {}

  // ─── Public API ────────────────────────────────────────────────────────────

  async emitSetRecorded(payload: Omit<SetRecordedPayload, 'eventId' | 'eventType' | 'timestamp'>): Promise<void> {
    await this.publish({
      ...payload,
      eventId:   randomUUID(),
      eventType: FitForgeEvent.SET_RECORDED,
      timestamp: new Date().toISOString(),
    } as SetRecordedPayload);
  }

  async emitWorkoutStarted(payload: Omit<WorkoutStartedPayload, 'eventId' | 'eventType' | 'timestamp'>): Promise<void> {
    await this.publish({
      ...payload,
      eventId:   randomUUID(),
      eventType: FitForgeEvent.WORKOUT_STARTED,
      timestamp: new Date().toISOString(),
    } as WorkoutStartedPayload);
  }

  async emitWorkoutCompleted(payload: Omit<WorkoutCompletedPayload, 'eventId' | 'eventType' | 'timestamp'>): Promise<void> {
    await this.publish({
      ...payload,
      eventId:   randomUUID(),
      eventType: FitForgeEvent.WORKOUT_COMPLETED,
      timestamp: new Date().toISOString(),
    } as WorkoutCompletedPayload);
  }

  async emitPRDetected(payload: Omit<PRDetectedPayload, 'eventId' | 'eventType' | 'timestamp'>): Promise<void> {
    await this.publish({
      ...payload,
      eventId:   randomUUID(),
      eventType: FitForgeEvent.PR_DETECTED,
      timestamp: new Date().toISOString(),
    } as PRDetectedPayload);
  }

  async emitFatigueThreshold(payload: Omit<FatigueThresholdPayload, 'eventId' | 'eventType' | 'timestamp'>): Promise<void> {
    await this.publish({
      ...payload,
      eventId:   randomUUID(),
      eventType: FitForgeEvent.FATIGUE_THRESHOLD,
      timestamp: new Date().toISOString(),
    } as FatigueThresholdPayload);
  }

  // ─── Core publish pipeline ─────────────────────────────────────────────────

  private async publish(event: AnyEventPayload): Promise<void> {
    const { eventType, userId } = event;
    this.logger.log(`Publishing ${eventType} for user ${userId} [${event.eventId}]`);

    // Run all side effects concurrently; don't let one failure block others
    const results = await Promise.allSettled([
      this.persistToEventLog(event),
      this.enqueueJob(event),
      this.pubSubBroadcast(event),
      this.forwardToN8n(event),
    ]);

    // Log any partial failures — don't throw (event already enqueued)
    results.forEach((r, i) => {
      if (r.status === 'rejected') {
        const step = ['event_log', 'bullmq', 'redis_pubsub', 'n8n'][i];
        this.logger.error(`publish step "${step}" failed for ${event.eventId}: ${r.reason}`);
      }
    });
  }

  // ─── Step 1: Persist to event_log ─────────────────────────────────────────

  private async persistToEventLog(event: AnyEventPayload): Promise<void> {
    // Silently skip if the event_log table doesn't exist yet (pre-migration)
    try {
      await this.prisma.eventLog.create({
        data: {
          id:        event.eventId,
          userId:    event.userId,
          eventType: event.eventType,
          payload:   event as any,
          source:    'backend',
          createdAt: new Date(event.timestamp),
        },
      });
    } catch (err: any) {
      // Only warn once; don't block the rest of the publish pipeline
      if ((err?.message as string)?.includes('does not exist')) {
        this.logger.warn('event_log table missing — run `pnpm prisma db push`. Skipping persist.');
      } else {
        throw err; // re-throw real errors
      }
    }
  }

  // ─── Step 2: Enqueue in BullMQ ────────────────────────────────────────────

  private async enqueueJob(event: AnyEventPayload): Promise<void> {
    const queueName = EVENT_QUEUE_MAP[event.eventType];
    const queue     = this.resolveQueue(queueName);
    const jobOpts   = QUEUE_JOB_OPTIONS[queueName as keyof typeof QUEUE_JOB_OPTIONS];

    await queue.add(event.eventType, event, {
      ...jobOpts,
      jobId: event.eventId,  // idempotency — duplicate events are deduped
    });

    this.logger.debug(`Enqueued ${event.eventType} → queue:${queueName}`);
  }

  // ─── Step 3: Redis Pub/Sub for WebSocket delivery ─────────────────────────

  private async pubSubBroadcast(event: AnyEventPayload): Promise<void> {
    const channel = `user:${event.userId}:events`;
    await this.redis.cache.publish(channel, JSON.stringify(event));
  }

  // ─── Step 4: Forward to n8n webhook ───────────────────────────────────────

  private async forwardToN8n(event: AnyEventPayload): Promise<void> {
    // Skip forwarding if n8n is not configured (development without n8n)
    const n8nBase = process.env.N8N_BASE_URL;
    if (!n8nBase || n8nBase.trim() === '') {
      this.logger.debug(`n8n not configured — skipping forward for ${event.eventType}`);
      return;
    }

    const url = N8N_WEBHOOK_MAP[event.eventType];
    if (!url) return;

    await firstValueFrom(
      this.httpService.post(url, event, {
        headers: {
          'Content-Type':      'application/json',
          'x-fitforge-secret': process.env.N8N_WEBHOOK_SECRET ?? '',
        },
        timeout: 5000,
      }),
    );

    this.logger.debug(`Forwarded ${event.eventType} to n8n`);
  }

  // ─── Queue resolver ────────────────────────────────────────────────────────

  private resolveQueue(name: string): Queue {
    const map: Record<string, Queue> = {
      [QUEUE.SET_ANALYSIS]:      this.setAnalysisQueue,
      [QUEUE.WORKOUT_COMPLETED]: this.workoutCompletedQueue,
      [QUEUE.PR_DETECTED]:       this.prDetectedQueue,
      [QUEUE.FATIGUE_CHECK]:     this.fatigueCheckQueue,
    };
    const queue = map[name];
    if (!queue) throw new Error(`No queue registered for name: ${name}`);
    return queue;
  }
}

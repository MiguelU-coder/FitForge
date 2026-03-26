// ─────────────────────────────────────────────────────────────────────────────
// FitForge — Events Module
// ─────────────────────────────────────────────────────────────────────────────

import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { HttpModule } from '@nestjs/axios';
import { JwtModule } from '@nestjs/jwt';

import { PrismaModule } from '../../database/prisma.module';
import { SharedModule } from '../../shared/shared.module';
import { EventProducerService } from './event-producer.service';
import { CoachingGateway } from './coaching.gateway';
import {
  SetAnalysisConsumer,
  WorkoutCompletedConsumer,
  PRDetectedConsumer,
  FatigueCheckConsumer,
} from './event-consumers';
import { QUEUE, BULLMQ_REDIS_OPTIONS } from '../../jobs/queue.config';

@Module({
  imports: [
    // Register all queues
    BullModule.registerQueue(
      { name: QUEUE.SET_ANALYSIS, connection: BULLMQ_REDIS_OPTIONS },
      { name: QUEUE.WORKOUT_COMPLETED, connection: BULLMQ_REDIS_OPTIONS },
      { name: QUEUE.PR_DETECTED, connection: BULLMQ_REDIS_OPTIONS },
      { name: QUEUE.FATIGUE_CHECK, connection: BULLMQ_REDIS_OPTIONS },
      { name: QUEUE.NOTIFICATIONS, connection: BULLMQ_REDIS_OPTIONS },
      { name: QUEUE.WEEKLY_SUMMARY, connection: BULLMQ_REDIS_OPTIONS },
    ),
    PrismaModule,
    SharedModule,
    HttpModule.register({ timeout: 5000 }),
    JwtModule.register({ secret: process.env.JWT_SECRET }),
  ],
  providers: [
    // Producer
    EventProducerService,
    // Consumers
    SetAnalysisConsumer,
    WorkoutCompletedConsumer,
    PRDetectedConsumer,
    FatigueCheckConsumer,
    // WebSocket gateway
    CoachingGateway,
  ],
  exports: [EventProducerService, CoachingGateway],
})
export class EventsModule {}

// ─────────────────────────────────────────────────────────────────────────────
// FitForge — Queue Configuration
// Centralised BullMQ queue names, priorities and default job options.
// ─────────────────────────────────────────────────────────────────────────────

import { QueueOptions, DefaultJobOptions } from 'bullmq';

// ─── Queue Names ─────────────────────────────────────────────────────────────

export const QUEUE = {
  SET_ANALYSIS: 'set-analysis',
  WORKOUT_COMPLETED: 'workout-completed',
  PR_DETECTED: 'pr-detected',
  FATIGUE_CHECK: 'fatigue-check',
  NOTIFICATIONS: 'notifications',
  WEEKLY_SUMMARY: 'weekly-summary',
} as const;

export type QueueName = (typeof QUEUE)[keyof typeof QUEUE];

// ─── Job Priority Levels (lower = higher priority in BullMQ) ─────────────────

export const JOB_PRIORITY = {
  CRITICAL: 1,
  HIGH: 2,
  MEDIUM: 5,
  LOW: 10,
} as const;

// ─── Per-queue default job options ───────────────────────────────────────────

export const QUEUE_JOB_OPTIONS: Record<QueueName, DefaultJobOptions> = {
  [QUEUE.SET_ANALYSIS]: {
    priority: JOB_PRIORITY.CRITICAL,
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: { count: 500 },
    removeOnFail: { count: 100 },
  },
  [QUEUE.WORKOUT_COMPLETED]: {
    priority: JOB_PRIORITY.HIGH,
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: { count: 200 },
    removeOnFail: { count: 50 },
  },
  [QUEUE.PR_DETECTED]: {
    priority: JOB_PRIORITY.HIGH,
    attempts: 5,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: { count: 200 },
    removeOnFail: { count: 50 },
  },
  [QUEUE.FATIGUE_CHECK]: {
    priority: JOB_PRIORITY.MEDIUM,
    attempts: 3,
    backoff: { type: 'fixed', delay: 5000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
  [QUEUE.NOTIFICATIONS]: {
    priority: JOB_PRIORITY.MEDIUM,
    attempts: 5,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 200 },
  },
  [QUEUE.WEEKLY_SUMMARY]: {
    priority: JOB_PRIORITY.LOW,
    attempts: 3,
    backoff: { type: 'fixed', delay: 30000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
};

// ─── Shared Redis connection options for BullMQ ───────────────────────────────

export const BULLMQ_REDIS_OPTIONS = {
  host: process.env.REDIS_HOST ?? 'localhost',
  port: parseInt(process.env.REDIS_PORT ?? '6379'),
  password: process.env.REDIS_PASSWORD ?? undefined,
  db: parseInt(process.env.REDIS_BULLMQ_DB ?? '0'),
};

// ─── Shared queue options applied to every Queue instance ────────────────────

export const DEFAULT_QUEUE_OPTIONS: QueueOptions = {
  connection: BULLMQ_REDIS_OPTIONS,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
  },
};

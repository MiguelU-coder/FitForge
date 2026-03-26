// src/shared/redis.service.ts
import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { EnvConfig } from '../config/env.validation';

// ── Bases de datos Redis por propósito ────────────────────────────────────────
// DB 0 → Cache general (PRs, recommendations, exercise catalog)
// DB 1 → Sessions & Refresh token blacklist
// DB 2 → BullMQ queues (manejado por BullMQ automáticamente)
// DB 3 → Rate limiting (Throttler)

export enum RedisDb {
  CACHE = 0,
  SESSIONS = 1,
  QUEUES = 2,
  RATE_LIMIT = 3,
}

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly clients = new Map<RedisDb, Redis>();

  constructor(private readonly config: ConfigService<EnvConfig, true>) {}

  getClient(db: RedisDb = RedisDb.CACHE): Redis {
    if (!this.clients.has(db)) {
      const client = new Redis(this.config.get('REDIS_URL'), {
        db,
        maxRetriesPerRequest: 3,
        retryStrategy: (times): number => Math.min(times * 100, 3000),
        lazyConnect: false,
        enableReadyCheck: true,
        connectTimeout: 5000,
        commandTimeout: 3000,
      });

      client.on('connect', () => this.logger.log(`✅ Redis DB${db} connected`));
      client.on('error', (err: Error) =>
        this.logger.error(`❌ Redis DB${db} error: ${err.message}`),
      );

      this.clients.set(db, client);
    }
    return this.clients.get(db)!;
  }

  // Getters semánticos
  get cache(): Redis {
    return this.getClient(RedisDb.CACHE);
  }
  get sessions(): Redis {
    return this.getClient(RedisDb.SESSIONS);
  }
  get rateLimit(): Redis {
    return this.getClient(RedisDb.RATE_LIMIT);
  }

  // ── Helpers tipados ──────────────────────────────────────────────────────

  async getJson<T>(key: string, db = RedisDb.CACHE): Promise<T | null> {
    const raw = await this.getClient(db).get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  async setJson<T>(key: string, value: T, ttlSeconds: number, db = RedisDb.CACHE): Promise<void> {
    await this.getClient(db).setex(key, ttlSeconds, JSON.stringify(value));
  }

  async del(key: string, db = RedisDb.CACHE): Promise<void> {
    await this.getClient(db).del(key);
  }

  async exists(key: string, db = RedisDb.CACHE): Promise<boolean> {
    const result = await this.getClient(db).exists(key);
    return result === 1;
  }

  async onModuleDestroy(): Promise<void> {
    const disconnects = Array.from(this.clients.values()).map((c) => c.quit());
    await Promise.allSettled(disconnects);
    this.logger.log('All Redis connections closed');
  }
}

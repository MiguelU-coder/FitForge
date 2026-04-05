// src/shared/redis.service.ts
import { Injectable, OnModuleDestroy, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { EnvConfig } from '../config/env.validation';

export enum RedisDb {
  CACHE = 0,
  SESSIONS = 0,
  QUEUES = 0,
  RATE_LIMIT = 0,
}

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;

  constructor(private readonly config: ConfigService<EnvConfig, true>) {}

  getClient(_db: RedisDb = RedisDb.CACHE): Redis {
    if (!this.client) {
      this.client = new Redis(this.config.get('REDIS_URL'), {
        maxRetriesPerRequest: null,
        retryStrategy: (times): number => Math.min(times * 100, 3000),
        keepAlive: 10000, // Previene cierres por inactividad (ECONNRESET)
        lazyConnect: false,
        enableReadyCheck: true,
        connectTimeout: 5000,
        commandTimeout: 3000,
      });

      this.client.on('connect', () => this.logger.log(`✅ Redis single-client (DB0) connected`));
      this.client.on('error', (err: Error) =>
        this.logger.error(`❌ Redis connection error: ${err.message}`),
      );
    }
    return this.client;
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

  async onModuleInit(): Promise<void> {
    const client = this.getClient();
    try {
      // Verificar política de desalojo (Eviction Policy)
      const config = (await client.config('GET', 'maxmemory-policy')) as string[];
      if (config && config.length >= 2 && config[1] !== 'noeviction') {
        this.logger.warn(
          `⚠️  IMPORTANT! Redis eviction policy is "${config[1]}". It should be "noeviction" for BullMQ stability.`,
        );
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.debug(`Could not check Redis config (likely a managed service without CONFIG access): ${message}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      await this.client.quit();
    }
    this.logger.log('Redis connection closed');
  }
}

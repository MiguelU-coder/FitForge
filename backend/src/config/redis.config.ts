// FitForge uses a single Redis database (DB 0) with prefixes for:
//   - Cache general
//   - Sessions
//   - BullMQ queues
//   - Rate limiting
//
// This is necessary because many cloud providers (like Render Key-Value) do not
// support the SELECT command for multiple databases.
//
// Usage:
//   const redis = this.config.get<RedisConfig>('redis')!;
//   const client = new Redis(redis.url);

import { registerAs } from '@nestjs/config';

export interface RedisDb {
  CACHE: 0;
  SESSIONS: 0;
  QUEUES: 0;
  RATE_LIMIT: 0;
}

export const REDIS_DB: RedisDb = {
  CACHE: 0,
  SESSIONS: 0,
  QUEUES: 0,
  RATE_LIMIT: 0,
} as const;

export interface RedisTtl {
  cache: number; // TTL cache general (segundos)
  recommendation: number; // TTL sugerencias IA por ejercicio
  session: number; // TTL blacklist refresh token (= vida del RT)
  accessToken: number; // TTL blacklist access token  (= vida del AT)
  rateLimit: number; // Ventana rate limiting
}

export interface RedisConfig {
  url: string;
  host: string;
  port: number;
  password: string | undefined;
  ttl: RedisTtl;
}

export default registerAs('redis', (): RedisConfig => {
  const url = process.env['REDIS_URL'] ?? 'redis://localhost:6379';

  // Parsear host/port/password desde la URL
  let host = 'localhost';
  let port = 6379;
  let password: string | undefined;

  try {
    const parsed = new URL(url);
    host = parsed.hostname;
    port = parseInt(parsed.port || '6379', 10);
    password = parsed.password || undefined;
  } catch {
    // URL inválida — env.validation.ts ya debería haber fallado antes
  }

  return {
    url,
    host,
    port,
    password,
    ttl: {
      cache: parseInt(process.env['REDIS_TTL_CACHE_S'] ?? '3600', 10), // 1h
      recommendation: parseInt(process.env['REDIS_TTL_RECOMMENDATION_S'] ?? '3600', 10), // 1h
      session: parseInt(process.env['REDIS_TTL_SESSION_S'] ?? '604800', 10), // 7d
      accessToken: parseInt(process.env['REDIS_TTL_ACCESS_TOKEN_S'] ?? '900', 10), // 15m
      rateLimit: parseInt(process.env['REDIS_TTL_RATE_LIMIT_S'] ?? '60', 10), // 1min
    },
  };
});

// src/config/env.validation.ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  // Transformación de PORT: Maneja el string que viene de process.env
  PORT: z
    .preprocess((val) => val ?? '3000', z.string()) // Asegura un valor inicial para transformar
    .transform(Number)
    .pipe(z.number().int().min(1).max(65535)),

  // Database
  DATABASE_URL: z.string().url(),
  DATABASE_REPLICA_URL: z.string().url().optional(),

  // Redis
  REDIS_URL: z.string().min(1),

  // JWT - Seguridad aumentada: Validar que no sean strings genéricos
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z
    .string()
    .min(64, 'JWT_REFRESH_SECRET must be at least 64 characters (512 bits)'),
  SUPABASE_JWT_SECRET: z.string().optional(),
  SUPABASE_URL: z.string().url().optional(),
  JWT_ACCESS_EXPIRES: z.string().default('15m'),
  JWT_REFRESH_EXPIRES: z.string().default('7d'),

  // Argon2 - Mejor manejo de transformación
  ARGON2_MEMORY: z.coerce.number().int().min(8192).default(65536),
  ARGON2_ITERATIONS: z.coerce.number().int().min(1).default(3),
  ARGON2_PARALLELISM: z.coerce.number().int().min(1).default(1),

  // CORS - Transformar string separado por comas en Array (opcional pero recomendado)
  CORS_ORIGINS: z
    .string()
    .min(1)
    .transform((val) => val.split(',')),

  // AI Service
  AI_SERVICE_URL: z.string().url(),
  AI_COACH_URL: z.string().url().optional(),
  AI_SERVICE_SECRET: z.string().min(32),
  AI_SERVICE_TIMEOUT_MS: z.coerce.number().default(5000),

  // Throttling
  THROTTLE_GLOBAL_TTL_MS: z.coerce.number().default(60000),
  THROTTLE_GLOBAL_LIMIT: z.coerce.number().default(100),
  THROTTLE_AUTH_TTL_MS: z.coerce.number().default(300000),
  THROTTLE_AUTH_LIMIT: z.coerce.number().default(5),

  // Storage
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().default('us-east-1'),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),
  S3_ENDPOINT: z.string().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    // Usamos console.error para que resalte en logs de CI/CD
    console.error('❌ Invalid environment variables:');

    result.error.issues.forEach((issue) => {
      console.error(`  • ${issue.path.join('.')}: ${issue.message}`);
    });

    process.exit(1);
  }

  return result.data;
}

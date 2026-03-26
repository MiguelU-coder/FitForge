// src/config/app.config.ts
//
// Configuración general de la aplicación.
// Agrupa variables que no pertenecen a JWT, DB o Redis.

import { registerAs } from '@nestjs/config';

export interface AppConfig {
  nodeEnv: 'development' | 'test' | 'production';
  port: number;
  apiPrefix: string;
  corsOrigins: string[];
  // AI microservice
  aiServiceUrl: string;
  aiServiceSecret: string;
  aiServiceTimeout: number;
  // Storage S3
  s3Bucket: string | undefined;
  s3Region: string;
  s3Endpoint: string | undefined; // MinIO local
}

export default registerAs('app', (): AppConfig => {
  const nodeEnv = (process.env['NODE_ENV'] ?? 'development') as AppConfig['nodeEnv'];

  return {
    nodeEnv,
    port: parseInt(process.env['PORT'] ?? '3000', 10),
    apiPrefix: 'api/v1',

    corsOrigins: (process.env['CORS_ORIGINS'] ?? 'http://localhost:3001')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean),

    aiServiceUrl: process.env['AI_SERVICE_URL'] ?? 'http://localhost:8000',
    aiServiceSecret: process.env['AI_SERVICE_SECRET'] ?? '',
    aiServiceTimeout: parseInt(process.env['AI_SERVICE_TIMEOUT_MS'] ?? '5000', 10),

    s3Bucket: process.env['S3_BUCKET'] || undefined,
    s3Region: process.env['S3_REGION'] ?? 'us-east-1',
    s3Endpoint: process.env['S3_ENDPOINT'] || undefined,
  };
});

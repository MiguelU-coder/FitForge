// src/main.ts
import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
    // Logger estructurado — en producción usar Pino
    logger:
      process.env['NODE_ENV'] === 'production'
        ? ['error', 'warn', 'log']
        : ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get((await import('@nestjs/config')).ConfigService);

  // ── 1. Helmet — HTTP Security Headers ──────────────────────────────────────
  app.use(
    helmet({
      // Permite cargar assets propios del frontend
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      // HSTS — solo HTTPS en producción
      hsts:
        process.env['NODE_ENV'] === 'production'
          ? { maxAge: 31_536_000, includeSubDomains: true, preload: true }
          : false,
      // No revelar tecnología backend
      hidePoweredBy: true,
      // Evitar clickjacking
      frameguard: { action: 'deny' },
    }),
  );

  // ── 2. CORS ────────────────────────────────────────────────────────────────
  const corsValue = configService.get<string | string[]>('CORS_ORIGINS', []);
  const allowedOrigins = Array.isArray(corsValue)
    ? corsValue
    : corsValue
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean);

  console.log(`[CORS CONFIG] Allowed origins: ${allowedOrigins.join(', ')}`);

  app.enableCors({
    origin: (origin, callback) => {
      // console.log(`[CORS REQUEST] Trying origin: ${origin}`);
      // Permitir requests sin origin (mobile apps, Postman en dev)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.error(`[CORS REJECTED] Origin ${origin} not in ${allowedOrigins.join(', ')}`);
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    exposedHeaders: ['X-Request-ID'],
    credentials: true,
    maxAge: 600, // Preflight cache 10 min
  });

  // ── 2.5 Request Debugger ───────────────────────────────────────────────────
  app.use((req: any, res: any, next: any) => {
    console.log(`\n[INCOMING REQUEST] ${req.method} ${req.url}`);
    console.log(`[AUTH HEADER] ${req.headers.authorization ? req.headers.authorization.substring(0, 30) + '...' : 'Missing'}`);
    next();
  });

  // ── 3. Global prefix ────────────────────────────────────────────────────────
  app.setGlobalPrefix('api/v1', {
    // Excluir health check y rutas públicas de payment/checkout del prefix
    exclude: ['/health', '/', '/payment/(.*)', '/c/(.*)'],
  });

  // ── 4. Global validation pipe ────────────────────────────────────────────────
  // Complementa ZodValidationPipe para class-validator si se usa en algún lugar
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip propiedades no declaradas
      forbidNonWhitelisted: false, // No lanzar error (Zod ya lo maneja)
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ── 5. Graceful shutdown ────────────────────────────────────────────────────
  app.enableShutdownHooks();

  // ── 6. Health check endpoint ─────────────────────────────────────────────────
  // Simple health check para Docker y load balancers
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/health', (_req: unknown, res: { json: (d: unknown) => void }) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port, '0.0.0.0');

  console.log(`\n🚀 FitForge API running on: http://localhost:${port}/api/v1`);
  console.log(`   Health check: http://localhost:${port}/health`);
  console.log(`   Environment: ${process.env['NODE_ENV'] ?? 'development'}\n`);
}

bootstrap().catch((err: Error) => {
  console.error('❌ Fatal error during bootstrap:', err);
  process.exit(1);
});

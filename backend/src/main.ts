// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { SecurityHeadersInterceptor } from './common/interceptors/security-headers.interceptor';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
    logger:
      process.env['NODE_ENV'] === 'production'
        ? ['error', 'warn', 'log']
        : ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get((await import('@nestjs/config')).ConfigService);
  const isProduction = process.env['NODE_ENV'] === 'production';

  // ── 0. Request Size Limits ─────────────────────────────────────────────
  // Previene ataques de tamaño excesivo (DoS via payload grande)
  app.use((req: any, res: any, next: any) => {
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    const maxBodySize = 100 * 1024; // 100KB para JSON
    if (contentLength > maxBodySize) {
      return res.status(413).json({
        success: false,
        message: 'Payload too large',
      });
    }
    next();
  });

  // ── 1. Helmet — HTTP Security Headers más estrictas ───────────────────
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          frameAncestors: ["'none'"],
          upgradeInsecureRequests: isProduction ? [] : null,
        },
      },
      hsts: isProduction ? { maxAge: 31_536_000, includeSubDomains: true, preload: true } : false,
      hidePoweredBy: true,
      frameguard: { action: 'deny' },
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginEmbedderPolicy: isProduction ? { policy: 'require-corp' } : false,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    }),
  );

  // ── 2. CORS más estricto ───────────────────────────────────────────────
  const corsValue = configService.get<string | string[]>('CORS_ORIGINS', []);
  const allowedOrigins = Array.isArray(corsValue)
    ? corsValue
    : corsValue
        .split(',')
        .map((o: string) => o.trim())
        .filter(Boolean);

  console.log(`[CORS CONFIG] Allowed origins: ${allowedOrigins.join(', ')}`);

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.error(`[CORS REJECTED] Origin ${origin} not in ${allowedOrigins.join(', ')}`);
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-Client-Version'],
    exposedHeaders: ['X-Request-ID'],
    credentials: true,
    maxAge: 600,
    preflightContinue: false,
  });

  // ── 3. Request Timeout para prevenir recursos agotados ───────────────
  const requestTimeout = 30_000; // 30 segundos
  app.use((req: any, res: any, next: any) => {
    req.setTimeout(requestTimeout, () => {
      res.status(408).json({
        success: false,
        message: 'Request timeout',
      });
    });
    next();
  });

  // ── 4. Request ID para tracking y IP real (proxy support) ───────────────
  app.use((req: any, res: any, next: any) => {
    const requestId = req.headers['x-request-id'] || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    req.headers['x-request-id'] = requestId;
    res.setHeader('X-Request-ID', requestId);
    
    // Extraer IP real considerando proxies (Cloudflare, Nginx, etc)
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
      req.realIp = forwardedFor.split(',')[0].trim();
    } else if (req.headers['x-real-ip']) {
      req.realIp = req.headers['x-real-ip'];
    } else {
      req.realIp = req.ip || req.connection?.remoteAddress || 'unknown';
    }
    req.headers['x-real-ip'] = req.realIp;
    
    next();
  });

  // ── 5. Global prefix ───────────────────────────────────────────────────
  app.setGlobalPrefix('api/v1', {
    exclude: ['/health', '/', '/payment/(.*)', '/c/(.*)'],
  });

  // ── 6. Global validation pipe ─────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ── 7. Security Headers Interceptor ───────────────────────────────────
  app.useGlobalInterceptors(new SecurityHeadersInterceptor());

  // ── 8. Graceful shutdown ───────────────────────────────────────────────
  app.enableShutdownHooks();

  // ── 9. Health check endpoint ───────────────────────────────────────────
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

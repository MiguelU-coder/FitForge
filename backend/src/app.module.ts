// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bullmq';
import { EventEmitterModule } from '@nestjs/event-emitter';

// Config factories
import { validateEnv } from './config/env.validation';
import jwtConfig from './config/jwt.config';
import databaseConfig from './config/database.config';
import redisConfig from './config/redis.config';

// Infraestructura
import { PrismaModule } from './database/prisma.module';
import { SharedModule } from './shared/shared.module';
import { JobsModule } from './jobs/jobs.module';

// Feature modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ExercisesModule } from './modules/excercises/exercises.module';
import { WorkoutModule } from './modules/workout/workout.module';
import { SetsModule } from './modules/sets/sets.module';
import { ProgressModule } from './modules/progress/progress.module';
import { AiBridgeModule } from './modules/ai-bridge/ai-bridge.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { ProgramsModule } from './modules/programs/programs.module';
import { EventsModule } from './modules/events/events.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { BillingModule } from './modules/billing/billing.module';
import { StripeModule } from './modules/stripe/stripe.module';
import { AdminModule } from './modules/admin/admin.module';
import { EmailModule } from './modules/email/email.module';
import { SupportModule } from './modules/support/support.module';
import { AuditModule } from './modules/audit/audit.module';

// Guards, filters, interceptors
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { GlobalExceptionFilter } from './common/pipes/zod-validation.pipe';
import {
  TransformInterceptor,
  LoggingInterceptor,
} from './common/interceptors/transform.interceptor';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { AppController } from './app.controller';

@Module({
  controllers: [AppController],
  imports: [
    // ── Event Emitter ───────────────────────────────────────────────────────
    EventEmitterModule.forRoot(),

    // ── Configuración global ──────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      load: [jwtConfig, databaseConfig, redisConfig],
      cache: true,
    }),

    // ── Rate limiting ─────────────────────────────────────────────────────
    ThrottlerModule.forRoot([{ name: 'global', ttl: 60_000, limit: 100 }]),

    // ── BullMQ — conexión global ──────────────────────────────────────────
    BullModule.forRootAsync({
      useFactory: () => {
        const url = process.env['REDIS_URL'] ?? 'redis://localhost:6379';
        const parsed = new URL(url);
        return {
          connection: {
            host: parsed.hostname,
            port: parseInt(parsed.port || '6379', 10),
            password: parsed.password || undefined,
            db: 2,
          },
          defaultJobOptions: {
            removeOnComplete: { count: 1000 },
            removeOnFail: { count: 500 },
            attempts: 3,
            backoff: { type: 'exponential', delay: 1000 },
          },
        };
      },
    }),

    // ── Infraestructura (globales) ────────────────────────────────────────
    PrismaModule,
    SharedModule,
    JobsModule,

    // ── Features ─────────────────────────────────────────────────────────
    AuthModule,
    UsersModule,
    ExercisesModule,
    WorkoutModule,
    SetsModule,
    ProgressModule,
    AiBridgeModule,
    AnalyticsModule,
    ProgramsModule,
    EventsModule,
    OrganizationsModule,
    BillingModule,
    StripeModule,
    AdminModule,
    EmailModule,
    SupportModule,
    AuditModule,
  ],

  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}

// src/database/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'error' },
        { emit: 'stdout', level: 'warn' },
      ],
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('✅ Database connected');

      // Log slow queries (>500ms) en desarrollo
      if (process.env.NODE_ENV === 'development') {
        // @ts-expect-error: Prisma event typing
        this.$on('query', (e: { query: string; duration: number }) => {
          if (e.duration > 500) {
            this.logger.warn(`⚠️  Slow query (${e.duration}ms): ${e.query}`);
          }
        });
      }
    } catch (error) {
      this.logger.error('❌ Database connection failed', error);
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('Database disconnected');
  }

  // Helper: transacción con retry automático
  async withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 100): Promise<T> {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error: unknown) {
        const isRetryable =
          error instanceof Error &&
          (error.message.includes('deadlock') || error.message.includes('connection'));

        if (i === retries - 1 || !isRetryable) throw error;
        await new Promise((r) => setTimeout(r, delay * Math.pow(2, i)));
      }
    }
    throw new Error('Max retries reached');
  }
}

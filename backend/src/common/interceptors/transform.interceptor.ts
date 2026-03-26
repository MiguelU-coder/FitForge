// src/common/interceptors/transform.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  meta?: Record<string, unknown>;
}

/**
 * TransformInterceptor — envuelve todas las respuestas en formato estándar.
 *
 * Si el handler retorna { message, data }, lo estructura correctamente.
 * Si retorna cualquier otro objeto, lo coloca en `data`.
 *
 * Output:
 * {
 *   "success": true,
 *   "data": { ... },
 *   "message": "...",
 *   "meta": { ... }
 * }
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((value: unknown) => {
        if (value === null || value === undefined) {
          return { success: true };
        }

        // Si el handler ya retornó en formato { message, data, meta }
        if (typeof value === 'object' && value !== null) {
          const v = value as Record<string, unknown>;
          if ('data' in v || 'message' in v) {
            return {
              success: true,
              data: v['data'] as T,
              message: v['message'] as string | undefined,
              meta: v['meta'] as Record<string, unknown> | undefined,
            };
          }
        }

        // Default: envolver en data
        return { success: true, data: value as T };
      }),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// src/common/interceptors/logging.interceptor.ts
import {
  Injectable as I2,
  NestInterceptor as NI2,
  ExecutionContext as EC2,
  CallHandler as CH2,
  Logger as L2,
} from '@nestjs/common';
import { Observable as Obs2 } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

@I2()
export class LoggingInterceptor implements NI2 {
  private readonly logger = new L2('HTTP');

  intercept(context: EC2, next: CH2): Obs2<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const { method, url } = req;
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const ms = Date.now() - start;
          const status = context.switchToHttp().getResponse<{ statusCode: number }>().statusCode;
          this.logger.log(`${method} ${url} ${status} — ${ms}ms`);
        },
        error: (err: Error) => {
          const ms = Date.now() - start;
          this.logger.warn(`${method} ${url} ERROR — ${ms}ms: ${err.message}`);
        },
      }),
    );
  }
}

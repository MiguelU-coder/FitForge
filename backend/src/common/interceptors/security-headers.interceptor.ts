// src/common/interceptors/security-headers.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class SecurityHeadersInterceptor implements NestInterceptor {
  private readonly logger = new Logger(SecurityHeadersInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          this.logSecurityEvent(request, response, duration, 'SUCCESS');
        },
        error: (error: Error) => {
          const duration = Date.now() - startTime;
          this.logSecurityEvent(request, response, duration, 'ERROR', error.message);
        },
      }),
    );
  }

  private logSecurityEvent(
    request: any,
    response: any,
    duration: number,
    status: 'SUCCESS' | 'ERROR',
    errorMessage?: string,
  ): void {
    const logData = {
      timestamp: new Date().toISOString(),
      method: request.method,
      url: request.url,
      statusCode: response.statusCode,
      duration: `${duration}ms`,
      ip: request.ip || request.connection?.remoteAddress,
      userAgent: request.headers['user-agent'],
      requestId: request.headers['x-request-id'],
      status,
      ...(errorMessage && { error: errorMessage }),
    };

    if (status === 'ERROR') {
      this.logger.warn(`[SECURITY] ${JSON.stringify(logData)}`);
    } else {
      this.logger.debug(`[REQUEST] ${JSON.stringify(logData)}`);
    }
  }
}

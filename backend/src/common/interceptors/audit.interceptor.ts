import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  HttpException,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { AuditService } from '../../modules/audit/audit.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { user, method, url, body, ip } = request;
    const userAgent = request.get('user-agent');

    // Only log write operations (POST, PUT, DELETE, PATCH)
    const isWriteOperation = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);
    const isAdmin =
      user &&
      (user.role === UserRole.GLOBAL_ADMIN ||
        user.role === UserRole.ORG_ADMIN ||
        user.isGlobalAdmin);

    if (isWriteOperation && isAdmin) {
      return next.handle().pipe(
        tap((response) => {
          // No longer logging successful 2xx operations to keep the trail focused on errors/threats
          // unless you want to keep track of specific critical actions
        }),
        catchError((error) => {
          const status = error instanceof HttpException ? error.getStatus() : 500;
          this.logAction(request, error, status, true);
          return throwError(() => error);
        }),
      );
    }

    return next.handle();
  }

  private async logAction(request: any, response: any, statusCode: number, isError: boolean) {
    const { user, method, url, body, ip } = request;
    const userAgent = request.get('user-agent');

    try {
      await this.auditService.logAction(
        user.id,
        `${method} ${url}`,
        this.extractEntityType(url),
        this.extractEntityId(url, response),
        this.sanitizePayload(body),
        ip,
        userAgent,
        statusCode,
        isError,
      );
    } catch (err) {
      this.logger.error('Audit logging failed', (err as Error).stack);
    }
  }

  private extractEntityType(url: string): string {
    const parts = url.split('/');
    // Return the main resource name (e.g., organizations, users, plans)
    return parts[2] || 'unknown';
  }

  private extractEntityId(url: string, response: any): string | undefined {
    // Try to get ID from URL or response
    const parts = url.split('/');
    if (parts.length > 3) return parts[3];
    return response?.id || response?.data?.id;
  }

  private sanitizePayload(body: any): any {
    if (!body) return null;
    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'passwordHash'];
    sensitiveFields.forEach((field) => {
      if (field in sanitized) sanitized[field] = '[REDACTED]';
    });
    return sanitized;
  }
}

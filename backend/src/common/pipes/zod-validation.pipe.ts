// src/common/pipes/zod-validation.pipe.ts
import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { ZodSchema, ZodError } from 'zod';

/**
 * ZodValidationPipe — valida y transforma el body con un schema Zod.
 *
 * Uso:
 *   @Body(new ZodValidationPipe(MySchema)) dto: MyDto
 */
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown): unknown {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      const errors = this.formatErrors(result.error);
      throw new BadRequestException({
        message: 'Validation failed',
        errors,
      });
    }

    return result.data;
  }

  private formatErrors(error: ZodError): Record<string, string[]> {
    return error.errors.reduce(
      (acc, err) => {
        const path = err.path.join('.') || 'root';
        if (!acc[path]) acc[path] = [];
        acc[path].push(err.message);
        return acc;
      },
      {} as Record<string, string[]>,
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// src/common/filters/global-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

/**
 * GlobalExceptionFilter — captura y formatea todos los errores.
 * Incluye manejo específico de errores de Prisma.
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, message, errors } = this.resolveException(exception);

    // Log errores inesperados (5xx)
    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} → ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json({
      statusCode: status,
      message,
      errors: errors ?? undefined,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }

  private resolveException(exception: unknown): {
    status: number;
    message: string;
    errors?: unknown;
  } {
    // NestJS HttpException
    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      if (typeof res === 'object' && res !== null) {
        const obj = res as Record<string, unknown>;
        return {
          status: exception.getStatus(),
          message: (obj['message'] as string) ?? exception.message,
          errors: obj['errors'],
        };
      }
      return {
        status: exception.getStatus(),
        message: exception.message,
      };
    }

    // Prisma — unique constraint violation
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        const fields = (exception.meta?.['target'] as string[]) ?? [];
        return {
          status: HttpStatus.CONFLICT,
          message: `Duplicate value for: ${fields.join(', ')}`,
        };
      }
      if (exception.code === 'P2025') {
        return {
          status: HttpStatus.NOT_FOUND,
          message: 'Record not found',
        };
      }
    }

    // Error genérico
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    };
  }
}

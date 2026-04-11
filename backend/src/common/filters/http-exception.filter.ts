// src/common/filters/http-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();
    
    let message: string;
    let errors: Record<string, unknown> | undefined;

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const resp = exceptionResponse as Record<string, unknown>;
      message = (resp.message as string) || exception.message;
      if (resp.errors) {
        errors = resp.errors as Record<string, unknown>;
      }
    } else {
      message = exception.message;
    }

    const responseBody: Record<string, unknown> = {
      success: false,
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
    };

    if (errors) {
      responseBody.errors = errors;
    }

    if (status === HttpStatus.FORBIDDEN) {
      this.logger.warn(`[FORBIDDEN] ${request.method} ${request.url} - User attempted unauthorized access`);
    } else if (status === HttpStatus.UNAUTHORIZED) {
      this.logger.warn(`[UNAUTHORIZED] ${request.method} ${request.url} - Invalid or missing token`);
    } else if (status >= HttpStatus.BAD_REQUEST && status < HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.warn(`[CLIENT ERROR] ${request.method} ${request.url} - ${status}: ${message}`);
    }

    response.status(status).json(responseBody);
  }
}
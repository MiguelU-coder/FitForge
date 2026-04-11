// src/common/guards/security.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class SecurityGuard implements CanActivate {
  private readonly logger = new Logger(SecurityGuard.name);

  private readonly forbiddenPatterns = [
    /\.\.\//,           // Path traversal
    /\.\./,             // Path traversal shorthand
    /%2e%2e/i,          // URL encoded path traversal
    /%2e\./i,           // URL encoded path traversal
    /\/\.\./,           // Path traversal with slashes
    /<script/i,          // XSS attempt
    /javascript:/i,     // JavaScript protocol
    /on\w+=/i,          // Event handlers (onclick, onerror, etc)
    /<iframe/i,          // Iframe injection
    /<embed/i,          // Embed injection
    /<object/i,         // Object injection
    /eval\s*\(/i,       // Eval usage
    /expression\s*\(/i, // CSS expression
    /alert\s*\(/i,      // Alert popup
    /document\.cookie/i, // Cookie theft attempt
    /window\.location/i, // Location manipulation
  ];

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const { url, method, headers, query, body } = request;

    const healthPaths = ['/health', '/', '/healthcheck', '/ping'];
    if (healthPaths.some(path => url === path || url.startsWith(path + '?'))) {
      return true;
    }

    if (this.checkPathTraversal(url)) {
      this.logger.warn(`[SECURITY] Path traversal attempt detected: ${url}`);
      throw new ForbiddenException('Invalid request path');
    }

    if (this.checkXSSAttempt(url)) {
      this.logger.warn(`[SECURITY] XSS attempt detected in URL: ${url}`);
      throw new ForbiddenException('Invalid characters in request');
    }

    if (this.checkSuspiciousHeaders(headers)) {
      this.logger.warn(`[SECURITY] Suspicious headers detected`);
      throw new ForbiddenException('Invalid headers');
    }

    if (this.checkQueryInjection(query)) {
      this.logger.warn(`[SECURITY] SQL injection attempt in query: ${JSON.stringify(query)}`);
      throw new ForbiddenException('Invalid query parameters');
    }

    if (this.checkBodyInjection(body)) {
      this.logger.warn(`[SECURITY] Injection attempt in body`);
      throw new ForbiddenException('Invalid request body');
    }

    if (method === 'TRACE' || method === 'CONNECT') {
      this.logger.warn(`[SECURITY] Blocked dangerous method: ${method}`);
      throw new ForbiddenException('Method not allowed');
    }

    return true;
  }

  private checkPathTraversal(url: string): boolean {
    return this.forbiddenPatterns.slice(0, 5).some(pattern => pattern.test(url));
  }

  private checkXSSAttempt(url: string): boolean {
    return this.forbiddenPatterns.slice(5, 12).some(pattern => pattern.test(url));
  }

  private checkSuspiciousHeaders(headers: Record<string, string | string[] | undefined>): boolean {
    const suspiciousHeaders = [
      'x-forwarded-for',
      'x-real-ip',
    ];

    for (const header of suspiciousHeaders) {
      const value = headers[header];
      if (value && typeof value === 'string') {
        if (value.includes(',') && value.split(',').length > 10) {
          return true;
        }
      }
    }

    return false;
  }

  private checkQueryInjection(query: Record<string, unknown>): boolean {
    const sqlKeywords = [
      'union',
      'select',
      'insert',
      'update',
      'delete',
      'drop',
      'create',
      'alter',
      'exec',
      'execute',
      'script',
      '--',
      ';--',
      '/*',
      '*/',
      '@@',
      'char(',
      'nchar(',
      'varchar(',
      'nvarchar(',
      'alter',
      'begin',
      'cast(',
      'cursor',
      'declare',
      'delete',
      'drop',
      'end',
      'exec(',
      'execute(',
      'fetch',
      'insert',
      'kill',
      'open',
      'select',
      'sys',
      'sysobjects',
      'syscolumns',
      'table',
      'update',
    ];

    const checkValue = (value: unknown): boolean => {
      if (typeof value === 'string') {
        const lower = value.toLowerCase();
        return sqlKeywords.some(keyword => lower.includes(keyword));
      }
      if (typeof value === 'object' && value !== null) {
        return Object.values(value).some(checkValue);
      }
      return false;
    };

    return Object.values(query).some(checkValue);
  }

  private checkBodyInjection(body: unknown): boolean {
    if (!body || typeof body !== 'object') {
      return false;
    }

    const checkValue = (value: unknown): boolean => {
      if (typeof value === 'string') {
        return this.forbiddenPatterns.some(pattern => pattern.test(value));
      }
      if (Array.isArray(value)) {
        return value.some(checkValue);
      }
      if (typeof value === 'object' && value !== null) {
        return Object.values(value).some(checkValue);
      }
      return false;
    };

    return checkValue(body);
  }
}
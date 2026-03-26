// src/common/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthUser } from '../../modules/auth/strategies/jwt.strategy';

/**
 * @CurrentUser() — Inyecta el usuario autenticado desde el request.
 *
 * Uso básico — objeto completo:
 *   async myEndpoint(@CurrentUser() user: AuthUser) { ... }
 *
 * Uso con campo específico:
 *   async myEndpoint(@CurrentUser('id') userId: string) { ... }
 */
export const CurrentUser = createParamDecorator(
  (field: keyof AuthUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user: AuthUser }>();
    const user = request.user;
    return field ? user?.[field] : user;
  },
);

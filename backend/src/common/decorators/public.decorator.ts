// src/common/decorators/public.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * @Public() — Marca un endpoint como público (sin autenticación requerida).
 *
 * El JwtAuthGuard global lee este metadata antes de aplicar la verificación JWT.
 * Si el endpoint está marcado como público, el guard lo deja pasar sin token.
 *
 * Uso:
 *   @Public()
 *   @Post('register')
 *   async register(...) { ... }
 */
export const Public = (): MethodDecorator & ClassDecorator => SetMetadata(IS_PUBLIC_KEY, true);

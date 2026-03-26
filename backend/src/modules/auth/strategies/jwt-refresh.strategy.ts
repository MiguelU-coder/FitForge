// src/modules/auth/strategies/jwt-refresh.strategy.ts
//
// Strategy de Passport para validar el refresh token opaco.
//
// A diferencia del access token (JWT firmado), el refresh token es un
// string aleatorio de 128 chars hex guardado en la DB.
// Esta strategy NO usa passport-jwt — solo extrae el token del body
// y delega la validación completa a AuthService.refresh().
//
// Uso en el controller:
//   @UseGuards(AuthGuard('jwt-refresh'))
//   @Post('refresh')
//   async refresh(@Request() req) { ... }
//
// NOTA: Para el MVP usamos directamente AuthService.refresh() en el controller
// sin este guard, para mayor simplicidad. Esta strategy existe para cuando
// quieras agregar el guard explícito.

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { Request } from 'express';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private readonly authService: AuthService) {
    super();
  }

  async validate(req: Request): Promise<unknown> {
    // Extraer el refresh token del body
    const body = req.body as Record<string, unknown>;
    const refreshToken = body['refreshToken'];

    if (!refreshToken || typeof refreshToken !== 'string') {
      throw new UnauthorizedException('Refresh token is required');
    }

    // AuthService.refresh() valida contra DB + blacklist Redis
    // y devuelve el nuevo par de tokens si es válido
    try {
      return await this.authService.refresh(refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }
}

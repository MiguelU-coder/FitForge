// src/modules/auth/auth.controller.ts
import { Controller, Post, Body, HttpCode, HttpStatus, Headers } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import {
  RegisterSchema,
  LoginSchema,
  RefreshSchema,
  type RegisterDto,
  type LoginDto,
  type RefreshDto,
} from './dto/auth.dto';
import type { AuthUser } from './strategies/jwt.strategy';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ── POST /auth/register ──────────────────────────────────────────────────
  @Public()
  @Throttle({ default: { ttl: 60000, limit: 5 } }) // 5 registros/min por IP
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body(new ZodValidationPipe(RegisterSchema)) dto: RegisterDto,
  ): Promise<{ message: string; data: unknown }> {
    const result = await this.authService.register(dto);
    return {
      message: 'Account created successfully',
      data: result,
    };
  }

  // ── POST /auth/login ─────────────────────────────────────────────────────
  @Public()
  @Throttle({ default: { ttl: 300000, limit: 10 } }) // 10 intentos/5min por IP
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body(new ZodValidationPipe(LoginSchema)) dto: LoginDto,
  ): Promise<{ message: string; data: unknown }> {
    const result = await this.authService.login(dto);
    return {
      message: 'Login successful',
      data: result,
    };
  }

  // ── POST /auth/refresh ───────────────────────────────────────────────────
  @Public()
  @Throttle({ default: { ttl: 60000, limit: 30 } }) // 30 refreshes/min
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body(new ZodValidationPipe(RefreshSchema)) dto: RefreshDto,
  ): Promise<{ message: string; data: unknown }> {
    const result = await this.authService.refresh(dto.refreshToken);
    return {
      message: 'Token refreshed',
      data: result,
    };
  }

  // ── POST /auth/logout ────────────────────────────────────────────────────
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(RefreshSchema)) dto: RefreshDto,
    @Headers('authorization') authHeader?: string,
  ): Promise<{ message: string }> {
    // Extraer access token del header para blacklistear
    const accessToken = authHeader?.replace('Bearer ', '');

    await this.authService.logout(user.id, dto.refreshToken, accessToken);
    return { message: 'Logged out successfully' };
  }

  // ── POST /auth/logout-all ────────────────────────────────────────────────
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  async logoutAll(@CurrentUser() user: AuthUser): Promise<{ message: string }> {
    await this.authService.logoutAll(user.id);
    return { message: 'All sessions revoked' };
  }

  // ── GET /auth/me ─────────────────────────────────────────────────────────
  @Post('me')
  @HttpCode(HttpStatus.OK)
  async me(@CurrentUser() user: AuthUser): Promise<{ data: AuthUser }> {
    return { data: user };
  }
}

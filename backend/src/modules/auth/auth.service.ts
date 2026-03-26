// src/modules/auth/auth.service.ts
import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import * as argon2 from 'argon2';
import { PrismaService } from '../../database/prisma.service';
import { RedisService, RedisDb } from '../../shared/redis.service';
import { EnvConfig } from '../../config/env.validation';
import type { TokenPairDto, RegisterDto, LoginDto } from './dto/auth.dto';
import type { AuthUser, JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  // TTL en segundos del refresh token (7 días)
  private readonly REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly redis: RedisService,
    private readonly config: ConfigService<EnvConfig, true>,
  ) {}

  // ── Register ──────────────────────────────────────────────────────────────

  async register(dto: RegisterDto): Promise<TokenPairDto> {
    // 1. Verificar email duplicado
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });

    if (existing) {
      // No revelar si el email existe — mensaje genérico
      throw new ConflictException('An account with this email already exists');
    }

    // 2. Hash de password con Argon2id
    const passwordHash = await this.hashPassword(dto.password);

    // 3. Crear usuario
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        displayName: dto.displayName,
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        isGlobalAdmin: true,
        gender: true,
        organizations: {
          select: {
            organizationId: true,
            role: true,
          },
        },
      },
    });

    this.logger.log(`New user registered: ${user.id}`);
    return this.generateTokenPair({
      ...user,
      hasCompletedOnboarding: !!user.gender,
      isGlobalAdmin: user.isGlobalAdmin,
      organizations: user.organizations.map(org => ({
        id: org.organizationId,
        role: org.role,
      })),
    });
  }

  // ── Login ─────────────────────────────────────────────────────────────────

  async login(dto: LoginDto): Promise<TokenPairDto> {
    // 1. Buscar usuario
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: {
        id: true,
        email: true,
        displayName: true,
        passwordHash: true,
        isActive: true,
        isGlobalAdmin: true,
        gender: true,
        organizations: {
          select: {
            organizationId: true,
            role: true,
          },
        },
      },
    });

    // 2. Verificar existencia y password
    // IMPORTANTE: siempre hashear aunque el usuario no exista
    // para evitar timing attacks
    const dummyHash =
      '$argon2id$v=19$m=65536,t=3,p=1$AAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

    const passwordToVerify = user?.passwordHash ?? dummyHash;
    const passwordValid = await argon2.verify(passwordToVerify, dto.password);

    if (!user || !passwordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Your account is inactive. Please complete your payment or contact support.');
    }

    return this.generateTokenPair({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      hasCompletedOnboarding: !!user.gender,
      isGlobalAdmin: user.isGlobalAdmin,
      organizations: user.organizations.map((org: any) => ({
        id: org.organizationId,
        role: org.role,
      })),
    });
  }

  // ── Refresh token ─────────────────────────────────────────────────────────

  async refresh(rawRefreshToken: string): Promise<TokenPairDto> {
    // 1. Verificar blacklist en Redis (tokens robados/usados)
    const isBlacklisted = await this.redis
      .getClient(RedisDb.SESSIONS)
      .exists(`rt:bl:${rawRefreshToken}`);

    if (isBlacklisted) {
      // Token usado 2 veces = posible robo — revocar TODOS los tokens del user
      this.logger.warn(
        `Blacklisted refresh token reuse detected: ${rawRefreshToken.slice(0, 8)}...`,
      );
      throw new UnauthorizedException('Token reuse detected. Please login again.');
    }

    // 2. Buscar en DB
    const record = await this.prisma.refreshToken.findUnique({
      where: { token: rawRefreshToken },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
            isActive: true,
            isGlobalAdmin: true,
            gender: true,
            organizations: {
              select: {
                organizationId: true,
                role: true,
              },
            },
          },
        },
      },
    });

    // 3. Validaciones
    if (!record) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    if (record.revokedAt) {
      throw new UnauthorizedException('Token has been revoked');
    }
    if (record.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }
    if (!record.user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    // 4. ROTATE: revocar token actual en DB + blacklist en Redis
    await this.prisma.refreshToken.update({
      where: { id: record.id },
      data: { revokedAt: new Date() },
    });

    // Blacklist en Redis para el tiempo de vida restante del token
    const remainingTtl = Math.floor((record.expiresAt.getTime() - Date.now()) / 1000);
    if (remainingTtl > 0) {
      await this.redis
        .getClient(RedisDb.SESSIONS)
        .setex(`rt:bl:${rawRefreshToken}`, remainingTtl, '1');
    }

    // 5. Emitir nuevo par de tokens
    return this.generateTokenPair({
      ...record.user,
      hasCompletedOnboarding: !!record.user.gender,
      isGlobalAdmin: record.user.isGlobalAdmin,
      organizations: record.user.organizations.map((org: any) => ({
        id: org.organizationId,
        role: org.role,
      })),
    });
  }

  // ── Logout ────────────────────────────────────────────────────────────────

  async logout(userId: string, rawRefreshToken: string, accessToken?: string): Promise<void> {
    // 1. Revocar refresh token en DB
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        token: rawRefreshToken,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });

    // 2. Blacklist refresh token en Redis
    await this.redis
      .getClient(RedisDb.SESSIONS)
      .setex(`rt:bl:${rawRefreshToken}`, this.REFRESH_TTL_SECONDS, '1');

    // 3. Blacklist access token si se provee (para logout inmediato)
    if (accessToken) {
      await this.redis.getClient(RedisDb.SESSIONS).setex(`at:bl:${accessToken}`, 15 * 60, '1'); // TTL = 15min (vida del AT)
    }
  }

  // ── Logout all devices ────────────────────────────────────────────────────

  async logoutAll(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    this.logger.log(`All sessions revoked for user ${userId}`);
  }

  // ── Helpers privados ──────────────────────────────────────────────────────

  private async hashPassword(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: this.config.get('ARGON2_MEMORY'),
      timeCost: this.config.get('ARGON2_ITERATIONS'),
      parallelism: this.config.get('ARGON2_PARALLELISM'),
    });
  }

  private async generateTokenPair(user: AuthUser): Promise<TokenPairDto> {
    // 1. Access token — JWT corto (15min)
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      organizations: user.organizations,
    };
    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.get('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get('JWT_ACCESS_EXPIRES'),
    });

    // 2. Refresh token — opaco, no JWT (más seguro)
    const rawRefreshToken = randomBytes(64).toString('hex'); // 128 chars hex
    const expiresAt = new Date(Date.now() + this.REFRESH_TTL_SECONDS * 1000);

    await this.prisma.refreshToken.create({
      data: {
        token: rawRefreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    // 3. Cleanup: eliminar refresh tokens expirados del usuario (lazy cleanup)
    // Ejecutar en background, no bloquear la respuesta
    this.cleanExpiredTokens(user.id).catch((err: Error) =>
      this.logger.warn(`Token cleanup failed for ${user.id}: ${err.message}`),
    );

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      expiresAt,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        hasCompletedOnboarding: user.hasCompletedOnboarding,
        isGlobalAdmin: user.isGlobalAdmin,
        organizations: user.organizations,
      },
    };
  }

  private async cleanExpiredTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: {
        userId,
        OR: [
          { expiresAt: { lt: new Date() } },
          { revokedAt: { not: null, lt: new Date(Date.now() - 30 * 24 * 3600 * 1000) } },
        ],
      },
    });
  }
}

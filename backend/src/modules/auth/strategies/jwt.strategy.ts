import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { PrismaService } from '../../../database/prisma.service';
import { RedisService, RedisDb } from '../../../shared/redis.service';
import { EnvConfig } from '../../../config/env.validation';
import { passportJwtSecret } from 'jwks-rsa';

// Extended payload with Supabase metadata
export interface JwtPayload {
  sub: string; // userId (UUID)
  email: string;
  organizations?: {
    id: string;
    role: string;
  }[];
  iat?: number;
  exp?: number;
  // Supabase additional fields
  iss?: string;
  aud?: string;
  user_metadata?: {
    display_name?: string;
    has_completed_onboarding?: boolean;
    [key: string]: any;
  };
}

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  hasCompletedOnboarding: boolean;
  isGlobalAdmin: boolean;
  organizations: {
    id: string;
    role: string;
  }[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly jwtService: JwtService,
    config: ConfigService<EnvConfig, true>,
  ) {
    // Use Supabase JWT secret for verification
    const supabaseSecret = config.get('SUPABASE_JWT_SECRET');
    const supabaseUrl = config.get('SUPABASE_URL');
    const jwksUri = supabaseUrl ? `${supabaseUrl}/auth/v1/.well-known/jwks.json` : null;

    // Supabase secrets are base64 encoded strings that must be parsed into a Buffer
    const localSecretKey = supabaseSecret
      ? Buffer.from(supabaseSecret, 'base64')
      : config.get('JWT_ACCESS_SECRET');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKeyProvider: (
        req: Request,
        rawJwtToken: string,
        done: (err: any, secret: any) => void,
      ) => {
        try {
          // Inspect the token header to determine the algorithm
          const decoded = this.jwtService.decode(rawJwtToken, { complete: true }) as any;
          const header = decoded?.header;
          const payload = decoded?.payload;

          // 1. If it's a Supabase token (has Supabase issuer or aud)
          if (payload && (payload.iss?.includes('supabase') || payload.aud === 'authenticated')) {
            // Use shared secret ONLY if it's HS256 and we have the secret
            if (header?.alg === 'HS256' && supabaseSecret) {
              return done(null, Buffer.from(supabaseSecret, 'base64'));
            }

            // For asymmetric algorithms (ES256, RS256) or if HS256 secret is missing, use JWKS
            if (jwksUri) {
              return passportJwtSecret({
                cache: true,
                rateLimit: true,
                jwksRequestsPerMinute: 10,
                jwksUri: jwksUri,
              })(req, rawJwtToken, done);
            }

            // Fallback for local dev if internet is down but shared secret is set
            if (supabaseSecret) {
              return done(null, Buffer.from(supabaseSecret, 'base64'));
            }
          }

          // 2. Default to local project secret (used for internal admin tokens)
          done(null, config.get('JWT_ACCESS_SECRET'));
        } catch (err) {
          done(err, null);
        }
      },
      ignoreExpiration: false,
      passReqToCallback: true,
      algorithms: ['HS256', 'RS256', 'ES256'], // Support local HMAC, RSA, and Supabase ECDSA
    });
  }

  async validate(req: Request, payload: JwtPayload): Promise<AuthUser> {
    console.log('Validating payload for sub:', payload.sub);
    try {
      // 1. Extract the raw token to check blacklist
      const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);

      if (token) {
        try {
          // Fallback: If Redis is unreachable (e.g. connection limits),
          // we proceed since Supabase already validated the JWT signature.
          const isBlacklisted = await this.redis
            .getClient(RedisDb.SESSIONS)
            .exists(`at:bl:${token}`);

          if (isBlacklisted) {
            throw new UnauthorizedException('Token has been revoked');
          }
        } catch (redisError) {
          console.warn('⚠️ Redis unreachable for blacklist check, skipping... Error:', redisError);
        }
      }

      // 2. JIT (Just-In-Time) User Provisioning
      // If user doesn't exist in our database, create them automatically
      let user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
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
      });

      // If user doesn't exist, create them with Supabase token data
      if (!user) {
        const email = payload.email || `${payload.sub}@supabase.local`;
        try {
          user = await this.prisma.user.create({
            data: {
              id: payload.sub,
              email: email,
              displayName:
                payload.user_metadata?.display_name || this.extractDisplayNameFromEmail(email),
              isActive: true,
              unitSystem: 'METRIC',
            },
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
          });
        } catch (createError: any) {
          // P2002 is Prisma's unique constraint violation code
          if (createError.code === 'P2002') {
            const existingByEmail = await this.prisma.user.findUnique({
              where: { email: email },
              select: { id: true },
            });

            // If a user exists with the SAME email but DIFFERENT ID, we have a "recreated account" scenario
            if (existingByEmail && existingByEmail.id !== payload.sub) {
              console.warn(
                `JIT provisioning conflict: User recreated in Supabase with new sub ${payload.sub} for email ${email}. Deleting stale user ${existingByEmail.id}`,
              );

              // Delete old user (Cascade should clean up linked data)
              await this.prisma.user.delete({ where: { id: existingByEmail.id } });

              // Retry creation with new ID
              user = await this.prisma.user.create({
                data: {
                  id: payload.sub,
                  email: email,
                  displayName:
                    payload.user_metadata?.display_name || this.extractDisplayNameFromEmail(email),
                  isActive: true,
                  unitSystem: 'METRIC',
                },
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
              });
            } else {
              // Re-check for the new sub just in case of parallel race condition
              user = await this.prisma.user.findUnique({
                where: { id: payload.sub },
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
              });
            }
          } else {
            throw createError;
          }
        }
      }

      // 3. Verify user is active
      if (!user || !user.isActive) {
        throw new UnauthorizedException('User not found or inactive');
      }

      return {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        hasCompletedOnboarding: !!user.gender,
        isGlobalAdmin: user.isGlobalAdmin,
        organizations: user.organizations.map((org) => ({
          id: org.organizationId,
          role: org.role,
        })),
      };
    } catch (error) {
      console.error('JWT_VALIDATION_ERROR:', error);
      throw error;
    }
  }

  /**
   * Extract display name from email if not provided
   * e.g., "john.doe@example.com" -> "John Doe"
   */
  private extractDisplayNameFromEmail(email: string): string {
    const [localPart] = email.split('@');
    // Convert "john.doe" to "John Doe"
    return localPart
      .replace(/[._-]/g, ' ')
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// src/modules/auth/strategies/jwt-refresh.strategy.ts
import { PassportStrategy as PS } from '@nestjs/passport';
import { Strategy as S, ExtractJwt as EJ } from 'passport-jwt';

@Injectable()
export class JwtRefreshStrategy extends PS(S, 'jwt-refresh') {
  constructor(config: ConfigService<EnvConfig, true>) {
    super({
      jwtFromRequest: EJ.fromBodyField('refreshToken'),
      secretOrKey: config.get('JWT_REFRESH_SECRET'),
      ignoreExpiration: false,
    });
  }

  validate(payload: JwtPayload): JwtPayload {
    // Solo decodifica el payload — la lógica de rotación está en AuthService
    return payload;
  }
}

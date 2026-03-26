// src/config/jwt.config.ts
//
// Factory de configuración JWT — registrada como namespace 'jwt'.
// Access y refresh usan secrets DISTINTOS para que un token no pueda
// ser reutilizado en el endpoint contrario.
//
// Uso en un service:
//   constructor(private config: ConfigService) {}
//   const cfg = this.config.get<JwtConfig>('jwt')!;
//   await this.jwt.signAsync(payload, { secret: cfg.accessSecret, expiresIn: cfg.accessExpires });

import { registerAs } from '@nestjs/config';

export interface JwtConfig {
  accessSecret: string;
  refreshSecret: string;
  accessExpires: string; // e.g. "15m"
  refreshExpires: string; // e.g. "7d"
}

export default registerAs('jwt', (): JwtConfig => {
  const accessSecret = process.env['JWT_ACCESS_SECRET'] ?? '';
  const refreshSecret = process.env['JWT_REFRESH_SECRET'] ?? '';

  // Validaciones al arrancar — matan el proceso si fallan
  if (accessSecret.length < 64) {
    throw new Error(
      'JWT_ACCESS_SECRET must be at least 64 characters (512 bits).\n' +
        'Generate with: openssl rand -base64 64',
    );
  }
  if (refreshSecret.length < 64) {
    throw new Error(
      'JWT_REFRESH_SECRET must be at least 64 characters (512 bits).\n' +
        'Generate with: openssl rand -base64 64',
    );
  }
  if (accessSecret === refreshSecret) {
    throw new Error('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different values.');
  }

  return {
    accessSecret,
    refreshSecret,
    accessExpires: process.env['JWT_ACCESS_EXPIRES'] ?? '15m',
    refreshExpires: process.env['JWT_REFRESH_EXPIRES'] ?? '7d',
  };
});

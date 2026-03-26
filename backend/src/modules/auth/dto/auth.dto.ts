// src/modules/auth/dto/register.dto.ts
import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.string().email('Invalid email format').toLowerCase().max(255),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  displayName: z
    .string()
    .min(2, 'Display name must be at least 2 characters')
    .max(100, 'Display name too long')
    .trim(),
});

export type RegisterDto = z.infer<typeof RegisterSchema>;

// ─────────────────────────────────────────────────────────────────────────────

// src/modules/auth/dto/login.dto.ts
export const LoginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export type LoginDto = z.infer<typeof LoginSchema>;

// ─────────────────────────────────────────────────────────────────────────────

// src/modules/auth/dto/refresh.dto.ts
export const RefreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export type RefreshDto = z.infer<typeof RefreshSchema>;

// ─────────────────────────────────────────────────────────────────────────────

// src/modules/auth/dto/auth-response.dto.ts
export interface TokenPairDto {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  user: {
    id: string;
    email: string;
    displayName: string;
    hasCompletedOnboarding: boolean;
    isGlobalAdmin: boolean;
    organizations: {
      id: string;
      role: string;
    }[];
  };
}

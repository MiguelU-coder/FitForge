// src/types/auth.ts
// Port of auth_models.dart

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  hasCompletedOnboarding: boolean;
  weightUnit: string;
  heightUnit: string;
  defaultRestSeconds: number;
  heightCm?: number;
  gender?: string;
  dateOfBirth?: string;
  trainingLevel?: string;
  goalWeightKg?: number;
}

export interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

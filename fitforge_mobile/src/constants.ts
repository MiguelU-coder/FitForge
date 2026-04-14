// src/constants.ts
import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};

export const AppConstants = {
  // ── API URLs (from app.json extra → process.env → localhost fallback) ──
  baseUrl:            extra.BACKEND_API_URL          || process.env.EXPO_PUBLIC_BACKEND_API_URL       || 'http://localhost:3000/api/v1',
  aiMicroservicesUrl: extra.AI_MICROSERVICES_URL     || process.env.EXPO_PUBLIC_AI_MICROSERVICES_URL  || 'http://localhost:8000',
  aiCoachUrl:         extra.AI_COACH_URL             || process.env.EXPO_PUBLIC_AI_COACH_URL          || 'http://localhost:8001',

  // ── Supabase ──
  supabaseUrl:     extra.SUPABASE_URL               || process.env.EXPO_PUBLIC_SUPABASE_URL      || '',
  supabaseAnonKey: extra.SUPABASE_ANON_KEY           || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',

  // ── Timeouts ──
  connectTimeout: 30_000,
  receiveTimeout: 60_000,

  // ── Storage Keys ──
  kAccessToken:  'access_token',
  kRefreshToken: 'refresh_token',
  kUserId:       'user_id',
} as const;

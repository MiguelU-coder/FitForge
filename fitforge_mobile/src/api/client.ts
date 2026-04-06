// src/api/client.ts
// Central HTTP client with Supabase auth interceptor
// Port of api_client.dart

import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';
import { AppConstants } from '../constants';
import { supabase } from './supabase';

// Public paths that don't need auth tokens
const PUBLIC_PATHS = ['/auth/register', '/auth/login', '/auth/refresh'];

let isRefreshing = false;

function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: AppConstants.baseUrl,
    timeout: AppConstants.receiveTimeout,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  // ── Request interceptor: inject Supabase token ──
  client.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
    const path = config.url ?? '';
    if (PUBLIC_PATHS.some((p) => path.endsWith(p))) {
      return config;
    }

    let session = (await supabase.auth.getSession()).data.session;

    // Refresh if expired or expiring soon (< 60s)
    if (session) {
      const expiresAt = session.expires_at ?? 0;
      const expiresDate = new Date(expiresAt * 1000);
      const buffer = new Date(Date.now() + 60_000);
      if (expiresDate < buffer) {
        console.log('[ApiClient] Token expiring, refreshing...');
        const { data } = await supabase.auth.refreshSession();
        session = data.session;
      }
    }

    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }

    return config;
  });

  // ── Response interceptor: retry on 401 ──
  client.interceptors.response.use(
    (response) => {
      // Auto-unwrap FitForge standard { success: true, data: ... } wrapper
      if (response.data && typeof response.data === 'object' && 'data' in response.data) {
        response.data = response.data.data;
      }
      return response;
    },
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

      if (error.response?.status === 401 && !originalRequest._retry && !isRefreshing) {
        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const { data } = await supabase.auth.refreshSession();
          if (data.session) {
            originalRequest.headers.Authorization = `Bearer ${data.session.access_token}`;
            return client(originalRequest);
          } else {
            await supabase.auth.signOut();
          }
        } catch {
          // Refresh failed
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    },
  );

  return client;
}

export const apiClient = createApiClient();

// ── Helper to extract data from standard { success, data, message } responses ──
export function extractData<T>(response: { data: Record<string, unknown> }): T {
  const body = response.data;
  if (body && typeof body === 'object' && 'data' in body && body.data != null) {
    return body.data as T;
  }
  return body as T;
}

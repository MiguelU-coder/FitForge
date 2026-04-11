// src/api/client.ts
// Central HTTP client with Supabase auth interceptor
// Port of api_client.dart

import axios, {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosError,
} from "axios";
import { AppConstants } from "../constants";
import { supabase } from "./supabase";

// Public paths that don't need auth tokens
const PUBLIC_PATHS = ["/auth/register", "/auth/login", "/auth/refresh"];

let isRefreshing = false;

function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: AppConstants.baseUrl,
    timeout: AppConstants.receiveTimeout,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

  // ── Request interceptor: inject Supabase token ──
  client.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      const path = config.url ?? "";
      if (PUBLIC_PATHS.some((p) => path.endsWith(p))) {
        return config;
      }

      let session;
      try {
        session = (await supabase.auth.getSession()).data.session;
      } catch (err) {
        console.log("[ApiClient] Error getting session:", err);
        // Continue without session - will get 401
        return config;
      }

      // Refresh if expired or expiring soon (< 60s)
      if (session) {
        const expiresAt = session.expires_at ?? 0;
        const expiresDate = new Date(expiresAt * 1000);
        const buffer = new Date(Date.now() + 60_000);

        if (expiresDate < buffer) {
          console.log("[ApiClient] Token expiring, refreshing...");
          try {
            const { data, error } = await supabase.auth.refreshSession();
            if (error) {
              console.log("[ApiClient] Refresh error:", error.message);
              // Don't throw, continue with existing session or let 401 handle it
            } else {
              session = data.session;
            }
          } catch (refreshErr) {
            console.log("[ApiClient] Refresh exception:", refreshErr);
            // Continue - will get 401 if needed
          }
        }
      }

      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
      }

      return config;
    },
  );

  // ── Response interceptor: retry on 401 ──
  client.interceptors.response.use(
    (response) => {
      // Auto-unwrap FitForge standard { success: true, data: ... } wrapper
      if (
        response.data &&
        typeof response.data === "object" &&
        "data" in response.data
      ) {
        response.data = response.data.data;
      }
      return response;
    },
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean;
      };
      const path = originalRequest?.url ?? "";

      // Don't retry on auth errors if it's a refresh token issue
      if (
        error.response?.status === 401 &&
        !originalRequest._retry &&
        !isRefreshing
      ) {
        // Check if this is not already a refresh token request
        const isAuthRequest = path.includes("/auth/");

        if (!isAuthRequest) {
          originalRequest._retry = true;
          isRefreshing = true;

          try {
            // Step 1: Try to refresh the session
            const { data, error: refreshError } =
              await supabase.auth.refreshSession();

            if (refreshError || !data.session) {
              console.log(
                "[ApiClient] Refresh failed, signing out:",
                refreshError?.message,
              );
              await supabase.auth.signOut();
              return Promise.reject(new Error("SESSION_EXPIRED"));
            }

            // Step 2: Verify user still exists in Supabase (lightweight check)
            const { data: userData, error: userError } =
              await supabase.auth.getUser();
            if (userError || !userData.user) {
              console.log("[ApiClient] User deleted in Supabase, signing out");
              await supabase.auth.signOut();
              return Promise.reject(new Error("USER_DELETED"));
            }

            // Step 3: Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${data.session.access_token}`;
            return client(originalRequest);
          } catch (refreshErr) {
            console.log("[ApiClient] Refresh error:", refreshErr);
            await supabase.auth.signOut();
            return Promise.reject(new Error("SESSION_EXPIRED"));
          } finally {
            isRefreshing = false;
          }
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
  if (body && typeof body === "object" && "data" in body && body.data != null) {
    return body.data as T;
  }
  return body as T;
}

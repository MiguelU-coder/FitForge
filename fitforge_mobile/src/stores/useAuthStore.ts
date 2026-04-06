// src/stores/useAuthStore.ts
// Port of auth_provider.dart (Riverpod StateNotifier → Zustand)

import { create } from 'zustand';
import { supabase } from '../api/supabase';
import { apiClient } from '../api/client';
import type { AuthUser } from '../types/auth';
import type { Session, User, AuthError } from '@supabase/supabase-js';

interface AuthStore {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Record<string, unknown>) => Promise<void>;
  clearError: () => void;
  signInWithGoogle: () => Promise<void>;

  // Internal
  _updateUserFromSession: (session: Session) => void;
  _restoreSession: () => Promise<void>;
  _initAuthListener: () => void;
}

function parseUserFromSupabase(user: User): AuthUser {
  const meta = user.user_metadata ?? {};

  return {
    id: user.id,
    email: user.email ?? '',
    displayName: (meta.display_name as string) ?? 'User',
    hasCompletedOnboarding: (meta.has_completed_onboarding as boolean) ?? false,
    weightUnit: (meta.weightUnit as string) ?? 'kg',
    heightUnit: (meta.heightUnit as string) ?? 'cm',
    defaultRestSeconds: meta.defaultRestSeconds != null
      ? Number(meta.defaultRestSeconds)
      : 90,
    heightCm: meta.heightCm != null ? Number(meta.heightCm) : undefined,
    gender: meta.gender as string | undefined,
    dateOfBirth: meta.dateOfBirth as string | undefined,
    trainingLevel: meta.trainingLevel as string | undefined,
    goalWeightKg: meta.goalWeightKg != null ? Number(meta.goalWeightKg) : undefined,
  };
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,

  _updateUserFromSession: (session: Session) => {
    const user = parseUserFromSupabase(session.user);
    set({ user, isAuthenticated: true, isLoading: false });
  },

  _restoreSession: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      get()._updateUserFromSession(data.session);
    }
  },

  _initAuthListener: () => {
    supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        get()._updateUserFromSession(session);
      } else {
        set({ user: null, isAuthenticated: false });
      }
    });

    // Restore existing session on init
    get()._restoreSession();
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data.session) {
        get()._updateUserFromSession(data.session);
      }
    } catch (e) {
      const message = (e as AuthError)?.message ?? 'Error al iniciar sesión';
      set({ isLoading: false, error: message });
    }
  },

  register: async (email, password, displayName) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;

      if (data.user) {
        await supabase.auth.updateUser({
          data: {
            display_name: displayName,
            has_completed_onboarding: false,
          },
        });
      }

      if (data.session) {
        get()._updateUserFromSession(data.session);
      } else {
        set({
          isLoading: false,
          error: 'Por favor verifica tu correo electrónico',
        });
      }
    } catch (e) {
      const message = (e as AuthError)?.message ?? 'Error al registrarse';
      set({ isLoading: false, error: message });
    }
  },

  logout: async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // Clean local state even if server fails
    }
    set({ user: null, isAuthenticated: false, error: null });
  },

  updateProfile: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        set({ isLoading: false, error: 'No hay sesión activa' });
        return;
      }

      // 1. Update backend DB
      await apiClient.patch('/users/me', data);

      // 2. Update Supabase metadata
      const currentMeta = user.user_metadata ?? {};
      await supabase.auth.updateUser({
        data: { ...currentMeta, ...data },
      });

      // 3. Refresh session
      await supabase.auth.refreshSession();
      const { data: refreshed } = await supabase.auth.getSession();
      if (refreshed.session) {
        get()._updateUserFromSession(refreshed.session);
      } else {
        set({ isLoading: false });
      }
    } catch (e) {
      const message = (e as AuthError)?.message ?? 'Error al actualizar perfil';
      set({ isLoading: false, error: message });
    }
  },

  signInWithGoogle: async () => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: 'fitforge://callback' },
      });
      if (error) throw error;
    } catch (e) {
      const message = (e as AuthError)?.message ?? 'Error signing in with Google';
      set({ isLoading: false, error: message });
    }
  },

  clearError: () => set({ error: null }),
}));

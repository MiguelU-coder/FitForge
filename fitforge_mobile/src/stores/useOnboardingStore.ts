// src/stores/useOnboardingStore.ts
import { create } from 'zustand';
import { apiClient } from '../api/client';
import { supabase } from '../api/supabase';

export type Gender = 'MALE' | 'FEMALE' | 'NON_BINARY' | 'OTHER';
export type TrainingLevel = 'BEGINNER' | 'IRREGULAR' | 'MEDIUM' | 'ADVANCED';
export type UserGoal = 'LOSE_WEIGHT' | 'KEEP_FIT' | 'GET_STRONGER' | 'GAIN_MUSCLE_MASS';

export interface RoutinePreview {
  id: string;
  name: string;
  items: Array<{
    exerciseName: string;
    targetSets: number;
    targetReps: string;
    restSeconds: number;
  }>;
}

export interface GeneratedProgram {
  program: {
    id: string;
    name: string;
    daysPerWeek: number;
    split: string;
  };
  routines: RoutinePreview[];
  config: {
    sets: number;
    reps: string;
    rir: { min: number; max: number };
    restSeconds: number;
  };
}

interface OnboardingStore {
  // State
  currentStep: number;
  gender: Gender | null;
  trainingLevel: TrainingLevel | null;
  mainGoal: UserGoal | null;
  generatedProgram: GeneratedProgram | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setGender: (gender: Gender) => void;
  setTrainingLevel: (level: TrainingLevel) => void;
  setMainGoal: (goal: UserGoal) => void;
  savePreferences: () => Promise<void>;
  generateRoutine: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  reset: () => void;
}

const TOTAL_STEPS = 5;

export const useOnboardingStore = create<OnboardingStore>((set, get) => ({
  currentStep: 0,
  gender: null,
  trainingLevel: null,
  mainGoal: null,
  generatedProgram: null,
  isLoading: false,
  error: null,

  setStep: (step) => set({ currentStep: Math.max(0, Math.min(step, TOTAL_STEPS - 1)) }),

  nextStep: () => {
    const { currentStep } = get();
    if (currentStep < TOTAL_STEPS - 1) {
      set({ currentStep: currentStep + 1 });
    }
  },

  prevStep: () => {
    const { currentStep } = get();
    if (currentStep > 0) {
      set({ currentStep: currentStep - 1 });
    }
  },

  setGender: (gender) => set({ gender }),

  setTrainingLevel: (level) => set({ trainingLevel: level }),

  setMainGoal: (goal) => set({ mainGoal: goal }),

  savePreferences: async () => {
    const { gender, trainingLevel, mainGoal } = get();
    set({ isLoading: true, error: null });

    try {
      // Verify we have a valid session first
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No hay sesión activa. Por favor, inicia sesión.');
      }

      await apiClient.patch('/users/me', {
        gender,
        trainingLevel,
        mainGoal,
      });

      const user = session.user;
      if (user) {
        await supabase.auth.updateUser({
          data: {
            gender,
            trainingLevel,
            mainGoal,
            has_completed_onboarding: true,
          },
        });
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error al guardar preferencias';
      set({ error: message });
      throw e;
    } finally {
      set({ isLoading: false });
    }
  },

  generateRoutine: async () => {
    const { trainingLevel, gender, mainGoal } = get();
    set({ isLoading: true, error: null });

    try {
      const response = await apiClient.post('/routines/generate-initial', {
        trainingLevel,
        gender,
        mainGoal,
      });

      set({ generatedProgram: response.data });
    } catch (e) {
      set({ error: 'Error al generar rutina' });
      throw e;
    } finally {
      set({ isLoading: false });
    }
  },

  completeOnboarding: async () => {
    await get().savePreferences();
    await get().generateRoutine();
  },

  reset: () =>
    set({
      currentStep: 0,
      gender: null,
      trainingLevel: null,
      mainGoal: null,
      generatedProgram: null,
      isLoading: false,
      error: null,
    }),
}));

// src/stores/useExerciseStore.ts
// Port of exercises_provider.dart & exercises_remote_source.dart

import { create } from 'zustand';
import { apiClient } from '../api/client';
import { ExerciseFilters, ExercisesPage, parseExercisesPage, parseExercise, Exercise } from '../types/exercise';

interface ExerciseStore {
  filters: ExerciseFilters;
  page: ExercisesPage | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setFilters: (filters: Partial<ExerciseFilters>) => void;
  fetchExercises: (page?: number) => Promise<void>;
  createCustom: (name: string, primaryMuscles: string[], equipment?: string, instructions?: string) => Promise<Exercise>;
}

export const useExerciseStore = create<ExerciseStore>((set, get) => ({
  filters: {
    search: '',
    useExternal: true, // Force API usage by default like Flutter
  },
  page: null,
  isLoading: false,
  error: null,

  setFilters: (newFilters) => {
    set((state) => ({ filters: { ...state.filters, ...newFilters } }));
    get().fetchExercises(1); // debounce is ideally handled at component level or here
  },

  fetchExercises: async (pageNum = 1) => {
    const { filters } = get();
    set({ isLoading: true, error: null });

    try {
      const params: Record<string, string | number | boolean> = {
        page: pageNum,
        limit: 50,
      };

      if (filters.search) params.search = filters.search;
      if (filters.muscle) params.muscle = filters.muscle;
      if (filters.equipment) params.equipment = filters.equipment;
      if (filters.useExternal) params.useExternal = true;

      const response = await apiClient.get('/exercises', { params });
      const rawData = response.data;
      let newPage: ExercisesPage;

      if (Array.isArray(rawData)) {
        newPage = {
          exercises: rawData.map(parseExercise),
          total: rawData.length,
          page: 1,
          totalPages: 1,
        };
      } else {
        newPage = parseExercisesPage(rawData);
      }
      
      set((state) => {
        return { page: newPage, isLoading: false };
      });
    } catch (e: any) {
      set({ error: e.message || 'Failed to fetch exercises', isLoading: false });
    }
  },

  createCustom: async (name, primaryMuscles, equipment, instructions) => {
    try {
      set({ isLoading: true, error: null });
      const payload: Record<string, any> = {
        name,
        primaryMuscles,
      };
      if (equipment) payload.equipment = equipment;
      if (instructions) payload.instructions = instructions;

      const response = await apiClient.post('/exercises', payload);
      const newExercise = parseExercise(response.data);
      set({ isLoading: false });
      return newExercise;
    } catch (e: any) {
      set({ error: e.message || 'Failed to create exercise', isLoading: false });
      throw e;
    }
  }
}));

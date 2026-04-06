// src/stores/useAiCoachStore.ts
import { create } from 'zustand';
import { apiClient } from '../api/client';
import { CoachResponse, WorkoutSuggestionData, parseCoachResponse, parseSuggestion } from '../types/ai';

interface AiCoachStore {
  // Suggestion State
  suggestions: Record<string, WorkoutSuggestionData>; // Keyed by exerciseId
  isFetchingSuggestion: boolean;

  // Coach State
  coachResponse: CoachResponse | null;
  isFetchingCoach: boolean;
  coachError: string | null;

  // Actions
  fetchSuggestion: (params: {
    userId: string;
    exerciseId: string;
    exerciseName: string;
    targetReps?: number;
    targetRir?: number;
    setsDoneToday: any[];
    lastSessionSets: any[];
  }) => Promise<void>;

  fetchCoachFeedback: (params: {
    userId: string;
    exercise: string;
    sets: any[];
    fatigueScore: number;
    estimated1RM: number;
    isPR: boolean;
    injuryRisk: string;
    weeklyVolume?: number;
  }) => Promise<void>;

  fetchSessionFeedback: (params: {
    userId: string;
    exercises: any[];
    durationMin?: number;
    totalVolume?: number;
  }) => Promise<void>;

  clearCoachFeedback: () => void;
  clearSuggestion: (exerciseId: string) => void;
}

export const useAiCoachStore = create<AiCoachStore>((set, get) => ({
  suggestions: {},
  isFetchingSuggestion: false,

  coachResponse: null,
  isFetchingCoach: false,
  coachError: null,

  fetchSuggestion: async ({ userId, exerciseId, exerciseName, targetReps = 8, targetRir = 2, setsDoneToday, lastSessionSets }) => {
    if (setsDoneToday.length === 0) return;

    set({ isFetchingSuggestion: true });
    try {
      const response = await apiClient.post('/ai/suggestion', {
        userId,
        exerciseId,
        exerciseName,
        targetReps,
        targetRir,
        setsDoneToday,
        lastSessionSets,
      });

      const parsed = parseSuggestion(response.data);
      set((state) => ({
        suggestions: { ...state.suggestions, [exerciseId]: parsed },
        isFetchingSuggestion: false,
      }));
    } catch (e: any) {
      set({ isFetchingSuggestion: false });
      // Non-fatal 
    }
  },

  fetchCoachFeedback: async (params) => {
    if (params.sets.length === 0) return;

    set({ isFetchingCoach: true, coachError: null });
    try {
      const response = await apiClient.post('/ai/coach', {
        userId: params.userId,
        exercise: params.exercise,
        recentSets: params.sets,
        fatigueScore: params.fatigueScore,
        estimated1RM: params.estimated1RM,
        isPR: params.isPR,
        injuryRisk: params.injuryRisk,
        weeklyVolume: params.weeklyVolume,
      });

      const data = response.data?.data || response.data;
      set({
        coachResponse: parseCoachResponse(data),
        isFetchingCoach: false,
      });

      // Clear after 60s
      setTimeout(() => {
        set((state) => {
          if (state.coachResponse) return { coachResponse: null };
          return state;
        });
      }, 60000);
    } catch (e: any) {
      set({ isFetchingCoach: false, coachError: e.message });
    }
  },

  fetchSessionFeedback: async ({ userId, exercises, durationMin, totalVolume }) => {
    set({ isFetchingCoach: true, coachError: null });
    try {
      const response = await apiClient.post('/ai/coach/session', {
        userId,
        exercises,
        durationMin,
        totalVolume,
      });

      const data = response.data?.data || response.data;
      set({
        coachResponse: parseCoachResponse(data),
        isFetchingCoach: false,
      });
    } catch (e: any) {
      set({ isFetchingCoach: false, coachError: e.message });
    }
  },

  clearCoachFeedback: () => set({ coachResponse: null, coachError: null }),
  
  clearSuggestion: (exerciseId: string) => {
    set((state) => {
      const newSuggestions = { ...state.suggestions };
      delete newSuggestions[exerciseId];
      return { suggestions: newSuggestions };
    });
  }
}));

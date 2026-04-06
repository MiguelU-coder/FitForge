// src/stores/useProgressStore.ts

import { create } from 'zustand';
import { apiClient } from '../api/client';
import { BodyMetric, WeeklyTotal, PersonalRecord } from '../types/progress';

interface ProgressStore {
  metrics: BodyMetric[];
  volumeHistory: WeeklyTotal[];
  prs: PersonalRecord[];
  
  isLoadingMetrics: boolean;
  isLoadingVolume: boolean;
  isLoadingPRs: boolean;
  error: string | null;

  fetchMetrics: () => Promise<void>;
  addMetric: (data: Partial<BodyMetric>) => Promise<void>;
  fetchVolumeHistory: () => Promise<void>;
  fetchPRs: () => Promise<void>;
}

export const useProgressStore = create<ProgressStore>((set, get) => ({
  metrics: [],
  volumeHistory: [],
  prs: [],
  isLoadingMetrics: false,
  isLoadingVolume: false,
  isLoadingPRs: false,
  error: null,

  fetchMetrics: async () => {
    set({ isLoadingMetrics: true, error: null });
    try {
      const response = await apiClient.get('/users/me/metrics?limit=30');
      // The backend returns latest first, flutter app reversed it to show oldest to newest?
      // "data.map(...).reverse()"
      const data = (response.data as BodyMetric[]).reverse();
      set({ metrics: data, isLoadingMetrics: false });
    } catch (e: any) {
      set({ isLoadingMetrics: false, error: e.message });
    }
  },

  addMetric: async (data: Partial<BodyMetric>) => {
    set({ isLoadingMetrics: true, error: null });
    try {
      if (data.recordedAt) {
        // Ensure ISO format as expected by backend
        data.recordedAt = new Date(data.recordedAt).toISOString();
      }
      await apiClient.post('/users/me/metrics', data);
      await get().fetchMetrics(); // Refresh data
    } catch (e: any) {
      set({ isLoadingMetrics: false, error: e.message });
    }
  },

  fetchVolumeHistory: async () => {
    set({ isLoadingVolume: true, error: null });
    try {
      const response = await apiClient.get('/progress/volume?weeks=12');
      const rawVolumes = response.data as Array<{ weekStart: string, totalSets: number, totalVolumeKg: number }>;
      
      // Aggregate by weekStart
      const map: Record<string, WeeklyTotal> = {};
      for (const v of rawVolumes) {
        if (!map[v.weekStart]) {
          map[v.weekStart] = {
            weekStart: v.weekStart,
            totalSets: v.totalSets,
            totalVolumeKg: v.totalVolumeKg
          };
        } else {
          map[v.weekStart].totalSets += v.totalSets;
          map[v.weekStart].totalVolumeKg += v.totalVolumeKg;
        }
      }

      const list = Object.values(map).sort((a, b) => new Date(a.weekStart).getTime() - new Date(b.weekStart).getTime());
      
      set({ volumeHistory: list, isLoadingVolume: false });
    } catch (e: any) {
      set({ isLoadingVolume: false, error: e.message });
    }
  },

  fetchPRs: async () => {
    set({ isLoadingPRs: true, error: null });
    try {
      const response = await apiClient.get('/progress/prs');
      set({ prs: response.data as PersonalRecord[], isLoadingPRs: false });
    } catch (e: any) {
      set({ isLoadingPRs: false, error: e.message });
    }
  }
}));

// src/stores/useWorkoutStore.ts
// Ports active_session_provider, workout_history_provider and routines_provider

import { create } from 'zustand';
import { apiClient } from '../api/client';
import { WorkoutSession, RoutineTemplate, ExerciseBlock, SetLog, LastPerformance } from '../types/workout';

interface WorkoutStore {
  // Active Session State
  activeSession: WorkoutSession | null;
  lastPerformances: Record<string, LastPerformance>;
  
  // History State
  history: WorkoutSession[];
  
  // Routines State 
  templates: RoutineTemplate[];
  
  // Shared state
  isLoading: boolean;
  error: string | null;

  // ── Actions: Active Session ──
  checkForActiveSession: () => Promise<void>;
  startSession: (name?: string, routineId?: string) => Promise<void>;
  addExercise: (exerciseId: string, exerciseName?: string) => Promise<void>;
  logSet: (params: { blockId: string; setId?: string; setNumber: number; weightKg?: number; reps?: number; rir?: number; isFailed?: boolean; setType?: string; }) => Promise<void>;
  deleteSet: (blockId: string, setId: string) => Promise<void>;
  unlogSet: (blockId: string, setId: string) => Promise<void>;
  removeExercise: (blockId: string) => Promise<void>;
  finishSession: (rpe?: number, durationSeconds?: number) => Promise<void>;
  cancelSession: () => Promise<void>;
  reorderExercises: (oldIndex: number, newIndex: number) => Promise<void>;
  fetchLastPerformance: (exerciseId: string) => Promise<void>;
  fetchSessionById: (id: string) => Promise<WorkoutSession | null>;

  // ── Actions: History ──
  fetchHistory: (page?: number) => Promise<void>;

  // ── Actions: Routines ──
  fetchTemplates: () => Promise<void>;
  createRoutine: (programName: string, routineName: string, goal?: string, weeks?: number) => Promise<string>;
  deleteRoutine: (routineId: string) => Promise<void>;
  addExerciseToRoutine: (routineId: string, exerciseId: string, sets: number, reps: number, rir: number) => Promise<void>;

  clearError: () => void;
}

export const useWorkoutStore = create<WorkoutStore>((set, get) => ({
  activeSession: null,
  lastPerformances: {},
  history: [],
  templates: [],
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  // ── Active Session ──
  checkForActiveSession: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get('/workouts/sessions/active');
      const session = response.data ? (response.data as WorkoutSession) : null;
      set({ activeSession: session, isLoading: false });

      if (session?.exerciseBlocks?.length) {
        session.exerciseBlocks.forEach((block) => get().fetchLastPerformance(block.exerciseId));
      }
    } catch (e: any) {
      // 404 means no active session - this is expected, not an error
      if (e.response?.status === 404) {
        set({ activeSession: null, isLoading: false });
      } else {
        set({ isLoading: false, error: e.message });
      }
    }
  },

  startSession: async (name, routineId) => {
    set({ isLoading: true, error: null });
    try {
      const body: any = {
        name: name || `Workout ${new Date().toISOString().split('T')[0]}`,
      };
      if (routineId) body.routineId = routineId;

      const response = await apiClient.post('/workouts/sessions/start', body);
      set({ activeSession: response.data, isLoading: false });
    } catch (e: any) {
      const errMsg = e.response?.data?.message || e.message;
      set({ isLoading: false, error: errMsg });
      throw e;
    }
  },

  addExercise: async (exerciseId, exerciseName) => {
    const session = get().activeSession;
    if (!session?.id) return;
    try {
      const response = await apiClient.post(`/workouts/sessions/${session.id}/blocks`, {
        exerciseId,
        sortOrder: session.exerciseBlocks.length,
        blockType: 'NORMAL',
      });
      const newBlock = response.data as ExerciseBlock;
      
      // Ensure exerciseName is present even if API response is minimal
      if (!newBlock.exerciseName && exerciseName) {
        newBlock.exerciseName = exerciseName;
      }

      set({
        activeSession: {
          ...session,
          exerciseBlocks: [...session.exerciseBlocks, newBlock],
        }
      });
      get().fetchLastPerformance(exerciseId);
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  logSet: async ({ blockId, setId, setNumber, weightKg, reps, rir, isFailed = false, setType = 'WORKING' }) => {
    const session = get().activeSession;
    if (!session || !blockId) return;

    try {
      const body: any = { setNumber, setType, isFailed };
      if (weightKg !== undefined) body.weightKg = weightKg;
      if (reps !== undefined) body.reps = reps;
      if (rir !== undefined) body.rir = rir;

      let newSet;
      if (setId) {
        const response = await apiClient.patch(`/workouts/blocks/${blockId}/sets/${setId}`, body);
        newSet = response.data as SetLog;
      } else {
        const response = await apiClient.post(`/workouts/blocks/${blockId}/sets`, body);
        newSet = response.data as SetLog;
      }

      const updatedBlocks = session.exerciseBlocks.map((block) => {
        if (block.id !== blockId) return block;
        let updatedSets;
        if (setId) {
          updatedSets = block.sets.map((s) => s.id === setId ? newSet : s);
        } else {
          updatedSets = [...block.sets, newSet];
        }
        return { ...block, sets: updatedSets };
      });

      set({ activeSession: { ...session, exerciseBlocks: updatedBlocks } });
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  deleteSet: async (blockId, setId) => {
    const session = get().activeSession;
    if (!session || !blockId || !setId) return;
    try {
      await apiClient.delete(`/workouts/blocks/${blockId}/sets/${setId}`);
      const updatedBlocks = session.exerciseBlocks.map((block) => {
        if (block.id !== blockId) return block;
        return { ...block, sets: block.sets.filter((s) => s.id !== setId) };
      });
      set({ activeSession: { ...session, exerciseBlocks: updatedBlocks } });
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  unlogSet: async (blockId, setId) => {
    const session = get().activeSession;
    if (!session || !blockId || !setId) return;
    try {
      const response = await apiClient.patch(`/workouts/blocks/${blockId}/sets/${setId}`, { unlog: true });
      const unloggedSet = response.data as SetLog;
      
      const updatedBlocks = session.exerciseBlocks.map((block) => {
        if (block.id !== blockId) return block;
        return { ...block, sets: block.sets.map((s) => s.id === setId ? unloggedSet : s) };
      });
      set({ activeSession: { ...session, exerciseBlocks: updatedBlocks } });
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  removeExercise: async (blockId) => {
    const session = get().activeSession;
    if (!session?.id || !blockId) return;
    try {
      await apiClient.delete(`/workouts/sessions/${session.id}/blocks/${blockId}`);
      const updatedBlocks = session.exerciseBlocks.filter((b) => b.id !== blockId);
      set({ activeSession: { ...session, exerciseBlocks: updatedBlocks } });
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  finishSession: async (rpe) => {
    const session = get().activeSession;
    if (!session?.id) return;
    set({ isLoading: true, error: null });
    try {
      const body: any = {};
      if (rpe !== undefined) body.perceivedExertion = rpe;
      await apiClient.patch(`/workouts/sessions/${session.id}/finish`, body);
      set({ activeSession: null, lastPerformances: {}, isLoading: false });
      get().fetchHistory();
    } catch (e: any) {
      const msg = e.response?.data?.message || e.message;
      if (e.response?.status === 403 && msg.includes('Session already finished')) {
        set({ activeSession: null, lastPerformances: {}, isLoading: false });
        get().fetchHistory();
      } else {
        set({ isLoading: false, error: msg });
      }
    }
  },

  cancelSession: async () => {
    const session = get().activeSession;
    // Always clear local state first so UI updates immediately
    set({ activeSession: null, lastPerformances: {}, isLoading: false });
    if (!session?.id) return;
    try {
      await apiClient.delete(`/workouts/sessions/${session.id}`);
      get().fetchHistory();
    } catch (e: any) {
      // Session might already be deleted on backend — local state is already cleared
      get().fetchHistory();
    }
  },

  reorderExercises: async (oldIndex, newIndex) => {
    const session = get().activeSession;
    if (!session?.id) return;
    
    if (oldIndex < newIndex) {
      newIndex -= 1;
    }
    const updatedBlocks = [...session.exerciseBlocks];
    const [block] = updatedBlocks.splice(oldIndex, 1);
    updatedBlocks.splice(newIndex, 0, block);

    const reindexed = updatedBlocks.map((b, i) => ({ ...b, sortOrder: i }));
    const blocksConfig = reindexed.map(b => ({ id: b.id, sortOrder: b.sortOrder }));

    set({ activeSession: { ...session, exerciseBlocks: reindexed } });

    try {
      await apiClient.patch(`/workouts/sessions/${session.id}/blocks/reorder`, { blocks: blocksConfig });
    } catch (e: any) {
      set({ error: 'Failed to save new order' });
      // Might want to rollback state here in a real app
    }
  },

  fetchLastPerformance: async (exerciseId) => {
    if (get().lastPerformances[exerciseId]) return;
    try {
      const response = await apiClient.get(`/workouts/exercises/${exerciseId}/last-performance`);
      if (response.data) {
        set((state) => ({ 
          lastPerformances: { ...state.lastPerformances, [exerciseId]: response.data } 
        }));
      }
    } catch (_) {}
  },

  // ── History ──
  fetchHistory: async (page = 1) => {
    set({ isLoading: true });
    try {
      const response = await apiClient.get('/workouts/sessions', { params: { page, limit: 15 }});
      let historyData: WorkoutSession[] = [];
      if (Array.isArray(response.data)) {
        historyData = response.data;
      } else if (response.data?.sessions) {
        historyData = response.data.sessions;
      }
      const mappedHistory = historyData.map((session: any) => ({
        ...session,
        exerciseBlocks: session.exerciseBlocks?.map((block: any) => ({
          ...block,
          exerciseName: block.exercise?.name || 'Unknown',
          primaryMuscles: block.exercise?.primaryMuscles || [],
          isUnilateral: block.exercise?.isUnilateral || false,
          sets: block.sets || [],
        })) || [],
      }));
      set({ history: mappedHistory, isLoading: false });
    } catch (e: any) {
      set({ error: e.message, isLoading: false, history: [] });
    }
  },

  fetchSessionById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get(`/workouts/sessions/${id}`);
      const sessionData = response.data as any;
      if (!sessionData) return null;
      
      // Map exerciseBlocks with exercise names and muscle groups
      const mappedSession = {
        ...sessionData,
        exerciseBlocks: sessionData.exerciseBlocks?.map((block: any) => ({
          ...block,
          exerciseName: block.exercise?.name || 'Exercise',
          primaryMuscles: block.exercise?.primaryMuscles || [],
          isUnilateral: block.exercise?.isUnilateral || false,
          sets: block.sets || [],
        })) || [],
      };
      
      set({ isLoading: false });
      return mappedSession as WorkoutSession;
    } catch (e: any) {
      set({ isLoading: false, error: e.message });
      return null;
    }
  },

  // ── Routines ──
  fetchTemplates: async () => {
    // Ported from RoutineTemplatesNotifier
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get('/programs');
      const allTemplates: RoutineTemplate[] = [];
      
      const programs = response.data as any[];
      for (const prog of programs) {
        const routines = prog.routines || [];
        // Ensure each routine has items array
        const normalizedRoutines = routines.map((r: any) => ({
          ...r,
          items: r.items || [],
        }));
        allTemplates.push(...normalizedRoutines);
      }
      set({ templates: allTemplates, isLoading: false });
    } catch (e: any) {
      set({ isLoading: false, error: e.message });
    }
  },

  createRoutine: async (programName, routineName, goal, weeks) => {
    set({ isLoading: true, error: null });
    try {
      const progBody: any = { name: programName };
      if (goal) progBody.goal = goal.trim();
      if (weeks) progBody.durationWeeks = weeks;

      const progRes = await apiClient.post('/programs', progBody);
      const progId = progRes.data.id;

      const routineRes = await apiClient.post('/programs/routines', { programId: progId, name: routineName });
      const routineId = routineRes.data.id;

      await get().fetchTemplates();
      set({ isLoading: false });
      return routineId;
    } catch (e: any) {
      set({ isLoading: false, error: e.message });
      throw e;
    }
  },

  deleteRoutine: async (routineId) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.delete(`/programs/routines/${routineId}`);
      await get().fetchTemplates();
    } catch (e: any) {
      set({ isLoading: false, error: e.message });
    }
  },

  addExerciseToRoutine: async (routineId, exerciseId, sets, reps, rir) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.post('/programs/routine-items', {
        routineId,
        exerciseId,
        targetSets: sets,
        targetReps: reps,
        targetRir: rir
      });
      await get().fetchTemplates();
    } catch (e: any) {
      set({ isLoading: false, error: e.message });
    }
  },

  regenerateProgram: async (programId: string) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.post(`/programs/${programId}/regenerate`);
      await get().fetchTemplates();
    } catch (e: any) {
      set({ isLoading: false, error: e.message });
    }
  }

}));

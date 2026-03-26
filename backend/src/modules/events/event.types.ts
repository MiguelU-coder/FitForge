// ─────────────────────────────────────────────────────────────────────────────
// FitForge — Domain Event Types
// All training domain events that flow through the system.
// ─────────────────────────────────────────────────────────────────────────────

export enum FitForgeEvent {
  SET_RECORDED = 'SET_RECORDED',
  WORKOUT_STARTED = 'WORKOUT_STARTED',
  WORKOUT_COMPLETED = 'WORKOUT_COMPLETED',
  PR_DETECTED = 'PR_DETECTED',
  FATIGUE_THRESHOLD = 'FATIGUE_THRESHOLD',
}

// ─── Shared base ─────────────────────────────────────────────────────────────

export interface BaseEventPayload {
  eventId: string; // UUID — unique per emission
  eventType: FitForgeEvent;
  userId: string;
  timestamp: string; // ISO 8601
}

// ─── SET_RECORDED ─────────────────────────────────────────────────────────────

export interface SetRecordedPayload extends BaseEventPayload {
  eventType: FitForgeEvent.SET_RECORDED;
  workoutId: string;
  setId: string;
  exerciseId: string;
  exerciseName: string;
  setNumber: number;
  weight: number; // kg
  reps: number;
  rpe: number | null; // 1–10, optional
  volumeLoad: number; // weight * reps (computed by backend)
}

// ─── WORKOUT_STARTED ──────────────────────────────────────────────────────────

export interface WorkoutStartedPayload extends BaseEventPayload {
  eventType: FitForgeEvent.WORKOUT_STARTED;
  workoutId: string;
  templateId: string | null;
  plannedExercises: string[]; // exerciseId[]
}

// ─── WORKOUT_COMPLETED ────────────────────────────────────────────────────────

export interface WorkoutCompletedPayload extends BaseEventPayload {
  eventType: FitForgeEvent.WORKOUT_COMPLETED;
  workoutId: string;
  durationMinutes: number;
  totalSets: number;
  totalVolumeLoad: number; // sum of all set volume loads
  exerciseIds: string[];
}

// ─── PR_DETECTED ──────────────────────────────────────────────────────────────

export type PRType = '1rm_estimated' | '1rm_direct' | 'volume_load' | 'reps';

export interface PRDetectedPayload extends BaseEventPayload {
  eventType: FitForgeEvent.PR_DETECTED;
  workoutId: string;
  setId: string;
  exerciseId: string;
  exerciseName: string;
  prType: PRType;
  newValue: number;
  previousValue: number | null;
  improvementPct: number | null;
}

// ─── FATIGUE_THRESHOLD ────────────────────────────────────────────────────────

export interface FatigueThresholdPayload extends BaseEventPayload {
  eventType: FitForgeEvent.FATIGUE_THRESHOLD;
  workoutId: string;
  fatigueScore: number; // 0.0 – 1.0
  fatigueStatus: 'tired' | 'overtrained';
  atl: number;
  ctl: number;
  tsb: number;
}

// ─── Union ────────────────────────────────────────────────────────────────────

export type AnyEventPayload =
  | SetRecordedPayload
  | WorkoutStartedPayload
  | WorkoutCompletedPayload
  | PRDetectedPayload
  | FatigueThresholdPayload;

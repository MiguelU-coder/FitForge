// src/types/progress.ts

export interface BodyMetric {
  id: string;
  recordedAt: string;
  weightKg?: number;
  bodyFatPct?: number;
  waistCm?: number;
  hipsCm?: number;
  chestCm?: number;
  armsCm?: number;
  thighsCm?: number;
  bmi?: number;
  bodyWaterPct?: number;
  boneMassKg?: number;
  visceralFatRating?: number;
  notes?: string;
}

export interface WeeklyTotal {
  weekStart: string;
  totalSets: number;
  totalVolumeKg: number;
  muscleGroup?: string;
}

export interface PersonalRecord {
  id?: string;
  exerciseName: string;
  prType: string;
  value: number;
}

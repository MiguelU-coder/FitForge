// src/modules/ai-bridge/dto/ai-request.dto.ts
import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsEnum,
  IsBoolean,
  Min,
  Max,
  ValidateNested,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

// ── Enums ─────────────────────────────────────────────────────────────────────
export enum SetType {
  WARMUP = 'WARMUP',
  WORKING = 'WORKING',
  DROP = 'DROP',
  FAILURE = 'FAILURE',
}

export enum EquipmentType {
  BARBELL = 'BARBELL',
  DUMBBELL = 'DUMBBELL',
  CABLE = 'CABLE',
  MACHINE = 'MACHINE',
  BODYWEIGHT = 'BODYWEIGHT',
  KETTLEBELL = 'KETTLEBELL',
  RESISTANCE_BAND = 'RESISTANCE_BAND',
}

// ── Nested DTOs ───────────────────────────────────────────────────────────────
export class SetInputDto {
  @IsNumber()
  @Min(1)
  setNumber!: number;

  @IsEnum(SetType)
  setType: SetType = SetType.WORKING;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000)
  weightKg?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(200)
  reps?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  rir?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  rpe?: number;
}

export class ExerciseHistoryEntryDto {
  @IsDateString()
  sessionDate!: string;

  @IsString()
  exerciseId!: string;

  @IsString()
  exerciseName!: string;

  @IsOptional()
  @IsEnum(EquipmentType)
  equipment?: EquipmentType;

  @IsArray()
  @IsString({ each: true })
  primaryMuscles: string[] = [];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SetInputDto)
  sets!: SetInputDto[];
}

// ── Request DTOs ──────────────────────────────────────────────────────────────
export class ProgressionRequestDto {
  @IsString()
  userId!: string;

  @IsString()
  exerciseId!: string;

  @IsString()
  exerciseName!: string;

  @IsOptional()
  @IsEnum(EquipmentType)
  equipment?: EquipmentType;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExerciseHistoryEntryDto)
  history!: ExerciseHistoryEntryDto[];

  @IsNumber()
  @Min(0)
  @Max(5)
  targetRir: number = 2;

  @IsNumber()
  @Min(1)
  @Max(50)
  targetReps: number = 8;

  @IsNumber()
  @Min(0.5)
  @Max(10)
  weightIncrement: number = 2.5;
}

export class WorkoutSuggestionRequestDto {
  @IsString()
  userId!: string;

  @IsString()
  exerciseId!: string;

  @IsString()
  exerciseName!: string;

  @IsNumber()
  @Min(1)
  targetReps: number = 8;

  @IsNumber()
  @Min(0)
  @Max(5)
  targetRir: number = 2;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SetInputDto)
  setsDoneToday!: SetInputDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SetInputDto)
  lastSessionSets: SetInputDto[] = [];
}

export class MuscleVolumeInputDto {
  @IsString()
  muscleGroup!: string;

  @IsNumber()
  @Min(0)
  totalSets!: number;

  @IsNumber()
  @Min(0)
  totalReps!: number;

  @IsNumber()
  @Min(0)
  totalVolumeKg!: number;
}

export class VolumeAnalysisRequestDto {
  @IsString()
  userId!: string;

  @IsDateString()
  weekStart!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MuscleVolumeInputDto)
  muscleVolumes!: MuscleVolumeInputDto[];
}

export class SessionLoadDto {
  @IsDateString()
  date!: string;

  @IsNumber()
  @Min(0)
  totalSets!: number;

  @IsNumber()
  @Min(0)
  totalVolumeKg!: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  rpeAvg?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  durationMin?: number;
}

export class FatigueRequestDto {
  @IsString()
  userId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SessionLoadDto)
  sessions!: SessionLoadDto[];
}

// ── Recovery Prediction DTOs ─────────────────────────────────────────────────
export class MuscleRecoveryInputDto {
  @IsString()
  muscleGroup!: string;

  @IsDateString()
  lastTrainedDate!: string;

  @IsNumber()
  @Min(0)
  setsLastSession!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  avgRirLastSession?: number;
}

export class RecoveryRequestDto {
  @IsString()
  userId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MuscleRecoveryInputDto)
  muscleData!: MuscleRecoveryInputDto[];
}

// ── Injury Risk Assessment DTOs ───────────────────────────────────────────────
export class ExerciseRiskFactorDto {
  @IsString()
  exerciseId!: string;

  @IsString()
  exerciseName!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  setsThisWeek?: number;

  @IsOptional()
  @IsString()
  rirTrend?: 'increasing' | 'stable' | 'decreasing';

  @IsOptional()
  @IsBoolean()
  hasInjuryHistory?: boolean;

  @IsOptional()
  @IsString()
  equipmentCondition?: 'good' | 'fair' | 'poor';
}

export class InjuryRiskRequestDto {
  @IsString()
  userId!: string;

  @IsOptional()
  @IsNumber()
  acwr?: number;

  @IsOptional()
  @IsNumber()
  currentWeekVolume?: number;

  @IsOptional()
  @IsNumber()
  averageWeeklyVolume?: number;

  @IsOptional()
  @IsNumber()
  previousWeekVolume?: number;

  @IsOptional()
  @IsNumber()
  consecutiveHeavySessions?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  sleepQualityScore?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  stressLevel?: number;

  @IsOptional()
  @IsNumber()
  sessionsPerWeek?: number;

  @IsOptional()
  @IsNumber()
  daysSinceLastSession?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExerciseRiskFactorDto)
  exerciseRisks?: ExerciseRiskFactorDto[];
}

// ── PR Prediction DTOs ────────────────────────────────────────────────────────
export class CurrentPerformanceDto {
  @IsNumber()
  @Min(0)
  weightKg!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  reps?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  rir?: number;

  @IsOptional()
  @IsDateString()
  date?: string;
}

export class PRHistoryEntryDto {
  @IsDateString()
  date!: string;

  @IsNumber()
  @Min(0)
  weightKg!: number;

  @IsNumber()
  @Min(1)
  reps: number = 1;

  @IsOptional()
  @IsNumber()
  estimated1Rm?: number;
}

export class PRPredictionRequestDto {
  @IsString()
  userId!: string;

  @IsString()
  exerciseId!: string;

  @IsString()
  exerciseName!: string;

  @IsOptional()
  @IsString()
  exerciseType?: 'compound' | 'isolation';

  @IsOptional()
  @IsEnum(EquipmentType)
  equipment?: EquipmentType;

  @IsOptional()
  @IsNumber()
  monthsTraining?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => CurrentPerformanceDto)
  currentPerformance?: CurrentPerformanceDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PRHistoryEntryDto)
  prHistory?: PRHistoryEntryDto[];
}

// ── AI Coach DTOs (Phase 3) ───────────────────────────────────────────────────
export class RecentSetInputDto {
  @IsNumber()
  @Min(0)
  weight!: number;

  @IsNumber()
  @Min(0)
  @Max(200)
  reps!: number;

  @IsNumber()
  @Min(1)
  @Max(10)
  rpe!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  rir?: number;
}

export class CoachAnalyzeRequestDto {
  @IsString()
  userId!: string;

  @IsString()
  exercise!: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecentSetInputDto)
  recentSets?: RecentSetInputDto[];

  @IsNumber()
  @Min(0)
  @Max(100)
  fatigueScore!: number;

  @IsNumber()
  @Min(0)
  estimated1RM!: number;

  @IsBoolean()
  isPR!: boolean;

  @IsString()
  injuryRisk!: string; // "LOW" | "MODERATE" | "HIGH"

  @IsOptional()
  @IsNumber()
  @Min(0)
  weeklyVolume?: number;
}
export class ExerciseSessionInputDto {
  @IsString()
  exercise!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecentSetInputDto)
  sets!: RecentSetInputDto[];

  @IsBoolean()
  isPR: boolean = false;
}

export class SessionCoachAnalyzeRequestDto {
  @IsString()
  userId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExerciseSessionInputDto)
  exercises!: ExerciseSessionInputDto[];

  @IsOptional()
  @IsNumber()
  durationMin?: number;

  @IsOptional()
  @IsNumber()
  totalVolume?: number;
}

// ── Coach Routine Generation DTO (onboarding flow) ────────────────────────────
export class CoachRoutineRequestDto {
  @IsOptional()
  @IsString()
  goal?: string;

  @IsOptional()
  @IsString()
  level?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsNumber()
  height?: number;

  @IsOptional()
  @IsNumber()
  weight?: number;

  @IsOptional()
  @IsNumber()
  goalWeight?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  activities?: string[];

  @IsOptional()
  @IsString()
  dateOfBirth?: string;
}

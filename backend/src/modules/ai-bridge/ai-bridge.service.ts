// src/modules/ai-bridge/ai-bridge.service.ts
import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, timeout, catchError, retry, of } from 'rxjs';
import { AxiosError } from 'axios';
import { PrismaService } from '../../database/prisma.service';
import {
  ProgressionRequestDto,
  WorkoutSuggestionRequestDto,
  VolumeAnalysisRequestDto,
  FatigueRequestDto,
  RecoveryRequestDto,
  InjuryRiskRequestDto,
  PRPredictionRequestDto,
  CoachAnalyzeRequestDto,
  SessionCoachAnalyzeRequestDto,
  CoachRoutineRequestDto,
} from './dto/ai-request.dto';
import {
  LEVEL_SPLIT_MAP,
  getPhaseForWeek,
  TrainingLevel,
  SplitConfig,
  DayConfig,
} from '../routines/config/training.config';
import {
  ExerciseSelectionService,
  ExerciseWithMeta,
} from '../routines/services/exercise-selection.service';

@Injectable()
export class AiBridgeService {
  private readonly logger = new Logger(AiBridgeService.name);
  private readonly aiBaseUrl: string;
  private readonly aiCoachUrl: string; // Phase 3 — port 8001
  private readonly aiServiceSecret: string; // Service-to-service auth token
  private readonly requestTimeout = 180000; // 3 min for AI Coach LLM responses

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly exerciseSelectionService: ExerciseSelectionService,
  ) {
    this.aiBaseUrl = config.get<string>('AI_SERVICE_URL', 'http://localhost:8000');
    this.aiCoachUrl = config.get<string>('AI_COACH_URL', 'http://localhost:8001');
    this.aiServiceSecret = config.get<string>('AI_SERVICE_SECRET', '');

    if (!this.aiServiceSecret) {
      this.logger.warn('AI_SERVICE_SECRET is not configured. AI service calls may fail.');
    }
  }

  /**
   * Get progressive overload recommendation for an exercise.
   */
  async getProgressionRecommendation(dto: ProgressionRequestDto, authToken: string) {
    return this.callAiService('/ai/progression', dto, authToken);
  }

  /**
   * Real-time next-set suggestion.
   */
  async getNextSetSuggestion(dto: WorkoutSuggestionRequestDto, authToken: string) {
    return this.callAiService('/ai/suggestion', dto, authToken);
  }

  /**
   * Analyze weekly volume per muscle group.
   */
  async getVolumeAnalysis(dto: VolumeAnalysisRequestDto, authToken: string) {
    return this.callAiService('/ai/volume', dto, authToken);
  }

  /**
   * Assess accumulated fatigue.
   */
  async getFatigueAssessment(dto: FatigueRequestDto, authToken: string) {
    return this.callAiService('/ai/fatigue', dto, authToken);
  }

  /**
   * Predict muscle recovery status.
   */
  async getRecoveryPrediction(dto: RecoveryRequestDto, authToken: string) {
    return this.callAiService('/ai/recovery', dto, authToken);
  }

  /**
   * Assess injury risk.
   */
  async getInjuryRiskAssessment(dto: InjuryRiskRequestDto, authToken: string) {
    return this.callAiService('/ai/injury-risk', dto, authToken);
  }

  /**
   * Predict PR timeline.
   */
  async getPRPrediction(dto: PRPredictionRequestDto, authToken: string) {
    return this.callAiService('/ai/pr-prediction', dto, authToken);
  }

  /**
   * Phase 3 — AI Coach (LLM-powered).
   * Calls the ai-services microservice on port 8001.
   */
  async getCoachAnalysis(dto: CoachAnalyzeRequestDto, authToken?: string): Promise<any> {
    const url = `${this.aiCoachUrl}/coach/analyze`;
    return this._callCoachService(url, dto, authToken);
  }

  /**
   * Phase 3 — Session Summary (LLM-powered).
   */
  async getSessionSummary(dto: SessionCoachAnalyzeRequestDto, authToken?: string): Promise<any> {
    const url = `${this.aiCoachUrl}/coach/session`;
    return this._callCoachService(url, dto, authToken);
  }

  /**
   * Generate and save a personalized workout routine based on user profile.
   * Called from onboarding flow when user taps "Generate Plan".
   *
   * Uses slot-based generation via LEVEL_SPLIT_MAP + ExerciseSelectionService:
   * - Each level maps to a scientifically designed SplitConfig
   * - Each day slot defines movement pattern, muscle target, sets, reps, rest
   * - Exercises are selected by strict muscle match (no name guessing)
   */
  async generateAndSaveRoutine(
    userId: string,
    dto: CoachRoutineRequestDto,
    authToken?: string,
  ): Promise<any> {
    this.logger.log(`Generating routine for user ${userId}, level: ${dto.level}, goal: ${dto.goal}`);

    // 1. Load exercises from DB
    const dbExercisesRaw = await this.prisma.exercise.findMany({
      where: { isActive: true, isCustom: false },
      take: 500,
      orderBy: { name: 'asc' },
    });

    if (dbExercisesRaw.length === 0) {
      throw new HttpException(
        'No exercises available. Please seed the exercise database first.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const exercises: ExerciseWithMeta[] = dbExercisesRaw.map((ex: any) => ({
      id: ex.id,
      name: ex.name,
      primaryMuscles: this.parseArrayField(ex.primary_muscles),
      secondaryMuscles: this.parseArrayField(ex.secondary_muscles),
      isCompound: ex.is_compound ?? false,
      movementPattern: ex.movement_pattern ?? null,
      exerciseType: ex.exercise_type ?? null,
      fatigueLevel: ex.fatigue_level ?? null,
      equipment: ex.equipment ?? undefined,
      isUnilateral: ex.is_unilateral ?? false,
    }));

    this.logger.log(`Loaded ${exercises.length} exercises from DB`);

    // 2. Resolve split config from training level
    const trainingLevel = this.mapToTrainingLevel(dto.level);
    const splitConfig = LEVEL_SPLIT_MAP[trainingLevel];
    const materializedDays = this.materializeDays(splitConfig);
    const phase = getPhaseForWeek(1, trainingLevel);
    const routineName = this.getRoutineName(dto.goal);

    // 3. Build sessions slot by slot (strict muscle validation)
    const sessions = materializedDays.map((day) => ({
      day_label: day.dayName,
      exercises: this.buildDayExercises(day, exercises, phase, trainingLevel),
    }));

    const totalExercises = sessions.reduce((sum, s) => sum + s.exercises.length, 0);
    this.logger.log(
      `Built ${sessions.length} sessions, ${totalExercises} exercises total: [${sessions.map((s) => s.exercises.length).join(', ')}]`,
    );

    // 4. Create Program → Routine → RoutineItems in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const program = await tx.program.create({
        data: {
          userId,
          name: routineName,
          goal: dto.goal ?? 'General Fitness',
          weeks: trainingLevel === 'ADVANCED' ? 9 : 8,
          daysPerWeek: sessions.length,
          isActive: true,
          startedAt: new Date(),
        },
      });

      const createdRoutines = [];
      for (let i = 0; i < sessions.length; i++) {
        const session = sessions[i];

        const routineItemsData = session.exercises.map((ex, exIdx) => ({
          exerciseId: ex.id,
          sortOrder: exIdx,
          targetSets: ex.sets,
          targetReps: ex.reps,
          targetRir: ex.rir,
          restSeconds: ex.rest_seconds,
          notes: ex.notes ?? null,
        }));

        const routine = await tx.routine.create({
          data: {
            userId,
            programId: program.id,
            name: session.day_label,
            dayOfWeek: i + 1,
            sortOrder: i,
            routineItems: { create: routineItemsData },
          },
          include: {
            routineItems: { include: { exercise: true } },
          },
        });

        createdRoutines.push(routine);
      }

      return { program, routines: createdRoutines };
    });

    this.logger.log(`Saved program "${routineName}" with ${result.routines.length} routines`);

    // 5. Format response for Flutter
    const routinesFormatted = result.routines.map((r) => ({
      name: r.name,
      exercises: r.routineItems.map((item) => ({
        name: item.exercise?.name || 'UNKNOWN',
        sets: item.targetSets,
        targetSets: item.targetSets,
        reps: item.targetReps,
        targetReps: item.targetReps,
      })),
    }));

    return {
      data: {
        routineId: result.routines[0]?.id ?? result.program.id,
        routineName,
        name: routineName,
        description: `A personalized ${sessions.length}-day ${splitConfig.splitName} program.`,
        generatedBy: 'local',
        schedule: {
          daysPerWeek: sessions.length,
          sessionDuration: 60,
        },
        routines: routinesFormatted,
      },
    };
  }

  /**
   * Build exercises for a single training day using slot-based strict selection.
   * Each slot specifies movement pattern + muscle target + sets/reps/rest.
   */
  private buildDayExercises(
    day: DayConfig,
    exercises: ExerciseWithMeta[],
    phase: ReturnType<typeof getPhaseForWeek>,
    trainingLevel: TrainingLevel,
  ): { id: string; name: string; sets: number; reps: number; rir: number; rest_seconds: number; notes?: string }[] {
    const usedIds = new Set<string>();
    const result: { id: string; name: string; sets: number; reps: number; rir: number; rest_seconds: number; notes?: string }[] = [];

    for (const slot of day.slots) {
      const targetMuscle = slot.muscleTarget || this.getPrimaryMuscleForPattern(slot.movementPattern);

      const exerciseId = this.exerciseSelectionService.selectExerciseForSlot(
        slot,
        exercises,
        usedIds,
        targetMuscle,
      );

      if (!exerciseId) {
        this.logger.warn(`No exercise found for slot (muscle: ${targetMuscle}, pattern: ${slot.movementPattern}) in ${day.dayName}`);
        continue;
      }

      usedIds.add(exerciseId);
      const ex = exercises.find((e) => e.id === exerciseId);

      result.push({
        id: exerciseId,
        name: ex?.name || 'Unknown',
        sets: slot.sets,
        reps: slot.repsMin,
        rir: phase.rirTarget[trainingLevel],
        rest_seconds: slot.restSeconds,
        notes: slot.notes,
      });
    }

    return result;
  }

  /**
   * Expand AB-rotation splits into the actual training days for the week.
   * e.g. A/B rotation with 3 days → [A, B, A]
   */
  private materializeDays(splitConfig: SplitConfig): DayConfig[] {
    const { days, daysPerWeek, rotationMode } = splitConfig;
    if (rotationMode === 'AB' && daysPerWeek > days.length) {
      return Array.from({ length: daysPerWeek }, (_, i) => days[i % days.length]);
    }
    return days;
  }

  /**
   * Map raw onboarding level string to TrainingLevel enum.
   */
  private mapToTrainingLevel(level?: string): TrainingLevel {
    if (level === 'BEGINNER') return 'BEGINNER';
    if (level === 'IRREGULAR') return 'IRREGULAR';
    if (level === 'ADVANCED') return 'ADVANCED';
    return 'MEDIUM';
  }

  /**
   * Get primary muscle group for a movement pattern.
   * Used as fallback when slot.muscleTarget is not specified.
   */
  private getPrimaryMuscleForPattern(pattern: string | null): string {
    const muscleMap: Record<string, string> = {
      SQUAT: 'QUADS',
      HINGE: 'HAMSTRINGS',
      PUSH_HORIZONTAL: 'CHEST',
      PUSH_VERTICAL: 'SHOULDERS',
      PULL_HORIZONTAL: 'BACK',
      PULL_VERTICAL: 'LATS',
      LUNGE: 'QUADS',
      CORE: 'ABS',
      CARRY: 'ABS',
    };
    return pattern ? (muscleMap[pattern] || 'CHEST') : 'CHEST';
  }

  /**
   * Parse JSON string array or comma-separated string to uppercase string[].
   * Handles all Prisma JSON field formats.
   */
  private parseArrayField(field: unknown): string[] {
    if (!field) return [];
    if (Array.isArray(field)) return field.map((s) => String(s).toUpperCase());
    if (typeof field === 'string') {
      try {
        const parsed = JSON.parse(field);
        if (Array.isArray(parsed)) return parsed.map((s) => String(s).toUpperCase());
      } catch {
        return field.split(/[,;]/).map((s) => s.trim().toUpperCase()).filter(Boolean);
      }
    }
    return [];
  }

  private getRoutineName(goal?: string): string {
    switch (goal) {
      case 'LOSE_WEIGHT':
        return 'Fat Burn Program';
      case 'KEEP_FIT':
        return 'Fitness Maintenance Plan';
      case 'GET_STRONGER':
        return 'Strength Builder Program';
      case 'GAIN_MUSCLE_MASS':
        return 'Muscle Hypertrophy Plan';
      default:
        return 'AI Generated Routine';
    }
  }

  /**
   * Internal helper for AI Coach (Phase 3) calls.
   * Uses AI_SERVICE_SECRET for service-to-service authentication.
   * Returns null on failure instead of throwing, to allow fallback.
   */
  private async _callCoachService(url: string, dto: any, authToken?: string): Promise<any | null> {
    // Use service token if no user token provided
    const serviceToken = authToken || this.aiServiceSecret;

    if (!serviceToken) {
      this.logger.warn('No authentication token available for AI Coach service');
      return null;
    }

    try {
      this.logger.debug(`Calling AI Coach at ${url}`);

      const response = await firstValueFrom(
        this.http
          .post(url, dto, {
            headers: {
              Authorization: `Bearer ${serviceToken}`,
              'Content-Type': 'application/json',
            },
            timeout: this.requestTimeout,
          })
          .pipe(
            timeout(this.requestTimeout),
            retry({ count: 1, delay: 500 }),
            catchError((err: AxiosError) => {
              this.logger.error(`AI Coach error on ${url}: ${err.message}`, err.response?.data);
              return of(null);
            }),
          ),
      );

      // If response is null (from catchError), return null
      if (!response) return null;

      return (response as any).data;
    } catch (err: any) {
      this.logger.warn(`AI Coach request failed: ${err?.message || 'Unknown error'}`);
      return null;
    }
  }

  /**
   * Invalidate AI cache after a workout is finished.
   */
  async invalidateUserCache(userId: string, authToken?: string): Promise<void> {
    try {
      const headers: Record<string, string> = {};
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      await firstValueFrom(
        this.http
          .delete(`${this.aiBaseUrl}/ai/cache/${userId}`, {
            headers,
          })
          .pipe(timeout(3000)),
      );
      this.logger.log(`AI cache invalidated for user ${userId}`);
    } catch (err: any) {
      this.logger.warn(`AI cache invalidation failed for ${userId}: ${err.message}`);
    }
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private async callAiService<T>(path: string, body: object, authToken: string): Promise<T> {
    const url = `${this.aiBaseUrl}${path}`;

    try {
      const { data } = await firstValueFrom(
        this.http
          .post<T>(url, body, {
            headers: {
              Authorization: `Bearer ${authToken}`,
              'Content-Type': 'application/json',
            },
          })
          .pipe(
            timeout(this.requestTimeout),
            retry({ count: 2, delay: 500 }),
            catchError((err: AxiosError) => {
              this.logger.error(`AI service error on ${path}: ${err.message}`, err.response?.data);
              throw new HttpException(
                `AI service unavailable: ${err.message}`,
                err.response?.status ?? HttpStatus.SERVICE_UNAVAILABLE,
              );
            }),
          ),
      );

      return data;
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new HttpException('AI service request failed', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }
}

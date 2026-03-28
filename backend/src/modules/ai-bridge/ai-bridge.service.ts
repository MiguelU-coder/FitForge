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

@Injectable()
export class AiBridgeService {
  private readonly logger = new Logger(AiBridgeService.name);
  private readonly aiBaseUrl: string;
  private readonly aiCoachUrl: string;    // Phase 3 — port 8001
  private readonly aiServiceSecret: string; // Service-to-service auth token
  private readonly requestTimeout = 180000; // 3 min for AI Coach LLM responses

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.aiBaseUrl   = config.get<string>('AI_SERVICE_URL',   'http://localhost:8000');
    this.aiCoachUrl  = config.get<string>('AI_COACH_URL',     'http://localhost:8001');
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
   * Strategy:
   * 1. Try AI Coach service first (if available)
   * 2. Fall back to local rule-based generation if AI fails
   */
  async generateAndSaveRoutine(userId: string, dto: CoachRoutineRequestDto, authToken?: string): Promise<any> {
    this.logger.log(`Generating routine for user ${userId} with goal ${dto.goal}`);

    // 1. Fetch available exercises from DB
    const dbExercises = await this.prisma.exercise.findMany({
      where: { isActive: true, isCustom: false },
      take: 50,
      orderBy: { name: 'asc' },
    });

    if (dbExercises.length === 0) {
      throw new HttpException(
        'No exercises available. Please seed the exercise database first.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const daysPerWeek = this.getDaysPerWeek(dto.level);
    const routineName = this.getRoutineName(dto.goal);
    let generatedBy = 'ai';
    let sessions: any[] = [];

    // 2. Try AI Coach service first
    try {
      const coachUrl = `${this.aiCoachUrl}/coach/routine`;
      this.logger.debug(`Attempting AI Coach at ${coachUrl}`);
      
      const aiResponse = await this._callCoachService(coachUrl, {
        userId,
        goal: dto.goal,
        trainingLevel: dto.level,
        gender: dto.gender,
        daysPerWeek,
        availableEquipment: dto.activities || [],
        age: dto.dateOfBirth ? this.calculateAge(dto.dateOfBirth) : 25,
        weightKg: dto.weight,
        goalWeightKg: dto.goalWeight,
      }, authToken);

      if (aiResponse?.sessions && aiResponse.sessions.length > 0) {
        sessions = aiResponse.sessions;
        this.logger.log(`AI Coach generated ${sessions.length} sessions`);
      } else {
        throw new Error('Empty sessions from AI');
      }
    } catch (aiError: any) {
      // AI failed - use local fallback generation
      this.logger.warn(`AI Coach unavailable (${aiError.message}), falling back to local generation`);
      this.logger.log(`Generating local routine for ${daysPerWeek} days/week, goal: ${dto.goal}`);
      
      generatedBy = 'local';
      sessions = this.buildSessionsFromExercises(dbExercises, daysPerWeek, dto.goal, dto.level);
    }

    // Use actual number of sessions generated
    const templateCount = sessions.length;

    // 3. Create Program → Routine → RoutineItems in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const program = await tx.program.create({
        data: {
          userId,
          name: routineName,
          goal: dto.goal ?? 'General Fitness',
          weeks: 4,
          daysPerWeek: templateCount,
          isActive: true,
          startedAt: new Date(),
        },
      });

      const createdRoutines = [];
      for (let i = 0; i < sessions.length; i++) {
        const session = sessions[i];
        
        const routine = await tx.routine.create({
          data: {
            userId,
            programId: program.id,
            name: session.day_label || session.name,
            dayOfWeek: i + 1,
            sortOrder: i,
            routineItems: {
              create: session.exercises.map((ex: any, exIdx: number) => {
                // Find exercise in DB by name or use first available
                const match = dbExercises.find(
                  (dbEx) => dbEx.name.toLowerCase() === ex.name?.toLowerCase()
                ) || dbExercises[Math.floor(Math.random() * Math.min(dbExercises.length, 10))];

                return {
                  exerciseId: match.id,
                  sortOrder: exIdx,
                  targetSets: ex.sets || ex.targetSets || 3,
                  targetReps: parseInt(ex.reps || ex.targetReps) || 10,
                  targetRir: ex.rir || ex.targetRir || 2,
                  restSeconds: ex.rest_seconds || ex.restSeconds || 90,
                  notes: ex.notes,
                };
              }),
            },
          },
          include: {
            routineItems: {
              include: { exercise: true },
            },
          },
        });
        createdRoutines.push(routine);
      }

      return { program, routines: createdRoutines };
    });

    this.logger.log(`Routine created: ${routineName} (${generatedBy}) with ${result.routines.length} templates`);

    // Get template names for description
    const templateNames = sessions.map(s => s.day_label).join(', ');

    // 4. Format response for Flutter
    return {
      data: {
        routineId: result.routines[0]?.id ?? result.program.id,
        routineName,
        name: routineName,
        description: generatedBy === 'ai' 
          ? `An AI-powered personalized plan with ${templateCount} workout templates.`
          : `A personalized ${daysPerWeek}-day workout plan with templates: ${templateNames}.`,
        generatedBy,
        schedule: {
          daysPerWeek: templateCount,
          sessionDuration: 60,
        },
        routines: result.routines.slice(0, templateCount).map((r) => ({
          name: r.name,
          exercises: r.routineItems.map((item) => ({
            name: item.exercise.name,
            sets: item.targetSets,
            targetSets: item.targetSets,
            reps: item.targetReps,
            targetReps: item.targetReps,
          })),
        })),
      },
    };
  }

  /**
   * Build workout sessions from database exercises using rule-based logic.
   * This is the fallback when AI Coach is unavailable.
   * Generates templates based on training frequency.
   */
  private buildSessionsFromExercises(
    exercises: any[],
    daysPerWeek: number,
    goal?: string,
    level?: string,
  ): { day_label: string; exercises: { name: string; sets: number; reps: number; rir: number; rest_seconds: number }[] }[] {
    const sessions: { day_label: string; exercises: { name: string; sets: number; reps: number; rir: number; rest_seconds: number }[] }[] = [];
    
    // Get templates based on training frequency
    const templates = this.getTemplatesForFrequency(daysPerWeek);
    const scheme = this.getScheme(goal, level);

    // Group exercises by primary muscle
    const grouped: Record<string, any[]> = {};
    for (const ex of exercises) {
      const muscle = ex.primaryMuscles?.[0] ?? 'FULL_BODY';
      if (!grouped[muscle]) grouped[muscle] = [];
      grouped[muscle].push(ex);
    }

    for (const template of templates) {
      const dayExercises: { name: string; sets: number; reps: number; rir: number; rest_seconds: number }[] = [];

      for (const muscle of template.muscles) {
        const pool = grouped[muscle] || exercises.slice(0, 5);
        const count = Math.min(template.exPerMuscle, pool.length);
        
        for (let i = 0; i < count; i++) {
          const ex = pool[i % pool.length];
          dayExercises.push({
            name: ex.name,
            sets: scheme.sets,
            reps: scheme.reps,
            rir: scheme.rir,
            rest_seconds: scheme.rest,
          });
        }
      }

      // Cap at 6 exercises per day
      sessions.push({
        day_label: template.name,
        exercises: dayExercises.slice(0, 6),
      });
    }

    return sessions;
  }

  /**
   * Returns workout templates based on training frequency.
   * For 3 days: Push/Pull/Legs
   * For 4+ days: Push/Pull/Legs + Full or Upper
   */
  private getTemplatesForFrequency(daysPerWeek: number) {
    switch (daysPerWeek) {
      case 2:
        // Full Body A/B split
        return [
          { name: 'Full Body A', muscles: ['CHEST', 'BACK', 'QUADS', 'SHOULDERS', 'BICEPS'], exPerMuscle: 1 },
          { name: 'Full Body B', muscles: ['QUADS', 'HAMSTRINGS', 'GLUTES', 'CALVES', 'TRICEPS', 'ABS'], exPerMuscle: 1 },
        ];
      
      case 3:
        // Classic Push/Pull/Legs
        return [
          { name: 'Push Day', muscles: ['CHEST', 'SHOULDERS', 'TRICEPS'], exPerMuscle: 2 },
          { name: 'Pull Day', muscles: ['BACK', 'BICEPS', 'FOREARMS', 'LATS'], exPerMuscle: 2 },
          { name: 'Legs Day', muscles: ['QUADS', 'HAMSTRINGS', 'GLUTES', 'CALVES', 'ABS'], exPerMuscle: 1 },
        ];
      
      case 4:
        // Push/Pull/Legs + Upper
        return [
          { name: 'Push Day', muscles: ['CHEST', 'SHOULDERS', 'TRICEPS'], exPerMuscle: 2 },
          { name: 'Pull Day', muscles: ['BACK', 'BICEPS', 'FOREARMS', 'LATS'], exPerMuscle: 2 },
          { name: 'Legs Day', muscles: ['QUADS', 'HAMSTRINGS', 'GLUTES', 'CALVES'], exPerMuscle: 1 },
          { name: 'Upper Day', muscles: ['CHEST', 'BACK', 'SHOULDERS', 'BICEPS', 'TRICEPS'], exPerMuscle: 1 },
        ];
      
      case 5:
      case 6:
        // Advanced split
        return [
          { name: 'Push Day', muscles: ['CHEST', 'SHOULDERS', 'TRICEPS'], exPerMuscle: 2 },
          { name: 'Pull Day', muscles: ['BACK', 'BICEPS', 'FOREARMS', 'LATS'], exPerMuscle: 2 },
          { name: 'Legs Day', muscles: ['QUADS', 'HAMSTRINGS', 'GLUTES', 'CALVES'], exPerMuscle: 1 },
          { name: 'Upper Power', muscles: ['CHEST', 'BACK', 'SHOULDERS'], exPerMuscle: 2 },
          { name: 'Legs Hypertrophy', muscles: ['QUADS', 'HAMSTRINGS', 'GLUTES'], exPerMuscle: 2 },
        ];
      
      default:
        // Fallback to Push/Pull/Legs
        return [
          { name: 'Push Day', muscles: ['CHEST', 'SHOULDERS', 'TRICEPS'], exPerMuscle: 2 },
          { name: 'Pull Day', muscles: ['BACK', 'BICEPS', 'FOREARMS', 'LATS'], exPerMuscle: 2 },
          { name: 'Legs Day', muscles: ['QUADS', 'HAMSTRINGS', 'GLUTES', 'CALVES', 'ABS'], exPerMuscle: 1 },
        ];
    }
  }

  private calculateAge(dob: string): number {
    const birthday = new Date(dob);
    const ageDifMs = Date.now() - birthday.getTime();
    const ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  }

  // ── Routine generation helpers ──────────────────────────────────────────────

  private getDaysPerWeek(level?: string): number {
    switch (level) {
      case 'BEGINNER':   return 3;
      case 'IRREGULAR':  return 2;
      case 'MEDIUM':     return 4;
      case 'ADVANCED':   return 5;
      default:           return 3;
    }
  }

  private getRoutineName(goal?: string): string {
    switch (goal) {
      case 'LOSE_WEIGHT':       return 'Fat Burn Program';
      case 'KEEP_FIT':          return 'Fitness Maintenance Plan';
      case 'GET_STRONGER':      return 'Strength Builder Program';
      case 'GAIN_MUSCLE_MASS':  return 'Muscle Hypertrophy Plan';
      default:                  return 'AI Generated Routine';
    }
  }

  private buildDayPlans(
    exercises: any[],
    daysPerWeek: number,
    goal?: string,
    level?: string,
  ): { name: string; exercises: { id: string; targetSets: number; targetReps: number; targetRir: number; restSeconds: number }[] }[] {
    // Group exercises by primary muscle
    const grouped: Record<string, any[]> = {};
    for (const ex of exercises) {
      const muscle = ex.primaryMuscles?.[0] ?? 'FULL_BODY';
      if (!grouped[muscle]) grouped[muscle] = [];
      grouped[muscle].push(ex);
    }

    // Day templates based on days per week
    const dayTemplates = this.getDayTemplates(daysPerWeek);

    // Set/rep scheme based on goal
    const { sets, reps, rir, rest } = this.getScheme(goal, level);

    return dayTemplates.map((template) => ({
      name: template.name,
      exercises: template.muscles
        .flatMap((muscle) => {
          const pool = grouped[muscle] ?? exercises.slice(0, 3);
          return pool.slice(0, template.exPerMuscle).map((ex) => ({
            id: ex.id,
            targetSets: sets,
            targetReps: reps,
            targetRir: rir,
            restSeconds: rest,
          }));
        })
        .slice(0, 6), // Cap at 6 exercises per day
    }));
  }

  private getDayTemplates(days: number) {
    if (days <= 2) {
      return [
        { name: 'Full Body A', muscles: ['CHEST', 'BACK', 'QUADS', 'SHOULDERS'], exPerMuscle: 1 },
        { name: 'Full Body B', muscles: ['HAMSTRINGS', 'BICEPS', 'TRICEPS', 'ABS'], exPerMuscle: 1 },
      ];
    }
    if (days === 3) {
      return [
        { name: 'Push Day', muscles: ['CHEST', 'SHOULDERS', 'TRICEPS'], exPerMuscle: 2 },
        { name: 'Pull Day', muscles: ['BACK', 'BICEPS', 'FOREARMS'], exPerMuscle: 2 },
        { name: 'Legs Day', muscles: ['QUADS', 'HAMSTRINGS', 'GLUTES', 'CALVES'], exPerMuscle: 1 },
      ];
    }
    if (days === 4) {
      return [
        { name: 'Upper Push', muscles: ['CHEST', 'SHOULDERS', 'TRICEPS'], exPerMuscle: 2 },
        { name: 'Lower Body', muscles: ['QUADS', 'HAMSTRINGS', 'GLUTES', 'CALVES'], exPerMuscle: 1 },
        { name: 'Upper Pull', muscles: ['BACK', 'BICEPS', 'FOREARMS'], exPerMuscle: 2 },
        { name: 'Full Body', muscles: ['CHEST', 'BACK', 'QUADS', 'ABS'], exPerMuscle: 1 },
      ];
    }
    // 5+ days
    return [
      { name: 'Chest & Triceps', muscles: ['CHEST', 'TRICEPS'], exPerMuscle: 3 },
      { name: 'Back & Biceps', muscles: ['BACK', 'BICEPS'], exPerMuscle: 3 },
      { name: 'Legs', muscles: ['QUADS', 'HAMSTRINGS', 'GLUTES', 'CALVES'], exPerMuscle: 1 },
      { name: 'Shoulders & Arms', muscles: ['SHOULDERS', 'BICEPS', 'TRICEPS'], exPerMuscle: 2 },
      { name: 'Full Body + Core', muscles: ['CHEST', 'BACK', 'ABS', 'QUADS'], exPerMuscle: 1 },
    ];
  }

  /**
   * Returns training scheme based on scientific recommendations.
   * 
   * STRENGTH (1-6 reps):
   * - Lower reps, higher intensity
   * - 4-6 sets per exercise for neural adaptation
   * - RIR 1-2 (close to failure)
   * - Longer rest (2-3 min) for ATP-PCr recovery
   * 
   * HYPERTROPHY (6-12 reps):
   * - Moderate reps with mechanical tension
   * - 3-4 sets per exercise
   * - RIR 2-3
   * - 60-90s rest for metabolic stress
   * 
   * BODY COMPOSITION (8-15 reps):
   * - Higher reps for metabolic stress + calorie burn
   * - 2-3 sets per exercise
   * - RIR 3-4
   * - Shorter rest for cardiovascular effect
   * 
   * Volume adjustments by level:
   * - Beginner: Lower volume, focus on motor learning
   * - Intermediate: Moderate volume, growing适应性
   * - Advanced: Higher volume, specific to goals
   */
  private getScheme(goal?: string, level?: string) {
    const isBeginner = level === 'BEGINNER';
    const isIrregular = level === 'IRREGULAR';
    const isAdvanced = level === 'ADVANCED';
    const isNovice = isBeginner || isIrregular;
    
    switch (goal) {
      case 'GET_STRONGER':
        // Strength: Low reps, high sets, close to failure
        if (isNovice) {
          return { sets: 3, reps: 6, rir: 3, rest: 180 }; // Learning phase
        } else if (isAdvanced) {
          return { sets: 5, reps: 3, rir: 1, rest: 180 }; // Peaking
        } else {
          return { sets: 4, reps: 5, rir: 2, rest: 180 }; // Strength build
        }
      
      case 'GAIN_MUSCLE_MASS':
        // Hypertrophy: 6-12 rep range, moderate sets
        if (isNovice) {
          return { sets: 3, reps: 10, rir: 3, rest: 90 };
        } else if (isAdvanced) {
          return { sets: 4, reps: 8, rir: 2, rest: 90 };
        } else {
          return { sets: 4, reps: 10, rir: 2, rest: 90 };
        }
      
      case 'LOSE_WEIGHT':
        // Body composition: Higher reps, metabolic stress
        if (isNovice) {
          return { sets: 2, reps: 15, rir: 3, rest: 60 };
        } else {
          return { sets: 3, reps: 12, rir: 3, rest: 60 };
        }
      
      default: // KEEP_FIT
        // General fitness: Balanced approach
        if (isNovice) {
          return { sets: 2, reps: 12, rir: 3, rest: 90 };
        } else {
          return { sets: 3, reps: 10, rir: 2, rest: 90 };
        }
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

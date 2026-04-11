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
  private readonly aiCoachUrl: string; // Phase 3 — port 8001
  private readonly aiServiceSecret: string; // Service-to-service auth token
  private readonly requestTimeout = 180000; // 3 min for AI Coach LLM responses

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
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
   * Strategy:
   * 1. Try AI Coach service first (if available)
   * 2. Fall back to local rule-based generation if AI fails
   */
  async generateAndSaveRoutine(
    userId: string,
    dto: CoachRoutineRequestDto,
    authToken?: string,
  ): Promise<any> {
    this.logger.log(`Generating routine for user ${userId} with goal ${dto.goal}`);

    // 1. Fetch available exercises from DB (load full catalogue for name-based lookup)
    const dbExercises = await this.prisma.exercise.findMany({
      where: { isActive: true, isCustom: false },
      take: 500,
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

    // 2. Bypass AI Coach and use local science-based generation
    this.logger.log(`Generating local routine for ${daysPerWeek} days/week, goal: ${dto.goal}`);
    generatedBy = 'local';
    sessions = this.buildSessionsFromExercises(dbExercises, daysPerWeek, dto.goal, dto.level);

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
                const match =
                  dbExercises.find((dbEx) => dbEx.name.toLowerCase() === ex.name?.toLowerCase()) ||
                  dbExercises[Math.floor(Math.random() * Math.min(dbExercises.length, 10))];

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

    this.logger.log(
      `Routine created: ${routineName} (${generatedBy}) with ${result.routines.length} templates`,
    );

    // Get template names for description
    const templateNames = sessions.map((s) => s.day_label).join(', ');

    // 4. Format response for Flutter
    return {
      data: {
        routineId: result.routines[0]?.id ?? result.program.id,
        routineName,
        name: routineName,
        description:
          generatedBy === 'ai'
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
   * Build workout sessions from database exercises using science-based exercise selection.
   * This is the fallback when AI Coach is unavailable.
   *
   * KEY IMPROVEMENTS:
   * 1. STRICT muscle-based validation (no random fallback)
   * 2. VolumeTracker ensures minimum weekly volume per muscle
   * 3. 5-8 exercises per day (completeness validation)
   * 4. Post-generation volume gap filling
   *
   * Exercise ordering follows hypertrophy science:
   *   compound multi-joint first → isolation last
   *   vertical pull before horizontal pull
   *   large muscle group before small muscle group
   */
  private buildSessionsFromExercises(
    exercises: any[],
    daysPerWeek: number,
    goal?: string,
    level?: string,
  ): {
    day_label: string;
    exercises: { name: string; sets: number; reps: number; rir: number; rest_seconds: number }[];
  }[] {
    const trainingLevel = this.normalizeLevel(level);
    const dayPlans = this.getScienceBasedDayPlans(daysPerWeek, trainingLevel);

    // Index exercises by primary muscle for fast lookup
    const exercisesByMuscle = new Map<string, any[]>();
    for (const ex of exercises) {
      for (const muscle of ex.primaryMuscles || []) {
        if (!exercisesByMuscle.has(muscle)) {
          exercisesByMuscle.set(muscle, []);
        }
        exercisesByMuscle.get(muscle)!.push(ex);
      }
      // Also index by secondary muscles for fallback
      for (const muscle of ex.secondaryMuscles || []) {
        if (!exercisesByMuscle.has(muscle)) {
          exercisesByMuscle.set(muscle, []);
        }
        exercisesByMuscle.get(muscle)!.push(ex);
      }
    }

    const sessions: {
      day_label: string;
      exercises: { name: string; sets: number; reps: number; rir: number; rest_seconds: number }[];
    }[] = [];
    const allUsedIds = new Set<string>();

    // Process each day
    for (let dayIndex = 0; dayIndex < dayPlans.length; dayIndex++) {
      const day = dayPlans[dayIndex];
      const usedIds = new Set<string>(allUsedIds);
      const dayExercises: {
        name: string;
        sets: number;
        reps: number;
        rir: number;
        rest_seconds: number;
      }[] = [];

      // Select exercises for each slot with STRICT muscle validation
      for (let i = 0; i < day.exercises.length; i++) {
        const exEntry = day.exercises[i];
        const scheme = this.getScheme(goal, level, i);

        // STRICT: Find exercise by muscle target (primary then secondary)
        let match = this.findExerciseByMuscleStrict(
          exEntry.muscle,
          exercises,
          usedIds,
          exEntry.search,
        );

        if (match) {
          usedIds.add(match.id);
          allUsedIds.add(match.id);
          dayExercises.push({
            name: match.name,
            sets: scheme.sets,
            reps: scheme.reps,
            rir: scheme.rir,
            rest_seconds: scheme.rest,
          });
        } else {
          this.logger.warn(
            `No exercise found for muscle ${exEntry.muscle} (search: ${exEntry.search}) on day ${day.name}`,
          );
        }
      }

      // Ensure minimum 5 exercises per day (add isolations if needed)
      while (dayExercises.length < 5) {
        const fillerExercise = this.findFillerExercise(exercises, usedIds);
        if (fillerExercise) {
          usedIds.add(fillerExercise.id);
          allUsedIds.add(fillerExercise.id);
          const lastScheme = this.getScheme(goal, level, dayExercises.length);
          dayExercises.push({
            name: fillerExercise.name,
            sets: lastScheme.sets,
            reps: lastScheme.reps,
            rir: lastScheme.rir,
            rest_seconds: lastScheme.rest,
          });
        } else {
          break; // No more exercises available
        }
      }

      // Cap at 8 exercises maximum per day
      sessions.push({
        day_label: day.name,
        exercises: dayExercises.slice(0, 8),
      });
    }

    // Validate weekly volume coverage and fill gaps
    const volumeSummary = this.validateWeeklyVolume(sessions, exercisesByMuscle, allUsedIds);
    if (volumeSummary.missingMuscles.length > 0) {
      this.logger.warn(
        `Weekly volume gaps detected: ${volumeSummary.missingMuscles.join(', ')}. Adding filler exercises.`,
      );
      this.fillVolumeGaps(sessions, volumeSummary.missingMuscles, exercisesByMuscle, allUsedIds, goal, level);
    }

    this.logger.log(
      `Generated ${sessions.length} sessions with exercises: ${sessions.map((s) => s.exercises.length).join(', ')}`,
    );

    return sessions;
  }

  /**
   * STRICT muscle-based exercise finding.
   * Priority: 1) Name match, 2) Primary muscle match, 3) Secondary muscle match
   * Returns null if no match found (NO random fallback).
   */
  private findExerciseByMuscleStrict(
    muscle: string,
    exercises: any[],
    usedIds: Set<string>,
    nameSearch?: string,
  ): any | null {
    const available = exercises.filter((e) => !usedIds.has(e.id));

    // 1. Name-based match (if search term provided)
    if (nameSearch) {
      const nameMatch = available.find((e) =>
        e.name.toLowerCase().includes(nameSearch.toLowerCase()),
      );
      if (nameMatch) return nameMatch;
    }

    // 2. Primary muscle match
    const primaryMatch = available.find((e) =>
      (e.primaryMuscles || []).some((m: string) => m.toUpperCase() === muscle.toUpperCase()),
    );
    if (primaryMatch) return primaryMatch;

    // 3. Secondary muscle match
    const secondaryMatch = available.find((e) =>
      (e.secondaryMuscles || []).some((m: string) => m.toUpperCase() === muscle.toUpperCase()),
    );
    if (secondaryMatch) return secondaryMatch;

    return null; // NO random fallback
  }

  /**
   * Find any unused isolation exercise as filler.
   */
  private findFillerExercise(exercises: any[], usedIds: Set<string>): any | null {
    const available = exercises.filter(
      (e) => !usedIds.has(e.id) && !e.isCompound,
    );
    if (available.length === 0) {
      // Fallback to any unused exercise
      const anyAvailable = exercises.find((e) => !usedIds.has(e.id));
      return anyAvailable || null;
    }
    return available[Math.floor(Math.random() * available.length)];
  }

  /**
   * Validate weekly volume coverage across all sessions.
   * Returns list of muscles that haven't reached minimum volume.
   */
  private validateWeeklyVolume(
    sessions: { exercises: { name: string }[] }[],
    exercisesByMuscle: Map<string, any[]>,
    usedIds: Set<string>,
  ): { missingMuscles: string[]; volumeByMuscle: Record<string, number> } {
    // Count sets per muscle (assume 3 sets per exercise for estimation)
    const volumeByMuscle: Record<string, number> = {};
    const musclesTracked = new Set<string>();

    for (const session of sessions) {
      const dayMuscles = new Set<string>();
      for (const ex of session.exercises) {
        // Find exercise in index
        for (const [muscle, exList] of exercisesByMuscle.entries()) {
          const match = exList.find((e) => e.name === ex.name);
          if (match && !dayMuscles.has(muscle)) {
            volumeByMuscle[muscle] = (volumeByMuscle[muscle] || 0) + 3; // 3 sets estimate
            dayMuscles.add(muscle);
            musclesTracked.add(muscle);
          }
        }
      }
    }

    // Check against minimums
    const missingMuscles: string[] = [];
    const minimums: Record<string, number> = {
      CHEST: 10,
      BACK: 10,
      QUADS: 12,
      SHOULDERS: 8,
      BICEPS: 6,
      TRICEPS: 6,
      HAMSTRINGS: 8,
      GLUTES: 8,
      CALVES: 4,
      ABS: 4,
      LATS: 8,
      TRAPS: 6,
    };

    for (const [muscle, minSets] of Object.entries(minimums)) {
      const current = volumeByMuscle[muscle] || 0;
      if (current < minSets) {
        missingMuscles.push(muscle);
      }
    }

    return { missingMuscles, volumeByMuscle };
  }

  /**
   * Fill volume gaps by adding exercises to existing sessions.
   */
  private fillVolumeGaps(
    sessions: {
      day_label: string;
      exercises: { name: string; sets: number; reps: number; rir: number; rest_seconds: number }[];
    }[],
    missingMuscles: string[],
    exercisesByMuscle: Map<string, any[]>,
    usedIds: Set<string>,
    goal?: string,
    level?: string,
  ): void {
    for (const muscle of missingMuscles) {
      const available = exercisesByMuscle.get(muscle)?.filter((e) => !usedIds.has(e.id)) || [];
      if (available.length === 0) continue;

      // Add to a session that has < 8 exercises
      for (const session of sessions) {
        if (session.exercises.length >= 8) continue;

        const filler = available.shift();
        if (filler) {
          const scheme = this.getScheme(goal, level, session.exercises.length);
          session.exercises.push({
            name: filler.name,
            sets: scheme.sets,
            reps: scheme.reps,
            rir: scheme.rir,
            rest_seconds: scheme.rest,
          });
          usedIds.add(filler.id);
        }
      }
    }
  }

  /**
   * Normalises the raw onboarding level string into a unified tier.
   * Maps to the level keys used in getScienceBasedDayPlans.
   */
  private normalizeLevel(level?: string): 'beginner' | 'intermediate' | 'advanced' {
    if (level === 'BEGINNER' || level === 'IRREGULAR') return 'beginner';
    if (level === 'ADVANCED') return 'advanced';
    return 'intermediate'; // MEDIUM or unknown
  }

  /**
   * Science-based exercise selection per training day and experience level.
   *
   * Each entry has:
   *   search  — substring to match against exercise.name (case-insensitive)
   *   muscle  — primaryMuscles fallback key when DB name search misses
   *
   * Notes:
   *   "High Cable Curl"       → Bayesian curl equivalent (constant tension, elbow behind body)
   *   "Straight-Arm Pulldown" → cable pullover equivalent (lat isolation, long head)
   *   "Hip Abduction Machine" → glute-medius / abductor focus
   */
  private getScienceBasedDayPlans(
    daysPerWeek: number,
    level: 'beginner' | 'intermediate' | 'advanced',
  ): { name: string; exercises: { search: string; muscle: string }[] }[] {
    // ── Push Day ────────────────────────────────────────────────────────────
    const pushDay = {
      beginner: [
        { search: 'Machine Chest Press', muscle: 'CHEST' }, // stable, no balance demand
        { search: 'Incline Machine Press', muscle: 'CHEST' }, // upper chest volume
        { search: 'Pec Deck', muscle: 'CHEST' }, // safe chest isolation
        { search: 'Machine Lateral Raise', muscle: 'SHOULDERS' }, // guided ROM
        { search: 'Tricep Pushdown', muscle: 'TRICEPS' }, // cable, elbow-friendly
      ],
      intermediate: [
        { search: 'Incline Dumbbell Press', muscle: 'CHEST' }, // free weight, more ROM
        { search: 'Machine Chest Press', muscle: 'CHEST' }, // mechanical tension
        { search: 'Pec Deck', muscle: 'CHEST' }, // peak contraction
        { search: 'Lateral Raise', muscle: 'SHOULDERS' }, // dumbbell, proprioception
        { search: 'Cable Overhead Extension', muscle: 'TRICEPS' }, // long head, constant tension
      ],
      advanced: [
        { search: 'Incline Dumbbell Press', muscle: 'CHEST' },
        { search: 'Machine Chest Press', muscle: 'CHEST' },
        { search: 'Pec Deck', muscle: 'CHEST' },
        { search: 'Cable Lateral Raise', muscle: 'SHOULDERS' }, // constant tension curve
        { search: 'Cable Overhead Extension', muscle: 'TRICEPS' }, // long head emphasis
        { search: 'Rope Pushdown', muscle: 'TRICEPS' }, // lateral head volume
      ],
    };

    // ── Pull Day ────────────────────────────────────────────────────────────
    const pullDay = {
      beginner: [
        { search: 'Lat Pulldown', muscle: 'LATS' }, // vertical pull, guided
        { search: 'Seated Cable Row', muscle: 'BACK' }, // horizontal pull, cable
        { search: 'Straight-Arm Pulldown', muscle: 'LATS' }, // cable pullover motion
        { search: 'Cable Face Pull', muscle: 'SHOULDERS' }, // rear delt + shoulder health
        { search: 'Cable Curl', muscle: 'BICEPS' }, // cable, constant tension
      ],
      intermediate: [
        { search: 'Wide-Grip Lat Pulldown', muscle: 'LATS' }, // wider lat activation
        { search: 'Barbell Row', muscle: 'BACK' }, // free weight compound
        { search: 'Straight-Arm Pulldown', muscle: 'LATS' }, // lat isolation / pullover equiv
        { search: 'Cable Face Pull', muscle: 'SHOULDERS' },
        { search: 'High Cable Curl', muscle: 'BICEPS' }, // Bayesian curl equiv
      ],
      advanced: [
        { search: 'Pull-Up', muscle: 'LATS' }, // bodyweight vertical
        { search: 'Barbell Row', muscle: 'BACK' }, // horizontal compound
        { search: 'Wide-Grip Lat Pulldown', muscle: 'LATS' }, // additional lat volume
        { search: 'Straight-Arm Pulldown', muscle: 'LATS' }, // lat isolation
        { search: 'Cable Face Pull', muscle: 'SHOULDERS' },
        { search: 'High Cable Curl', muscle: 'BICEPS' }, // Bayesian curl equiv
      ],
    };

    // ── Legs Day ────────────────────────────────────────────────────────────
    const legsDay = {
      beginner: [
        { search: 'Leg Press', muscle: 'QUADS' }, // machine squat pattern
        { search: 'Hack Squat Machine', muscle: 'QUADS' }, // guided squat ROM
        { search: 'Leg Extension', muscle: 'QUADS' }, // quad isolation
        { search: 'Seated Leg Curl', muscle: 'HAMSTRINGS' }, // hamstring isolation
        { search: 'Hip Thrust Machine', muscle: 'GLUTES' }, // glute isolation, safe
        { search: 'Standing Calf Raise', muscle: 'CALVES' },
      ],
      intermediate: [
        { search: 'Hack Squat Machine', muscle: 'QUADS' }, // quad emphasis squat
        { search: 'Leg Extension', muscle: 'QUADS' },
        { search: 'Seated Leg Curl', muscle: 'HAMSTRINGS' },
        { search: 'Hip Thrust', muscle: 'GLUTES' }, // barbell, higher load
        { search: 'Hip Abduction Machine', muscle: 'GLUTES' }, // glute med / abductor
        { search: 'Standing Calf Raise', muscle: 'CALVES' },
      ],
      advanced: [
        { search: 'Barbell Squat', muscle: 'QUADS' }, // free weight compound
        { search: 'Hack Squat Machine', muscle: 'QUADS' }, // additional quad volume
        { search: 'Leg Extension', muscle: 'QUADS' },
        { search: 'Seated Leg Curl', muscle: 'HAMSTRINGS' },
        { search: 'Hip Thrust', muscle: 'GLUTES' },
        { search: 'Hip Abduction Machine', muscle: 'GLUTES' },
        { search: 'Standing Calf Raise', muscle: 'CALVES' },
      ],
    };

    // ── Upper Day (4-day split) ─────────────────────────────────────────────
    // Balanced push/pull — compound first, isolation after, arms last
    const upperDay = {
      beginner: [
        { search: 'Machine Chest Press', muscle: 'CHEST' },
        { search: 'Lat Pulldown', muscle: 'LATS' },
        { search: 'Pec Deck', muscle: 'CHEST' },
        { search: 'Seated Cable Row', muscle: 'BACK' },
        { search: 'Machine Lateral Raise', muscle: 'SHOULDERS' },
        { search: 'Tricep Pushdown', muscle: 'TRICEPS' },
        { search: 'Cable Curl', muscle: 'BICEPS' },
      ],
      intermediate: [
        { search: 'Incline Dumbbell Press', muscle: 'CHEST' },
        { search: 'Barbell Row', muscle: 'BACK' },
        { search: 'Pec Deck', muscle: 'CHEST' },
        { search: 'Wide-Grip Lat Pulldown', muscle: 'LATS' },
        { search: 'High Cable Curl', muscle: 'BICEPS' }, // Bayesian equiv
        { search: 'Rope Pushdown', muscle: 'TRICEPS' },
        { search: 'Lateral Raise', muscle: 'SHOULDERS' },
      ],
      advanced: [
        { search: 'Incline Dumbbell Press', muscle: 'CHEST' },
        { search: 'Barbell Row', muscle: 'BACK' },
        { search: 'Pec Deck', muscle: 'CHEST' },
        { search: 'Wide-Grip Lat Pulldown', muscle: 'LATS' },
        { search: 'High Cable Curl', muscle: 'BICEPS' },
        { search: 'Cable Overhead Extension', muscle: 'TRICEPS' },
        { search: 'Cable Lateral Raise', muscle: 'SHOULDERS' },
      ],
    };

    // ── Full Body A (2-day split) ────────────────────────────────────────────
    const fullBodyA = {
      beginner: [
        { search: 'Leg Press', muscle: 'QUADS' },
        { search: 'Machine Chest Press', muscle: 'CHEST' },
        { search: 'Lat Pulldown', muscle: 'LATS' },
        { search: 'Seated Overhead Press', muscle: 'SHOULDERS' },
        { search: 'Seated Leg Curl', muscle: 'HAMSTRINGS' },
      ],
      intermediate: [
        { search: 'Hack Squat Machine', muscle: 'QUADS' },
        { search: 'Incline Dumbbell Press', muscle: 'CHEST' },
        { search: 'Barbell Row', muscle: 'BACK' },
        { search: 'Overhead Press', muscle: 'SHOULDERS' },
        { search: 'Seated Leg Curl', muscle: 'HAMSTRINGS' },
      ],
      advanced: [
        { search: 'Barbell Squat', muscle: 'QUADS' },
        { search: 'Incline Dumbbell Press', muscle: 'CHEST' },
        { search: 'Barbell Row', muscle: 'BACK' },
        { search: 'Overhead Press', muscle: 'SHOULDERS' },
        { search: 'Seated Leg Curl', muscle: 'HAMSTRINGS' },
      ],
    };

    // ── Full Body B (2-day split) ────────────────────────────────────────────
    const fullBodyB = {
      beginner: [
        { search: 'Hip Thrust Machine', muscle: 'GLUTES' },
        { search: 'Machine Chest Press', muscle: 'CHEST' },
        { search: 'Seated Cable Row', muscle: 'BACK' },
        { search: 'Machine Lateral Raise', muscle: 'SHOULDERS' },
        { search: 'Leg Extension', muscle: 'QUADS' },
      ],
      intermediate: [
        { search: 'Hip Thrust', muscle: 'GLUTES' },
        { search: 'Machine Chest Press', muscle: 'CHEST' },
        { search: 'Wide-Grip Lat Pulldown', muscle: 'LATS' },
        { search: 'Lateral Raise', muscle: 'SHOULDERS' },
        { search: 'Leg Extension', muscle: 'QUADS' },
      ],
      advanced: [
        { search: 'Hip Thrust', muscle: 'GLUTES' },
        { search: 'Machine Chest Press', muscle: 'CHEST' },
        { search: 'Wide-Grip Lat Pulldown', muscle: 'LATS' },
        { search: 'Cable Lateral Raise', muscle: 'SHOULDERS' },
        { search: 'Leg Extension', muscle: 'QUADS' },
      ],
    };

    // ── Assemble per frequency ───────────────────────────────────────────────
    switch (daysPerWeek) {
      case 2:
        return [
          { name: 'Full Body A', exercises: fullBodyA[level] },
          { name: 'Full Body B', exercises: fullBodyB[level] },
        ];

      case 3:
        return [
          { name: 'Push Day', exercises: pushDay[level] },
          { name: 'Pull Day', exercises: pullDay[level] },
          { name: 'Legs Day', exercises: legsDay[level] },
        ];

      case 4:
        return [
          { name: 'Push Day', exercises: pushDay[level] },
          { name: 'Pull Day', exercises: pullDay[level] },
          { name: 'Legs Day', exercises: legsDay[level] },
          { name: 'Upper Day', exercises: upperDay[level] },
        ];

      case 5:
      case 6:
        return [
          { name: 'Push Day', exercises: pushDay[level] },
          { name: 'Pull Day', exercises: pullDay[level] },
          { name: 'Legs Day', exercises: legsDay[level] },
          { name: 'Upper Day', exercises: upperDay[level] },
          { name: 'Legs Hypertrophy', exercises: legsDay[level] }, // second leg stimulus
        ];

      default:
        return [
          { name: 'Push Day', exercises: pushDay[level] },
          { name: 'Pull Day', exercises: pullDay[level] },
          { name: 'Legs Day', exercises: legsDay[level] },
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
      case 'BEGINNER':
        return 3;
      case 'IRREGULAR':
        return 2;
      case 'MEDIUM':
        return 4;
      case 'ADVANCED':
        return 5;
      default:
        return 3;
    }
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
  private getScheme(goal?: string, level?: string, index: number = 0) {
    const isBeginner = level === 'BEGINNER';
    const isIrregular = level === 'IRREGULAR';
    const isAdvanced = level === 'ADVANCED';
    const isNovice = isBeginner || isIrregular;

    // First 3 exercises are "compounds", the rest are "isolations"
    const isCompound = index < 3;

    switch (goal) {
      case 'GET_STRONGER':
        if (isCompound) {
          return isNovice
            ? { sets: 3, reps: 8, rir: 3, rest: 120 }
            : { sets: 3, reps: 6, rir: 1, rest: 180 };
        } else {
          return { sets: 2, reps: 10, rir: 2, rest: 90 };
        }

      case 'GAIN_MUSCLE_MASS':
        if (isCompound) {
          return isNovice
            ? { sets: 3, reps: 10, rir: 3, rest: 90 }
            : { sets: 3, reps: 8, rir: 2, rest: 90 };
        } else {
          return { sets: 2, reps: 12, rir: 2, rest: 60 };
        }

      case 'LOSE_WEIGHT':
        if (isCompound) {
          return { sets: 3, reps: 10, rir: 3, rest: 60 };
        } else {
          return { sets: 2, reps: 15, rir: 3, rest: 45 };
        }

      default: // KEEP_FIT
        if (isCompound) {
          return { sets: 3, reps: 10, rir: 2, rest: 90 };
        } else {
          return { sets: 2, reps: 12, rir: 2, rest: 60 };
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

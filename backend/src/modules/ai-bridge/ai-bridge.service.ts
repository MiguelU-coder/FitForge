// src/modules/ai-bridge/ai-bridge.service.ts
import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, timeout, catchError, retry } from 'rxjs';
import { AxiosError } from 'axios';
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
} from './dto/ai-request.dto';

@Injectable()
export class AiBridgeService {
  private readonly logger = new Logger(AiBridgeService.name);
  private readonly aiBaseUrl: string;
  private readonly aiCoachUrl: string;    // Phase 3 — port 8001
  private readonly requestTimeout = 60000; // Increased to 60s for local LLM calls

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    this.aiBaseUrl   = config.get<string>('AI_SERVICE_URL',   'http://localhost:8000');
    this.aiCoachUrl  = config.get<string>('AI_COACH_URL',     'http://localhost:8001');
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
   * Internal helper for AI Coach (Phase 3) calls.
   */
  private async _callCoachService(url: string, dto: any, authToken?: string): Promise<any> {
    try {
      const { data } = await firstValueFrom(
        this.http
          .post(url, dto, {
            headers: {
              ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
              'Content-Type': 'application/json',
            },
            timeout: this.requestTimeout,
          })
          .pipe(
            timeout(this.requestTimeout),
            retry({ count: 1, delay: 1000 }),
            catchError((err: AxiosError) => {
              this.logger.error(`AI Coach error on ${url}: ${err.message}`, err.response?.data);
              throw new HttpException(
                `AI Coach unavailable: ${err.message}`,
                err.response?.status ?? HttpStatus.SERVICE_UNAVAILABLE,
              );
            }),
          ),
      );
      return data;
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new HttpException('AI Coach request failed', HttpStatus.SERVICE_UNAVAILABLE);
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

import { Controller, Post, Body, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { AiBridgeService } from './ai-bridge.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../auth/strategies/jwt.strategy';
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

@Controller('ai')
export class AiBridgeController {
  constructor(private readonly aiBridgeService: AiBridgeService) {}

  private extractToken(req: Request): string {
    // Expecting "Bearer <token>"
    const auth = req.headers.authorization ?? '';
    return auth.startsWith('Bearer ') ? auth.substring(7) : auth;
  }

  /** Progressive overload recommendation */
  @Throttle({ default: { ttl: 60000, limit: 20 }, ai: { ttl: 60000, limit: 20 } })
  @Post('progression')
  @HttpCode(HttpStatus.OK)
  async progression(@Body() dto: ProgressionRequestDto, @Req() req: Request) {
    return this.aiBridgeService.getProgressionRecommendation(dto, this.extractToken(req));
  }

  /** Real-time next-set suggestion (called during active workout) */
  @Throttle({ default: { ttl: 60000, limit: 30 }, ai: { ttl: 60000, limit: 30 } })
  @Post('suggestion')
  @HttpCode(HttpStatus.OK)
  async suggestion(@Body() dto: WorkoutSuggestionRequestDto, @Req() req: Request) {
    return this.aiBridgeService.getNextSetSuggestion(dto, this.extractToken(req));
  }

  /** Weekly volume MEV/MAV/MRV analysis */
  @Throttle({ default: { ttl: 60000, limit: 30 }, ai: { ttl: 60000, limit: 30 } })
  @Post('volume')
  @HttpCode(HttpStatus.OK)
  async volume(@Body() dto: VolumeAnalysisRequestDto, @Req() req: Request) {
    return this.aiBridgeService.getVolumeAnalysis(dto, this.extractToken(req));
  }

  /** Accumulated fatigue assessment */
  @Throttle({ default: { ttl: 60000, limit: 30 }, ai: { ttl: 60000, limit: 30 } })
  @Post('fatigue')
  @HttpCode(HttpStatus.OK)
  async fatigue(@Body() dto: FatigueRequestDto, @Req() req: Request) {
    return this.aiBridgeService.getFatigueAssessment(dto, this.extractToken(req));
  }

  /** Muscle recovery prediction */
  @Throttle({ default: { ttl: 60000, limit: 30 }, ai: { ttl: 60000, limit: 30 } })
  @Post('recovery')
  @HttpCode(HttpStatus.OK)
  async recovery(@Body() dto: RecoveryRequestDto, @Req() req: Request) {
    return this.aiBridgeService.getRecoveryPrediction(dto, this.extractToken(req));
  }

  /** Injury risk assessment */
  @Throttle({ default: { ttl: 60000, limit: 30 }, ai: { ttl: 60000, limit: 30 } })
  @Post('injury-risk')
  @HttpCode(HttpStatus.OK)
  async injuryRisk(@Body() dto: InjuryRiskRequestDto, @Req() req: Request) {
    return this.aiBridgeService.getInjuryRiskAssessment(dto, this.extractToken(req));
  }

  /** PR prediction */
  @Throttle({ default: { ttl: 60000, limit: 30 }, ai: { ttl: 60000, limit: 30 } })
  @Post('pr-prediction')
  @HttpCode(HttpStatus.OK)
  async prPrediction(@Body() dto: PRPredictionRequestDto, @Req() req: Request) {
    return this.aiBridgeService.getPRPrediction(dto, this.extractToken(req));
  }

  /**
   * Phase 3 — LLM-powered AI Coach
   * Forwards to ai-services on port 8001.
   */
  @Throttle({ default: { ttl: 60000, limit: 15 }, ai: { ttl: 60000, limit: 15 } })
  @Post('coach')
  @HttpCode(HttpStatus.OK)
  async coachAnalyze(@Body() dto: CoachAnalyzeRequestDto, @Req() req: Request) {
    return this.aiBridgeService.getCoachAnalysis(dto, this.extractToken(req));
  }

  /**
   * Phase 3 — LLM-powered AI Coach Session Summary
   */
  @Throttle({ default: { ttl: 60000, limit: 15 }, ai: { ttl: 60000, limit: 15 } })
  @Post('coach/session')
  @HttpCode(HttpStatus.OK)
  async coachSession(@Body() dto: SessionCoachAnalyzeRequestDto, @Req() req: Request) {
    return this.aiBridgeService.getSessionSummary(dto, this.extractToken(req));
  }

  /**
   * Generate and save a personalized workout routine based on user profile.
   * Called from Flutter onboarding flow.
   */
  @Throttle({ default: { ttl: 60000, limit: 10 }, ai: { ttl: 60000, limit: 10 } })
  @Post('coach/routine')
  @HttpCode(HttpStatus.OK)
  async coachRoutine(
    @Body() dto: CoachRoutineRequestDto,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    console.log('--- AI COACH ROUTINE REQUEST START ---');
    console.log(`User: ${user?.id}, Goal: ${dto.goal}`);

    // Pass user token for AI service to identify the user
    const userToken = this.extractToken(req);
    const result = await this.aiBridgeService.generateAndSaveRoutine(user.id, dto, userToken);

    console.log('--- AI COACH ROUTINE REQUEST END ---');
    return result;
  }
}

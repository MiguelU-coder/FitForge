// src/modules/analytics/analytics.module.ts
import { Module, Injectable, Controller, Get, Query, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { AuthUser } from '../auth/strategies/jwt.strategy';
import { z } from 'zod';

// ── DTOs ──────────────────────────────────────────────────────────────────────

const GetVolumeSummarySchema = z.object({
  weeks: z.coerce.number().int().min(1).max(12).default(4),
});
type GetVolumeSummaryDto = z.infer<typeof GetVolumeSummarySchema>;

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get volume summary for the last N weeks
   */
  async getVolumeSummary(userId: string, weeks: number) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - weeks * 7);

    const summaries = await this.prisma.weeklyVolumeSummary.findMany({
      where: {
        userId,
        weekStart: { gte: startDate },
      },
      orderBy: { weekStart: 'asc' },
    });

    // Calculate totals
    const totalVolume = summaries.reduce((sum, s) => sum + Number(s.totalVolumeKg), 0);
    const totalSets = summaries.reduce((sum, s) => sum + s.totalSets, 0);
    const avgRir =
      summaries.length > 0
        ? summaries.reduce((sum, s) => sum + Number(s.avgRir || 0), 0) / summaries.length
        : null;

    // Group by muscle
    const byMuscle: Record<string, { sets: number; volume: number }> = {};
    for (const s of summaries) {
      const mg = s.muscleGroup;
      if (!byMuscle[mg]) {
        byMuscle[mg] = { sets: 0, volume: 0 };
      }
      byMuscle[mg].sets += s.totalSets;
      byMuscle[mg].volume += Number(s.totalVolumeKg);
    }

    return {
      weeks,
      startDate,
      summaries,
      totals: {
        volumeKg: Math.round(totalVolume * 100) / 100,
        totalSets,
        avgRir: avgRir ? Math.round(avgRir * 10) / 10 : null,
        sessionCount: summaries.reduce((sum, s) => sum + s.sessionCount, 0),
      },
      byMuscle,
    };
  }

  /**
   * Get personal records for a user
   */
  async getPersonalRecords(userId: string, exerciseId?: string) {
    const where: any = { userId };
    if (exerciseId) where.exerciseId = exerciseId;

    const records = await this.prisma.personalRecord.findMany({
      where,
      include: {
        exercise: {
          select: { id: true, name: true, primaryMuscles: true, equipment: true },
        },
      },
      orderBy: { achievedAt: 'desc' },
    });

    return records;
  }

  /**
   * Get workout streak
   */
  async getWorkoutStreak(userId: string) {
    const sessions = await this.prisma.workoutSession.findMany({
      where: { userId, finishedAt: { not: null } },
      select: { startedAt: true },
      orderBy: { startedAt: 'desc' },
      take: 100,
    });

    if (sessions.length === 0) {
      return { currentStreak: 0, longestStreak: 0, totalWorkouts: 0 };
    }

    // Calculate current streak
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let lastDate: Date | null = null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const session of sessions) {
      const sessionDate = new Date(session.startedAt);
      sessionDate.setHours(0, 0, 0, 0);

      if (!lastDate) {
        const daysDiff = Math.floor(
          (today.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24),
        );
        if (daysDiff <= 1) {
          tempStreak = 1;
          currentStreak = 1;
        }
      } else {
        const daysDiff = Math.floor(
          (lastDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24),
        );
        if (daysDiff === 1) {
          tempStreak++;
          if (currentStreak > 0) currentStreak = tempStreak;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
          if (currentStreak > 0 && daysDiff > 1) currentStreak = 0;
        }
      }
      lastDate = sessionDate;
    }

    longestStreak = Math.max(longestStreak, tempStreak);

    return {
      currentStreak,
      longestStreak,
      totalWorkouts: sessions.length,
    };
  }

  /**
   * Get training frequency (days per week)
   */
  async getTrainingFrequency(userId: string, weeks: number = 4) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - weeks * 7);

    const sessions = await this.prisma.workoutSession.findMany({
      where: {
        userId,
        startedAt: { gte: startDate },
        finishedAt: { not: null },
      },
      select: { startedAt: true },
    });

    // Count sessions per week
    const byWeek: Record<string, number> = {};
    for (const session of sessions) {
      const weekStart = this.getWeekStart(session.startedAt);
      byWeek[weekStart] = (byWeek[weekStart] || 0) + 1;
    }

    const avgPerWeek = sessions.length / weeks;

    return {
      weeks,
      totalSessions: sessions.length,
      avgPerWeek: Math.round(avgPerWeek * 10) / 10,
      byWeek,
    };
  }

  private getWeekStart(date: Date): string {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return d.toISOString().split('T')[0];
  }
}

// ── Controller ────────────────────────────────────────────────────────────────

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('volume-summary')
  getVolumeSummary(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe(GetVolumeSummarySchema)) query: GetVolumeSummaryDto,
  ) {
    return this.analyticsService.getVolumeSummary(user.id, query.weeks);
  }

  @Get('personal-records')
  getPersonalRecords(@CurrentUser() user: AuthUser, @Query('exerciseId') exerciseId?: string) {
    return this.analyticsService.getPersonalRecords(user.id, exerciseId);
  }

  @Get('streak')
  getWorkoutStreak(@CurrentUser() user: AuthUser) {
    return this.analyticsService.getWorkoutStreak(user.id);
  }

  @Get('frequency')
  getTrainingFrequency(@CurrentUser() user: AuthUser, @Query('weeks') weeks?: string) {
    const weeksNum = weeks ? parseInt(weeks, 10) : 4;
    return this.analyticsService.getTrainingFrequency(user.id, weeksNum);
  }
}

// ── Module ────────────────────────────────────────────────────────────────────

@Module({
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}

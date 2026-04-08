import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PrismaService } from '../../database/prisma.service';

@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationRoutinesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(':id/routines')
  async getRoutines(@Param('id') organizationId: string, @Request() req: any) {
    const routines = await this.prisma.routine.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: routines.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.name,
        duration: `${r.dayOfWeek || 1} días/semana`,
        workoutsCount: 0,
        createdAt: r.createdAt,
        goal: null,
        difficulty: 'intermediate',
      })),
    };
  }

  @Post(':id/routines')
  async createRoutine(
    @Param('id') organizationId: string,
    @Body()
    body: {
      name: string;
      description?: string;
      duration?: string;
      difficulty?: string;
      goal?: string;
    },
    @Request() req: any,
  ) {
    const userId = req.user?.id;

    const routine = await this.prisma.routine.create({
      data: {
        name: body.name,
        userId,
        organizationId,
      },
    });

    return {
      success: true,
      data: {
        id: routine.id,
        name: routine.name,
        description: routine.name,
        duration: '3 días/semana',
        workoutsCount: 0,
        createdAt: routine.createdAt,
        goal: body.goal || 'strength',
        difficulty: body.difficulty || 'intermediate',
      },
    };
  }

  @Get(':id/routines/:routineId')
  async getRoutineDetails(
    @Param('id') organizationId: string,
    @Param('routineId') routineId: string,
    @Request() req: any,
  ) {
    const routine = await this.prisma.routine.findUnique({
      where: { id: routineId },
      include: {
        routineItems: {
          include: {
            exercise: true,
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!routine || routine.organizationId !== organizationId) {
      return { success: false, message: 'Routine not found' };
    }

    return {
      success: true,
      data: routine,
    };
  }

  @Post(':id/routines/:routineId/assign')
  async assignRoutineToMember(
    @Param('id') organizationId: string,
    @Param('routineId') routineId: string,
    @Body()
    body: {
      memberId: string;
      startsAt?: string;
      endsAt?: string;
      notes?: string;
    },
    @Request() req: any,
  ) {
    const userId = req.user?.id;

    const existing = await this.prisma.userRoutineAssignment.findFirst({
      where: {
        userId: body.memberId,
        programId: routineId,
        organizationId,
      },
    });

    if (existing) {
      if (!existing.isActive) {
        await this.prisma.userRoutineAssignment.update({
          where: { id: existing.id },
          data: {
            isActive: true,
            startsAt: body.startsAt ? new Date(body.startsAt) : null,
            endsAt: body.endsAt ? new Date(body.endsAt) : null,
            notes: body.notes,
          },
        });
      }
      return {
        success: true,
        message: 'Routine already assigned, reactivated',
      };
    }

    const assignment = await this.prisma.userRoutineAssignment.create({
      data: {
        organizationId,
        userId: body.memberId,
        programId: routineId,
        assignedBy: userId,
        startsAt: body.startsAt ? new Date(body.startsAt) : null,
        endsAt: body.endsAt ? new Date(body.endsAt) : null,
        notes: body.notes,
      },
    });

    return {
      success: true,
      data: assignment,
    };
  }
}

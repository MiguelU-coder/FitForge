import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Patch,
  Query,
  Delete,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PrismaService } from '../../database/prisma.service';
import * as argon2 from 'argon2';
import { UserRole } from '@prisma/client';

import { OrganizationsService } from './organizations.service';

@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationMembersController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly organizationsService: OrganizationsService,
  ) {}

  @Get(':id/members')
  async getMembers(
    @Param('id') organizationId: string,
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('includeStats') includeStats?: string,
    @Query('includeSubscription') includeSubscription?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Request() req?: any,
  ) {
    const where: any = { organizationId };

    if (role && ['ORG_ADMIN', 'TRAINER', 'CLIENT'].includes(role)) {
      where.role = role;
    }

    if (status && ['active', 'inactive', 'suspended'].includes(status)) {
      where.user = { ...where.user, subscriptionStatus: status };
    }

    if (search) {
      where.user = {
        ...where.user,
        OR: [
          { displayName: { ilike: `%${search}%` } },
          { email: { ilike: `%${search}%` } },
        ],
      };
    }

    const take = limit ? parseInt(limit) : 100;
    const skip = offset ? parseInt(offset) : 0;

    const members = await this.prisma.userOrganization.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            email: true,
            avatarUrl: true,
            phoneNumber: true,
            createdAt: true,
            subscriptionStatus: true,
            subscriptionPlanId: true,
            subscriptionCurrentPeriodEnd: true,
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
      take,
      skip,
    });

    let stats = {};
    if (includeStats === 'true') {
      const totalMembers = await this.prisma.userOrganization.count({
        where: { organizationId },
      });

      const activeMembers = await this.prisma.userOrganization.count({
        where: { organizationId, user: { subscriptionStatus: 'active' } },
      });

      const inactiveMembers = await this.prisma.userOrganization.count({
        where: { organizationId, user: { subscriptionStatus: { not: 'active' } } },
      });

      const newThisMonth = await this.prisma.userOrganization.count({
        where: {
          organizationId,
          joinedAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      });

      const byRole = await this.prisma.userOrganization.groupBy({
        by: ['role'],
        where: { organizationId },
        _count: { role: true },
      });

      stats = {
        total: totalMembers,
        active: activeMembers,
        inactive: inactiveMembers,
        newThisMonth,
        byRole: byRole.reduce(
          (acc, item) => {
            acc[item.role] = item._count.role;
            return acc;
          },
          {} as Record<string, number>,
        ),
      };
    }

    return {
      success: true,
      data: {
        members: members.map((m) => ({
          id: m.user.id,
          displayName: m.user.displayName,
          email: m.user.email,
          avatarUrl: m.user.avatarUrl,
          phoneNumber: m.user.phoneNumber,
          role: m.role,
          joinedAt: m.joinedAt,
          status: m.user.subscriptionStatus,
          subscription: includeSubscription === 'true' ? {
            planId: m.user.subscriptionPlanId,
            status: m.user.subscriptionStatus,
            currentPeriodEnd: m.user.subscriptionCurrentPeriodEnd,
          } : undefined,
        })),
        stats,
      },
    };
  }

  @Get(':id/members/:memberId')
  async getMemberDetails(
    @Param('id') organizationId: string,
    @Param('memberId') memberId: string,
    @Request() req?: any,
  ) {
    const member = await this.prisma.userOrganization.findFirst({
      where: { organizationId, userId: memberId },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            email: true,
            avatarUrl: true,
            phoneNumber: true,
            dateOfBirth: true,
            gender: true,
            heightCm: true,
            createdAt: true,
            subscriptionStatus: true,
          },
        },
      },
    });

    if (!member) {
      return { success: false, message: 'Member not found' };
    }

    // Get assigned routines
    const assignedRoutines = await this.prisma.userRoutineAssignment.findMany({
      where: { organizationId, userId: memberId },
      include: {
        program: {
          select: {
            id: true,
            name: true,
            goal: true,
            weeks: true,
            daysPerWeek: true,
          },
        },
      },
      orderBy: { assignedAt: 'desc' },
    });

    // Get payment history
    const payments = await this.prisma.memberPayment.findMany({
      where: { organizationId, userId: memberId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Get recent activity
    const recentActivity = await this.prisma.eventLog.findMany({
      where: { userId: memberId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return {
      success: true,
      data: {
        member: {
          id: member.user.id,
          displayName: member.user.displayName,
          email: member.user.email,
          avatarUrl: member.user.avatarUrl,
          phoneNumber: member.user.phoneNumber,
          dateOfBirth: member.user.dateOfBirth,
          gender: member.user.gender,
          heightCm: member.user.heightCm?.toNumber(),
          joinedAt: member.joinedAt,
          role: member.role,
          status: member.user.subscriptionStatus,
        },
        assignedRoutines: assignedRoutines.map((r) => ({
          id: r.id,
          program: r.program,
          assignedAt: r.assignedAt,
          startsAt: r.startsAt,
          endsAt: r.endsAt,
          isActive: r.isActive,
        })),
        payments: payments.map((p) => ({
          id: p.id,
          amount: p.amount.toNumber(),
          status: p.status,
          createdAt: p.createdAt,
          paidAt: p.paidAt,
        })),
        recentActivity: recentActivity.map((a) => ({
          id: a.id,
          eventType: a.eventType,
          createdAt: a.createdAt,
          payload: a.payload,
        })),
      },
    };
  }

  @Post(':id/members')
  async registerMember(
    @Param('id') organizationId: string,
    @Body()
    body: {
      email: string;
      displayName: string;
      password?: string;
      role?: UserRole;
      phoneNumber?: string;
      dateOfBirth?: string;
    },
    @Request() req: any,
  ) {
    const result = await this.organizationsService.registerMember(organizationId, body);

    // Send welcome email with credentials (fire-and-forget, don't block response)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    this.getOrganizationName(organizationId).then((orgName) => {
      this.organizationsService.sendWelcomeEmailToMember({
        email: result.data.email,
        password: result.data.password,
        displayName: result.data.displayName,
        organizationName: orgName,
        loginUrl: `${frontendUrl}/login`,
        role: result.data.role,
      }).catch((err) => {
        console.error('Failed to send welcome email:', err);
      });
    }).catch((err) => {
      console.error('Failed to get organization name for email:', err);
    });

    return {
      ...result,
      data: {
        ...result.data,
        password: undefined, // Don't return password in response
      },
    };
  }

  private async getOrganizationName(organizationId: string): Promise<string> {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { name: true },
    });
    return org?.name || 'your organization';
  }

  @Patch(':id/members/:memberId')
  async updateMember(
    @Param('id') organizationId: string,
    @Param('memberId') memberId: string,
    @Body()
    body: {
      role?: UserRole;
      phoneNumber?: string;
      displayName?: string;
    },
    @Request() req: any,
  ) {
    // Update user info if provided
    if (body.displayName || body.phoneNumber) {
      await this.prisma.user.update({
        where: { id: memberId },
        data: {
          ...(body.displayName && { displayName: body.displayName }),
          ...(body.phoneNumber && { phoneNumber: body.phoneNumber }),
        },
      });
    }

    // Update role if provided
    if (body.role) {
      await this.prisma.userOrganization.update({
        where: {
          userId_organizationId: {
            userId: memberId,
            organizationId,
          },
        },
        data: { role: body.role },
      });
    }

    return { success: true };
  }

  @Post(':id/members/:memberId/assign-routine')
  async assignRoutine(
    @Param('id') organizationId: string,
    @Param('memberId') memberId: string,
    @Body()
    body: {
      programId: string;
      startsAt?: string;
      endsAt?: string;
      notes?: string;
    },
    @Request() req: any,
  ) {
    const userId = req.user?.id;

    // Check if already assigned
    const existing = await this.prisma.userRoutineAssignment.findUnique({
      where: {
        userId_programId: {
          userId: memberId,
          programId: body.programId,
        },
      },
    });

    if (existing) {
      // Reactivate if inactive
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
        data: existing,
        message: 'Routine already assigned, reactivated',
      };
    }

    const assignment = await this.prisma.userRoutineAssignment.create({
      data: {
        organizationId,
        userId: memberId,
        programId: body.programId,
        assignedBy: userId,
        startsAt: body.startsAt ? new Date(body.startsAt) : null,
        endsAt: body.endsAt ? new Date(body.endsAt) : null,
        notes: body.notes,
      },
    });

    return { success: true, data: assignment };
  }

  @Delete(':id/members/:memberId/assign-routine/:assignmentId')
  async removeRoutineAssignment(
    @Param('id') organizationId: string,
    @Param('memberId') memberId: string,
    @Param('assignmentId') assignmentId: string,
    @Request() req: any,
  ) {
    await this.prisma.userRoutineAssignment.update({
      where: { id: assignmentId },
      data: { isActive: false },
    });

    return { success: true };
  }

  @Post('members/:memberId/routines')
  async assignRoutineToMember(
    @Param('memberId') memberId: string,
    @Body()
    body: {
      routineId: string;
      organizationId: string;
    },
    @Request() req: any,
  ) {
    const userId = req.user?.id;
    const { routineId, organizationId } = body;

    const existing = await this.prisma.userRoutineAssignment.findFirst({
      where: {
        userId: memberId,
        programId: routineId,
        organizationId,
      },
    });

    if (existing) {
      if (!existing.isActive) {
        await this.prisma.userRoutineAssignment.update({
          where: { id: existing.id },
          data: { isActive: true },
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
        userId: memberId,
        programId: routineId,
        assignedBy: userId,
      },
    });

    return {
      success: true,
      data: assignment,
    };
  }
}
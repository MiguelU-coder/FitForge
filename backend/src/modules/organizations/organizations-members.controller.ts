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

@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationMembersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(':id/members')
  async getMembers(
    @Param('id') organizationId: string,
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Request() req?: any,
  ) {
    const where: any = { organizationId };

    if (role && ['ORG_ADMIN', 'TRAINER', 'CLIENT'].includes(role)) {
      where.role = role;
    }

    if (search) {
      where.user = {
        OR: [
          { displayName: { ilike: `%${search}%` } },
          { email: { ilike: `%${search}%` } },
        ],
      };
    }

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
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    // Get member stats
    const totalMembers = await this.prisma.userOrganization.count({
      where: { organizationId },
    });

    const activeMembers = await this.prisma.userOrganization.count({
      where: { organizationId, user: { subscriptionStatus: 'active' } },
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
        })),
        stats: {
          total: totalMembers,
          active: activeMembers,
          newThisMonth,
          byRole: byRole.reduce(
            (acc, item) => {
              acc[item.role] = item._count.role;
              return acc;
            },
            {} as Record<string, number>,
          ),
        },
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
      password: string;
      role?: UserRole;
      phoneNumber?: string;
      dateOfBirth?: string;
    },
    @Request() req: any,
  ) {
    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: body.email.toLowerCase() },
    });

    if (existingUser) {
      // Check if already in this organization
      const existingMembership = await this.prisma.userOrganization.findUnique(
        {
          where: {
            userId_organizationId: {
              userId: existingUser.id,
              organizationId,
            },
          },
        },
      );

      if (existingMembership) {
        return {
          success: false,
          message: 'User already exists in this organization',
        };
      }

      // Add to organization
      const membership = await this.prisma.userOrganization.create({
        data: {
          userId: existingUser.id,
          organizationId,
          role: body.role || 'CLIENT',
        },
      });

      return {
        success: true,
        data: {
          id: existingUser.id,
          displayName: existingUser.displayName,
          email: existingUser.email,
          role: membership.role,
          joinedAt: membership.joinedAt,
          isNewUser: false,
        },
      };
    }

    // Create new user
    const hashedPassword = await argon2.hash(body.password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 1,
    });

    const newUser = await this.prisma.user.create({
      data: {
        email: body.email.toLowerCase(),
        displayName: body.displayName,
        passwordHash: hashedPassword,
        phoneNumber: body.phoneNumber,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
        isActive: true,
        subscriptionStatus: 'active',
      },
    });

    // Add to organization
    await this.prisma.userOrganization.create({
      data: {
        userId: newUser.id,
        organizationId,
        role: body.role || 'CLIENT',
      },
    });

    return {
      success: true,
      data: {
        id: newUser.id,
        displayName: newUser.displayName,
        email: newUser.email,
        role: body.role || 'CLIENT',
        joinedAt: new Date(),
        isNewUser: true,
      },
    };
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
}
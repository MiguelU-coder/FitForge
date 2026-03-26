import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PrismaService } from '../../database/prisma.service';

@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationDashboardController {
  constructor(
    private readonly organizationsService: OrganizationsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get(':id/dashboard')
  async getDashboardStats(@Param('id') organizationId: string, @Request() req: any) {
    // Get organization with plan info
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        plan: true,
        users: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                email: true,
                createdAt: true,
                subscriptionStatus: true,
              },
            },
          },
        },
        _count: {
          select: { users: true },
        },
      },
    });

    if (!organization) {
      return { success: false, message: 'Organization not found' };
    }

    // Get current date and 30 days ago
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Count active members (users with active subscription)
    const activeMembers = await this.prisma.userOrganization.count({
      where: {
        organizationId,
        user: { subscriptionStatus: 'active' },
      },
    });

    // Count new signups this month
    const newSignups = await this.prisma.userOrganization.count({
      where: {
        organizationId,
        joinedAt: { gte: startOfMonth },
      },
    });

    // Get programs count for the organization
    const programsCount = await this.prisma.program.count({
      where: { organizationId },
    });

    // Get exercises count for the organization
    const exercisesCount = await this.prisma.exercise.count({
      where: { organizationId },
    });

    // Calculate monthly revenue (from plan price * active members)
    const monthlyRevenue = (organization.plan?.price?.toNumber() || 0) * activeMembers;

    // Get recent activity (events from users in this organization)
    const orgUserIds = organization.users.map(u => u.userId);
    const recentActivity = await this.prisma.eventLog.findMany({
      where: {
        userId: { in: orgUserIds },
        createdAt: { gte: thirtyDaysAgo },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        eventType: true,
        createdAt: true,
        userId: true,
      },
    });

    // Get membership distribution by role
    const membershipDistribution = await this.prisma.userOrganization.groupBy({
      by: ['role'],
      where: { organizationId },
      _count: { role: true },
    });

    // Get revenue chart data (last 6 months)
    const revenueData = [];

    for (let i = 0; i < 6; i++) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const membersInMonth = await this.prisma.userOrganization.count({
        where: {
          organizationId,
          joinedAt: { lte: monthEnd },
        },
      });

      revenueData.push({
        name: monthStart.toLocaleDateString('es-ES', { month: 'short' }),
        members: membersInMonth,
        revenue: membersInMonth * (organization.plan?.price?.toNumber() || 0),
      });
    }

    revenueData.reverse();

    // Calculate retention rate
    const members30DaysAgo = await this.prisma.userOrganization.count({
      where: {
        organizationId,
        joinedAt: { lte: thirtyDaysAgo },
      },
    });

    const membersStillActive = await this.prisma.userOrganization.count({
      where: {
        organizationId,
        joinedAt: { lte: thirtyDaysAgo },
        user: { subscriptionStatus: 'active' },
      },
    });

    const retentionRate = members30DaysAgo > 0
      ? Math.round((membersStillActive / members30DaysAgo) * 100)
      : 100;

    return {
      success: true,
      data: {
        organization: {
          id: organization.id,
          name: organization.name,
          logoUrl: organization.logoUrl,
          plan: organization.plan,
        },
        stats: {
          activeMembers,
          totalMembers: organization._count.users,
          newSignups,
          monthlyRevenue,
          retentionRate,
          programsCount,
          exercisesCount,
        },
        revenueChart: revenueData,
        recentActivity: recentActivity.map(event => ({
          id: event.id,
          eventType: event.eventType,
          createdAt: event.createdAt,
          userId: event.userId,
        })),
        membershipDistribution: membershipDistribution.map(item => ({
          name: item.role,
          value: item._count.role,
        })),
      },
    };
  }

  @Get(':id/members')
  async getMembers(@Param('id') organizationId: string, @Request() req: any) {
    const members = await this.prisma.userOrganization.findMany({
      where: { organizationId },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            email: true,
            createdAt: true,
            subscriptionStatus: true,
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    return {
      success: true,
      data: members.map(m => ({
        id: m.user.id,
        displayName: m.user.displayName,
        email: m.user.email,
        role: m.role,
        joinedAt: m.joinedAt,
        status: m.user.subscriptionStatus,
      })),
    };
  }

  @Get(':id/routines')
  async getRoutines(@Param('id') organizationId: string, @Request() req: any) {
    // Get programs (which contain routines in this schema)
    const programs = await this.prisma.program.findMany({
      where: { organizationId },
      include: {
        _count: {
          select: { routines: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: programs.map(p => ({
        id: p.id,
        name: p.name,
        description: p.goal,
        duration: p.weeks ? `${p.weeks} semanas` : null,
        workoutsCount: p._count.routines,
        createdAt: p.createdAt,
      })),
    };
  }

  @Get(':id/payments')
  async getPayments(@Param('id') organizationId: string, @Request() req: any) {
    // Since there's no Payment model, we'll return subscription status data
    const members = await this.prisma.userOrganization.findMany({
      where: { organizationId },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            email: true,
            subscriptionStatus: true,
            createdAt: true,
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
      take: 20,
    });

    // Get organization plan price for mock payment calculation
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      include: { plan: true },
    });

    const planPrice = org?.plan?.price?.toNumber() || 0;

    // Transform subscription data into payment-like structure
    const payments = members
      .filter(m => m.user.subscriptionStatus === 'active')
      .map((m, idx) => ({
        id: m.user.id,
        user: {
          displayName: m.user.displayName,
          email: m.user.email,
        },
        amount: planPrice,
        status: 'completed',
        createdAt: m.joinedAt,
      }));

    const totalRevenue = payments.reduce((sum: number, p) => sum + p.amount, 0);

    return {
      success: true,
      data: {
        payments,
        totalRevenue,
      },
    };
  }
}
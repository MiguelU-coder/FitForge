import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Patch,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PrismaService } from '../../database/prisma.service';
import { PaymentStatus } from '@prisma/client';

@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationPaymentsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(':id/payments')
  async getPayments(@Param('id') organizationId: string, @Request() req: any) {
    const payments = await this.prisma.memberPayment.findMany({
      where: { organizationId },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    // Calculate stats
    const totalRevenue = await this.prisma.memberPayment.aggregate({
      where: { organizationId, status: 'PAID' },
      _sum: { amount: true },
    });

    const pendingCount = await this.prisma.memberPayment.count({
      where: { organizationId, status: 'PENDING' },
    });

    const overdueCount = await this.prisma.memberPayment.count({
      where: {
        organizationId,
        status: 'PENDING',
        dueDate: { lt: new Date() },
      },
    });

    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const thisMonthRevenue = await this.prisma.memberPayment.aggregate({
      where: {
        organizationId,
        status: 'PAID',
        paidAt: { gte: thisMonth },
      },
      _sum: { amount: true },
    });

    return {
      success: true,
      data: {
        payments: payments.map((p) => ({
          id: p.id,
          user: p.user,
          amount: p.amount.toNumber(),
          currency: p.currency,
          status: p.status,
          paymentMethod: p.paymentMethod,
          reference: p.reference,
          notes: p.notes,
          dueDate: p.dueDate,
          paidAt: p.paidAt,
          createdAt: p.createdAt,
        })),
        stats: {
          totalRevenue: totalRevenue._sum.amount?.toNumber() || 0,
          thisMonthRevenue: thisMonthRevenue._sum.amount?.toNumber() || 0,
          pendingCount,
          overdueCount,
        },
      },
    };
  }

  @Post(':id/payments')
  async createPayment(
    @Param('id') organizationId: string,
    @Body()
    body: {
      userId: string;
      amount: number;
      currency?: string;
      dueDate?: string;
      paymentMethod?: string;
      notes?: string;
    },
    @Request() req: any,
  ) {
    const payment = await this.prisma.memberPayment.create({
      data: {
        organizationId,
        userId: body.userId,
        amount: body.amount,
        currency: body.currency || 'USD',
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        paymentMethod: body.paymentMethod,
        notes: body.notes,
        status: 'PENDING',
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
      },
    });

    return {
      success: true,
      data: payment,
    };
  }

  @Patch(':id/payments/:paymentId')
  async updatePayment(
    @Param('id') organizationId: string,
    @Param('paymentId') paymentId: string,
    @Body()
    body: {
      status?: PaymentStatus;
      paymentMethod?: string;
      notes?: string;
      paidAt?: string;
    },
    @Request() req: any,
  ) {
    const updateData: any = {};

    if (body.status) {
      updateData.status = body.status;
      if (body.status === 'PAID') {
        updateData.paidAt = body.paidAt ? new Date(body.paidAt) : new Date();
      }
    }
    if (body.paymentMethod) updateData.paymentMethod = body.paymentMethod;
    if (body.notes !== undefined) updateData.notes = body.notes;

    const payment = await this.prisma.memberPayment.update({
      where: { id: paymentId },
      data: updateData,
    });

    return {
      success: true,
      data: payment,
    };
  }

  @Get(':id/payments/member/:userId')
  async getMemberPayments(
    @Param('id') organizationId: string,
    @Param('userId') userId: string,
    @Request() req: any,
  ) {
    const payments = await this.prisma.memberPayment.findMany({
      where: { organizationId, userId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: payments,
    };
  }

  @Get(':id/payments/stats/monthly')
  async getMonthlyPaymentStats(
    @Param('id') organizationId: string,
    @Request() req: any,
  ) {
    const now = new Date();
    const monthlyData = [];

    for (let i = 0; i < 12; i++) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const paidPayments = await this.prisma.memberPayment.aggregate({
        where: {
          organizationId,
          status: 'PAID',
          paidAt: { gte: monthStart, lte: monthEnd },
        },
        _sum: { amount: true },
      });

      const newPayments = await this.prisma.memberPayment.count({
        where: {
          organizationId,
          createdAt: { gte: monthStart, lte: monthEnd },
        },
      });

      monthlyData.push({
        month: monthStart.toLocaleDateString('es-ES', { month: 'short' }),
        year: monthStart.getFullYear(),
        revenue: paidPayments._sum.amount?.toNumber() || 0,
        newPayments,
      });
    }

    return {
      success: true,
      data: monthlyData.reverse(),
    };
  }
}
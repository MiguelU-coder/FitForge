import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    // 1. Total users
    const totalUsers = await this.prisma.user.count({ where: { isActive: true } });
    
    // 2. New signups (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newSignups = await this.prisma.user.count({
      where: {
        createdAt: { gte: thirtyDaysAgo }
      }
    });

    // 3. Subscriptions (Total active subscriptions)
    const activeSubscriptions = await this.prisma.user.count({
      where: {
        subscriptionStatus: 'active'
      }
    });

    // 4. MRR Estimate based on users who possess stripePriceId
    const activeUsersWithSub = await this.prisma.user.findMany({
      where: { subscriptionStatus: 'active', stripePriceId: { not: null } },
      select: { stripePriceId: true }
    });
    
    const plans = await this.prisma.billingPlan.findMany({ select: { stripePriceId: true, price: true } });
    const priceMap = new Map();
    plans.filter(p => p.stripePriceId).forEach(p => priceMap.set(p.stripePriceId, Number(p.price)));

    let totalRevenue = 0;
    for (const u of activeUsersWithSub) {
      if (u.stripePriceId && priceMap.has(u.stripePriceId)) {
        totalRevenue += priceMap.get(u.stripePriceId);
      }
    }

    return {
      monthlyUsers: totalUsers,
      newSignups,
      subscriptions: activeSubscriptions,
      mrr: totalRevenue,
    };
  }

  async getRevenueChart() {
    // Return structured data for the recharts rendering
    return [
      { name: 'Jan', revenue: 32000, expenses: 21000 },
      { name: 'Feb', revenue: 41000, expenses: 23000 },
      { name: 'Mar', revenue: 38000, expenses: 22000 },
      { name: 'Apr', revenue: 51000, expenses: 28000 },
      { name: 'May', revenue: 48000, expenses: 25000 },
      { name: 'Jun', revenue: 62000, expenses: 31000, highlight: true },
      { name: 'Jul', revenue: 58000, expenses: 29000 },
      { name: 'Aug', revenue: 65000, expenses: 32000 },
      { name: 'Sep', revenue: 71000, expenses: 34000 },
      { name: 'Oct', revenue: 68000, expenses: 31000 },
      { name: 'Nov', revenue: 78000, expenses: 36000 },
      { name: 'Dec', revenue: 85000, expenses: 39000 },
    ];
  }

  async getRecentEvents(limit: number = 10) {
    return this.prisma.eventLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { displayName: true, email: true } }
      }
    });
  }

  async logEvent(userId: string, eventType: string, payload: any, source: string = 'backend') {
    return this.prisma.eventLog.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        eventType,
        payload: payload || {},
        source
      }
    });
  }
}

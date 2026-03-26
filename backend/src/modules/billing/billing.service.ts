import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class BillingService {
  constructor(private readonly prisma: PrismaService) {}

  // Plans
  async createPlan(data: { name: string; price: number; interval?: string; features?: any }) {
    return this.prisma.billingPlan.create({
      data: {
        name: data.name,
        price: data.price,
        interval: data.interval || 'month',
        features: data.features || {},
      },
    });
  }

  async findAllPlans() {
    return this.prisma.billingPlan.findMany({
      where: { isActive: true },
    });
  }

  async updatePlan(id: string, data: { name?: string; price?: number; interval?: string; features?: any; isActive?: boolean }) {
    return this.prisma.billingPlan.update({
      where: { id },
      data,
    });
  }

  // Settings
  async getSettings() {
    let settings = await this.prisma.globalSettings.findUnique({
      where: { id: 'default' },
    });

    if (!settings) {
      settings = await this.prisma.globalSettings.create({
        data: { id: 'default', platformFeePct: 5.0 },
      });
    }

    return settings;
  }

  async updateSettings(data: { platformFeePct?: number; taxRatePct?: number }) {
    return this.prisma.globalSettings.upsert({
      where: { id: 'default' },
      update: data,
      create: { id: 'default', ...data },
    });
  }
}

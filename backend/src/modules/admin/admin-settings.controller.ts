import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PrismaService } from '../../database/prisma.service';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminSettingsController {
  constructor(private readonly prisma: PrismaService) {}

  @Throttle({ default: { ttl: 60000, limit: 30 }, admin: { ttl: 60000, limit: 30 } })
  @Get('global-settings')
  @Roles(UserRole.GLOBAL_ADMIN)
  async getGlobalSettings() {
    let settings = await this.prisma.globalSettings.findUnique({
      where: { id: 'default' },
    });

    if (!settings) {
      settings = await this.prisma.globalSettings.create({
        data: { id: 'default' },
      });
    }

    return {
      success: true,
      data: {
        basePrices: {
          monthlyPlan: Number(settings.monthlyBasePrice) || 29.99,
          yearlyPlan: Number(settings.yearlyBasePrice) || 299.99,
          singleSession: Number(settings.sessionBasePrice) || 5.0,
        },
        aiLimits: {
          maxRoutinesPerDay: settings.maxRoutinesPerDay || 10,
          maxAiCallsPerMonth: settings.maxAiCallsPerMonth || 1000,
          maxMembersPerOrg: settings.maxMembersPerOrg || 500,
        },
        maintenance: {
          isEnabled: settings.isMaintenanceMode || false,
          message: settings.maintenanceMessage || 'Sistema en mantenimiento',
          allowedRoles: settings.maintenanceAllowedRoles || ['ORG_ADMIN'],
        },
      },
    };
  }

  @Throttle({ default: { ttl: 60000, limit: 30 }, admin: { ttl: 60000, limit: 30 } })
  @Put('global-settings')
  @Roles(UserRole.GLOBAL_ADMIN)
  async updateGlobalSettings(
    @Body()
    body: {
      basePrices?: {
        monthlyPlan: number;
        yearlyPlan: number;
        singleSession: number;
      };
      aiLimits?: {
        maxRoutinesPerDay: number;
        maxAiCallsPerMonth: number;
        maxMembersPerOrg: number;
      };
      maintenance?: {
        isEnabled: boolean;
        message: string;
        allowedRoles: string[];
      };
    },
  ) {
    const updateData: any = {};

    if (body.basePrices) {
      updateData.monthlyBasePrice = body.basePrices.monthlyPlan;
      updateData.yearlyBasePrice = body.basePrices.yearlyPlan;
      updateData.sessionBasePrice = body.basePrices.singleSession;
    }

    if (body.aiLimits) {
      updateData.maxRoutinesPerDay = body.aiLimits.maxRoutinesPerDay;
      updateData.maxAiCallsPerMonth = body.aiLimits.maxAiCallsPerMonth;
      updateData.maxMembersPerOrg = body.aiLimits.maxMembersPerOrg;
    }

    if (body.maintenance) {
      updateData.isMaintenanceMode = body.maintenance.isEnabled;
      updateData.maintenanceMessage = body.maintenance.message;
      updateData.maintenanceAllowedRoles = body.maintenance.allowedRoles;
    }

    const settings = await this.prisma.globalSettings.upsert({
      where: { id: 'default' },
      update: updateData,
      create: {
        id: 'default',
        ...updateData,
      },
    });

    return {
      success: true,
      data: {
        basePrices: {
          monthlyPlan: Number(settings.monthlyBasePrice),
          yearlyPlan: Number(settings.yearlyBasePrice),
          singleSession: Number(settings.sessionBasePrice),
        },
        aiLimits: {
          maxRoutinesPerDay: settings.maxRoutinesPerDay,
          maxAiCallsPerMonth: settings.maxAiCallsPerMonth,
          maxMembersPerOrg: settings.maxMembersPerOrg,
        },
        maintenance: {
          isEnabled: settings.isMaintenanceMode,
          message: settings.maintenanceMessage,
          allowedRoles: settings.maintenanceAllowedRoles,
        },
      },
    };
  }
}

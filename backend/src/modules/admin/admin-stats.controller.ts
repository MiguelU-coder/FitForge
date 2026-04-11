import { Controller, Get, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { AdminService } from './admin.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/stats')
@Roles(UserRole.GLOBAL_ADMIN)
export class AdminStatsController {
  constructor(private readonly adminService: AdminService) {}

  @Throttle({ default: { ttl: 60000, limit: 30 }, admin: { ttl: 60000, limit: 30 } })
  @Get('dashboard')
  async getDashboardStats() {
    const stats = await this.adminService.getDashboardStats();
    return { success: true, data: stats };
  }

  @Throttle({ default: { ttl: 60000, limit: 30 }, admin: { ttl: 60000, limit: 30 } })
  @Get('revenue-chart')
  async getRevenueChart() {
    const data = await this.adminService.getRevenueChart();
    return { success: true, data };
  }

  @Throttle({ default: { ttl: 60000, limit: 30 }, admin: { ttl: 60000, limit: 30 } })
  @Get('distributions')
  async getDistributions() {
    const data = await this.adminService.getDistributions();
    return { success: true, data };
  }
}

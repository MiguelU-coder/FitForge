import { Controller, Get, UseGuards } from '@nestjs/common';
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

  @Get('dashboard')
  async getDashboardStats() {
    const stats = await this.adminService.getDashboardStats();
    return { success: true, data: stats };
  }

  @Get('revenue-chart')
  async getRevenueChart() {
    const data = await this.adminService.getRevenueChart();
    return { success: true, data };
  }

  @Get('distributions')
  async getDistributions() {
    const data = await this.adminService.getDistributions();
    return { success: true, data };
  }
}

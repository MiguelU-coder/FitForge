import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { AdminService } from './admin.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/events')
@Roles(UserRole.GLOBAL_ADMIN)
export class AdminEventsController {
  constructor(private readonly adminService: AdminService) {}

  @Get('recent')
  async getRecentEvents(@Query('limit') limitStr?: string) {
    const limit = limitStr ? parseInt(limitStr, 10) : 10;
    const events = await this.adminService.getRecentEvents(limit);
    return { success: true, data: events };
  }
}

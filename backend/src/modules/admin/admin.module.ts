import { Module } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AdminService } from './admin.service';
import { AdminStatsController } from './admin-stats.controller';
import { AdminEventsController } from './admin-events.controller';
import { AdminSettingsController } from './admin-settings.controller';

@Module({
  controllers: [AdminStatsController, AdminEventsController, AdminSettingsController],
  providers: [AdminService, PrismaService],
  exports: [AdminService, PrismaService],
})
export class AdminModule {}



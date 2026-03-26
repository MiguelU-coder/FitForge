import { Module } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AdminService } from './admin.service';
import { AdminStatsController } from './admin-stats.controller';
import { AdminEventsController } from './admin-events.controller';

@Module({
  controllers: [AdminStatsController, AdminEventsController],
  providers: [AdminService, PrismaService],
  exports: [AdminService],
})
export class AdminModule {}



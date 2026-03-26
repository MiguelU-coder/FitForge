import { Module } from '@nestjs/common';
import { BillingService } from './billing.service';
import { BillingPlansController } from './billing-plans.controller';
import { BillingSettingsController } from './billing-settings.controller';
import { PrismaModule } from '../../database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BillingPlansController, BillingSettingsController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}

import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('billing/settings')
@UseGuards(JwtAuthGuard)
export class BillingSettingsController {
  constructor(private readonly billingService: BillingService) {}

  @Get()
  @Roles(UserRole.GLOBAL_ADMIN)
  getSettings() {
    return this.billingService.getSettings();
  }

  @Put()
  @Roles(UserRole.GLOBAL_ADMIN)
  update(@Body() body: { platformFeePct?: number; taxRatePct?: number }) {
    return this.billingService.updateSettings(body);
  }
}

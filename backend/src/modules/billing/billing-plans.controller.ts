import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('billing/plans')
@UseGuards(JwtAuthGuard)
export class BillingPlansController {
  constructor(private readonly billingService: BillingService) {}

  @Post()
  @Roles(UserRole.GLOBAL_ADMIN)
  create(@Body() body: { name: string; price: number; interval?: string; features?: any }) {
    return this.billingService.createPlan(body);
  }

  @Get()
  findAll() {
    return this.billingService.findAllPlans();
  }

  @Put(':id')
  @Roles(UserRole.GLOBAL_ADMIN)
  update(
    @Param('id') id: string,
    @Body() body: { name?: string; price?: number; interval?: string; features?: any; isActive?: boolean },
  ) {
    return this.billingService.updatePlan(id, body);
  }
}

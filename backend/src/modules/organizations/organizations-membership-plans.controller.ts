import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('organizations/:id/membership-plans')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrganizationsMembershipPlansController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get()
  async findAll(@Param('id') organizationId: string) {
    const plans = await this.organizationsService.getMembershipPlans(organizationId);
    return { success: true, data: plans };
  }

  @Post()
  @Roles(UserRole.ORG_ADMIN, UserRole.GLOBAL_ADMIN)
  async create(
    @Param('id') organizationId: string,
    @Body() body: {
      name: string;
      description?: string;
      price: number;
      currency?: string;
      frequency: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
    },
  ) {
    const plan = await this.organizationsService.createMembershipPlan(organizationId, body);
    return { success: true, data: plan };
  }

  @Patch(':planId')
  @Roles(UserRole.ORG_ADMIN, UserRole.GLOBAL_ADMIN)
  async update(
    @Param('id') organizationId: string,
    @Param('planId') planId: string,
    @Body() body: any,
  ) {
    const plan = await this.organizationsService.updateMembershipPlan(organizationId, planId, body);
    return { success: true, data: plan };
  }

  @Delete(':planId')
  @Roles(UserRole.ORG_ADMIN, UserRole.GLOBAL_ADMIN)
  async remove(
    @Param('id') organizationId: string,
    @Param('planId') planId: string,
  ) {
    await this.organizationsService.updateMembershipPlan(organizationId, planId, { isActive: false });
    return { success: true, message: 'Plan deactivated successfully' };
  }
}

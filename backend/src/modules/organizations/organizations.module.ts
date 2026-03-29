import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OrganizationsService } from './organizations.service';
import { OrganizationsController } from './organizations.controller';
import { OrganizationDashboardController } from './organizations-dashboard.controller';
import { OrganizationPaymentsController } from './organizations-payments.controller';
import { OrganizationMembersController } from './organizations-members.controller';
import { OrganizationClassesController } from './organizations-classes.controller';
import { OrganizationRoutinesController } from './organizations-routines.controller';
import { OrganizationsMembershipPlansController } from './organizations-membership-plans.controller';
import { StripeModule } from '../stripe/stripe.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [ConfigModule, EmailModule, forwardRef(() => StripeModule)],
  controllers: [
    OrganizationsController,
    OrganizationDashboardController,
    OrganizationPaymentsController,
    OrganizationMembersController,
    OrganizationClassesController,
    OrganizationRoutinesController,
    OrganizationsMembershipPlansController,
  ],
  providers: [OrganizationsService],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
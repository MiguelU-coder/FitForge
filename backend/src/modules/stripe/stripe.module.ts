import { Module, Global, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { StripeService } from './stripe.service';
import { StripeController } from './stripe.controller';
import { STRIPE_CLIENT } from './stripe.constants';
import { PrismaModule } from '../../database/prisma.module';
import { OrganizationsModule } from '../organizations/organizations.module';

@Global()
@Module({
  imports: [ConfigModule, PrismaModule, forwardRef(() => OrganizationsModule)],
  controllers: [StripeController],
  providers: [
    {
      provide: STRIPE_CLIENT,
      useFactory: (config: ConfigService) => {
        const secretKey = config.get<string>('STRIPE_SECRET_KEY');
        if (!secretKey) {
          throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
        }
        return new Stripe(secretKey, {
          apiVersion: '2025-01-27.acacia' as any, // Use any to bypass version mismatch or update to exact
        });
      },
      inject: [ConfigService],
    },
    StripeService,
  ],
  exports: [STRIPE_CLIENT, StripeService],
})
export class StripeModule {}
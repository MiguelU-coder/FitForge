import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { StripeService } from '@modules/stripe/stripe.service';
import { PrismaService } from '@database/prisma.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const stripeService = app.get(StripeService);
  const prisma = app.get(PrismaService);

  console.log('🚀 Starting Stripe Plan Sync...');

  const plans = await prisma.billingPlan.findMany({
    where: { isActive: true },
  });

  for (const plan of plans) {
    console.log(`📦 Syncing plan: ${plan.name} ($${plan.price}/${plan.interval})...`);
    
    try {
      const stripePriceId = await stripeService.syncPlan({
        planId: plan.id,
        name: plan.name,
        amount: Number(plan.price),
        interval: plan.interval as 'month' | 'year',
      });

      // Fetch the product ID from the price we just got
      const price = await (stripeService as any).stripe.prices.retrieve(stripePriceId);
      const stripeProductId = price.product as string;

      await prisma.billingPlan.update({
        where: { id: plan.id },
        data: {
          stripePriceId,
          stripeProductId,
        },
      });

      console.log(`✅ Plan ${plan.name} synced. PriceID: ${stripePriceId}`);
    } catch (error: any) {
      console.error(`❌ Error syncing plan ${plan.name}:`, error.message);
    }
  }

  console.log('🏁 Sync Finished!');
  await app.close();
}

bootstrap();

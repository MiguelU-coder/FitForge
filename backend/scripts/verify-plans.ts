import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  const plans = await prisma.billingPlan.findMany();
  
  console.log('--- Plan Verification ---');
  plans.forEach(plan => {
    console.log(`Plan: ${plan.name}`);
    console.log(`  Price: $${plan.price}`);
    console.log(`  Stripe Price ID: ${plan.stripePriceId || 'MISSING'}`);
    console.log(`  Stripe Product ID: ${plan.stripeProductId || 'MISSING'}`);
    console.log('------------------------');
  });

  await prisma.$disconnect();
}

main();

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

prisma.exercise
  .findMany({
    where: { externalId: null },
    select: { id: true },
  })
  .then((exercises) => {
    console.log('Seed exercises (without externalId):', exercises.length);
    return prisma.$disconnect();
  });

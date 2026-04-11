import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.exercise.count().then((c) => {
  console.log('Total exercises in DB:', c);
  prisma.$disconnect();
});

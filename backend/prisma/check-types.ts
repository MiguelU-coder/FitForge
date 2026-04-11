import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

prisma.exercise
  .findMany({
    where: { externalId: { not: null } },
    select: { id: true, name: true, externalId: true },
  })
  .then((ex) => {
    console.log('ExerciseDB:', ex.length);
    return prisma.exercise.count({ where: { externalId: null } });
  })
  .then((seedEx) => {
    console.log('Seed:', seedEx);
    return prisma.$disconnect();
  });

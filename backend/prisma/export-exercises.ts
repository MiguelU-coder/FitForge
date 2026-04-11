import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const exercises = await prisma.exercise.findMany({
    where: { isActive: true },
    select: {
      name: true,
      slug: true,
      primaryMuscles: true,
      secondaryMuscles: true,
      equipment: true,
      movementPattern: true,
      isCompound: true,
      exerciseType: true,
      externalId: true,
      instructions: true,
      videoUrl: true,
    },
  });

  console.log(JSON.stringify(exercises, null, 2));
  await prisma.$disconnect();
}

main();

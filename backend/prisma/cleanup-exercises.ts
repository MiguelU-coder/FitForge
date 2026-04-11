import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const exercisesToDelete = await prisma.exercise.findMany({
    where: { externalId: null },
    select: { id: true },
  });
  const exerciseIds = exercisesToDelete.map((e) => e.id);
  console.log('Exercises to delete:', exerciseIds.length);

  if (exerciseIds.length > 0) {
    await prisma.routineItem.deleteMany({
      where: { exerciseId: { in: exerciseIds } },
    });

    const result = await prisma.exercise.deleteMany({
      where: { externalId: null },
    });
    console.log('Deleted seed exercises:', result.count);
  }

  const remaining = await prisma.exercise.count();
  console.log('Remaining exercises:', remaining);

  await prisma.$disconnect();
}

main();

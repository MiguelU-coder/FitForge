import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  console.log('Connecting to database...');
  try {
    const count = await prisma.exercise.count();
    console.log(`Exercise count: ${count}`);
    const exercises = await prisma.exercise.findMany({ take: 5 });
    console.log('Fetched exercises:', exercises.length);
  } catch (e) {
    console.error('Database connection failed:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();

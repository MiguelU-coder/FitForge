import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.user.findMany({ select: { email: true, isGlobalAdmin: true } })
  .then(console.log)
  .finally(() => prisma.$disconnect());

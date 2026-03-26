import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function promoteAdmin(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error(`Error: User with email ${email} not found in database.`);
      console.log('Remember to sign up first in the web app or Supabase.');
      return;
    }

    await prisma.user.update({
      where: { email },
      data: { isGlobalAdmin: true },
    });

    console.log(`Success: User ${email} has been promoted to GLOBAL_ADMIN.`);
  } catch (error) {
    console.error('Error promoting user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

const email = process.argv[2];
if (!email) {
  console.log('Usage: npx ts-node scripts/promote_admin.ts <email>');
} else {
  promoteAdmin(email);
}

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const email = 'mmsporify5673@gmail.com';
  const supabaseId = '16d21016-13c4-4ce7-87b1-3cd3969468e5';

  console.log(`Starting clean up for ${email}...`);

  // 1. Delete user (and relations will be handled by Cascade if any, but we saw none)
  try {
    await prisma.user.delete({
      where: { email },
    });
    console.log(`User ${email} deleted from DB.`);
  } catch (e) {
    console.log(`User ${email} did not exist or could not be deleted.`);
  }

  // 2. Recreate user with Global Admin permissions
  const newUser = await prisma.user.create({
    data: {
      id: supabaseId,
      email: email,
      displayName: 'Global Admin',
      isGlobalAdmin: true,
      isActive: true,
      unitSystem: 'METRIC',
    },
  });

  console.log('User recreated successfully:');
  console.log(JSON.stringify(newUser, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

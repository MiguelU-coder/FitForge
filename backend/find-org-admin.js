const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const admins = await prisma.userOrganization.findMany({
    where: { role: 'ORG_ADMIN' },
    include: {
      user: { select: { email: true, displayName: true } },
      organization: { select: { name: true } }
    }
  });
  console.log(JSON.stringify(admins, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

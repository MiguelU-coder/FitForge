const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const pending = await prisma.pendingOrganization.findMany();
  console.log(JSON.stringify(pending, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

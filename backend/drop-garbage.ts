import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function main() {
  console.log("Recreando schema public...");
  try {
    await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS public CASCADE;`);
    await prisma.$executeRawUnsafe(`CREATE SCHEMA public;`);
    await prisma.$executeRawUnsafe(`GRANT ALL ON SCHEMA public TO postgres;`);
    await prisma.$executeRawUnsafe(`GRANT ALL ON SCHEMA public TO public;`);
    console.log("🔥 Schema public limpiado con éxito.");
  } catch (e) {
    console.error("Error limpiando schema:", e);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });

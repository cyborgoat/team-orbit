import { PrismaClient } from '@prisma/client';
import { seedDatabase } from './seed-demo';

const prisma = new PrismaClient();

seedDatabase(prisma)
  .then((summary) => {
    console.table(summary);
    console.log(
      'Demo login: superadmin / admin / member; password: password123',
    );
    console.log(
      'Existing accounts and edits were preserved; legacy demo image links were repaired.',
    );
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

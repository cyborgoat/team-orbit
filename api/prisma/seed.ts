import { existsSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { bootstrapAdmin } from './bootstrap';

if (existsSync('.env')) process.loadEnvFile('.env');
const prisma = new PrismaClient();

async function main() {
  const credentials = {
    username: process.env.BOOTSTRAP_ADMIN_USERNAME,
    fullName: process.env.BOOTSTRAP_ADMIN_NAME,
    password: process.env.BOOTSTRAP_ADMIN_PASSWORD,
    email: process.env.BOOTSTRAP_ADMIN_EMAIL,
  };
  if (
    !Object.values(credentials).some(
      (value) => value !== undefined && value !== '',
    )
  ) {
    const existing = await prisma.user.findFirst({
      where: { role: 'SUPERUSER', status: 'ACTIVE' },
      select: { id: true },
    });
    if (existing) {
      console.log(
        'An active superuser already exists; bootstrap skipped. No accounts or content were changed.',
      );
      return;
    }
  }
  const user = await bootstrapAdmin(prisma, credentials);
  console.log(
    `Bootstrap administrator ready: ${user.username}. No sample content was created.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : 'Bootstrap failed');
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient } from '@prisma/client';
import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { seedDatabase } from './seed-demo';

if (existsSync('.env')) process.loadEnvFile('.env');
if (!['development', 'test'].includes(process.env.NODE_ENV ?? '')) {
  throw new Error(
    'Demo fixtures are opt-in. Set NODE_ENV=development or test and PUBLIC_BASE_URL before running demo:seed.',
  );
}
if (!process.env.PUBLIC_BASE_URL)
  throw new Error('PUBLIC_BASE_URL is required for demo image URLs.');
const demoUploads = join(
  process.cwd(),
  process.env.UPLOAD_DIR || 'uploads',
  'demo',
);
mkdirSync(demoUploads, { recursive: true });
cpSync(join(__dirname, 'assets'), demoUploads, { recursive: true });
const prisma = new PrismaClient();

seedDatabase(prisma)
  .then((summary) => {
    console.table(summary);
    console.log(
      'Demo login: superadmin / admin / member; password: password123',
    );
    console.log('Current-format demo fixtures are ready.');
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

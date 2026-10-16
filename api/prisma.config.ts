import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'prisma/config';

const envFile = resolve(__dirname, '.env');
if (existsSync(envFile)) process.loadEnvFile(envFile);

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'ts-node --project tsconfig.scripts.json prisma/seed.ts',
  },
});

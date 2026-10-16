import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
export default function setup() {
  const directory = mkdtempSync(join(tmpdir(), 'orbit-api-test-'));
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = `file:${join(directory, 'test.db')}`;
  process.env.UPLOAD_DIR = join(directory, 'uploads');
  process.env.JWT_SECRET = 'isolated-integration-test-secret';
  process.env.PUBLIC_BASE_URL = 'http://127.0.0.1:3098';
  process.env.ORBIT_TEST_DIRECTORY = directory;
  execFileSync(
    process.execPath,
    [resolve('node_modules/prisma/build/index.js'), 'migrate', 'deploy'],
    { env: process.env, stdio: 'pipe' },
  );
}

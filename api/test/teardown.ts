import { rmSync } from 'node:fs';
export default function teardown() {
  const directory = process.env.ORBIT_TEST_DIRECTORY;
  if (directory) rmSync(directory, { recursive: true, force: true });
}

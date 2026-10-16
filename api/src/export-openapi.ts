import { configureApp } from './common/configure-app';
import { NestFactory } from '@nestjs/core';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { AppModule } from './app.module';
import { createOpenApiDocument } from './swagger';

// Builds the OpenAPI document without calling app.init()/listen(), so no
// database connection is needed.
async function main() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error'],
    abortOnError: false,
  });
  configureApp(app);
  const out = resolve(__dirname, '../../openapi/openapi.json');
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(
    out,
    JSON.stringify(createOpenApiDocument(app), null, 2) + '\n',
  );
  console.log(`Wrote ${out}`);
  process.exit(0);
}
void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

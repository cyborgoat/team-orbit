import { NestFactory } from '@nestjs/core';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { AppModule } from './app.module';
import { createOpenApiDocument } from './swagger';

// Builds the OpenAPI document without calling app.init()/listen(), so no
// database connection is needed.
async function main() {
  const app = await NestFactory.create(AppModule, { logger: false });
  const out = resolve(__dirname, '../../openapi/openapi.json');
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(
    out,
    JSON.stringify(createOpenApiDocument(app), null, 2) + '\n',
  );
  console.log(`Wrote ${out}`);
  process.exit(0);
}
void main();

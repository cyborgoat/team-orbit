// Rewrites the endpoint table in README.md (between the api:start/api:end
// markers) from ../../openapi/openapi.json so the docs can't drift from the API.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const spec = JSON.parse(readFileSync(resolve(root, '../../openapi/openapi.json'), 'utf8'));

const refName = (schema) => schema?.$ref?.split('/').pop();
const methods = ['get', 'post', 'put', 'patch', 'delete'];

const groups = new Map();
for (const [path, ops] of Object.entries(spec.paths)) {
  for (const method of methods) {
    const op = ops[method];
    if (!op || path === '/metrics') continue;
    const tag = op.tags?.[0] ?? 'other';
    const body = refName(op.requestBody?.content?.['application/json']?.schema);
    const ok = Object.entries(op.responses ?? {}).find(([code]) => code.startsWith('2'));
    const res = refName(ok?.[1].content?.['application/json']?.schema);
    const row = `| \`${method.toUpperCase()}\` | \`${path}\` | ${op.security ? 'Bearer' : 'public'} | ${
      body ? `\`${body}\`` : op.requestBody ? 'multipart' : ''
    } | ${res ? `\`${res}\`` : ''} |`;
    if (!groups.has(tag)) groups.set(tag, []);
    groups.get(tag).push(row);
  }
}

const table = [...groups]
  .map(
    ([tag, rows]) =>
      `#### ${tag}\n\n| Method | Path | Auth | Request body | Response |\n| --- | --- | --- | --- | --- |\n${rows.join('\n')}`,
  )
  .join('\n\n');

const file = resolve(root, 'README.md');
const readme = readFileSync(file, 'utf8');
const next = readme.replace(
  /<!-- api:start -->[\s\S]*<!-- api:end -->/,
  `<!-- api:start -->\n${table}\n<!-- api:end -->`,
);
if (next === readme && !readme.includes(table)) {
  throw new Error('api:start/api:end markers not found in README.md');
}
writeFileSync(file, next);

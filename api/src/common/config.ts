import { resolve } from 'node:path';

export function validateEnvironment(env: Record<string, unknown>) {
  for (const key of ['DATABASE_URL', 'JWT_SECRET', 'PUBLIC_BASE_URL']) {
    if (typeof env[key] !== 'string' || !env[key].trim())
      throw new Error(`${key} is required`);
  }
  const url = new URL(String(env.PUBLIC_BASE_URL));
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.search ||
    url.hash ||
    url.username ||
    url.password ||
    url.pathname !== '/'
  ) {
    throw new Error('PUBLIC_BASE_URL must be an HTTP(S) origin');
  }
  const port = Number(env.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error('PORT must be between 1 and 65535');
  return {
    ...env,
    PORT: port,
    PUBLIC_BASE_URL: url.origin,
    UPLOAD_DIR: resolve(
      typeof env.UPLOAD_DIR === 'string' && env.UPLOAD_DIR
        ? env.UPLOAD_DIR
        : 'uploads',
    ),
  };
}

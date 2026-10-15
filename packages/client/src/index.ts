import createClient, { type Middleware } from 'openapi-fetch';
import type { paths } from './schema';

export type { paths, components } from './schema';

export interface TeamOrbitClientOptions {
  /** Base URL of the deployed Team Orbit API, e.g. https://orbit.example.com */
  baseUrl: string;
  /** Static JWT, or a function returning one (called on every request). */
  token?: string | (() => string | undefined | Promise<string | undefined>);
  /** Custom fetch implementation (defaults to global fetch). */
  fetch?: typeof fetch;
}

export function createTeamOrbitClient(options: TeamOrbitClientOptions) {
  const client = createClient<paths>({
    baseUrl: options.baseUrl,
    fetch: options.fetch,
  });

  const { token } = options;
  if (token) {
    const auth: Middleware = {
      async onRequest({ request }) {
        const value = typeof token === 'function' ? await token() : token;
        if (value) request.headers.set('Authorization', `Bearer ${value}`);
        return request;
      },
    };
    client.use(auth);
  }

  return client;
}

export type TeamOrbitClient = ReturnType<typeof createTeamOrbitClient>;

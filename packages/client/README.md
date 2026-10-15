# @team-orbit/client

Typed client for the Team Orbit API, generated from `../../openapi/openapi.json`.
Requests and responses are fully typed.

```ts
import { createTeamOrbitClient } from '@team-orbit/client';

const orbit = createTeamOrbitClient({
  baseUrl: 'https://orbit.example.com',
  token: () => localStorage.getItem('token') ?? undefined,
});

const login = await orbit.POST('/auth/login', {
  body: { email: 'admin@teamorbit.local', password: 'password123' },
});
login.data?.accessToken; // string

const posts = await orbit.GET('/forum-posts', { params: { query: { page: 1 } } });
posts.data?.items[0].commentCount; // number
posts.data?.items[0].author.username; // string
```

Every call returns `{ data, error, response }`. `data` is typed for 2xx responses.

## Updating after API changes

```bash
cd api && npm run openapi:export        # regenerates ../openapi/openapi.json
cd ../packages/client && npm run build  # regenerates src/schema.d.ts and compiles
```

`scripts/check-sdk.sh` at the repo root does both and fails if the committed
spec or `src/schema.d.ts` differ, so it can run in CI.

## Publishing

`prepublishOnly` rebuilds. Make sure the `@team-orbit` npm scope exists (or rename
the package) before `npm publish`.

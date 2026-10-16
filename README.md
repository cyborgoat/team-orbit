# Team Orbit

Team Orbit manages team members, events, announcements, Markdown news and blog
posts, a discussion forum, uploads, and live notifications for teams of about
100 members.

It includes a NestJS API, a React test console, and a typed TypeScript client
for building your own frontend.

## Quick start

**Prerequisites:** Node.js 20+ compatible with the installed Vite version.

```bash
# API
cd api
cp .env.example .env
npm install
npm run prisma:generate
npx prisma migrate deploy
npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts
npm run start:dev

# Web (separate terminal, from the repository root)
cd web
npm install
npm run dev
```

| Service | URL |
|---------|-----|
| Web UI | http://localhost:5173 |
| API | http://localhost:3000 |
| Swagger | http://localhost:3000/api |
| Health | http://localhost:3000/health |
| Metrics | http://localhost:3000/metrics |

### Seed accounts

Sign in with **username and password**. Choose **Use email instead** to use
an account's email address.

| Username | Optional email | Password | Role |
|----------|----------------|----------|------|
| `superadmin` | `super@teamorbit.local` | `password123` | SUPERUSER |
| `admin` | `admin@teamorbit.local` | `password123` | ADMIN |
| `member` | `user@teamorbit.local` | `password123` | USER |

Registration requires username, full name, and password; email is optional.
Self-registered accounts start as `PENDING` until an admin activates them.
Members can add or remove email from Settings; username login remains available.

### Roles and content editing

- **Users:** admins can promote USER to ADMIN; superusers can assign every role.
  Open web sessions refresh permissions within 30 seconds while active or on tab focus.
- **Editors:** `/news/new`, `/blog/new`, and `/forum/new` provide dedicated
  creation pages with an MDXEditor toolbar, Markdown source mode, and preview.
- **Images:** paste image files into rich text mode or use the image toolbar
  button. Comments and replies support the same editor inline. Each upload is
  limited to 5 MB; the API stores files on disk and URLs in Markdown.

For an existing installation, back up the database and uploads, then run
`npm run prisma:generate` and `npx prisma migrate deploy` from `api/` before
restarting the API. The optional-email migration preserves existing accounts.

## TypeScript client

```ts
import { createTeamOrbitClient } from '@goatcheese/team-orbit-client';

const orbit = createTeamOrbitClient({ baseUrl: 'http://localhost:3000' });
await orbit.auth.login('admin', 'password123');
const { items } = await orbit.news.list();
```

See the [client guide](packages/client/README.md) for email login, optional-email
registration, nullable user emails, uploads, and generated request/response types.

## Repository layout

```text
team-orbit/
├── api/              NestJS API (Prisma, SQLite, JWT, Socket.io)
├── web/              React test console and browser tests
├── packages/client/  Typed TypeScript API client
├── openapi/          Generated API contract
├── docs/             Architecture, schema, features, and usage
└── scripts/          SDK consistency checks
```

## Documentation

- [Architecture](docs/architecture.md) — modules, data flow, auth, and uploads
- [Schema](docs/schema.md) — database models and relationships
- [Features](docs/features.md) — capabilities, permissions, and API surface
- [Usage](docs/usage.md) — setup, account flows, editors, tests, and upgrades
- [Web console](web/README.md) — frontend setup and browser checks
- [Client SDK](packages/client/README.md) — TypeScript integration

## Tech stack

| Layer | Choice |
|-------|--------|
| API | NestJS |
| DB | SQLite + Prisma |
| Auth | JWT + RBAC |
| Realtime | Socket.io |
| Uploads | Local disk (Multer) |
| Logs | Pino |
| API docs | Swagger / OpenAPI |
| Metrics | Prometheus (`/metrics`) |
| Web | Vite, React, TanStack Router/Query, shadcn/ui, MDXEditor |
| Client | TypeScript + openapi-fetch |
| Tests | Jest (API), Playwright (web), Node test runner (client) |

## License

See [LICENSE](LICENSE).

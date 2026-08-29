# Team Orbit

Team Orbit is a backend-first app for managing ~100 team members, events, announcements, markdown news/blog posts, uploads, and live notifications.

It ships as a **NestJS modular monolith** plus a **minimal test UI** (TanStack + shadcn) so you can exercise the API before building your own frontend.

## Quick start

**Prerequisites:** Node.js 20+

```bash
# API
cd api
cp .env.example .env
npm install
npx prisma migrate dev
npx prisma db seed
npm run start:dev

# Web (separate terminal)
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

| Email | Password | Role |
|-------|----------|------|
| `super@teamorbit.local` | `password123` | SUPERUSER |
| `admin@teamorbit.local` | `password123` | ADMIN |
| `user@teamorbit.local` | `password123` | USER |

## Repository layout

```
team-orbit/
├── api/          NestJS API (Prisma, SQLite, JWT, Socket.io)
├── web/          Test console (Vite, TanStack Router/Query, shadcn)
├── docs/         Architecture, features, and usage guides
└── README.md
```

## Documentation

- [Architecture](docs/architecture.md) — system design, modules, data model, auth
- [Features](docs/features.md) — domains, permissions, and API surface
- [Usage](docs/usage.md) — run locally, test UI flows, backup, and ops notes

## Tech stack

| Layer | Choice |
|-------|--------|
| API | NestJS |
| DB | SQLite + Prisma |
| Auth | JWT + RBAC |
| Realtime | Socket.io |
| Uploads | Local disk (Multer) |
| Logs | Pino |
| Docs | Swagger |
| Metrics | Prometheus (`/metrics`) |
| Web | Vite, React, TanStack Router/Query, shadcn/ui |
| Tests | Jest (API unit + e2e) |

## License

See [LICENSE](LICENSE).

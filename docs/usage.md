# Usage

## Fresh setup

Use Node.js 22.12+ and npm. From the repository root:

```bash
npm --prefix api ci
npm --prefix api run prisma:generate
cp api/.env.example api/.env
# Set DATABASE_URL, JWT_SECRET, PUBLIC_BASE_URL and BOOTSTRAP_ADMIN_* in api/.env.
cd api
npx prisma migrate deploy
npm run prisma:seed
npm run start:dev
```

In a separate terminal, from the repository root:

```bash
npm --prefix packages/client ci
npm --prefix packages/client run build
npm --prefix web ci
cp web/.env.example web/.env.local
# Set API_PROXY_TARGET to the API service origin.
npm --prefix web run dev
```

`PUBLIC_BASE_URL` is the API origin reachable by all consuming applications, such as `http://localhost:3000` on the same computer or a deployed HTTPS origin. It is required; there is no inferred request-host fallback. Other devices need a reachable host instead of localhost.

Web: `http://localhost:5173`; API: `http://localhost:3000/api`; Swagger: `http://localhost:3000/docs`; health: `/api/health`; metrics: `/metrics`.

## Development data

Normal seeding creates one active superuser from `BOOTSTRAP_ADMIN_USERNAME`, `BOOTSTRAP_ADMIN_NAME`, and `BOOTSTRAP_ADMIN_PASSWORD`; email is optional. Credentials are never supplied by the application. Repeating bootstrap does not change an existing administrator.

Rich Markdown fixtures are explicitly opt-in, from `api/`:

```bash
NODE_ENV=development npm run demo:seed
```

The command requires `PUBLIC_BASE_URL`, refuses production execution, and copies fixture illustrations to the upload directory. No demo content is loaded on application startup.

To deliberately recreate a disposable development database after schema changes, stop the API and run from `api/`:

```bash
npx prisma migrate reset --force --skip-seed
npm run prisma:seed
# Optional: NODE_ENV=development npm run demo:seed
```

The reset deletes the configured database's records. Do not use it on a database whose contents you need. No automatic data reset or legacy conversion is provided.

## Accounts and media

Sign in with username/password, or select email login when an address is attached. Self-registration creates a pending account. Administrators activate it in Users. Members edit profile, optional email, password, and avatar in Settings.

Avatars support five bird presets, uploads, an external HTTP(S) image URL, and default reset. `avatarUrl: null` restores the default raven; responses contain its absolute effective URL. Covers can likewise be removed using `null`.

Upload images through `POST /api/uploads`, authenticated, with multipart field `file` (maximum 5 MB). Use the absolute returned `url` for Markdown. Generated URLs use `PUBLIC_BASE_URL`; external images remain external.

News/blog/forum editors support source mode, rich-text image paste, and previews. Read-only rendering follows GFM with an explicit KaTeX math extension. Keep formula drafts in source mode. Code fences remain literal; HTML is not executed.

## Verification

```bash
npm --prefix api run lint
npm --prefix api test -- --runInBand
npm --prefix api run test:seed
npm --prefix api run test:e2e -- --runInBand
npm --prefix packages/client test
npm --prefix web run lint
npm --prefix web run build
npm --prefix web exec playwright install chromium
npm --prefix web run test:e2e
npm --prefix web run test:integration
```

API tests and real-browser tests create disposable databases and uploads. They do not use your development database. Set `PLAYWRIGHT_CHROME=1` to use an installed Chrome. The real-browser suite reserves ports 3099 and 5189.

After API changes, export OpenAPI from `api/` using `npm run openapi:export`, then rebuild the client. `scripts/check-sdk.sh` verifies generated-contract consistency in CI. It requires the normal API environment settings but does not connect to the database during export.

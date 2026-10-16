# Usage

## Local development

### API

Run from the repository root:

```bash
cd api
cp .env.example .env
npm install
npm run prisma:generate
npx prisma migrate deploy
npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts
npm run start:dev
```

The seed command creates `superadmin`, `admin`, and `member` with password
`password123`. Their email addresses are listed in the root [README](../README.md).

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Prisma SQLite path (default `file:./dev.db`) |
| `JWT_SECRET` | Signing key for access tokens |
| `JWT_EXPIRES_IN` | Token lifetime (default `7d`) |
| `PORT` | HTTP port (default `3000`) |
| `UPLOAD_DIR` | Relative upload folder (default `uploads`) |
| `PUBLIC_BASE_URL` | Public API URL used for absolute seeded demo image links; defaults to `http://localhost:3000` (uses `PORT` when configured). Set before seeding for other devices or deployments. |

For production builds, run `npm run build` followed by `npm run start:prod`.
Use `npx prisma migrate dev` when authoring a new migration; use
`npx prisma migrate deploy` to apply the migrations already in this repository.

### Web test console

In another terminal, from the repository root:

```bash
cd web
npm install
npm run dev
```

Open http://localhost:5173. Vite proxies API and Socket.io requests to port 3000.
Browser navigation to paths shared with the API serves the web app instead.

## Accounts and roles

### Sign in

1. Open http://localhost:5173/login.
2. Enter a username, such as `admin`, and the password.
3. To use a supplied email address, choose **Use email instead**.

Accounts without email use username login. Logout clears the token, React Query
cache, and Socket.io connection, then returns to `/login`.

### Register or create a member

Self-registration at `/register` requires username, full name, and password
(minimum six characters). Email is optional. The account starts as `PENDING`;
an Admin or Superuser must set it to `ACTIVE` on **Users** before it can sign in.

Admins can also use **Users → Create user** with an optional email. The default
status is `ACTIVE`; choose `USER` or `ADMIN`, or `SUPERUSER` when signed in as a
Superuser. Share the username and password with the member.

### Change a role

Use the role selector on **Users**. An Admin can promote USER to ADMIN but cannot
change an existing ADMIN or SUPERUSER role. A Superuser can assign every role.
The API enforces the saved role on each authenticated HTTP request. The web
refreshes the signed-in profile every 30 seconds while active and on tab focus;
changing your own role refreshes your profile immediately.

### Update a profile or password

Open **Settings** to update full name, email, or avatar. Email is optional:
adding one enables email login; clearing it removes email login while preserving
username login. Supplied email addresses must be valid and unique. Username is
read-only; role and status remain managed from **Users**.

Change a password with the current password, new password, and confirmation.

## Markdown content and images

News and blog creation require ADMIN or SUPERUSER; any active member can create
a forum post. Open **New article** or **New post** from the relevant list:

| Content | Creation page |
|---------|---------------|
| News | `/news/new` |
| Blog | `/blog/new` |
| Forum | `/forum/new` |

Each page has an MDXEditor formatting toolbar, rich text and Markdown source
modes, an inline preview, Publish, and Cancel. Existing title, tags, and cover
fields remain available where applicable. Comments and replies use the same
editor inline on the forum detail page.

Paste image files into **rich text mode**, or use the image toolbar button.
Each image is uploaded through `POST /uploads` and saved as a Markdown URL such
as `![photo](/uploads/<uuid>.png)`. Images must be at most 5 MB. Publishing waits
for uploads; failed uploads show an error and leave the remaining draft intact.
Drafts stay in page memory and are discarded on navigation or reload.

The standalone **Uploads** page returns URLs for covers, avatars, or Markdown.
Event creation still uses its existing dialog. Image files live in `api/uploads/`
by default; database content stores their paths. Deleting content does not
currently remove uploaded files.

## Notifications and forum

Keep two clients signed in to check live notifications. Creating announcements,
events, news, blog posts, forum posts, or comments persists a notification and
broadcasts a toast. The **Notifications** page lists persisted items and marks
them read.

Open a forum post to vote, comment, or reply to a top-level comment. Authors and
Admin/Superuser can delete posts and comments they are permitted to manage.

## API and client integration

Use Swagger at http://localhost:3000/api, or the
[TypeScript client](../packages/client/README.md). Login accepts exactly one
identifier plus the password:

```json
{ "username": "admin", "password": "password123" }
```

Email login remains supported:

```json
{ "email": "admin@teamorbit.local", "password": "password123" }
```

Send `Authorization: Bearer <accessToken>` for authenticated routes.
User responses contain `email: null` when no email is set. Registration and
admin creation can omit email; profile updates can set `email: null` to remove it.
Health is at `GET /health`; metrics are at `GET /metrics`.

## Checks

From `api/`, `npm test` runs unit tests. `npm run test:e2e -- --runInBand` requires
a migrated, seeded test database; set `DATABASE_URL` to a disposable SQLite
file before migrating, seeding, and testing. Integration tests create temporary
accounts and remove them afterward.

From `web/`, run `npm run build`, `npm run lint`, and `npm run test:e2e`.
Install the browser once with `npx playwright install chromium`, or use an
installed Chrome with `PLAYWRIGHT_CHROME=1 npm run test:e2e`. Browser tests mock
API responses and do not alter database records.

From `packages/client/`, `npm test` regenerates types, builds, and tests the SDK.
After API DTO changes, run `npm run openapi:export` from `api/` first.

## Upgrading and backups

Back up the SQLite database and uploads together at a consistent point in time.
With the API stopped, copy `api/prisma/dev.db` (and any SQLite journal/WAL files)
and `api/uploads/`, adjusting paths for your environment.

For an existing installation, apply the optional-email migration before
restarting the updated API:

```bash
cd api
npm run prisma:generate
npx prisma migrate deploy
```

Migration `20261016000000_optional_user_email` makes `User.email` nullable while
preserving accounts, relationships, and uniqueness for supplied email addresses.
Existing email/password logins continue to work. Restore a backup by replacing
the database and uploads together, then restarting the API.

## Production notes

- Change `JWT_SECRET` and run behind HTTPS.
- Keep SQLite and uploads on durable disk.
- Scrape `/metrics` and monitor API availability.
- Configure hosting so web page navigation and API requests reach their intended
  handlers; Vite's development proxy is not a production deployment configuration.

## Troubleshooting

| Symptom | What to check |
|---------|---------------|
| Web loads but API calls fail | API running on `:3000`; Vite proxy targets |
| Login “Account is not active” | User status is PENDING / SUSPENDED / INACTIVE |
| Login “Invalid credentials” | Username and password; choose email mode only for a supplied email |
| Login returns 400 | Send exactly one of username or email, plus password |
| Registration reports duplicate identity | Username or supplied email is already in use |
| Cannot open Users | Need ADMIN or SUPERUSER |
| Role controls seem stale | Focus the tab or wait up to 30 seconds while active |
| No live toasts | Signed in on both clients; socket uses JWT; API up |
| Upload rejected | Image MIME only; maximum 5 MB |
| API rejects missing email or reports schema mismatch | Generate Prisma client and apply migrations before restarting |

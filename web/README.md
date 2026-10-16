# Team Orbit web

React test console for the [Team Orbit API](../README.md), built with Vite,
TanStack Router/Query, shadcn/ui, and MDXEditor.

## Run locally

Start the API on port 3000, then run from `web/`:

```bash
npm install
npm run dev
```

Open http://localhost:5173. Vite proxies API requests and Socket.io to the API;
direct links and reloads on editor pages serve the web app.

## Accounts

Sign in with username and password. Select **Use email instead** to sign in
with an email attached to the account. Seed usernames are `superadmin`,
`admin`, and `member`; their local seed password is `password123`.

Registration requires username, full name, and password. Email is optional.
New accounts remain `PENDING` until an admin activates them on **Users**.
Settings lets members add or remove their email and update their profile or
password. Removing email leaves username login available.

## Content editing and roles

News, blog, and forum creation use `/news/new`, `/blog/new`, and `/forum/new`.
The shared MDXEditor includes a formatting toolbar and Markdown source mode.
Paste image files into rich text mode or use the image toolbar button; uploads
are limited to 5 MB each. Comments and replies use the same editor inline.
Drafts stay in page memory and are discarded when leaving the page.

The Users page lets admins promote USER accounts to ADMIN. Superusers can
assign every role. Open sessions refresh their role every 30 seconds while
active and when the tab regains focus; API permissions change immediately.

## Checks

```bash
npm run build
npm run lint
npx playwright install chromium  # once
npm run test:e2e
```

To use an installed Google Chrome instead, run
`PLAYWRIGHT_CHROME=1 npm run test:e2e`. The suite uses mocked API responses
and does not modify database records. It starts Vite automatically if needed.

See the [usage guide](../docs/usage.md) for API setup and database migration.

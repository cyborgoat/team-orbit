# Usage

## Local development

### 1. API

```bash
cd api
cp .env.example .env   # set JWT_SECRET for anything beyond local play
npm install
npx prisma migrate dev
npx prisma db seed
npm run start:dev
```

Environment variables (see `.env.example`):

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Prisma SQLite path (`file:./dev.db`) |
| `JWT_SECRET` | Signing key for access tokens |
| `JWT_EXPIRES_IN` | Token lifetime (default `7d`) |
| `PORT` | HTTP port (default `3000`) |
| `UPLOAD_DIR` | Relative upload folder (default `uploads`) |

Useful scripts:

```bash
npm run start:dev      # watch mode
npm run build && npm run start:prod
npm test               # unit tests
npm run test:e2e       # needs migrated + seeded DB
npm run prisma:seed    # re-seed users
```

### 2. Web test console

```bash
cd web
npm install
npm run dev
```

Open http://localhost:5173. Vite proxies API and Socket.io to port 3000.

```bash
npm run build          # production build of the test UI
npm run routes:generate  # regenerate TanStack route tree if needed
```

## Typical flows

### Sign in

1. Open http://localhost:5173/login  
2. Use a seed account (e.g. `admin@teamorbit.local` / `password123`)  
3. You land on the home shortcuts page  

Logout clears the token, React Query cache, and Socket.io connection, then returns to `/login`.

### Self-registration

1. `/register` → create account (status `PENDING`)  
2. Sign in as Admin → **Users** → set status to `ACTIVE`  
3. New member can sign in  

### Admin-created user

1. Sign in as Admin or Superuser  
2. **Users** → **Create user**  
3. Set role (`USER` / `ADMIN`; Superuser-only for `SUPERUSER`) and status (default `ACTIVE`)  
4. Share credentials; they can sign in immediately  

### Content + live notifications

1. Keep two browsers (or one + Swagger) signed in  
2. Create an announcement, event, news, or blog post  
3. Other connected clients get a toast; **Notifications** lists the persisted item  
4. Mark as read from the Notifications page  

### Uploads

Use **Uploads** to verify `POST /uploads`, or attach a cover from Events / News / Blog dialogs. Returned paths are served from the API as `/uploads/...`.

## API exploration

- Prefer Swagger at http://localhost:3000/api for request/response shapes  
- Authorize with the JWT from login (`accessToken`)  
- Health check: `GET /health`  
- Metrics: `GET /metrics`  

## Backup and restore

Copy these together (same point in time):

1. `api/prisma/dev.db` (and `dev.db-journal` if present)  
2. `api/uploads/`  

Restore by replacing those paths and restarting the API.

## Production notes (small deploy)

- Change `JWT_SECRET`  
- Run behind HTTPS; keep SQLite + uploads on durable disk  
- Scrape `/metrics`; a single “target down” alert is enough for ~100 members  
- Replace `web/` with your own frontend when ready — treat the Nest API as the contract  

## Troubleshooting

| Symptom | What to check |
|---------|----------------|
| Web loads but API calls fail | API running on `:3000`; Vite proxy targets |
| Login “Account is not active” | User status is PENDING / SUSPENDED / INACTIVE |
| Cannot open Users | Need ADMIN or SUPERUSER |
| No live toasts | Signed in on both clients; socket uses JWT; API up |
| `ECONNRESET` on Vite WS proxy after logout | Expected if a socket was mid-close; refresh if UI is stuck — logout should navigate to `/login` |
| Upload rejected | Image MIME only, max ~5MB |

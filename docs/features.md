# Features

## Domains

### Users

Manage team members with roles and lifecycle status.

| Field | Notes |
|-------|--------|
| Username, full name, email | Unique username/email |
| Password | bcrypt-hashed |
| Role | `SUPERUSER`, `ADMIN`, `USER` |
| Status | `ACTIVE`, `INACTIVE`, `PENDING`, `SUSPENDED`, `DELETED` |
| Avatar URL | Optional, from uploads |

**Ways to add members**

1. **Self-register** (`POST /auth/register`) → status `PENDING` (cannot log in until activated).
2. **Admin create** (`POST /users`) → typically `ACTIVE` so they can sign in immediately.

**Permissions**

| Action | SUPERUSER | ADMIN | USER |
|--------|-----------|-------|------|
| Login (if ACTIVE) | yes | yes | yes |
| Update own profile (name, email, avatar) | yes | yes | yes |
| Change own password | yes | yes | yes |
| List / create / update / soft-delete users | yes | yes* | no |
| Assign SUPERUSER role | yes | no | no |
| Modify another SUPERUSER | yes | no | no |

\*Admins cannot demote/delete SUPERUSER accounts or grant SUPERUSER.

Soft delete sets status to `DELETED` rather than removing the row.

### Announcements

Short team notices (`title`, `description`, author). Creating one emits a notification.

### Events

Scheduled items with `startAt`, `endAt`, `location`, and optional `coverImageUrl`. Creating one emits a notification.

### News (markdown)

Articles with markdown `content`, `tags[]`, and optional cover. Creating one emits a notification.

### Blog posts (markdown)

Same content model as news, kept as a separate resource for clearer product and API testing.

### Uploads

Authenticated image upload; returns a public path like `/uploads/<uuid>.jpg` for use as covers or avatars.

### Notifications

- Persisted when announcements, events, news, or blog posts are created
- Live toast via Socket.io `notification:new`
- List + mark-read over REST

## HTTP API (summary)

All content and user routes (except register/login) require a Bearer JWT unless noted.

| Area | Methods | Path prefix |
|------|---------|-------------|
| Auth | POST register/login, GET/PATCH me, POST change-password | `/auth` |
| Users | GET/POST/PATCH/DELETE | `/users` |
| Announcements | GET/POST/PATCH/DELETE | `/announcements` |
| Events | GET/POST/PATCH/DELETE | `/events` |
| News | GET/POST/PATCH/DELETE | `/news` |
| Blog | GET/POST/PATCH/DELETE | `/blog-posts` |
| Uploads | POST | `/uploads` |
| Notifications | GET list, POST `:id/read` | `/notifications` |
| Health | GET | `/health` |
| Metrics | GET | `/metrics` |
| Swagger | UI | `/api` |

List endpoints support pagination (`page`, `limit`) and simple filters (`q`, `tag`, `status` where applicable).

Interactive OpenAPI docs: http://localhost:3000/api

## Test UI features (`web/`)

| Page | Purpose |
|------|---------|
| `/login` | Sign in |
| `/register` | Self-signup (PENDING) |
| `/` | Home shortcuts (authenticated) |
| `/announcements` | List + create dialog |
| `/events` | List + create with datetime-local + cover |
| `/news` | Markdown news CRUD |
| `/blog` | Markdown blog CRUD |
| `/users` | Create user (Admin+), status changes |
| `/settings` | Self-service profile + change password |
| `/notifications` | Inbox + mark read + live toasts |
| `/uploads` | Standalone image upload check |

## Observability

- **Pino** structured HTTP logs with request IDs
- **Prometheus** default metrics at `/metrics`
- Alertmanager is optional ops config (scrape failure / API down), not an in-app feature

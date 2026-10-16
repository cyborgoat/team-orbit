# Features

## Domains

### Users

Manage team members with roles and lifecycle status. Sign in with username and
password by default, or choose email/password when the account has email.
Email is optional for both self-registration and admin-created accounts;
profile settings can add or remove it.

| Field | Notes |
|-------|--------|
| Username, full name, optional email | Unique username; email unique when provided |
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

\*Admins can promote USER to ADMIN, but cannot change existing ADMIN or
SUPERUSER roles or assign SUPERUSER. The Users page exposes permitted role
changes. The API enforces the current saved role on each authenticated HTTP
request; open web sessions refresh their profile every 30 seconds while active
and on tab focus.

Soft delete sets status to `DELETED` rather than removing the row.

### Announcements

Short team notices (`title`, `description`, author). Creating one emits a notification.

### Events

Scheduled items with `startAt`, `endAt`, `location`, and optional `coverImageUrl`. Creating one emits a notification.

### News (markdown)

Articles with markdown `content`, `tags[]`, and optional cover. Creating one emits a notification.

### Blog posts (markdown)

Same content model as news, kept as a separate resource for clearer product and API testing.

### Forum

Team discussion board with markdown posts and comments.

| Capability | Notes |
|------------|--------|
| Posts | Any authenticated user; markdown body; images via `![](/uploads/...)` |
| Comments | Top-level + one-level replies |
| Votes | Up/down (or clear) on posts and comments; one vote per user |
| Moderation | Authors edit/delete their own; Admin/Superuser can moderate any |
| Notifications | Emitted on new post and new comment |

### Uploads

Authenticated image upload; returns a public path like `/uploads/<uuid>.jpg` for use as covers, avatars, or markdown embeds.

### Notifications

- Persisted when announcements, events, news, blog posts, or forum posts/comments are created
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
| Forum | GET/POST/PATCH/DELETE posts & comments, PUT votes | `/forum-posts`, `/forum-comments` |
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
| `/login` | Username/password; optional email login mode |
| `/register` | Self-signup with optional email (PENDING) |
| `/` | Home shortcuts (authenticated) |
| `/announcements` | List + create dialog |
| `/events` | List + create with datetime-local + cover |
| `/news` | News list, previews, and permitted deletion |
| `/news/new` | Dedicated news creation page (Admin+) |
| `/blog` | Blog list, previews, and permitted deletion |
| `/blog/new` | Dedicated blog creation page (Admin+) |
| `/forum` | Forum list |
| `/forum/new` | Dedicated forum creation page |
| `/forum/$postId` | Post detail, comments, votes |
| `/users` | Create user (Admin+), status and permitted role changes |
| `/settings` | Self-service profile + change password |
| `/notifications` | Inbox + mark read + live toasts |
| `/uploads` | Standalone image upload check |

All Markdown creation fields use MDXEditor with a formatting toolbar and source
mode. Paste image files into rich text mode or use the image toolbar button
(maximum 5 MB each). News, blog, and forum creation pages include an inline
preview; comments and replies remain inline. Drafts are held in page memory.

## Observability

- **Pino** structured HTTP logs with request IDs
- **Prometheus** default metrics at `/metrics`
- Alertmanager is optional ops config (scrape failure / API down), not an in-app feature

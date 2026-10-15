# @goatcheese/team-orbit-client

Typed TypeScript client for the **Team Orbit API**, a team hub with members, events,
announcements, news, blog posts, a forum with comments and votes, and notifications.

- Fully typed requests **and** responses, generated from the API's OpenAPI spec
- Tiny: a thin wrapper over [`openapi-fetch`](https://openapi-ts.dev/openapi-fetch/), with no codegen step for you
- Works in browsers, Node 18+, Deno, Bun and edge runtimes (anything with `fetch`)
- Handles the `Authorization: Bearer` header for you

> This package is only the client. You need a running Team Orbit API
> ([source](https://github.com/cyborgoat/team-orbit)) to call.

## Install

```bash
npm install @goatcheese/team-orbit-client
```

## Quick start

```ts
import { createTeamOrbitClient } from '@goatcheese/team-orbit-client';

const orbit = createTeamOrbitClient({
  baseUrl: 'https://orbit.example.com',
  token: () => localStorage.getItem('token') ?? undefined,
});

// 1. Log in and keep the token
const login = await orbit.POST('/auth/login', {
  body: { email: 'admin@teamorbit.local', password: 'password123' },
});
if (login.error) throw new Error(String(login.error.message));
localStorage.setItem('token', login.data.accessToken);

// 2. Call any endpoint, with typed params and results
const posts = await orbit.GET('/forum-posts', {
  params: { query: { page: 1, limit: 10, q: 'welcome' } },
});
posts.data?.items[0].commentCount; // number
posts.data?.items[0].author.username; // string
```

## Options

`createTeamOrbitClient(options)`

| Option | Type | Description |
| --- | --- | --- |
| `baseUrl` | `string` | Base URL of your deployed API, with no trailing path. **Required.** |
| `token` | `string \| () => string \| undefined \| Promise<...>` | JWT sent as `Authorization: Bearer <token>`. A function is called on every request, so it can read from storage or refresh a token. Omit it for public endpoints and for logging in. |
| `fetch` | `typeof fetch` | Custom `fetch`, useful for tests, proxies or older runtimes. |

The returned client has `GET`, `POST`, `PUT`, `PATCH`, `DELETE` (plus `use()` for
[middleware](https://openapi-ts.dev/openapi-fetch/middleware-auth)). Paths, params, bodies and
responses are all checked by TypeScript.

## Handling errors

Calls never throw on HTTP errors. Each returns `{ data, error, response }`:

```ts
const { data, error, response } = await orbit.GET('/auth/me');

if (error) {
  // e.g. { statusCode: 401, message: 'Unauthorized' }
  console.error(response.status, error);
} else {
  console.log(data.email);
}
```

`data` is typed for 2xx responses. `error` is typed as the API's error body,
`{ statusCode: number; message: string | string[]; error?: string }`. `message` is an array
when request validation fails. Network failures still reject the promise.

## Common tasks

**Path and query parameters**

```ts
await orbit.GET('/events/{id}', { params: { path: { id } } });
await orbit.GET('/news', { params: { query: { tag: 'release', page: 2 } } });
```

**Create content** (events, announcements, news and blog posts need an `ADMIN` or `SUPERUSER` token)

```ts
await orbit.POST('/news', {
  body: { title: 'v2 released', content: '## Notes\n...', tags: ['release'] },
});
```

**Forum: post, comment, vote**

```ts
const post = await orbit.POST('/forum-posts', {
  body: { title: 'Lunch?', content: 'Where should we go?' },
});
const id = post.data!.id;

await orbit.POST('/forum-posts/{id}/comments', {
  params: { path: { id } },
  body: { content: 'Tacos!' },
});

const vote = await orbit.PUT('/forum-posts/{id}/vote', {
  params: { path: { id } },
  body: { value: 1 }, // 1 = up, -1 = down, 0 = clear
});
vote.data?.score;
```

**Upload an image** (JPEG/PNG/etc., max 5 MB). The generated type for the body is a
placeholder, so build the `FormData` yourself with `bodySerializer`:

```ts
const form = new FormData();
form.append('file', file);

const up = await orbit.POST('/uploads', {
  body: { file: '' },
  bodySerializer: () => form,
});
up.data?.url; // '/uploads/<uuid>.png' (relative to baseUrl); embed in Markdown as ![](url)
```

**Use the generated types directly**

```ts
import type { components } from '@goatcheese/team-orbit-client';

type ForumPost = components['schemas']['ForumPostDetailDto'];
type Role = components['schemas']['UserDto']['role']; // 'SUPERUSER' | 'ADMIN' | 'USER'
```

## Roles and permissions

| Role | Can do |
| --- | --- |
| `USER` | Read events, announcements, news, blog posts, forum and notifications; post, comment and vote in the forum; edit or delete their own forum posts and comments; manage their own profile. |
| `ADMIN` | Everything a `USER` can, plus manage users, create/update/delete events, announcements, news and blog posts, and moderate the forum. |
| `SUPERUSER` | Everything an `ADMIN` can, plus create and modify superusers. |

New accounts from `POST /auth/register` start as `PENDING` and **cannot log in** until an
admin sets their status to `ACTIVE`. Login is rate limited to 10 requests per minute.

## API reference

Generated from the OpenAPI spec. Every request body and response name below is a schema
under `components['schemas']`. List endpoints accept `page`, `limit` (max 100) and `q`
(search); `news` and `blog-posts` also accept `tag`, and `users` accepts `status`.

<!-- api:start -->
#### auth

| Method | Path | Auth | Request body | Response |
| --- | --- | --- | --- | --- |
| `POST` | `/auth/register` | public | `RegisterDto` | `UserDto` |
| `POST` | `/auth/login` | public | `LoginDto` | `LoginResponseDto` |
| `GET` | `/auth/me` | Bearer |  | `UserDto` |
| `PATCH` | `/auth/me` | Bearer | `UpdateProfileDto` | `UserDto` |
| `POST` | `/auth/change-password` | Bearer | `ChangePasswordDto` | `OkDto` |

#### users

| Method | Path | Auth | Request body | Response |
| --- | --- | --- | --- | --- |
| `GET` | `/users` | Bearer |  | `PaginatedUsersDto` |
| `POST` | `/users` | Bearer | `CreateUserDto` | `UserDto` |
| `GET` | `/users/{id}` | Bearer |  | `UserDto` |
| `PATCH` | `/users/{id}` | Bearer | `UpdateUserDto` | `UserDto` |
| `DELETE` | `/users/{id}` | Bearer |  | `UserDto` |

#### announcements

| Method | Path | Auth | Request body | Response |
| --- | --- | --- | --- | --- |
| `GET` | `/announcements` | Bearer |  | `PaginatedAnnouncementsDto` |
| `POST` | `/announcements` | Bearer | `CreateAnnouncementDto` | `AnnouncementDto` |
| `GET` | `/announcements/{id}` | Bearer |  | `AnnouncementDto` |
| `PATCH` | `/announcements/{id}` | Bearer | `UpdateAnnouncementDto` | `AnnouncementDto` |
| `DELETE` | `/announcements/{id}` | Bearer |  | `AnnouncementRecordDto` |

#### notifications

| Method | Path | Auth | Request body | Response |
| --- | --- | --- | --- | --- |
| `GET` | `/notifications` | Bearer |  | `PaginatedNotificationsDto` |
| `POST` | `/notifications/{id}/read` | Bearer |  | `NotificationReadDto` |

#### events

| Method | Path | Auth | Request body | Response |
| --- | --- | --- | --- | --- |
| `GET` | `/events` | Bearer |  | `PaginatedEventsDto` |
| `POST` | `/events` | Bearer | `CreateEventDto` | `EventDto` |
| `GET` | `/events/{id}` | Bearer |  | `EventDto` |
| `PATCH` | `/events/{id}` | Bearer | `UpdateEventDto` | `EventDto` |
| `DELETE` | `/events/{id}` | Bearer |  | `EventRecordDto` |

#### news

| Method | Path | Auth | Request body | Response |
| --- | --- | --- | --- | --- |
| `GET` | `/news` | Bearer |  | `PaginatedNewsListDto` |
| `POST` | `/news` | Bearer | `CreateNewsDto` | `NewsDto` |
| `GET` | `/news/{id}` | Bearer |  | `NewsDto` |
| `PATCH` | `/news/{id}` | Bearer | `UpdateNewsDto` | `NewsDto` |
| `DELETE` | `/news/{id}` | Bearer |  | `NewsDeletedDto` |

#### blog-posts

| Method | Path | Auth | Request body | Response |
| --- | --- | --- | --- | --- |
| `GET` | `/blog-posts` | Bearer |  | `PaginatedBlogPostListDto` |
| `POST` | `/blog-posts` | Bearer | `CreateBlogPostDto` | `BlogPostDto` |
| `GET` | `/blog-posts/{id}` | Bearer |  | `BlogPostDto` |
| `PATCH` | `/blog-posts/{id}` | Bearer | `UpdateBlogPostDto` | `BlogPostDto` |
| `DELETE` | `/blog-posts/{id}` | Bearer |  | `BlogPostDeletedDto` |

#### forum-posts

| Method | Path | Auth | Request body | Response |
| --- | --- | --- | --- | --- |
| `GET` | `/forum-posts` | Bearer |  | `PaginatedForumPostsDto` |
| `POST` | `/forum-posts` | Bearer | `CreateForumPostDto` | `ForumPostCreatedDto` |
| `GET` | `/forum-posts/{id}` | Bearer |  | `ForumPostDetailDto` |
| `PATCH` | `/forum-posts/{id}` | Bearer | `UpdateForumPostDto` | `ForumPostDto` |
| `DELETE` | `/forum-posts/{id}` | Bearer |  | `OkDto` |
| `POST` | `/forum-posts/{id}/comments` | Bearer | `CreateForumCommentDto` | `ForumCommentDto` |
| `PUT` | `/forum-posts/{id}/vote` | Bearer | `VoteDto` | `VoteResultDto` |
| `PATCH` | `/forum-comments/{id}` | Bearer | `UpdateForumCommentDto` | `ForumCommentBaseDto` |
| `DELETE` | `/forum-comments/{id}` | Bearer |  | `OkDto` |
| `PUT` | `/forum-comments/{id}/vote` | Bearer | `VoteDto` | `VoteResultDto` |

#### uploads

| Method | Path | Auth | Request body | Response |
| --- | --- | --- | --- | --- |
| `POST` | `/uploads` | Bearer | multipart | `UploadResultDto` |

#### health

| Method | Path | Auth | Request body | Response |
| --- | --- | --- | --- | --- |
| `GET` | `/health` | public |  | `HealthDto` |
<!-- api:end -->

## Not included

- **Realtime notifications.** The API broadcasts new notifications over Socket.IO. Use
  `socket.io-client` for that. This package covers the REST API only (`GET /notifications` and
  `POST /notifications/{id}/read` are included).
- **Per-status error types.** Every failure shares one `error` type, so use `response.status`
  (401, 403, 404, ...) to tell them apart.

## Versioning

The client is generated from the API's OpenAPI spec, so new endpoints and fields show up
in the next release of this package. Pin the version if your deployed API lags behind.

## Contributing / regenerating

In the [repository](https://github.com/cyborgoat/team-orbit):

```bash
cd api && npm run openapi:export          # writes openapi/openapi.json
cd ../packages/client && npm run build    # regenerates types and this README's API table
./scripts/check-sdk.sh                    # from the repo root: fails if either is stale
```

## License

MIT

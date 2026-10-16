# @goatcheese/team-orbit-client

Typed TypeScript client for the **Team Orbit API**, a team hub with members, events,
announcements, news, blog posts, a forum with comments and votes, and notifications.

- Fully typed requests **and** responses, generated from the API's OpenAPI spec
- Ergonomic helpers (`orbit.news.list()`, `orbit.auth.login()`, ...) on top of [`openapi-fetch`](https://openapi-ts.dev/openapi-fetch/), with no codegen step for you
- Works in browsers, Node 18+, Deno, Bun and edge runtimes (anything with `fetch`)
- Handles login, token storage and the `Authorization: Bearer` header for you

> This package is only the client. You need a running Team Orbit API
> ([source](https://github.com/cyborgoat/team-orbit)) to call.

## Install

```bash
npm install @goatcheese/team-orbit-client
```

## Quick start

```ts
import { createTeamOrbitClient } from '@goatcheese/team-orbit-client';

const orbit = createTeamOrbitClient({ baseUrl: 'https://orbit.example.com' });

// Log in once: the token is remembered for every later call
await orbit.auth.login('admin', 'password123');

const { items } = await orbit.forum.listPosts({ page: 1, limit: 10, q: 'welcome' });
items[0].commentCount; // number

await orbit.news.create({ title: 'v2 released', content: '## Notes\n...', tags: ['release'] });
await orbit.forum.votePost(items[0].id, 1); // 1 = up, -1 = down, 0 = clear
```

Persisting the token (e.g. across page loads)? Pass `token: () => localStorage.getItem('token') ?? undefined`
instead, or call `orbit.setToken(...)`. A token from `login()` / `setToken()` takes precedence over the option.

## Authentication and optional email

The helper signature is `auth.login(identifier, password, method?)`. Without a
method, identifiers containing `@` use email login; all others use username.
Pass `'username'` or `'email'` to choose explicitly. The helper sends exactly
one API identifier and remembers the returned access token.

```ts
import type { LoginMethod, User } from '@goatcheese/team-orbit-client';

await orbit.auth.login('member', password);                // username
await orbit.auth.login('member@example.com', password);   // legacy email call
const method: LoginMethod = 'username';
await orbit.auth.login('name@work', password, method);     // username containing @
await orbit.auth.login('member@example.com', password, 'email');

// Email is optional; the account remains PENDING until an admin activates it.
const registered = await orbit.auth.register({
  username: 'new-member',
  fullName: 'New Member',
  password: 'a-strong-password',
});

const me: User = await orbit.auth.me();
console.log(me.email ?? 'No email supplied');
await orbit.auth.updateMe({ email: 'member@example.com' });
await orbit.auth.updateMe({ email: null }); // removes email login; username still works
```

`register` and `users.create` may omit `email` (or send `null`). User responses
always include `email` as `string | null`; handle `null` in consuming UIs.
Supplied email addresses must be valid and unique. A profile update that omits
email leaves it unchanged; `null` or an empty string removes it.

Raw `POST /auth/login` requests use either `{ username, password }` or
`{ email, password }`; both identifiers together, or neither, return 400.
Unknown users and wrong passwords return 401. Self-registration keeps the
existing admin activation requirement.

## Helpers

Every helper returns the parsed response body and **throws** a `TeamOrbitError` on non-2xx.
All params, bodies and responses are typed from the OpenAPI spec.

| Namespace | Methods |
| --- | --- |
| `orbit.auth` | `login(identifier, password, method?)`, `register(body)`, `me()`, `updateMe(body)`, `changePassword(body)`, `logout()` |
| `orbit.users`, `events`, `announcements`, `news`, `blogPosts` | `list(query?)`, `get(id)`, `create(body)`, `update(id, body)`, `delete(id)`, `iterate(query?)` |
| `orbit.forum` | `listPosts`, `getPost`, `createPost`, `updatePost`, `deletePost`, `addComment(postId, body)`, `updateComment`, `deleteComment`, `votePost(id, value)`, `voteComment(id, value)` |
| `orbit.notifications` | `list(query?)`, `markRead(id)` |
| `orbit.uploads` | `upload(file, filename?)` |
| `orbit.health()` | |

```ts
import { TeamOrbitError } from '@goatcheese/team-orbit-client';

try {
  await orbit.events.get(id);
} catch (e) {
  if (e instanceof TeamOrbitError && e.status === 404) console.log('no such event');
  else throw e;
}

// Walk every page of a list without managing page numbers
for await (const item of orbit.news.iterate({ tag: 'release' })) console.log(item.title);

// Upload an image (JPEG/PNG/etc., max 5 MB); embed the url in Markdown as ![](url)
const { url } = await orbit.uploads.upload(file);
// Returned URLs are relative to the API origin, not necessarily your frontend.
const imageUrl = new URL(url, 'https://orbit.example.com').href;
await orbit.forum.createPost({ title: 'Team photo', content: `![Team photo](${imageUrl})` });
```

Friendly types are exported too: `User`, `Role`, `UserStatus`, `LoginMethod`, `Event`, `Announcement`, `News`,
`BlogPost`, `ForumPost`, `ForumComment`, `Notification`.

For example, an authorized admin can promote a member without changing other fields:

```ts
await orbit.users.update(memberId, { role: 'ADMIN' });
```

The SDK does not poll `/auth/me`; consumers should refresh it when they need to
update role-dependent controls. The API enforces the current saved role on each
authenticated HTTP request.

## Options

`createTeamOrbitClient(options)`

| Option | Type | Description |
| --- | --- | --- |
| `baseUrl` | `string` | Base URL of your deployed API, with no trailing path. **Required.** |
| `token` | `string \| () => string \| undefined \| Promise<...>` | JWT sent as `Authorization: Bearer <token>`. A function is called on every request. Optional: `auth.login()` stores a token for you. |
| `fetch` | `typeof fetch` | Custom `fetch`, useful for tests, proxies or older runtimes. |

## Low-level API

The client is also a plain [`openapi-fetch`](https://openapi-ts.dev/openapi-fetch/) client with
`GET`, `POST`, `PUT`, `PATCH`, `DELETE` and `use()` ([middleware](https://openapi-ts.dev/openapi-fetch/middleware-auth)).
These **never throw on HTTP errors**; each returns `{ data, error, response }`:

```ts
const { data, error, response } = await orbit.GET('/forum-posts/{id}', {
  params: { path: { id } },
});
if (error) console.error(response.status, error); // { statusCode, message: string | string[], error? }
else console.log(data.title);
```

Network failures still reject the promise. Use this when you want to branch on errors without
`try/catch`, or for endpoints without a helper.

## Roles and permissions

| Role | Can do |
| --- | --- |
| `USER` | Read events, announcements, news, blog posts, forum and notifications; post, comment and vote in the forum; edit or delete their own forum posts and comments; manage their own profile. |
| `ADMIN` | Everything a `USER` can, plus manage users, promote USER to ADMIN, create/update/delete events, announcements, news and blog posts, and moderate the forum. Cannot change existing ADMIN or SUPERUSER roles. |
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
Version 0.3.0 adds username login and makes `User.email` nullable; consumers must handle `null`. Existing
`login(email, password)` calls remain supported. Apply the API's optional-email
migration before using registration without email. See [0.3.0 release notes](CHANGELOG.md).

## Contributing / regenerating

In the [repository](https://github.com/cyborgoat/team-orbit):

```bash
cd api
npm run openapi:export       # writes openapi/openapi.json
cd ../packages/client
npm test                    # regenerate types/API table, compile, and run tests
cd ../..
./scripts/check-sdk.sh       # checks generated files against Git
```

The consistency script compares generated files with Git. Regenerated changes
must be included in the same commit as the API change for that check to pass.

## License

MIT

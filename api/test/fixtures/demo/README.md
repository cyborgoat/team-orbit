# Optional demo fixtures

Sign in with **username and password**. Choose **Use email instead** to use
an account's email address.

| Username | Optional email | Password | Role |
|----------|----------------|----------|------|
| `superadmin` | `super@teamorbit.local` | `password123` | SUPERUSER |
| `admin` | `admin@teamorbit.local` | `password123` | ADMIN |
| `member` | `user@teamorbit.local` | `password123` | USER |

## Dataset

From `api/`, explicitly opt in on a disposable or development database:

```bash
NODE_ENV=development PUBLIC_BASE_URL=http://localhost:3000 npm run demo:seed
```

This command refuses to run with `NODE_ENV=production`. It requires an explicit
public service URL and copies the sample image files into your upload directory.
Run `npm run test:seed` to verify both bootstrap and demo fixtures in a temporary
database.

On a fresh database the seed creates 12 users, 6 events, 6 announcements, 8 news articles,
8 blog posts, 10 forum threads, 30 comments/replies, 90 votes, 16 notifications,
and 24 notification reads. Events include past and upcoming dates relative to
the first seed run. Additional fictional users cover all roles and account
statuses, including accounts without email addresses. Newly created demo
accounts use `password123`; inactive statuses still prevent normal sign-in.

Seeding is transactional and additive: stable identifiers prevent duplicates,
existing credentials are preserved, and reruns do not reset votes or scores.
Missing fixtures are recreated; existing fixture edits are retained. Use `npm run test:seed` to verify the dataset and repeatability against an isolated temporary SQLite database.

News, blogs, and forum discussions include examples following the
[GitHub Flavored Markdown specification](https://github.github.com/gfm/):
tables with alignment and escaped pipes, task lists, strikethrough, reference
links, autolinks, linked images, nested lists, quotes, and fenced code blocks.
Demo illustrations live alongside these fixtures in `assets/`. The opt-in seed
copies them into the configured upload folder under `demo/`; the normal uploads
service serves them at `/uploads/demo/`. They are not bundled into the API build.
Set `PUBLIC_BASE_URL` explicitly before seeding.

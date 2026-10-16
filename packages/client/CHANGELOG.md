# Changelog

## 0.3.0 — 2026-10-16

- Support username/password login while retaining existing email/password calls.
- Add an optional explicit `LoginMethod` (`username` or `email`) to the login helper.
  Without it, identifiers containing `@` use email login.
- Allow registration and admin-created users without email.
- Return `User.email` as `string | null`; consumers must handle missing email.
- Allow profile updates to clear email with `null` or an empty string.
- Refresh generated OpenAPI types, usage examples, and auth compatibility tests.

The API must apply migration `20261016000000_optional_user_email` before using
accounts without email. Self-registration still requires admin activation.

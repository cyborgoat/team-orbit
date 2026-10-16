# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.


## Content editing and roles

News, blog, and forum creation use `/news/new`, `/blog/new`, and `/forum/new`.
The shared MDXEditor includes a formatting toolbar and Markdown source mode.
Paste image files into rich text mode or use the image toolbar button; uploads
are limited to 5 MB each. Comments and replies use the same editor inline.
Drafts stay in page memory and are discarded when leaving the page.

The Users page lets admins promote USER accounts to ADMIN. Superusers can
assign every role. Open sessions refresh their role every 30 seconds while
active and when the tab regains focus; API permissions change immediately.

## Browser checks

Run `npx playwright install chromium` once, then `npm run test:e2e`.
To use an installed Google Chrome instead, run
`PLAYWRIGHT_CHROME=1 npm run test:e2e`. The suite uses mocked API responses
and does not modify database records. It starts Vite automatically if needed.

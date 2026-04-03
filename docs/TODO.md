# TODO

## Dependencies

- [x] ~~**Replace `react-toast-notifications`**~~ — Done. Replaced with inline `ToastContext` (src/context/ToastContext.tsx). 58 files updated.

- [x] ~~**Switch from `sqlite3` to `better-sqlite3`**~~ — Done. TypeORM type changed to `better-sqlite3` in `server/datasource.ts`.

- [ ] **Enable Turbopack for production builds** — Currently using `--webpack` flag because Turbopack's SSR externalization doesn't resolve transitive deps (SWR → dequal, use-sync-external-store). Wait for a future Next.js release to fix this, then remove `--webpack` from `build:next` script.

- [ ] **Tailwind CSS 3→4** — Complete config rewrite (`tailwind.config.js` → CSS-based config), class name changes, PostCSS plugin changes. Every component potentially affected. Dedicated session.

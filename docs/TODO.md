# TODO

## Dependencies

- [x] ~~**Replace `react-toast-notifications`**~~ — Done. Replaced with inline `ToastContext` (src/context/ToastContext.tsx). 58 files updated.

- [ ] **Enable Turbopack for production builds** — Currently using `--webpack` flag because Turbopack's SSR externalization doesn't resolve transitive deps (SWR → dequal, use-sync-external-store). Wait for a future Next.js release to fix this, then remove `--webpack` from `build:next` script.

- [ ] **Switch from `sqlite3` to `better-sqlite3`** — TypeORM supports `better-sqlite3` driver natively. Better maintained, synchronous API, may reduce SQLITE_BUSY contention from concurrent background jobs. Change `type: 'sqlite'` to `type: 'better-sqlite3'` in `server/datasource.ts`.

- [ ] **Tailwind CSS 3→4** — Complete config rewrite (`tailwind.config.js` → CSS-based config), class name changes, PostCSS plugin changes. Every component potentially affected. Dedicated session.

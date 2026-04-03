# TODO

## Dependencies

- [ ] **Replace `react-toast-notifications`** — Abandoned package (last publish 2020, peer dep `react@^16.8.0 || ^17.0.0`). Depends on `@emotion/core` which was renamed to `@emotion/react` years ago. Turbopack's SSR can't resolve it, forcing us to build with `--webpack` instead. Used in 61 files (122 imports). Replace with a maintained alternative (e.g. `react-hot-toast`, `sonner`, or a custom implementation).

- [ ] **Replace `react-toast-notifications` → enables Turbopack** — Once replaced, remove `--webpack` flag from `build:next` script to use Next.js 16's default Turbopack bundler (faster builds).

- [ ] **Switch from `sqlite3` to `better-sqlite3`** — TypeORM supports `better-sqlite3` driver natively. Better maintained, synchronous API, may reduce SQLITE_BUSY contention from concurrent background jobs. Change `type: 'sqlite'` to `type: 'better-sqlite3'` in `server/datasource.ts`.

- [ ] **Tailwind CSS 3→4** — Complete config rewrite (`tailwind.config.js` → CSS-based config), class name changes, PostCSS plugin changes. Every component potentially affected. Dedicated session.

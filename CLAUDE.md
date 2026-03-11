# Seerr - Project Guide

## What is Seerr?
Media request management application integrating with Jellyfin, Plex, and Emby. Users browse/search content via a web UI, submit requests, and Seerr routes them to Sonarr/Radarr for automated downloading and library management. Supports watchlists, blocklists, issues tracking, granular permissions, and notifications across Discord, Email, Slack, Telegram, and more.

## Architecture
- **Backend**: Node.js + Express 5 + TypeScript (`server/`)
- **Frontend**: Next.js 14 + React 18 + Tailwind CSS (`src/`)
- **Database**: SQLite (default) or PostgreSQL via TypeORM
- **API**: REST v1 with OpenAPI spec (`seerr-api.yml`), validated by express-openapi-validator
- **Auth**: Session-based (cookies) + API key (`X-API-Key` header)
- **i18n**: react-intl with 30+ language files in `src/i18n/locale/`

## Key Directories
| Directory | Purpose |
|---|---|
| `server/api/` | External API integrations (Plex, Jellyfin, TMDB, Radarr, Sonarr, etc.) |
| `server/entity/` | TypeORM entities (User, Media, MediaRequest, Issue, etc.) |
| `server/routes/` | Express route handlers — maps to `/api/v1/*` |
| `server/lib/` | Core logic: notifications, permissions, settings, scanners |
| `server/migration/` | DB migrations, separate `sqlite/` and `postgres/` subdirs |
| `server/models/` | Data transform models (Movie, TV, Person) |
| `server/templates/` | Email templates (Pug format) |
| `src/pages/` | Next.js pages and routing |
| `src/components/` | React components |
| `src/hooks/` | Custom React hooks (useUser, useSettings, useLocale, etc.) |
| `src/context/` | React Context providers |
| `src/i18n/` | Internationalization — locale JSON files |
| `tests/e2e/` | Playwright end-to-end tests |

## Code Style
- **TypeScript**: 2-space indent, single quotes, ES5 trailing commas
- **Imports**: Absolute imports via `@server/*` and `@app/*` path aliases — no relative imports
- **Formatting**: Prettier with organize-imports and tailwindcss plugins
- **Linting**: ESLint with @typescript-eslint, jsx-a11y, @next/next rules
- **EditorConfig**: UTF-8, LF line endings, 2-space indent, trim trailing whitespace
- **Commits**: Conventional commits enforced by commitlint; commitizen interactive prompt via husky
- **Pre-commit**: lint-staged runs ESLint + Prettier on staged files

## Prerequisites
- **Node.js** >=22.0.0
- **pnpm** >=10.0.0 (activate via `corepack enable`)
- **Python** (for native module compilation via node-gyp)
- **node-gyp** (for sqlite3 native bindings)

## Build & Run
```bash
# Install dependencies
pnpm install

# Development (hot-reload, nodemon watches server/)
pnpm dev                   # http://localhost:5055

# Production build
pnpm build                 # builds Next.js frontend + TypeScript server
pnpm start                 # NODE_ENV=production, runs migrations, serves on :5055

# Individual build steps
pnpm build:next            # Next.js frontend only
pnpm build:server          # TypeScript server only
```

Port is configurable via `$PORT` env var (default 5055).

## Deploy (Local)
**Destination:** `D:\Apps\Seerr`

```bash
# One-step build + deploy
bash deploy.sh                 # uses default dest D:/Apps/Seerr
bash deploy.sh /path/to/dest   # custom destination

# Or manually:
pnpm build
# Copy: dist/, .next/, node_modules/, public/, package.json,
#        pnpm-lock.yaml, seerr-api.yml, next.config.js,
#        postcss.config.js, tailwind.config.js
```

Start the deployed instance:
```bash
cd D:/Apps/Seerr
NODE_ENV=production node dist/index.js   # or: pnpm start
```

### System Tray Manager
`D:\Apps\Seerr\Seerr-Tray.vbs` — double-click to launch a tray icon (like Radarr/Sonarr).
- Auto-starts the server on launch
- Right-click: Start / Stop / Open Seerr / Exit
- Double-click tray icon: Open in browser
- No console window (VBS wrapper hides PowerShell)
- Add to `shell:startup` for auto-start on login

## Database
- **ORM**: TypeORM 0.3
- **SQLite**: `config/db/db.sqlite3` (WAL mode enabled)
- **PostgreSQL**: configured via env vars (`DB_TYPE`, `DB_HOST`, `DB_PORT`, etc.)
- **Migrations**: separate paths for sqlite and postgres
```bash
pnpm migration:generate    # auto-generate from entity changes
pnpm migration:create      # create empty migration
pnpm migration:run         # apply pending migrations
```

## Testing
- **Unit tests**: Vitest (`pnpm test`)
- **E2E tests**: Playwright (`pnpm test:e2e`)
- **Base URL**: http://localhost:5055
```bash
pnpm test                  # run Vitest unit tests
pnpm test:watch            # run Vitest in watch mode
pnpm test:e2e              # run Playwright E2E tests
pnpm test:e2e:ui           # open Playwright UI
pnpm e2e:prepare           # prepare test database
pnpm e2e:build             # build + prepare
```

## Localization
- **Framework**: react-intl
- **Source strings**: extracted via `pnpm i18n:extract` → `src/i18n/locale/en.json`
- **Usage**: `defineMessages()` in components, `<FormattedMessage>` or `intl.formatMessage()`
- **Languages**: 30+ locales in `src/i18n/locale/`

## API Routes
Base path: `/api/v1` — full spec at `/api-docs`

| Route | Purpose |
|---|---|
| `/auth` | Login, logout, current user |
| `/request` | Media requests |
| `/media` | Media details and management |
| `/movie`, `/tv` | Movie/TV-specific endpoints |
| `/discover` | Trending and discovery |
| `/search` | Search |
| `/issue` | Issue tracking |
| `/settings` | App configuration |
| `/user` | User management |
| `/blocklist` | Blocklist management |
| `/watchlist` | Watchlist management |
| `/person` | Person (actor/crew) details |
| `/service` | Service status and info |
| `/overrideRule` | Override rule management |

## Working Style

### Keep diffs focused
- One logical change per commit
- Avoid unrelated reformatting

### Planning sessions → write a spec
Whenever we do a planning session (plan mode), always write the finalised specification into `docs/` as a named document. This ensures we have a durable reference if context is lost or the session is interrupted.

### Compile/test locally after changes
1. Make a small, targeted change
2. Run `pnpm build` to verify after each change
3. Only then commit

### Documentation or commentary
Never use real movie or TV show names. Always make up example ones.

### Committing from non-interactive environments
The commitizen `prepare-commit-msg` hook requires a TTY. Use `HUSKY=0` to bypass all hooks when committing from non-interactive environments (e.g. Claude Code).


## Code Review Phases

Periodically we do a consolidation review covering all source, tests, build config, and metadata.

### Review Checklist
1. **Dead code** — unused functions, classes, modules, imports, config keys
2. **Dead dependencies** — libraries that are unused or underused relative
   to what we could replace inline
3. **Duplication** — repeated or near-identical logic that should be shared
4. **Naming & consistency** — mixed conventions, unclear names, stale comments
5. **Error handling** — inconsistent patterns, swallowed exceptions, missing
   user-facing messages
6. **Security** — input validation gaps, credential handling, OWASP patterns
7. **Type safety** — missing annotations, `Any` overuse, type errors
8. **Test gaps** — untested code paths, stale tests, missing edge cases
9. **Documentation drift** — specs, docstrings, or README sections that no
   longer match the code
10. **Performance** — unnecessary work, avoidable allocations, slow patterns
11. **Robustness** — race conditions, resource leaks, missing cleanup
12. **TODO/FIXME/HACK audit** — resolve or remove stale markers
# Seerr - Project Guide

## What is Seerr?
Media request management application integrating with Jellyfin, Plex, and Emby. Users browse/search content via a web UI, submit requests, and Seerr routes them to Sonarr/Radarr for automated downloading and library management. Supports watchlists, blocklists, issues tracking, granular permissions, and notifications across Discord, Email, Slack, Telegram, and more.

## Architecture
- **Backend**: Node.js + Express 5 + TypeScript 6 (`server/`)
- **Frontend**: Next.js 16 + React 19 + Tailwind CSS 3 (`src/`)
- **Database**: SQLite via better-sqlite3 (default) or PostgreSQL, both through TypeORM
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
- **node-gyp** (for better-sqlite3 native bindings)

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

All runtime data lives under `DEST/config/` and is **never touched** by a safe deploy:
- `config/db/db.sqlite3` — SQLite database
- `config/settings.json` — app settings (Plex, Jellyfin, Sonarr, etc.)
- `config/logs/` — log files
- `config/cache/images/` — image proxy cache
- `config/anime-list.xml` — cached anime list

```bash
# Safe push — overwrites build artifacts, preserves config/
bash deploy.sh                     # default dest D:/Apps/Seerr
bash deploy.sh /path/to/dest       # custom destination

# Clean push — wipes destination completely (loses db + settings)
bash deploy.sh --clean             # default dest
bash deploy.sh --clean /path/to    # custom destination
```

Start the deployed instance:
```bash
# Recommended: system tray app (auto-starts server, no console window)
# Double-click D:\Apps\Seerr\Seerr-Tray.vbs

# Or manually:
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
- **SQLite**: `config/db/db.sqlite3` via better-sqlite3 driver (WAL mode enabled)
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

## Git & Upstream

### Repository status
This is a **standalone repository** (detached from the GitHub fork of seerr-team/seerr). The `upstream` git remote is retained for cherry-picking useful commits.

### Branch strategy

| Branch | Purpose |
|---|---|
| `main` | Our primary branch — all Seerr work lands here, deploy from here |
| `origin/develop` | Legacy — was the old default, now unused |
| `upstream/develop` | Upstream reference — fetch with `git fetch upstream` |

### Incorporating upstream changes
We cherry-pick individual commits rather than merging, because the histories have diverged too far. PRs are not sent upstream.

```bash
git fetch upstream
git log upstream/develop --oneline          # review new commits
git cherry-pick <sha>                       # pick what we need
```

When cherry-picking, watch for:
- Conflicts with our custom features (actor subscriptions, override rules, etc.)
- Dependency version mismatches (we may be ahead or behind upstream)
- Migration conflicts (we have custom migrations that upstream doesn't)

### Versioning convention

Tags follow the pattern `v{upstream}-antforge.{n}`:

| Tag | Meaning |
|---|---|
| `v3.1.0-antforge.1` | Our 1st release, rooted in upstream v3.1.0 source |
| `v3.1.0-antforge.2` | Our 2nd release, still rooted in v3.1.0 |
| `v3.2.0-antforge.3` | After cherry-picking from upstream v3.2.0 |

The upstream version part reflects which source base we are aligned with. The `antforge.N` counter reflects our own commit cadence on top of it. When we cherry-pick from a new upstream release, bump the upstream part and keep our commit count.

### Remotes
- `origin` → `The-Ant-Forge/seerr` (standalone)
- `upstream` → `seerr-team/seerr` (reference for cherry-picks)

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

See [docs/Spec-CodeReview.md](docs/Spec-CodeReview.md) for the full review checklist, process, and deliverable format.
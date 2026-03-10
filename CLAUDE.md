# Seerr - Project Guide

## What is Seerr?
Media request management application integrating with Jellyfin, Plex, and Emby. Users browse/search content via a web UI, submit requests, and Seerr routes them to Sonarr/Radarr for automated downloading and library management. Supports watchlists, blocklists, issues tracking, granular permissions, and notifications across Discord, Email, Slack, Telegram, and more.

## Architecture
- **Backend**: Node.js + Express + TypeScript (`server/`)
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
| `cypress/` | End-to-end tests |

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
- **Framework**: Cypress (e2e)
- **Base URL**: http://localhost:5055
```bash
pnpm cypress:prepare       # prepare test database
pnpm cypress:build         # build + prepare
pnpm cypress:open          # open Cypress GUI
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

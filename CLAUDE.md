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

Ordered by risk — review high-severity items first, hygiene last.

#### 1. Authorization & Business Rules
1. **AuthN/AuthZ correctness** — every route, action, and UI path enforces
   the right admin/user/requester permissions; no server-side trust in
   client claims; admin-only config never leaks to frontend consumers
2. **Request lifecycle integrity** — request state machine allows only valid
   transitions; duplicate requests, re-requests, partial availability,
   cancellation, and approval bypasses are handled explicitly; UI state
   matches backend truth

#### 2. API & Contract Fidelity
3. **OpenAPI fidelity** — spec matches actual request validation, response
   shapes, status codes, and error formats
4. **Boundary validation** — all external input validated/coerced at
   route/webhook/job boundaries; no implicit trust in query params, body
   payloads, or provider responses
5. **Frontend/backend alignment** — React consumers handle
   nullable/optional/error states exactly as the API actually behaves

#### 3. Data Integrity & Database Safety
6. **Migration safety** — column renames vs adds, data-loss risk on
   destructive changes, rollback path exists, migration tested on both
   SQLite and Postgres
7. **Cross-database correctness** — queries behave the same on SQLite and
   Postgres for nulls, case sensitivity, unique constraints, dates,
   JSON/text, and transaction semantics
8. **Transactional integrity** — multi-step writes use transactions or
   compensating logic; no partial state commits

#### 4. External Integrations
9. **Provider correctness** — TMDB/Sonarr/Radarr/Plex/Jellyfin adapters
   handle provider-specific fields, capability differences, schema drift,
   and missing data safely
10. **Idempotency & deduplication** — repeated retries or user actions do not
    create duplicate requests, imports, or inconsistent statuses
11. **Timeouts, retries & rate limits** — outbound calls have sane
    timeout/retry behaviour, bounded concurrency, and explicit handling for
    429s and provider downtime
12. **Staleness & reconciliation** — cache/sync logic eventually converges
    with provider truth; stale availability/request state is corrected
    predictably

#### 5. Background Jobs & Concurrency
13. **Job idempotency** — scheduled jobs can run twice without corrupting
    state
14. **Overlap & failure isolation** — concurrent runs and long-running jobs
    do not race or double-process; one provider/job failure does not block
    unrelated work or poison shared state
15. **Checkpointing** — pagination cursors, incremental sync markers, and
    retry queues recover cleanly from interruption

#### 6. Security
16. **Input/output security** — injection risks in raw TypeORM queries, XSS
    in rendered content, SSRF/path risks in external fetches, unsafe
    deserialization
17. **Secrets & credentials** — API keys/tokens stored, masked, and logged
    safely; no accidental exposure through Next.js env handling or
    serialised props

#### 7. Error Handling & Observability
18. **Error handling quality** — exceptions not swallowed; user-facing
    failures are actionable; provider errors distinguished from local bugs
19. **Logging & tracing** — structured logs include request/media/provider/job
    context without leaking secrets; enough metadata to debug "why is this
    request stuck?"

#### 8. Performance
20. **Database efficiency** — N+1 queries, missing indexes, eager-loading
    mistakes, unbounded scans, expensive counts
21. **Frontend efficiency** — avoidable re-renders, oversized payloads,
    duplicated fetches, bad SSR/CSR cache boundaries

#### 9. Frontend Quality
22. **SSR/client boundary** — no server-only imports in client code, no
    hydration bugs, no secret leakage through props/env vars
23. **i18n completeness** — no hardcoded user-facing strings; message
    IDs/defaults consistent; missing-key behaviour is correct
24. **Accessibility** — keyboard navigation in modals/drawers, accessible
    names for poster-only buttons, focus management, colour contrast in
    status badges, screen-reader handling for async states

#### 10. Tests & Regression Protection
25. **Meaningful test coverage** — permissions, state transitions, provider
    adapters, job idempotency/overlap, migrations, and user-facing E2E
    flows; not just line-count coverage
26. **Fixture realism** — API/provider mocks reflect real payloads and
    failure modes, not idealised happy paths only

#### 11. Drift & Hygiene
27. **Configuration drift** — defaults, cron schedules, feature flags, and
    env vars match current behaviour
28. **Documentation drift** — specs in `docs/`, CLAUDE.md, README, and
    inline comments match real behaviour
29. **Code hygiene** — dead code, stale TODOs, duplication, commented-out
    code, unused dependencies, naming inconsistencies removed or justified

### Deliverable
A review document in `docs/` named `Code-Review-YYMMDD.md` (or similar) with:
- Summary table: Category, Description, Action, Impact, Effort, Risk
- Detailed findings grouped by category, ordered by impact then effort
- Out-of-scope items noted for TODO.md

### Process
1. Produce the review document — do NOT implement during review
2. Review and approve findings with the user
3. Implement approved items in focused commits
4. Re-run tests after each change

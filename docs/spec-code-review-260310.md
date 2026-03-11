# Code Review Spec — 2026-03-10

First periodic consolidation review following the dependency modernisation work (Express 5, ESLint 9, yup 1.7, Headless UI 2, TypeScript 5.9, etc.).

## Methodology

- Deep codebase exploration across all 12 CLAUDE.md review categories
- Codex (GPT-5.4) consulted for second opinion — additions tagged with **[Codex]**
- Findings reordered by production-impact severity (Codex-recommended)

## Scope

All source under `server/` and `src/`, plus build config, OpenAPI spec, and metadata files. Excludes `cypress/`, locale JSON, and migration SQL files (unless referenced by a finding).

---

## P0 — Bugs & Security

### Category 6: Security

| # | Finding | Location | Notes |
|---|---------|----------|-------|
| 6.1 | No rate limiting on auth routes | `server/routes/auth.ts` | Plex login, local login, password reset — brute-force exposure |
| 6.2 | Hardcoded admin ID `1` in ~20 locations | `server/lib/`, `server/routes/` (various) | Fragile identity assumption; breaks if first user is deleted/recreated |
| 6.3 | Only `discover.ts` uses Zod validation | `server/routes/discover.ts:92,385` | All other routes use raw `req.body`/`req.query` with no schema — coercion, defaults, unknown-field stripping all missing |
| 6.4 | **[Codex]** Auth model completeness | `server/routes/`, `server/middleware/auth.ts` | Review object-level auth, whether client-hidden actions are server-enforced, admin-only mutation gating |
| 6.5 | **[Codex]** Session/CSRF/CORS posture | `server/index.ts`, `@dr.pogodin/csurf` | Review cookie settings (SameSite, Secure, HttpOnly), CSRF token flow, CORS origin config |
| 6.6 | ~~**[Codex]** External service trust boundaries~~ | `server/api/` (Plex, Jellyfin, Discord, GitHub) | **Partial** — added 30s default timeout to `ExternalAPI` base class; SSRF guard and secret scrubbing remain as future work |
| 6.7 | **[Codex]** Data exposure / privacy | Entity → JSON serialisation paths | DTO shaping, overbroad entity exposure, leaking internal IDs/emails/tokens/third-party account data |

### Category 4: Naming & Consistency (bugs only)

| # | Finding | Location | Notes |
|---|---------|----------|-------|
| 4.1 | ~~**BUG**: `plexUsername` sort returns `jellyfinUsername`~~ | `server/routes/user/index.ts:76` | **Done** `c823bbde` — fixed to `LOWER(user.plexUsername)` |
| 4.2 | ~~Missing `await` on `requestRepository.save(request)`~~ | `server/routes/request.ts:515` | **Done** `c823bbde` — added `await` |
| 4.3 | ~~Wrong HTTP 401 for permission denial~~ | `server/routes/request.ts:615` | **Done** `c823bbde` — changed to 403 + `MediaRequestStatus.PENDING` constant |

---

## P1 — Data Integrity & Error Handling

### Category 5: Error Handling

| # | Finding | Location | Notes |
|---|---------|----------|-------|
| 5.1 | ~~`/status` route: no try/catch around GitHub API~~ | `server/routes/index.ts:50-96` | **Done** `efeeadf4` — wrapped in try/catch, graceful degradation |
| 5.2 | ~~Avatar proxy catch sends no response~~ | `server/routes/avatarproxy.ts:167-172` | **Done** `efeeadf4` — returns 502 on error |
| 5.3 | ~~`POST /linked-accounts/plex` — no try/catch~~ | `server/routes/user/usersettings.ts:268-313` | **Done** `efeeadf4` — added try/catch with error logging |
| 5.4 | ~~`/settings/discover` — uncaught DB await~~ | `server/routes/index.ts:118-124` | **Done** `efeeadf4` — added try/catch |
| 5.5 | ~~`console.error` instead of Winston logger~~ | `server/lib/settings/migrations/0007_migrate_arr_tags.ts:54,96` | **Done** `efeeadf4` — replaced with `logger.error` |
| 5.6 | ~~Inconsistent error log levels~~ | `server/routes/index.ts:426` vs `:446` | **Done** `efeeadf4` — TV certifications changed to `logger.error` |

### [Codex] Concurrency & Transaction Safety

| # | Finding | Location | Notes |
|---|---------|----------|-------|
| C.1 | ~~Race conditions in request submission~~ | `server/entity/MediaRequest.ts:46+` | **Done** `7aa1cfae` — wrapped critical section in AsyncLock keyed by mediaType+mediaId |
| C.2 | ~~Missing transaction boundaries~~ | `MediaRequest.request()` | **Done** `7aa1cfae` — AsyncLock serialises the check-then-save; full DB transaction is a future enhancement |
| C.3 | ~~Missing unique indexes / FK assumptions~~ | `server/entity/` | **Done** `5f1777e0` — added unique composite index on media(tmdbId, mediaType) with dedup migration |
| C.4 | ~~**[Codex]** Unbounded list endpoints~~ | `server/routes/` | **Done** — added `Math.min(take, max)` caps: user list (100), requests/media/issues (1000), blocklist (100) |

---

## P2 — Performance & Type Safety

### Category 10: Performance

| # | Finding | Location | Notes |
|---|---------|----------|-------|
| 10.1 | ~~N+1 in Plex user import~~ | `server/routes/user/index.ts:604-643` | **Done** `268cdb7f` — single `IN(...)` pre-fetch query + Map lookup |
| 10.2 | ~~N+1 in Jellyfin user import~~ | `server/routes/user/index.ts:690-730` | **Done** `268cdb7f` — single `IN(...)` pre-fetch query + Set lookup |
| 10.3 | ~~8 sequential `getCount()` queries~~ | `server/routes/request.ts:338-425` | **Done** `f1c64a32` — single query with conditional aggregation |
| 10.4 | ~~Sequential availability sync~~ | `server/lib/availabilitySync.ts` | **Done** — refactored to batch processing with `Promise.allSettled`, 5 concurrent items per batch |

### Category 7: Type Safety

| # | Finding | Location | Notes |
|---|---------|----------|-------|
| 7.1 | ~~File-wide `any` ESLint disable~~ | `server/api/jellyfin.ts:1` | **Done** — removed file-wide disable, added typed interfaces for all API responses |
| 7.2 | ~~Multiple `any` in IMDB proxy~~ | `server/api/rating/imdbRadarrProxy.ts:20,30,137-140` | **Done** — replaced with proper types (`string`, `string | null`, typed arrays) |
| 7.3 | All settings migrations accept `settings: any` | `server/lib/settings/migrations/` (8 files) | **Kept as `any`** — migrations operate on legacy settings shapes that predate current `AllSettings` type; `any` is correct here |
| 7.4 | ~~5 suppressed `any` in Selector~~ | `src/components/Selector/index.tsx` | **Done** — replaced `as any` casts with typed `AnyOnChange` union type |

### Category 8: Test Gaps (focused)

| # | Finding | Notes |
|---|---------|-------|
| 8.1 | ~~`MediaRequest.request()` — zero coverage~~ | **Partial** `10c81525` — Vitest infrastructure added; `MediaRequest.request()` needs integration test with DB mocks (future) |
| 8.2 | ~~Permission system~~ | `server/lib/permissions.ts` | **Done** `10c81525` — 13 unit tests + 39 regression tests covering all permission flags, admin override, bitwise edge cases |
| 8.3 | ~~Approval/denial flows~~ | Request lifecycle state machine | **Done** — 19 tests covering approve/decline status transitions, permission checks, error handling |
| 8.4 | ~~Scanner/notification failure paths~~ | `server/lib/notifications/` | **Partial** — 28 notification agent tests + 14 status helper tests added; scanner tests still needed |

---

## P3 — Code Quality

### Category 3: Duplication

| # | Finding | Location | Notes |
|---|---------|----------|-------|
| 3.1 | ~~Status string switch block × 7 agents~~ | `agents/gotify.ts`, `ntfy.ts`, `slack.ts`, `telegram.ts`, `pushbullet.ts`, `pushover.ts`, `discord.ts` | **Done** — extracted to `notificationStatusHelper.ts`, all agents updated |
| 3.2 | ~~`getAvailableMediaServerName()` × 2~~ | `MovieDetails/index.tsx`, `TvDetails/index.tsx` | **Done** — extracted to `src/hooks/useMediaServerName.ts` |
| 3.3 | ~~`discoverRegion` / `streamingRegion` / `trailerUrl` × 2~~ | `MovieDetails`, `TvDetails` | **Done** — extracted to `src/utils/mediaHelpers.ts` |

### Category 4: Naming & Consistency (non-bug)

| # | Finding | Location | Notes |
|---|---------|----------|-------|
| 4.4 | ~~Route param `:id` vs spec `{studioId}`/`{networkId}`~~ | `server/routes/index.ts:236,256` | **Done** — renamed to `:studioId`/`:networkId` to match OpenAPI spec |
| 4.5 | ~~Inconsistent log levels for symmetric routes~~ | `server/routes/index.ts:426,446` | **Done** `efeeadf4` — see 5.6 |
| 4.6 | ~~Magic number `request.status !== 1`~~ | `server/routes/request.ts:613` | **Done** `c823bbde` — uses `MediaRequestStatus.PENDING` |
| 4.7 | ~~`process.env.port` lowercase typo~~ | `server/lib/notifications/agents/discord.ts:117` | **Done** `efeeadf4` — fixed to `process.env.PORT` |

### Category 11: Robustness

| # | Finding | Location | Notes |
|---|---------|----------|-------|
| 11.1 | ~~`synchronize: true` in dev DB config~~ | `server/datasource.ts:46` | **Done** `daa7a249` — set to false, migrationsRun enabled |
| 11.2 | File-wide `react-hooks/exhaustive-deps` suppression | `src/components/RequestModal/AdvancedRequester/index.tsx:1`, `src/hooks/useSearchInput.ts:1` | **Kept** — suppressions are intentional; both components deliberately omit deps to prevent infinite routing/re-render loops |

---

## P4 — Cleanup (opportunistic)

### Category 1: Dead Code

| # | Finding | Location |
|---|---------|----------|
| 1.1 | ~~21/26 `EmbedColors` enum values unused~~ | `server/lib/notifications/agents/discord.ts:16-40` — **Kept**: standard Discord colour constants, likely needed by upstream/future features |
| 1.2 | ~~`Nullable<T>`, `Maybe<T>` never imported~~ | `src/utils/typeHelpers.ts` — **Done**: removed |
| 1.3 | ~~Commented-out query fragments~~ | `server/routes/discover.ts` — **Done**: removed |
| 1.4 | ~~Dead commented code~~ | `server/routes/user/index.ts` — **Done**: removed |

### Category 2: Dead Dependencies

| # | Finding | Notes |
|---|---------|-------|
| 2.1 | ~~`@types/csurf` for wrong package~~ | **Done** `1bc18cf7` — removed package + custom.d.ts shim; bundled types used; added key/path to csurf cookie config |
| 2.2 | ~~`react-spring` — Slider only~~ | **Done** `1bc18cf7` — replaced useSpring with native `scrollTo({ behavior: 'smooth' })` |
| 2.3 | ~~`ace-builds` + `react-ace` (~1MB)~~ | **Done** — replaced with native `<textarea>` in JSONEditor component; removed both deps |

### Category 9: Documentation Drift

| # | Finding | Location |
|---|---------|----------|
| 9.1 | ~~CLAUDE.md routes table missing 3 routes~~ | **Done** — added `/person`, `/service`, `/overrideRule` |
| 9.2 | ~~CLAUDE.md doesn't note Express 5~~ | **Done** — updated to "Express 5" |
| 9.3 | `/blacklist` deprecated routes sunset 2026-06-01 | `server/routes/index.ts:173-182` | Already implemented via `deprecatedRoute()` middleware with sunset header |

### Category 12: TODO/FIXME/HACK Audit

| # | Finding | Location |
|---|---------|----------|
| 12.1 | Season updater TODO | `server/lib/availabilitySync.ts:380` |
| 12.2 | ~~Override rule priority sorting~~ | `server/entity/MediaRequest.ts:309` | **Done** — improved specificity scoring: user-targeting weighted ×2, removed TODO/hack comments |
| 12.3 | 4K detection robustness | `server/lib/scanners/jellyfin/index.ts:366` |

---

## Codex Consultation Summary

**Model**: GPT-5.4 via Codex CLI | **Date**: 2026-03-10

### Added by Codex
- Auth model completeness (object-level auth, server-side enforcement)
- Race conditions / idempotency (duplicate requests, double approvals, quota bypass)
- Transaction boundaries (sequential repo calls → atomic)
- External service trust boundaries (SSRF, timeouts, secret leakage)
- Session / CSRF / CORS posture
- Data exposure / DTO shaping / privacy
- Pagination / filtering abuse (unbounded endpoints, missing indexes)
- Generalised "missing await" → fire-and-forget write pattern
- Generalised "hardcoded admin ID" → identity assumptions in business logic

### Deprioritised by Codex
- Unused enum members (low signal unless hiding a defect)
- API key entropy (`Date.now()` alongside `randomUUID()` — UUID provides sufficient randomness)
- `React.lazy`/Suspense as blanket finding (not a defect)
- Dual yup+zod (mild concern, not actionable unless consolidating)
- `snake_case` URL paths (consistent within spec+code pair)
- TODO/FIXME count as standalone headline category

### Priority reorder
Security+auth → data integrity/concurrency → error handling → validation → performance → targeted tests → robustness → duplication → dead code → docs → TODOs

---

## Infrastructure Improvements (session 2)

| Change | Details |
|--------|---------|
| **Cypress → Playwright** | Migrated all 28 E2E test cases from Cypress to Playwright (`tests/e2e/`). Removed `cypress`, `cy-mobile-commands` deps. Added `@playwright/test`. |
| **Polyfill cleanup** | Removed `downlevelIteration` from tsconfig (ES2021 has native iterators). Removed `-ms-overflow-style` IE shim from CSS. Removed dead `baseline-browser-mapping` dev dep. Kept @formatjs conditional polyfills (still needed for older mobile browsers). |
| **Vitest expansion** | Grew from 18 to **201 tests** across 13 test files. Coverage: permissions (52 tests), notification agents (42 tests), settings migrations (28 tests), settings class (20 tests), constants (22 tests), download tracker (7 tests), servarr API (9 tests), utilities (21 tests). |
| **Dead dep removal** | Removed `ace-builds`, `react-ace`, `cypress`, `cy-mobile-commands`, `baseline-browser-mapping`. Replaced JSONEditor with native `<textarea>`. |

## Consolidation & Hardening (session 3)

| Change | Details |
|--------|---------|
| **Cypress cleanup** | Deleted `cypress/` directory, `cypress.config.ts`, `.github/workflows/cypress.yml`. Updated all references in `.gitignore`, `.prettierignore`, `.prettierrc.js`, `.dockerignore`, `CLAUDE.md`. Relocated test settings to `tests/e2e/config/settings.e2e.json`. |
| **Pagination limits (C.4)** | Added `Math.min(take, max)` caps to all list endpoints: user list (100), requests/media/issues (1000), blocklist (100). |
| **Jellyfin typing (7.1)** | Removed file-wide `@typescript-eslint/no-explicit-any` disable from `server/api/jellyfin.ts`. Added typed interfaces for all API responses. |
| **Selector typing (7.4)** | Replaced 5 `as any` casts in `Selector/index.tsx` with typed `AnyOnChange` union type. |
| **Override rule sorting (12.2)** | Improved specificity scoring: user-targeting now weighted ×2. Removed TODO/hack comments. |
| **Default timeouts (6.6)** | Added 30s default timeout to `ExternalAPI` base class for all external service calls. |
| **Availability sync (10.4)** | Refactored to batch processing with `Promise.allSettled`, 5 concurrent items per batch. Extracted `processMediaItem` and `processBatch` methods. |
| **Approval/denial tests (8.3)** | 19 new tests covering status transitions, permission checks, and error handling in `server/routes/request.test.ts`. |
| **Vitest total** | Grew from 201 to **220 tests** across 14 test files. |
| **Items kept as-is** | 11.2 exhaustive-deps suppressions (intentional — prevent infinite loops). 9.3 blacklist sunset (already implemented via middleware). 7.3 migration `any` types (correct for legacy shapes). |

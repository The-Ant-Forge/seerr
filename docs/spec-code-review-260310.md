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
| 6.6 | **[Codex]** External service trust boundaries | `server/api/` (Plex, Jellyfin, Discord, GitHub) | SSRF risk, timeout/retry behaviour, partial-failure handling, secret leakage in logs |
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
| C.3 | Missing unique indexes / FK assumptions | `server/entity/` | Review constraints that guard against data duplication at DB level |
| C.4 | **[Codex]** Unbounded list endpoints | `server/routes/` | Missing pagination limits, expensive sort fields without DB indexes |

---

## P2 — Performance & Type Safety

### Category 10: Performance

| # | Finding | Location | Notes |
|---|---------|----------|-------|
| 10.1 | N+1 in Plex user import | `server/routes/user/index.ts:604-643` | Per-user DB lookup + save in for-loop |
| 10.2 | N+1 in Jellyfin user import | `server/routes/user/index.ts:690-730` | Same pattern as Plex import |
| 10.3 | ~~8 sequential `getCount()` queries~~ | `server/routes/request.ts:338-425` | **Done** `f1c64a32` — single query with conditional aggregation |
| 10.4 | Sequential availability sync | `server/lib/availabilitySync.ts` | No parallelism within a page of records |

### Category 7: Type Safety

| # | Finding | Location | Notes |
|---|---------|----------|-------|
| 7.1 | File-wide `any` ESLint disable | `server/api/jellyfin.ts:1` | 11+ `any` usages throughout Jellyfin API client |
| 7.2 | Multiple `any` in IMDB proxy | `server/api/rating/imdbRadarrProxy.ts:20,30,137-140` | Response interface fields typed as `any` |
| 7.3 | All settings migrations accept `settings: any` | `server/lib/settings/migrations/` (8 files) | Could use a base settings type |
| 7.4 | 5 suppressed `any` in Selector | `src/components/Selector/index.tsx:139,212,283,364,628` | All ESLint-suppressed |

### Category 8: Test Gaps (focused)

| # | Finding | Notes |
|---|---------|-------|
| 8.1 | `MediaRequest.request()` — zero coverage | Most critical business logic: permissions, quotas, status transitions |
| 8.2 | Permission system | `server/lib/permissions.ts` |
| 8.3 | Approval/denial flows | Request lifecycle state machine |
| 8.4 | Scanner/notification failure paths | `server/lib/scanners/`, `server/lib/notifications/` |

---

## P3 — Code Quality

### Category 3: Duplication

| # | Finding | Location | Notes |
|---|---------|----------|-------|
| 3.1 | Status string switch block × 5 agents | `agents/gotify.ts:64-80`, `ntfy.ts:41-58`, `slack.ts:80-96`, `telegram.ts`, `pushbullet.ts` | Extract shared helper |
| 3.2 | `getAvailableMediaServerName()` × 2 | `MovieDetails/index.tsx:302-324`, `TvDetails/index.tsx:330-352` | Identical — extract to shared hook |
| 3.3 | `discoverRegion` / `streamingRegion` / `trailerUrl` × 2 | `MovieDetails:232`, `TvDetails:227` | Same logic duplicated — shared hook |

### Category 4: Naming & Consistency (non-bug)

| # | Finding | Location | Notes |
|---|---------|----------|-------|
| 4.4 | Route param `:id` vs spec `{studioId}`/`{networkId}` | `server/routes/index.ts:219,239` vs `seerr-api.yml:7288,7308` | Mismatch visible to API consumers |
| 4.5 | ~~Inconsistent log levels for symmetric routes~~ | `server/routes/index.ts:426,446` | **Done** `efeeadf4` — see 5.6 |
| 4.6 | ~~Magic number `request.status !== 1`~~ | `server/routes/request.ts:613` | **Done** `c823bbde` — uses `MediaRequestStatus.PENDING` |
| 4.7 | ~~`process.env.port` lowercase typo~~ | `server/lib/notifications/agents/discord.ts:117` | **Done** `efeeadf4` — fixed to `process.env.PORT` |

### Category 11: Robustness

| # | Finding | Location | Notes |
|---|---------|----------|-------|
| 11.1 | ~~`synchronize: true` in dev DB config~~ | `server/datasource.ts:46` | **Done** `daa7a249` — set to false, migrationsRun enabled |
| 11.2 | File-wide `react-hooks/exhaustive-deps` suppression | `src/components/RequestModal/AdvancedRequester/index.tsx:1`, `src/hooks/useSearchInput.ts:1` | Dependency arrays manually managed |

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
| 2.3 | `ace-builds` + `react-ace` (~1MB) | Single JSON editor in settings — moderate effort swap to lighter alternative |

### Category 9: Documentation Drift

| # | Finding | Location |
|---|---------|----------|
| 9.1 | CLAUDE.md routes table missing 3 routes | `/overrideRule`, `/service`, `/person` |
| 9.2 | CLAUDE.md doesn't note Express 5 | Relevant for path-to-regexp wildcard syntax |
| 9.3 | `/blacklist` deprecated routes sunset 2026-06-01 | `server/routes/index.ts:156-165` |

### Category 12: TODO/FIXME/HACK Audit

| # | Finding | Location |
|---|---------|----------|
| 12.1 | Season updater TODO | `server/lib/availabilitySync.ts:380` |
| 12.2 | Override rule priority sorting | `server/entity/MediaRequest.ts:299` |
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

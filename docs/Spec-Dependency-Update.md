# Dependency Update Specification

**Date:** 2026-03-10
**Scope:** All pnpm dependencies (runtime + dev)
**Stack:** Node.js >=22 / Next.js 14 / Express / TypeORM / React 18 / Tailwind 3
**Reviewed by:** Codex (GPT-5.3) on 2026-03-10 — corrections incorporated below

> **Cross-project note:** This follows the same dependency audit format used for
> Sonarr and Radarr. Seerr is a pure Node.js/TypeScript stack (no .NET), so the
> audit covers pnpm packages only. Findings from the Sonarr audit are referenced
> where they de-risk decisions.
>
> **Version note:** "Latest" columns reflect `pnpm outdated` output at time of
> writing. Actual latest versions may differ slightly — always verify with
> `pnpm outdated` before executing upgrades.

---

## 1. Safe Updates (patch / minor — low risk)

### 1a. Runtime — Patch Bumps

These are patch-level updates with no API changes. Apply in a single commit.

| Package | Current | Latest | Type |
|---|---|---|---|
| `@dr.pogodin/csurf` | 1.16.6 | 1.16.8 | Patch |
| `ace-builds` | 1.43.4 | 1.43.6 | Patch |
| `axios` | 1.13.3 | 1.13.6 | Patch |
| `bowser` | 2.13.1 | 2.14.1 | Minor |
| `country-flag-icons` | 1.6.4 | 1.6.15 | Patch |
| `dns-caching` | 0.2.7 | 0.2.9 | Patch |
| `express-session` | 1.18.2 | 1.19.0 | Minor |
| `pg` | 8.17.2 | 8.20.0 | Minor |
| `react-aria` | 3.44.0 | 3.47.0 | Minor |
| `semver` | 7.7.3 | 7.7.4 | Patch |
| `swr` | 2.3.8 | 2.4.1 | Minor |
| `undici` | 7.18.2 | 7.22.0 | Minor |
| `validator` | 13.15.23 | 13.15.26 | Patch |
| `winston-daily-rotate-file` | 4.7.1 | 5.0.0 | Major* |

\* `winston-daily-rotate-file` 5.0.0 drops Node <18 support only — no API changes for our usage.

### 1b. Tooling — Patch/Minor Bumps

These affect build/lint behaviour, not application code. Commit separately from runtime updates.

| Package | Current | Latest | Type |
|---|---|---|---|
| `@tailwindcss/forms` | 0.5.10 | 0.5.11 | Patch |
| `@tailwindcss/typography` | 0.5.16 | 0.5.19 | Patch |
| `@types/lodash` | 4.17.21 | 4.17.24 | Patch |
| `@types/nodemailer` | 7.0.9 | 7.0.11 | Patch |
| `@types/secure-random-password` | 0.2.1 | 0.2.3 | Patch |
| `@types/yamljs` | 0.2.31 | 0.2.34 | Patch |
| `autoprefixer` | 10.4.23 | 10.4.27 | Patch |
| `baseline-browser-mapping` | 2.9.18 | 2.10.0 | Minor |
| `nodemon` | 3.1.11 | 3.1.14 | Patch |
| `postcss` | 8.5.6 | 8.5.8 | Patch |
| `prettier-plugin-tailwindcss` | 0.6.14 | 0.7.2 | Minor |

---

## 2. Major Upgrades — Breaking API Changes

These require code changes and carry risk. Each is its own work item.

| Package | Current | Latest | Effort | Risk | Notes |
|---|---|---|---|---|---|
| `next` | 14.2.35 | 16.1.6 | Very High | High | App Router migration; React 19 required for Next 15+ |
| `react` / `react-dom` | 18.3.1 | 19.2.4 | Very High | High | Blocks Next 15+; review all component lifecycle |
| `express` | 4.21.2 | 5.2.1 | High | High | Middleware signature changes; path matching changes |
| `tailwindcss` | 3.4.19 | 4.2.1 | High | Medium | Config migration; new engine; plugin API changes |
| `eslint` | 8.57.1 | 10.0.3 | Medium | Medium | Flat config migration |
| `@typescript-eslint/*` | 7.18.0 | 8.57.0 | Medium | Low | Config changes; new rule defaults |
| `date-fns` | 2.29.3 | 4.1.0 | Medium | Low | Tree-shaking changes; some function renames |
| `typeorm` | 0.3.28 | 0.3.28 | — | — | Already latest 0.3.x; 0.4 not yet released |
| `@headlessui/react` | 1.7.12 | 2.2.9 | Medium | Medium | Component API changes |
| `react-intl` | 6.6.8 | 8.1.3 | Medium | Medium | API changes in message formatting |
| `react-select` | 5.10.2 | 5.10.2 | — | — | Already latest v5 |
| `yup` | 0.32.11 | 1.7.1 | High | Medium | 35 files; schema API changes |
| `cronstrue` | 2.23.0 | 3.13.0 | Low | Low | 1 file; check for API changes |
| `react-ace` | 10.1.0 | 14.0.1 | Medium | Medium | 1 file but component API changes |
| `react-spring` | 9.7.1 | 10.0.3 | Medium | Medium | Animation API changes |
| `react-markdown` | 8.0.5 | 10.1.0 | Medium | Low | 3 files; plugin API changes |
| `react-intersection-observer` | 9.4.3 | 10.0.3 | Low | Low | 6 files; minor API changes |
| `react-animate-height` | 2.1.2 | 3.2.3 | Low | Low | 1 file; component API change |
| `@tanem/react-nprogress` | 5.0.56 | 6.0.3 | Low | Low | 1 file |
| `connect-typeorm` | 1.1.4 | 2.0.0 | Low | Low | Session store; check API |
| `swagger-ui-express` | 4.6.2 | 5.0.1 | Low | Low | API docs route |
| `express-openapi-validator` | 4.13.8 | 5.6.2 | Medium | Medium | Validation middleware API changes |
| `express-rate-limit` | 6.7.0 | 8.3.1 | Low | Low | Config format changes |
| `email-templates` | 12.0.3 | 13.0.1 | Low | Low | Template engine changes |
| `nodemailer` | 7.0.12 | 8.0.2 | Low | Low | Transport API changes |
| `mime` | 3.0.0 | 4.1.0 | Low | Low | ESM-only in v4 |
| `gravatar-url` | 3.1.0 | 4.0.1 | Low | Low | ESM-only in v4; candidate for removal instead |
| `ua-parser-js` | 1.0.40 | 2.0.9 | Low | Low | 1 file; API changes |
| `xml2js` | 0.5.0 | 0.6.2 | Low | Low | 2 files; parsing API changes |
| `sharp` | 0.33.4 | 0.34.5 | Low | Medium | Native bindings; test after upgrade |
| `tailwind-merge` | 2.6.0 | 3.5.0 | Low | Low | Merge strategy changes |
| `reflect-metadata` | 0.1.13 | 0.2.2 | Low | Low | TypeORM transitive requirement |
| `typescript` | 5.4.5 | 5.9.3 | Low | Low | Minor; new strictness checks possible |
| `@commitlint/*` | 17.4.4 | 20.4.3 | Low | Low | Config format changes |
| `husky` | 8.0.3 | 9.1.7 | Low | Low | Hook setup changes |
| `lint-staged` | 13.1.2 | 16.3.3 | Low | Low | Config format changes |
| `cypress` | 14.5.4 | 15.11.0 | Medium | Medium | Test runner changes |
| `commitizen` | 4.3.1 | 4.3.1 | — | — | Already latest |

### Upgrade Clusters

Related packages that must move together:

| Cluster | Packages |
|---|---|
| **React** | `react`, `react-dom`, `@types/react`, `@types/react-dom` |
| **Next.js** | `next`, `eslint-config-next` (requires React 19 for Next 15+) |
| **Express** | `express`, `@types/express`, `express-openapi-validator`, `express-rate-limit` |
| **Tailwind** | `tailwindcss`, `@tailwindcss/*`, `prettier-plugin-tailwindcss`, `tailwind-merge` |
| **Linting** | `eslint`, `eslint-config-*`, `eslint-plugin-*`, `@typescript-eslint/*` |
| **@formatjs** | `react-intl`, `@formatjs/intl-displaynames`, `@formatjs/intl-locale`, `@formatjs/intl-pluralrules` |
| **Git Hooks** | `husky`, `lint-staged`, `@commitlint/*`, `commitizen` |

---

## 3. Already Current (no action needed)

| Package | Version | Notes |
|---|---|---|
| `axios` | 1.13.3 | Near-latest (1.13.6 is patch) |
| `bcrypt` | 6.0.0 | Latest |
| `cookie-parser` | 1.4.7 | Latest |
| `formik` | 2.4.9 | Latest |
| `lodash` | 4.17.23 | Latest (maintenance mode) |
| `node-schedule` | 2.1.1 | Latest |
| `openpgp` | 6.3.0 | Latest |
| `react-select` | 5.10.2 | Latest v5 |
| `react-transition-group` | 4.4.5 | Latest |
| `sqlite3` | 5.1.7 | Latest |
| `typeorm` | 0.3.28 | Latest 0.3.x |
| `web-push` | 3.6.7 | Latest |
| `winston` | 3.19.0 | Latest |
| `zod` | 4.3.6 | Latest |
| `copyfiles` | 2.4.1 | Latest |
| `eslint-plugin-react` | 7.37.5 | Latest |
| `prettier` | 3.8.1 | Latest |
| `ts-node` | 10.9.2 | Latest |
| `tsc-alias` | 1.8.16 | Latest |
| `tsconfig-paths` | 4.2.0 | Latest |

---

## 4. Dependency Usage Audit

### 4.1 Dead Dependencies (zero imports — remove immediately)

| Package | Listed Version | Evidence |
|---|---|---|
| `@formatjs/intl-utils` | 3.8.4 | **DEPRECATED** by formatjs; zero imports in codebase |
| `@types/yup` | 0.29.14 | **DEPRECATED** by npm; however project is on yup 0.32 which does NOT ship own types — verify with `pnpm typecheck` before removing |
| `@types/mime` | 3.0.4 | **DEPRECATED**; mime v3+ ships its own types |
| `@types/ua-parser-js` | 0.7.36 | Listed in dependencies (not devDeps); verify if needed |
| `@types/wink-jaro-distance` | 2.0.2 | Listed in dependencies (not devDeps); should be devDeps at minimum |

**Action:** Remove from `package.json`, run `pnpm install`.

### 4.2 Deeply Integrated — Keep

These are load-bearing. Replacing them would be a rewrite, not a refactor.

| Package | Files | Role | Verdict |
|---|---|---|---|
| `react-intl` | 100+ | i18n across entire frontend | Keep |
| `formik` + `yup` | 35+ | Form validation across all settings/admin pages | Keep |
| `react-toast-notifications` | 56 | `useToasts()` notification system used everywhere | Keep |
| `typeorm` | 50+ | All database access, entities, migrations | Keep |
| `axios` | 40+ | HTTP client for all external API calls | Keep |
| `swr` | 30+ | Data fetching hooks throughout frontend | Keep |
| `tailwindcss` | All components | Styling framework | Keep |
| `winston` | 20+ | Logging across entire server | Keep |
| `express` | 30+ | Web framework, middleware, routes | Keep |

### 4.3 Moderate Integration — Keep (not worth replacing)

| Package | Files | Role | Why Keep |
|---|---|---|---|
| `react-spring` | 5+ | Animations (sliders, transitions) | Non-trivial animation library |
| `react-select` | 10+ | Custom select components | Feature-rich select; native `<select>` insufficient |
| `@headlessui/react` | 5+ | Accessible UI primitives (Listbox, Transition) | Accessibility concern; keep |
| `react-aria` | 3+ | Accessible UI hooks | Accessibility; keep |
| `openpgp` | 2 | PGP email encryption | Cryptographic; cannot inline |
| `pug` | 10 templates | Email HTML templates | Would need template migration |
| `sharp` | 2+ | Image processing/proxying | Native image processing; no JS alternative |
| `react-markdown` | 3 | Markdown rendering (issues, release notes) | Non-trivial to replace |
| `ace-builds` / `react-ace` | 1 | JSON editor in webhook settings | Full code editor; complex to replace |
| `node-cache` | 2 | In-memory caching with TTL | Core performance layer |
| `connect-typeorm` | 1 | Session store backed by TypeORM | Bridges express-session ↔ TypeORM |

### 4.4 Light Usage — Candidates for Inlining or Removal

#### `copy-to-clipboard` → `navigator.clipboard.writeText()` (~10 lines)

- **Used in:** 1 file (`src/components/Settings/SettingsLogs/index.tsx`)
- **Purpose:** Copy text to clipboard
- **Replacement:** `navigator.clipboard.writeText(text)` — 95%+ browser support
- **Note:** `navigator.clipboard.writeText()` is async and can reject (e.g. permissions denied).
  Current call site assumes synchronous success — replacement must handle the Promise and only
  toast success after resolution.
- **Risk:** Low
- **Recommendation:** **REMOVE**

#### `react-use-clipboard` → custom hook (~15 lines)

- **Used in:** 1 file (`src/components/Settings/CopyButton.tsx`)
- **Purpose:** Clipboard hook with success state tracking
- **Replacement:** Custom hook wrapping `navigator.clipboard` + `useState`
- **Note:** Same async caveat as `copy-to-clipboard` above — must handle Promise rejection
  and only set success state after the clipboard write resolves.
- **Risk:** Low
- **Recommendation:** **REMOVE**

#### `gravatar-url` → inline URL construction (~5 lines)

- **Used in:** 3 files (`server/scripts/prepareTestDb.ts`, `server/routes/user/index.ts`, `server/routes/avatarproxy.ts`)
- **Purpose:** Construct Gravatar URL from email hash
- **Replacement:** `` `https://www.gravatar.com/avatar/${md5(email.trim().toLowerCase())}?d=mm&s=${size}` ``
- **Note:** Already using `crypto` module elsewhere; MD5 hash is trivial
- **Risk:** Very low
- **Recommendation:** **REMOVE**

#### `secure-random-password` → `crypto.randomBytes()` (~5 lines)

- **Used in:** 1 file (`server/entity/User.ts`)
- **Purpose:** Generate random 16-char password
- **Replacement:** `crypto.randomBytes(12).toString('base64url').slice(0, 16)`
- **Risk:** Very low
- **Recommendation:** **REMOVE**

#### `@supercharge/request-ip` → Express `req.ip` with trust proxy (~10 lines)

- **Used in:** 1 file (`server/index.ts`)
- **Purpose:** Extract client IP from request headers
- **Replacement:** Use Express's built-in `req.ip` (respects `trust proxy` setting) rather than
  raw `x-forwarded-for` parsing, which is vulnerable to IP spoofing when `trust proxy` is
  misconfigured. Ensure `app.set('trust proxy', ...)` is configured correctly first.
- **Risk:** Low — but must preserve Express proxy-trust semantics; do NOT blindly trust `x-forwarded-for`
- **Recommendation:** **REMOVE** — but replacement must use `req.ip`, not raw header parsing

#### `semver` → custom coerce + compare (~25 lines)

- **Used in:** 1 file (`server/routes/settings/index.ts`)
- **Functions:** `semver.gte()` and `semver.coerce()` — used to compare Tautulli version strings
  which may contain prefixes, suffixes, or partial versions (e.g. `v2.9.0-beta`)
- **Replacement:** Custom function that strips prefixes/suffixes to extract `major.minor.patch`,
  then compares numerically. Must handle the same edge cases `semver.coerce()` does.
- **Risk:** Medium — naive split-and-compare will mis-handle prefixed/suffixed/partial versions
- **Recommendation:** **REMOVE** — but replacement must handle `coerce()` semantics correctly

#### `validator` → **KEEP** (security-sensitive)

- **Used in:** 9 files including auth routes (`server/routes/auth.ts`), password reset,
  and email notification agents
- **Functions:** ONLY `validator.isEmail()` with `{ require_tld: false }`
- **Why keep:** Email validation sits in auth and account flows, not just cosmetic forms.
  A simple regex would be materially weaker and could accept malformed addresses that the
  current validator correctly rejects. The security regression is not worth the dependency removal.
- **Risk of removal:** Medium — validation regression in auth flows
- **Recommendation:** **KEEP** — patch-bump only (13.15.23 → 13.15.26)

#### `bowser` → user agent string parsing (~10 lines)

- **Used in:** 1 file (`src/utils/plex.ts`)
- **Purpose:** Browser/OS detection for Plex player identification
- **Replacement:** Simple regex on `navigator.userAgent`
- **Risk:** Low
- **Recommendation:** **REMOVE**

#### `date-fns` → native Date methods (~20 lines)

- **Used in:** 2 files (`server/utils/dateHelpers.ts`, `src/components/Settings/SettingsJobsCache/index.tsx`)
- **Functions:** `addYears()`, `formatDuration()`, `intervalToDuration()`
- **Replacement:**
  - `addYears` → `const result = new Date(d); result.setFullYear(result.getFullYear() + n); return result;`
    (**Important:** must clone the Date first — `d.setFullYear()` mutates the original, which
    would corrupt the `Between(date, ...)` lower bound in `dateHelpers.ts`)
  - `intervalToDuration` + `formatDuration` → simple math + string formatting
- **Risk:** Low — but pay attention to immutability
- **Recommendation:** **REMOVE**

#### `react-animate-height` → CSS transition (~15 lines)

- **Used in:** 1 file (`src/components/Common/Accordion/index.tsx`)
- **Purpose:** Animate height between 0 and `auto`
- **Replacement:** CSS `grid-template-rows: 0fr → 1fr` transition (modern browsers)
- **Risk:** Low
- **Recommendation:** **REMOVE**

#### `react-truncate-markup` → CSS `line-clamp` (~3 lines)

- **Used in:** 1 file (`src/components/PersonDetails/index.tsx`)
- **Purpose:** Truncate text with ellipsis
- **Replacement:** CSS `-webkit-line-clamp` (97%+ browser support)
- **Risk:** Very low
- **Recommendation:** **REMOVE**

#### `react-popper-tooltip` → `@floating-ui/react` (~30 lines)

- **Used in:** 2 source files (`src/components/Common/Tooltip/index.tsx`, `src/components/Settings/CopyButton.tsx`),
  BUT the `Tooltip` wrapper is consumed by **20+ components** across the app (RequestCard, TitleCard,
  IssueItem, MovieDetails, TvDetails, Settings, etc.)
- **Purpose:** Portal-rendered, collision-aware tooltip positioning
- **Replacement:** Must use a proper positioning library like `@floating-ui/react` (not a CSS tooltip)
  because a plain CSS/title tooltip loses portal rendering, `followCursor` behaviour, collision
  handling, and will clip inside overflow containers
- **Risk:** Medium — widely consumed; replacement must preserve positioning behaviour
- **Recommendation:** **REPLACE** with `@floating-ui/react` (does not reduce package count but
  modernises the dependency; `@floating-ui/react` is lighter than `react-popper-tooltip`)

#### `@tanem/react-nprogress` → custom progress bar (~20 lines)

- **Used in:** 1 file (`src/components/LoadingBar/index.tsx`)
- **Purpose:** Slim page-load progress bar
- **Replacement:** Custom component with CSS animation + Next.js Router events
- **Risk:** Low
- **Recommendation:** **REMOVE**

#### `react-intersection-observer` → native IntersectionObserver hook (~15 lines)

- **Used in:** 6 files (TitleCard, RequestItem, RequestCard, ShowMoreCard, IssueItem, Blocklist)
- **Purpose:** Lazy-load / infinite scroll triggers
- **Replacement:** Custom `useIntersectionObserver` hook wrapping native `IntersectionObserver` API
- **Risk:** Low — the native API is well-supported and the hook is straightforward
- **Recommendation:** **REMOVE**

#### `yamljs` → JSON or native alternative

- **Used in:** 1 file (`server/index.ts`) — loads `seerr-api.yml`
- **Purpose:** Parse YAML OpenAPI spec
- **Replacement:** Convert `seerr-api.yml` to JSON, or use `yaml` package (more modern, actively maintained)
- **Risk:** Low
- **Recommendation:** **REPLACE** with `yaml` package or convert spec to JSON

#### `xml2js` → keep (specialised)

- **Used in:** 2 files (`server/api/plextv.ts`, `server/api/animelist.ts`)
- **Purpose:** Parse XML API responses from Plex and AniList
- **Risk:** Medium — XML parsing is non-trivial
- **Recommendation:** **KEEP** for now; revisit if upstream APIs offer JSON

#### `wink-jaro-distance` → keep (specialised)

- **Used in:** 1 file (`server/api/rating/rottentomatoes.ts`)
- **Purpose:** String similarity scoring for Rotten Tomatoes title matching
- **Risk:** Low but algorithm is non-trivial to reimplement correctly
- **Recommendation:** **KEEP**

### 4.5 Dual Validation Libraries — Consolidation Opportunity

Both `yup` (0.32.11) and `zod` (4.3.6) are present:

| Library | Files | Usage |
|---|---|---|
| `yup` | 35 | Frontend form validation (all Formik forms) |
| `zod` | 6 | Backend schema validation (discover, blocklist, watchlist) |

**Analysis:** These serve different layers — yup is tightly coupled with Formik on the frontend,
while zod handles backend request validation. Consolidating would mean either:
- Migrating 35 Formik forms to use zod (requires `@hookform/resolvers` or custom adapter) — **Very High effort**
- Migrating 6 backend schemas to yup — **Low effort** but zod has better TypeScript inference

**Recommendation:** **DEFER** — not worth the effort to consolidate now. If yup is eventually
upgraded to v1 (Phase 3), reconsider at that point.

---

## 5. Type Definition Cleanup

When removing packages, also remove corresponding `@types/*`:

| Remove Package | Also Remove |
|---|---|
| `@formatjs/intl-utils` | (no @types) |
| `gravatar-url` | (no @types; uses inline types) |
| `semver` | `@types/semver` |
| `date-fns` | (ships own types) |

Also move to devDependencies (currently in dependencies):
| Package | Action |
|---|---|
| `@types/ua-parser-js` | Move to devDependencies |
| `@types/wink-jaro-distance` | Move to devDependencies |

---

## 6. Recommendations Summary

### Phase 1a: Dead Package Removal (manifest-only, no code changes) — ✅ DONE (commit `19e4c818`)

| # | Action | Effort | Status |
|---|---|---|---|
| 1 | Remove `@formatjs/intl-utils` (deprecated, unused) | Trivial | ✅ |
| 2 | Remove `@types/yup` — typecheck confirmed safe | Low | ✅ |
| 3 | ~~Remove `@types/mime`~~ — **kept**: `mime/lite` subpath needs it | Trivial | ⚠️ Kept |
| 4 | Move `@types/ua-parser-js` + `@types/wink-jaro-distance` to devDeps | Trivial | ✅ |

### Phase 1b: Inline Replacements (code changes, 1-2 files each) — ✅ DONE (commit `74b92259`)

| # | Action | Files | Effort | Status |
|---|---|---|---|---|
| 5 | Inline `copy-to-clipboard` → `navigator.clipboard` | 1 | Trivial | ✅ |
| 6 | Inline `react-use-clipboard` → custom hook | 1 | Trivial | ✅ |
| 7 | Inline `gravatar-url` → URL template + crypto.createHash | 3 | Low | ✅ |
| 8 | Inline `secure-random-password` → `crypto.randomBytes()` | 1 | Trivial | ✅ |
| 9 | Inline `@supercharge/request-ip` → Express `req.ip` (trust proxy) | 1 | Low | ✅ |
| 10 | Inline `semver` → custom coerce + compare | 1 | Low | ✅ |
| 12 | Inline `bowser` → UA string regex | 1 | Trivial | ✅ |
| 13 | Inline `date-fns` → native Date methods | 2 | Low | ✅ |
| 14 | Inline `react-animate-height` → CSS grid transition | 1 | Low | ✅ |
| 15 | Inline `react-truncate-markup` → CSS line-clamp | 1 | Trivial | ✅ |
| 16 | Replace `react-popper-tooltip` → `@floating-ui/react` | 2 | Medium | ⏳ Deferred to Phase 2 |
| 17 | Inline `@tanem/react-nprogress` → custom component | 1 | Low | ✅ |
| 18 | Inline `react-intersection-observer` → native IO hook | 6 | Low | ✅ |

### Phase 1c: Safe Version Bumps — Runtime — ✅ DONE (commit `ee74506a`)

| # | Action | Effort | Status |
|---|---|---|---|
| 19 | Apply all runtime patch/minor updates from §1a | Low | ✅ |

Bumped: @dr.pogodin/csurf, ace-builds, axios, country-flag-icons, dns-caching,
express-session, pg, react-aria, swr, undici, validator, winston-daily-rotate-file

### Phase 1d: Safe Version Bumps — Tooling — ✅ DONE (commit `0b26ebc9`)

| # | Action | Effort | Status |
|---|---|---|---|
| 20 | Apply all tooling patch/minor updates from §1b | Low | ✅ |

Bumped: @tailwindcss/forms, @tailwindcss/typography, @types/lodash, @types/nodemailer,
@types/secure-random-password, ~~@types/yamljs~~ (removed in Phase 2), autoprefixer,
baseline-browser-mapping, nodemon, postcss, prettier-plugin-tailwindcss

### Phase 2: Medium Effort (one session each) — ✅ DONE (commit `b1b1b2b8`)

| # | Action | Effort | Notes | Status |
|---|---|---|---|---|
| 16 | Replace `react-popper-tooltip` → `@floating-ui/react` | Medium | Rewrote Tooltip wrapper; 22 consumers unchanged | ✅ |
| 21 | Replace `yamljs` → `yaml` package | Low | 1 file; use `parse()` + `readFileSync` | ✅ |
| 22 | Upgrade `cronstrue` 2→3 | Low | API compatible | ✅ |
| 23 | Upgrade `express-rate-limit` 6→8 | Low | `max` still supported | ✅ |
| 24 | Upgrade `swagger-ui-express` 4→5 | Low | API compatible | ✅ |
| 25 | Upgrade `connect-typeorm` 1→2 | Low | Updated import path; ISession still exported | ✅ |
| 26 | Upgrade `@headlessui/react` 1→2 | Medium | Added `as="div"` to Transition with className/style | ✅ |
| 27 | Upgrade Git hooks cluster (`husky` 8→9, `lint-staged` 13→16, `@commitlint` 17→20) | Low | Removed husky.sh sourcing; added TTY guard | ✅ |
| 28 | Upgrade `typescript` 5.4→5.9 + `@typescript-eslint/*` 7→8 | Low | Fixed ban-types → no-unsafe-function-type; disabled new strict rules | ✅ |

### Phase 3: Deferred Major Upgrades

These require dedicated migration sprints. Each should have its own spec in `docs/`.

| # | Action | Trigger / Timing | Cluster |
|---|---|---|---|
| 29 | `yup` 0.32→1.7 | Dedicated sprint; 35 files; schema API changes | — |
| 30 | `express` 4→5 | Dedicated sprint; middleware + routing changes | Express |
| 31 | `react` 18→19 + `react-dom` + `@types/react` + `@types/react-dom` | After express stabilised | React |
| 32 | `next` 14→15+ + `eslint-config-next` | After React 19; App Router migration | Next.js |
| 33 | `tailwindcss` 3→4 | Dedicated sprint; config migration | Tailwind |
| 34 | `eslint` 8→10 + all eslint plugins | Flat config migration | Linting |
| 35 | `react-intl` 6→8 + `@formatjs/*` | After React 19 | @formatjs |
| 36 | `react-spring` 9→10 | After React 19 | — |
| 37 | `sharp` 0.33→0.34 | Test native bindings on target platforms | — |
| 38 | `cypress` 14→15 | Test runner changes; verify e2e suite | — |

---

## 7. Supply-Chain Reduction Summary

If all Phase 1 + Phase 2 items are completed:

- **Packages removed:** ~14 (copy-to-clipboard, react-use-clipboard, gravatar-url,
  secure-random-password, @supercharge/request-ip, semver, bowser, date-fns,
  react-animate-height, react-truncate-markup, @tanem/react-nprogress,
  react-intersection-observer, @formatjs/intl-utils, @types/mime)
- **Packages replaced:** 1 (react-popper-tooltip → @floating-ui/react)
- **Also removed:** 1 `@types/*` package (semver); `@types/yup` pending typecheck verification
- **Net package count reduction:** ~15 packages
- **Supply-chain surface area:** Reduced by ~12% of total dependencies
- **Native API adoption:** 12 packages replaced with browser/Node.js native APIs
- **Kept (revised):** `validator` (security-sensitive email validation in auth flows)

---

## 8. Execution Order

```
Phase 1a (Items 1-4)     →  pnpm install  →  pnpm build (verify)
Phase 1b (Items 5-18)    →  pnpm build  →  pnpm lint  →  verify
Phase 1c (Item 19)       →  pnpm build  →  verify
Phase 1d (Item 20)       →  pnpm build + pnpm lint  →  verify
Phase 2  (Items 21-28)   →  pnpm build  →  full test
Phase 3  (Items 29-38)   →  individual migration sprints with their own specs
```

Each sub-phase should be committed separately so regressions are attributable.
Phase 3 items each warrant their own specification document in `docs/`.

---

## 9. Unreviewed / Explicitly Deferred

The following packages exist in the codebase but are not targeted for changes
in this specification. They are listed here for completeness.

| Package | Version | Reason |
|---|---|---|
| `lodash` | 4.17.23 | Latest; 28 files; could partially inline but high effort for moderate gain |
| `react-toast-notifications` | 2.5.1 | 56 files; core notification system; replacement is a rewrite |
| `pug` | 3.0.3 | 10 email templates; template migration is separate project |
| `openpgp` | 6.3.0 | Cryptographic; no native alternative |
| `xml2js` | 0.5.0 | XML parsing from external APIs; specialised |
| `wink-jaro-distance` | 2.0.0 | String similarity algorithm; 1 file but non-trivial |
| `dns-caching` | 0.2.7 | Performance optimisation; specialised |
| `reflect-metadata` | 0.1.13 | TypeORM transitive requirement |
| `ace-builds` / `react-ace` | 1.43.4 / 10.1.0 | Code editor; complex component; 1 file |
| `node-cache` | 5.1.2 | Caching layer; would need custom Map-based replacement |
| `country-flag-icons` | 1.6.4 | 3 files; visual assets; alternative would need design review |
| `@seerr-team/react-tailwindcss-datepicker` | 1.3.4 | Custom fork; separate concern |
| `@svgr/webpack` | 6.5.1 | Webpack loader; working |
| `@fontsource-variable/inter` | 5.2.8 | Font package; working |
| `cy-mobile-commands` | 0.3.0 | Test utility; working |
| `cz-conventional-changelog` | 3.3.0 | Commitizen adapter; working |
| `eslint-plugin-no-relative-import-paths` | 1.6.1 | Enforces absolute imports; working |
| `prettier-plugin-organize-imports` | 4.3.0 | Import ordering; working |
| `http-proxy-agent` / `https-proxy-agent` | 7.0.2 / 7.0.6 | Proxy support; working |
| `axios-rate-limit` | 1.4.0 | Rate limiting for API calls; working |
| `copy-to-clipboard` | 3.3.3 | Targeted for removal in Phase 1b |
| `node-gyp` | 12.2.0 | Build tool; also pinned in pnpm.overrides for sqlite3 |
| `eslint-config-next` | 14.2.35 | Update with Next.js cluster |
| `eslint-config-prettier` | 8.6.0 | Update with Linting cluster |
| `eslint-plugin-jsx-a11y` | 6.10.2 | Update with Linting cluster |
| `eslint-plugin-prettier` | 4.2.1 | Update with Linting cluster |
| `eslint-plugin-react-hooks` | 4.6.0 | Update with Linting cluster |
| `eslint-plugin-formatjs` | 4.9.0 | Update with Linting cluster |
| `@tailwindcss/aspect-ratio` | 0.4.2 | Update with Tailwind cluster |
| `@heroicons/react` | 2.2.0 | Icon library; already latest |
| `@types/node` | 22.10.5 | Update alongside Node.js major version changes |
| `@types/react` | 18.3.3 | Update with React cluster |
| `@types/react-dom` | 18.3.0 | Update with React cluster |
| `@types/express` | 4.17.17 | Update with Express cluster |
| `validator` | 13.15.23 | Kept — security-sensitive email validation; patch-bump only |

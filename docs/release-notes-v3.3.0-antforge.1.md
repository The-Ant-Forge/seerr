## New Features

### Notifications
- **Discord thread ID support** — route notifications into a specific Discord thread by ID
- **Multiple Discord IDs** — webhook role/user mentions now accept multiple comma-separated IDs
- **Discord IDs available when disabled** — Discord settings IDs are surfaced even when the Discord notification agent is disabled
- **Public Seerr logo option in email** — toggle to use the public-hosted logo URL in email notifications, so email clients outside your network can render the image (handy for tunneled instances)

### Requests
- **Admin quota bypass** — admins with `MANAGE_REQUESTS` can pass `ignoreQuota: true` when creating a request to skip user quota enforcement (backend + entity migration; UI toggle deferred)
- **Special episodes when partial requests disabled** — special episodes can now be requested even when partial series requests are turned off

### API
- **`userId` support when creating issues** — admin endpoints can now create issues on behalf of another user

### UI
- **Follow button styling** — non-following state now has a grey background matching the filter buttons (was transparent and looked missing)

---

## Code Improvements

### Source Base
This release is rooted in upstream **v3.3.0** (was v3.2.0). 13 commits cherry-picked from `develop` between v3.2.0 and v3.3.0 cover the auth, scanner, availability sync, and request fixes listed below.

### Dependency Updates
Three rounds of patch/minor updates across the session covering 60+ packages:
- **React** 19.2.5 → 19.2.7
- **Next.js** 16.2.4 → 16.2.9
- **TypeORM** 0.3.28 → 0.3.29
- **axios** 1.15.2 → 1.18.0 (multiple security patches)
- **better-sqlite3** 12.9.0 → 12.11.1
- **undici** 8.0.2 → 8.5.0
- **eslint** 10.2.1 → 10.5.0
- **@typescript-eslint/\*** 8.58.1 → 8.61.1
- **express-rate-limit** 8.3.2 → 8.5.2
- **react-intl** 10.1.3 → 10.1.7
- **react-aria** 3.47.0 → 3.50.0
- **react-dom** 19.2.5 → 19.2.7
- **@types/react** 19.2.14 → 19.2.17 (made JSX non-global; added `import type { JSX } from 'react'` to 8 files)
- **pg** 8.20.0 → 8.22.0
- **openpgp** 6.3.0 → 6.3.1
- **zod** 4.3.6 → 4.4.3
- **yaml** 2.8.3 → 2.9.0
- Plus 40+ patch bumps on tooling (`prettier`, `postcss`, `@playwright/test`, `eslint-config-next`, `tsc-alias`, `vitest`, `@formatjs/*`, `country-flag-icons`, `nodemailer`, `cronstrue`, `tailwind-merge`, `commitizen`, `node-gyp`, `@tailwindcss/typography`, `http(s)-proxy-agent`)

### Deployment
- **`deploy.sh` hardened**: native modules (`better-sqlite3`, `sharp`, `bcrypt`) are now always rebuilt after `pnpm install --prod`. Prevents "Could not locate the bindings file" startup failures after native-module version bumps (such as the better-sqlite3 12.9 → 12.10 → 12.11 upgrades this release).

### Skipped
- **`4ed29cf1`** (upstream TV partial-status fix) — too tangled with our existing availability sync customisations. Will revisit in a focused session.
- **`@types/mime` v4** — we inlined our own MIME utility, the types package is no longer needed.
- **Upstream node:test-based test files** — incompatible with our vitest setup. Five test files dropped after cherry-picks; the runtime fixes themselves are valid.
- **Major version bumps deferred**: `nodemailer` 9, `node-gyp` 13, `lint-staged` 17, `typeorm` 1, `tailwindcss` 4, `sharp` 0.35, `@types/nodemailer` 8.

---

## Bug Fixes

### Authentication & Sessions
- **Plex pin poll**: drop the `popup.closed` check that caused premature poll termination on some browsers
- **Web push subscription auth middleware** corrected
- **Plex watchlist sync** handles `MediaContainer.Video` fallback (some Plex responses use `Video` instead of `Metadata`)

### Availability & Scanners
- **Availability sync** detects deleted seasons when the media server retains empty season metadata
- **Scanners** reset orphaned PROCESSING media from deleted Radarr/Sonarr entries
- **Scanners** ignore unknown seasons in availability rollup and skip empty placeholder seasons

### Requests
- **Watchlist sync re-requests deleted media** — previously a request for media that had been deleted would be skipped forever; now the watchlist sync can re-issue it (adapted from upstream #3072)
- **MediaRequest cascade fix** — removed cascade from `modifiedBy` relation to prevent the User column being wiped when a request is updated
- **Request deletion restores media status correctly** when the deleted request was the last active reference
- **Watchlist clean-up on error card delete** — deleting media from an error card now also removes it from the watchlist

### Notifications
- **Webhook payload encoding** normalises raw JSON inputs
- **Email respects /etc/hosts** for SMTP connections
- **ntfy priority** saved as number instead of string
- **Availability notification** sent if media is already available before approval

### UI
- **Discover keyword filter** preserves input focus after selection
- **Manage Movie sidebar** closes without browser back reopening it
- **Issue descriptions** allow lists (`ul`, `ol`, `li`) in rendered markdown
- **Search placeholder** says "Series" instead of "TV"
- **Override rules** use `find()` instead of array-index lookup for service resolution (fixes stale match after rule reordering)
- **External Trakt link** uses IMDb ID instead of TMDB ID
- **Missing React keys** added to several array renders in Movie/TV/Collection details

---

## Versioning

Per our convention `v{upstream}-antforge.{n}`:
- Previous: `v3.2.0-antforge.1` (rooted in upstream v3.2.0, released 2026-04-25)
- This release: `v3.3.0-antforge.1` (rooted in upstream v3.3.0, released 2026-06-02)

**Full Changelog**: https://github.com/The-Ant-Forge/seerr/compare/v3.2.0-antforge.1...v3.3.0-antforge.1

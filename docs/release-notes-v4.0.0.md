## New Features

### Following (Actor Subscriptions)
Follow actors and crew members from their person page and automatically request new credits as they appear on TMDB. Available in both desktop sidebar and mobile navigation.

- **Configurable credit type**: cast, crew, or both
- **Role filtering**: lead (top 5 billed), supporting, director, producer, writer, composer, cinematographer
- **IMDb rating threshold** to skip low-quality content
- **Backfill option** to request existing filmography on subscribe
- **Smart filtering**: "Self" credits (interviews, behind-the-scenes, awards) automatically excluded
- **Three-state rating check**: recent/upcoming unrated content is deferred and retried; old unrated content is permanently skipped

### Other New Features
- **Auto-remove from Plex watchlist** when deleting media
- **Bulk remove** — remove all visible filtered requests from Radarr/Sonarr and Seerr in one operation
- **Resync button** — manual reconciliation that detects orphaned requests, recovers failed requests, and flags stuck pending requests
- **Rating icons on requests** — RT critics/audience, IMDb, and TMDB scores shown inline
- **Date range presets** in the discover filter (Upcoming, Current, Last 3 Years, Older)
- **Delete-files toggle** — per-server setting in Radarr/Sonarr to control whether files are deleted from disk
- **Clear logs button** — admin-only on the settings/logs page
- **Backup & restore** — settings tab, setup wizard integration, and system tray support
- **Sortable columns** in the user list
- **TMDB/IMDb links** on person detail pages
- **Quality profiles sorted alphabetically** in request and service configuration

---

## Code Improvements

### Framework Upgrades
- **React 18 → 19** — forwardRef removal across 7 components, strict ref typing, modern hook patterns
- **Next.js 14 → 16** — Turbopack build support, bundler moduleResolution, SVGR config, eslint-config-next 16
- **TypeScript 5.4 → 6.0** — modern module resolution, strict type checking
- **ESLint 8 → 10** — flat config, new react-hooks rules
- **SQLite driver: sqlite3 → better-sqlite3** — synchronous API, better WAL mode handling, actively maintained

### Additional Dependency Updates (30+ packages)
- Express 4 → 5, yup 0.32 → 1.7, Headless UI 1 → 2
- react-intl 6 → 10, react-markdown 8 → 10 (with rehype-sanitize)
- lodash 4.17 → 4.18, sharp 0.33 → 0.34, undici 7 → 8
- http-proxy-agent/https-proxy-agent 7 → 9, ua-parser-js 1 → 2
- express-openapi-validator 4 → 5, @formatjs/* packages
- 18+ packages removed by replacing with native APIs or inlining

### Supply Chain Hardening
- **Inlined 3 packages** to reduce third-party surface: `mime` (32-line MIME map), `wink-jaro-distance` (50-line Jaro algorithm), `axios-rate-limit` (49-line rate limiter)
- **Replaced abandoned `react-toast-notifications`** (last publish 2020, depended on `@emotion/core`) with inline 90-line `ToastContext`
- Net result: **5 fewer runtime dependencies**, identical functionality

### Testing
- Vitest unit tests grown from 220 to **275 tests across 21 files**
- New test coverage for: backup validation, proxy bypass logic, watchlist sync concurrency, input validation, lodash functions, MIME types, Jaro-Winkler algorithm

### Robustness
- **Session resilience**: custom `onError` handler prevents transient `SQLITE_BUSY` errors from permanently disconnecting the session store (connect-typeorm bug)
- **Watchlist sync**: concurrent run guard prevents duplicate requests; dedup queries abort safely on DB lock
- **Crash protection**: global handlers for `unhandledRejection` and `uncaughtException`
- **Auth hardening**: proper session destruction on logout, headersSent guard in error handler

---

## Bug Fixes

### Authentication
- Fix crash when Plex account has no email address
- Fix sign-out not actually destroying the session (connect-typeorm softDelete bug)
- Fix sign-out not redirecting to login page (SWR stale data)
- Fix session store permanently disconnecting on transient SQLITE_BUSY errors

### Requests & Media
- Fix duplicate requests from concurrent watchlist sync runs
- Fix re-requesting partially available TV seasons
- Fix requests not marked as completed when media is already available
- Fix available filter on requests page not including media already in library
- Fix orphaned requests not recovered during resync
- Fix TMDB ID disambiguation by media type across lookups

### Other Fixes
- Fix Plex watchlist fetch failing when size exceeds 120 items
- Fix settings.json corruption from concurrent writes (serialised writes)
- Fix logs page 500 error on Windows when symlink is missing
- Fix trailing whitespace in login username field
- Fix display language not respected for trailers
- Fix Jellyfin scanner missing TheMovieDb provider fallback
- Fix region selector reporting empty regions during sync

---

## Deployment

### Windows
- **`deploy.sh`** — one-step build and deploy (`--clean` flag for full wipe)
- **System tray manager** (PowerShell + VBS) — start/stop/open from Windows system tray
- **Cloudflare Tunnel** compatible with trust proxy support

### Breaking Changes
- **Node.js 22+** now required (was 20+)
- **SQLite driver changed** from `sqlite3` to `better-sqlite3` — existing databases are fully compatible (same file format, same migrations)
- **React 19** — if you have custom components extending Seerr, `forwardRef` is no longer used; ref is passed as a regular prop

**Full Changelog**: https://github.com/The-Ant-Forge/seerr/compare/v3.1.0...v4.0.0

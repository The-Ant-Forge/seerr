## New Features

### Settings
- **Blocklist region and language options** — configure default region and original language for blocklist filtering (cherry-pick from upstream #1802)
- **Help tooltips for services setup** — inline guidance when configuring Radarr/Sonarr (cherry-pick from upstream #2662)

---

## Code Improvements

### Source Base
This release is rooted in upstream **v3.2.0** (was v3.1.0). The following upstream commits were cherry-picked to incorporate fixes and improvements that landed between v3.1.0 and v3.2.0:
- `#2746` Plex OAuth client ID mismatch fix
- `#2742` Delete permission check correction
- `#2824` Record modifiedBy on retry
- `#2849` Local login UX improvements
- `#2862` Sanitise corrupt quota values during Overseerr migration
- `#2884` Persist new settings defaults to disk on startup

### Documentation
- Extracted code review checklist from CLAUDE.md into `docs/Spec-CodeReview.md` (CLAUDE.md slimmed from 330 to 218 lines)
- Adopted `v{upstream}-antforge.{n}` versioning convention

### Dependency Updates (~30 packages)

**Runtime patch updates:**
- `axios` 1.14.0 → 1.15.2 (includes upstream's security fix #2872)
- `next` 16.2.2 → 16.2.4
- `react` / `react-dom` 19.2.4 → 19.2.5
- `@headlessui/react` 2.2.9 → 2.2.10
- `nodemailer` 8.0.4 → 8.0.6
- `undici` 8.0.0 → 8.1.0
- `react-intl` 10.1.1 → 10.1.3
- `react-aria` 3.47.0 → 3.48.0
- `better-sqlite3` 12.8.0 → 12.9.0
- `express-rate-limit` 8.3.1 → 8.4.1
- `country-flag-icons` 1.6.15 → 1.6.16
- `@formatjs/*` patch updates

**Dev tooling patch updates:**
- `typescript` 6.0.2 → 6.0.3
- `vitest` 4.1.2 → 4.1.5
- `eslint` 10.1.0 → 10.2.1
- `eslint-config-next` 16.2.2 → 16.2.4
- `eslint-plugin-react-hooks` 7.0.1 → 7.1.1
- `eslint-plugin-formatjs` 6.4.4 → 6.4.6
- `@typescript-eslint/*` 8.57.2 → 8.59.0
- `@types/node` 25.5.0 → 25.6.0
- `@commitlint/cli` 20.5.0 → 20.5.2
- `prettier` 3.8.1 → 3.8.3
- `prettier-plugin-tailwindcss` 0.7.2 → 0.7.3
- `postcss` 8.5.8 → 8.5.10
- `autoprefixer` 10.4.27 → 10.5.0
- `@playwright/test` 1.58.2 → 1.59.1
- `globals` 17.4.0 → 17.5.0
- `node-gyp` 12.2.0 → 12.3.0

### Cleanup
- Removed stale `sqlite3>node-gyp` pnpm override (we use `better-sqlite3` now)
- Coerce axios response headers to string for compatibility with axios 1.15's tighter typing

---

## Bug Fixes

### Authentication
- **Authorisation bypass on request deletion** — fixed logic flaw in `DELETE /api/v1/request/:id` permission check that allowed any authenticated user to delete other users' pending requests
- **Plex OAuth client ID mismatch** — generates a stable `plexOAuthClientId` separate from `clientId`

### Requests & Media
- **Allow requesting partially available series** — series with `PARTIALLY_AVAILABLE` status now show the "Request More" button and allow re-requesting missing seasons
- **Record modifiedBy on retry** — request retries now properly track the acting user

### Settings
- **Persist new settings defaults on startup** — newly added settings defaults are now written to disk

### Other
- **Sanitise corrupt quota values during Overseerr migration**

---

## Versioning

Per our convention `v{upstream}-antforge.{n}`:
- Previous: `v3.1.0-antforge.1` (rooted in upstream v3.1.0)
- This release: `v3.2.0-antforge.1` (rooted in upstream v3.2.0)

**Full Changelog**: https://github.com/The-Ant-Forge/seerr/compare/v3.1.0-antforge.1...v3.2.0-antforge.1

# Spec: Backup & Restore

**Date:** 2026-03-11
**Status:** Implemented

## Overview

Users can snapshot their Seerr instance as a ZIP file and restore it to a fresh or existing install. Useful for migrations, disaster recovery, and dev/test workflows.

## What gets backed up

| File | Required | Purpose |
|------|----------|---------|
| `config/settings.json` | Yes | All app config (servers, notifications, jobs, API keys) |
| `config/db/db.sqlite3` | Yes (SQLite only) | Users, media, requests, issues, blocklist, watchlist |
| `config/settings.old.json` | If exists | Migration backup |
| `manifest.json` | Generated | Version, timestamp, dbType, file list |

**Excluded** (ephemeral): logs, image cache, anime-list.xml

## Backup format

ZIP file named `seerr-backup-YYYY-MM-DDTHH-MM-SS.zip` containing:
```
manifest.json
settings.json
settings.old.json    (if exists)
db/db.sqlite3        (SQLite only)
```

## API endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/v1/settings/backup` | ADMIN | Download backup ZIP |
| `POST` | `/api/v1/settings/backup/restore` | ADMIN | Upload ZIP, restore, restart |
| `POST` | `/api/v1/settings/backup/restore/setup` | None (only if `!initialized`) | Restore during fresh install |

## UI

### Settings tab: Backup & Restore
- Positioned before "About" in the settings nav
- **Backup section**: "Download Backup" button, info alert about sensitive data
- **Restore section**: file picker, warning alert, confirmation modal, restart polling

### Setup wizard
- Step 1 (server type selection): "or" divider below the server grid, then "Restore from a backup" link
- Clicking shows file picker + restore button inline
- On success: redirects to `/` (app is now initialized from backup)

## Implementation files

### Created
- `server/utils/backup.ts` — `createBackupZip()`, `validateBackupZip()`, `restoreFromZip()`
- `server/routes/settings/backup.ts` — GET download + POST restore (admin)
- `src/pages/settings/backup.tsx` — Next.js page wrapper
- `src/components/Settings/SettingsBackup/index.tsx` — React component

### Modified
- `server/routes/settings/index.ts` — mount backup sub-router
- `server/routes/index.ts` — unauthenticated setup restore endpoint
- `src/components/Settings/SettingsLayout.tsx` — add tab
- `src/components/Setup/index.tsx` — add restore option on step 1
- `package.json` — `adm-zip` + `@types/adm-zip`

## Security

- Backup download and authenticated restore: ADMIN only (inherited from `/settings` router)
- Setup restore: only when `!initialized` (same trust model as setup wizard)
- Path traversal: only extract known filenames from whitelist
- ZIP bomb: validates decompressed size (1 GB max)
- Size limit: `express.raw({ limit: '500mb' })` caps upload
- Auto pre-restore backup: `config/pre-restore-backup.zip` created before overwriting
- Rate limit: 2 req/min on restore endpoints
- Sensitive data warning in UI

## PostgreSQL note

PostgreSQL users get a settings-only backup (no DB files). The manifest notes `dbType: 'postgres'`. Database backup requires `pg_dump` externally. Restoring a SQLite backup to a PostgreSQL instance (or vice versa) is rejected with a clear error.

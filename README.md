<p align="center">
<img src="./public/logo_full.svg" alt="Seerr" style="margin: 20px 0;">
</p>
<p align="center">
<a href="https://github.com/seerr-team/seerr/blob/develop/LICENSE"><img alt="GitHub" src="https://img.shields.io/github/license/seerr-team/seerr"></a>
</p>

> **Standalone fork of [seerr-team/seerr](https://github.com/seerr-team/seerr)** &mdash; modernised framework, new features, quality-of-life improvements, and Windows deployment tooling.

**Seerr** is a free and open source software application for managing requests for your media library. It integrates with the media server of your choice: [Jellyfin](https://jellyfin.org), [Plex](https://plex.tv), and [Emby](https://emby.media/). In addition, it integrates with your existing services, such as **[Sonarr](https://sonarr.tv/)**, **[Radarr](https://radarr.video/)**.

## What's changed in this fork

### New features

- **Following (actor subscriptions)** &mdash; follow actors and crew members from their person page and auto-request new credits as they appear on TMDB
  - Configurable credit type: cast, crew, or both
  - Role filtering: lead (top 5 billed), supporting, director, producer, writer, composer, cinematographer
  - IMDb rating threshold to skip low-quality content
  - Backfill option to request existing filmography on subscribe
  - Smart filtering: "Self" credits (interviews, behind-the-scenes, awards) are automatically excluded
  - Three-state rating check: content with no rating that is recent/upcoming is deferred and retried, while old unrated content is permanently skipped
  - Available in both desktop sidebar and mobile navigation
- **Bulk remove** &mdash; remove all visible filtered requests from Radarr/Sonarr and Seerr in one operation
- **Resync button** &mdash; manual reconciliation on the requests page that detects orphaned requests (approved in Seerr but missing from Radarr/Sonarr), recovers failed requests found in the service, and flags stuck pending requests
- **Rating icons on requests** &mdash; RT critics/audience, IMDb, and TMDB scores shown inline on request list items
- **Date range presets** &mdash; quick-select dropdown in the discover filter (Upcoming, Current, Last 3 Years, Older)
- **Delete-files toggle** &mdash; per-server setting in Radarr/Sonarr configuration to control whether files are deleted from disk when removing media (default: off)
- **Clear logs button** &mdash; admin-only button on the settings/logs page
- **Backup & restore** &mdash; settings tab, setup wizard integration, and system tray support
- **Auto-remove from Plex watchlist** &mdash; when deleting media, the corresponding Plex watchlist entry is removed

### Code quality & hardening

- **Testing**: Cypress &rarr; Playwright for E2E tests; Vitest unit tests grown to 275 across 21 files
- **Type safety**: removed file-wide `any` disables from Jellyfin API client; typed Selector components; React 19 strict ref typing
- **Performance**: parallelised availability sync; aggregated sequential count queries; unique composite index on media
- **Robustness**: 30s default timeout on all external API calls; pagination caps on all list endpoints; global crash protection for unhandled rejections
- **Session resilience**: custom `onError` handler prevents transient SQLite errors from permanently killing the session store
- **Watchlist sync**: concurrent run guard prevents duplicate requests; dedup queries abort on DB lock instead of creating duplicates
- **Supply chain hardening**: inlined 3 packages (mime, wink-jaro-distance, axios-rate-limit) and replaced abandoned react-toast-notifications to reduce third-party dependency surface
- **Cleanup**: removed dead dependencies; extracted shared helpers; removed dead code and unused types

### Dependency updates

**Framework upgrades:**
- **React 18 &rarr; 19** with forwardRef removal, strict ref typing, and component preparation
- **Next.js 14 &rarr; 16** with Turbopack support, bundler moduleResolution, and SVGR config
- **TypeScript 5.4 &rarr; 6.0** with `ignoreDeprecations` for transitional compatibility
- **ESLint 8 &rarr; 10** with flat config migration and eslint-config-next 16
- **SQLite driver**: sqlite3 &rarr; better-sqlite3 (synchronous, better WAL handling)

**Additional upgrades (30+ packages):**
- **Express 4 &rarr; 5** with path-to-regexp v8 wildcard syntax fixes
- **yup 0.32 &rarr; 1.7** with 34 `.when()` API transformations across 16 files
- **Headless UI 1 &rarr; 2**, react-intl 6 &rarr; 10, react-markdown 8 &rarr; 10
- lodash 4.17 &rarr; 4.18, sharp 0.33 &rarr; 0.34, undici 7 &rarr; 8, mime 3 &rarr; 4
- http-proxy-agent/https-proxy-agent 7 &rarr; 9, ua-parser-js 1 &rarr; 2
- express-openapi-validator 4 &rarr; 5, @formatjs/* packages
- **18+ packages removed** by replacing with native browser/Node.js APIs or inlining

### Deployment tooling

- **`deploy.sh`** &mdash; one-step build and deploy to a local folder (`--clean` flag for full wipe)
- **System tray manager** (PowerShell + VBS) &mdash; start/stop/open-browser from the Windows system tray, like Radarr/Sonarr
- **Cloudflare Tunnel** compatible &mdash; configurable port via `$PORT` env var, trust proxy support, no inbound ports required

### Upstream strategy

This is a standalone repository (detached from the GitHub fork). Cherry-picks individual commits from upstream rather than merging, since the histories have diverged significantly. See [CLAUDE.md](CLAUDE.md) for the full branch strategy and cherry-pick workflow.

## Current Features

- Full Jellyfin/Emby/Plex integration including authentication with user import & management.
- Support for **PostgreSQL** and **SQLite** databases (using better-sqlite3 driver).
- Supports Movies, Shows and Mixed Libraries.
- Ability to change email addresses for SMTP purposes.
- Easy integration with your existing services. Currently, Seerr supports Sonarr and Radarr. More to come!
- Jellyfin/Emby/Plex library scan, to keep track of the titles which are already available.
- Customizable request system, which allows users to request individual seasons or movies in a friendly, easy-to-use interface.
- Incredibly simple request management UI. Don't dig through the app to simply approve recent requests!
- Granular permission system.
- Support for various notification agents.
- Mobile-friendly design, for when you need to approve requests on the go!
- Support for watchlisting & blocklisting media.

With more features on the way! Check out our [issue tracker](/../../issues) to see the features which have already been requested.

## Getting Started

Check out our documentation for instructions on how to install and run Seerr:

https://docs.seerr.dev/getting-started/

## Preview

<img src="./public/preview.jpg" alt="Seerr application preview" />

## Migrating from Overseerr/Jellyseerr to Seerr

Read our [release announcement](https://docs.seerr.dev/blog/seerr-release) to learn what Seerr means for Jellyseerr and Overseerr users.

Please follow our [migration guide](https://docs.seerr.dev/migration-guide) for detailed instructions on migrating from Overseerr or Jellyseerr.

## Support

- Check out the [Seerr Documentation](https://docs.seerr.dev) before asking for help. Your question might already be in the docs!
- You can get support on [Discord](https://discord.gg/seerr).
- You can ask questions in the Help category of our [GitHub Discussions](/../../discussions).
- Bug reports and feature requests can be submitted via [GitHub Issues](/../../issues).

## API Documentation

You can access the API documentation from your local Seerr install at http://localhost:5055/api-docs

## Community

You can ask questions, share ideas, and more in [GitHub Discussions](/../../discussions).

If you would like to chat with other members of our growing community, [join the Seerr Discord server](https://discord.gg/seerr)!

Our [Code of Conduct](./CODE_OF_CONDUCT.md) applies to all Seerr community channels.

## Contributing

This is a personal fork. For upstream contributions, see the [original repo](https://github.com/seerr-team/seerr) and its [Contribution Guide](https://github.com/seerr-team/seerr/blob/develop/CONTRIBUTING.md).

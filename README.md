<p align="center">
<img src="./public/logo_full.svg" alt="Seerr" style="margin: 20px 0;">
</p>
<p align="center">
<a href="https://github.com/seerr-team/seerr/blob/develop/LICENSE"><img alt="GitHub" src="https://img.shields.io/github/license/seerr-team/seerr"></a>
</p>

> **Fork of [seerr-team/seerr](https://github.com/seerr-team/seerr)** — modernised dependencies, Express 5, ESLint flat config, and Windows deployment tooling.

**Seerr** is a free and open source software application for managing requests for your media library. It integrates with the media server of your choice: [Jellyfin](https://jellyfin.org), [Plex](https://plex.tv), and [Emby](https://emby.media/). In addition, it integrates with your existing services, such as **[Sonarr](https://sonarr.tv/)**, **[Radarr](https://radarr.video/)**.

## What's changed in this fork

This fork focuses on dependency modernisation and deployment improvements. All changes are committed separately for clean regression attribution.

### Dependency updates ([full spec](docs/Spec-Dependency-Update.md))

- **15 packages removed** by replacing with native browser/Node.js APIs (clipboard, intersection observer, date-fns, gravatar, semver, and more)
- **Express 4 &rarr; 5** with path-to-regexp v8 wildcard syntax fixes
- **ESLint 8 &rarr; 9** with flat config migration (`eslint.config.js`)
- **yup 0.32 &rarr; 1.7** with 34 `.when()` API transformations across 16 files
- **TypeScript 5.4 &rarr; 5.9** + @typescript-eslint v8
- **Headless UI 1 &rarr; 2**, husky 8 &rarr; 9, lint-staged 13 &rarr; 16, commitlint 17 &rarr; 20
- Multiple medium-effort upgrades: cronstrue, express-rate-limit, swagger-ui-express, connect-typeorm, @floating-ui/react (replacing react-popper-tooltip), yaml (replacing yamljs)
- 2 real bugs found and fixed by new ESLint rules (`Number() ?? 1` &rarr; `|| 1`, `Infinity` import shadowing)

### Code quality & hardening ([review spec](docs/spec-code-review-260310.md))

- **Testing**: Cypress &rarr; Playwright for E2E tests; Vitest unit tests grown to 220 across 14 files (permissions, notifications, settings, routes, utilities)
- **Type safety**: removed file-wide `any` disables from Jellyfin API client; typed Selector components; replaced `ace-builds` + `react-ace` with native `<textarea>`
- **Performance**: parallelised availability sync (5 concurrent via `Promise.allSettled`); fixed N+1 queries in Plex/Jellyfin user imports; aggregated 8 sequential count queries into one
- **Robustness**: 30s default timeout on all external API calls; pagination caps on all list endpoints; AsyncLock on request submission to prevent duplicates; unique composite index on media
- **Bug fixes**: `plexUsername` sort returning wrong column; missing `await` on request save; wrong HTTP 401 &rarr; 403 for permission denial; `process.env.port` lowercase typo
- **Cleanup**: removed 5 dead dependencies (`ace-builds`, `react-ace`, `react-spring`, `@types/csurf`, `cypress`); extracted shared helpers to reduce duplication across notification agents and detail components

### Deployment tooling

- **`deploy.sh`** &mdash; one-step build and deploy to a local folder
- **System tray manager** (PowerShell + VBS) &mdash; start/stop/open-browser from the Windows system tray, like Radarr/Sonarr

### What's NOT changed

- No feature changes or UI modifications
- All existing functionality preserved
- Upstream changes can be merged via `git fetch upstream develop && git merge upstream/develop`

## Current Features

- Full Jellyfin/Emby/Plex integration including authentication with user import & management.
- Support for **PostgreSQL** and **SQLite** databases.
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

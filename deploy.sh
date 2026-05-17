#!/bin/bash
# deploy.sh — Build and deploy Seerr to a local folder
# Usage: bash deploy.sh [--clean] [DEST]
# Default destination: D:/Apps/Seerr
#
# Modes:
#   (default)  Safe push — overwrites build artifacts only, preserves config/
#   --clean    Wipes the destination and deploys from scratch (loses db + settings)
#
# Runtime data lives entirely under DEST/config/:
#   config/db/db.sqlite3       — SQLite database
#   config/settings.json       — app settings (Plex, Jellyfin, Sonarr, etc.)
#   config/logs/               — log files
#   config/cache/images/       — image proxy cache
#   config/anime-list.xml      — cached anime list
#
# NOTE: node_modules is NOT copied — pnpm symlinks break when copied.
# Instead, pnpm install --prod is run in the destination folder.

set -euo pipefail

CLEAN=false
DEST=""

for arg in "$@"; do
  case "$arg" in
    --clean) CLEAN=true ;;
    *) DEST="$arg" ;;
  esac
done

DEST="${DEST:-D:/Apps/Seerr}"
SRC="$(cd "$(dirname "$0")" && pwd)"

echo "==> Building Seerr..."
cd "$SRC"
pnpm build

if [ "$CLEAN" = true ]; then
  echo "==> CLEAN deploy — wiping $DEST..."
  rm -rf "$DEST"
fi

echo "==> Deploying to $DEST..."
mkdir -p "$DEST"

# Core build artifacts — use rsync-style mirror (robocopy flags get mangled by MSYS)
for dir in dist .next public; do
  rm -rf "$DEST/$dir"
  cp -r "$SRC/$dir" "$DEST/$dir"
done

# Config and manifest files
cp "$SRC/package.json"        "$DEST/"
cp "$SRC/pnpm-lock.yaml"     "$DEST/"
cp "$SRC/seerr-api.yml"      "$DEST/"
cp "$SRC/next.config.js"     "$DEST/"
cp "$SRC/postcss.config.js"  "$DEST/"
cp "$SRC/tailwind.config.js" "$DEST/"

# System tray manager
cp "$SRC/Seerr-Tray.ps1"    "$DEST/"
cp "$SRC/Seerr-Tray.vbs"    "$DEST/"
cp "$SRC/public/favicon.ico" "$DEST/seerr.ico"

# Prepare script (bin/prepare.js) needs to exist for the lifecycle hook
mkdir -p "$DEST/bin"
cp "$SRC/bin/prepare.js" "$DEST/bin/"

# Install production dependencies (preserves pnpm symlink structure)
echo "==> Installing production dependencies..."
cd "$DEST"
CI=true pnpm install --prod

# Rebuild native modules. pnpm install sometimes skips the rebuild when the
# package version changes but the build script entry stays the same, leaving
# stale or missing .node binaries (manifests as "Could not locate the bindings
# file" at startup). Explicit rebuild keeps deploys bulletproof.
#
# Non-fatal: if Seerr is still running it holds the .node files open and
# node-gyp's clean step fails with EPERM. In that case just warn — the
# existing binaries are still usable as long as the package version
# hasn't changed.
echo "==> Rebuilding native modules..."
if ! pnpm rebuild better-sqlite3 sharp bcrypt; then
  echo "==> WARNING: native module rebuild failed (Seerr may be running)."
  echo "    If you upgraded better-sqlite3/sharp/bcrypt, stop Seerr and re-run:"
  echo "      cd $DEST && pnpm rebuild better-sqlite3 sharp bcrypt"
fi

echo ""
echo "==> Deploy complete ($( [ "$CLEAN" = true ] && echo "clean" || echo "safe" ))."
echo "    Start with: double-click $DEST/Seerr-Tray.vbs (system tray)"
echo "    Or:         cd $DEST && NODE_ENV=production node dist/index.js"
echo "    Or:         cd $DEST && pnpm start"

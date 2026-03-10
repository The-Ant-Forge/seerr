#!/bin/bash
# deploy.sh — Build and deploy Seerr to a local folder
# Usage: bash deploy.sh [DEST]
# Default destination: D:/Apps/Seerr
#
# NOTE: node_modules is NOT copied — pnpm symlinks break when copied.
# Instead, pnpm install --prod is run in the destination folder.

set -euo pipefail

DEST="${1:-D:/Apps/Seerr}"
SRC="$(cd "$(dirname "$0")" && pwd)"

echo "==> Building Seerr..."
cd "$SRC"
pnpm build

echo "==> Deploying to $DEST..."
mkdir -p "$DEST"

# Core build artifacts (robocopy exit codes 0-7 are success)
robocopy "$SRC/dist"    "$DEST/dist"    /MIR /NFL /NDL /NJH /NJS /NP > /dev/null 2>&1 || true
robocopy "$SRC/.next"   "$DEST/.next"   /MIR /NFL /NDL /NJH /NJS /NP > /dev/null 2>&1 || true
robocopy "$SRC/public"  "$DEST/public"  /MIR /NFL /NDL /NJH /NJS /NP > /dev/null 2>&1 || true

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

# Install production dependencies (preserves pnpm symlink structure)
echo "==> Installing production dependencies..."
cd "$DEST"
pnpm install --prod --ignore-scripts
pnpm rebuild

echo ""
echo "==> Deploy complete."
echo "    Start with: cd $DEST && NODE_ENV=production node dist/index.js"
echo "    Or:         cd $DEST && pnpm start"

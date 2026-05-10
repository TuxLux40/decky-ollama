#!/usr/bin/env bash
# Builds and installs the decky-ollama plugin to ~/homebrew/plugins/.
# Run from the repo root: bash install.sh
set -euo pipefail

PLUGIN_DIR="$HOME/homebrew/plugins/decky-ollama"

if ! command -v pnpm &>/dev/null; then
    echo "pnpm not found. Install it with: npm install -g pnpm" >&2
    exit 1
fi

echo "==> Building frontend..."
pnpm install --frozen-lockfile
pnpm build

echo "==> Installing to $PLUGIN_DIR..."
mkdir -p "$PLUGIN_DIR/dist"
cp dist/index.js dist/index.js.map "$PLUGIN_DIR/dist/"
cp main.py plugin.json package.json "$PLUGIN_DIR/"

echo ""
echo "Done. Restart Decky Loader from the QAM to apply."

#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "[replit] repo root: $(pwd)"
if [ -f dist/index.js ] && [ -f dist/public/index.html ]; then
  echo "[replit] existing production build found"
else
  bash scripts/replit-build.sh
fi

export PORT="${PORT:-5000}"
export HOST="${HOST:-0.0.0.0}"
export NODE_ENV="${NODE_ENV:-production}"
export HELIX_ASK_GOLDEN_PATH_RUNTIME="${HELIX_ASK_GOLDEN_PATH_RUNTIME:-1}"

source scripts/replit-codex-auth.sh

echo "[replit] starting CasimirBot on port ${PORT}"
exec node --max-old-space-size=4096 dist/index.js

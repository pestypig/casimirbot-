#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "[replit] repo root: $(pwd)"
bash scripts/replit-build.sh

export PORT="${PORT:-5000}"
export HOST="${HOST:-0.0.0.0}"
export NODE_ENV="${NODE_ENV:-production}"
export HELIX_ASK_GOLDEN_PATH_RUNTIME="${HELIX_ASK_GOLDEN_PATH_RUNTIME:-1}"

echo "[replit] starting CasimirBot on port ${PORT}"
exec node --max-old-space-size=4096 dist/index.js

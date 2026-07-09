#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "[replit] installing runtime dependencies"
if [ "${REPLIT_KEEP_PACKAGE_DEV_DEPENDENCIES:-0}" = "1" ]; then
  echo "[replit] keeping dev dependencies for Replit Vite middleware"
  npm install
else
  npm install --omit=dev
fi

export VITE_BUILD_ID="${VITE_BUILD_ID:-$(git rev-parse --short=12 HEAD 2>/dev/null || date +%s)}"
echo "[replit] build id: ${VITE_BUILD_ID}"

echo "[replit] building current checkout"
VITE_HELIX_ASK_JOB_TIMEOUT_MS="${VITE_HELIX_ASK_JOB_TIMEOUT_MS:-1200000}" npm run build

echo "[replit] packaging runtime data"
mkdir -p dist/data/starsim
cp data/starsim/*.json dist/data/starsim/

if [ -f scripts/deploy-clean.cjs ]; then
  echo "[replit] cleaning deployment artifacts"
  node scripts/deploy-clean.cjs
fi

if [ "${REPLIT_PRUNE_DEV_DEPENDENCIES:-0}" = "1" ]; then
  echo "[replit] pruning dev dependencies"
  npm prune --omit=dev
else
  echo "[replit] leaving dev dependencies installed"
fi

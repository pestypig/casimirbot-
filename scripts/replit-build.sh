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

echo "[replit] building current checkout"
VITE_HELIX_ASK_JOB_TIMEOUT_MS="${VITE_HELIX_ASK_JOB_TIMEOUT_MS:-1200000}" npm run build

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

#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

node scripts/replit-build-meta.mjs assert-source

echo "[replit] installing runtime dependencies"
if [ "${REPLIT_KEEP_PACKAGE_DEV_DEPENDENCIES:-0}" = "1" ]; then
  echo "[replit] keeping dev dependencies for Replit Vite middleware"
  npm install
else
  npm install --omit=dev
fi

node scripts/replit-build-meta.mjs assert-source
if [ -z "$(git status --porcelain=v1 --untracked-files=all 2>/dev/null)" ]; then
  export REPLIT_GIT_WORKTREE_CLEAN_AT_AUTHORITY_CHECK=1
else
  export REPLIT_GIT_WORKTREE_CLEAN_AT_AUTHORITY_CHECK=0
fi
if [ "${REPLIT_STRICT_GIT_BUILD:-0}" = "1" ] || [ "${REPLIT_DEPLOYMENT:-0}" = "1" ] || [ "${REPLIT_DEPLOYMENT:-false}" = "true" ]; then
  export REPLIT_GIT_AUTHORITY_VERIFIED=1
else
  export REPLIT_GIT_AUTHORITY_VERIFIED=0
fi

export GIT_COMMIT="$(git rev-parse HEAD)"
export SOURCE_VERSION="${GIT_COMMIT}"
export VITE_BUILD_ID="${GIT_COMMIT:0:12}"
echo "[replit] build id: ${VITE_BUILD_ID}"

echo "[replit] building current checkout"
node --import tsx scripts/helix-replit-parity-static.ts --out=dist/parity/static-result.json
VITE_HELIX_ASK_JOB_TIMEOUT_MS="${VITE_HELIX_ASK_JOB_TIMEOUT_MS:-1200000}" npm run build:client
npm run build:server

echo "[replit] packaging runtime data"
mkdir -p dist/data/starsim
cp data/starsim/*.json dist/data/starsim/

if [ -f scripts/deploy-clean.cjs ]; then
  echo "[replit] cleaning deployment artifacts"
  node scripts/deploy-clean.cjs
fi

echo "[replit] writing and verifying build metadata"
node scripts/replit-build-meta.mjs write
node scripts/replit-build-meta.mjs verify

echo "[replit] smoke-testing compiled production artifact"
REPLIT_PRODUCTION_SMOKE_OUT=dist/parity/production-smoke node scripts/replit-production-smoke.mjs
node scripts/replit-build-meta.mjs verify

if [ "${REPLIT_PRUNE_DEV_DEPENDENCIES:-0}" = "1" ]; then
  echo "[replit] pruning dev dependencies"
  npm prune --omit=dev
else
  echo "[replit] leaving dev dependencies installed"
fi

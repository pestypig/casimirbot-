#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

export PORT="${PORT:-5000}"
export HOST="${HOST:-0.0.0.0}"
export FAST_BOOT="${FAST_BOOT:-0}"
export ENABLE_AGI="${ENABLE_AGI:-1}"
export ENABLE_ESSENCE="${ENABLE_ESSENCE:-1}"
export HELIX_ASK_GOLDEN_PATH_RUNTIME="${HELIX_ASK_GOLDEN_PATH_RUNTIME:-1}"

echo "[replit] dev preview root: $(pwd)"
echo "[replit] dev preview: PORT=${PORT} HOST=${HOST} FAST_BOOT=${FAST_BOOT} ENABLE_AGI=${ENABLE_AGI} ENABLE_ESSENCE=${ENABLE_ESSENCE}"
echo "[replit] dev preview: DATABASE_URL=$([ -n "${DATABASE_URL:-}" ] && echo set || echo missing) OPENAI_API_KEY=$([ -n "${OPENAI_API_KEY:-}" ] && echo set || echo missing) LLM_HTTP_API_KEY=$([ -n "${LLM_HTTP_API_KEY:-}" ] && echo set || echo missing) CODEX_BIN=$([ -n "${CODEX_BIN:-}" ] && echo set || echo missing)"
echo "[replit] dev preview: using npm run dev; do not prune dev dependencies for Vite middleware"

source scripts/replit-codex-auth.sh

exec npm run dev

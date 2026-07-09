#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

export PORT="${PORT:-5000}"
export HOST="${HOST:-0.0.0.0}"
export FAST_BOOT="${FAST_BOOT:-0}"
export ENABLE_AGI="${ENABLE_AGI:-1}"
export ENABLE_ESSENCE="${ENABLE_ESSENCE:-1}"
export HELIX_ASK_GOLDEN_PATH_RUNTIME="${HELIX_ASK_GOLDEN_PATH_RUNTIME:-1}"

if [ "${REPLIT_USE_CODEX_WRAPPER:-1}" = "1" ]; then
  export CODEX_BIN="$PWD/scripts/replit-codex-wrapper.sh"
fi

echo "[replit] dev preview root: $(pwd)"
echo "[replit] dev preview: PORT=${PORT} HOST=${HOST} FAST_BOOT=${FAST_BOOT} ENABLE_AGI=${ENABLE_AGI} ENABLE_ESSENCE=${ENABLE_ESSENCE}"
echo "[replit] dev preview: DATABASE_URL=$([ -n "${DATABASE_URL:-}" ] && echo set || echo missing) OPENAI_API_KEY=$([ -n "${OPENAI_API_KEY:-}" ] && echo set || echo missing) LLM_HTTP_API_KEY=$([ -n "${LLM_HTTP_API_KEY:-}" ] && echo set || echo missing) CODEX_BIN=$([ -n "${CODEX_BIN:-}" ] && echo set || echo missing)"
echo "[replit] dev preview: using npm run dev; do not prune dev dependencies for Vite middleware"

if [ -x "${CODEX_BIN:-}" ] && [ -n "${LLM_HTTP_API_KEY:-}" ]; then
  echo "[replit] codex: refreshing CLI auth from LLM_HTTP_API_KEY"
  if printenv LLM_HTTP_API_KEY | "$CODEX_BIN" login --with-api-key >/tmp/replit-codex-login.log 2>&1; then
    echo "[replit] codex: CLI auth ready"
  else
    echo "[replit] codex: CLI auth refresh failed; see /tmp/replit-codex-login.log"
  fi
else
  echo "[replit] codex: skipping CLI auth refresh (CODEX_BIN executable or LLM_HTTP_API_KEY missing)"
fi

exec npm run dev

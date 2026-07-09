#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [ "${REPLIT_USE_CODEX_WRAPPER:-1}" = "1" ]; then
  export CODEX_BIN="$PWD/scripts/replit-codex-wrapper.sh"
fi

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

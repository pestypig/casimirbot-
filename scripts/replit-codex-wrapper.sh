#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

native_codex_bin="${REPLIT_NATIVE_CODEX_BIN:-$PWD/node_modules/@openai/codex-linux-x64/vendor/x86_64-unknown-linux-musl/bin/codex}"

if [ ! -x "$native_codex_bin" ]; then
  echo "[replit-codex] native Codex binary is missing or not executable: $native_codex_bin" >&2
  exit 127
fi

if [ -n "${LLM_HTTP_BASE:-}" ]; then
  export OPENAI_BASE_URL="$LLM_HTTP_BASE"
fi

if [ -n "${LLM_HTTP_API_KEY:-}" ]; then
  export OPENAI_API_KEY="$LLM_HTTP_API_KEY"
fi

exec "$native_codex_bin" "$@"

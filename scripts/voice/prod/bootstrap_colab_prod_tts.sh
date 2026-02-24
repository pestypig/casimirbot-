#!/usr/bin/env bash
set -euo pipefail
trap 'echo "[prod-bootstrap][error] line ${LINENO}: ${BASH_COMMAND}" >&2' ERR

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "${ROOT_DIR}"

PYTHON_BIN="${PYTHON_BIN:-python}"

echo "[prod-bootstrap] root=${ROOT_DIR}"
echo "[prod-bootstrap] python=$(${PYTHON_BIN} -V 2>&1)"

if [[ "${PROD_TTS_DRY_RUN:-0}" == "1" ]]; then
  echo "[prod-bootstrap] dry_run=1 skipping heavy dependency installs"
  exit 0
fi

"${PYTHON_BIN}" -m pip install -U pip setuptools wheel
"${PYTHON_BIN}" -m pip install "nemo_toolkit[all]" librosa soundfile

#!/usr/bin/env bash
set -euo pipefail
trap 'echo "[prod-bootstrap][error] line ${LINENO}: ${BASH_COMMAND}" >&2' ERR

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "${ROOT_DIR}"

PYTHON_BIN="${PYTHON_BIN:-python}"
PIP_CORE_SPECS="${PROD_TTS_PIP_CORE_SPECS:-pip==25.0.1 setuptools==75.8.0 wheel==0.45.1}"
PIP_TTS_SPECS="${PROD_TTS_PIP_TTS_SPECS:-nemo_toolkit[all]==2.6.1 librosa==0.10.2.post1 soundfile==0.12.1}"

echo "[prod-bootstrap] root=${ROOT_DIR}"
echo "[prod-bootstrap] python=$(${PYTHON_BIN} -V 2>&1)"
echo "[prod-bootstrap] pip_core_specs=${PIP_CORE_SPECS}"
echo "[prod-bootstrap] pip_tts_specs=${PIP_TTS_SPECS}"

if [[ "${PROD_TTS_DRY_RUN:-0}" == "1" ]]; then
  echo "[prod-bootstrap] dry_run=1 skipping heavy dependency installs"
  exit 0
fi

read -r -a CORE_SPEC_ARR <<< "${PIP_CORE_SPECS}"
read -r -a TTS_SPEC_ARR <<< "${PIP_TTS_SPECS}"

"${PYTHON_BIN}" -m pip install "${CORE_SPEC_ARR[@]}"
"${PYTHON_BIN}" -m pip install "${TTS_SPEC_ARR[@]}"

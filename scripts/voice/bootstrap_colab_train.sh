#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "${ROOT_DIR}"

PYTHON_BIN="${PYTHON_BIN:-python}"
AUDIO_PATH="${AUDIO_PATH:-data/knowledge_audio_source/auntie_dottie.flac}"
REQ_FILE="${REQ_FILE:-external/audiocraft/requirements.train-py312.txt}"
RUN_PREPARE="${RUN_PREPARE:-1}"
RUN_TRAIN="${RUN_TRAIN:-1}"

echo "[bootstrap] root=${ROOT_DIR}"
echo "[bootstrap] python=$(${PYTHON_BIN} -V 2>&1)"

if [[ ! -f "${AUDIO_PATH}" ]]; then
  echo "[bootstrap] missing audio: ${AUDIO_PATH}" >&2
  exit 1
fi

${PYTHON_BIN} - <<PY
from pathlib import Path
audio = Path("${AUDIO_PATH}")
head = audio.read_bytes()[:200]
size = audio.stat().st_size
print(f"[bootstrap] audio_size_bytes={size}")
if size <= 5_000_000:
    raise SystemExit("[bootstrap] audio file is too small; expected >5MB")
if b"git-lfs.github.com/spec/v1" in head:
    raise SystemExit("[bootstrap] audio path points to a git-lfs pointer, not real audio")
PY

${PYTHON_BIN} -m pip install -U pip setuptools wheel
${PYTHON_BIN} -m pip uninstall -y audiocraft || true
${PYTHON_BIN} -m pip install -r "${REQ_FILE}"
${PYTHON_BIN} -m pip install -e external/audiocraft --no-deps

export PYTHONPATH="${ROOT_DIR}/external/audiocraft:${PYTHONPATH:-}"
export EFFICIENT_ATTENTION_BACKEND="${EFFICIENT_ATTENTION_BACKEND:-torch}"
export TRAIN_JOB_TYPE="${TRAIN_JOB_TYPE:-tts_voice_train}"
export KNOWLEDGE_AUDIO_DIR="${KNOWLEDGE_AUDIO_DIR:-external/audiocraft/data/knowledge_audio}"
export TRAIN_STATUS_PATH="${TRAIN_STATUS_PATH:-external/audiocraft/checkpoints/train_status.json}"

${PYTHON_BIN} - <<'PY'
import audiocraft
from audiocraft.modules.transformer import set_efficient_attention_backend
print(f"[bootstrap] audiocraft_module={audiocraft.__file__}")
set_efficient_attention_backend("torch")
print("[bootstrap] attention_backend=torch")
PY

if [[ "${RUN_PREPARE}" == "1" ]]; then
  ${PYTHON_BIN} external/audiocraft/scripts/prepare_knowledge_audio.py --mode voice_dataset
fi

if [[ "${RUN_TRAIN}" == "1" ]]; then
  ${PYTHON_BIN} external/audiocraft/scripts/train_spectral_adapter.py
fi

echo "[bootstrap] completed"

#!/usr/bin/env bash
set -euo pipefail
trap 'echo "[bootstrap][error] line ${LINENO}: ${BASH_COMMAND}" >&2' ERR

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "${ROOT_DIR}"

PYTHON_BIN="${PYTHON_BIN:-python}"
AUDIO_PATH="${AUDIO_PATH:-data/knowledge_audio_source/auntie_dottie.flac}"
SOURCE_DIR="${SOURCE_DIR:-$(dirname "${AUDIO_PATH}")}"
REQ_FILE="${REQ_FILE:-external/audiocraft/requirements.train-py312.txt}"
INSTALL_AUDIOCRAFT_EDITABLE="${INSTALL_AUDIOCRAFT_EDITABLE:-auto}"
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

if [[ "${INSTALL_AUDIOCRAFT_EDITABLE}" == "1" ]]; then
  ${PYTHON_BIN} -m pip install -e external/audiocraft --no-deps --no-build-isolation
elif [[ "${INSTALL_AUDIOCRAFT_EDITABLE}" == "auto" ]]; then
  if ! ${PYTHON_BIN} -m pip install -e external/audiocraft --no-deps --no-build-isolation; then
    echo "[bootstrap] editable install failed; using PYTHONPATH source import fallback"
  fi
else
  echo "[bootstrap] skipping editable install (INSTALL_AUDIOCRAFT_EDITABLE=${INSTALL_AUDIOCRAFT_EDITABLE})"
fi

export PYTHONPATH="${ROOT_DIR}/external/audiocraft:${PYTHONPATH:-}"
export EFFICIENT_ATTENTION_BACKEND="${EFFICIENT_ATTENTION_BACKEND:-torch}"
export TRAIN_JOB_TYPE="${TRAIN_JOB_TYPE:-tts_voice_train}"
export KNOWLEDGE_AUDIO_DIR="${KNOWLEDGE_AUDIO_DIR:-external/audiocraft/data/knowledge_audio}"
export KNOWLEDGE_SOURCE_DIR="${KNOWLEDGE_SOURCE_DIR:-${SOURCE_DIR}}"
export TRAIN_STATUS_PATH="${TRAIN_STATUS_PATH:-external/audiocraft/checkpoints/train_status.json}"

${PYTHON_BIN} - <<'PY'
import audiocraft
from audiocraft.modules.transformer import set_efficient_attention_backend
print(f"[bootstrap] audiocraft_module={audiocraft.__file__}")
set_efficient_attention_backend("torch")
print("[bootstrap] attention_backend=torch")
PY

if [[ "${RUN_PREPARE}" == "1" ]]; then
  ${PYTHON_BIN} external/audiocraft/scripts/prepare_knowledge_audio.py \
    --mode voice_dataset \
    --source-dir "${KNOWLEDGE_SOURCE_DIR}" \
    --out-dir "${KNOWLEDGE_AUDIO_DIR}"
fi

${PYTHON_BIN} - <<PY
from pathlib import Path
import json

out_dir = Path("${KNOWLEDGE_AUDIO_DIR}")
manifest = out_dir / "voice_dataset_manifest.json"
audio_exts = {".wav", ".mp3", ".flac", ".ogg"}
audio_files = [p for p in out_dir.rglob("*") if p.is_file() and p.suffix.lower() in audio_exts]

print(f"[bootstrap] knowledge_source_dir={Path('${KNOWLEDGE_SOURCE_DIR}').resolve()}")
print(f"[bootstrap] knowledge_audio_dir={out_dir.resolve()}")
print(f"[bootstrap] prepared_audio_files={len(audio_files)}")

if not audio_files:
    raise SystemExit("[bootstrap] prepared dataset has no audio files; aborting before train")

if not manifest.exists():
    raise SystemExit("[bootstrap] missing voice_dataset_manifest.json after prepare")

try:
    payload = json.loads(manifest.read_text(encoding="utf-8"))
except Exception as exc:
    raise SystemExit(f"[bootstrap] manifest parse failed: {exc}")

entry_count = len(payload.get("entries", [])) if isinstance(payload, dict) else 0
print(f"[bootstrap] manifest_entry_count={entry_count}")
if entry_count <= 0:
    raise SystemExit("[bootstrap] manifest has zero entries; aborting before train")
PY

if [[ "${RUN_TRAIN}" == "1" ]]; then
  ${PYTHON_BIN} external/audiocraft/scripts/train_spectral_adapter.py
fi

echo "[bootstrap] completed"

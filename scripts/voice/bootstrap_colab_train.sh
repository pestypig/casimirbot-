#!/usr/bin/env bash
set -euo pipefail
trap 'echo "[bootstrap][error] line ${LINENO}: ${BASH_COMMAND}" >&2' ERR

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "${ROOT_DIR}"

PYTHON_BIN="${PYTHON_BIN:-python}"
AUDIO_PATH="${AUDIO_PATH:-data/knowledge_audio_source/auntie_dottie.flac}"
SOURCE_DIR="${SOURCE_DIR:-$(dirname "${AUDIO_PATH}")}"
REQ_FILE="${REQ_FILE:-external/audiocraft/requirements.train-py312.txt}"
PIP_BOOTSTRAP_URL="${PIP_BOOTSTRAP_URL:-https://bootstrap.pypa.io/get-pip.py}"
INSTALL_AUDIOCRAFT_EDITABLE="${INSTALL_AUDIOCRAFT_EDITABLE:-auto}"
RUN_PREPARE="${RUN_PREPARE:-1}"
RUN_TRAIN="${RUN_TRAIN:-1}"
RESET_TRAIN_OUTPUTS="${RESET_TRAIN_OUTPUTS:-1}"

echo "[bootstrap] root=${ROOT_DIR}"
echo "[bootstrap] python=$(${PYTHON_BIN} -V 2>&1)"

ensure_python_pip() {
  if "${PYTHON_BIN}" -m pip --version >/dev/null 2>&1; then
    return 0
  fi

  echo "[bootstrap] pip module missing for ${PYTHON_BIN}; attempting ensurepip"
  if "${PYTHON_BIN}" -m ensurepip --upgrade >/dev/null 2>&1; then
    if "${PYTHON_BIN}" -m pip --version >/dev/null 2>&1; then
      return 0
    fi
  fi

  echo "[bootstrap] ensurepip unavailable; bootstrapping pip from ${PIP_BOOTSTRAP_URL}"
  mkdir -p artifacts
  local get_pip_script="artifacts/get-pip.py"
  if command -v curl >/dev/null 2>&1; then
    curl -fsSL "${PIP_BOOTSTRAP_URL}" -o "${get_pip_script}"
  elif command -v wget >/dev/null 2>&1; then
    wget -qO "${get_pip_script}" "${PIP_BOOTSTRAP_URL}"
  else
    echo "[bootstrap] missing curl/wget; cannot bootstrap pip" >&2
    return 1
  fi

  "${PYTHON_BIN}" "${get_pip_script}"
  "${PYTHON_BIN}" -m pip --version >/dev/null 2>&1
}

pip_run() {
  echo "[bootstrap] pip $*"
  "${PYTHON_BIN}" -m pip "$@"
}

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

ensure_python_pip
pip_run install -U pip setuptools wheel
pip_run uninstall -y audiocraft || true
pip_run install -r "${REQ_FILE}"

if [[ "${INSTALL_AUDIOCRAFT_EDITABLE}" == "1" ]]; then
  pip_run install -e external/audiocraft --no-deps --no-build-isolation
elif [[ "${INSTALL_AUDIOCRAFT_EDITABLE}" == "auto" ]]; then
  if ! pip_run install -e external/audiocraft --no-deps --no-build-isolation; then
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
export TRANSFORMERS_NO_TF="${TRANSFORMERS_NO_TF:-1}"
export USE_TF="${USE_TF:-0}"

mkdir -p "$(dirname "${TRAIN_STATUS_PATH}")"

if [[ "${TRAIN_JOB_TYPE}" == "tts_voice_train" ]]; then
  EXPECTED_CKPT="checkpoints/tts_voice_train_musicgen_small.pt"
else
  EXPECTED_CKPT="checkpoints/spectral_adapters_musicgen_small.pt"
fi

if [[ "${RESET_TRAIN_OUTPUTS}" == "1" ]]; then
  rm -f "${TRAIN_STATUS_PATH}" "${EXPECTED_CKPT}"
fi

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

if [[ "${RUN_TRAIN}" == "1" ]]; then
  ${PYTHON_BIN} - <<PY
from pathlib import Path
import json

status_path = Path("${TRAIN_STATUS_PATH}")
ckpt_path = Path("${EXPECTED_CKPT}")

if not status_path.exists():
    raise SystemExit(f"[bootstrap] missing training status file after train: {status_path}")

try:
    payload = json.loads(status_path.read_text(encoding="utf-8"))
except Exception as exc:
    raise SystemExit(f"[bootstrap] training status parse failed: {exc}")

status = payload.get("status") if isinstance(payload, dict) else None
print(f"[bootstrap] training_status={status}")
if status != "completed":
    raise SystemExit(f"[bootstrap] training did not complete cleanly: {payload}")

if not ckpt_path.exists():
    raise SystemExit(f"[bootstrap] missing expected checkpoint after train: {ckpt_path}")

print(f"[bootstrap] checkpoint_path={ckpt_path}")
print(f"[bootstrap] checkpoint_size_bytes={ckpt_path.stat().st_size}")
PY
fi

echo "[bootstrap] completed"

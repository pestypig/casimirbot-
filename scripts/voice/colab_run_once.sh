#!/usr/bin/env bash
set -euo pipefail
trap 'echo "[colab-run][error] line ${LINENO}: ${BASH_COMMAND}" >&2' ERR

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "${ROOT_DIR}"

SYNC_MAIN="${SYNC_MAIN:-1}"
EXPECTED_HEAD="${EXPECTED_HEAD:-}"

if [[ "${SYNC_MAIN}" == "1" ]]; then
  git fetch origin main
  git checkout -B main origin/main
  git reset --hard origin/main
fi

HEAD_SHA="$(git rev-parse --short HEAD)"
echo "[colab-run] head=${HEAD_SHA}"
if [[ -n "${EXPECTED_HEAD}" && "${HEAD_SHA}" != "${EXPECTED_HEAD}" ]]; then
  echo "[colab-run] unexpected head: got=${HEAD_SHA} expected=${EXPECTED_HEAD}" >&2
  exit 1
fi

python - <<'PY'
from pathlib import Path
s = Path("scripts/voice/run_colab_train.py").read_text(encoding="utf-8")
b = Path("scripts/voice/bootstrap_colab_train.sh").read_text(encoding="utf-8")
assert "AUX_ARTIFACTS_DIR" in s
assert 'shutil.which("nvidia-smi")' in s
assert "INSTALL_AUDIOCRAFT_EDITABLE" in s
assert "ensure_python_pip" in b
assert "PIP_BOOTSTRAP_URL" in b
print("[colab-run] script-markers=ok")
PY

export CLEAR_PREVIOUS_ARTIFACTS="${CLEAR_PREVIOUS_ARTIFACTS:-1}"
export RESET_TRAIN_OUTPUTS="${RESET_TRAIN_OUTPUTS:-1}"
export INSTALL_AUDIOCRAFT_EDITABLE="${INSTALL_AUDIOCRAFT_EDITABLE:-0}"
export AUDIO_PATH="${AUDIO_PATH:-data/knowledge_audio_source/auntie_dottie.flac}"
export SOURCE_DIR="${SOURCE_DIR:-data/knowledge_audio_source}"
export KNOWLEDGE_SOURCE_DIR="${KNOWLEDGE_SOURCE_DIR:-data/knowledge_audio_source}"
export KNOWLEDGE_AUDIO_DIR="${KNOWLEDGE_AUDIO_DIR:-external/audiocraft/data/knowledge_audio}"
export EFFICIENT_ATTENTION_BACKEND="${EFFICIENT_ATTENTION_BACKEND:-torch}"

if ! python scripts/voice/run_colab_train.py; then
  echo "[colab-run] run_colab_train.py failed; printing bootstrap log tails"
  python - <<'PY'
from pathlib import Path

def tail(path: Path, n: int = 120) -> None:
    if not path.exists():
        print(f"[missing] {path}")
        return
    lines = path.read_text(encoding="utf-8", errors="replace").splitlines()
    print(f"--- tail {path} ({min(n, len(lines))} lines) ---")
    print("\n".join(lines[-n:]))

tail(Path("artifacts/colab_bootstrap_stdout.log"))
tail(Path("artifacts/colab_bootstrap_stderr.log"))
PY
  exit 1
fi


# Production-lane helper handoff (additive, non-breaking)
if [[ "${RUN_PRODUCTION_LANE:-0}" == "1" ]]; then
  TRAIN_BACKEND="${TRAIN_BACKEND:-local_docker}" AUDIO_PATH="${AUDIO_PATH}" EXPECTED_HEAD="${EXPECTED_HEAD}" \
    bash scripts/voice/train_production_voice.sh
fi

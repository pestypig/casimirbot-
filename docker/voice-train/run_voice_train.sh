#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="${REPO_ROOT:-/workspace/casimirbot-}"
VOICE_SOURCE_AUDIO="${VOICE_SOURCE_AUDIO:-${REPO_ROOT}/data/knowledge_audio_source/auntie_dottie.flac}"
VOICE_SOURCE_DIR="${VOICE_SOURCE_DIR:-$(dirname "${VOICE_SOURCE_AUDIO}")}"
KNOWLEDGE_AUDIO_DIR="${KNOWLEDGE_AUDIO_DIR:-${REPO_ROOT}/external/audiocraft/data/knowledge_audio}"
MANIFEST_PATH="${MANIFEST_PATH:-${KNOWLEDGE_AUDIO_DIR}/voice_dataset_manifest.json}"
TRAIN_STATUS_PATH="${TRAIN_STATUS_PATH:-${REPO_ROOT}/external/audiocraft/checkpoints/train_status.json}"
CHECKPOINT_PATH="${CHECKPOINT_PATH:-${REPO_ROOT}/checkpoints/tts_voice_train_musicgen_small.pt}"
LOG_PATH="${LOG_PATH:-${REPO_ROOT}/artifacts/docker_voice_train.log}"
VERTEX_GCS_OUTPUT_URI="${VERTEX_GCS_OUTPUT_URI:-}"

mkdir -p "$(dirname "${LOG_PATH}")" \
  "$(dirname "${TRAIN_STATUS_PATH}")" \
  "${KNOWLEDGE_AUDIO_DIR}" \
  "$(dirname "${CHECKPOINT_PATH}")"
touch "${LOG_PATH}"

FAILED_STEP=""
FAILED_CODE=0

run_step() {
  local step="$1"
  shift
  if [[ -n "${FAILED_STEP}" ]]; then
    return 0
  fi

  echo ">>> ${step}" >> "${LOG_PATH}"
  "$@" >> "${LOG_PATH}" 2>&1
  local rc=$?
  if [[ ${rc} -ne 0 ]]; then
    FAILED_STEP="${step}"
    FAILED_CODE=${rc}
    echo "!!! FAILED ${step} (${rc})" >> "${LOG_PATH}"
  fi
  return 0
}

run_step "check_source_exists" test -f "${VOICE_SOURCE_AUDIO}"
run_step "check_source_size" bash -lc "[ \"\$(wc -c < \"${VOICE_SOURCE_AUDIO}\")\" -gt 5000000 ]"
run_step "check_not_lfs_pointer" bash -lc "! grep -q \"git-lfs.github.com/spec/v1\" \"${VOICE_SOURCE_AUDIO}\""

run_step "reset_outputs" bash -lc "rm -f \"${MANIFEST_PATH}\" \"${TRAIN_STATUS_PATH}\" \"${CHECKPOINT_PATH}\""
run_step "prepare_dataset" python "${REPO_ROOT}/external/audiocraft/scripts/prepare_knowledge_audio.py" \
  --mode voice_dataset \
  --source-dir "${VOICE_SOURCE_DIR}" \
  --out-dir "${KNOWLEDGE_AUDIO_DIR}"

if [[ -z "${FAILED_STEP}" ]]; then
  run_step "train_tts_voice" env \
    TRAIN_STATUS_PATH="${TRAIN_STATUS_PATH}" \
    KNOWLEDGE_AUDIO_DIR="${KNOWLEDGE_AUDIO_DIR}" \
    TRAIN_JOB_TYPE="tts_voice_train" \
    python "${REPO_ROOT}/external/audiocraft/scripts/train_spectral_adapter.py"
fi

if [[ -z "${FAILED_STEP}" && -n "${VERTEX_GCS_OUTPUT_URI}" ]]; then
  run_step "upload_vertex_artifacts" python - <<PY
import os
from pathlib import Path

from google.cloud import storage

uri = ${VERTEX_GCS_OUTPUT_URI@Q}
if not uri.startswith("gs://"):
    raise SystemExit(f"VERTEX_GCS_OUTPUT_URI must start with gs://, got {uri}")
bucket_and_prefix = uri[len("gs://"):]
bucket_name, _, prefix = bucket_and_prefix.partition("/")
prefix = prefix.strip("/")

client = storage.Client()
bucket = client.bucket(bucket_name)

files = [
    Path(${MANIFEST_PATH@Q}),
    Path(${TRAIN_STATUS_PATH@Q}),
    Path(${CHECKPOINT_PATH@Q}),
    Path(${LOG_PATH@Q}),
]
uploaded = []
for path in files:
    if not path.exists():
        continue
    target = f"{prefix}/{path.name}" if prefix else path.name
    blob = bucket.blob(target)
    blob.upload_from_filename(str(path))
    uploaded.append(f"gs://{bucket_name}/{target}")

print("Uploaded:", *uploaded, sep="\\n- ")
PY
fi

python - <<PY
import hashlib
import json
from pathlib import Path

flac = Path(${VOICE_SOURCE_AUDIO@Q})
manifest = Path(${MANIFEST_PATH@Q})
status = Path(${TRAIN_STATUS_PATH@Q})
ckpt = Path(${CHECKPOINT_PATH@Q})
log = Path(${LOG_PATH@Q})
failed_step = ${FAILED_STEP@Q}
failed_code = int(${FAILED_CODE@Q})

def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()

entry_count = None
if manifest.exists():
    try:
        entry_count = len(json.loads(manifest.read_text(encoding="utf-8")).get("entries", []))
    except Exception:
        entry_count = "parse_error"

status_json = {}
if status.exists():
    try:
        status_json = json.loads(status.read_text(encoding="utf-8"))
    except Exception:
        status_json = {"status": "parse_error"}

objective = "success" if (
    failed_step == ""
    and manifest.exists()
    and ckpt.exists()
    and status_json.get("status") == "completed"
) else "blocked"

print("=== DOCKER TRAIN REPORT ===")
print("objective_status:", objective)
print("first_failed_step:", failed_step or "none")
print("failed_code:", failed_code)
print("audio_path:", flac)
print("audio_exists:", flac.exists())
print("audio_size_bytes:", flac.stat().st_size if flac.exists() else "N/A")
print("manifest_path:", manifest)
print("manifest_exists:", manifest.exists())
print("manifest_entry_count:", entry_count)
print("training_status_path:", status)
print("training_status_json:", json.dumps(status_json, ensure_ascii=False))
print("checkpoint_path:", ckpt)
print("checkpoint_exists:", ckpt.exists())
print("checkpoint_size_bytes:", ckpt.stat().st_size if ckpt.exists() else "N/A")
print("checkpoint_sha256:", sha256(ckpt) if ckpt.exists() else "N/A")
print("vertex_gcs_output_uri:", ${VERTEX_GCS_OUTPUT_URI@Q} if ${VERTEX_GCS_OUTPUT_URI@Q} else "none")
if log.exists():
    lines = log.read_text(encoding="utf-8", errors="replace").splitlines()
    print("log_tail_begin")
    for line in lines[-120:]:
        print(line)
    print("log_tail_end")
PY

if [[ -n "${FAILED_STEP}" ]]; then
  exit 1
fi

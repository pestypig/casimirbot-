#!/usr/bin/env bash
set -euo pipefail
trap 'echo "[colab-prod-tts][error] line ${LINENO}: ${BASH_COMMAND}" >&2' ERR

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "${ROOT_DIR}"

HEAD_SHA="$(git rev-parse --short=8 HEAD)"
echo "HEAD=${HEAD_SHA}"

export PROD_TTS_COMMIT="${HEAD_SHA}"
export PROD_TTS_STATUS_PATH="${PROD_TTS_STATUS_PATH:-artifacts/prod_tts_train_status.json}"
export PROD_TTS_EVAL_PATH="${PROD_TTS_EVAL_PATH:-artifacts/prod_tts_eval.json}"
export PROD_TTS_BUNDLE_DIR="${PROD_TTS_BUNDLE_DIR:-checkpoints/prod_tts_voice_bundle}"

# Prevent stale status/reporting from prior runs from masking current-step failures.
rm -f "${PROD_TTS_STATUS_PATH}" "${PROD_TTS_EVAL_PATH}" "${PROD_TTS_BUNDLE_DIR}/manifest.json"

PIPELINE_RC=0
FAILED_STEP="none"

run_step() {
  local step_name="$1"
  shift
  if [[ "${PIPELINE_RC}" -ne 0 ]]; then
    return 0
  fi
  set +e
  "$@"
  local step_rc=$?
  set -e
  if [[ "${step_rc}" -ne 0 ]]; then
    PIPELINE_RC="${step_rc}"
    FAILED_STEP="${step_name}"
  fi
}

run_step bootstrap bash scripts/voice/prod/bootstrap_colab_prod_tts.sh
run_step train python scripts/voice/prod/train_nemo_tts.py
run_step eval python scripts/voice/prod/eval_nemo_tts.py
run_step bundle python scripts/voice/prod/build_voice_bundle.py

BUNDLE_MANIFEST="${PROD_TTS_BUNDLE_DIR}/manifest.json"
BUNDLE_HASH="missing"
if [[ -f "${BUNDLE_MANIFEST}" ]]; then
  BUNDLE_HASH="$(sha256sum "${BUNDLE_MANIFEST}" | awk '{print $1}')"
fi
export PIPELINE_RC FAILED_STEP

echo "=== PROD TTS TRAIN REPORT ==="
python - <<'PY'
import json
import os
from pathlib import Path

status_path = Path(os.environ.get("PROD_TTS_STATUS_PATH", "artifacts/prod_tts_train_status.json"))
bundle_dir = Path(os.environ.get("PROD_TTS_BUNDLE_DIR", "checkpoints/prod_tts_voice_bundle"))
bundle_manifest = bundle_dir / "manifest.json"

if status_path.exists():
    status = json.loads(status_path.read_text(encoding="utf-8"))
else:
    status = {
        "objective_status": "blocked",
        "root_cause": "missing_status_json",
        "gpu_available": False,
    }

print(f"objective_status={status.get('objective_status', 'unknown')}")
print(f"root_cause={status.get('root_cause', 'unknown')}")
print(f"gpu_available={str(status.get('gpu_available', False)).lower()}")
print(f"status_json={status_path}")
print("status_json_content=" + json.dumps(status, sort_keys=True, separators=(",", ":")))
print(f"bundle_path={bundle_dir}")
print(f"pipeline_rc={os.environ.get('PIPELINE_RC', '0')}")
print(f"failed_step={os.environ.get('FAILED_STEP', 'none')}")
if bundle_manifest.exists():
    import hashlib
    digest = hashlib.sha256(bundle_manifest.read_bytes()).hexdigest()
    print(f"bundle_hash={digest}")
    if os.environ.get("PIPELINE_RC", "0") == "0":
        print("next_unblock_action=ready_for_review")
    else:
        print("next_unblock_action=inspect_failed_step_and_status_json")
else:
    print("bundle_hash=missing")
    print("next_unblock_action=ensure_bundle_manifest_generated")
PY

exit "${PIPELINE_RC}"

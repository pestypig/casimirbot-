#!/usr/bin/env bash
set -euo pipefail
trap 'echo "[colab-prod-tts][error] line ${LINENO}: ${BASH_COMMAND}" >&2' ERR

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "${ROOT_DIR}"

HEAD_SHA="$(git rev-parse --short=8 HEAD)"
echo "HEAD=${HEAD_SHA}"

export PROD_TTS_COMMIT="${HEAD_SHA}"
export PROD_TTS_STATUS_PATH="${PROD_TTS_STATUS_PATH:-artifacts/prod_tts_train_status.json}"
export PROD_TTS_BUNDLE_DIR="${PROD_TTS_BUNDLE_DIR:-checkpoints/prod_tts_voice_bundle}"

bash scripts/voice/prod/bootstrap_colab_prod_tts.sh
python scripts/voice/prod/train_nemo_tts.py
python scripts/voice/prod/eval_nemo_tts.py || true
python scripts/voice/prod/build_voice_bundle.py

BUNDLE_MANIFEST="${PROD_TTS_BUNDLE_DIR}/manifest.json"
BUNDLE_HASH="missing"
if [[ -f "${BUNDLE_MANIFEST}" ]]; then
  BUNDLE_HASH="$(sha256sum "${BUNDLE_MANIFEST}" | awk '{print $1}')"
fi

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
if bundle_manifest.exists():
    import hashlib
    digest = hashlib.sha256(bundle_manifest.read_bytes()).hexdigest()
    print(f"bundle_hash={digest}")
    print("next_unblock_action=ready_for_review")
else:
    print("bundle_hash=missing")
    print("next_unblock_action=ensure_bundle_manifest_generated")
PY

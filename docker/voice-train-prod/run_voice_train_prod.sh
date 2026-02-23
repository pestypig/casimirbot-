#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="${REPO_ROOT:-/workspace/casimirbot-}"
LOG_PATH="${LOG_PATH:-${REPO_ROOT}/artifacts/voice_train_prod.log}"
TRAIN_STATUS_PATH="${TRAIN_STATUS_PATH:-${REPO_ROOT}/artifacts/train_status.tts_prod_train.json}"
mkdir -p "$(dirname "${LOG_PATH}")" "$(dirname "${TRAIN_STATUS_PATH}")" "${REPO_ROOT}/checkpoints" "${REPO_ROOT}/bundles"

if python "${REPO_ROOT}/scripts/voice/train_production_tts.py" >>"${LOG_PATH}" 2>&1; then
  outcome="success"
  code=0
else
  outcome="failed"
  code=$?
fi

echo "=== DOCKER PROD TRAIN REPORT ==="
echo "outcome=${outcome}"
echo "exit_code=${code}"
echo "train_status_path=${TRAIN_STATUS_PATH}"
echo "log_path=${LOG_PATH}"
if [[ -f "${TRAIN_STATUS_PATH}" ]]; then
  echo "train_status_present=true"
else
  echo "train_status_present=false"
fi

tail -n 80 "${LOG_PATH}" || true
exit ${code}

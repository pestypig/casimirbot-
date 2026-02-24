#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "${ROOT_DIR}"

TRAIN_BACKEND="${TRAIN_BACKEND:-local_docker}"
EXPECTED_HEAD="${EXPECTED_HEAD:-}"
AUDIO_PATH="${AUDIO_PATH:-data/knowledge_audio_source/auntie_dottie.flac}"
TRAIN_LANE="${TRAIN_LANE:-tts_prod_train}"

head_sha="$(git rev-parse --short HEAD)"
echo "[tts-prod] head=${head_sha}"
if [[ -n "${EXPECTED_HEAD}" && "${head_sha}" != "${EXPECTED_HEAD}" ]]; then
  echo "[tts-prod][error] deterministic_head_mismatch got=${head_sha} expected=${EXPECTED_HEAD}" >&2
  exit 1
fi

if [[ ! -f "${AUDIO_PATH}" ]]; then
  echo "[tts-prod][error] missing_audio_path path=${AUDIO_PATH}" >&2
  exit 1
fi


if [[ "${TRAIN_LANE}" == "tts_prod_train_nemo" ]]; then
  TRAIN_STATUS_PATH="${TRAIN_STATUS_PATH:-artifacts/train_status.tts_prod_train_nemo.json}" \
  TRAIN_JOB_TYPE="tts_prod_train_nemo" \
  python scripts/voice/train_production_nemo.py
  exit $?
fi

if [[ "${TRAIN_BACKEND}" == "managed_job" ]]; then
  echo "[tts-prod] status=blocked reason=managed_job_not_implemented"
  exit 2
fi

if [[ "${TRAIN_BACKEND}" != "local_docker" ]]; then
  echo "[tts-prod][error] invalid_backend backend=${TRAIN_BACKEND}" >&2
  exit 1
fi

IMAGE_TAG="${IMAGE_TAG:-casimir-voice-train-prod:latest}"
DOCKERFILE="${DOCKERFILE:-docker/voice-train-prod/Dockerfile}"
LOG_PATH="${LOG_PATH:-artifacts/voice_train_prod.orchestrator.log}"
mkdir -p "$(dirname "${LOG_PATH}")"

docker build -f "${DOCKERFILE}" -t "${IMAGE_TAG}" . >"${LOG_PATH}" 2>&1 || {
  echo "[tts-prod][error] docker_build_failed" >&2
  tail -n 120 "${LOG_PATH}" || true
  exit 1
}

if ! docker run --rm \
  -v "${ROOT_DIR}:/workspace/casimirbot-" \
  -e AUDIO_PATH="/workspace/casimirbot-/${AUDIO_PATH}" \
  "${IMAGE_TAG}" >>"${LOG_PATH}" 2>&1; then
  echo "[tts-prod][error] docker_run_failed printing_log_tail" >&2
  tail -n 120 "${LOG_PATH}" || true
  exit 1
fi

echo "[tts-prod] status=done backend=${TRAIN_BACKEND}"

#!/usr/bin/env bash
set -euo pipefail

: "${GCP_PROJECT_ID:?GCP_PROJECT_ID is required}"
: "${GCP_REGION:?GCP_REGION is required}"
: "${GCP_ARTIFACT_REPOSITORY:?GCP_ARTIFACT_REPOSITORY is required}"

MACHINE_TYPE="${MACHINE_TYPE:-g2-standard-8}"
ACCELERATOR_TYPE="${ACCELERATOR_TYPE:-NVIDIA_TESLA_T4}"
ACCELERATOR_COUNT="${ACCELERATOR_COUNT:-1}"
IMAGE_TAG="${IMAGE_TAG:-${GITHUB_SHA:-manual}-$(date +%Y%m%d-%H%M%S)}"
DISPLAY_NAME="${DISPLAY_NAME:-auntie-dottie-voice-train-${IMAGE_TAG}}"
VERTEX_GCS_OUTPUT_URI="${VERTEX_GCS_OUTPUT_URI:-}"

GAR_HOST="${GCP_REGION}-docker.pkg.dev"
IMAGE_URI="${VOICE_TRAIN_IMAGE_URI:-${GAR_HOST}/${GCP_PROJECT_ID}/${GCP_ARTIFACT_REPOSITORY}/voice-train:${IMAGE_TAG}}"

mkdir -p artifacts

echo "[vertex] project=${GCP_PROJECT_ID}"
echo "[vertex] region=${GCP_REGION}"
echo "[vertex] image=${IMAGE_URI}"
echo "[vertex] display_name=${DISPLAY_NAME}"

gcloud config set project "${GCP_PROJECT_ID}"
gcloud auth configure-docker "${GAR_HOST}" --quiet

docker build -f docker/voice-train/Dockerfile.vertex -t "${IMAGE_URI}" .
docker push "${IMAGE_URI}"

worker_spec="machine-type=${MACHINE_TYPE},replica-count=1,container-image-uri=${IMAGE_URI},accelerator-type=${ACCELERATOR_TYPE},accelerator-count=${ACCELERATOR_COUNT}"
if [[ -n "${VERTEX_GCS_OUTPUT_URI}" ]]; then
  worker_spec="${worker_spec},env=VERTEX_GCS_OUTPUT_URI=${VERTEX_GCS_OUTPUT_URI}"
fi

create_cmd=(
  gcloud ai custom-jobs create
  --project "${GCP_PROJECT_ID}"
  --region "${GCP_REGION}"
  --display-name "${DISPLAY_NAME}"
  --worker-pool-spec "${worker_spec}"
  --format json
)

if [[ -n "${VERTEX_GCS_OUTPUT_URI}" ]]; then
  create_cmd+=(--base-output-dir "${VERTEX_GCS_OUTPUT_URI}")
fi

"${create_cmd[@]}" | tee artifacts/vertex-custom-job.json

JOB_NAME="$(python - <<'PY'
import json
from pathlib import Path

payload = json.loads(Path("artifacts/vertex-custom-job.json").read_text(encoding="utf-8"))
print(payload.get("name", "unknown"))
PY
)"

echo "[vertex] submitted custom job: ${JOB_NAME}"

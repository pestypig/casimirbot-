#!/usr/bin/env bash
set -Eeuo pipefail

ROOT=/home/pestypig/nhm2-h2-p8p-source-v1
EVIDENCE=/home/pestypig/nhm2-h2-p8p-evidence-v1
EXPORT=/home/pestypig/nhm2-h2-p8p-evidence-export-v1.tgz
IMAGE=nhm2-g2h-e-s5-c08-h2-p8p-turnaround-calibration:cloud-v1
CONTAINER=nhm2-h2-p8p-turnaround-calibration-20260901
EXECUTABLE=/usr/local/bin/mini-boson-star-primary-c08-h2-p8p-turnaround-calibration-v1
DOCKERFILE="$ROOT/tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/Dockerfile.primary.mini-boson-c08-h2-p8p-turnaround-calibration.v1"
BASE_ARCHIVE="$ROOT/artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p4-cloud-preflight-v1-20260827/h2-p4-upload-v1/h2-p4-pinned-base-images.tar"
EXPECTED_BASE_SHA=4645ef9f0028a4ae58601a73d8d7cf7cb8f2316578a318ce6ce2257b103624f1
EXPECTED_BINARY_SHA=7c96648911ea74e43199e6c87291e2dd32a73f5d21fee8e20454cc8962e31718
TIMEOUT_SECONDS=14400

emit() {
  printf '%s\n' "$1"
  if [[ -c /dev/ttyS0 && -w /dev/ttyS0 ]]; then
    printf '%s\n' "$1" >/dev/ttyS0 || true
  fi
}

capture_logs() {
  local path
  for path in /tmp/p8p-docker-load.txt /tmp/p8p-docker-build.txt; do
    if [[ -f "$path" && ! -L "$path" ]]; then
      cp "$path" "$EVIDENCE/$(basename "$path")"
    fi
  done
}

export_evidence() {
  capture_logs
  tar --sort=name --mtime='UTC 2026-09-01' --owner=0 --group=0 --numeric-owner \
    -czf "$EXPORT" -C /home/pestypig "$(basename "$EVIDENCE")"
  local export_bytes export_sha encoded
  export_bytes="$(stat -c %s "$EXPORT")"
  export_sha="$(sha256sum "$EXPORT" | awk '{print $1}')"
  emit "P8P_EVIDENCE bytes=$export_bytes sha256=$export_sha"
  emit 'P8P_EVIDENCE_BASE64_BEGIN'
  encoded="$(base64 -w0 "$EXPORT")"
  emit "$encoded"
  emit 'P8P_EVIDENCE_BASE64_END'
  sync
}

finish() {
  local phase="$1" exit_code="$2"
  emit "P8P_CONTROLLER_TERMINAL phase=$phase exit=$exit_code"
  if [[ -d "$EVIDENCE" && ! -L "$EVIDENCE" ]]; then
    printf '%s\n' "$phase" >"$EVIDENCE/terminal.phase.txt"
    printf '%s\n' "$exit_code" >"$EVIDENCE/controller.exit.txt"
    date -u +%FT%TZ >"$EVIDENCE/finish.utc.txt"
    export_evidence || true
  fi
  shutdown -h now || true
  exit "$exit_code"
}

[[ -d "$ROOT" && ! -L "$ROOT" ]] || exit 90
[[ ! -e "$EVIDENCE" && ! -e "$EXPORT" ]] || exit 91
mkdir "$EVIDENCE"
date -u +%FT%TZ >"$EVIDENCE/start.utc.txt"
printf 'preexecution\n' >"$EVIDENCE/phase.txt"
[[ -f "$BASE_ARCHIVE" && ! -L "$BASE_ARCHIVE" ]] || finish base_archive 92
[[ "$(sha256sum "$BASE_ARCHIVE" | awk '{print $1}')" == "$EXPECTED_BASE_SHA" ]] || finish base_archive_hash 93
[[ -f "$DOCKERFILE" && ! -L "$DOCKERFILE" ]] || finish dockerfile 94
docker container inspect "$CONTAINER" >/dev/null 2>&1 && finish container_not_absent 95
docker image inspect "$IMAGE" >/dev/null 2>&1 && finish image_not_absent 96

docker load -i "$BASE_ARCHIVE" >/tmp/p8p-docker-load.txt 2>&1 || finish base_image_load 97
docker build --network=none --pull=false -f "$DOCKERFILE" -t "$IMAGE" "$ROOT" \
  >/tmp/p8p-docker-build.txt 2>&1 || finish offline_build 98
BINARY_SHA="$(docker run --rm --network none --read-only --cap-drop ALL \
  --security-opt no-new-privileges --entrypoint sha256sum "$IMAGE" "$EXECUTABLE" | awk '{print $1}')"
[[ "$BINARY_SHA" == "$EXPECTED_BINARY_SHA" ]] || finish binary_hash 99

printf 'numerical_execution\n' >"$EVIDENCE/phase.txt"
printf '%s\n' "$EXPECTED_BINARY_SHA" >"$EVIDENCE/executable.sha256.txt"
printf '1024\n' >"$EVIDENCE/panel_count.txt"
printf '32\n' >"$EVIDENCE/thread_count.txt"
printf '%s\n' "$TIMEOUT_SECONDS" >"$EVIDENCE/timeout_seconds.txt"
docker image inspect "$IMAGE" >"$EVIDENCE/image.inspect.json"
docker create --name "$CONTAINER" --network none --read-only --cap-drop ALL \
  --security-opt no-new-privileges --pids-limit 1024 --cpus 32 --memory 24g \
  "$IMAGE" >"$EVIDENCE/container.id.txt" || finish container_create 100

set +e
timeout --signal=TERM --kill-after=30s "${TIMEOUT_SECONDS}s" \
  docker start -a "$CONTAINER" \
  > >(tee "$EVIDENCE/stdout.txt") \
  2> >(tee "$EVIDENCE/stderr.txt" >&2)
RUN_EXIT=$?
set -e
TIMED_OUT=false
if [[ "$RUN_EXIT" -eq 124 || "$RUN_EXIT" -eq 137 ]]; then
  TIMED_OUT=true
  docker stop --timeout 30 "$CONTAINER" >/dev/null 2>&1 || true
fi
printf '%s\n' "$RUN_EXIT" >"$EVIDENCE/numerical.exit.txt"
printf '%s\n' "$TIMED_OUT" >"$EVIDENCE/timed_out.txt"
docker inspect "$CONTAINER" >"$EVIDENCE/container.inspect.json"
if [[ "$RUN_EXIT" -eq 0 ]]; then
  finish complete 0
elif [[ "$TIMED_OUT" == true ]]; then
  finish timeout "$RUN_EXIT"
else
  finish numerical_failure "$RUN_EXIT"
fi

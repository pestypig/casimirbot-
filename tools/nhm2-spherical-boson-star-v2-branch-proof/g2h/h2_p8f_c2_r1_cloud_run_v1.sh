#!/usr/bin/env bash
set -Eeuo pipefail

ROOT=/home/pestypig/nhm2-h2-p8f-c2-r1-source-v1
EVIDENCE=/home/pestypig/nhm2-h2-p8f-c2-r1-evidence-v1
EXPORT=/home/pestypig/nhm2-h2-p8f-c2-r1-evidence-export-v1.tgz
IMAGE=nhm2-g2h-e-s5-c08-h2-p8f-c2-r1-cloud-representative:build-v1
CONTAINER=nhm2-h2-p8f-c2-r1-cloud-representative-20260831
EXECUTABLE=/usr/local/bin/mini-boson-star-primary-c08-h2-p8f-c2-r1-cloud-representative-v1
BASE_ARCHIVE="$ROOT/artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p4-cloud-preflight-v1-20260827/h2-p4-upload-v1/h2-p4-pinned-base-images.tar"
EXPECTED_BASE_SHA=4645ef9f0028a4ae58601a73d8d7cf7cb8f2316578a318ce6ce2257b103624f1
EXPECTED_BINARY_SHA=141408979c900f417409e2bf7fe0c1e0ecec7b859e0063e2eca9e4a36721bad6
TIMEOUT_SECONDS=86400

emit() {
  printf '%s\n' "$1"
  if [[ -c /dev/ttyS0 && -w /dev/ttyS0 ]]; then
    printf '%s\n' "$1" >/dev/ttyS0 || true
  fi
}

capture_logs() {
  local path
  for path in /tmp/p8f-c2-r1-docker-load.txt /tmp/p8f-c2-r1-docker-build.txt; do
    if [[ -f "$path" && ! -L "$path" ]]; then
      cp "$path" "$EVIDENCE/$(basename "$path")"
    fi
  done
}

export_evidence() {
  capture_logs
  tar --sort=name --mtime='UTC 2026-08-31' --owner=0 --group=0 --numeric-owner \
    -czf "$EXPORT" -C /home/pestypig "$(basename "$EVIDENCE")"
  local export_bytes export_sha encoded
  export_bytes="$(stat -c %s "$EXPORT")"
  export_sha="$(sha256sum "$EXPORT" | awk '{print $1}')"
  emit "P8F_C2_R1_EVIDENCE bytes=$export_bytes sha256=$export_sha"
  emit 'P8F_C2_R1_EVIDENCE_BASE64_BEGIN'
  encoded="$(base64 -w0 "$EXPORT")"
  emit "$encoded"
  emit 'P8F_C2_R1_EVIDENCE_BASE64_END'
  sync
}

fail() {
  local phase="$1"
  emit "P8F_C2_R1_CONTROLLER_FAIL phase=$phase"
  if [[ -d "$EVIDENCE" && ! -L "$EVIDENCE" ]]; then
    printf '%s\n' "$phase" >"$EVIDENCE/failure.phase.txt"
    date -u +%FT%TZ >"$EVIDENCE/finish.utc.txt"
    printf '1\n' >"$EVIDENCE/controller.exit.txt"
    export_evidence || true
  fi
  shutdown -h now || true
  exit 1
}

[[ -d "$ROOT" && ! -L "$ROOT" ]] || fail source_root
[[ ! -e "$EVIDENCE" && ! -e "$EXPORT" ]] || fail immutable_output_absence
mkdir "$EVIDENCE"
date -u +%FT%TZ >"$EVIDENCE/start.utc.txt"
printf 'preexecution\n' >"$EVIDENCE/phase.txt"
[[ -f "$BASE_ARCHIVE" && ! -L "$BASE_ARCHIVE" ]] || fail base_archive
[[ "$(sha256sum "$BASE_ARCHIVE" | awk '{print $1}')" == "$EXPECTED_BASE_SHA" ]] || fail base_archive_hash
docker container inspect "$CONTAINER" >/dev/null 2>&1 && fail container_absence
docker image inspect "$IMAGE" >/dev/null 2>&1 && fail target_image_absence

docker load -i "$BASE_ARCHIVE" >/tmp/p8f-c2-r1-docker-load.txt 2>&1 || fail base_image_load
docker build --network=none --pull=false \
  -f "$ROOT/tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/Dockerfile.primary.mini-boson-c08-h2-p8f-c2-r1-cloud-representative.v1" \
  -t "$IMAGE" "$ROOT" >/tmp/p8f-c2-r1-docker-build.txt 2>&1 || fail offline_build
BINARY_SHA="$(docker run --rm --entrypoint sha256sum "$IMAGE" "$EXECUTABLE" | awk '{print $1}')"
[[ "$BINARY_SHA" == "$EXPECTED_BINARY_SHA" ]] || fail binary_hash

printf 'numerical_execution\n' >"$EVIDENCE/phase.txt"
printf '%s\n' "$EXPECTED_BINARY_SHA" >"$EVIDENCE/executable.sha256.txt"
docker image inspect "$IMAGE" >"$EVIDENCE/image.inspect.json"
docker create --name "$CONTAINER" --network none --read-only --cap-drop ALL \
  --security-opt no-new-privileges --pids-limit 512 --cpus 32 "$IMAGE" \
  >"$EVIDENCE/container.id.txt" || fail container_create

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
date -u +%FT%TZ >"$EVIDENCE/finish.utc.txt"
printf '%s\n' "$RUN_EXIT" >"$EVIDENCE/controller.exit.txt"
printf '%s\n' "$TIMED_OUT" >"$EVIDENCE/timed_out.txt"
docker inspect "$CONTAINER" >"$EVIDENCE/container.inspect.json"
export_evidence
shutdown -h now

#!/usr/bin/env bash
set -Eeuo pipefail

ROOT=/home/pestypig/nhm2-h2-p8j-source-v1
EVIDENCE=/home/pestypig/nhm2-h2-p8j-evidence-v1
EXPORT=/home/pestypig/nhm2-h2-p8j-evidence-export-v1.tgz
TARGET_IMAGE=nhm2-g2h-e-s5-c08-h2-p8j-representative-attribution:build-v1
FIXTURE_IMAGE=nhm2-g2h-e-s5-c08-h2-p8i-selector-slot3-attribution-fixture:build-v1
CONTAINER=nhm2-h2-p8j-representative-attribution-20260901
TARGET_EXECUTABLE=/usr/local/bin/mini-boson-star-primary-c08-h2-p8j-representative-attribution-v1
FIXTURE_EXECUTABLE=/usr/local/bin/mini-boson-star-primary-c08-h2-p8i-selector-slot3-attribution-fixture-v1
EXPECTED_TARGET_SHA=d40c6e51988c30d89f8cd824e41f855e56acdb4e40f0bb0a24cf0e88721de9d6
EXPECTED_FIXTURE_SHA=445e6a277c4071abd73beec61fcac317e1b8048dd0e54439e9157cd94f504ab2
EXPECTED_AUDIT_SHA=5a3cfc0d1413353c7ee6f9050bc8b2305d23383fd0746559cd51b53f3454cab2
BASE_ARCHIVE="$ROOT/artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p4-cloud-preflight-v1-20260827/h2-p4-upload-v1/h2-p4-pinned-base-images.tar"
EXPECTED_BASE_SHA=4645ef9f0028a4ae58601a73d8d7cf7cb8f2316578a318ce6ce2257b103624f1
BUILDER_TAG=nhm2-g2h-s4-primary-fixture-builder:v2
RUNTIME_TAG=nhm2-g2h-primary-proof:v2
BUILDER_MANIFEST=sha256:9e94d19f9014938b510e95c776778d164cce120777adfc2d495c1812de5221a1
BUILDER_CONFIG=sha256:540d7039743d1fa2d285c2ec2570fef20954339fcb0a48453f187cf80c0c304c
RUNTIME_MANIFEST=sha256:8334e9777fd7cb9405d8878b243d0196f3e45d9d51d82df159452dcb430159ab
RUNTIME_CONFIG=sha256:17043e9f1891cb2026c3a959de47af3d5c75ed9918d32e44455148dfaff2057e
TIMEOUT_SECONDS=86400

emit() {
  printf '%s\n' "$1"
  if [[ -c /dev/ttyS0 && -w /dev/ttyS0 ]]; then
    printf '%s\n' "$1" >/dev/ttyS0 || true
  fi
}

capture_logs() {
  local path
  for path in /tmp/p8j-docker-load.txt /tmp/p8j-fixture-build.txt /tmp/p8j-target-build.txt; do
    if [[ -f "$path" && ! -L "$path" ]]; then
      cp "$path" "$EVIDENCE/$(basename "$path")"
    fi
  done
}

export_evidence() {
  capture_logs
  tar --sort=name --mtime='UTC 2026-09-01' --owner=0 --group=0 --numeric-owner \
    -czf "$EXPORT" -C /home/pestypig "$(basename "$EVIDENCE")"
  local export_bytes export_sha
  export_bytes="$(stat -c %s "$EXPORT")"
  export_sha="$(sha256sum "$EXPORT" | awk '{print $1}')"
  emit "P8J_EVIDENCE bytes=$export_bytes sha256=$export_sha"
  sync
}

fail() {
  local phase="$1"
  emit "P8J_CONTROLLER_FAIL phase=$phase"
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
AUDIT="$ROOT/scripts/nhm2_g2h_e_s5_c08_h2_p8j_result_audit.py"
[[ -f "$AUDIT" && ! -L "$AUDIT" ]] || fail result_audit
[[ "$(sha256sum "$AUDIT" | awk '{print $1}')" == "$EXPECTED_AUDIT_SHA" ]] || fail result_audit_hash
docker container inspect "$CONTAINER" >/dev/null 2>&1 && fail container_absence
docker image inspect "$TARGET_IMAGE" >/dev/null 2>&1 && fail target_image_absence
docker image inspect "$FIXTURE_IMAGE" >/dev/null 2>&1 && fail fixture_image_absence
docker image inspect "$BUILDER_TAG" >/dev/null 2>&1 && fail builder_tag_preexisted
docker image inspect "$RUNTIME_TAG" >/dev/null 2>&1 && fail runtime_tag_preexisted

docker load -i "$BASE_ARCHIVE" >/tmp/p8j-docker-load.txt 2>&1 || fail base_image_load
BUILDER_BEFORE="$(docker image inspect "$BUILDER_TAG" --format '{{.Id}}')" || fail builder_identity
RUNTIME_BEFORE="$(docker image inspect "$RUNTIME_TAG" --format '{{.Id}}')" || fail runtime_identity
case "$BUILDER_BEFORE" in "$BUILDER_MANIFEST"|"$BUILDER_CONFIG") ;; *) fail builder_identity ;; esac
case "$RUNTIME_BEFORE" in "$RUNTIME_MANIFEST"|"$RUNTIME_CONFIG") ;; *) fail runtime_identity ;; esac
printf 'builder=%s\nruntime=%s\n' "$BUILDER_BEFORE" "$RUNTIME_BEFORE" >"$EVIDENCE/base-image-identities.txt"

DOCKER_BUILDKIT=0 docker build --network=none --pull=false \
  --build-arg "BUILDER_IMAGE=$BUILDER_TAG" --build-arg "RUNTIME_IMAGE=$RUNTIME_TAG" \
  -f "$ROOT/tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/Dockerfile.primary.mini-boson-c08-h2-p8i-selector-slot3-attribution-fixture.v1" \
  -t "$FIXTURE_IMAGE" "$ROOT" >/tmp/p8j-fixture-build.txt 2>&1 || fail fixture_build
FIXTURE_SHA="$(docker run --rm --entrypoint sha256sum "$FIXTURE_IMAGE" "$FIXTURE_EXECUTABLE" | awk '{print $1}')"
[[ "$FIXTURE_SHA" == "$EXPECTED_FIXTURE_SHA" ]] || fail fixture_binary_hash
docker run --rm --network none --read-only --cap-drop ALL \
  --security-opt no-new-privileges --pids-limit 64 "$FIXTURE_IMAGE" \
  >"$EVIDENCE/p8i-fixture.stdout.txt" 2>"$EVIDENCE/p8i-fixture.stderr.txt" \
  || fail fixture_execution
grep -F '"status":"PASS","checks_passed":14,"checks_total":14' \
  "$EVIDENCE/p8i-fixture.stdout.txt" >/dev/null || fail fixture_receipt

DOCKER_BUILDKIT=0 docker build --network=none --pull=false \
  --build-arg "BUILDER_IMAGE=$BUILDER_TAG" --build-arg "RUNTIME_IMAGE=$RUNTIME_TAG" \
  -f "$ROOT/tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/Dockerfile.primary.mini-boson-c08-h2-p8j-representative-attribution.v1" \
  -t "$TARGET_IMAGE" "$ROOT" >/tmp/p8j-target-build.txt 2>&1 || fail target_build
[[ "$(docker image inspect "$BUILDER_TAG" --format '{{.Id}}')" == "$BUILDER_BEFORE" ]] || fail builder_identity_changed
[[ "$(docker image inspect "$RUNTIME_TAG" --format '{{.Id}}')" == "$RUNTIME_BEFORE" ]] || fail runtime_identity_changed
TARGET_SHA="$(docker run --rm --entrypoint sha256sum "$TARGET_IMAGE" "$TARGET_EXECUTABLE" | awk '{print $1}')"
[[ "$TARGET_SHA" == "$EXPECTED_TARGET_SHA" ]] || fail target_binary_hash

printf 'numerical_execution\n' >"$EVIDENCE/phase.txt"
printf '%s\n' "$TARGET_SHA" >"$EVIDENCE/executable.sha256.txt"
docker image inspect "$TARGET_IMAGE" >"$EVIDENCE/image.inspect.json"
docker create --name "$CONTAINER" --network none --read-only --cap-drop ALL \
  --security-opt no-new-privileges --pids-limit 512 --cpus 32 "$TARGET_IMAGE" \
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
printf '%s\n' "$RUN_EXIT" >"$EVIDENCE/run.exit.txt"
printf '%s\n' "$TIMED_OUT" >"$EVIDENCE/timed_out.txt"
docker inspect "$CONTAINER" >"$EVIDENCE/container.inspect.json"
if [[ "$RUN_EXIT" -eq 0 ]]; then
  tail -n 1 "$EVIDENCE/stdout.txt" >"$EVIDENCE/terminal-record.json"
  python3 "$AUDIT" --record "$EVIDENCE/terminal-record.json" \
    --output "$EVIDENCE/p8j-result-audit.json" \
    >"$EVIDENCE/p8j-result-audit.stdout.txt" \
    2>"$EVIDENCE/p8j-result-audit.stderr.txt" || fail result_audit_execution
fi
printf '%s\n' "$RUN_EXIT" >"$EVIDENCE/controller.exit.txt"
export_evidence
shutdown -h now

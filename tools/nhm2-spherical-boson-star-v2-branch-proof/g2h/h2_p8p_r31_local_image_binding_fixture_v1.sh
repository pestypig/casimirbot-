#!/usr/bin/env bash
set -Eeuo pipefail

root=${1:?usage: h2_p8p_r31_local_image_binding_fixture_v1.sh ROOT BASE_ARCHIVE EVIDENCE_DIR}
base_archive=${2:?usage: h2_p8p_r31_local_image_binding_fixture_v1.sh ROOT BASE_ARCHIVE EVIDENCE_DIR}
evidence=${3:?usage: h2_p8p_r31_local_image_binding_fixture_v1.sh ROOT BASE_ARCHIVE EVIDENCE_DIR}
image=nhm2-g2h-e-s5-c08-h2-p8p-r31-binding-fixture:v1
builder_tag=nhm2-g2h-s4-primary-fixture-builder:v2
runtime_tag=nhm2-g2h-primary-proof:v2
builder_manifest=sha256:9e94d19f9014938b510e95c776778d164cce120777adfc2d495c1812de5221a1
builder_config=sha256:540d7039743d1fa2d285c2ec2570fef20954339fcb0a48453f187cf80c0c304c
runtime_manifest=sha256:8334e9777fd7cb9405d8878b243d0196f3e45d9d51d82df159452dcb430159ab
runtime_config=sha256:17043e9f1891cb2026c3a959de47af3d5c75ed9918d32e44455148dfaff2057e
expected_archive=4645ef9f0028a4ae58601a73d8d7cf7cb8f2316578a318ce6ce2257b103624f1
expected_dockerfile=1159828fb3a7b69f9b75ecde002b27e6c1442e4c28630c05433559bc8986b570
expected_binary=7c96648911ea74e43199e6c87291e2dd32a73f5d21fee8e20454cc8962e31718
dockerfile="$root/tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/Dockerfile.primary.mini-boson-c08-h2-p8p-turnaround-calibration.v1"
binary=/usr/local/bin/mini-boson-star-primary-c08-h2-p8p-turnaround-calibration-v1

fail() {
  printf 'R31_FIXTURE_FAIL phase=%s\n' "$1" >&2
  exit 1
}

[[ -d "$root" && ! -L "$root" ]] || fail source_root
[[ -f "$base_archive" && ! -L "$base_archive" ]] || fail base_archive
[[ ! -e "$evidence" ]] || fail evidence_absence
mkdir -p "$evidence"
[[ "$(sha256sum "$base_archive" | awk '{print $1}')" == "$expected_archive" ]] || fail base_archive_hash
[[ -f "$dockerfile" && ! -L "$dockerfile" ]] || fail dockerfile
[[ "$(sha256sum "$dockerfile" | awk '{print $1}')" == "$expected_dockerfile" ]] || fail dockerfile_hash
docker image inspect "$builder_tag" >/dev/null 2>&1 && fail builder_tag_preexisted
docker image inspect "$runtime_tag" >/dev/null 2>&1 && fail runtime_tag_preexisted
docker image inspect "$image" >/dev/null 2>&1 && fail target_image_preexisted

docker load -i "$base_archive" >"$evidence/docker-load.txt" 2>&1 || fail base_image_load
builder_before="$(docker image inspect "$builder_tag" --format '{{.Id}}')" || fail builder_identity
runtime_before="$(docker image inspect "$runtime_tag" --format '{{.Id}}')" || fail runtime_identity
builder_digests="$(docker image inspect "$builder_tag" --format '{{json .RepoDigests}}')" || fail builder_repo_digests
runtime_digests="$(docker image inspect "$runtime_tag" --format '{{json .RepoDigests}}')" || fail runtime_repo_digests
case "$builder_before" in "$builder_manifest"|"$builder_config") ;; *) fail builder_identity ;; esac
case "$runtime_before" in "$runtime_manifest"|"$runtime_config") ;; *) fail runtime_identity ;; esac
[[ "$builder_digests" == '[]' || "$builder_digests" == 'null' ]] || fail builder_repo_digests
[[ "$runtime_digests" == '[]' || "$runtime_digests" == 'null' ]] || fail runtime_repo_digests

DOCKER_BUILDKIT=0 docker build --pull=false --network=none \
  --build-arg "BUILDER_IMAGE=$builder_tag" \
  --build-arg "RUNTIME_IMAGE=$runtime_tag" \
  -f "$dockerfile" -t "$image" "$root" >"$evidence/docker-build.txt" 2>&1 \
  || fail offline_build

[[ "$(docker image inspect "$builder_tag" --format '{{.Id}}')" == "$builder_before" ]] || fail builder_identity_changed
[[ "$(docker image inspect "$runtime_tag" --format '{{.Id}}')" == "$runtime_before" ]] || fail runtime_identity_changed
actual_binary="$(docker run --rm --network=none --read-only --cap-drop=ALL \
  --security-opt no-new-privileges --entrypoint /usr/bin/sha256sum \
  "$image" "$binary" | awk '{print $1}')" || fail binary_hash_read
[[ "$actual_binary" == "$expected_binary" ]] || fail binary_hash

printf 'builder=%s\nruntime=%s\nbuilder_repo_digests=%s\nruntime_repo_digests=%s\nbinary=%s\n' \
  "$builder_before" "$runtime_before" "$builder_digests" "$runtime_digests" "$actual_binary" \
  >"$evidence/identity-receipt.txt"
printf 'R31_FIXTURE_PASS\n'


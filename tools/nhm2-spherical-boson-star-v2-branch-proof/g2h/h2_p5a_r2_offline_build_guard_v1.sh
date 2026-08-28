#!/bin/sh
set -eu

base_archive=${1:?usage: h2_p5a_r2_offline_build_guard_v1.sh BASE_ARCHIVE [IMAGE_TAG]}
image_tag=${2:-nhm2-g2h-e-s5-h2-p5a-r2-binding-audit:v1}
builder_tag=nhm2-g2h-s4-primary-fixture-builder:v2
runtime_tag=nhm2-g2h-primary-proof:v2
builder_manifest=sha256:9e94d19f9014938b510e95c776778d164cce120777adfc2d495c1812de5221a1
builder_config=sha256:540d7039743d1fa2d285c2ec2570fef20954339fcb0a48453f187cf80c0c304c
runtime_manifest=sha256:8334e9777fd7cb9405d8878b243d0196f3e45d9d51d82df159452dcb430159ab
runtime_config=sha256:17043e9f1891cb2026c3a959de47af3d5c75ed9918d32e44455148dfaff2057e
binary=/usr/local/bin/mini-boson-star-primary-c08-h2-p5a-width-calibration-v1
required_binary=aa37562fe73ecf48b0177b6875aea48a259a0439fdbc24abc0525624acb013b7

if docker image inspect "$builder_tag" >/dev/null 2>&1 || docker image inspect "$runtime_tag" >/dev/null 2>&1; then
  echo "target base tag existed before archive load" >&2
  exit 20
fi

docker load -i "$base_archive"

builder_before=$(docker image inspect "$builder_tag" --format '{{.Id}}')
runtime_before=$(docker image inspect "$runtime_tag" --format '{{.Id}}')
case "$builder_before" in "$builder_manifest"|"$builder_config") ;; *) echo "unexpected builder identity: $builder_before" >&2; exit 21;; esac
case "$runtime_before" in "$runtime_manifest"|"$runtime_config") ;; *) echo "unexpected runtime identity: $runtime_before" >&2; exit 22;; esac

DOCKER_BUILDKIT=0 docker build --pull=false --network=none \
  -f tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/Dockerfile.primary.mini-boson-c08-h2-p5a-width-calibration.r2 \
  -t "$image_tag" .

builder_after=$(docker image inspect "$builder_tag" --format '{{.Id}}')
runtime_after=$(docker image inspect "$runtime_tag" --format '{{.Id}}')
[ "$builder_after" = "$builder_before" ] || { echo "builder identity changed during build" >&2; exit 23; }
[ "$runtime_after" = "$runtime_before" ] || { echo "runtime identity changed during build" >&2; exit 24; }

actual_binary=$(docker run --rm --network=none --entrypoint /usr/bin/sha256sum "$image_tag" "$binary" | awk '{print $1}')
[ "$actual_binary" = "$required_binary" ] || { echo "binary mismatch: $actual_binary" >&2; exit 25; }
printf 'PASS\nbuilder=%s\nruntime=%s\nbinary=%s\n' "$builder_before" "$runtime_before" "$actual_binary"

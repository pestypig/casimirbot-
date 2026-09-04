#!/usr/bin/env bash
set -Eeuo pipefail

outer=/home/pestypig/h2-p8p-r16-regional-bulk-upload-v1.tar
fixture=/home/pestypig/h2_p8p_r31_local_image_binding_fixture_v1.sh
source_root=/home/pestypig/nhm2-h2-p8p-r32-source-v1
stage=/home/pestypig/nhm2-h2-p8p-r32-ingress-v1
evidence=/home/pestypig/nhm2-h2-p8p-r32-evidence-v1
export_path=/home/pestypig/nhm2-h2-p8p-r32-evidence-export-v1.tgz
outer_sha=3c697fa3e238398d3b4c30a6c379fea8d6d545b2228d0c699dd66594a23670b5
base_sha=fa8d8c994b08fe8a31050feb125eb1d6e4ebb33c9f5de18d5f9e189716936978
overlay_sha=4ab0921f2bc7d6bfe85b8b45e294c2058b2f29644fe072e48e2064c7be772b8e
fixture_sha=97c0209284fa67ee33e259a75abfef7947f1f8ce8971af3e7f39a3421ce07c79

finish() {
  local phase=$1 exit_code=$2
  printf 'R32_GUEST_TERMINAL phase=%s exit=%s\n' "$phase" "$exit_code"
  if [[ -d "$evidence" && ! -L "$evidence" ]]; then
    printf '%s\n' "$phase" >"$evidence/terminal.phase.txt"
    printf '%s\n' "$exit_code" >"$evidence/guest.exit.txt"
    date -u +%FT%TZ >"$evidence/finish.utc.txt"
    tar --sort=name --mtime='UTC 2026-09-04' --owner=0 --group=0 --numeric-owner \
      -czf "$export_path" -C /home/pestypig "$(basename "$evidence")" || true
    if [[ -f "$export_path" ]]; then
      printf 'R32_EVIDENCE bytes=%s sha256=%s\n' "$(stat -c %s "$export_path")" "$(sha256sum "$export_path" | awk '{print $1}')"
    fi
  fi
  sudo shutdown -h now || true
  exit "$exit_code"
}

[[ -f "$outer" && ! -L "$outer" && "$(stat -c %s "$outer")" == 236640768 ]] || exit 90
[[ "$(sha256sum "$outer" | awk '{print $1}')" == "$outer_sha" ]] || exit 91
[[ -f "$fixture" && ! -L "$fixture" && "$(sha256sum "$fixture" | awk '{print $1}')" == "$fixture_sha" ]] || exit 92
[[ ! -e "$source_root" && ! -e "$stage" && ! -e "$evidence" && ! -e "$export_path" ]] || exit 93
mkdir "$source_root" "$stage" "$evidence"
date -u +%FT%TZ >"$evidence/start.utc.txt"
tar -xf "$outer" -C "$stage" || finish outer_extract 94
[[ "$(sha256sum "$stage/h2-p8f-c2-r1-cloud-upload-v1.tar" | awk '{print $1}')" == "$base_sha" ]] || finish base_hash 95
[[ "$(sha256sum "$stage/h2-p8p-overlay-upload-v1.tar" | awk '{print $1}')" == "$overlay_sha" ]] || finish overlay_hash 96
tar -xf "$stage/h2-p8f-c2-r1-cloud-upload-v1.tar" -C "$source_root" || finish base_extract 97
tar -xf "$stage/h2-p8p-overlay-upload-v1.tar" -C "$source_root" || finish overlay_extract 98

if ! command -v docker >/dev/null 2>&1; then
  sudo apt-get update >"$evidence/apt-update.txt" 2>&1 || finish docker_install 99
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y docker.io >"$evidence/apt-install.txt" 2>&1 || finish docker_install 99
fi
sudo systemctl start docker || finish docker_start 100
sudo env DOCKER_HOST=unix:///var/run/docker.sock bash "$fixture" "$source_root" \
  "$source_root/artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p4-cloud-preflight-v1-20260827/h2-p4-upload-v1/h2-p4-pinned-base-images.tar" \
  "$evidence/fixture" >"$evidence/fixture.stdout.txt" 2>"$evidence/fixture.stderr.txt" \
  || finish fixture 101
grep -Fx 'R31_FIXTURE_PASS' "$evidence/fixture.stdout.txt" >/dev/null || finish fixture_receipt 102
finish complete 0

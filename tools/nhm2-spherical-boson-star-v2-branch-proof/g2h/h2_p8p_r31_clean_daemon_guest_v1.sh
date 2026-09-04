#!/usr/bin/env bash
set -Eeuo pipefail

source_root=/home/pestypig/nhm2-h2-p8p-source-v1
base_archive="$source_root/artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p4-cloud-preflight-v1-20260827/h2-p4-upload-v1/h2-p4-pinned-base-images.tar"
fixture=/home/dan/h2_p8p_r31_local_image_binding_fixture_v1.sh
evidence=/home/dan/nhm2-h2-p8p-r31-evidence-v1
export_path=/home/dan/nhm2-h2-p8p-r31-evidence-export-v1.tgz
data_root=/var/lib/nhm2-h2-p8p-r31-docker-v1
socket_dir=/run/nhm2-h2-p8p-r31-docker-v1
socket="$socket_dir/docker.sock"
pid_file="$socket_dir/dockerd.pid"
expected_fixture=97c0209284fa67ee33e259a75abfef7947f1f8ce8971af3e7f39a3421ce07c79
daemon_pid=

cleanup() {
  if [[ -n "$daemon_pid" ]]; then
    sudo kill "$daemon_pid" >/dev/null 2>&1 || true
    for _ in $(seq 1 30); do
      sudo kill -0 "$daemon_pid" >/dev/null 2>&1 || break
      sleep 1
    done
  fi
}
trap cleanup EXIT

fail() {
  printf 'R31_GUEST_FAIL phase=%s\n' "$1" >&2
  exit 1
}

[[ -d "$source_root" && ! -L "$source_root" ]] || fail source_root
[[ -f "$base_archive" && ! -L "$base_archive" ]] || fail base_archive
[[ -f "$fixture" && ! -L "$fixture" ]] || fail fixture
[[ "$(sha256sum "$fixture" | awk '{print $1}')" == "$expected_fixture" ]] || fail fixture_hash
[[ ! -e "$evidence" && ! -e "$export_path" ]] || fail evidence_absence
sudo test ! -e "$data_root" || fail data_root_absence
sudo test ! -e "$socket_dir" || fail socket_dir_absence
mkdir "$evidence"
date -u +%FT%TZ >"$evidence/start.utc.txt"
sudo mkdir -p "$data_root" "$socket_dir"
sudo bash -c "nohup dockerd --data-root '$data_root' --exec-root '$socket_dir/exec' --host 'unix://$socket' --pidfile '$pid_file' --storage-driver=vfs --iptables=false --bridge=none >'$evidence/dockerd.log' 2>&1 & echo \$! >'$pid_file.launch'"
daemon_pid="$(sudo cat "$pid_file.launch")"
[[ "$daemon_pid" =~ ^[0-9]+$ ]] || fail daemon_pid

ready=false
for _ in $(seq 1 60); do
  if sudo env DOCKER_HOST="unix://$socket" docker info >/dev/null 2>&1; then
    ready=true
    break
  fi
  sleep 1
done
[[ "$ready" == true ]] || fail clean_daemon_ready
sudo env DOCKER_HOST="unix://$socket" docker info >"$evidence/docker-info.txt"

set +e
sudo env DOCKER_HOST="unix://$socket" bash "$fixture" "$source_root" "$base_archive" "$evidence/fixture" \
  >"$evidence/fixture.stdout.txt" 2>"$evidence/fixture.stderr.txt"
fixture_exit=$?
set -e
printf '%s\n' "$fixture_exit" >"$evidence/fixture.exit.txt"
date -u +%FT%TZ >"$evidence/finish.utc.txt"
tar --sort=name --mtime='UTC 2026-09-04' --owner=0 --group=0 --numeric-owner \
  -czf "$export_path" -C /home/dan "$(basename "$evidence")"
printf 'R31_EVIDENCE bytes=%s sha256=%s\n' "$(stat -c %s "$export_path")" "$(sha256sum "$export_path" | awk '{print $1}')"
[[ "$fixture_exit" -eq 0 ]] || fail fixture_execution
grep -Fx 'R31_FIXTURE_PASS' "$evidence/fixture.stdout.txt" >/dev/null || fail fixture_receipt
printf 'R31_GUEST_PASS\n'


#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT=dark-stratum-455714-h4
REGION=us-east1
VM=nhm2-h2-p8j-r13-c2d-32-20260901
BASE=/home/pestypig/h2-p8f-c2-r1-cloud-upload-v1.tar
OVERLAY=/home/pestypig/h2-p8j-r2-overlay-upload-v1.tar
CONTROLLER=/home/pestypig/h2_p8j_cloud_run_v2.sh
EVIDENCE=/home/pestypig/nhm2-h2-p8j-r13-cloudshell-evidence-v1
BASE_BYTES=236492800
BASE_SHA=fa8d8c994b08fe8a31050feb125eb1d6e4ebb33c9f5de18d5f9e189716936978
OVERLAY_BYTES=225792
OVERLAY_SHA=3d49deb1c4044232e2cdd83da6192f2baca26bbc9773b58bbdca85e6109c19a7
CONTROLLER_BYTES=7424
CONTROLLER_SHA=867f4b20a9d81d00b9bab16d99865470b70ea22d8a02fd2735901b2ad7097a01
VM_CREATED=false
ZONE=

[[ ! -e "$EVIDENCE" ]] || { printf 'R13_FAIL phase=evidence_root_absence\n'; exit 1; }
mkdir "$EVIDENCE"
exec > >(tee "$EVIDENCE/cloudshell.stdout.txt") 2> >(tee "$EVIDENCE/cloudshell.stderr.txt" >&2)
date -u +%FT%TZ >"$EVIDENCE/start.utc.txt"

terminal_cleanup() {
  local exit_code=$?
  if [[ "$exit_code" -ne 0 ]]; then
    printf 'R13_FAIL exit=%s\n' "$exit_code"
    printf '%s\n' "$exit_code" >"$EVIDENCE/procedure.exit.txt"
    date -u +%FT%TZ >"$EVIDENCE/finish.utc.txt"
    if [[ "$VM_CREATED" == true && -n "$ZONE" ]]; then
      gcloud compute instances stop "$VM" --project="$PROJECT" --zone="$ZONE" --quiet \
        >"$EVIDENCE/fail-stop.stdout.txt" 2>"$EVIDENCE/fail-stop.stderr.txt" || true
    fi
  fi
}
trap terminal_cleanup EXIT

for spec in \
  "$BASE|$BASE_BYTES|$BASE_SHA" \
  "$OVERLAY|$OVERLAY_BYTES|$OVERLAY_SHA" \
  "$CONTROLLER|$CONTROLLER_BYTES|$CONTROLLER_SHA"; do
  IFS='|' read -r path bytes digest <<<"$spec"
  [[ -f "$path" && ! -L "$path" ]]
  [[ "$(stat -c %s "$path")" == "$bytes" ]]
  [[ "$(sha256sum "$path" | awk '{print $1}')" == "$digest" ]]
done
printf '%s  %s\n%s  %s\n%s  %s\n' \
  "$BASE_SHA" "$BASE" "$OVERLAY_SHA" "$OVERLAY" "$CONTROLLER_SHA" "$CONTROLLER" \
  >"$EVIDENCE/input-hashes.txt"

gcloud compute instances list --project="$PROJECT" --format=json >"$EVIDENCE/instances.pre.json"
PROJECT="$PROJECT" VM="$VM" python3 - "$EVIDENCE/instances.pre.json" <<'PY'
import json, os, sys
rows = json.load(open(sys.argv[1], encoding="utf-8"))
assert not any(row.get("name") == os.environ["VM"] for row in rows)
assert not any(row.get("name", "").startswith("nhm2-h2-") and row.get("status") != "TERMINATED" for row in rows)
PY
gcloud compute regions describe "$REGION" --project="$PROJECT" --format=json >"$EVIDENCE/region.pre.json"
python3 - "$EVIDENCE/region.pre.json" <<'PY'
import json, sys
region = json.load(open(sys.argv[1], encoding="utf-8"))
rows = [q for q in region["quotas"] if q["metric"] == "C2D_CPUS"]
assert len(rows) == 1 and float(rows[0]["limit"]) - float(rows[0].get("usage", 0)) >= 32
PY
printf 'R13_PREEXECUTION_PASS\n'

gcloud compute instances bulk create \
  --project="$PROJECT" --region="$REGION" --predefined-names="$VM" \
  --count=1 --min-count=1 --target-distribution-shape=ANY_SINGLE_ZONE \
  --location-policy=us-east1-b=allow,us-east1-c=allow,us-east1-d=allow \
  --machine-type=c2d-standard-32 --provisioning-model=STANDARD \
  --image=projects/debian-cloud/global/images/debian-12-bookworm-v20260817 \
  --boot-disk-size=30GB --boot-disk-type=pd-standard \
  --max-run-duration=25h --instance-termination-action=STOP --no-restart-on-failure \
  --format=json >"$EVIDENCE/bulk-create.json"
VM_CREATED=true

gcloud compute instances list --project="$PROJECT" --filter="name=($VM)" --format=json >"$EVIDENCE/instance.post.json"
ZONE="$(python3 - "$EVIDENCE/instance.post.json" <<'PY'
import json, sys
rows = json.load(open(sys.argv[1], encoding="utf-8"))
assert len(rows) == 1
row = rows[0]
assert row["name"] == "nhm2-h2-p8j-r13-c2d-32-20260901"
assert row["status"] == "RUNNING" and row["machineType"].endswith("/machineTypes/c2d-standard-32")
zone = row["zone"].rsplit("/", 1)[-1]
assert zone in {"us-east1-b", "us-east1-c", "us-east1-d"} and len(row["disks"]) == 1
print(zone)
PY
)"
printf '%s\n' "$ZONE" >"$EVIDENCE/selected-zone.txt"
DISK="$(python3 - "$EVIDENCE/instance.post.json" <<'PY'
import json, sys
print(json.load(open(sys.argv[1], encoding="utf-8"))[0]["disks"][0]["source"].rsplit("/", 1)[-1])
PY
)"
gcloud compute disks describe "$DISK" --project="$PROJECT" --zone="$ZONE" --format=json >"$EVIDENCE/disk.post.json"
python3 - "$EVIDENCE/disk.post.json" <<'PY'
import json, sys
disk = json.load(open(sys.argv[1], encoding="utf-8"))
assert int(disk["sizeGb"]) == 30 and disk["type"].endswith("/diskTypes/pd-standard")
assert disk["sourceImage"].endswith("/images/debian-12-bookworm-v20260817")
PY
printf 'R13_ALLOCATION_PASS zone=%s disk=%s\n' "$ZONE" "$DISK"

sleep 180
gcloud compute scp "$BASE" "$OVERLAY" "$CONTROLLER" "$VM:/home/pestypig/" \
  --project="$PROJECT" --zone="$ZONE" --quiet \
  >"$EVIDENCE/scp.stdout.txt" 2>"$EVIDENCE/scp.stderr.txt"

REMOTE_SETUP="$(cat <<'REMOTE'
set -Eeuo pipefail
BASE=/home/pestypig/h2-p8f-c2-r1-cloud-upload-v1.tar
OVERLAY=/home/pestypig/h2-p8j-r2-overlay-upload-v1.tar
STAGED_CONTROLLER=/home/pestypig/h2_p8j_cloud_run_v2.sh
ROOT=/home/pestypig/nhm2-h2-p8j-source-v1
[[ -f "$BASE" && ! -L "$BASE" && "$(stat -c %s "$BASE")" == 236492800 ]]
[[ "$(sha256sum "$BASE" | awk '{print $1}')" == fa8d8c994b08fe8a31050feb125eb1d6e4ebb33c9f5de18d5f9e189716936978 ]]
[[ -f "$OVERLAY" && ! -L "$OVERLAY" && "$(stat -c %s "$OVERLAY")" == 225792 ]]
[[ "$(sha256sum "$OVERLAY" | awk '{print $1}')" == 3d49deb1c4044232e2cdd83da6192f2baca26bbc9773b58bbdca85e6109c19a7 ]]
[[ -f "$STAGED_CONTROLLER" && ! -L "$STAGED_CONTROLLER" && "$(stat -c %s "$STAGED_CONTROLLER")" == 7424 ]]
[[ "$(sha256sum "$STAGED_CONTROLLER" | awk '{print $1}')" == 867f4b20a9d81d00b9bab16d99865470b70ea22d8a02fd2735901b2ad7097a01 ]]
[[ ! -e "$ROOT" ]]
mkdir "$ROOT"
tar -xf "$BASE" -C "$ROOT"
tar -xf "$OVERLAY" -C "$ROOT"
MANIFEST="$ROOT/artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8j-cloud-preflight-v1-20260831/h2-p8j-r2-overlay-source-manifest.v1.tsv"
[[ -f "$MANIFEST" && ! -L "$MANIFEST" && "$(wc -l <"$MANIFEST")" == 17 ]]
tail -n +2 "$MANIFEST" | while IFS=$'\t' read -r sha bytes path; do
  target="$ROOT/$path"
  [[ -f "$target" && ! -L "$target" && "$(stat -c %s "$target")" == "$bytes" ]]
  [[ "$(sha256sum "$target" | awk '{print $1}')" == "$sha" ]]
done
CONTROLLER="$ROOT/tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/h2_p8j_cloud_run_v2.sh"
[[ ! -e "$CONTROLLER" ]]
install -m 0644 "$STAGED_CONTROLLER" "$CONTROLLER"
[[ "$(sha256sum "$CONTROLLER" | awk '{print $1}')" == 867f4b20a9d81d00b9bab16d99865470b70ea22d8a02fd2735901b2ad7097a01 ]]
/bin/bash -n "$CONTROLLER"
sudo apt-get update
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y docker.io
sudo systemctl enable --now docker
sudo tee /etc/systemd/system/nhm2-h2-p8j-r13.service >/dev/null <<UNIT
[Unit]
Description=NHM2 candidate-neutral H2 P8J R13 representative attribution
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
User=root
ExecStart=/bin/bash $CONTROLLER
StandardOutput=journal+console
StandardError=journal+console
TimeoutStartSec=87000

[Install]
WantedBy=multi-user.target
UNIT
sudo systemctl daemon-reload
sudo systemctl start --no-block nhm2-h2-p8j-r13.service
sleep 5
ACTIVE_STATE="$(sudo systemctl show nhm2-h2-p8j-r13.service --property=ActiveState --value)"
SUB_STATE="$(sudo systemctl show nhm2-h2-p8j-r13.service --property=SubState --value)"
MAIN_PID="$(sudo systemctl show nhm2-h2-p8j-r13.service --property=MainPID --value)"
[[ "$ACTIVE_STATE" == activating && "$SUB_STATE" == start ]]
[[ "$MAIN_PID" =~ ^[1-9][0-9]*$ ]]
sudo kill -0 "$MAIN_PID"
printf 'R13_REMOTE_CONTROLLER_ACTIVATING main_pid=%s\n' "$MAIN_PID"
REMOTE
)"
gcloud compute ssh "$VM" --project="$PROJECT" --zone="$ZONE" --quiet --command="$REMOTE_SETUP" \
  >"$EVIDENCE/ssh.stdout.txt" 2>"$EVIDENCE/ssh.stderr.txt"

printf '0\n' >"$EVIDENCE/procedure.exit.txt"
date -u +%FT%TZ >"$EVIDENCE/finish.utc.txt"
tar --sort=name --mtime='UTC 2026-09-01' --owner=0 --group=0 --numeric-owner \
  -czf /home/pestypig/nhm2-h2-p8j-r13-cloudshell-evidence-export-v1.tgz \
  -C /home/pestypig "$(basename "$EVIDENCE")"
printf 'R13_CONTROLLER_LAUNCHED vm=%s zone=%s\n' "$VM" "$ZONE"
trap - EXIT


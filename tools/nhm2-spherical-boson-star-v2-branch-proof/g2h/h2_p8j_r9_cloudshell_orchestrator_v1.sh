#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT=dark-stratum-455714-h4
REGION=us-east1
VM=nhm2-h2-p8j-r9-c2d-32-20260831
BASE=/home/pestypig/h2-p8f-c2-r1-cloud-upload-v1.tar
OVERLAY=/home/pestypig/h2-p8j-r2-overlay-upload-v1.tar
EVIDENCE=/home/pestypig/nhm2-h2-p8j-r9-cloudshell-evidence-v1
BASE_BYTES=236492800
BASE_SHA=fa8d8c994b08fe8a31050feb125eb1d6e4ebb33c9f5de18d5f9e189716936978
OVERLAY_BYTES=225792
OVERLAY_SHA=3d49deb1c4044232e2cdd83da6192f2baca26bbc9773b58bbdca85e6109c19a7
CONTROLLER_SHA=4b8f5722c885980bb0fbac3602ecf36436a66ff1141e4776168f3bbef86276e6
VM_CREATED=false
ZONE=

[[ ! -e "$EVIDENCE" ]] || {
  printf 'R9_FAIL phase=evidence_root_absence\n'
  exit 1
}
mkdir "$EVIDENCE"
exec > >(tee "$EVIDENCE/cloudshell.stdout.txt") 2> >(tee "$EVIDENCE/cloudshell.stderr.txt" >&2)
date -u +%FT%TZ >"$EVIDENCE/start.utc.txt"

terminal_cleanup() {
  local exit_code=$?
  if [[ "$exit_code" -ne 0 ]]; then
    printf 'R9_FAIL exit=%s\n' "$exit_code"
    printf '%s\n' "$exit_code" >"$EVIDENCE/procedure.exit.txt"
    date -u +%FT%TZ >"$EVIDENCE/finish.utc.txt"
    if [[ "$VM_CREATED" == true && -n "$ZONE" ]]; then
      gcloud compute instances stop "$VM" --project="$PROJECT" --zone="$ZONE" --quiet \
        >"$EVIDENCE/fail-stop.stdout.txt" 2>"$EVIDENCE/fail-stop.stderr.txt" || true
    fi
  fi
}
trap terminal_cleanup EXIT

[[ -f "$BASE" && ! -L "$BASE" ]]
[[ "$(stat -c %s "$BASE")" == "$BASE_BYTES" ]]
[[ "$(sha256sum "$BASE" | awk '{print $1}')" == "$BASE_SHA" ]]
[[ -f "$OVERLAY" && ! -L "$OVERLAY" ]]
[[ "$(stat -c %s "$OVERLAY")" == "$OVERLAY_BYTES" ]]
[[ "$(sha256sum "$OVERLAY" | awk '{print $1}')" == "$OVERLAY_SHA" ]]
printf '%s  %s\n%s  %s\n' "$BASE_SHA" "$BASE" "$OVERLAY_SHA" "$OVERLAY" \
  >"$EVIDENCE/archive-hashes.txt"

gcloud compute instances list --project="$PROJECT" --format=json \
  >"$EVIDENCE/instances.pre.json"
PROJECT="$PROJECT" VM="$VM" python3 - "$EVIDENCE/instances.pre.json" <<'PY'
import json, os, sys
rows = json.load(open(sys.argv[1], encoding="utf-8"))
assert not any(row.get("name") == os.environ["VM"] for row in rows)
assert not any(
    row.get("name", "").startswith("nhm2-h2-")
    and row.get("status") != "TERMINATED"
    for row in rows
)
PY

gcloud compute regions describe "$REGION" --project="$PROJECT" --format=json \
  >"$EVIDENCE/region.pre.json"
python3 - "$EVIDENCE/region.pre.json" <<'PY'
import json, sys
region = json.load(open(sys.argv[1], encoding="utf-8"))
matches = [q for q in region["quotas"] if q["metric"] == "C2D_CPUS"]
assert len(matches) == 1
assert float(matches[0]["limit"]) - float(matches[0].get("usage", 0)) >= 32
PY
printf 'R9_PREEXECUTION_PASS\n'

gcloud compute instances bulk create \
  --project="$PROJECT" \
  --region="$REGION" \
  --predefined-names="$VM" \
  --count=1 \
  --min-count=1 \
  --target-distribution-shape=ANY_SINGLE_ZONE \
  --location-policy=us-east1-b=allow,us-east1-c=allow,us-east1-d=allow \
  --machine-type=c2d-standard-32 \
  --provisioning-model=STANDARD \
  --image=projects/debian-cloud/global/images/debian-12-bookworm-v20260817 \
  --boot-disk-size=30GB \
  --boot-disk-type=pd-standard \
  --max-run-duration=25h \
  --instance-termination-action=STOP \
  --no-restart-on-failure \
  --format=json >"$EVIDENCE/bulk-create.json"
VM_CREATED=true

gcloud compute instances list --project="$PROJECT" --filter="name=($VM)" --format=json \
  >"$EVIDENCE/instance.post.json"
ZONE="$(python3 - "$EVIDENCE/instance.post.json" <<'PY'
import json, sys
rows = json.load(open(sys.argv[1], encoding="utf-8"))
assert len(rows) == 1
row = rows[0]
assert row["name"] == "nhm2-h2-p8j-r9-c2d-32-20260831"
assert row["status"] == "RUNNING"
assert row["machineType"].endswith("/machineTypes/c2d-standard-32")
zone = row["zone"].rsplit("/", 1)[-1]
assert zone in {"us-east1-b", "us-east1-c", "us-east1-d"}
assert len(row["disks"]) == 1
print(zone)
PY
)"
printf '%s\n' "$ZONE" >"$EVIDENCE/selected-zone.txt"
DISK="$(python3 - "$EVIDENCE/instance.post.json" <<'PY'
import json, sys
row = json.load(open(sys.argv[1], encoding="utf-8"))[0]
print(row["disks"][0]["source"].rsplit("/", 1)[-1])
PY
)"
gcloud compute disks describe "$DISK" --project="$PROJECT" --zone="$ZONE" --format=json \
  >"$EVIDENCE/disk.post.json"
python3 - "$EVIDENCE/disk.post.json" <<'PY'
import json, sys
disk = json.load(open(sys.argv[1], encoding="utf-8"))
assert int(disk["sizeGb"]) == 30
assert disk["type"].endswith("/diskTypes/pd-standard")
assert disk["sourceImage"].endswith("/images/debian-12-bookworm-v20260817")
PY
printf 'R9_ALLOCATION_PASS zone=%s disk=%s\n' "$ZONE" "$DISK"

sleep 180
gcloud compute scp "$BASE" "$OVERLAY" "$VM:/home/pestypig/" \
  --project="$PROJECT" --zone="$ZONE" --quiet \
  >"$EVIDENCE/scp.stdout.txt" 2>"$EVIDENCE/scp.stderr.txt"

REMOTE_SETUP="$(cat <<'REMOTE'
set -Eeuo pipefail
BASE=/home/pestypig/h2-p8f-c2-r1-cloud-upload-v1.tar
OVERLAY=/home/pestypig/h2-p8j-r2-overlay-upload-v1.tar
ROOT=/home/pestypig/nhm2-h2-p8j-source-v1
[[ -f "$BASE" && ! -L "$BASE" && "$(stat -c %s "$BASE")" == 236492800 ]]
[[ "$(sha256sum "$BASE" | awk '{print $1}')" == fa8d8c994b08fe8a31050feb125eb1d6e4ebb33c9f5de18d5f9e189716936978 ]]
[[ -f "$OVERLAY" && ! -L "$OVERLAY" && "$(stat -c %s "$OVERLAY")" == 225792 ]]
[[ "$(sha256sum "$OVERLAY" | awk '{print $1}')" == 3d49deb1c4044232e2cdd83da6192f2baca26bbc9773b58bbdca85e6109c19a7 ]]
[[ ! -e "$ROOT" ]]
mkdir "$ROOT"
tar -xf "$BASE" -C "$ROOT"
tar -xf "$OVERLAY" -C "$ROOT"
MANIFEST="$ROOT/artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8j-cloud-preflight-v1-20260831/h2-p8j-r2-overlay-source-manifest.v1.tsv"
[[ -f "$MANIFEST" && ! -L "$MANIFEST" && "$(wc -l <"$MANIFEST")" == 17 ]]
tail -n +2 "$MANIFEST" | while IFS=$'\t' read -r sha bytes path; do
  target="$ROOT/$path"
  [[ -f "$target" && ! -L "$target" ]]
  [[ "$(stat -c %s "$target")" == "$bytes" ]]
  [[ "$(sha256sum "$target" | awk '{print $1}')" == "$sha" ]]
done
CONTROLLER="$ROOT/tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/h2_p8j_cloud_run_v1.sh"
[[ "$(sha256sum "$CONTROLLER" | awk '{print $1}')" == 4b8f5722c885980bb0fbac3602ecf36436a66ff1141e4776168f3bbef86276e6 ]]
bash -n "$CONTROLLER"
sudo apt-get update
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y docker.io
sudo systemctl enable --now docker
sudo tee /etc/systemd/system/nhm2-h2-p8j-r9.service >/dev/null <<UNIT
[Unit]
Description=NHM2 candidate-neutral H2 P8J R9 representative attribution
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
sudo systemctl start --no-block nhm2-h2-p8j-r9.service
sleep 5
sudo systemctl is-active --quiet nhm2-h2-p8j-r9.service
printf 'R9_REMOTE_CONTROLLER_ACTIVE\n'
REMOTE
)"
gcloud compute ssh "$VM" --project="$PROJECT" --zone="$ZONE" --quiet \
  --command="$REMOTE_SETUP" \
  >"$EVIDENCE/ssh.stdout.txt" 2>"$EVIDENCE/ssh.stderr.txt"

printf '0\n' >"$EVIDENCE/procedure.exit.txt"
date -u +%FT%TZ >"$EVIDENCE/finish.utc.txt"
printf 'R9_CONTROLLER_LAUNCHED vm=%s zone=%s\n' "$VM" "$ZONE"
trap - EXIT

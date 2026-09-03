#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT=dark-stratum-455714-h4
REGION=us-east1
VM=nhm2-h2-p8p-r16-c2d-32-20260902
ARCHIVE=/home/pestypig/h2-p8p-r16-regional-bulk-upload-v1.tar
EVIDENCE=/home/pestypig/nhm2-h2-p8p-r16-cloudshell-evidence-v1
EXPECTED_ARCHIVE_SHA="${1:?expected archive SHA-256 required}"
EXPECTED_ARCHIVE_BYTES="${2:?expected archive byte count required}"
BASE_SHA=fa8d8c994b08fe8a31050feb125eb1d6e4ebb33c9f5de18d5f9e189716936978
OVERLAY_SHA=4ab0921f2bc7d6bfe85b8b45e294c2058b2f29644fe072e48e2064c7be772b8e
LEDGER_SHA=d7f98f542ee776eec9f6d24173031f2b671bb54e59fd74d44d5b637990f536a6
ORCHESTRATOR_SHA="${3:?expected orchestrator SHA-256 required}"
VM_CREATED=false
ZONE=

[[ "$(id -un)" == pestypig ]]
[[ ! -e "$EVIDENCE" ]]
mkdir "$EVIDENCE"
exec > >(tee "$EVIDENCE/cloudshell.stdout.txt") 2> >(tee "$EVIDENCE/cloudshell.stderr.txt" >&2)
date -u +%FT%TZ >"$EVIDENCE/start.utc.txt"

terminal_cleanup() {
  local exit_code=$?
  if [[ "$exit_code" -ne 0 ]]; then
    printf 'R16_FAIL exit=%s\n' "$exit_code"
    printf '%s\n' "$exit_code" >"$EVIDENCE/procedure.exit.txt"
    date -u +%FT%TZ >"$EVIDENCE/finish.utc.txt"
    if [[ "$VM_CREATED" == true && -n "$ZONE" ]]; then
      gcloud compute instances stop "$VM" --project="$PROJECT" --zone="$ZONE" --quiet \
        >"$EVIDENCE/fail-stop.stdout.txt" 2>"$EVIDENCE/fail-stop.stderr.txt" || true
    fi
  fi
}
trap terminal_cleanup EXIT

[[ -f "$ARCHIVE" && ! -L "$ARCHIVE" ]]
[[ "$(stat -c %s "$ARCHIVE")" == "$EXPECTED_ARCHIVE_BYTES" ]]
[[ "$(sha256sum "$ARCHIVE" | awk '{print $1}')" == "$EXPECTED_ARCHIVE_SHA" ]]
printf '%s  %s\n' "$EXPECTED_ARCHIVE_SHA" "$ARCHIVE" >"$EVIDENCE/archive-hash.txt"

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
printf 'R16_PREEXECUTION_PASS\n'

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
  --max-run-duration=5h \
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
assert row["name"] == "nhm2-h2-p8p-r16-c2d-32-20260902"
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
print(json.load(open(sys.argv[1], encoding="utf-8"))[0]["disks"][0]["source"].rsplit("/", 1)[-1])
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
printf 'R16_ALLOCATION_PASS zone=%s disk=%s\n' "$ZONE" "$DISK"

sleep 180
gcloud compute scp "$ARCHIVE" "$VM:/home/pestypig/" \
  --project="$PROJECT" --zone="$ZONE" --quiet \
  >"$EVIDENCE/scp.stdout.txt" 2>"$EVIDENCE/scp.stderr.txt"

REMOTE_SETUP="$(cat <<REMOTE
set -Eeuo pipefail
ARCHIVE=/home/pestypig/h2-p8p-r16-regional-bulk-upload-v1.tar
STAGE=/home/pestypig/nhm2-h2-p8p-r16-ingress-v1
[[ "\$(id -un)" == pestypig ]]
[[ -f "\$ARCHIVE" && ! -L "\$ARCHIVE" && "\$(stat -c %s "\$ARCHIVE")" == "$EXPECTED_ARCHIVE_BYTES" ]]
[[ "\$(sha256sum "\$ARCHIVE" | awk '{print \$1}')" == "$EXPECTED_ARCHIVE_SHA" ]]
[[ ! -e "\$STAGE" ]]
mkdir "\$STAGE"
tar -xf "\$ARCHIVE" -C "\$STAGE"
[[ "\$(find "\$STAGE" -maxdepth 1 -type f -printf '%f\n' | LC_ALL=C sort | tr '\n' ' ')" == 'h2-p8f-c2-r1-cloud-upload-v1.tar h2-p8p-overlay-upload-v1.tar h2_p8p_r16_cloudshell_orchestrator_v1.sh h2_p8p_r2_browser_guest_sequence_v1.sh ' ]]
[[ "\$(sha256sum "\$STAGE/h2-p8f-c2-r1-cloud-upload-v1.tar" | awk '{print \$1}')" == "$BASE_SHA" ]]
[[ "\$(sha256sum "\$STAGE/h2-p8p-overlay-upload-v1.tar" | awk '{print \$1}')" == "$OVERLAY_SHA" ]]
[[ "\$(sha256sum "\$STAGE/h2_p8p_r2_browser_guest_sequence_v1.sh" | awk '{print \$1}')" == "$LEDGER_SHA" ]]
[[ "\$(sha256sum "\$STAGE/h2_p8p_r16_cloudshell_orchestrator_v1.sh" | awk '{print \$1}')" == "$ORCHESTRATOR_SHA" ]]
mv "\$STAGE/h2-p8f-c2-r1-cloud-upload-v1.tar" /home/pestypig/
mv "\$STAGE/h2-p8p-overlay-upload-v1.tar" /home/pestypig/
mv "\$STAGE/h2_p8p_r2_browser_guest_sequence_v1.sh" /home/pestypig/
sudo tee /etc/systemd/system/nhm2-h2-p8p-r16.service >/dev/null <<UNIT
[Unit]
Description=NHM2 candidate-neutral H2 P8P R16 turnaround calibration
After=network-online.target

[Service]
Type=oneshot
User=pestypig
ExecStart=/bin/bash /home/pestypig/h2_p8p_r2_browser_guest_sequence_v1.sh
StandardOutput=journal+console
StandardError=journal+console
TimeoutStartSec=15000

[Install]
WantedBy=multi-user.target
UNIT
sudo systemctl daemon-reload
sudo systemctl start --no-block nhm2-h2-p8p-r16.service
sleep 5
sudo systemctl is-active --quiet nhm2-h2-p8p-r16.service
printf 'R16_REMOTE_CONTROLLER_ACTIVE\n'
REMOTE
)"
gcloud compute ssh "$VM" --project="$PROJECT" --zone="$ZONE" --quiet \
  --command="$REMOTE_SETUP" \
  >"$EVIDENCE/ssh.stdout.txt" 2>"$EVIDENCE/ssh.stderr.txt"

printf '0\n' >"$EVIDENCE/procedure.exit.txt"
date -u +%FT%TZ >"$EVIDENCE/finish.utc.txt"
printf 'R16_CONTROLLER_LAUNCHED vm=%s zone=%s\n' "$VM" "$ZONE"
trap - EXIT

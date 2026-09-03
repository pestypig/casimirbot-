#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT=dark-stratum-455714-h4
ZONE=us-east1-c
ORIGINAL=nhm2-h2-p8j-r13-c2d-32-20260901
SNAP=nhm2-h2-p8j-r13-evidence-snapshot-20260901
CLONE=nhm2-h2-p8j-r13-evidence-clone-20260901
HELPER=nhm2-h2-p8j-r14-rescue-e2-small-20260901
DEVICE=nhm2-h2-p8j-r13-evidence-clone
EVIDENCE=/home/pestypig/nhm2-h2-p8j-r14-cloudshell-evidence-v1
RESCUE=/home/pestypig/h2_p8j_r14_stopped_disk_rescue_v1.sh
REMOTE_ARCHIVE=/home/pestypig/nhm2-h2-p8j-r13-stopped-disk-evidence-v1.tgz
LOCAL_ARCHIVE=/home/pestypig/nhm2-h2-p8j-r13-stopped-disk-evidence-v1.tgz
OUTER_ARCHIVE=/home/pestypig/nhm2-h2-p8j-r14-cloudshell-evidence-export-v1.tgz
RESCUE_BYTES=2682
RESCUE_SHA=c68a29d0645c6c5400ea0b31c144499711ee7d63784933e11681cc94a89f97f2
HELPER_CREATED=false

[[ ! -e "$EVIDENCE" && ! -e "$LOCAL_ARCHIVE" && ! -e "$OUTER_ARCHIVE" ]]
[[ -f "$RESCUE" && ! -L "$RESCUE" ]]
[[ "$(stat -c %s "$RESCUE")" == "$RESCUE_BYTES" ]]
[[ "$(sha256sum "$RESCUE" | awk '{print $1}')" == "$RESCUE_SHA" ]]
mkdir "$EVIDENCE"
exec > >(tee "$EVIDENCE/cloudshell.stdout.txt") 2> >(tee "$EVIDENCE/cloudshell.stderr.txt" >&2)
date -u +%FT%TZ >"$EVIDENCE/start.utc.txt"

cleanup() {
  local code=$?
  if [[ "$HELPER_CREATED" == true ]]; then
    gcloud compute instances stop "$HELPER" --project="$PROJECT" --zone="$ZONE" --quiet \
      >"$EVIDENCE/helper-stop.stdout.txt" 2>"$EVIDENCE/helper-stop.stderr.txt" || true
  fi
  printf '%s\n' "$code" >"$EVIDENCE/procedure.exit.txt"
  date -u +%FT%TZ >"$EVIDENCE/finish.utc.txt"
  if [[ "$code" -ne 0 ]]; then printf 'R14_FAIL exit=%s\n' "$code"; fi
}
trap cleanup EXIT

gcloud compute instances describe "$ORIGINAL" --project="$PROJECT" --zone="$ZONE" --format=json >"$EVIDENCE/original-instance.json"
SOURCE_DISK="$(python3 - "$EVIDENCE/original-instance.json" <<'PY'
import json, sys
x=json.load(open(sys.argv[1], encoding='utf-8'))
assert x['name']=='nhm2-h2-p8j-r13-c2d-32-20260901' and x['status']=='TERMINATED'
assert len(x['disks'])==1
print(x['disks'][0]['source'].rsplit('/',1)[-1])
PY
)"
[[ "$SOURCE_DISK" == "$ORIGINAL" ]]
gcloud compute disks describe "$SOURCE_DISK" --project="$PROJECT" --zone="$ZONE" --format=json >"$EVIDENCE/source-disk.json"
python3 - "$EVIDENCE/source-disk.json" <<'PY'
import json, sys
x=json.load(open(sys.argv[1], encoding='utf-8'))
assert x['status']=='READY' and int(x['sizeGb'])==30
assert x['type'].endswith('/diskTypes/pd-standard')
PY
for SPEC in "snapshots $SNAP" "disks $CLONE" "instances $HELPER"; do
  read -r KIND NAME <<<"$SPEC"
  if [[ "$KIND" == snapshots ]]; then
    ! gcloud compute snapshots describe "$NAME" --project="$PROJECT" >/dev/null 2>&1
  else
    ! gcloud compute "$KIND" describe "$NAME" --project="$PROJECT" --zone="$ZONE" >/dev/null 2>&1
  fi
done
printf 'R14_PREEXECUTION_PASS source_disk=%s\n' "$SOURCE_DISK"

gcloud compute snapshots create "$SNAP" --project="$PROJECT" --source-disk="$SOURCE_DISK" --source-disk-zone="$ZONE" --snapshot-type=STANDARD --quiet >"$EVIDENCE/snapshot-create.txt" 2>&1
gcloud compute instances create "$HELPER" --project="$PROJECT" --zone="$ZONE" --machine-type=e2-small --provisioning-model=STANDARD --image=projects/debian-cloud/global/images/debian-12-bookworm-v20260817 --boot-disk-size=10GB --boot-disk-type=pd-standard --no-restart-on-failure --max-run-duration=3600s --instance-termination-action=STOP --quiet >"$EVIDENCE/helper-create.txt" 2>&1
HELPER_CREATED=true
gcloud compute disks create "$CLONE" --project="$PROJECT" --zone="$ZONE" --source-snapshot="$SNAP" --size=30GB --type=pd-standard --quiet >"$EVIDENCE/clone-create.txt" 2>&1
gcloud compute instances attach-disk "$HELPER" --project="$PROJECT" --zone="$ZONE" --disk="$CLONE" --device-name="$DEVICE" --mode=ro --quiet >"$EVIDENCE/attach.txt" 2>&1
sleep 180
gcloud compute scp "$RESCUE" "$HELPER:/home/pestypig/" --project="$PROJECT" --zone="$ZONE" --quiet >"$EVIDENCE/rescue-scp.stdout.txt" 2>"$EVIDENCE/rescue-scp.stderr.txt"
gcloud compute ssh "$HELPER" --project="$PROJECT" --zone="$ZONE" --quiet --command="sudo bash /home/pestypig/$(basename "$RESCUE")" >"$EVIDENCE/rescue.stdout.txt" 2>"$EVIDENCE/rescue.stderr.txt"
read -r BYTES SHA < <(python3 - "$EVIDENCE/rescue.stdout.txt" <<'PY'
import re, sys
t=open(sys.argv[1], encoding='utf-8').read()
m=re.search(r'P8J_R13_RESCUE_READY bytes=(\d+) sha256=([0-9a-f]{64})', t)
assert m
print(m.group(1), m.group(2))
PY
)
gcloud compute scp "$HELPER:$REMOTE_ARCHIVE" "$LOCAL_ARCHIVE" --project="$PROJECT" --zone="$ZONE" --quiet >"$EVIDENCE/archive-scp.stdout.txt" 2>"$EVIDENCE/archive-scp.stderr.txt"
[[ "$(stat -c %s "$LOCAL_ARCHIVE")" == "$BYTES" ]]
[[ "$(sha256sum "$LOCAL_ARCHIVE" | awk '{print $1}')" == "$SHA" ]]
printf '%s  %s\n' "$SHA" "$LOCAL_ARCHIVE" >"$EVIDENCE/recovered-archive.sha256.txt"
gcloud compute instances stop "$HELPER" --project="$PROJECT" --zone="$ZONE" --quiet >"$EVIDENCE/helper-stop.stdout.txt" 2>"$EVIDENCE/helper-stop.stderr.txt"
HELPER_CREATED=false
printf '0\n' >"$EVIDENCE/procedure.exit.txt"
date -u +%FT%TZ >"$EVIDENCE/finish.utc.txt"
tar --sort=name --mtime='UTC 2026-09-01' --owner=0 --group=0 --numeric-owner -czf "$OUTER_ARCHIVE" -C /home/pestypig "$(basename "$EVIDENCE")" "$(basename "$LOCAL_ARCHIVE")"
printf 'R14_RECOVERY_PASS bytes=%s sha256=%s outer_bytes=%s outer_sha256=%s\n' "$BYTES" "$SHA" "$(stat -c %s "$OUTER_ARCHIVE")" "$(sha256sum "$OUTER_ARCHIVE" | awk '{print $1}')"
trap - EXIT

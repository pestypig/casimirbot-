#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT=dark-stratum-455714-h4
ZONE=us-east1-c
ORIGINAL=nhm2-h2-p8j-r9-c2d-32-20260831
SNAP=nhm2-h2-p8j-r9-evidence-snapshot-20260901
CLONE=nhm2-h2-p8j-r9-evidence-clone-20260901
HELPER=nhm2-h2-p8j-r10-rescue-e2-small-20260901
DEVICE=nhm2-h2-p8j-r9-evidence-clone
EVIDENCE=/home/pestypig/nhm2-h2-p8j-r10-cloudshell-evidence-v1
RESCUE=/home/pestypig/h2_p8j_r10_stopped_disk_rescue_v1.sh
REMOTE_ARCHIVE=/home/pestypig/nhm2-h2-p8j-r9-stopped-disk-evidence-v1.tgz
LOCAL_ARCHIVE=/home/pestypig/nhm2-h2-p8j-r9-stopped-disk-evidence-v1.tgz
OUTER_ARCHIVE=/home/pestypig/nhm2-h2-p8j-r10-cloudshell-evidence-export-v1.tgz
RESCUE_BYTES=2674
RESCUE_SHA=387637b21e78971daa25011bd19d73275fb99ae873cea59e381683ee74bf85cf
HELPER_CREATED=false

[[ ! -e "$EVIDENCE" && ! -e "$RESCUE" && ! -e "$LOCAL_ARCHIVE" && ! -e "$OUTER_ARCHIVE" ]]
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
  if [[ "$code" -ne 0 ]]; then printf 'R10_FAIL exit=%s\n' "$code"; fi
}
trap cleanup EXIT

RESCUE_B64='IyEvdXNyL2Jpbi9lbnYgYmFzaApzZXQgLUVldW8gcGlwZWZhaWwKCkRFVj0vZGV2L2Rpc2svYnktaWQvZ29vZ2xlLW5obTItaDItcDhqLXI5LWV2aWRlbmNlLWNsb25lCk1OVD0vbW50L25obTItcDhqLXI5LXJlc2N1ZQpDQVA9L2hvbWUvcGVzdHlwaWcvbmhtMi1oMi1wOGotcjktcmVzY3VlLWNhcHR1cmUtdjEKT1VUPS9ob21lL3Blc3R5cGlnL25obTItaDItcDhqLXI5LXN0b3BwZWQtZGlzay1ldmlkZW5jZS12MS50Z3oKCmNsZWFudXAoKSB7CiAgbW91bnRwb2ludCAtcSAiJE1OVCIgJiYgdW1vdW50ICIkTU5UIiB8fCB0cnVlCn0KdHJhcCBjbGVhbnVwIEVYSVQKCltbIC1iICIkREVWIiBdXQpbWyAiJChibG9ja2RldiAtLWdldHJvICIkREVWIikiID09IDEgXV0KW1sgISAtZSAiJENBUCIgJiYgISAtZSAiJE9VVCIgXV0KbWFwZmlsZSAtdCBQQVJUUyA8IDwobHNibGsgLWxucG8gTkFNRSxGU1RZUEUgIiRERVYiIHwgYXdrICckMj09ImV4dDQiIHx8ICQyPT0ieGZzIiB7cHJpbnQgJDF9JykKW1sgIiR7I1BBUlRTW0BdfSIgPT0gMSBdXQpQQVJUPSIke1BBUlRTWzBdfSIKRlM9IiQoYmxraWQgLXMgVFlQRSAtbyB2YWx1ZSAiJFBBUlQiKSIKW1sgLXogIiQoZmluZG1udCAtcm4gLVMgIiRQQVJUIikiIF1dCgpta2RpciAtcCAiJE1OVCIKY2FzZSAiJEZTIiBpbgogIGV4dDQpIG1vdW50IC1vIHJvLG5vbG9hZCAiJFBBUlQiICIkTU5UIiA7OwogIHhmcykgbW91bnQgLW8gcm8sbm9yZWNvdmVyeSAiJFBBUlQiICIkTU5UIiA7OwogICopIGV4aXQgNDEgOzsKZXNhYwpmaW5kbW50IC1ubyBPUFRJT05TICIkTU5UIiB8IHRyICcsJyAnXG4nIHwgZ3JlcCAtcXggcm8KCm1rZGlyICIkQ0FQIgp7CiAgZWNobyBTQ0hFTUE9bmhtMi5oMl9wOGpfcjkuc3RvcHBlZF9kaXNrX3Jlc2N1ZS52MQogIGVjaG8gREVWSUNFPSIkREVWIgogIGVjaG8gREVWSUNFX1JPPSIkKGJsb2NrZGV2IC0tZ2V0cm8gIiRERVYiKSIKICBlY2hvIFBBUlRJVElPTj0iJFBBUlQiCiAgZWNobyBGSUxFU1lTVEVNPSIkRlMiCiAgZWNobyBNT1VOVF9PUFRJT05TPSIkKGZpbmRtbnQgLW5vIE9QVElPTlMgIiRNTlQiKSIKICBsc2JsayAtbyBOQU1FLEtOQU1FLFRZUEUsRlNUWVBFLFNJWkUsUk8sTU9VTlRQT0lOVFMgIiRERVYiCn0gPiIkQ0FQL2RldmljZS1hbmQtbW91bnQudHh0IgoKZm9yIFJFTCBpbiBcCiAgaG9tZS9wZXN0eXBpZy9uaG0yLWgyLXA4ai1ldmlkZW5jZS12MSBcCiAgaG9tZS9wZXN0eXBpZy9uaG0yLWgyLXA4ai1ldmlkZW5jZS1leHBvcnQtdjEudGd6IFwKICB0bXAvcDhqLWRvY2tlci1sb2FkLnR4dCBcCiAgdG1wL3A4ai1maXh0dXJlLWJ1aWxkLnR4dCBcCiAgdG1wL3A4ai10YXJnZXQtYnVpbGQudHh0OyBkbwogIGlmIFtbIC1lICIkTU5ULyRSRUwiIF1dOyB0aGVuCiAgICBjcCAtYSAtLSAiJE1OVC8kUkVMIiAiJENBUC8iCiAgZWxzZQogICAgZWNobyAiJFJFTCBBQlNFTlQiID4+IiRDQVAvYWJzZW50LXBhdGhzLnR4dCIKICBmaQpkb25lCgpDVFJMPSIkTU5UL2hvbWUvcGVzdHlwaWcvbmhtMi1oMi1wOGotc291cmNlLXYxL3Rvb2xzL25obTItc3BoZXJpY2FsLWJvc29uLXN0YXItdjItYnJhbmNoLXByb29mL2cyaC9oMl9wOGpfY2xvdWRfcnVuX3YxLnNoIgppZiBbWyAtZiAiJENUUkwiICYmICEgLUwgIiRDVFJMIiBdXTsgdGhlbgogIHNoYTI1NnN1bSAiJENUUkwiID4iJENBUC9jb250cm9sbGVyLnNoYTI1Ni50eHQiCiAgY3AgLS0gIiRDVFJMIiAiJENBUC9jb250cm9sbGVyLnNvdXJjZS5zaCIKZWxzZQogIGVjaG8gY29udHJvbGxlciBBQlNFTlQgPj4iJENBUC9hYnNlbnQtcGF0aHMudHh0IgpmaQoKaWYgW1sgLWQgIiRNTlQvdmFyL2xvZy9qb3VybmFsIiBdXTsgdGhlbgogIGpvdXJuYWxjdGwgLS1kaXJlY3Rvcnk9IiRNTlQvdmFyL2xvZy9qb3VybmFsIiBcCiAgICAtdSBuaG0yLWgyLXA4ai1yOS5zZXJ2aWNlIC0tbm8tcGFnZXIgXAogICAgPiIkQ0FQL2NvbnRyb2xsZXIuam91cm5hbC50eHQiIFwKICAgIDI+IiRDQVAvY29udHJvbGxlci5qb3VybmFsLnN0ZGVyci50eHQiIHx8IHRydWUKZWxzZQogIGVjaG8gcGVyc2lzdGVudF9qb3VybmFsIEFCU0VOVCA+PiIkQ0FQL2Fic2VudC1wYXRocy50eHQiCmZpCgpmaW5kICIkTU5UL2hvbWUvcGVzdHlwaWciICIkTU5UL3RtcCIgLW1heGRlcHRoIDIgLXhkZXYgXAogIC1wcmludGYgJyV5ICVzICVUQCAlcFxuJyAyPi9kZXYvbnVsbCBcCiAgfCBncmVwIC1FICdwOGp8bmhtMi1oMi1wOGotcjknIFwKICB8IHNvcnQgPiIkQ0FQL3JlbGV2YW50LWZpbGVzeXN0ZW0tbWV0YWRhdGEudHh0IiB8fCB0cnVlCmRhdGUgLXUgKyVGVCVUWiA+IiRDQVAvcmVzY3VlLnV0Yy50eHQiCgp0YXIgLS1zb3J0PW5hbWUgLS1tdGltZT0nVVRDIDIwMjYtMDktMDEnIC0tb3duZXI9MCAtLWdyb3VwPTAgLS1udW1lcmljLW93bmVyIFwKICAtY3pmICIkT1VUIiAtQyAvaG9tZS9wZXN0eXBpZyAiJChiYXNlbmFtZSAiJENBUCIpIgpjaG1vZCAwNjQ0ICIkT1VUIgpjaG93biBwZXN0eXBpZzpwZXN0eXBpZyAiJE9VVCIKQllURVM9IiQoc3RhdCAtYyAlcyAiJE9VVCIpIgpTSEE9IiQoc2hhMjU2c3VtICIkT1VUIiB8IGF3ayAne3ByaW50ICQxfScpIgp1bW91bnQgIiRNTlQiCnRyYXAgLSBFWElUCnByaW50ZiAnUDhKX1I5X1JFU0NVRV9SRUFEWSBieXRlcz0lcyBzaGEyNTY9JXNcbicgIiRCWVRFUyIgIiRTSEEiCg=='
printf '%s' "$RESCUE_B64" | base64 -d >"$RESCUE"
[[ "$(stat -c %s "$RESCUE")" == "$RESCUE_BYTES" ]]
[[ "$(sha256sum "$RESCUE" | awk '{print $1}')" == "$RESCUE_SHA" ]]
chmod 0644 "$RESCUE"

gcloud compute instances describe "$ORIGINAL" --project="$PROJECT" --zone="$ZONE" --format=json >"$EVIDENCE/original-instance.json"
SOURCE_DISK="$(python3 - "$EVIDENCE/original-instance.json" <<'PY'
import json, sys
x=json.load(open(sys.argv[1], encoding='utf-8'))
assert x['name']=='nhm2-h2-p8j-r9-c2d-32-20260831'
assert x['status']=='TERMINATED'
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
printf 'R10_PREEXECUTION_PASS source_disk=%s\n' "$SOURCE_DISK"

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
m=re.search(r'P8J_R9_RESCUE_READY bytes=(\d+) sha256=([0-9a-f]{64})', t)
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
printf 'R10_RECOVERY_PASS bytes=%s sha256=%s outer_bytes=%s outer_sha256=%s\n' "$BYTES" "$SHA" "$(stat -c %s "$OUTER_ARCHIVE")" "$(sha256sum "$OUTER_ARCHIVE" | awk '{print $1}')"
trap - EXIT

#!/usr/bin/env bash
set -Eeuo pipefail

DEV=/dev/disk/by-id/google-nhm2-h2-p8j-r9-evidence-clone
MNT=/mnt/nhm2-p8j-r9-rescue
CAP=/home/pestypig/nhm2-h2-p8j-r9-rescue-capture-v1
OUT=/home/pestypig/nhm2-h2-p8j-r9-stopped-disk-evidence-v1.tgz

cleanup() {
  mountpoint -q "$MNT" && umount "$MNT" || true
}
trap cleanup EXIT

[[ -b "$DEV" ]]
[[ "$(blockdev --getro "$DEV")" == 1 ]]
[[ ! -e "$CAP" && ! -e "$OUT" ]]
mapfile -t PARTS < <(lsblk -lnpo NAME,FSTYPE "$DEV" | awk '$2=="ext4" || $2=="xfs" {print $1}')
[[ "${#PARTS[@]}" == 1 ]]
PART="${PARTS[0]}"
FS="$(blkid -s TYPE -o value "$PART")"
[[ -z "$(findmnt -rn -S "$PART")" ]]

mkdir -p "$MNT"
case "$FS" in
  ext4) mount -o ro,noload "$PART" "$MNT" ;;
  xfs) mount -o ro,norecovery "$PART" "$MNT" ;;
  *) exit 41 ;;
esac
findmnt -no OPTIONS "$MNT" | tr ',' '\n' | grep -qx ro

mkdir "$CAP"
{
  echo SCHEMA=nhm2.h2_p8j_r9.stopped_disk_rescue.v1
  echo DEVICE="$DEV"
  echo DEVICE_RO="$(blockdev --getro "$DEV")"
  echo PARTITION="$PART"
  echo FILESYSTEM="$FS"
  echo MOUNT_OPTIONS="$(findmnt -no OPTIONS "$MNT")"
  lsblk -o NAME,KNAME,TYPE,FSTYPE,SIZE,RO,MOUNTPOINTS "$DEV"
} >"$CAP/device-and-mount.txt"

for REL in \
  home/pestypig/nhm2-h2-p8j-evidence-v1 \
  home/pestypig/nhm2-h2-p8j-evidence-export-v1.tgz \
  tmp/p8j-docker-load.txt \
  tmp/p8j-fixture-build.txt \
  tmp/p8j-target-build.txt; do
  if [[ -e "$MNT/$REL" ]]; then
    cp -a -- "$MNT/$REL" "$CAP/"
  else
    echo "$REL ABSENT" >>"$CAP/absent-paths.txt"
  fi
done

CTRL="$MNT/home/pestypig/nhm2-h2-p8j-source-v1/tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/h2_p8j_cloud_run_v1.sh"
if [[ -f "$CTRL" && ! -L "$CTRL" ]]; then
  sha256sum "$CTRL" >"$CAP/controller.sha256.txt"
  cp -- "$CTRL" "$CAP/controller.source.sh"
else
  echo controller ABSENT >>"$CAP/absent-paths.txt"
fi

if [[ -d "$MNT/var/log/journal" ]]; then
  journalctl --directory="$MNT/var/log/journal" \
    -u nhm2-h2-p8j-r9.service --no-pager \
    >"$CAP/controller.journal.txt" \
    2>"$CAP/controller.journal.stderr.txt" || true
else
  echo persistent_journal ABSENT >>"$CAP/absent-paths.txt"
fi

find "$MNT/home/pestypig" "$MNT/tmp" -maxdepth 2 -xdev \
  -printf '%y %s %T@ %p\n' 2>/dev/null \
  | grep -E 'p8j|nhm2-h2-p8j-r9' \
  | sort >"$CAP/relevant-filesystem-metadata.txt" || true
date -u +%FT%TZ >"$CAP/rescue.utc.txt"

tar --sort=name --mtime='UTC 2026-09-01' --owner=0 --group=0 --numeric-owner \
  -czf "$OUT" -C /home/pestypig "$(basename "$CAP")"
chmod 0644 "$OUT"
chown pestypig:pestypig "$OUT"
BYTES="$(stat -c %s "$OUT")"
SHA="$(sha256sum "$OUT" | awk '{print $1}')"
umount "$MNT"
trap - EXIT
printf 'P8J_R9_RESCUE_READY bytes=%s sha256=%s\n' "$BYTES" "$SHA"

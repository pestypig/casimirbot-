#!/usr/bin/env bash
set -Eeuo pipefail

DEV=/dev/disk/by-id/google-nhm2-h2-p8p-r29-evidence-clone
MNT=/mnt/nhm2-p8p-r29-rescue
CAP=/home/pestypig/nhm2-h2-p8p-r30-inspection-capture-v1
OUT=/home/pestypig/nhm2-h2-p8p-r30-stopped-disk-inspection-v1.tgz
MAX_COPY_BYTES=268435456
MAX_FILE_BYTES=67108864

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
  echo SCHEMA=nhm2.h2_p8p_r30.stopped_disk_inspection.v1
  echo DEVICE="$DEV"
  echo DEVICE_RO="$(blockdev --getro "$DEV")"
  echo PARTITION="$PART"
  echo FILESYSTEM="$FS"
  echo MOUNT_OPTIONS="$(findmnt -no OPTIONS "$MNT")"
  lsblk -o NAME,KNAME,TYPE,FSTYPE,SIZE,RO,MOUNTPOINTS "$DEV"
} >"$CAP/device-and-mount.txt"

record_path() {
  local rel="$1" src="$MNT/$1"
  if [[ ! -e "$src" && ! -L "$src" ]]; then
    printf 'ABSENT %s\n' "$rel" >>"$CAP/exact-path-inventory.txt"
    return
  fi
  [[ ! -L "$src" ]]
  if [[ -f "$src" ]]; then
    local bytes
    bytes="$(stat -c %s "$src")"
    printf 'FILE %s %s ' "$bytes" "$rel" >>"$CAP/exact-path-inventory.txt"
    sha256sum "$src" | awk '{print $1}' >>"$CAP/exact-path-inventory.txt"
  elif [[ -d "$src" ]]; then
    printf 'DIRECTORY %s\n' "$rel" >>"$CAP/exact-path-inventory.txt"
  else
    printf 'OTHER %s\n' "$rel" >>"$CAP/exact-path-inventory.txt"
  fi
}

for REL in \
  home/dan/h2-p8p-r29-upload-v1.tar \
  home/dan/nhm2-h2-p8p-r29-ingress-v1 \
  home/pestypig/h2-p8f-c2-r1-cloud-upload-v1.tar \
  home/pestypig/h2-p8p-overlay-upload-v1.tar \
  home/pestypig/h2_p8p_r2_browser_guest_sequence_v1.sh \
  home/pestypig/nhm2-h2-p8p-source-v1 \
  home/pestypig/nhm2-h2-p8p-evidence-v1 \
  home/pestypig/nhm2-h2-p8p-evidence-export-v1.tgz \
  etc/systemd/system/nhm2-h2-p8p-r29.service \
  tmp/p8p-docker-load.txt \
  tmp/p8p-docker-build.txt \
  var/log/journal \
  var/lib/docker; do
  record_path "$REL"
done

copy_regular() {
  local rel="$1" name="$2" src="$MNT/$1" bytes
  if [[ -f "$src" && ! -L "$src" ]]; then
    bytes="$(stat -c %s "$src")"
    [[ "$bytes" -le "$MAX_FILE_BYTES" ]]
    cp -- "$src" "$CAP/$name"
  fi
}

copy_regular etc/systemd/system/nhm2-h2-p8p-r29.service r29.service
copy_regular home/pestypig/h2_p8p_r2_browser_guest_sequence_v1.sh guest-sequence.sh
copy_regular tmp/p8p-docker-load.txt p8p-docker-load.txt
copy_regular tmp/p8p-docker-build.txt p8p-docker-build.txt

EVIDENCE="$MNT/home/pestypig/nhm2-h2-p8p-evidence-v1"
if [[ -d "$EVIDENCE" && ! -L "$EVIDENCE" ]]; then
  find "$EVIDENCE" -xdev -type l -print -quit | grep -q . && exit 42
  EVIDENCE_BYTES="$(find "$EVIDENCE" -xdev -type f -printf '%s\n' | awk '{s+=$1} END {print s+0}')"
  [[ "$EVIDENCE_BYTES" -le "$MAX_COPY_BYTES" ]]
  find "$EVIDENCE" -xdev -type f -size +"${MAX_FILE_BYTES}"c -print -quit | grep -q . && exit 43
  cp -a -- "$EVIDENCE" "$CAP/"
fi

EXPORT="$MNT/home/pestypig/nhm2-h2-p8p-evidence-export-v1.tgz"
if [[ -f "$EXPORT" && ! -L "$EXPORT" ]]; then
  EXPORT_BYTES="$(stat -c %s "$EXPORT")"
  [[ "$EXPORT_BYTES" -le "$MAX_COPY_BYTES" ]]
  cp -- "$EXPORT" "$CAP/source-evidence-export.tgz"
fi

if [[ -d "$MNT/var/log/journal" && ! -L "$MNT/var/log/journal" ]]; then
  journalctl --directory="$MNT/var/log/journal" \
    -u nhm2-h2-p8p-r29.service --no-pager --output=short-iso-precise --lines=4000 \
    >"$CAP/r29.service.journal.txt" \
    2>"$CAP/r29.service.journal.stderr.txt" || true
else
  echo persistent_journal_absent >"$CAP/r29.service.journal.absent.txt"
fi

find "$MNT/home/dan" "$MNT/home/pestypig" "$MNT/tmp" -maxdepth 3 -xdev \
  -printf '%y %s %T@ %p\n' 2>/dev/null \
  | grep -E 'p8p-r29|nhm2-h2-p8p|p8p-docker' \
  | LC_ALL=C sort >"$CAP/relevant-filesystem-metadata.txt" || true

if [[ -d "$MNT/var/lib/docker/containers" && ! -L "$MNT/var/lib/docker/containers" ]]; then
  find "$MNT/var/lib/docker/containers" -mindepth 1 -maxdepth 2 -xdev \
    -type f \( -name config.v2.json -o -name hostconfig.json \) \
    -printf '%s %p\n' 2>/dev/null | LC_ALL=C sort \
    >"$CAP/docker-container-metadata-inventory.txt" || true
fi

date -u +%FT%TZ >"$CAP/rescue.utc.txt"
tar --sort=name --mtime='UTC 2026-09-04' --owner=0 --group=0 --numeric-owner \
  -czf "$OUT" -C /home/pestypig "$(basename "$CAP")"
chmod 0644 "$OUT"
chown pestypig:pestypig "$OUT"
BYTES="$(stat -c %s "$OUT")"
SHA="$(sha256sum "$OUT" | awk '{print $1}')"
umount "$MNT"
trap - EXIT
printf 'P8P_R30_INSPECTION_READY bytes=%s sha256=%s\n' "$BYTES" "$SHA"

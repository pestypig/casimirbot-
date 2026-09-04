#!/usr/bin/env bash
set -Eeuo pipefail

DEV=/dev/disk/by-id/google-nhm2-h2-p8p-r39-evidence-clone
MNT=/mnt/nhm2-p8p-r39-rescue
CAP=/home/pestypig/nhm2-h2-p8p-r40-fixture-evidence-capture-v1
OUT=/home/pestypig/nhm2-h2-p8p-r40-fixture-evidence-export-v1.tgz
SOURCE_EVIDENCE=home/pestypig/nhm2-h2-p8p-r32-evidence-v1
SOURCE_EXPORT=home/pestypig/nhm2-h2-p8p-r32-evidence-export-v1.tgz
MAX_COPY_BYTES=16777216
MAX_FILE_BYTES=8388608

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
  echo SCHEMA=nhm2.h2_p8p_r40.fixture_evidence_recovery.v1
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
    printf 'FILE %s %s ' "$(stat -c %s "$src")" "$rel" >>"$CAP/exact-path-inventory.txt"
    sha256sum "$src" | awk '{print $1}' >>"$CAP/exact-path-inventory.txt"
  elif [[ -d "$src" ]]; then
    printf 'DIRECTORY %s\n' "$rel" >>"$CAP/exact-path-inventory.txt"
  else
    printf 'OTHER %s\n' "$rel" >>"$CAP/exact-path-inventory.txt"
  fi
}

for REL in \
  "$SOURCE_EVIDENCE" \
  "$SOURCE_EXPORT" \
  home/pestypig/h2_p8p_r39_remote_guard_v1.sh \
  home/pestypig/h2_p8p_r39_remote_launcher_v1.sh \
  home/pestypig/h2-p8p-r16-regional-bulk-upload-v1.tar \
  home/pestypig/h2_p8p_r31_local_image_binding_fixture_v1.sh \
  home/pestypig/h2_p8p_r32_fresh_vm_binding_guest_v1.sh \
  var/lib/docker; do
  record_path "$REL"
done

EVIDENCE="$MNT/$SOURCE_EVIDENCE"
[[ -d "$EVIDENCE" && ! -L "$EVIDENCE" ]]
find "$EVIDENCE" -xdev -type l -print -quit | grep -q . && exit 42
EVIDENCE_BYTES="$(find "$EVIDENCE" -xdev -type f -printf '%s\n' | awk '{s+=$1} END {print s+0}')"
[[ "$EVIDENCE_BYTES" -le "$MAX_COPY_BYTES" ]]
find "$EVIDENCE" -xdev -type f -size +"${MAX_FILE_BYTES}"c -print -quit | grep -q . && exit 43
cp -a -- "$EVIDENCE" "$CAP/"

EXPORT="$MNT/$SOURCE_EXPORT"
[[ -f "$EXPORT" && ! -L "$EXPORT" ]]
EXPORT_BYTES="$(stat -c %s "$EXPORT")"
EXPORT_SHA="$(sha256sum "$EXPORT" | awk '{print $1}')"
[[ "$EXPORT_BYTES" == 5155 ]]
[[ "$EXPORT_SHA" == de12d097b90def46b8d94a8426d8398f7596feb013806d9d8427d4a615c55dcd ]]
cp -- "$EXPORT" "$CAP/source-evidence-export.tgz"

find "$EVIDENCE" -xdev -type f -printf '%P\t%s\t' -exec sha256sum {} \; \
  | LC_ALL=C sort >"$CAP/source-evidence-manifest.txt"
date -u +%FT%TZ >"$CAP/rescue.utc.txt"
tar --sort=name --mtime='UTC 2026-09-04' --owner=0 --group=0 --numeric-owner \
  -czf "$OUT" -C /home/pestypig "$(basename "$CAP")"
chmod 0644 "$OUT"
chown pestypig:pestypig "$OUT"
BYTES="$(stat -c %s "$OUT")"
SHA="$(sha256sum "$OUT" | awk '{print $1}')"
umount "$MNT"
trap - EXIT
printf 'P8P_R40_EVIDENCE_READY bytes=%s sha256=%s\n' "$BYTES" "$SHA"

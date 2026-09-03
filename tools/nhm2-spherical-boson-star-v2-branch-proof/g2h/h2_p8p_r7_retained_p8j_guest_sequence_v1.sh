#!/usr/bin/env bash
set -Eeuo pipefail

HOME_ROOT=/home/pestypig
BASE="$HOME_ROOT/h2-p8f-c2-r1-cloud-upload-v1.tar"
OVERLAY="$HOME_ROOT/h2-p8p-overlay-upload-v1.tar"
ROOT="$HOME_ROOT/nhm2-h2-p8p-source-v1"
EVIDENCE="$HOME_ROOT/nhm2-h2-p8p-evidence-v1"
EXPORT="$HOME_ROOT/nhm2-h2-p8p-evidence-export-v1.tgz"
MANIFEST="$ROOT/h2-p8p-source-manifest.v1.json"
CONTROLLER="$ROOT/tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/h2_p8p_turnaround_calibration_cloud_run_v1.sh"
BASE_BYTES=236492800
BASE_SHA=fa8d8c994b08fe8a31050feb125eb1d6e4ebb33c9f5de18d5f9e189716936978
OVERLAY_BYTES=134656
OVERLAY_SHA=4ab0921f2bc7d6bfe85b8b45e294c2058b2f29644fe072e48e2064c7be772b8e
MANIFEST_BYTES=2820
MANIFEST_SHA=c6ee88481ae7842b176d4c8a2001601c38cc317132c446a086c92b75ddef5aa0
CONTROLLER_BYTES=4498
CONTROLLER_SHA=5af4b629336e166d07a277ae59b0f9776ac9e86b728e762030f27237ed1c8f5b

[[ "$(id -un)" == pestypig ]]
[[ -f "$BASE" && ! -L "$BASE" ]]
[[ "$(stat -c %s "$BASE")" == "$BASE_BYTES" ]]
[[ "$(sha256sum "$BASE" | awk '{print $1}')" == "$BASE_SHA" ]]
[[ -f "$OVERLAY" && ! -L "$OVERLAY" ]]
[[ "$(stat -c %s "$OVERLAY")" == "$OVERLAY_BYTES" ]]
[[ "$(sha256sum "$OVERLAY" | awk '{print $1}')" == "$OVERLAY_SHA" ]]
[[ ! -e "$ROOT" && ! -e "$EVIDENCE" && ! -e "$EXPORT" ]]

for service in nhm2-h2-p8j-r9.service nhm2-h2-p8j-r13.service; do
  ! sudo systemctl is-active --quiet "$service"
done
! pgrep -x mini-boson-star >/dev/null
! sudo docker ps -q | grep -q .

if ! command -v docker >/dev/null 2>&1; then
  exit 70
fi
sudo systemctl enable --now docker
sudo docker version >/dev/null

mkdir -- "$ROOT"
tar -xf "$BASE" -C "$ROOT"
tar -xf "$OVERLAY" -C "$ROOT"
[[ -f "$MANIFEST" && ! -L "$MANIFEST" ]]
[[ "$(stat -c %s "$MANIFEST")" == "$MANIFEST_BYTES" ]]
[[ "$(sha256sum "$MANIFEST" | awk '{print $1}')" == "$MANIFEST_SHA" ]]

python3 - "$ROOT" "$MANIFEST" <<'PY'
import hashlib
import json
import pathlib
import sys

root = pathlib.Path(sys.argv[1])
manifest = json.loads(pathlib.Path(sys.argv[2]).read_text(encoding="utf-8"))
assert manifest["schema"] == "nhm2.g2h_e_s5.c08_h2_p8p_source_manifest.v1"
assert manifest["candidate_neutral"] is True
assert manifest["calibration_panel_count"] == 1024
assert manifest["thread_count"] == 32
entries = manifest["entries"]
assert len(entries) == 11
for entry in entries:
    target = root / entry["path"]
    assert target.is_file() and not target.is_symlink()
    raw = target.read_bytes()
    assert len(raw) == entry["bytes"]
    assert hashlib.sha256(raw).hexdigest() == entry["sha256"]
assert manifest["authority"] == {
    "candidate": False,
    "proof": False,
    "geometry_state": False,
    "lane": False,
    "lamp": False,
    "physical": False,
    "propulsion": False,
    "transport": False,
}
PY

[[ -f "$CONTROLLER" && ! -L "$CONTROLLER" ]]
[[ "$(stat -c %s "$CONTROLLER")" == "$CONTROLLER_BYTES" ]]
[[ "$(sha256sum "$CONTROLLER" | awk '{print $1}')" == "$CONTROLLER_SHA" ]]
bash -n "$CONTROLLER"
sudo bash "$CONTROLLER"

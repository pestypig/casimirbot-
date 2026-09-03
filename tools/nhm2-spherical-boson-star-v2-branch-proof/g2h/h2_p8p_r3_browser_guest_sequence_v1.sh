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

CHUNK_NAMES=(
  h2-p8f-c2-r1-cloud-upload-v1.tar.part01
  h2-p8f-c2-r1-cloud-upload-v1.tar.part02
  h2-p8f-c2-r1-cloud-upload-v1.tar.part03
  h2-p8f-c2-r1-cloud-upload-v1.tar.part04
  h2-p8f-c2-r1-cloud-upload-v1.tar.part05
  h2-p8f-c2-r1-cloud-upload-v1.tar.part06
  h2-p8f-c2-r1-cloud-upload-v1.tar.part07
  h2-p8f-c2-r1-cloud-upload-v1.tar.part08
  h2-p8f-c2-r1-cloud-upload-v1.tar.part09
  h2-p8f-c2-r1-cloud-upload-v1.tar.part10
  h2-p8f-c2-r1-cloud-upload-v1.tar.part11
  h2-p8f-c2-r1-cloud-upload-v1.tar.part12
  h2-p8f-c2-r1-cloud-upload-v1.tar.part13
  h2-p8f-c2-r1-cloud-upload-v1.tar.part14
  h2-p8f-c2-r1-cloud-upload-v1.tar.part15
)
CHUNK_BYTES=(16777216 16777216 16777216 16777216 16777216 16777216 16777216 16777216 16777216 16777216 16777216 16777216 16777216 16777216 1611776)
CHUNK_SHA=(
  0cb73faff7aeb9233383eef45e2db886dd55d3a019efa5cd839dca963b431701
  06b6dfb013fc907524efe28043f4a0b512863364e7ba328c00e6441cc8ec10f6
  4ea450f5ee645b50b158d2ef3c7969327a69659e4977352362daea2e877efec5
  e364ee6499a61bdb87eb40a7c252875f59f567894d2c3bcbbbe9f2f9b927c4ea
  ae4f91c13c39e818c40f2ad49da5f5fc19a355f362bae2e4a0acdb2d27682faa
  d76de7266868561c7906c592ba74ac6e259baba5557b337fbe71b96c6480bda3
  9bea4588032c2b530ae345187e8ca89822a4247d5847df9131c022b9d0210f8a
  ed8c6c88fbda6f97ff54086e219b736887defcbbdad3b6950d175ae4c05eae12
  6b4d30a00211e70e75c07bc66ed4f805c6bbc5bc3ebeacf4df34fc40f9c2d069
  b2cf2121126f1481b6203bec32f934bb7bdb77a42c3a3196fb2aa6b8010561d4
  5a0d92136ff0bb2c22e6ea6bbfe60cc3e42b5b85ab40d6dca4f92f14ff004284
  dca7940f7fac657d2d0fd554c4b3d2d4d4681e783c9776ada2d10448eed65a9e
  431d5821a2cea1c05c428512b1ad5992210b428c47c7bdab1d0e909f70a31891
  7149acefde797c1e16293b3f28af3aaed5531ae16bdba7e96d2aed9a2bcc0313
  9320437ba8258945d01a12a7200e3fe661f252bd508f9ba2d1d68726c0376146
)

[[ "$(id -un)" == pestypig ]]
[[ ! -e "$BASE" && ! -e "$ROOT" && ! -e "$EVIDENCE" && ! -e "$EXPORT" ]]
for i in "${!CHUNK_NAMES[@]}"; do
  part="$HOME_ROOT/${CHUNK_NAMES[$i]}"
  [[ -f "$part" && ! -L "$part" ]]
  [[ "$(stat -c %s "$part")" == "${CHUNK_BYTES[$i]}" ]]
  [[ "$(sha256sum "$part" | awk '{print $1}')" == "${CHUNK_SHA[$i]}" ]]
done
[[ -f "$OVERLAY" && ! -L "$OVERLAY" ]]
[[ "$(stat -c %s "$OVERLAY")" == "$OVERLAY_BYTES" ]]
[[ "$(sha256sum "$OVERLAY" | awk '{print $1}')" == "$OVERLAY_SHA" ]]

: > "$BASE"
for name in "${CHUNK_NAMES[@]}"; do
  cat -- "$HOME_ROOT/$name" >> "$BASE"
done
[[ "$(stat -c %s "$BASE")" == "$BASE_BYTES" ]]
[[ "$(sha256sum "$BASE" | awk '{print $1}')" == "$BASE_SHA" ]]

if ! command -v docker >/dev/null 2>&1; then
  sudo apt-get update
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y docker.io
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

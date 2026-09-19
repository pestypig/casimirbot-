#!/bin/bash
# Inspection only: no model construction, compilation, evolution or deletion.
# Run with a read-only container root and redirect stdout to a new host receipt.
set -euo pipefail
export LC_ALL=C
mesa=/home/docker/mesa
sdk=/home/docker/mesasdk
test -d "$mesa/data"
test -d "$sdk"
printf 'G1_INSTALLED_DEPENDENCY_INVENTORY_V1\n'
printf 'MESA_VERSION '
cat "$mesa/data/version_number"
printf '\nSOURCE_AND_DATA_SHA256\n'
# Hash all installed MESA data, not only guessed active opacity/rate filenames.
# This deliberately includes unused data; it is inventory, not a load trace.
find "$mesa/data" "$mesa/star/defaults" "$mesa/eos/defaults" \
  "$mesa/kap/defaults" "$mesa/star/public" "$mesa/star/private" \
  "$mesa/star/job" "$mesa/chem/public" "$mesa/const/public" \
  "$mesa/net/public" "$mesa/rates/public" -type f -print0 | sort -z | xargs -0 -r sha256sum
printf 'SDK_FILES_SHA256\n'
find "$sdk/bin" "$sdk/lib" -type f -print0 | sort -z | xargs -0 -r sha256sum
printf 'SYMLINK_TARGETS\n'
find "$mesa/data" "$sdk/bin" "$sdk/lib" -type l -printf '%p -> %l\n' | sort
printf 'END_G1_INSTALLED_DEPENDENCY_INVENTORY_V1\n'

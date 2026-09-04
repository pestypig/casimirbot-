#!/usr/bin/env bash
set -Eeuo pipefail

archive=/home/pestypig/h2-p8p-r16-regional-bulk-upload-v1.tar
wrapper=/home/pestypig/h2_p8p_r32_fresh_vm_binding_guest_v1.sh

[[ -f "$archive" && ! -L "$archive" ]]
[[ "$(stat -c %s "$archive")" == 236640768 ]]
[[ "$(sha256sum "$archive" | awk '{print $1}')" == 3c697fa3e238398d3b4c30a6c379fea8d6d545b2228d0c699dd66594a23670b5 ]]
[[ -f "$wrapper" && ! -L "$wrapper" ]]
[[ "$(stat -c %s "$wrapper")" == 3129 ]]
[[ "$(sha256sum "$wrapper" | awk '{print $1}')" == f66d2f72649c36f88c3e03134150967aadfba639f59781facfaa3ed6ccde9a19 ]]
exec bash "$wrapper"

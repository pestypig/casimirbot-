#!/usr/bin/env bash
set -Eeuo pipefail

fixture=/home/pestypig/h2_p8p_r31_local_image_binding_fixture_v1.sh
wrapper=/home/pestypig/h2_p8p_r32_fresh_vm_binding_guest_v1.sh
archive=/home/pestypig/h2-p8p-r16-regional-bulk-upload-v1.tar
launcher=/home/pestypig/h2_p8p_r39_remote_launcher_v1.sh

[[ -f "$fixture" && ! -L "$fixture" ]]
[[ "$(stat -c %s "$fixture")" == 4024 ]]
[[ "$(sha256sum "$fixture" | awk '{print $1}')" == 97c0209284fa67ee33e259a75abfef7947f1f8ce8971af3e7f39a3421ce07c79 ]]
[[ -f "$wrapper" && ! -L "$wrapper" ]]
[[ "$(stat -c %s "$wrapper")" == 3129 ]]
[[ "$(sha256sum "$wrapper" | awk '{print $1}')" == f66d2f72649c36f88c3e03134150967aadfba639f59781facfaa3ed6ccde9a19 ]]
[[ ! -e "$archive" ]]
[[ ! -e "$launcher" ]]
printf '%s\n' R39_REMOTE_GUARD_PASS

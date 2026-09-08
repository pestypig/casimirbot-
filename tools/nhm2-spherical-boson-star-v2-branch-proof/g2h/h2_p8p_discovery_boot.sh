#!/bin/bash
# Called only after authenticated exclusive source extraction by frozen startup.
set -u
shutdown_helper() {
  /usr/bin/timeout --signal=TERM --kill-after=2s 8s /usr/bin/systemctl poweroff --no-block
}
trap shutdown_helper EXIT
if [[ $# != 1 || ! "$1" =~ ^[a-f0-9]{64}$ ]]; then
  exit 64
fi
root="/var/lib/nhm2-discovery-$1"
if [[ ! -d "$root" || -L "$root" ]]; then
  exit 65
fi
# External process timeout does not use the Python serial-drain interval timer.
# The inner diagnostic service has its own 120-second control-group bound.
/usr/bin/timeout --signal=TERM --kill-after=10s 330s \
  /usr/bin/python3 -B "$root/h2_p8p_discovery_boot.py" --boot-once "$1"
status=$?
exit "$status"

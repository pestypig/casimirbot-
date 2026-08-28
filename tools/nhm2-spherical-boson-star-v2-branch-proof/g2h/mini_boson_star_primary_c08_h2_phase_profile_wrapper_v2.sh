#!/bin/sh
set -u

export GMON_OUT_PREFIX=/profile/gmon
/usr/local/bin/mini-boson-star-primary-c08-h2-phase-profile-v1 "$@"
status=$?

set -- /profile/gmon.*
if [ "$1" != '/profile/gmon.*' ] && [ -f "$1" ] && [ "$#" -eq 1 ]; then
    mv "$1" /profile/gmon.out
fi

exit "$status"

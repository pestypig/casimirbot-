"""Explicit outer startup entry. Never import as an execution mechanism."""
import json
import os
import sys
from h2_p8p_discovery_startup import Startup
from h2_p8p_discovery_native import Native, emit_serial
from h2_p8p_discovery_collect import collect_records


def main():
    if os.name != 'posix' or len(sys.argv) != 3 or sys.argv[1] != '--boot-once':
        raise SystemExit('boot_arguments')
    native = Native(sys.argv[2])
    report = Startup().run(sys.argv[2], absent=native.absent, dispatch=native.dispatch,
        stop_service=native.stop_service, collect=collect_records, emit=emit_serial,
        poweroff=native.poweroff, stop_evidence=native.stop_evidence)
    # Serial evidence was emitted before poweroff; this compact final status is
    # only an additional startup-log observation, not durable acceptance.
    print(json.dumps({'attempt_id': sys.argv[2], 'exported': report['exported'],
                      'failure': report['failure'], 'authority': False}, separators=(',', ':')))
    return 0 if report['failure'] is None and report['exported'] else 1


if __name__ == '__main__':
    raise SystemExit(main())

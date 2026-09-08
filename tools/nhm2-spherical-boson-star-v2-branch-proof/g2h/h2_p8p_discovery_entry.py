"""Explicit diagnostic child only; import does not inspect a device."""
import json
import sys
from h2_p8p_discovery_guest import run_guest_diagnostic


if __name__=='__main__':
    if len(sys.argv)!=3 or sys.argv[1]!='--observe-once':
        raise SystemExit('exact_observation_invocation_required')
    result=run_guest_diagnostic(sys.argv[2])
    raw=json.dumps(result,separators=(',',':'),ensure_ascii=True).encode('ascii')
    if len(raw)>65536: raise SystemExit('observation_output_cap')
    sys.stdout.buffer.write(raw)
    sys.stdout.buffer.flush()

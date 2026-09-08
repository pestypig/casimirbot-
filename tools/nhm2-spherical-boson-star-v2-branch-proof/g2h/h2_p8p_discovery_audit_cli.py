"""Explicit local audit of one hash-bound serial capture. No cloud calls."""
import hashlib
import json
import os
import stat
import sys
from h2_p8p_discovery_audit import audit_serial
from h2_p8p_discovery_diagnostic import INSTANCE


def main():
    if len(sys.argv) != 5 or sys.argv[1] != '--audit-serial':
        raise SystemExit('audit_arguments')
    attempt, path, digest = sys.argv[2:]
    info = os.lstat(path)
    if not stat.S_ISREG(info.st_mode) or stat.S_ISLNK(info.st_mode) or info.st_size > 1048576:
        raise ValueError('audit_input_file')
    with open(path, 'rb') as stream:
        raw = stream.read(1048577)
    if len(raw) != info.st_size or hashlib.sha256(raw).hexdigest() != digest:
        raise ValueError('audit_input_binding')
    result = audit_serial(raw, attempt, INSTANCE)
    print(json.dumps(result, separators=(',', ':'), allow_nan=False))


if __name__ == '__main__':
    main()

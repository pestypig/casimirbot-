"""Explicit guest entry; must be launched by the frozen bounded service only."""
import base64
import json
import os
import sys
from h2_p8p_discovery_containment import service_plan, verify_containment
from h2_p8p_discovery_worker import _capture, run_worker
from h2_p8p_discovery_session import run_session


def read_membership():
    if os.name != 'posix':
        raise RuntimeError('posix_required')
    with open('/proc/self/cgroup', 'rb') as stream:
        raw = stream.read(4097)
    if len(raw) > 4096:
        raise ValueError('cgroup_cap')
    return raw


def run_guarded(attempt, *, capture=_capture, membership=read_membership,
                pid=os.getpid, session=run_session, worker=run_worker):
    plan = service_plan(attempt)
    report = {'attempt_id': attempt, 'guard_capture': None, 'membership': None,
              'containment': None, 'session': None, 'failure': None, 'authority': False}
    try:
        result = capture({'argv': plan['show_argv'], 'seconds': 5,
                          'stdout_cap': 4096, 'stderr_cap': 1024}, b'')
        if (not isinstance(result['stdout'], bytes) or len(result['stdout']) > 4096
                or not isinstance(result['stderr'], bytes) or len(result['stderr']) > 1024):
            raise ValueError('guard_capture_cap')
        report['guard_capture'] = {**result,
            'stdout': base64.b64encode(result['stdout']).decode('ascii'),
            'stderr': base64.b64encode(result['stderr']).decode('ascii')}
        if (result['failure'] is not None or result['exit_code'] != 0
                or result['leader_reaped'] is not True or result['group_absent'] is not True):
            raise RuntimeError('guard_command_failed')
        raw = membership()
        if not isinstance(raw, bytes) or len(raw) > 4096:
            raise ValueError('membership_cap')
        report['membership'] = base64.b64encode(raw).decode('ascii')
        report['containment'] = verify_containment(attempt, result['stdout'], raw, pid())
        report['session'] = session(attempt, plan['root'] + '/evidence', worker=worker)
    except Exception as error:
        report['failure'] = type(error).__name__
    return report


def main():
    if len(sys.argv) != 3 or sys.argv[1] != '--session-once' or os.name != 'posix':
        raise SystemExit('guarded_entry_arguments')
    report = run_guarded(sys.argv[2])
    raw = (json.dumps(report, separators=(',', ':'), ensure_ascii=True, allow_nan=False) + '\n').encode('ascii')
    if len(raw) > 32768:
        raise SystemExit('guarded_report_cap')
    sys.stdout.buffer.write(raw)
    sys.stdout.buffer.flush()
    session = report['session']
    return 0 if (report['failure'] is None and session and session['journal_complete']
                 and session['outcome']['failure'] is None) else 1


if __name__ == '__main__':
    raise SystemExit(main())

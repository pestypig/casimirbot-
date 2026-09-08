"""One-shot synthetic Linux checks on the NEW helper boot disk only.

No mount, network, Docker, evidence-clone read or import-time execution.
Fixtures are preserved; an existing fixture directory is a terminal failure.
"""
import json
import os
import sys
import errno
import signal
import re
from pathlib import Path
from h2_p8p_direct_archive import read_archive, ARCHIVE_COMPONENTS
from h2_p8p_hostkey_guest_linux import bounded_command


CASES=('size','hash','leaf','parent','fifo')


def fixture_case_path(attempt_id,name):
    if not isinstance(attempt_id,str) or not re.fullmatch(r'[a-f0-9]{64}',attempt_id):
        raise ValueError('fixture_attempt')
    if name not in CASES:raise ValueError('fixture_case')
    # Direct /mnt children preserve the archive reader's existing narrow grammar.
    # Every file, symlink and worker PID belongs to one of these disjoint paths.
    return Path('/mnt/nhm2-fixture-'+attempt_id+'-'+name)


def run_fixture(attempt_id):
    fixture_case_path(attempt_id,'size')  # validate before signals or filesystem work
    if not sys.platform.startswith('linux'):
        raise RuntimeError('fixture_linux_required')
    def timed_out(signum,frame):
        raise TimeoutError('fixture_total_deadline')
    # TERM/INT must unwind bounded_command's finally while its worker owns a
    # separate process session. Install before any fixture operation.
    previous={s:signal.signal(s,timed_out) for s in (signal.SIGALRM,signal.SIGTERM,signal.SIGINT)}
    signal.alarm(60)
    try:return _run_fixture(attempt_id)
    finally:
        signal.alarm(0)
        for s,handler in previous.items():signal.signal(s,handler)


def _run_fixture(attempt_id):
    checks=[]
    def make_case(name):
        root=fixture_case_path(attempt_id,name)
        root.mkdir(mode=0o700)  # exclusive, no reuse
        (root/'home').mkdir()
        (root/'home'/'pestypig').mkdir()
        return root,root.joinpath(*ARCHIVE_COMPONENTS)
    def reject(root,allowed,name):
        try:
            read_archive(str(root))
        except allowed:
            checks.append(name)
        else:
            raise RuntimeError('fixture_accepted_'+name)
    def reject_symlink(root,name):
        try:read_archive(str(root))
        except OSError as error:
            if error.errno not in (errno.ELOOP,errno.ENOTDIR):raise
            checks.append(name)
        else:raise RuntimeError('fixture_accepted_'+name)
    root,path=make_case('size')
    with path.open('xb') as out:out.write(b'x')
    reject(root,(ValueError,),'wrong_size')
    root,path=make_case('hash')
    with path.open('xb') as out:out.write(bytes(12122))
    try:
        read_archive(str(root))
    except ValueError as error:
        if str(error)!='archive_hash':raise
        checks.append('wrong_hash_after_regular_read')
    else:raise RuntimeError('fixture_hash_accepted')
    root,path=make_case('leaf')
    target=root/'synthetic-target'
    with target.open('xb') as out:out.write(bytes(12122))
    path.symlink_to(target)
    reject_symlink(root,'leaf_symlink')
    # Parent symlink is rejected before following it. Its target is synthetic.
    root=fixture_case_path(attempt_id,'parent');root.mkdir(mode=0o700)
    (root/'synthetic-home').mkdir();(root/'synthetic-home'/'pestypig').mkdir()
    with (root/'synthetic-home'/'pestypig'/ARCHIVE_COMPONENTS[-1]).open('xb') as out:
        out.write(bytes(12122))
    (root/'home').symlink_to(root/'synthetic-home')
    reject_symlink(root,'parent_symlink')
    root,path=make_case('fifo');os.mkfifo(path,0o600)
    reject(root,(ValueError,),'fifo_nonblocking_rejection')
    # Exercise the real bounded subprocess runner, not a mocked termination.
    pidfile=root/'synthetic-worker.pid'
    program="import os,time;from pathlib import Path;Path(%r).write_text(str(os.getpid()));time.sleep(30)"%str(pidfile)
    try:
        bounded_command([sys.executable,'-B','-c',program],seconds=2,cap=1024)
    except TimeoutError as error:
        if str(error)!='command_deadline':raise
        pid=int(pidfile.read_text())
        try:os.kill(pid,0)
        except ProcessLookupError:checks.append('worker_timeout_reaped')
        else:raise RuntimeError('fixture_worker_still_present')
    else:raise RuntimeError('fixture_timeout_not_triggered')
    try:
        bounded_command([sys.executable,'-B','-c',"import sys;sys.stdout.write('x'*8192)"],seconds=5,cap=1024)
    except RuntimeError as error:
        if str(error)!='command_output_cap':raise
        checks.append('worker_output_cap')
    else:raise RuntimeError('fixture_output_cap_not_triggered')
    result={'schema':'nhm2-cloud-linux-fixture-v1','pass':True,'checks':checks}
    print(json.dumps(result,separators=(',',':')),flush=True)
    return result


if __name__=='__main__':
    if len(sys.argv)!=2:raise SystemExit('fixture_attempt_required')
    run_fixture(sys.argv[1])

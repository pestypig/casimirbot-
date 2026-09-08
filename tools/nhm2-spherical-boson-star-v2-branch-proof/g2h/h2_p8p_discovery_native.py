"""Explicit Linux adapters for the diagnostic startup; import has no effects."""
import os
import base64
import stat
import time
from h2_p8p_discovery_worker import _capture


class Native:
    def __init__(self, attempt, *, capture=_capture):
        from h2_p8p_discovery_containment import service_plan
        self.plan = service_plan(attempt)
        self.capture = capture
        self.stop_receipt = None

    def command(self, argv, seconds, stdout=1024, stderr=512):
        return self.capture({'argv': argv, 'seconds': seconds,
                             'stdout_cap': stdout, 'stderr_cap': stderr}, b'')

    @staticmethod
    def ok(result):
        return (result['exit_code'] == 0 and result['failure'] is None
                and result['leader_reaped'] is True and result['group_absent'] is True)

    def absent(self, unit):
        if unit != self.plan['unit']:
            raise ValueError('native_unit')
        result = self.command(['/usr/bin/systemctl', 'show', unit, '--property=LoadState', '--no-pager'], 5)
        return (result['stdout'] == b'LoadState=not-found\n'
                and self.ok(result))

    def dispatch(self, plan):
        if plan != self.plan:
            raise ValueError('native_plan')
        return self.command(plan['argv'], 145, 32768, 4096)

    def stop_evidence(self):
        if self.stop_receipt is None:
            return None
        receipt = {'cgroup_empty': self.stop_receipt['cgroup_empty']}
        for key in ('command', 'observation'):
            value = self.stop_receipt[key]
            if value is None:
                receipt[key] = None
                continue
            if len(value['stdout']) > 1024 or len(value['stderr']) > 512:
                raise ValueError('stop_receipt_cap')
            receipt[key] = {**value,
                'stdout': base64.b64encode(value['stdout']).decode('ascii'),
                'stderr': base64.b64encode(value['stderr']).decode('ascii')}
        return receipt

    def stop_service(self, unit):
        if unit != self.plan['unit']:
            raise ValueError('native_unit')
        stopped = self.command(['/usr/bin/systemctl', 'stop', unit], 15)
        self.stop_receipt = {'command': stopped, 'observation': None, 'cgroup_empty': None}
        result = self.command(['/usr/bin/systemctl', 'show', unit, '--no-pager',
                               '--property=MainPID,ActiveState,LoadState'], 5)
        self.stop_receipt['observation'] = result
        if not self.ok(result):
            return False
        lines = result['stdout'].splitlines()
        if len(lines) != 3 or set(lines) not in (
                {b'MainPID=0', b'ActiveState=inactive', b'LoadState=loaded'},
                {b'MainPID=0', b'ActiveState=failed', b'LoadState=loaded'},
                {b'MainPID=0', b'ActiveState=inactive', b'LoadState=not-found'}):
            return False
        self.stop_receipt['cgroup_empty'] = cgroup_empty(unit)
        return self.stop_receipt['cgroup_empty']

    def poweroff(self):
        result = self.command(['/usr/bin/systemctl', 'poweroff', '--no-block'], 5)
        if not self.ok(result):
            raise RuntimeError('poweroff_request_unconfirmed')


def cgroup_empty(unit):
    path = '/sys/fs/cgroup/system.slice/' + unit
    try:
        fd = os.open(path, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW)
    except FileNotFoundError:
        return True
    try:
        events = os.open('cgroup.events', os.O_RDONLY | os.O_NOFOLLOW, dir_fd=fd)
        try:
            raw = os.read(events, 1025)
            if len(raw) > 1024:
                return False
            lines = raw.splitlines()
            return sum(line.startswith(b'populated ') for line in lines) == 1 and b'populated 0' in lines
        finally:
            os.close(events)
    finally:
        os.close(fd)


def emit_serial(frames):
    if sum(map(len, frames)) > 1048576:
        raise ValueError('serial_output_cap')
    fd = os.open('/dev/ttyS0', os.O_WRONLY | os.O_NOFOLLOW | os.O_NONBLOCK)
    deadline = time.monotonic() + 90
    try:
        info = os.fstat(fd)
        if not stat.S_ISCHR(info.st_mode) or os.major(info.st_rdev) != 4 or os.minor(info.st_rdev) != 64:
            raise ValueError('serial_device_identity')
        for frame in frames:
            offset = 0
            while offset < len(frame):
                if time.monotonic() >= deadline:
                    raise TimeoutError('serial_deadline')
                try:
                    count = os.write(fd, frame[offset:])
                    if count <= 0:
                        raise OSError('serial_write')
                    offset += count
                except BlockingIOError:
                    time.sleep(.01)
        bounded_drain(fd, deadline)
    finally:
        os.close(fd)


def bounded_drain(fd, deadline):
    # Linux main-thread only. Do not replace an outer timer silently.
    import signal
    import termios
    remaining = deadline - time.monotonic()
    if remaining <= 0:
        raise TimeoutError('serial_drain_deadline')
    previous = signal.getitimer(signal.ITIMER_REAL)
    if previous != (0.0, 0.0):
        raise RuntimeError('serial_drain_timer_conflict')
    handler = signal.getsignal(signal.SIGALRM)
    def expired(*args):
        raise TimeoutError('serial_drain_deadline')
    signal.signal(signal.SIGALRM, expired)
    try:
        signal.setitimer(signal.ITIMER_REAL, remaining)
        termios.tcdrain(fd)
        if time.monotonic() >= deadline:
            raise TimeoutError('serial_drain_deadline')
    finally:
        signal.setitimer(signal.ITIMER_REAL, 0)
        signal.signal(signal.SIGALRM, handler)

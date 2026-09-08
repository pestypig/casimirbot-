"""Read-only Linux diagnostic adapter; no CLI, export, mount or import-time work.

An authorized outer executor must authenticate instance/clone provenance and
enforce an aggregate timeout. Import and local injected tests grant no execution.
"""
import base64
import json
import os
import re
import selectors
import signal
import stat
import subprocess
import time
from h2_p8p_discovery_diagnostic import ALIAS, INSTANCE, diagnostic_commands, diagnostic_receipt
from h2_p8p_hostkey_guest_linux import parse_mounts

GUARD_CODES=frozenset({'device_guard','capture_contract','device_changed','not_block_device',
    'block_not_readonly','kernel_read_cap','not_whole_disk','sysfs_inventory_cap',
    'partition_name','partition_count','partition_device_changed','diagnostic_device_mounted',
    'alias_changed','resolved_device_path','inventory_byte_cap','version_cap'})


def failure_code(error):
    return str(error) if str(error) in GUARD_CODES else type(error).__name__


def _small_read(path, cap):
    with open(path, 'rb') as stream:
        value = stream.read(cap + 1)
    if len(value) > cap:
        raise ValueError('kernel_read_cap')
    return value


def probe_device():
    """Read kernel identity/mode/mount state for only the fixed alias family."""
    if os.name != 'posix':
        raise RuntimeError('linux_required')
    import array
    import fcntl
    device = os.path.realpath(ALIAS)
    diagnostic_commands(device)  # restrictive resolved-device grammar

    def block_identity(path):
        fd = os.open(path, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK)
        try:
            info = os.fstat(fd)
            if not stat.S_ISBLK(info.st_mode): raise ValueError('not_block_device')
            mode = array.array('i', [0])
            fcntl.ioctl(fd, 0x125E, mode, True)  # BLKROGET only
            if mode[0] != 1: raise ValueError('block_not_readonly')
            return f'{os.major(info.st_rdev)}:{os.minor(info.st_rdev)}'
        finally:
            os.close(fd)

    number = block_identity(device)
    sysroot = os.path.realpath('/sys/dev/block/' + number)
    if not sysroot.startswith('/sys/devices/') or os.path.exists(sysroot + '/partition'):
        raise ValueError('not_whole_disk')
    children = os.listdir(sysroot)
    if len(children) > 128: raise ValueError('sysfs_inventory_cap')
    family = [{'path': device, 'number': number, 'readonly': True}]
    for name in sorted(children):
        if not os.path.isfile(sysroot + '/' + name + '/partition'): continue
        if not re.fullmatch(r'[A-Za-z0-9_-]+', name): raise ValueError('partition_name')
        if len(family) >= 17: raise ValueError('partition_count')
        expected = _small_read(sysroot + '/' + name + '/dev', 64).decode('ascii').strip()
        observed = block_identity('/dev/' + name)
        if expected != observed: raise ValueError('partition_device_changed')
        family.append({'path': '/dev/' + name, 'number': observed, 'readonly': True})
    numbers = {item['number'] for item in family}
    mounts = parse_mounts(_small_read('/proc/self/mountinfo', 65536).decode('utf8'))
    if any(item['device'] in numbers or item['target'].startswith('/mnt/nhm2-') for item in mounts):
        raise ValueError('diagnostic_device_mounted')
    if os.path.realpath(ALIAS) != device or block_identity(device) != number:
        raise ValueError('alias_changed')
    return {'alias': ALIAS, 'device': device, 'family': family, 'unmounted': True}


def capture_command(argv, *, device, stdout_cap):
    """Capture one closed read-only command, including bounded failure output."""
    commands = diagnostic_commands(device)
    if argv not in commands or stdout_cap != (256 if argv == commands[0] else 8192):
        raise ValueError('command_scope')
    if os.name != 'posix': raise RuntimeError('linux_required')
    started = time.monotonic()
    output = [bytearray(), bytearray()]
    caps = [stdout_cap, 512]
    failure = None; child = None; selector = None; leader_reaped = False
    group_absent = False; exit_code = None
    try:
        child = subprocess.Popen(argv, stdin=subprocess.DEVNULL, stdout=subprocess.PIPE,
            stderr=subprocess.PIPE, start_new_session=True, shell=False)
        selector = selectors.DefaultSelector()
        selector.register(child.stdout, selectors.EVENT_READ, 0)
        selector.register(child.stderr, selectors.EVENT_READ, 1)
        while selector.get_map():
            remaining = started + 10 - time.monotonic()
            if remaining <= 0: raise TimeoutError()
            for key, _ in selector.select(min(remaining, .1)):
                chunk = os.read(key.fileobj.fileno(), 4096)
                if not chunk:
                    selector.unregister(key.fileobj)
                    continue
                index = key.data; free = caps[index] - len(output[index])
                output[index].extend(chunk[:free])
                if len(chunk) > free:
                    failure = 'output_cap'; raise RuntimeError()
        exit_code = child.wait(timeout=max(.001, started + 10 - time.monotonic()))
        if exit_code != 0: failure = 'command_nonzero'
    except (TimeoutError, subprocess.TimeoutExpired):
        failure = 'command_timeout'
    except Exception:
        failure = failure or 'command_exception'
    finally:
        if child is not None:
            try:
                try: os.killpg(child.pid, signal.SIGKILL)
                except ProcessLookupError: pass
                exit_code = child.wait(timeout=5)
                leader_reaped = True
                try: os.killpg(child.pid, 0)
                except ProcessLookupError: group_absent = True
            except Exception:
                failure = failure or 'cleanup_unconfirmed'
            if selector is not None: selector.close()
            child.stdout.close(); child.stderr.close()
            if not leader_reaped or not group_absent: failure = failure or 'cleanup_unconfirmed'
    return {'argv': argv, 'stdout': bytes(output[0]), 'stderr': bytes(output[1]),
        'exit_code': exit_code, 'failure': failure, 'leader_reaped': leader_reaped,
        'group_absent': group_absent, 'elapsed_ms': round((time.monotonic()-started)*1000)}


def run_guest_diagnostic(attempt, *, probe=probe_device, capture=capture_command):
    """One planned comparison; command failure is terminal and preserves prefix."""
    if not isinstance(attempt, str) or not re.fullmatch(r'[a-f0-9]{64}', attempt):
        raise ValueError('attempt_identity')
    records=[]; before=None; after=None; diagnostic=None; failure=None; phase='device_before'
    post_failure=None
    try:
        before=probe()
        if before.get('alias') != ALIAS or before.get('unmounted') is not True:
            raise ValueError('device_guard')
        device=before['device']
        for index, argv in enumerate(diagnostic_commands(device)):
            phase=('version','baseline','explicit_tree')[index]
            result=capture(argv, device=device, stdout_cap=256 if index==0 else 8192)
            if (not isinstance(result.get('stdout'), bytes) or not isinstance(result.get('stderr'), bytes)
                or len(result['stdout']) > (256 if index==0 else 8192) or len(result['stderr'])>512):
                raise ValueError('capture_contract')
            records.append({**result, 'stdout':base64.b64encode(result['stdout']).decode('ascii'),
                            'stderr':base64.b64encode(result['stderr']).decode('ascii')})
            if result['failure'] is not None or result['exit_code'] != 0 or result['leader_reaped'] is not True or result['group_absent'] is not True:
                failure=result['failure'] or 'capture_incomplete'; break
    except Exception as error:
        # Known guard codes only, never arbitrary command arguments or secrets.
        failure=failure_code(error)
    # One post-observation guard even after command failure. No command retry.
    # The authorized outer worker must bound this probe as well as the commands.
    if before is not None:
        try:
            after=probe()
            if before != after: post_failure='device_changed'
        except Exception as error:
            post_failure=failure_code(error)
        if post_failure is not None:
            if failure is None: phase='device_after'
            failure=failure or 'post_probe_failed'
    if failure is None:
        phase='receipt'
        try:
            diagnostic=diagnostic_receipt(instance=INSTANCE, attempt=attempt, alias=ALIAS,
                device=device, version=base64.b64decode(records[0]['stdout']),
                baseline=base64.b64decode(records[1]['stdout']), tree=base64.b64decode(records[2]['stdout']))
        except Exception as error:
            failure=type(error).__name__
    result={'schema':'nhm2-discovery-guest-observation-v1','attempt_id':attempt,
        'phase':phase,'failure':failure,'before':before,'after':after,
        'post_probe_failure':post_failure,'commands':records,
        'diagnostic':diagnostic,'mount_attempted':False}
    # This is a local envelope, NOT the earlier 24KiB transport receipt. Export
    # must preserve it via a separately bounded protocol; never silently truncate.
    if len(json.dumps(result,separators=(',',':'),ensure_ascii=True).encode('ascii'))>65536:
        raise ValueError('guest_envelope_cap')
    return result

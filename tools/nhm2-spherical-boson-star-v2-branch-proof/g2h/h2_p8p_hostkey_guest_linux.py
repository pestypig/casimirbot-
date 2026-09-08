"""Linux executor for the public-host-key guest core; no automatic entry point.

Importing this file performs no command, mount, metadata or cloud operation.
The future frozen startup procedure must construct and call this explicitly.
"""
import json
import os
import re
import selectors
import signal
import stat
import subprocess
import time
import urllib.request
import base64
import sys
from h2_p8p_hostkey_guest import read_public_key


def bounded_command(argv, seconds=20, cap=65536):
    if os.name != 'posix':
        raise RuntimeError('linux_required')
    child = subprocess.Popen(argv, stdin=subprocess.DEVNULL, stdout=subprocess.PIPE,
                             stderr=subprocess.PIPE, start_new_session=True)
    output = [bytearray(), bytearray()]
    selector = selectors.DefaultSelector()
    completed = False
    try:
        selector.register(child.stdout, selectors.EVENT_READ, 0)
        selector.register(child.stderr, selectors.EVENT_READ, 1)
        deadline = time.monotonic() + seconds
        while selector.get_map():
            remaining = deadline - time.monotonic()
            if remaining <= 0:
                raise TimeoutError('command_deadline')
            for key, _ in selector.select(min(remaining, 0.2)):
                chunk = os.read(key.fileobj.fileno(), 4096)
                if not chunk:
                    selector.unregister(key.fileobj)
                else:
                    if sum(map(len, output)) + len(chunk) > cap:
                        raise RuntimeError('command_output_cap')
                    output[key.data].extend(chunk)
        result = child.wait(timeout=max(0.01, deadline - time.monotonic()))
        if result != 0:
            raise RuntimeError('command_nonzero')
        completed = True
        return bytes(output[0])
    finally:
        # Kill the private group on failure, including a surviving mount helper.
        try:
            if not completed:
                try:
                    os.killpg(child.pid, signal.SIGKILL)
                except ProcessLookupError:
                    pass
                if child.poll() is None:
                    child.wait(timeout=5)
        finally:
            selector.close()
            child.stdout.close()
            child.stderr.close()


def select_partition(data, disk_path):
    """Accept one RO disk and exactly one supported filesystem partition."""
    disks = data.get('blockdevices')
    if not isinstance(disks, list) or len(disks) != 1:
        raise ValueError('disk_inventory')
    disk = disks[0]
    if disk.get('path') != disk_path or disk.get('type') != 'disk' or disk.get('ro') is not True:
        raise ValueError('disk_identity_or_mode')
    partitions = disk.get('children', [])
    if not isinstance(partitions, list) or not 1 <= len(partitions) <= 16:
        raise ValueError('partition_inventory')
    matches = []
    for item in partitions:
        if item.get('type') != 'part' or item.get('children') or item.get('ro') is not True:
            raise ValueError('partition_shape_or_mode')
        filesystem = item.get('fstype')
        if filesystem not in (None, '', 'vfat', 'ext4', 'xfs'):
            raise ValueError('unsupported_partition')
        if filesystem in ('ext4', 'xfs'):
            if not re.fullmatch(r'/dev/[A-Za-z0-9_-]+', item.get('path', '')):
                raise ValueError('partition_path')
            if not re.fullmatch(r'\d+:\d+', item.get('maj:min', '')):
                raise ValueError('partition_device_number')
            matches.append(item)
    if len(matches) != 1:
        raise ValueError('ambiguous_filesystem')
    return matches[0]


def parse_mounts(text):
    if len(text.encode('utf8')) > 65536:
        raise ValueError('mountinfo_cap')
    result = []
    for line in text.splitlines():
        before, separator, after = line.partition(' - ')
        left, right = before.split(), after.split()
        if not separator or len(left) < 6 or len(right) < 3:
            raise ValueError('mountinfo_shape')
        # We never create escaped mountpoint names. Preserve kernel escaping
        # elsewhere; only exact fixed paths and device numbers are compared.
        result.append({'device':left[2], 'target':left[4], 'root':left[3],
                       'options':set(left[5].split(',')), 'filesystem':right[0],
                       'super_options':set(right[2].split(','))})
    return result


class LinuxGuestOps:
    def __init__(self, *, device_alias, mountpoint, instance_id, attempt_id,
                 runner=bounded_command):
        if not re.fullmatch(r'/dev/disk/by-id/google-nhm2-[a-z0-9-]+', device_alias):
            raise ValueError('alias')
        if not re.fullmatch(r'/mnt/nhm2-[a-z0-9-]+', mountpoint):
            raise ValueError('mountpoint')
        if not re.fullmatch(r'[1-9][0-9]*', instance_id) or not re.fullmatch(r'[a-f0-9]{64}', attempt_id):
            raise ValueError('receipt_identity')
        self.alias, self.mountpoint = device_alias, mountpoint
        self.instance_id, self.attempt_id = instance_id, attempt_id
        self.runner = runner
        self.partition = None

    def discover(self):
        disk_path = os.path.realpath(self.alias)
        if not stat.S_ISBLK(os.stat(disk_path).st_mode):
            raise ValueError('not_block_device')
        data = json.loads(self.runner(['/usr/bin/lsblk','--json','--bytes','--paths',
             '--output','PATH,TYPE,RO,FSTYPE,MAJ:MIN','--',disk_path]))
        self.disk_path = disk_path
        self.partition = select_partition(data, disk_path)
        # Exclusive new empty mountpoint. Existing paths are not reused.
        os.mkdir(self.mountpoint, 0o700)
        return self.partition['path'], self.partition['fstype']

    def verify_device(self, device):
        import fcntl
        import array
        if not self.partition or device != self.partition['path'] or os.path.realpath(self.alias) != self.disk_path:
            raise ValueError('device_changed')
        for path in (self.disk_path, device):
            fd = os.open(path, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK)
            try:
                info = os.fstat(fd)
                if not stat.S_ISBLK(info.st_mode):
                    raise ValueError('not_block_device')
                if path == device and f'{os.major(info.st_rdev)}:{os.minor(info.st_rdev)}' != self.partition['maj:min']:
                    raise ValueError('device_number_changed')
                mode = array.array('i', [0])
                fcntl.ioctl(fd, 0x125E, mode, True)  # BLKROGET, read-only query
                if mode[0] != 1:
                    raise ValueError('block_not_readonly')
            finally:
                os.close(fd)

    def mounts(self):
        with open('/proc/self/mountinfo', 'rb') as stream:
            value = stream.read(65537)
        if len(value) > 65536:
            raise ValueError('mountinfo_cap')
        return parse_mounts(value.decode('utf8', errors='strict'))

    def assert_unmounted(self, device, mountpoint):
        if device != self.partition['path'] or mountpoint != self.mountpoint:
            raise ValueError('mount_identity')
        if any(m['device'] == self.partition['maj:min'] or m['target'] == mountpoint for m in self.mounts()):
            raise ValueError('still_mounted')

    def command(self, argv):
        mount = ['mount','-t',self.partition['fstype'],'-o',
                 {'ext4':'ro,noload','xfs':'ro,norecovery'}[self.partition['fstype']],
                 '--',self.partition['path'],self.mountpoint]
        unmount = ['umount','--',self.mountpoint]
        if argv not in (mount, unmount):
            raise ValueError('command_not_allowed')
        # Internal-only avoids executing external filesystem helpers.
        return self.runner(['/usr/bin/'+argv[0], '--internal-only', *argv[1:]])

    def verify_readonly_mount(self, device, mountpoint, filesystem, options):
        self.verify_device(device)
        matches = [m for m in self.mounts() if m['device'] == self.partition['maj:min'] or m['target'] == mountpoint]
        if len(matches) != 1:
            raise ValueError('mount_not_unique')
        m = matches[0]
        if (m['target'] != self.mountpoint or m['device'] != self.partition['maj:min']
                or m['root'] != '/' or m['filesystem'] != filesystem
                or 'ro' not in m['options'] or 'rw' in m['options']
                or 'ro' not in m['super_options'] or 'rw' in m['super_options']):
            raise ValueError('mount_not_readonly')
        if not ({'noload','norecovery'} & m['super_options']):
            raise ValueError('recovery_not_disabled')

    def read_public_key(self, mountpoint):
        if mountpoint != self.mountpoint:
            raise ValueError('mount_identity')
        return read_public_key(mountpoint)

    def export(self, receipt):
        if set(receipt) - {'pass','failure','cleanup_failure','mount_attempted','unmounted','public_key'}:
            raise ValueError('receipt_fields')
        payload = json.dumps({**receipt,'schema':'nhm2-public-hostkey-v1','instance_id':self.instance_id,
              'attempt_id':self.attempt_id}, separators=(',',':')).encode('ascii')
        if len(payload) > 4096:
            raise ValueError('receipt_cap')
        # Socket inactivity limits are insufficient. A private worker is killed
        # by the parent after five seconds, plus at most five seconds kill wait.
        # Only bounded PUBLIC receipt data is passed, never credentials.
        self.runner([sys.executable,'-B',os.path.abspath(__file__),'--export-once',
                     base64.b64encode(payload).decode('ascii')], seconds=5, cap=4096)


def export_once(payload):
    if not isinstance(payload, bytes) or not 0 < len(payload) <= 4096:
        raise ValueError('receipt_cap')
    url='http://metadata.google.internal/computeMetadata/v1/instance/guest-attributes/nhm2-hostkey/receipt'
    request=urllib.request.Request(url, data=payload, method='PUT', headers={'Metadata-Flavor':'Google','Content-Type':'application/json'})
    class NoRedirect(urllib.request.HTTPRedirectHandler):
        def redirect_request(self, *args, **kwargs):
            raise RuntimeError('metadata_redirect')
    opener=urllib.request.build_opener(urllib.request.ProxyHandler({}), NoRedirect())
    with opener.open(request, timeout=5) as response:
        if response.status != 200 or response.headers.get('Metadata-Flavor') != 'Google':
            raise RuntimeError('metadata_response')
        if len(response.read(1025)) > 1024:
            raise RuntimeError('metadata_response_cap')


if __name__ == '__main__':
    # Export-worker entry only; no mount/startup controller is exposed.
    if len(sys.argv) != 3 or sys.argv[1] != '--export-once' or len(sys.argv[2]) > 5464:
        raise SystemExit('invalid_worker_invocation')
    export_once(base64.b64decode(sys.argv[2], validate=True))

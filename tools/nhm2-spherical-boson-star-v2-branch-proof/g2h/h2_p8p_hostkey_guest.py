"""Read-only Linux guest core. Import-safe; no startup entry point yet.

The executor supplies bounded command execution, read-only block identity
verification, and guest-attribute export. Never read a private-key path.
"""
import os
import stat
import re
import base64


def read_public_key(mountpoint):
    """Open every path component without following symlinks (Linux only)."""
    if not re.fullmatch(r'/mnt/[A-Za-z0-9_-]+', mountpoint):
        raise ValueError('invalid_mountpoint')
    flags = os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW
    root = os.open('/', flags)
    descriptors = [root]
    try:
        for component in (*mountpoint.strip('/').split('/'), 'etc', 'ssh'):
            root = os.open(component, flags, dir_fd=root)
            descriptors.append(root)
        fd = os.open('ssh_host_ed25519_key.pub', os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK, dir_fd=root)
        descriptors.append(fd)
        info = os.fstat(fd)
        if not stat.S_ISREG(info.st_mode) or not 0 < info.st_size <= 16384:
            raise ValueError('public_key_type_or_size')
        content = os.read(fd, 16385)
        if len(content) != info.st_size:
            raise ValueError('public_key_changed_or_truncated')
        return content
    finally:
        for fd in reversed(descriptors):
            os.close(fd)


def collect_key(ops, device, mountpoint, filesystem):
    """Single mount/read with unmount-before-export, including failure paths.

    All ops must be deadline-bounded. verify_device must authenticate the exact
    clone and require the block device read-only. assert_unmounted must inspect
    the mountpoint AND all mounts of the source device. No retries here.
    """
    options = {'ext4': 'ro,noload', 'xfs': 'ro,norecovery'}
    if filesystem not in options:
        raise ValueError('unsupported_filesystem')
    if not isinstance(device, str) or not re.fullmatch(r'/dev/[A-Za-z0-9_/-]+', device):
        raise ValueError('invalid_device')
    if not isinstance(mountpoint, str) or not re.fullmatch(r'/mnt/[A-Za-z0-9_-]+', mountpoint):
        raise ValueError('invalid_mountpoint')
    attempted = False
    content = None
    failure = None
    cleanup_failure = None
    try:
        ops.verify_device(device)
        ops.assert_unmounted(device, mountpoint)
        attempted = True  # mount can succeed despite a lost command result
        ops.command(['mount', '-t', filesystem, '-o', options[filesystem], '--', device, mountpoint])
        ops.verify_readonly_mount(device, mountpoint, filesystem, options[filesystem])
        content = ops.read_public_key(mountpoint)
        if not isinstance(content, bytes) or not 0 < len(content) <= 16384:
            raise ValueError('public_key_type_or_size')
        content = content.decode('ascii')
        match = re.fullmatch(r'ssh-ed25519 ([A-Za-z0-9+/]+={0,2})(?: [\x20-\x7e]*)?\n?', content)
        if not match:
            raise ValueError('public_key_record')
        wire = base64.b64decode(match[1], validate=True)
        if (base64.b64encode(wire).decode('ascii') != match[1] or len(wire) != 51
                or wire[:19] != b'\x00\x00\x00\x0bssh-ed25519\x00\x00\x00\x20'):
            raise ValueError('public_key_wire')
        content = 'ssh-ed25519 ' + match[1]
    except Exception as error:
        failure = type(error).__name__  # no arbitrary command text or file data
    finally:
        if attempted:
            try:
                ops.command(['umount', '--', mountpoint])
                ops.assert_unmounted(device, mountpoint)
            except Exception as error:
                cleanup_failure = type(error).__name__
    receipt = {'pass': failure is None and cleanup_failure is None,
               'failure': failure, 'cleanup_failure': cleanup_failure,
               'mount_attempted': attempted, 'unmounted': attempted and cleanup_failure is None}
    if receipt['pass']:
        receipt['public_key'] = content
    # Export occurs only after cleanup. On export failure, no filesystem is left
    # mounted by a normally completed successful cleanup path.
    ops.export(receipt)
    return receipt

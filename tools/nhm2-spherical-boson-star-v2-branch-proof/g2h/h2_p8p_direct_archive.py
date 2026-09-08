"""Fixed existing R40 archive reader. No execution on import."""
import base64
import hashlib
import os
import re
import stat

ARCHIVE_BYTES=12122
ARCHIVE_SHA256='73029fde08f14f9fcd01490c4e5d5bc188213eaa2f9a8d857eb5e456b86d0922'
ARCHIVE_COMPONENTS=('home','pestypig','nhm2-h2-p8p-r40-fixture-evidence-export-v1.tgz')


def authenticate_archive(content):
    if not isinstance(content, bytes) or len(content)!=ARCHIVE_BYTES:
        raise ValueError('archive_size')
    if hashlib.sha256(content).hexdigest()!=ARCHIVE_SHA256:
        raise ValueError('archive_hash')
    return base64.b64encode(content).decode('ascii')


def read_archive(mountpoint):
    if not isinstance(mountpoint,str) or not re.fullmatch(r'/mnt/nhm2-[a-z0-9-]+',mountpoint):
        raise ValueError('archive_mountpoint')
    flags=os.O_RDONLY|os.O_DIRECTORY|os.O_NOFOLLOW
    fd=os.open('/',flags);fds=[fd]
    try:
        for part in (*mountpoint.strip('/').split('/'),*ARCHIVE_COMPONENTS[:-1]):
            fd=os.open(part,flags,dir_fd=fd);fds.append(fd)
        fd=os.open(ARCHIVE_COMPONENTS[-1],os.O_RDONLY|os.O_NOFOLLOW|os.O_NONBLOCK,dir_fd=fd);fds.append(fd)
        info=os.fstat(fd)
        if not stat.S_ISREG(info.st_mode) or info.st_size!=ARCHIVE_BYTES:
            raise ValueError('archive_type_or_size')
        content=os.read(fd,ARCHIVE_BYTES+1)
        authenticate_archive(content)
        return content
    finally:
        for fd in reversed(fds):os.close(fd)


def collect_archive(ops,device,mountpoint,filesystem):
    options={'ext4':'ro,noload','xfs':'ro,norecovery'}
    if filesystem not in options:raise ValueError('filesystem')
    attempted=False;failure=None;cleanup_failure=None;encoded=None
    try:
        ops.verify_device(device)
        ops.assert_unmounted(device,mountpoint)
        attempted=True
        ops.command(['mount','-t',filesystem,'-o',options[filesystem],'--',device,mountpoint])
        ops.verify_readonly_mount(device,mountpoint,filesystem,options[filesystem])
        encoded=authenticate_archive(ops.read_archive(mountpoint))
    except Exception as error:
        failure=type(error).__name__
    finally:
        if attempted:
            try:
                ops.command(['umount','--',mountpoint])
                ops.assert_unmounted(device,mountpoint)
            except Exception as error:cleanup_failure=type(error).__name__
    result={'pass':failure is None and cleanup_failure is None,'failure':failure,
            'cleanup_failure':cleanup_failure,'mount_attempted':attempted,
            'unmounted':attempted and cleanup_failure is None}
    if result['pass']:
        result.update(archive_bytes=ARCHIVE_BYTES,archive_sha256=ARCHIVE_SHA256,archive_base64=encoded)
    ops.export(result)
    return result

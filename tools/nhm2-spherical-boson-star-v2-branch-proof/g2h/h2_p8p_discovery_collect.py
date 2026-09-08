"""Read only the new diagnostic journal after verified service termination.

Never reads retained recovery archives. Caller provides termination evidence;
this module does not authenticate service state or authorize collection itself.
"""
import os
import stat
from h2_p8p_discovery_containment import service_plan
from h2_p8p_discovery_journal import COUNT_CAP, RECORD_CAP, TOTAL_CAP


def collect_records(attempt):
    root = service_plan(attempt)['root']
    if os.name != 'posix':
        raise RuntimeError('posix_required')
    parent = os.open(root, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW)
    try:
        try:
            directory = os.open('evidence', os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW, dir_fd=parent)
        except FileNotFoundError:
            return []  # Failure before journal creation is captured by outer report.
    finally:
        os.close(parent)
    try:
        names = []
        with os.scandir(directory) as entries:
            for entry in entries:
                names.append(entry.name)
                if len(names) > COUNT_CAP:
                    raise ValueError('collection_count')
        expected = ['%02d.json' % n for n in range(len(names))]
        if sorted(names) != expected:
            raise ValueError('collection_inventory')
        records = []
        total = 0
        for name in expected:
            fd = os.open(name, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK, dir_fd=directory)
            try:
                before = os.fstat(fd)
                if not stat.S_ISREG(before.st_mode) or before.st_size > RECORD_CAP:
                    raise ValueError('collection_file')
                raw = bytearray()
                while len(raw) <= RECORD_CAP:
                    chunk = os.read(fd, min(8192, RECORD_CAP + 1 - len(raw)))
                    if not chunk:
                        break
                    raw.extend(chunk)
                after = os.fstat(fd)
                if (len(raw) > RECORD_CAP or len(raw) != before.st_size
                        or (before.st_dev, before.st_ino, before.st_size, before.st_mtime_ns)
                        != (after.st_dev, after.st_ino, after.st_size, after.st_mtime_ns)):
                    raise ValueError('collection_changed')
                total += len(raw)
                if total > TOTAL_CAP:
                    raise ValueError('collection_total')
                records.append(bytes(raw))
            finally:
                os.close(fd)
        return records
    finally:
        os.close(directory)

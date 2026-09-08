"""Bounded exclusive guest journal; no startup, cloud or implicit execution.

Each record is fsynced before return. A failed write poisons the writer and
leaves its partial file untouched. Directory durability requires POSIX and is
enforced there; Windows tests establish format/limits, not Linux durability.
"""
import hashlib
import json
import os
from pathlib import Path

RECORD_CAP = 131072
TOTAL_CAP = 524288
COUNT_CAP = 16


class Journal:
    def __init__(self, root):
        self.root = Path(root)
        self.root.mkdir(mode=0o700, parents=False, exist_ok=False)
        self.count = 0
        self.total = 0
        self.previous = '0' * 64
        self.failed = False
        self._sync_directory(self.root.parent)
        self._sync_directory()

    def _sync_directory(self, path=None):
        if os.name == 'posix':
            fd = os.open(self.root if path is None else path, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW)
            try:
                os.fsync(fd)
            finally:
                os.close(fd)

    def __call__(self, event):
        if self.failed:
            raise RuntimeError('journal_poisoned')
        try:
            if self.count >= COUNT_CAP:
                raise ValueError('journal_count_cap')
            raw = (json.dumps({'sequence': self.count, 'previous_sha256': self.previous,
                               'event': event}, sort_keys=True, separators=(',', ':'),
                              ensure_ascii=True, allow_nan=False) + '\n').encode('ascii')
            if len(raw) > RECORD_CAP or self.total + len(raw) > TOTAL_CAP:
                raise ValueError('journal_byte_cap')
            path = self.root / ('%02d.json' % self.count)
            with path.open('xb') as stream:
                if stream.write(raw) != len(raw):
                    raise OSError('journal_short_write')
                stream.flush()
                os.fsync(stream.fileno())
            self._sync_directory()
            self.previous = hashlib.sha256(raw).hexdigest()
            self.total += len(raw)
            self.count += 1
        except BaseException:
            self.failed = True
            raise

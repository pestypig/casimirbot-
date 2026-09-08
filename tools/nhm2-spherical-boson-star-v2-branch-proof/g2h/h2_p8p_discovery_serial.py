"""Pure bounded serial frames; no serial device access or cloud operations."""
import hashlib
from h2_p8p_discovery_export import EXPORT_CAP
from h2_p8p_discovery_worker import worker_plan

CHUNK = 2048


def serial_frames(attempt, raw):
    worker_plan('observe', attempt)
    if not isinstance(raw, bytes) or not 0 < len(raw) <= EXPORT_CAP:
        raise ValueError('serial_cap')
    if not raw.isascii() or b'\n' in raw or b'\r' in raw:
        raise ValueError('serial_payload')
    digest = hashlib.sha256(raw).hexdigest()
    count = (len(raw) + CHUNK - 1) // CHUNK
    prefix = ('NHM2_DISCOVERY_V1 ' + attempt + ' ').encode()
    frames = [prefix + ('BEGIN %d %d %s\n' % (len(raw), count, digest)).encode()]
    for index in range(count):
        chunk = raw[index * CHUNK:(index + 1) * CHUNK]
        frames.append(prefix + ('DATA %d ' % index).encode() + chunk + b'\n')
    frames.append(prefix + ('END ' + digest + '\n').encode())
    return frames


def decode_frames(attempt, lines):
    worker_plan('observe', attempt)
    if not isinstance(lines, list) or len(lines) > (EXPORT_CAP + CHUNK - 1) // CHUNK + 2:
        raise ValueError('serial_inventory')
    prefix = ('NHM2_DISCOVERY_V1 ' + attempt + ' ').encode()
    if any(not isinstance(line, bytes) or len(line) > CHUNK + 128
           or not line.startswith(prefix) for line in lines):
        raise ValueError('serial_frame')
    if len(lines) < 3:
        raise ValueError('serial_incomplete')
    raw = b''.join(line[len(prefix):].split(b' ', 2)[-1][:-1] for line in lines[1:-1])
    if serial_frames(attempt, raw) != lines:
        raise ValueError('serial_binding')
    return raw

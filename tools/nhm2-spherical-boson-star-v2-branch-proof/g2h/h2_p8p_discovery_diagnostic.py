"""Pure diagnostic planning/receipt construction. No process, cloud or mount I/O.

The consumed discovery implementation is imported without modification. An
eventual separately authorized executor must supply authenticated observations.
This module cannot turn a parser acceptance into permission to mount or recover.
"""
import base64
import hashlib
import json
import re
from h2_p8p_hostkey_guest_linux import select_partition

INSTANCE = '2570241336417567358'
ALIAS = '/dev/disk/by-id/google-nhm2-p8p-cv2-hostkey-clone'
CAP = 8192
FAILURES = frozenset(('disk_inventory', 'disk_identity_or_mode',
    'partition_inventory', 'partition_shape_or_mode', 'unsupported_partition',
    'partition_path', 'partition_device_number', 'ambiguous_filesystem'))


def diagnostic_commands(device):
    if not isinstance(device, str) or not re.fullmatch(r'/dev/[A-Za-z0-9_-]+', device):
        raise ValueError('resolved_device_path')
    common = ['/usr/bin/lsblk', '--json', '--bytes', '--paths']
    tail = ['--output', 'PATH,TYPE,RO,FSTYPE,MAJ:MIN', '--', device]
    return [['/usr/bin/lsblk', '--version'], common + tail,
            common + ['--tree'] + tail]


def _pairs(items):
    result = {}
    for key, value in items:
        if key in result:
            raise ValueError('duplicate_json_key')
        result[key] = value
    return result


def _constant(_):
    raise ValueError('nonfinite_json')


def classify_inventory(raw, device):
    diagnostic_commands(device)
    if not isinstance(raw, bytes) or not 0 < len(raw) <= CAP:
        raise ValueError('inventory_byte_cap')
    try:
        value = json.loads(raw.decode('utf8'), object_pairs_hook=_pairs,
                           parse_constant=_constant)
    except (UnicodeError, ValueError, RecursionError):
        return {'accepted': False, 'phase': 'json_decode', 'code': 'invalid_json'}
    if not isinstance(value, dict):
        return {'accepted': False, 'phase': 'partition_selection', 'code': 'invalid_shape'}
    try:
        selected = select_partition(value, device)
    except ValueError as error:
        code = str(error) if str(error) in FAILURES else 'unexpected_validation'
        return {'accepted': False, 'phase': 'partition_selection', 'code': code}
    except (TypeError, AttributeError, RecursionError):
        return {'accepted': False, 'phase': 'partition_selection', 'code': 'invalid_shape'}
    return {'accepted': True, 'phase': 'partition_selection', 'code': 'selected',
            'path': selected['path'], 'filesystem': selected['fstype'],
            'device_number': selected['maj:min']}


def diagnostic_receipt(*, instance, attempt, alias, device, version, baseline, tree):
    if instance != INSTANCE or alias != ALIAS:
        raise ValueError('diagnostic_identity')
    if not isinstance(attempt, str) or not re.fullmatch(r'[a-f0-9]{64}', attempt):
        raise ValueError('attempt_identity')
    if not isinstance(version, bytes) or not 0 < len(version) <= 256:
        raise ValueError('version_cap')
    commands = diagnostic_commands(device)
    # Bytes, not reformatted JSON, preserve the selected-device observations.
    observations = []
    for label, argv, raw in zip(('baseline', 'explicit_tree'), commands[1:], (baseline, tree)):
        classification = classify_inventory(raw, device)
        observations.append({'label': label, 'argv': argv, 'bytes': len(raw),
            'sha256': hashlib.sha256(raw).hexdigest(),
            'base64': base64.b64encode(raw).decode('ascii'),
            'classification': classification})
    receipt = {'schema': 'nhm2-discovery-diagnostic-v1', 'instance_id': instance,
        'attempt_id': attempt, 'device_alias': alias, 'resolved_device': device,
        'version_argv': commands[0], 'version_base64': base64.b64encode(version).decode('ascii'),
        'observations': observations, 'mount_authorized': False,
        'recovery_authorized': False, 'scientific_authority': False}
    encoded = json.dumps(receipt, separators=(',', ':'), ensure_ascii=True).encode('ascii')
    if len(encoded) > 24576:
        raise ValueError('diagnostic_receipt_cap')
    return receipt

"""Pure diagnostic receipt validation; API provenance must be supplied externally.

Recompute every byte hash, command and classification, including a rejected
partition selection. This validates diagnostic data, not archive recovery.
"""
import base64
import binascii
import json
from h2_p8p_discovery_diagnostic import (CAP, INSTANCE, ALIAS, _pairs, _constant,
                                       diagnostic_receipt)


def _decode(value, maximum):
    if not isinstance(value, str) or len(value) > 4*((maximum+2)//3):
        raise ValueError('encoded_cap')
    try:
        raw = base64.b64decode(value, validate=True)
    except (ValueError, binascii.Error):
        raise ValueError('encoded_shape') from None
    if not 0 < len(raw) <= maximum or base64.b64encode(raw).decode('ascii') != value:
        raise ValueError('encoded_noncanonical')
    return raw


def authenticate_diagnostic(raw, *, expected_attempt, observed_instance, observed_device):
    if observed_instance != INSTANCE:
        raise ValueError('api_instance')
    if not isinstance(raw, bytes) or not 0 < len(raw) <= 24576:
        raise ValueError('receipt_cap')
    try:
        value = json.loads(raw.decode('ascii'), object_pairs_hook=_pairs, parse_constant=_constant)
    except (ValueError, UnicodeError, RecursionError):
        raise ValueError('receipt_json') from None
    if not isinstance(value, dict) or not isinstance(value.get('observations'), list) or len(value['observations']) != 2:
        raise ValueError('receipt_shape')
    try:
        baseline, tree = (_decode(item['base64'], CAP) for item in value['observations'])
        version = _decode(value['version_base64'], 256)
    except (KeyError, TypeError):
        raise ValueError('receipt_shape') from None
    expected = diagnostic_receipt(instance=observed_instance, attempt=expected_attempt,
        alias=ALIAS, device=observed_device, version=version, baseline=baseline, tree=tree)
    canonical = json.dumps(expected, separators=(',', ':'), ensure_ascii=True).encode('ascii')
    if raw != canonical:
        raise ValueError('receipt_binding')
    return expected

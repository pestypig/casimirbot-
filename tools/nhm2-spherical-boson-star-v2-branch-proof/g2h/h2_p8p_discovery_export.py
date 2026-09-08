"""Bounded raw evidence framing. Invalid/partial journal bytes are preserved.

Pure framing is not receipt acceptance or authenticated cloud provenance.
Only call after the diagnostic service has been independently observed stopped.
"""
import base64
import hashlib
import json
from h2_p8p_discovery_worker import worker_plan
from h2_p8p_discovery_journal import COUNT_CAP, RECORD_CAP, TOTAL_CAP

EXPORT_CAP = 819200


def encode_export(attempt, records, report):
    worker_plan('observe', attempt)
    if not isinstance(records, list) or len(records) > COUNT_CAP:
        raise ValueError('export_inventory')
    if not isinstance(report, bytes) or len(report) > 65536:
        raise ValueError('export_report_cap')
    values = []
    total = 0
    for index, raw in enumerate(records):
        if not isinstance(raw, bytes) or len(raw) > RECORD_CAP:
            raise ValueError('export_record_cap')
        total += len(raw)
        if total > TOTAL_CAP:
            raise ValueError('export_total_cap')
        values.append({'name': '%02d.json' % index, 'bytes': len(raw),
                       'sha256': hashlib.sha256(raw).hexdigest(),
                       'base64': base64.b64encode(raw).decode('ascii')})
    value = {'schema': 'nhm2-discovery-raw-export-v1', 'attempt_id': attempt,
             'records': values, 'report': {'bytes': len(report),
             'sha256': hashlib.sha256(report).hexdigest(),
             'base64': base64.b64encode(report).decode('ascii')}, 'authority': False}
    raw = json.dumps(value, separators=(',', ':'), ensure_ascii=True).encode('ascii')
    if len(raw) > EXPORT_CAP:
        raise ValueError('export_cap')
    return raw


def decode_export(raw, attempt):
    if not isinstance(raw, bytes) or len(raw) > EXPORT_CAP:
        raise ValueError('export_cap')
    def pairs(items):
        result = {}
        for key, value in items:
            if key in result:
                raise ValueError('export_duplicate')
            result[key] = value
        return result
    value = json.loads(raw.decode('ascii'), object_pairs_hook=pairs)
    if not isinstance(value, dict) or not isinstance(value.get('records'), list):
        raise ValueError('export_shape')
    if len(value['records']) > COUNT_CAP:
        raise ValueError('export_inventory')
    records = [base64.b64decode(item['base64'], validate=True) for item in value['records']]
    report = base64.b64decode(value['report']['base64'], validate=True)
    if encode_export(attempt, records, report) != raw:
        raise ValueError('export_binding')
    return records, report

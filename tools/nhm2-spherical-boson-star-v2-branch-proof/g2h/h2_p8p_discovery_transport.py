"""One bounded diagnostic value, below Google's documented 256KiB value limit.

Pure encoding/validation only. No guest-attribute write or cloud query is bound.
Actual API identity, provenance, chronology and stop remain outer obligations.
"""
import base64
import hashlib
import json
from h2_p8p_discovery_segments import namespace, _parse, RAW_CAP
from h2_p8p_discovery_diagnostic import INSTANCE

VALUE_CAP=90112


def encode_value(raw,attempt):
    ns=namespace(attempt)
    if not isinstance(raw,bytes) or not 0<len(raw)<=RAW_CAP:
        raise ValueError('transport_envelope_cap')
    try: envelope=_parse(raw.decode('ascii'))
    except UnicodeError: raise ValueError('transport_ascii') from None
    if (not isinstance(envelope,dict) or envelope.get('schema')!='nhm2-discovery-guest-observation-v1'
        or envelope.get('attempt_id')!=attempt or envelope.get('mount_attempted') is not False):
        raise ValueError('transport_envelope_identity')
    value={'schema':'nhm2-discovery-transport-v1','instance_id':INSTANCE,
        'attempt_id':attempt,'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest(),
        'base64':base64.b64encode(raw).decode('ascii')}
    text=json.dumps(value,separators=(',',':'),ensure_ascii=True)
    if len(text)>VALUE_CAP: raise ValueError('transport_value_cap')
    return {'namespace':ns,'key':'receipt','value':text}


def decode_value(items,*,expected_attempt,observed_instance):
    ns=namespace(expected_attempt)
    if observed_instance!=INSTANCE: raise ValueError('transport_instance')
    if not isinstance(items,list) or len(items)!=1: raise ValueError('transport_inventory')
    item=items[0]
    if (not isinstance(item,dict) or set(item)!={'namespace','key','value'}
        or item['namespace']!=ns or item['key']!='receipt' or not isinstance(item['value'],str)
        or not item['value'].isascii() or len(item['value'])>VALUE_CAP):
        raise ValueError('transport_item')
    value=_parse(item['value'])
    if (not isinstance(value,dict) or set(value)!={'schema','instance_id','attempt_id','bytes','sha256','base64'}
        or not isinstance(value['base64'],str) or len(value['base64'])>87384):
        raise ValueError('transport_fields')
    try: raw=base64.b64decode(value['base64'],validate=True)
    except ValueError: raise ValueError('transport_base64') from None
    # Exact reconstruction enforces metadata, canonical base64, hashes and counts.
    if encode_value(raw,expected_attempt)!=item: raise ValueError('transport_binding')
    return raw

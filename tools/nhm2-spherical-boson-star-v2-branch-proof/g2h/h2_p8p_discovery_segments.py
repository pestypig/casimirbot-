"""Pure bounded segmentation and reconstruction; no metadata or cloud I/O.

The manifest is the last planned write. Reconstruction is transport integrity,
not acceptance of guest assertions or permission to mount/recover/calculate.
"""
import base64
import hashlib
import json
import re
from h2_p8p_discovery_diagnostic import INSTANCE, _pairs, _constant

RAW_CAP=65536
CHUNK_CHARS=8192
VALUE_CAP=9216
ITEM_CAP=12  # at most eleven chunks plus one manifest


def _dump(value):
    return json.dumps(value,separators=(',',':'),ensure_ascii=True)


def _parse(value):
    try:
        return json.loads(value,object_pairs_hook=_pairs,parse_constant=_constant)
    except (ValueError,RecursionError,UnicodeError):
        raise ValueError('segment_json') from None


def namespace(attempt):
    if not isinstance(attempt,str) or not re.fullmatch(r'[a-f0-9]{64}',attempt):
        raise ValueError('segment_attempt')
    return 'nhm2-discovery-'+attempt  # full identity: no abbreviated collision domain


def segment_envelope(raw,attempt):
    ns=namespace(attempt)
    if not isinstance(raw,bytes) or not 0<len(raw)<=RAW_CAP:
        raise ValueError('envelope_cap')
    try: value=_parse(raw.decode('ascii'))
    except UnicodeError: raise ValueError('envelope_ascii') from None
    if (not isinstance(value,dict) or value.get('schema')!='nhm2-discovery-guest-observation-v1'
        or value.get('attempt_id')!=attempt or value.get('mount_attempted') is not False):
        raise ValueError('envelope_identity')
    encoded=base64.b64encode(raw).decode('ascii')
    chunks=[encoded[i:i+CHUNK_CHARS] for i in range(0,len(encoded),CHUNK_CHARS)]
    items=[]
    for index,data in enumerate(chunks):
        item={'attempt_id':attempt,'index':index,'data':data,
              'sha256':hashlib.sha256(data.encode('ascii')).hexdigest()}
        items.append({'namespace':ns,'key':f'chunk-{index:02d}','value':_dump(item)})
    header={'schema':'nhm2-discovery-segments-v1','instance_id':INSTANCE,
        'attempt_id':attempt,'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest(),
        'chunks':len(chunks)}
    items.append({'namespace':ns,'key':'manifest','value':_dump(header)})
    if len(items)>ITEM_CAP or any(len(item['value'].encode('ascii'))>VALUE_CAP for item in items):
        raise ValueError('segment_plan_cap')
    return items


def reconstruct_envelope(items,*,expected_attempt,observed_instance):
    ns=namespace(expected_attempt)
    if observed_instance!=INSTANCE: raise ValueError('segment_instance')
    if not isinstance(items,list) or not 2<=len(items)<=ITEM_CAP:
        raise ValueError('segment_inventory')
    by_key={}
    for item in items:
        if (not isinstance(item,dict) or set(item)!={'namespace','key','value'}
            or item['namespace']!=ns or not isinstance(item['key'],str)
            or not re.fullmatch(r'manifest|chunk-[0-9]{2}',item['key'])
            or not isinstance(item['value'],str) or not item['value'].isascii()
            or len(item['value'])>VALUE_CAP or item['key'] in by_key):
            raise ValueError('segment_entry')
        by_key[item['key']]=item
    if 'manifest' not in by_key: raise ValueError('segment_uncommitted')
    header=_parse(by_key['manifest']['value'])
    if (not isinstance(header,dict) or set(header)!={'schema','instance_id','attempt_id','bytes','sha256','chunks'}
        or header['schema']!='nhm2-discovery-segments-v1' or header['instance_id']!=INSTANCE
        or header['attempt_id']!=expected_attempt or type(header['chunks']) is not int
        or not 1<=header['chunks']<ITEM_CAP or type(header['bytes']) is not int
        or not 0<header['bytes']<=RAW_CAP):
        raise ValueError('segment_manifest')
    count=header['chunks']
    if set(by_key)!={'manifest',*(f'chunk-{i:02d}' for i in range(count))}:
        raise ValueError('segment_missing_or_extra')
    data=[]
    for index in range(count):
        item=_parse(by_key[f'chunk-{index:02d}']['value'])
        if (not isinstance(item,dict) or set(item)!={'attempt_id','index','data','sha256'}
            or item['attempt_id']!=expected_attempt or type(item['index']) is not int
            or item['index']!=index or not isinstance(item['data'],str)
            or not 0<len(item['data'])<=CHUNK_CHARS or not item['data'].isascii()):
            raise ValueError('segment_chunk')
        data.append(item['data'])
    try: raw=base64.b64decode(''.join(data),validate=True)
    except ValueError: raise ValueError('segment_base64') from None
    # Rebuilding also checks every hash, size, index, boundary and canonical field.
    expected=segment_envelope(raw,expected_attempt)
    if {item['key']:item for item in expected}!=by_key:
        raise ValueError('segment_binding')
    return raw

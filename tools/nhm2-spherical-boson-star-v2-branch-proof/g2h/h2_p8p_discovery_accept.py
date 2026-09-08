"""Full guest-envelope consistency checks after authenticated transport.

No cloud I/O, publication, persistence or authority promotion. The caller must
authenticate API provenance, guest source and chronology, then commit evidence.
"""
import base64
import json
import re
from h2_p8p_discovery_diagnostic import INSTANCE, ALIAS, diagnostic_commands, _pairs, _constant
from h2_p8p_discovery_receiver import authenticate_diagnostic
from h2_p8p_discovery_guest import GUARD_CODES

ERRORS=GUARD_CODES | frozenset({'output_cap','command_nonzero','command_timeout',
    'command_exception','cleanup_unconfirmed','capture_incomplete','post_probe_failed',
    'OSError','FileNotFoundError','PermissionError','RuntimeError','ValueError',
    'TypeError','KeyError','UnicodeDecodeError','TimeoutError'})


def _state(value):
    if not isinstance(value,dict) or set(value)!={'alias','device','family','unmounted'}:
        raise ValueError('accept_state_shape')
    if value['alias']!=ALIAS or value['unmounted'] is not True:
        raise ValueError('accept_state_guard')
    diagnostic_commands(value['device'])
    family=value['family']
    if not isinstance(family,list) or not 1<=len(family)<=17:
        raise ValueError('accept_family')
    paths=set();numbers=set()
    for item in family:
        if (not isinstance(item,dict) or set(item)!={'path','number','readonly'}
            or item['readonly'] is not True or not isinstance(item['path'],str)
            or not re.fullmatch(r'/dev/[A-Za-z0-9_-]+',item['path'])
            or not isinstance(item['number'],str) or not re.fullmatch(r'\d+:\d+',item['number'])
            or item['path'] in paths or item['number'] in numbers):
            raise ValueError('accept_family_member')
        paths.add(item['path']);numbers.add(item['number'])
    if family[0]['path']!=value['device']: raise ValueError('accept_disk_identity')


def _decode(value,cap):
    if not isinstance(value,str) or len(value)>4*((cap+2)//3): raise ValueError('accept_encoded_cap')
    try: raw=base64.b64decode(value,validate=True)
    except ValueError: raise ValueError('accept_encoded_shape') from None
    if len(raw)>cap or base64.b64encode(raw).decode('ascii')!=value:
        raise ValueError('accept_encoded_binding')
    return raw


def accept_envelope(raw,*,expected_attempt,observed_instance):
    if observed_instance!=INSTANCE: raise ValueError('accept_instance')
    if not isinstance(expected_attempt,str) or not re.fullmatch(r'[a-f0-9]{64}',expected_attempt):
        raise ValueError('accept_attempt')
    if not isinstance(raw,bytes) or not 0<len(raw)<=65536: raise ValueError('accept_cap')
    try: value=json.loads(raw.decode('ascii'),object_pairs_hook=_pairs,parse_constant=_constant)
    except (ValueError,UnicodeError,RecursionError): raise ValueError('accept_json') from None
    fields={'schema','attempt_id','phase','failure','before','after','post_probe_failure',
            'commands','diagnostic','mount_attempted'}
    if not isinstance(value,dict) or set(value)!=fields: raise ValueError('accept_fields')
    if (value['schema']!='nhm2-discovery-guest-observation-v1' or value['attempt_id']!=expected_attempt
        or value['mount_attempted'] is not False or value['phase'] not in
        ('device_before','version','baseline','explicit_tree','device_after','receipt')):
        raise ValueError('accept_identity')
    if any(value[key] is not None and (not isinstance(value[key],str) or value[key] not in ERRORS)
           for key in ('failure','post_probe_failure')):
        raise ValueError('accept_failure_code')
    commands=value['commands']
    if not isinstance(commands,list) or len(commands)>3: raise ValueError('accept_command_count')
    before=value['before'];after=value['after']
    if before is None:
        if commands or after is not None or value['failure'] is None or value['phase']!='device_before':
            raise ValueError('accept_missing_initial_guard')
    else:
        _state(before)
        if after is not None: _state(after)
        if after!=before and value['post_probe_failure'] is None: raise ValueError('accept_changed_state')
    decoded=[];failed_command=False
    for index,command in enumerate(commands):
        fields={'argv','stdout','stderr','exit_code','failure','leader_reaped','group_absent','elapsed_ms'}
        if not isinstance(command,dict) or set(command)!=fields: raise ValueError('accept_command_fields')
        if failed_command: raise ValueError('accept_command_after_failure')
        if command['argv']!=diagnostic_commands(before['device'])[index]: raise ValueError('accept_command_scope')
        stdout=_decode(command['stdout'],256 if index==0 else 8192)
        _decode(command['stderr'],512)
        if (type(command['elapsed_ms']) is not int or not 0<=command['elapsed_ms']<=20000
            or type(command['leader_reaped']) is not bool or type(command['group_absent']) is not bool
            or (command['exit_code'] is not None and type(command['exit_code']) is not int)
            or (command['failure'] is not None and
                (not isinstance(command['failure'],str) or command['failure'] not in ERRORS))):
            raise ValueError('accept_command_result')
        failed_command=(command['failure'] is not None or command['exit_code']!=0
            or not command['leader_reaped'] or not command['group_absent'])
        decoded.append(stdout)
    success=value['failure'] is None
    if success:
        if (value['phase']!='receipt' or len(commands)!=3 or failed_command or before is None
            or before!=after or value['post_probe_failure'] is not None):
            raise ValueError('accept_false_success')
        diagnostic=value['diagnostic']
        nested=json.dumps(diagnostic,separators=(',',':'),ensure_ascii=True).encode('ascii')
        checked=authenticate_diagnostic(nested,expected_attempt=expected_attempt,
            observed_instance=observed_instance,observed_device=before['device'])
        if (base64.b64decode(checked['version_base64'])!=decoded[0]
            or any(base64.b64decode(item['base64'])!=decoded[index+1]
                   for index,item in enumerate(checked['observations']))):
            raise ValueError('accept_command_receipt_mismatch')
        guarded={(item['path'],item['number']) for item in before['family'][1:]}
        for item in checked['observations']:
            selection=item['classification']
            if selection['accepted'] and (selection['path'],selection['device_number']) not in guarded:
                raise ValueError('accept_selection_outside_guarded_family')
    elif value['diagnostic'] is not None:
        raise ValueError('accept_failure_with_diagnostic')
    return {'authenticated':True,'helperId':INSTANCE,'attempt':expected_attempt,
        'mountAuthorized':False,'recoveryAuthorized':False,'scientificAuthority':False,
        'guestSucceeded':success,'failure':value['failure'],'phase':value['phase'],
        'commandCount':len(commands)}

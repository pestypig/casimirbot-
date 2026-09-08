"""Single-use observation/publication composition; no CLI or implicit dispatch.

Must run inside the final independently verified whole-tree containment unit.
The supplied recorder must persist bounded events; supervisor failure never
authorizes another worker. VM shutdown remains a separate outer obligation.
"""
import base64
import json
import time
from h2_p8p_discovery_worker import run_worker,worker_plan
from h2_p8p_discovery_accept import accept_envelope
from h2_p8p_discovery_transport import encode_value
from h2_p8p_discovery_diagnostic import INSTANCE


class DiscoverySupervisor:
    def __init__(self): self.used=False

    def run(self,attempt,*,record,worker=run_worker,now=time.monotonic):
        if self.used: raise RuntimeError('supervisor_consumed')
        self.used=True
        worker_plan('observe',attempt)
        deadline=now()+100
        def emit(event):
            record(event)
            if now()>=deadline: raise TimeoutError('supervisor_deadline')
        def invoke(role,payload=b''):
            plan=worker_plan(role,attempt)
            if now()+plan['seconds']+5>=deadline: raise TimeoutError('worker_budget')
            emit({'phase':role,'kind':'intent','attempt_id':attempt})
            if now()+plan['seconds']+5>=deadline: raise TimeoutError('worker_budget_after_record')
            result=worker(role,attempt,payload)
            if (not isinstance(result['stdout'],bytes) or len(result['stdout'])>plan['stdout_cap']
                or not isinstance(result['stderr'],bytes) or len(result['stderr'])>plan['stderr_cap']):
                raise ValueError('worker_capture_contract')
            emit({'phase':role,'kind':'result','attempt_id':attempt,
                'result':{**result,'stdout':base64.b64encode(result['stdout']).decode('ascii'),
                         'stderr':base64.b64encode(result['stderr']).decode('ascii')}})
            if result['failure'] is not None or result['exit_code']!=0 or result['leader_reaped'] is not True or result['group_absent'] is not True:
                raise RuntimeError('worker_failed')
            return result['stdout']
        outcome={'attempt_id':attempt,'published':False,'failure':None}
        try:
            raw=invoke('observe')
            accepted=accept_envelope(raw,expected_attempt=attempt,observed_instance=INSTANCE)
            emit({'phase':'guest_consistency','kind':'result','result':accepted})
            output=invoke('publish',raw)
            item=encode_value(raw,attempt)
            expected={'schema':'nhm2-discovery-publication-v1','instance_id':INSTANCE,
                'attempt_id':attempt,'namespace':item['namespace'],'key':'receipt',
                'value_bytes':len(item['value']),'published':True}
            if output!=(json.dumps(expected,separators=(',',':'))+'\n').encode('ascii'):
                raise ValueError('publication_ack_binding')
            outcome['published']=True
        except Exception as error:
            outcome['failure']=type(error).__name__
        # This event is provisional; the outer durable/API receiver decides
        # acceptance. Even successful publication is not recovery or science PASS.
        try: emit({'phase':'supervisor_terminal','kind':'provisional','result':outcome.copy()})
        except Exception as error:
            outcome['failure']=type(error).__name__
        return outcome

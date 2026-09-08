import copy
import json
import unittest
from h2_p8p_discovery_supervisor import DiscoverySupervisor
from h2_p8p_discovery_guest import run_guest_diagnostic
from h2_p8p_discovery_diagnostic import INSTANCE,ALIAS
from h2_p8p_discovery_transport import encode_value

ATTEMPT='b'*64


class SupervisorTests(unittest.TestCase):
    def setUp(self):
        state={'alias':ALIAS,'device':'/dev/sdb','family':[{'path':'/dev/sdb','number':'8:16','readonly':True}],'unmounted':True}
        def capture(argv,**kwargs):
            return {'argv':argv,'stdout':b'lsblk test' if '--version' in argv else b'{"blockdevices":[]}',
                'stderr':b'','exit_code':0,'failure':None,'leader_reaped':True,'group_absent':True,'elapsed_ms':1}
        value=run_guest_diagnostic(ATTEMPT,probe=lambda:copy.deepcopy(state),capture=capture)
        self.raw=json.dumps(value,separators=(',',':')).encode()
        self.calls=[];self.events=[]

    def worker(self,role,attempt,payload):
        self.calls.append(role)
        if role=='observe': stdout=self.raw
        else:
            self.assertEqual(payload,self.raw)
            item=encode_value(payload,attempt)
            ack={'schema':'nhm2-discovery-publication-v1','instance_id':INSTANCE,'attempt_id':attempt,
                'namespace':item['namespace'],'key':'receipt','value_bytes':len(item['value']),'published':True}
            stdout=(json.dumps(ack,separators=(',',':'))+'\n').encode()
        return {'role':role,'stdout':stdout,'stderr':b'','failure':None,'exit_code':0,
                'leader_reaped':True,'group_absent':True,'elapsed_ms':1,'input_bytes_sent':len(payload)}

    def test_single_observe_then_publish(self):
        supervisor=DiscoverySupervisor()
        result=supervisor.run(ATTEMPT,record=self.events.append,worker=self.worker)
        self.assertTrue(result['published']);self.assertIsNone(result['failure'])
        self.assertEqual(self.calls,['observe','publish'])
        with self.assertRaises(RuntimeError): supervisor.run(ATTEMPT,record=self.events.append,worker=self.worker)

    def test_worker_failure_preserves_capture_and_prevents_publication(self):
        def worker(*args):
            value=self.worker(*args);value.update(failure='worker_timeout',stdout=b'partial');return value
        result=DiscoverySupervisor().run(ATTEMPT,record=self.events.append,worker=worker)
        self.assertFalse(result['published']);self.assertEqual(self.calls,['observe'])
        self.assertEqual(self.events[1]['result']['stdout'],'cGFydGlhbA==')

    def test_record_failure_prevents_next_worker(self):
        def record(event):
            if event['phase']=='observe' and event['kind']=='result': raise OSError('disk_full')
        result=DiscoverySupervisor().run(ATTEMPT,record=record,worker=self.worker)
        self.assertFalse(result['published']);self.assertEqual(self.calls,['observe'])

    def test_insufficient_remaining_time_prevents_publish(self):
        clock=0
        def worker(*args):
            nonlocal clock
            value=self.worker(*args);clock=80;return value
        result=DiscoverySupervisor().run(ATTEMPT,record=self.events.append,worker=worker,now=lambda:clock)
        self.assertFalse(result['published']);self.assertEqual(self.calls,['observe'])

    def test_bad_ack_preserved_as_failure_without_retry(self):
        def worker(*args):
            value=self.worker(*args)
            if args[0]=='publish': value['stdout']=b'wrong'
            return value
        result=DiscoverySupervisor().run(ATTEMPT,record=self.events.append,worker=worker)
        self.assertFalse(result['published']);self.assertEqual(self.calls,['observe','publish'])

    def test_slow_intent_cannot_consume_reserved_worker_window(self):
        clock=0
        def record(event):
            nonlocal clock
            self.events.append(event)
            if event['phase']=='publish' and event['kind']=='intent': clock=80
        result=DiscoverySupervisor().run(ATTEMPT,record=record,worker=self.worker,now=lambda:clock)
        self.assertFalse(result['published']);self.assertEqual(self.calls,['observe'])


if __name__=='__main__':unittest.main()

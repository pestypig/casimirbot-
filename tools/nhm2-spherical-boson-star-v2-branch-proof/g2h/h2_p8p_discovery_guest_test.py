import copy
import json
import unittest
from h2_p8p_discovery_guest import run_guest_diagnostic, capture_command
from h2_p8p_discovery_diagnostic import ALIAS


class GuestTests(unittest.TestCase):
    def setUp(self):
        self.state={'alias':ALIAS,'device':'/dev/sdb','family':[
            {'path':'/dev/sdb','number':'8:16','readonly':True}], 'unmounted':True}
        self.calls=[]

    def probe(self): return copy.deepcopy(self.state)

    def capture(self, argv, **kwargs):
        self.calls.append(argv)
        payload=b'lsblk from util-linux test' if '--version' in argv else b'{"blockdevices":[]}'
        return {'argv':argv,'stdout':payload,'stderr':b'','exit_code':0,'failure':None,
            'leader_reaped':True,'group_absent':True,'elapsed_ms':1}

    def run_guest(self, **kwargs):
        return run_guest_diagnostic('a'*64, probe=kwargs.get('probe',self.probe),
                                    capture=kwargs.get('capture',self.capture))

    def test_three_distinct_reads_then_second_probe(self):
        result=self.run_guest()
        self.assertEqual(len(self.calls),3)
        self.assertIsNone(result['failure'])
        self.assertFalse(result['diagnostic']['observations'][0]['classification']['accepted'])
        self.assertFalse(result['mount_attempted'])
        self.assertEqual(result['before'],result['after'])

    def test_every_command_failure_is_terminal_with_partial_output(self):
        for index in range(3):
            self.calls=[]
            def capture(argv, **kwargs):
                value=self.capture(argv, **kwargs)
                if len(self.calls)==index+1:
                    value.update(stdout=b'partial',failure='command_timeout',exit_code=-9)
                return value
            result=self.run_guest(capture=capture)
            self.assertEqual(len(self.calls),index+1)
            self.assertEqual(result['failure'],'command_timeout')
            self.assertIsNone(result['diagnostic'])
            self.assertEqual(result['commands'][-1]['stdout'],'cGFydGlhbA==')
            self.assertEqual(result['before'],result['after'])

    def test_guard_failure_prevents_commands(self):
        def probe(): raise ValueError('block_not_readonly')
        result=self.run_guest(probe=probe)
        self.assertEqual(result['failure'],'block_not_readonly')
        self.assertEqual(self.calls,[])

    def test_changed_after_identity_rejects_results(self):
        count=0
        def probe():
            nonlocal count
            count+=1; result=self.probe()
            if count==2: result['family'][0]['number']='8:32'
            return result
        result=self.run_guest(probe=probe)
        self.assertEqual(result['failure'],'post_probe_failed')
        self.assertEqual(result['post_probe_failure'],'device_changed')
        self.assertIsNone(result['diagnostic'])
        self.assertEqual(len(result['commands']),3)

    def test_unreaped_group_is_terminal(self):
        def capture(argv, **kwargs):
            value=self.capture(argv, **kwargs);value['group_absent']=False;return value
        result=self.run_guest(capture=capture)
        self.assertEqual(result['failure'],'capture_incomplete')
        self.assertEqual(len(self.calls),1)

    def test_capture_contract_cap(self):
        def capture(argv, **kwargs):
            value=self.capture(argv, **kwargs);value['stderr']=b'x'*513;return value
        result=self.run_guest(capture=capture)
        self.assertEqual(result['failure'],'capture_contract')
        self.assertEqual(len(self.calls),1)

    def test_scope_rejects_mutating_command_before_process_launch(self):
        for argv in [['mount','/dev/sdb'],['/usr/bin/lsblk','--json','/dev/sdc']]:
            with self.assertRaises(ValueError): capture_command(argv,device='/dev/sdb',stdout_cap=8192)

    def test_invalid_attempt_prevents_probe(self):
        with self.assertRaises(ValueError):
            run_guest_diagnostic('../old',probe=lambda:self.fail('probe called'))

    def test_original_failure_preserved_when_post_guard_fails(self):
        probes=0
        def probe():
            nonlocal probes
            probes+=1
            if probes==2: raise ValueError('block_not_readonly')
            return self.probe()
        def capture(argv, **kwargs):
            value=self.capture(argv, **kwargs);value['failure']='command_timeout';return value
        result=self.run_guest(probe=probe,capture=capture)
        self.assertEqual(result['failure'],'command_timeout')
        self.assertEqual(result['post_probe_failure'],'block_not_readonly')
        self.assertEqual(probes,2)

    def test_maximum_command_payload_envelope_is_explicitly_bounded(self):
        def capture(argv, **kwargs):
            value=self.capture(argv, **kwargs)
            cap=kwargs['stdout_cap']
            payload=value['stdout'];value['stdout']=payload+b' '*(cap-len(payload))
            value['stderr']=b'x'*512
            return value
        result=self.run_guest(capture=capture)
        size=len(json.dumps(result,separators=(',',':')).encode())
        self.assertGreater(size,24576)
        self.assertLessEqual(size,65536)


if __name__=='__main__': unittest.main()

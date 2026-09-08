import copy
import json
import unittest
from h2_p8p_discovery_guest import run_guest_diagnostic
from h2_p8p_discovery_accept import accept_envelope
from h2_p8p_discovery_diagnostic import ALIAS,INSTANCE

ATTEMPT='9'*64


class AcceptanceTests(unittest.TestCase):
    def setUp(self):
        self.state={'alias':ALIAS,'device':'/dev/sdb','unmounted':True,
            'family':[{'path':'/dev/sdb','number':'8:16','readonly':True}]}
        def capture(argv,**kwargs):
            return {'argv':argv,'stdout':b'lsblk test' if '--version' in argv else b'{"blockdevices":[]}',
                'stderr':b'','exit_code':0,'failure':None,'leader_reaped':True,'group_absent':True,'elapsed_ms':1}
        self.capture=capture
        self.value=run_guest_diagnostic(ATTEMPT,probe=lambda:copy.deepcopy(self.state),capture=capture)

    def accept(self,value):
        return accept_envelope(json.dumps(value,separators=(',',':')).encode('ascii'),
            expected_attempt=ATTEMPT,observed_instance=INSTANCE)

    def test_complete_observation_is_not_partition_or_recovery_pass(self):
        result=self.accept(self.value)
        self.assertTrue(result['guestSucceeded'])
        self.assertFalse(result['recoveryAuthorized'])
        self.assertFalse(self.value['diagnostic']['observations'][0]['classification']['accepted'])

    def test_each_guard_binding_is_enforced(self):
        for field,bad in [('alias','other'),('device','/dev/sdc'),('unmounted',False),('family',[])]:
            value=copy.deepcopy(self.value);value['before'][field]=bad
            with self.subTest(field=field),self.assertRaises(ValueError): self.accept(value)

    def test_writable_and_duplicate_members_rejected(self):
        value=copy.deepcopy(self.value);value['before']['family'][0]['readonly']=False
        with self.assertRaises(ValueError): self.accept(value)
        value=copy.deepcopy(self.value);value['before']['family']*=2
        with self.assertRaises(ValueError): self.accept(value)

    def test_changed_command_or_nested_bytes_rejected(self):
        for field,bad in [('argv',['mount']),('stdout','AAAA'),('elapsed_ms',20001),
            ('leader_reaped',False),('failure',[]),('exit_code',True)]:
            value=copy.deepcopy(self.value);value['commands'][0][field]=bad
            with self.subTest(field=field),self.assertRaises(ValueError): self.accept(value)

    def test_command_failure_is_observable_without_success(self):
        def capture(argv,**kwargs):
            value=self.capture(argv,**kwargs);value.update(failure='command_timeout',exit_code=-9)
            return value
        value=run_guest_diagnostic(ATTEMPT,probe=lambda:copy.deepcopy(self.state),capture=capture)
        result=self.accept(value)
        self.assertFalse(result['guestSucceeded']);self.assertEqual(result['commandCount'],1)
        self.assertEqual(result['failure'],'command_timeout')
        value['commands'].append(copy.deepcopy(value['commands'][0]))
        with self.assertRaises(ValueError): self.accept(value)

    def test_initial_failure_with_no_commands_is_preserved(self):
        def probe(): raise ValueError('block_not_readonly')
        value=run_guest_diagnostic(ATTEMPT,probe=probe,capture=self.capture)
        self.assertEqual(self.accept(value)['failure'],'block_not_readonly')

    def test_forged_identity_extra_fields_and_mount_flag(self):
        for field,bad in [('attempt_id','8'*64),('mount_attempted',True),('extra',True),('failure','anything')]:
            value={**self.value,field:bad}
            with self.subTest(field=field),self.assertRaises(ValueError): self.accept(value)

    def test_selected_partition_must_match_guarded_path_and_number(self):
        self.state['family'].append({'path':'/dev/sdb1','number':'8:17','readonly':True})
        inventory={'blockdevices':[{'path':'/dev/sdb','type':'disk','ro':True,'children':[
            {'path':'/dev/sdb1','type':'part','ro':True,'fstype':'ext4','maj:min':'8:17'}]}]}
        def capture(argv,**kwargs):
            value=self.capture(argv,**kwargs)
            if '--version' not in argv: value['stdout']=json.dumps(inventory).encode()
            return value
        value=run_guest_diagnostic(ATTEMPT,probe=lambda:copy.deepcopy(self.state),capture=capture)
        self.assertTrue(self.accept(value)['guestSucceeded'])
        for family in [[self.state['family'][0]],
            [self.state['family'][0],{'path':'/dev/sdb9','number':'8:25','readonly':True}],
            [self.state['family'][0],{'path':'/dev/sdb1','number':'8:25','readonly':True}]]:
            changed=copy.deepcopy(value)
            changed['before']['family']=family;changed['after']['family']=family
            with self.assertRaises(ValueError): self.accept(changed)


if __name__=='__main__':unittest.main()

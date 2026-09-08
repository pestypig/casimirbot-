import copy
import json
import unittest
from h2_p8p_discovery_transport import encode_value,decode_value,VALUE_CAP
from h2_p8p_discovery_segments_test import envelope,ATTEMPT
from h2_p8p_discovery_diagnostic import INSTANCE
from h2_p8p_discovery_diagnostic import ALIAS
from h2_p8p_discovery_guest import run_guest_diagnostic
from h2_p8p_discovery_receiver import authenticate_diagnostic


class TransportTests(unittest.TestCase):
    def decode(self,items):
        return decode_value(items,expected_attempt=ATTEMPT,observed_instance=INSTANCE)

    def test_maximum_envelope_single_value(self):
        raw=envelope(65536);item=encode_value(raw,ATTEMPT)
        self.assertLessEqual(len(item['value']),VALUE_CAP)
        self.assertLess(len(item['value']),256*1024)
        self.assertEqual(self.decode([item]),raw)

    def test_every_binding_field_recomputed(self):
        item=encode_value(envelope(),ATTEMPT)
        for field,bad in [('schema','other'),('instance_id','123'),('attempt_id','0'*64),
                          ('bytes',True),('sha256','0'*64),('base64','AAAA')]:
            changed=copy.deepcopy(item);value=json.loads(changed['value']);value[field]=bad
            changed['value']=json.dumps(value,separators=(',',':'))
            with self.subTest(field=field),self.assertRaises(ValueError): self.decode([changed])

    def test_wrong_api_identity_and_stale_namespace(self):
        item=encode_value(envelope(),ATTEMPT)
        with self.assertRaises(ValueError):
            decode_value([item],expected_attempt=ATTEMPT,observed_instance='123')
        changed={**item,'namespace':'old'}
        with self.assertRaises(ValueError): self.decode([changed])

    def test_missing_duplicate_extra_and_caps(self):
        item=encode_value(envelope(),ATTEMPT)
        for items in [[],[item,item],[{**item,'extra':True}],[{**item,'value':' '* (VALUE_CAP+1)}]]:
            with self.assertRaises(ValueError): self.decode(items)
        with self.assertRaises(ValueError): encode_value(envelope(65537),ATTEMPT)

    def test_duplicate_json_and_noncanonical_encoding(self):
        item=encode_value(envelope(),ATTEMPT)
        for text in ['{"bytes":1,'+item['value'][1:],item['value']+'\n']:
            with self.assertRaises(ValueError): self.decode([{**item,'value':text}])

    def test_injected_guest_through_transport_and_nested_receiver(self):
        state={'alias':ALIAS,'device':'/dev/sdb','unmounted':True,'family':[]}
        def capture(argv,**kwargs):
            return {'argv':argv,'stdout':b'lsblk test' if '--version' in argv else b'{"blockdevices":[]}',
                'stderr':b'','exit_code':0,'failure':None,'leader_reaped':True,'group_absent':True,'elapsed_ms':1}
        guest=run_guest_diagnostic(ATTEMPT,probe=lambda:copy.deepcopy(state),capture=capture)
        raw=json.dumps(guest,separators=(',',':')).encode('ascii')
        recovered=json.loads(self.decode([encode_value(raw,ATTEMPT)]))
        nested=json.dumps(recovered['diagnostic'],separators=(',',':')).encode('ascii')
        checked=authenticate_diagnostic(nested,expected_attempt=ATTEMPT,
            observed_instance=INSTANCE,observed_device='/dev/sdb')
        self.assertFalse(checked['observations'][0]['classification']['accepted'])
        self.assertFalse(checked['recovery_authorized'])

    def test_injected_partial_failure_survives_transport(self):
        state={'alias':ALIAS,'device':'/dev/sdb','unmounted':True,'family':[]}
        def capture(argv,**kwargs):
            return {'argv':argv,'stdout':b'partial','stderr':b'bounded error','exit_code':-9,
                'failure':'command_timeout','leader_reaped':True,'group_absent':True,'elapsed_ms':10000}
        guest=run_guest_diagnostic(ATTEMPT,probe=lambda:copy.deepcopy(state),capture=capture)
        raw=json.dumps(guest,separators=(',',':')).encode('ascii')
        recovered=json.loads(self.decode([encode_value(raw,ATTEMPT)]))
        self.assertEqual(recovered['failure'],'command_timeout')
        self.assertIsNone(recovered['diagnostic'])
        self.assertEqual(len(recovered['commands']),1)


if __name__=='__main__':unittest.main()

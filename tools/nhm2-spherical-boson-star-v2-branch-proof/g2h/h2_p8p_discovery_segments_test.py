import copy
import json
import unittest
from h2_p8p_discovery_segments import segment_envelope,reconstruct_envelope,RAW_CAP,VALUE_CAP
from h2_p8p_discovery_diagnostic import INSTANCE

ATTEMPT='7'*64


def envelope(size=200):
    value=json.dumps({'schema':'nhm2-discovery-guest-observation-v1','attempt_id':ATTEMPT,
        'mount_attempted':False},separators=(',',':')).encode('ascii')
    return value+b' '*max(0,size-len(value))


class SegmentTests(unittest.TestCase):
    def receive(self,items):
        return reconstruct_envelope(items,expected_attempt=ATTEMPT,observed_instance=INSTANCE)

    def test_roundtrip_minimum_boundary_and_maximum(self):
        for size in [200,6144,6145,65535,RAW_CAP]:
            raw=envelope(size);items=segment_envelope(raw,ATTEMPT)
            with self.subTest(size=size):
                self.assertEqual(self.receive(items),raw)
                self.assertLessEqual(len(items),12)
                self.assertEqual(items[-1]['key'],'manifest')
                self.assertTrue(all(len(item['value'])<=VALUE_CAP for item in items))

    def test_api_order_does_not_matter_but_chunk_identity_does(self):
        items=segment_envelope(envelope(20000),ATTEMPT)
        self.assertEqual(self.receive(list(reversed(items))),envelope(20000))
        changed=copy.deepcopy(items)
        changed[0]['value'],changed[1]['value']=changed[1]['value'],changed[0]['value']
        with self.assertRaises(ValueError): self.receive(changed)

    def test_every_missing_item_is_rejected(self):
        items=segment_envelope(envelope(RAW_CAP),ATTEMPT)
        for index in range(len(items)):
            with self.assertRaises(ValueError): self.receive(items[:index]+items[index+1:])

    def test_duplicate_extra_and_wrong_namespace(self):
        items=segment_envelope(envelope(),ATTEMPT)
        with self.assertRaises(ValueError): self.receive(items+[items[0]])
        changed=copy.deepcopy(items);changed[0]['namespace']='old'
        with self.assertRaises(ValueError): self.receive(changed)
        changed=copy.deepcopy(items);changed[0]['extra']=True
        with self.assertRaises(ValueError): self.receive(changed)

    def test_forged_chunk_and_manifest_fields(self):
        items=segment_envelope(envelope(),ATTEMPT)
        for item_index,field,bad in [(0,'data','AAAA'),(0,'sha256','0'*64),(0,'index',True),
            (-1,'bytes',1),(-1,'chunks',True),(-1,'sha256','0'*64),(-1,'attempt_id','8'*64)]:
            changed=copy.deepcopy(items);value=json.loads(changed[item_index]['value'])
            value[field]=bad;changed[item_index]['value']=json.dumps(value,separators=(',',':'))
            with self.subTest(field=field),self.assertRaises(ValueError): self.receive(changed)

    def test_foreign_instance_and_stale_attempt(self):
        items=segment_envelope(envelope(),ATTEMPT)
        for attempt,instance in [('8'*64,INSTANCE),(ATTEMPT,'123')]:
            with self.assertRaises(ValueError):
                reconstruct_envelope(items,expected_attempt=attempt,observed_instance=instance)

    def test_caps_and_duplicate_json_keys(self):
        with self.assertRaises(ValueError): segment_envelope(envelope(RAW_CAP+1),ATTEMPT)
        items=segment_envelope(envelope(),ATTEMPT)
        changed=copy.deepcopy(items);changed[-1]['value']='{"chunks":1,'+changed[-1]['value'][1:]
        with self.assertRaises(ValueError): self.receive(changed)
        changed=copy.deepcopy(items);changed[0]['value']=' '* (VALUE_CAP+1)
        with self.assertRaises(ValueError): self.receive(changed)


if __name__=='__main__':unittest.main()

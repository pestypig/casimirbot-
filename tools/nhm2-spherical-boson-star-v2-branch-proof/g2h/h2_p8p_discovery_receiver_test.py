import copy
import json
import unittest
from h2_p8p_discovery_diagnostic import INSTANCE, ALIAS, diagnostic_receipt
from h2_p8p_discovery_receiver import authenticate_diagnostic


def encode(value):
    return json.dumps(value, separators=(',', ':'), ensure_ascii=True).encode('ascii')


class ReceiverTests(unittest.TestCase):
    def setUp(self):
        self.args = dict(expected_attempt='e'*64, observed_instance=INSTANCE, observed_device='/dev/sdb')
        self.value = diagnostic_receipt(instance=INSTANCE, attempt='e'*64, alias=ALIAS,
            device='/dev/sdb', version=b'lsblk test', baseline=b'{"blockdevices":[]}',
            tree=b'{"blockdevices":[]}')

    def test_rejected_selection_is_preserved_as_diagnostic_only(self):
        value = authenticate_diagnostic(encode(self.value), **self.args)
        self.assertFalse(value['observations'][0]['classification']['accepted'])
        self.assertFalse(value['recovery_authorized'])

    def test_mutated_binding_fields_rejected(self):
        for field, bad in [('instance_id', '123'), ('attempt_id', 'f'*64),
            ('device_alias', ALIAS+'-other'), ('resolved_device', '/dev/sdc'),
            ('mount_authorized', True), ('recovery_authorized', True),
            ('scientific_authority', True), ('schema', 'other')]:
            changed = {**self.value, field: bad}
            with self.subTest(field=field), self.assertRaises(ValueError):
                authenticate_diagnostic(encode(changed), **self.args)

    def test_forged_hash_command_and_classification_rejected(self):
        for field, bad in [('sha256', '0'*64), ('argv', ['mount']), ('bytes', 1),
            ('label', 'other'), ('classification', {'accepted': True})]:
            value = copy.deepcopy(self.value); value['observations'][0][field] = bad
            with self.subTest(field=field), self.assertRaises(ValueError):
                authenticate_diagnostic(encode(value), **self.args)

    def test_wrong_observed_identity_rejected(self):
        for field, bad in [('observed_instance', '123'), ('expected_attempt', 'f'*64), ('observed_device', '/dev/sdc')]:
            with self.assertRaises(ValueError):
                authenticate_diagnostic(encode(self.value), **{**self.args, field: bad})

    def test_duplicate_key_and_extra_field_rejected(self):
        raw = encode(self.value)
        for changed in [b'{"schema":"other",'+raw[1:], encode({**self.value, 'extra': True}), raw+b'\n']:
            with self.assertRaises(ValueError): authenticate_diagnostic(changed, **self.args)

    def test_caps_and_invalid_base64(self):
        for bad in ['!', 'A'*12000, '']:
            value = copy.deepcopy(self.value); value['observations'][0]['base64'] = bad
            with self.assertRaises(ValueError): authenticate_diagnostic(encode(value), **self.args)
        with self.assertRaises(ValueError): authenticate_diagnostic(b' '*24577, **self.args)


if __name__ == '__main__': unittest.main()

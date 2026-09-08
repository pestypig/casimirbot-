import base64
import copy
import hashlib
import json
import unittest
from h2_p8p_discovery_diagnostic import (ALIAS, INSTANCE, CAP,
    classify_inventory, diagnostic_commands, diagnostic_receipt)


def inventory():
    return {'blockdevices': [{'path': '/dev/sdb', 'type': 'disk', 'ro': True,
        'children': [{'path': '/dev/sdb1', 'type': 'part', 'ro': True,
                      'fstype': 'ext4', 'maj:min': '8:17'}]}]}


def raw(value):
    return json.dumps(value).encode()


class DiagnosticTests(unittest.TestCase):
    def test_baseline_is_exact_consumed_command_and_tree_is_only_difference(self):
        commands = diagnostic_commands('/dev/sdb')
        self.assertEqual(commands[1], ['/usr/bin/lsblk', '--json', '--bytes',
            '--paths', '--output', 'PATH,TYPE,RO,FSTYPE,MAJ:MIN', '--', '/dev/sdb'])
        self.assertEqual([arg for arg in commands[2] if arg != '--tree'], commands[1])
        self.assertEqual(commands[2].count('--tree'), 1)

    def test_flat_and_nested_classified_without_relaxing_parser(self):
        nested = inventory()
        flat = copy.deepcopy(nested)
        flat['blockdevices'].extend(flat['blockdevices'][0].pop('children'))
        self.assertEqual(classify_inventory(raw(flat), '/dev/sdb')['code'], 'disk_inventory')
        self.assertTrue(classify_inventory(raw(nested), '/dev/sdb')['accepted'])

    def test_precise_failures(self):
        cases = [('writable_disk', 'disk_identity_or_mode'),
                 ('writable_part', 'partition_shape_or_mode'),
                 ('multiple', 'ambiguous_filesystem'), ('substitute', 'disk_identity_or_mode'),
                 ('unknown_fs', 'unsupported_partition'), ('missing_children', 'partition_inventory')]
        for change, expected in cases:
            value = inventory(); disk = value['blockdevices'][0]; part = disk['children'][0]
            if change == 'writable_disk': disk['ro'] = False
            if change == 'writable_part': part['ro'] = False
            if change == 'multiple': disk['children'].append(copy.deepcopy(part))
            if change == 'substitute': disk['path'] = '/dev/sdc'
            if change == 'unknown_fs': part['fstype'] = 'crypto_LUKS'
            if change == 'missing_children': del disk['children']
            with self.subTest(change=change):
                self.assertEqual(classify_inventory(raw(value), '/dev/sdb')['code'], expected)

    def test_malformed_and_duplicates(self):
        for value in [b'{', b'\xff', b'{"blockdevices":[],"blockdevices":[]}', b'{"x":NaN}']:
            with self.subTest(value=value):
                self.assertEqual(classify_inventory(value, '/dev/sdb')['code'], 'invalid_json')
        for value in [[], {'blockdevices': [None]}, {'blockdevices': [{'children': [False]}]}]:
            self.assertFalse(classify_inventory(raw(value), '/dev/sdb')['accepted'])

    def test_limits_and_paths(self):
        for value in [b'', b' ' * (CAP + 1), 'not bytes']:
            with self.assertRaises(ValueError): classify_inventory(value, '/dev/sdb')
        for device in ['/dev/disk/by-id/other', '/dev/sdb;echo', '/dev/../etc', None]:
            with self.assertRaises(ValueError): diagnostic_commands(device)

    def test_receipt_binds_exact_bytes_but_grants_nothing(self):
        data = raw(inventory())
        value = diagnostic_receipt(instance=INSTANCE, attempt='a'*64, alias=ALIAS,
            device='/dev/sdb', version=b'lsblk from util-linux 2.38.1\n', baseline=data, tree=data)
        self.assertFalse(value['mount_authorized'])
        self.assertFalse(value['recovery_authorized'])
        self.assertFalse(value['scientific_authority'])
        for item in value['observations']:
            self.assertEqual(base64.b64decode(item['base64']), data)
            self.assertEqual(item['sha256'], hashlib.sha256(data).hexdigest())

    def test_identity_and_attempt(self):
        args = dict(instance=INSTANCE, attempt='b'*64, alias=ALIAS, device='/dev/sdb',
                    version=b'v', baseline=raw(inventory()), tree=raw(inventory()))
        for key, bad in [('instance', '123'), ('alias', ALIAS+'-other'),
                         ('attempt', '../old'), ('version', b'x'*1025)]:
            changed = {**args, key: bad}
            with self.assertRaises(ValueError): diagnostic_receipt(**changed)

    def test_maximum_bounded_payload_fits_receipt(self):
        data = raw(inventory())
        data += b' ' * (CAP - len(data))
        value = diagnostic_receipt(instance=INSTANCE, attempt='c'*64, alias=ALIAS,
            device='/dev/sdb', version=b'v'*256, baseline=data, tree=data)
        self.assertLessEqual(len(json.dumps(value, separators=(',', ':')).encode()), 24576)
        self.assertEqual(value['observations'][0]['bytes'], CAP)

    def test_deep_json_is_bounded_failure(self):
        data = b'['*2000 + b'0' + b']'*2000
        result = classify_inventory(data, '/dev/sdb')
        self.assertFalse(result['accepted'])
        self.assertIn(result['code'], ('invalid_json', 'invalid_shape'))


if __name__ == '__main__':
    unittest.main()

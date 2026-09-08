import unittest
import base64
from h2_p8p_hostkey_guest import collect_key


class Ops:
    def __init__(self, fail=None):
        self.calls = []
        self.fail = fail
        self.checks = 0
    def call(self, name):
        self.calls.append(name)
        if name == self.fail:
            raise RuntimeError('injected')
    def verify_device(self, device): self.call('device')
    def assert_unmounted(self, device, mountpoint):
        self.checks += 1
        self.call('before' if self.checks == 1 else 'after')
    def command(self, argv):
        self.call(argv[0])
        if argv[0] == 'mount':
            assert argv[4] in ('ro,noload', 'ro,norecovery')
    def verify_readonly_mount(self, *args): self.call('verify_mount')
    def read_public_key(self, path):
        self.call('read')
        return b'ssh-ed25519 ' + base64.b64encode(b'\x00\x00\x00\x0bssh-ed25519\x00\x00\x00\x20'+b'x'*32)
    def export(self, receipt): self.receipt = receipt; self.call('export')


class GuestTests(unittest.TestCase):
    def run_core(self, ops, fs='ext4'):
        return collect_key(ops, '/dev/synthetic1', '/mnt/fixture', fs)
    def test_success_order(self):
        for fs in ('ext4', 'xfs'):
            ops = Ops()
            self.assertTrue(self.run_core(ops, fs)['pass'])
            self.assertEqual(ops.calls, ['device','before','mount','verify_mount','read','umount','after','export'])
    def test_each_failure(self):
        for phase in ('device','before','mount','verify_mount','read','umount','after'):
            with self.subTest(phase=phase):
                ops = Ops(phase)
                receipt = self.run_core(ops)
                self.assertFalse(receipt['pass'])
                self.assertNotIn('public_key', receipt)
                if phase not in ('device','before'):
                    self.assertIn('umount', ops.calls)
                self.assertEqual(ops.calls[-1], 'export')
    def test_export_failure_after_unmount(self):
        ops = Ops('export')
        with self.assertRaises(RuntimeError): self.run_core(ops)
        self.assertEqual(ops.calls[-3:], ['umount','after','export'])
    def test_unsupported_filesystem_no_mount(self):
        ops = Ops()
        with self.assertRaises(ValueError): self.run_core(ops, 'btrfs')
        self.assertEqual(ops.calls, [])
    def test_bad_public_bytes_still_unmount(self):
        for content in (b'', b'\xff', b'a' * 16385, 'not bytes', b'-----BEGIN OPENSSH PRIVATE KEY-----'):
            ops = Ops()
            ops.read_public_key = lambda path: content
            receipt = self.run_core(ops)
            self.assertFalse(receipt['pass'])
            self.assertNotIn('public_key', receipt)
            self.assertEqual(ops.calls[-3:], ['umount','after','export'])
    def test_path_traversal_rejected_before_ops(self):
        for device, mount in (('/dev/../etc','/mnt/fixture'),('/dev/test','/mnt/../etc'),('/dev/test','/mnt/a/b')):
            ops = Ops()
            with self.assertRaises(ValueError): collect_key(ops,device,mount,'ext4')
            self.assertEqual(ops.calls, [])


if __name__ == '__main__': unittest.main()

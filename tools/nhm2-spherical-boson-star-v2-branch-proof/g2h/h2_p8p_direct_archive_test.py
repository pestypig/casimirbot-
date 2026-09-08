import unittest
from unittest.mock import patch
import h2_p8p_direct_archive as archive


class Ops:
    def __init__(self,fail=None):self.calls=[];self.fail=fail
    def call(self,name):
        self.calls.append(name)
        if name==self.fail:raise RuntimeError('injected')
    def verify_device(self,*a):self.call('device')
    def assert_unmounted(self,*a):self.call('unmounted')
    def command(self,args):self.call(args[0])
    def verify_readonly_mount(self,*a):self.call('mountcheck')
    def read_archive(self,*a):self.call('read');return b'synthetic'
    def export(self,result):self.result=result;self.call('export')


class ArchiveTests(unittest.TestCase):
    def test_frozen_size_and_hash_reject_wrong_bytes(self):
        for data in (b'',b'x'*12121,b'x'*12122,b'x'*12123,'not-bytes'):
            with self.assertRaises(ValueError):archive.authenticate_archive(data)
    def test_no_hash_retuning_parameters(self):
        import inspect
        self.assertEqual(list(inspect.signature(archive.authenticate_archive).parameters),['content'])
        self.assertEqual(archive.ARCHIVE_BYTES,12122)
        self.assertEqual(archive.ARCHIVE_SHA256,'73029fde08f14f9fcd01490c4e5d5bc188213eaa2f9a8d857eb5e456b86d0922')
    def test_hash_failure_unmounts_and_never_exports_bytes(self):
        ops=Ops();r=archive.collect_archive(ops,'/dev/test','/mnt/nhm2-test','ext4')
        self.assertFalse(r['pass']);self.assertNotIn('archive_base64',r)
        self.assertEqual(ops.calls[-3:],['umount','unmounted','export'])
    def test_failure_paths(self):
        for phase in ('device','mount','mountcheck','read','umount'):
            with self.subTest(phase=phase):
                ops=Ops(phase);r=archive.collect_archive(ops,'/dev/test','/mnt/nhm2-test','ext4')
                self.assertFalse(r['pass']);self.assertNotIn('archive_base64',r)
                if phase!='device':self.assertIn('umount',ops.calls)
    def test_synthetic_control_flow_only_not_archive_integrity(self):
        # Explicitly mocked authentication solely to exercise successful cleanup.
        with patch.object(archive,'authenticate_archive',return_value='SYNTHETIC_ONLY'):
            ops=Ops();r=archive.collect_archive(ops,'/dev/test','/mnt/nhm2-test','ext4')
            self.assertTrue(r['pass']);self.assertEqual(ops.calls[-3:],['umount','unmounted','export'])
            bad=Ops('umount');r=archive.collect_archive(bad,'/dev/test','/mnt/nhm2-test','ext4')
            self.assertFalse(r['pass']);self.assertNotIn('archive_base64',r)


if __name__=='__main__':unittest.main()

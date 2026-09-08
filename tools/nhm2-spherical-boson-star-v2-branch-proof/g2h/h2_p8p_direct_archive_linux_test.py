import base64
import json
import unittest
from h2_p8p_direct_archive_linux import DirectArchiveOps,validate_export


class ExportTests(unittest.TestCase):
    def receipt(self):
        return {'pass':False,'failure':'ValueError','cleanup_failure':None,'mount_attempted':True,'unmounted':True}
    def test_failure_export_bounded_and_identity_bound(self):
        calls=[]
        ops=DirectArchiveOps(device_alias='/dev/disk/by-id/google-nhm2-fixture',mountpoint='/mnt/nhm2-fixture',instance_id='123',attempt_id='a'*64,runner=lambda argv,**kw:calls.append((argv,kw)))
        ops.export(self.receipt());argv,kw=calls[0]
        self.assertEqual(kw,{'seconds':5,'cap':4096})
        value=json.loads(base64.b64decode(argv[-1]))
        self.assertEqual(value['schema'],'nhm2-direct-archive-v1')
        self.assertNotIn('archive_base64',value)
        with self.assertRaises(ValueError):ops.export({**self.receipt(),'instance_id':'456'})
    def test_failed_receipt_cannot_smuggle_data(self):
        r={**self.receipt(),'schema':'nhm2-direct-archive-v1','instance_id':'123','attempt_id':'a'*64,'archive_base64':'data'}
        with self.assertRaises(ValueError):validate_export(r)
    def test_asserted_success_requires_actual_digest(self):
        r={'schema':'nhm2-direct-archive-v1','instance_id':'123','attempt_id':'a'*64,'pass':True,'failure':None,'cleanup_failure':None,'mount_attempted':True,'unmounted':True,'archive_bytes':12122,'archive_sha256':'73029fde08f14f9fcd01490c4e5d5bc188213eaa2f9a8d857eb5e456b86d0922','archive_base64':base64.b64encode(b'x'*12122).decode()}
        with self.assertRaisesRegex(ValueError,'archive_hash'):validate_export(r)


if __name__=='__main__':unittest.main()

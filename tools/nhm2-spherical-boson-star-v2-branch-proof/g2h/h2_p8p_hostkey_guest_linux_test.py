import copy
import unittest
import json
import base64
from h2_p8p_hostkey_guest_linux import LinuxGuestOps, select_partition, parse_mounts


def inventory():
    return {'blockdevices':[{'path':'/dev/sdb','type':'disk','ro':True,'children':[
        {'path':'/dev/sdb1','type':'part','ro':True,'fstype':'ext4','maj:min':'8:17'},
        {'path':'/dev/sdb15','type':'part','ro':True,'fstype':'vfat','maj:min':'8:31'}]}]}


class LinuxOpsTests(unittest.TestCase):
    def test_select_single_supported_partition(self):
        self.assertEqual(select_partition(inventory(), '/dev/sdb')['path'],'/dev/sdb1')
    def test_reject_bad_inventory(self):
        for change in ('writable_disk','writable_partition','duplicate','wrong_disk','nested','unknown_fs'):
            data=inventory(); disk=data['blockdevices'][0]; part=disk['children'][0]
            if change=='writable_disk': disk['ro']=False
            if change=='writable_partition': part['ro']=False
            if change=='duplicate': disk['children'].append(copy.deepcopy(part))
            if change=='wrong_disk': disk['path']='/dev/sda'
            if change=='nested': part['children']=[{}]
            if change=='unknown_fs': disk['children'][1]['fstype']='crypto_LUKS'
            with self.subTest(change=change), self.assertRaises(ValueError):
                select_partition(data,'/dev/sdb')
    def ops(self):
        ops=LinuxGuestOps(device_alias='/dev/disk/by-id/google-nhm2-test',mountpoint='/mnt/nhm2-test',instance_id='123',attempt_id='a'*64,runner=lambda argv: b'')
        ops.partition=inventory()['blockdevices'][0]['children'][0]
        ops.verify_device=lambda device: None
        return ops
    def test_readonly_mount_semantics(self):
        ops=self.ops()
        valid='30 1 8:17 / /mnt/nhm2-test ro,relatime - ext4 /dev/sdb1 ro,norecovery\n'
        ops.mounts=lambda: parse_mounts(valid)
        ops.verify_readonly_mount('/dev/sdb1','/mnt/nhm2-test','ext4','ro,noload')
        variants=[valid.replace('ro,relatime','rw,relatime'),valid.replace('ro,norecovery','rw,norecovery'),
                  valid.replace('ro,norecovery','ro'),valid+valid,valid.replace(' / /mnt',' /sub /mnt')]
        for text in variants:
            ops.mounts=lambda: parse_mounts(text)
            with self.assertRaises(ValueError): ops.verify_readonly_mount('/dev/sdb1','/mnt/nhm2-test','ext4','ro,noload')
    def test_unmount_checks_device_elsewhere(self):
        ops=self.ops();ops.mounts=lambda:parse_mounts('30 1 8:17 / /elsewhere ro - ext4 /dev/sdb1 ro,norecovery')
        with self.assertRaises(ValueError):ops.assert_unmounted('/dev/sdb1','/mnt/nhm2-test')
    def test_only_exact_commands_admitted(self):
        ops=self.ops()
        with self.assertRaises(ValueError): ops.command(['mount','-o','rw','/dev/sdb1','/mnt/nhm2-test'])
        with self.assertRaises(ValueError): ops.command(['umount','--','/mnt/other'])
        ops.command(['umount','--','/mnt/nhm2-test'])
    def test_mountinfo_bound(self):
        for text in ('broken','x'*65537):
            with self.assertRaises(ValueError):parse_mounts(text)
    def test_export_fixed_deadline_and_identity(self):
        ops=self.ops(); calls=[]
        ops.runner=lambda argv, **kw:calls.append((argv,kw))
        ops.export({'pass':False,'failure':'ValueError','cleanup_failure':None,'mount_attempted':False,'unmounted':False})
        argv,kw=calls[0]
        self.assertEqual(kw,{'seconds':5,'cap':4096})
        self.assertEqual(argv[-2],'--export-once')
        payload=json.loads(base64.b64decode(argv[-1]))
        self.assertEqual(payload['instance_id'],'123')
        self.assertEqual(payload['attempt_id'],'a'*64)
        with self.assertRaises(ValueError):ops.export({'instance_id':'other'})
    def test_export_timeout_is_failure_no_retry(self):
        ops=self.ops(); calls=[]
        def fail(argv,**kw):
            calls.append(argv)
            raise TimeoutError('deadline')
        ops.runner=fail
        with self.assertRaises(TimeoutError):ops.export({'pass':False})
        self.assertEqual(len(calls),1)


if __name__=='__main__':unittest.main()

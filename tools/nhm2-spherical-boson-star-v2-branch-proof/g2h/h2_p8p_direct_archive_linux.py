"""Direct archive transport on the existing read-only Linux executor."""
import base64
import json
import os
import re
import sys
import urllib.request
from h2_p8p_hostkey_guest_linux import LinuxGuestOps
from h2_p8p_direct_archive import read_archive, authenticate_archive, ARCHIVE_BYTES, ARCHIVE_SHA256


def validate_export(receipt):
    common={'pass','failure','cleanup_failure','mount_attempted','unmounted'}
    identity={'schema','instance_id','attempt_id'}
    extra={'archive_bytes','archive_sha256','archive_base64'}
    if not isinstance(receipt,dict):raise ValueError('receipt_shape')
    if receipt.get('schema')!='nhm2-direct-archive-v1':raise ValueError('schema')
    if not isinstance(receipt.get('instance_id'),str) or not re.fullmatch(r'[1-9][0-9]*',receipt['instance_id']):raise ValueError('instance_id')
    if not isinstance(receipt.get('attempt_id'),str) or not re.fullmatch(r'[a-f0-9]{64}',receipt['attempt_id']):raise ValueError('attempt_id')
    if receipt.get('pass') is True:
        if set(receipt)!=common|identity|extra:raise ValueError('success_fields')
        if receipt['failure'] is not None or receipt['cleanup_failure'] is not None or receipt['mount_attempted'] is not True or receipt['unmounted'] is not True:raise ValueError('cleanup')
        if type(receipt['archive_bytes']) is not int or receipt['archive_bytes']!=ARCHIVE_BYTES or receipt['archive_sha256']!=ARCHIVE_SHA256:raise ValueError('archive_identity')
        encoded=receipt['archive_base64']
        if not isinstance(encoded,str) or len(encoded)!=16164:raise ValueError('encoded_size')
        content=base64.b64decode(encoded,validate=True)
        if authenticate_archive(content)!=encoded:raise ValueError('encoded_noncanonical')
    elif receipt.get('pass') is False:
        if set(receipt)!=common|identity:raise ValueError('failure_fields')
        for key in ('failure','cleanup_failure'):
            if receipt[key] is not None and (not isinstance(receipt[key],str) or not re.fullmatch(r'[A-Za-z]{1,64}',receipt[key])):raise ValueError('failure_code')
        if receipt['failure'] is None and receipt['cleanup_failure'] is None:raise ValueError('missing_failure')
        if type(receipt['mount_attempted']) is not bool or type(receipt['unmounted']) is not bool:raise ValueError('failure_flags')
    else:raise ValueError('pass_type')


class DirectArchiveOps(LinuxGuestOps):
    def read_archive(self,mountpoint):
        if mountpoint!=self.mountpoint:raise ValueError('mount_identity')
        return read_archive(mountpoint)

    def export(self,receipt):
        if set(receipt)&{'schema','instance_id','attempt_id'}:raise ValueError('identity_override')
        value={**receipt,'schema':'nhm2-direct-archive-v1','instance_id':self.instance_id,'attempt_id':self.attempt_id}
        validate_export(value)
        payload=json.dumps(value,separators=(',',':')).encode('ascii')
        if len(payload)>24576:raise ValueError('receipt_cap')
        self.runner([sys.executable,'-B',os.path.abspath(__file__),'--archive-export-once',base64.b64encode(payload).decode('ascii')],seconds=5,cap=4096)


def receipt_namespace():
    revision=os.environ.get('NHM2_RECOVERY_REVISION','original')
    if revision not in ('original','retained-helper-v1','retained-helper-v2'):raise ValueError('receipt_revision')
    return 'nhm2-archive' + ('' if revision=='original' else '-retained-v1' if revision=='retained-helper-v1' else '-retained-v2')


def export_once(payload):
    namespace=receipt_namespace()
    if not isinstance(payload,bytes) or not 0<len(payload)<=24576:raise ValueError('receipt_cap')
    value=json.loads(payload)
    if json.dumps(value,separators=(',',':')).encode('ascii')!=payload:raise ValueError('receipt_encoding')
    validate_export(value)
    url='http://metadata.google.internal/computeMetadata/v1/instance/guest-attributes/'+namespace+'/receipt'
    request=urllib.request.Request(url,data=payload,method='PUT',headers={'Metadata-Flavor':'Google','Content-Type':'application/json'})
    class NoRedirect(urllib.request.HTTPRedirectHandler):
        def redirect_request(self,*a,**kw):raise RuntimeError('metadata_redirect')
    opener=urllib.request.build_opener(urllib.request.ProxyHandler({}),NoRedirect())
    with opener.open(request,timeout=5) as response:
        if response.status!=200 or response.headers.get('Metadata-Flavor')!='Google':raise RuntimeError('metadata_response')
        if len(response.read(1025))>1024:raise RuntimeError('metadata_response_cap')


if __name__=='__main__':
    if len(sys.argv)!=3 or sys.argv[1]!='--archive-export-once' or len(sys.argv[2])>32768:raise SystemExit('invalid_worker')
    export_once(base64.b64decode(sys.argv[2],validate=True))

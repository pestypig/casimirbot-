"""Bounded public fixture receipt transport; no action on import."""
import base64
import json
import os
import re
import sys
import urllib.request
from h2_p8p_cloud_linux_fixture import run_fixture
from h2_p8p_hostkey_guest_linux import bounded_command

CHECKS=['wrong_size','wrong_hash_after_regular_read','leaf_symlink','parent_symlink',
        'fifo_nonblocking_rejection','worker_timeout_reaped','worker_output_cap']

def receipt_namespace():
    revision=os.environ.get('NHM2_RECOVERY_REVISION','original')
    if revision not in ('original','retained-helper-v1','retained-helper-v2'):raise ValueError('receipt_revision')
    return 'nhm2-fixture' + ('' if revision=='original' else '-retained-v1' if revision=='retained-helper-v1' else '-retained-v2')

def validate(value):
    if not isinstance(value,dict) or set(value)!={'attempt_id','pass','checks','failure'}:
        raise ValueError('fixture_fields')
    if not isinstance(value['attempt_id'],str) or not re.fullmatch(r'[a-f0-9]{64}',value['attempt_id']):
        raise ValueError('fixture_attempt')
    if value['pass'] is True:
        if value['checks']!=CHECKS or value['failure'] is not None:raise ValueError('fixture_success')
    elif value['pass'] is False:
        if value['checks']!=[] or not isinstance(value['failure'],str) or not re.fullmatch(r'[A-Za-z]{1,64}',value['failure']):
            raise ValueError('fixture_failure')
    else:raise ValueError('fixture_pass')

def export_once(payload):
    namespace=receipt_namespace()
    if len(payload)>2048:raise ValueError('fixture_cap')
    value=json.loads(payload);validate(value)
    class NoRedirect(urllib.request.HTTPRedirectHandler):
        def redirect_request(self,*a,**kw):raise RuntimeError('metadata_redirect')
    opener=urllib.request.build_opener(urllib.request.ProxyHandler({}),NoRedirect())
    headers={'Metadata-Flavor':'Google'}
    prefix='http://metadata.google.internal/computeMetadata/v1/instance/'
    with opener.open(urllib.request.Request(prefix+'id',headers=headers),timeout=3) as response:
        if response.status!=200 or response.headers.get('Metadata-Flavor')!='Google':raise RuntimeError('metadata_response')
        instance=response.read(65).decode('ascii')
    if not re.fullmatch(r'[1-9][0-9]{0,31}',instance):raise ValueError('fixture_instance')
    receipt={**value,'schema':'nhm2-cloud-linux-fixture-v1','instance_id':instance}
    data=json.dumps(receipt,separators=(',',':')).encode('ascii')
    request=urllib.request.Request(prefix+'guest-attributes/'+namespace+'/receipt',data=data,method='PUT',headers=headers)
    with opener.open(request,timeout=3) as response:
        if response.status!=200 or response.headers.get('Metadata-Flavor')!='Google':raise RuntimeError('metadata_response')
        if len(response.read(1025))>1024:raise ValueError('metadata_response_cap')

def run_and_export(attempt_id):
    if not re.fullmatch(r'[a-f0-9]{64}',attempt_id):raise ValueError('fixture_attempt')
    failure=None
    try:
        result=run_fixture(attempt_id)
        value={'attempt_id':attempt_id,'pass':True,'checks':result['checks'],'failure':None}
    except Exception as error:
        failure=error
        value={'attempt_id':attempt_id,'pass':False,'checks':[],'failure':type(error).__name__}
    validate(value)
    payload=base64.b64encode(json.dumps(value,separators=(',',':')).encode('ascii')).decode('ascii')
    bounded_command([sys.executable,'-B',os.path.abspath(__file__),'--export-once',payload],seconds=10,cap=4096)
    if failure is not None:raise failure

if __name__=='__main__':
    if len(sys.argv)!=3 or sys.argv[1]!='--export-once' or len(sys.argv[2])>4096:raise SystemExit('invalid_fixture_worker')
    export_once(base64.b64decode(sys.argv[2],validate=True))

import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {receiptNamespace} from './h2_p8p_receipt_namespace.mjs';
import {readArgs} from './h2_p8p_hostkey_api_read.mjs';
import {readPendingReceipt} from './h2_p8p_pending_receipt_read.mjs';
import {proposedResources as r} from './h2_p8p_hostkey_resource_commands.mjs';
test('closed namespace map matches actual bundled-Python producer functions',()=>{
 const code=`import sys,os,json
sys.path.insert(0,sys.argv[1])
import h2_p8p_fixture_transport as f
import h2_p8p_direct_archive_linux as a
result=[]
for revision in ('original','retained-helper-v1','retained-helper-v2'):
 os.environ['NHM2_RECOVERY_REVISION']=revision
 result.append([f.receipt_namespace(),a.receipt_namespace()])
os.environ['NHM2_RECOVERY_REVISION']='invalid'
for module in (f,a):
 try: module.receipt_namespace()
 except ValueError: pass
 else: raise AssertionError('invalid revision accepted')
print(json.dumps(result))`;
 const python='C:/Users/dan/AppData/Local/NHM2/p8p-r22-gcloud-583.0.0/sdk/google-cloud-sdk/platform/bundledpython/python.exe';
 const actual=JSON.parse(execFileSync(python,['-B','-c',code,import.meta.dirname],{encoding:'utf8',windowsHide:true,timeout:5000,maxBuffer:4096}));
 assert.deepEqual(actual,['original','retained-helper-v1','retained-helper-v2'].map(v=>['fixture','archive'].map(k=>receiptNamespace(k,v))));
});
test('SDK arguments scope successor namespaces to exact helper',()=>{
 for(const kind of ['fixture','archive']){
  assert.ok(readArgs(kind,r.helper,'retained-helper-v1').includes(`--query-path=${receiptNamespace(kind,'retained-helper-v1')}/`));
  assert.throws(()=>readArgs(kind,'nhm2-other','retained-helper-v1'));
 }
 assert.throws(()=>readArgs('instance',r.helper,'retained-helper-v1'));
 assert.throws(()=>receiptNamespace('fixture','arbitrary'));
});
test('successor pending response cannot consume predecessor namespace error',async()=>{
 const options={kind:'fixture',name:r.helper,revision:'retained-helper-v1',deadline:60000,now:()=>0,record:async()=>{}};
 const error=namespace=>Object.assign(Error('process_exit_1'),{exitCode:1,terminationConfirmed:true,stdout:'',
  stderr:`ERROR: (gcloud.compute.instances.get-guest-attributes) HTTPError 404: The resource '${namespace}/' of type 'Guest Attribute' was not found. This command is authenticated as pestypig@gmail.com which is the active account specified by the [core/account] property.\n`});
 await assert.rejects(readPendingReceipt(options,async()=>{throw error('nhm2-fixture');}));
 assert.deepEqual((await readPendingReceipt(options,async()=>{throw error('nhm2-fixture-retained-v1');})).data,[]);
});

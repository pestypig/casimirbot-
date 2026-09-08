import {proposedResources as r} from './h2_p8p_hostkey_resource_commands.mjs';
import {receiptNamespace} from './h2_p8p_receipt_namespace.mjs';
const checks=['wrong_size','wrong_hash_after_regular_read','leaf_symlink','parent_symlink',
 'fifo_nonblocking_rejection','worker_timeout_reaped','worker_output_cap'];
// Caller must obtain helper and API observations through the authenticated SDK.
export function validateFixtureReceipt({api,helper,attemptId,notBefore,deadline,revision='original'}){
 const namespace=receiptNamespace('fixture',revision);
 const url=`https://www.googleapis.com/compute/v1/projects/${r.project}/zones/${r.zone}/instances/${r.helper}`;
 if(helper?.selfLink!==url||helper.name!==r.helper||helper.status!=='RUNNING'||
  typeof helper.id!=='string'||!/^[1-9][0-9]*$/.test(helper.id))throw Error('fixture_helper');
 if(api?.helperId!==helper.id||api.helperURL!==url)throw Error('fixture_api_identity');
 if(typeof attemptId!=='string'||!/^[a-f0-9]{64}$/.test(attemptId))throw Error('fixture_attempt');
 const time=Date.parse(api.observedAt);
 if(!Number.isFinite(notBefore)||!Number.isFinite(deadline)||notBefore>=deadline||
  !Number.isFinite(time)||new Date(time).toISOString()!==api.observedAt||time<notBefore||time>=deadline)
  throw Error('fixture_chronology');
 if(!Array.isArray(api.data)||api.data.length!==1)throw Error('fixture_inventory');
 const item=api.data[0];
 if(item?.namespace!==namespace||item.key!=='receipt'||Object.keys(item).sort().join(',')!=='key,namespace,value')
  throw Error('fixture_entry');
 if(typeof item.value!=='string'||Buffer.byteLength(item.value)>2048)throw Error('fixture_cap');
 const v=JSON.parse(item.value);
 if(!v||typeof v!=='object'||JSON.stringify(v)!==item.value||
  Object.keys(v).sort().join(',')!=='attempt_id,checks,failure,instance_id,pass,schema')throw Error('fixture_encoding');
 if(v.schema!=='nhm2-cloud-linux-fixture-v1'||v.instance_id!==helper.id||v.attempt_id!==attemptId)
  throw Error('fixture_receipt_identity');
 if(v.pass!==true||v.failure!==null||JSON.stringify(v.checks)!==JSON.stringify(checks))throw Error('fixture_not_passed');
 return Object.freeze({pass:true,helperId:helper.id,attemptId,observedAt:api.observedAt});
}

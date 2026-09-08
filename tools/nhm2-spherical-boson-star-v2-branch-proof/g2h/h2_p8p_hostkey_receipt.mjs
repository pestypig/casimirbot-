import {validateResourceChain} from './h2_p8p_hostkey_provenance.mjs';
import {requireExpectedFingerprint} from './h2_p8p_hostkey_public.mjs';

// Pure validation only: callers must independently authenticate and preserve
// the API response and frozen inputs. No trust cache or SSH operation occurs.
export function validateHostkeyReceipt({observed,frozen,api,attemptId,expectedFingerprint}) {
  const chain=validateResourceChain(observed,frozen);
  if(typeof attemptId!=='string'||!(/^[a-f0-9]{64}$/).test(attemptId))throw Error('receipt_attempt_format');
  if(api?.helperId!==chain.helperId||api?.helperURL!==frozen.helper.selfLink)throw Error('receipt_api_resource');
  // Local capture emits canonical UTC milliseconds, unlike Google timestamps.
  const stamp=api.observedAt;
  if(typeof stamp!=='string'||!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(stamp)||
    !Number.isFinite(Date.parse(stamp))||new Date(stamp).toISOString()!==stamp)throw Error('receipt_capture_time');
  if(Date.parse(stamp)<Date.parse(observed.observedAt)||Date.parse(stamp)>=Date.parse(frozen.deadline))throw Error('receipt_capture_chronology');
  if(!Array.isArray(api.data)||api.data.length!==1)throw Error('receipt_inventory');
  const item=api.data[0];
  if(!item||item.namespace!=='nhm2-hostkey'||item.key!=='receipt'||
    Object.keys(item).sort().join(',')!=='key,namespace,value')throw Error('receipt_entry');
  if(typeof item.value!=='string'||Buffer.byteLength(item.value,'utf8')>4096)throw Error('receipt_size');
  const value=JSON.parse(item.value);
  // Exact compact JSON roundtrip rejects duplicate keys and alternative lexical
  // representations. This is this protocol's encoding, not generic RFC8785.
  if(!value||typeof value!=='object'||Array.isArray(value)||JSON.stringify(value)!==item.value)throw Error('receipt_encoding');
  const fields=['schema','instance_id','attempt_id','pass','failure','cleanup_failure','mount_attempted','unmounted','public_key'];
  if(Object.keys(value).sort().join(',')!==fields.sort().join(','))throw Error('receipt_fields');
  if(value.schema!=='nhm2-public-hostkey-v1'||value.instance_id!==chain.helperId||value.attempt_id!==attemptId)throw Error('receipt_identity');
  if(value.pass!==true||value.failure!==null||value.cleanup_failure!==null||value.mount_attempted!==true||value.unmounted!==true)throw Error('receipt_guest_failure');
  if(typeof value.public_key!=='string')throw Error('receipt_public_key');
  const key=requireExpectedFingerprint(Buffer.from(value.public_key,'utf8'),expectedFingerprint);
  return Object.freeze({structuralChecksPassed:true,helperId:chain.helperId,sourceDiskId:chain.sourceDiskId,
    attemptId,publicKey:key.canonical,fingerprint:key.fingerprint});
}

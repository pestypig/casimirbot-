import {createHash} from 'node:crypto';
import {validateResourceChain} from './h2_p8p_hostkey_provenance.mjs';
import {validateRetainedResourceChain} from './h2_p8p_retained_provenance.mjs';
import {receiptNamespace} from './h2_p8p_receipt_namespace.mjs';
const BYTES=12122;
const SHA='73029fde08f14f9fcd01490c4e5d5bc188213eaa2f9a8d857eb5e456b86d0922';

// Pure validation; input API/resource provenance must be authenticated by the
// controller. No file is written and no expected digest override is accepted.
export function validateDirectArchiveReceipt(input){
 return validateReceipt(input,validateResourceChain(input.observed,input.frozen),'original');
}
export function validateRetainedArchiveReceipt(input,revision='retained-helper-v1'){
 if(!['retained-helper-v1','retained-helper-v2'].includes(revision))throw Error('retained_archive_revision');
 return validateReceipt(input,validateRetainedResourceChain(input.observed,input.frozen),revision);
}
function validateReceipt({observed,frozen,api,attemptId},chain,revision){
 if(typeof attemptId!=='string'||!(/^[a-f0-9]{64}$/).test(attemptId))throw Error('archive_attempt_format');
 if(api?.helperId!==chain.helperId||api.helperURL!==frozen.helper.selfLink)throw Error('archive_api_identity');
 const t=api.observedAt;
 if(typeof t!=='string'||!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(t)||!Number.isFinite(Date.parse(t))||new Date(t).toISOString()!==t)throw Error('archive_capture_time');
 if(Date.parse(t)<Date.parse(observed.observedAt)||Date.parse(t)>=Date.parse(frozen.deadline))throw Error('archive_capture_chronology');
 if(!Array.isArray(api.data)||api.data.length!==1)throw Error('archive_inventory');
 const item=api.data[0];
 if(!item||item.namespace!==receiptNamespace('archive',revision)||item.key!=='receipt'||Object.keys(item).sort().join(',')!=='key,namespace,value')throw Error('archive_entry');
 if(typeof item.value!=='string'||Buffer.byteLength(item.value,'utf8')>24576)throw Error('archive_receipt_size');
 const r=JSON.parse(item.value);
 if(!r||typeof r!=='object'||Array.isArray(r)||JSON.stringify(r)!==item.value)throw Error('archive_receipt_encoding');
 const keys=['schema','instance_id','attempt_id','pass','failure','cleanup_failure','mount_attempted','unmounted','archive_bytes','archive_sha256','archive_base64'];
 if(Object.keys(r).sort().join(',')!==keys.sort().join(','))throw Error('archive_receipt_fields');
 if(r.schema!=='nhm2-direct-archive-v1'||r.instance_id!==chain.helperId||r.attempt_id!==attemptId)throw Error('archive_guest_identity');
 if(r.pass!==true||r.failure!==null||r.cleanup_failure!==null||r.mount_attempted!==true||r.unmounted!==true)throw Error('archive_guest_failure');
 if(r.archive_bytes!==BYTES||r.archive_sha256!==SHA)throw Error('archive_frozen_identity');
 if(typeof r.archive_base64!=='string'||r.archive_base64.length!==16164||!/^[A-Za-z0-9+/]{16163}=$/.test(r.archive_base64))throw Error('archive_base64');
 const content=Buffer.from(r.archive_base64,'base64');
 if(content.length!==BYTES||content.toString('base64')!==r.archive_base64)throw Error('archive_encoding');
 if(createHash('sha256').update(content).digest('hex')!==SHA)throw Error('archive_content_hash');
 return content;
}

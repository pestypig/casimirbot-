// Receipt-stage binding only; no execution on import. Resource enrollment,
// authorization, and absolute attempt deadline remain caller prerequisites.
import {setTimeout as wait} from 'node:timers/promises';
import {readPendingReceipt} from './h2_p8p_pending_receipt_read.mjs';
import {readObservation} from './h2_p8p_hostkey_api_read.mjs';
import {receiptNamespace} from './h2_p8p_receipt_namespace.mjs';
import {validateFixtureReceipt} from './h2_p8p_fixture_receipt.mjs';
import {validateDirectArchiveReceipt,validateRetainedArchiveReceipt} from './h2_p8p_direct_archive_receipt.mjs';
import {proposedResources as r} from './h2_p8p_hostkey_resource_commands.mjs';
// Proposed observation windows, to be included in the final frozen manifest.
// Fixture includes60s work+15s export/kill and startup scheduling allowance.
export const receiptPhaseMs=Object.freeze({fixture:300000,archive:600000});
export function recoveryReceiptOps({record,attemptId,revision='original',now=Date.now,read=readObservation,delay=wait}){
 receiptNamespace('fixture',revision);
 if(!/^[a-f0-9]{64}$/.test(attemptId??''))throw Error('receipt_attempt');
 async function capture(kind,helper,deadline){
  const url=`https://www.googleapis.com/compute/v1/projects/${r.project}/zones/${r.zone}/instances/${r.helper}`;
  if(helper?.name!==r.helper||helper.selfLink!==url||typeof helper.id!=='string'||!/^[1-9][0-9]*$/.test(helper.id))
   throw Error('receipt_helper_identity');
  if(!Number.isFinite(deadline))throw Error('receipt_poll_deadline');
  const phaseDeadline=Math.min(deadline,now()+receiptPhaseMs[kind]);
  const maxReads=Math.ceil(receiptPhaseMs[kind]/5000)+1;
  for(let i=0;i<maxReads;i++){
   if(phaseDeadline-now()<=20000)throw Error('receipt_poll_deadline');
   const observed=await readPendingReceipt({kind,name:r.helper,revision,deadline:phaseDeadline,record,now},read);
   if(!Array.isArray(observed.data))throw Error('receipt_api_shape');
   if(observed.data.length)return {data:observed.data,observedAt:observed.observedAt,helperId:helper.id,helperURL:url};
   // A genuinely empty namespace while the guest works is a pending state,
   // The successor adapter also recognizes the exact SDK namespace-absent
   // response as pending; unrelated errors and failed receipts remain terminal.
   if(i===maxReads-1)break;
   if(phaseDeadline-now()<=25000)throw Error('receipt_poll_deadline');
   await delay(5000);
  }
  throw Error('receipt_not_observed');
 }
 return {
  async validateLinuxFixture({running},{deadline}){
   const api=await capture('fixture',running?.vm,deadline);
   return validateFixtureReceipt({api,helper:running.vm,attemptId,revision,
    notBefore:Date.parse(running.observedAt),deadline});
  },
  async readArchiveReceipt({chain},{deadline}){
   return capture('archive',chain?.observed?.helper,deadline);
  },
  async validateArchiveReceipt({receipt,chain}){
   const validate=revision==='original'?validateDirectArchiveReceipt:validateRetainedArchiveReceipt;
   return validate({observed:chain.observed,frozen:chain.frozen,api:receipt,attemptId},revision);
  },
 };
}

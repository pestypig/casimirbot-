// Candidate-neutral ownership successor. Import is inert. Preparing an anchor
// or invoking these functions for a real attempt requires separate authority.
import {createHash} from 'node:crypto';
import {constants} from 'node:fs';
import * as fs from 'node:fs/promises';
import path from 'node:path';

export const R50_ANCHOR_NAME='r50-host-anchor-v1.jsonl';
export const R50_PREPARED_HEADER=Buffer.from(
  '{"schema":"nhm2.p8p.r50.host-anchor.v1","state":"prepared"}\n','utf8');
const scope='R48_CANDIDATE_NEUTRAL_RECOVERY_ONLY';
const hex=/^[a-f0-9]{64}$/;
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const sameFile=(a,b)=>a.dev===b.dev && a.ino===b.ino;

export async function claimR50HostAnchor({baseRoot,attempt,
  proposalSha256,storage=fs}={}) {
  if(typeof baseRoot!=='string' || !path.isAbsolute(baseRoot) ||
     typeof attempt!=='string' || !hex.test(attempt) ||
     typeof proposalSha256!=='string' || !hex.test(proposalSha256) ||
     !storage || typeof storage.lstat!=='function' ||
     typeof storage.open!=='function')
    throw Error('r50_anchor_binding');
  const parent=await storage.lstat(baseRoot,{bigint:true});
  if(!parent.isDirectory() || parent.isSymbolicLink())
    throw Error('r50_anchor_parent');
  const file=path.join(baseRoot,R50_ANCHOR_NAME);
  const initial=await storage.lstat(file,{bigint:true});
  if(!initial.isFile() || initial.isSymbolicLink() ||
     initial.nlink!==1n ||
     initial.size!==BigInt(R50_PREPARED_HEADER.length))
    throw Error('r50_anchor_unprepared_or_consumed');
  const handle=await storage.open(file,constants.O_RDWR|constants.O_APPEND);
  try {
    const opened=await handle.stat({bigint:true});
    if(!opened.isFile() || !sameFile(initial,opened) ||
       opened.nlink!==1n ||
       opened.size!==BigInt(R50_PREPARED_HEADER.length))
      throw Error('r50_anchor_identity');
    const before=Buffer.alloc(R50_PREPARED_HEADER.length);
    const read=await handle.read(before,0,before.length,0);
    if(read.bytesRead!==before.length ||
       !before.equals(R50_PREPARED_HEADER))
      throw Error('r50_anchor_header');
    const claim=Buffer.from(JSON.stringify({
      schema:'nhm2.p8p.r50.host-claim.v1',proposalSha256,attempt,scope,
    })+'\n','utf8');
    const written=await handle.write(claim,0,claim.length,null);
    if(written.bytesWritten!==claim.length)
      throw Error('r50_anchor_partial_claim');
    await handle.sync();
    const after=await handle.stat({bigint:true});
    const expected=Buffer.concat([R50_PREPARED_HEADER,claim]);
    if(!sameFile(opened,after) || after.nlink!==1n ||
       after.size!==BigInt(expected.length))
      throw Error('r50_anchor_competing_claim');
    const observed=Buffer.alloc(expected.length);
    const reread=await handle.read(observed,0,observed.length,0);
    const named=await storage.lstat(file,{bigint:true});
    if(reread.bytesRead!==expected.length ||
       !observed.equals(expected) || !sameFile(opened,named) ||
       named.nlink!==1n || named.size!==BigInt(expected.length))
      throw Error('r50_anchor_readback');
    return Object.freeze({pass:true,path:file,bytes:expected.length,
      sha256:sha(expected),claimSha256:sha(claim)});
  } finally {await handle.close();}
}

async function requireAbsent(storage,target) {
  try {await storage.lstat(target);throw Error('r50_local_exists');}
  catch(error) {
    if(error?.message==='r50_local_exists' || error?.code!=='ENOENT')
      throw error;
  }
}

export async function reserveR50LocalAttempt({baseRoot,attempt,
  proposalSha256,maxCostCents,maxHelperSeconds,expiresAt,anchor,
  authorize,clock=()=>new Date(),createJournal,storage=fs}={}) {
  if(typeof baseRoot!=='string' || !path.isAbsolute(baseRoot) ||
     typeof attempt!=='string' || !hex.test(attempt) ||
     typeof proposalSha256!=='string' || !hex.test(proposalSha256) ||
     !Number.isInteger(maxCostCents) || maxCostCents<1 ||
     maxCostCents>100 || !Number.isInteger(maxHelperSeconds) ||
     maxHelperSeconds<900 || maxHelperSeconds>1200 ||
     typeof expiresAt!=='string' ||
     !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/.test(expiresAt) ||
     anchor?.pass!==true ||
     anchor.path!==path.join(baseRoot,R50_ANCHOR_NAME) ||
     typeof anchor.sha256!=='string' || !hex.test(anchor.sha256) ||
     typeof anchor.claimSha256!=='string' || !hex.test(anchor.claimSha256) ||
     typeof authorize!=='function' || typeof clock!=='function' ||
     typeof createJournal!=='function' || !storage ||
     ['lstat','mkdir','open'].some(name=>typeof storage[name]!=='function'))
    throw Error('r50_local_binding');
  const parent=await storage.lstat(baseRoot);
  if(!parent.isDirectory() || parent.isSymbolicLink())
    throw Error('r50_local_base');
  const approved=await authorize({attempt,proposalSha256,maxCostCents,
    maxHelperSeconds,expiresAt});
  if(approved?.authorized!==true || approved.scope!==scope ||
     approved.attempt!==attempt ||
     approved.proposalSha256!==proposalSha256 ||
     approved.maxCostCents!==maxCostCents ||
     approved.maxHelperSeconds!==maxHelperSeconds ||
     approved.expiresAt!==expiresAt ||
     approved.scientificAuthority!==false)
    throw Error('r50_local_not_authorized');
  const stamp=clock().toISOString().replace(/\.\d{3}Z$/,'Z');
  if(!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/.test(stamp) ||
     Date.parse(expiresAt)<=Date.parse(stamp))
    throw Error('r50_local_clock');
  // Preserve the existing R48 attempt layout for unchanged child protocols.
  const root=path.join(baseRoot,`r48-${attempt}`);
  await requireAbsent(storage,root);
  await storage.mkdir(root,{recursive:false,mode:0o700});
  const reservation={schema:'nhm2.p8p.r50.local-reservation.v1',
    attempt,proposalSha256,utc:stamp,scope,maxCostCents,
    maxHelperSeconds,expiresAt,scientificAuthority:false,
    hostAnchorSha256:anchor.sha256,
    hostClaimSha256:anchor.claimSha256};
  const bytes=Buffer.from(JSON.stringify(reservation)+'\n','utf8');
  const handle=await storage.open(path.join(root,'reservation.jsonl'),'wx',0o600);
  try {await handle.writeFile(bytes);await handle.sync();}
  finally {await handle.close();}
  const workload=await createJournal({root:path.join(root,'workload'),
    attempt,channel:'workload',clock});
  const captureRoot=path.join(root,'capture');
  await storage.mkdir(captureRoot,{recursive:false,mode:0o700});
  const recorded=await workload.append({event:'RESERVED',proposalSha256,
    reservationSha256:sha(bytes),anchorSha256:anchor.sha256});
  if(recorded?.durable!==true)throw Error('r50_local_evidence');
  await requireAbsent(storage,path.join(root,'safety'));
  return Object.freeze({reserved:true,root,captureRoot,workload,
    reservationSha256:sha(bytes),proposalSha256,expiresAt});
}

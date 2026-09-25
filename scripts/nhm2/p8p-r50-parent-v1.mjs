// Candidate-neutral same-root parent composition. Import is inert. This is a
// local implementation definition, not an operator launcher or authorization.
import path from 'node:path';
import os from 'node:os';
import * as fs from 'node:fs/promises';
import {claimR50HostAnchor,reserveR50LocalAttempt,R50_ANCHOR_NAME}
  from './p8p-r50-ownership-v1.mjs';

const sourceRoot=String.raw`C:\NHM2-P8P-Workflow-Review`;
const scope='R48_CANDIDATE_NEUTRAL_RECOVERY_ONLY';
const hex=/^[a-f0-9]{64}$/;
const safetyEntryPath=path.join(sourceRoot,'p8p_r49_safety_cli_v1.mjs');
const safetyEntrySha256=
  'ccbb80800a532068a7773b0afdd2e3507af2602031ef679c4466f10e5922f355';
const requiredRuntime=['audit','replayLayout','readHelper','tokenSupplier',
  'fetchImpl'];

export async function runR50Parent(options={},deps={}) {
  if(!options || typeof options!=='object' || Array.isArray(options) ||
     ['baseRoot','claimHost','reserveLocal','makeRunner','safetyEntryPath']
       .some(name=>Object.hasOwn(options,name)))
    throw Error('r50_parent_override');
  const {proposalBytes,proposalSha256,attempt,grant,quotedWorstCaseCents,
    authenticateUserGrant}=options;
  const {createAdmissionGate,claimHost=claimR50HostAnchor,
    reserveLocal=reserveR50LocalAttempt,createJournal,
    renderBundle,stageStartup,stageHandoff,makeRunner,bindRuntime,
    clock=Date.now,fixtureControlRoot}=deps;
  // Only a trusted local fixture may supply this port. A future operator
  // adapter must omit it; request options cannot set it.
  const baseRoot=fixtureControlRoot===undefined?sourceRoot:fixtureControlRoot;
  if(typeof authenticateUserGrant!=='function' ||
     typeof baseRoot!=='string' || !path.isAbsolute(baseRoot) ||
     [createAdmissionGate,claimHost,reserveLocal,createJournal,
      renderBundle,stageStartup,stageHandoff,makeRunner,bindRuntime,clock]
       .some(value=>typeof value!=='function'))
    throw Error('r50_parent_binding');
  if(fixtureControlRoot!==undefined) {
    const [temp,real,info]=await Promise.all([
      fs.realpath(os.tmpdir()),fs.realpath(fixtureControlRoot),
      fs.lstat(fixtureControlRoot)]);
    if(!info.isDirectory() || info.isSymbolicLink() ||
       path.dirname(real).toLowerCase()!==temp.toLowerCase() ||
       !path.basename(real).startsWith('p8p-r50-'))
      throw Error('r50_parent_fixture_scope');
  }
  const gate=await createAdmissionGate({proposalBytes,proposalSha256,
    attempt,grant,authenticateGrant:authenticateUserGrant,
    quotedWorstCaseCents,clock});
  const grantSnapshot=Object.freeze({authorized:true,scope,
    proposalSha256,attempt,scientificAuthority:false,
    maxCostCents:gate.maxCostCents,
    maxHelperSeconds:gate.maxHelperSeconds,expiresAt:gate.expiresAt});
  gate.authorize({attempt});
  const anchor=await claimHost({baseRoot,attempt,proposalSha256});
  if(anchor?.pass!==true ||
     anchor.path!==path.join(baseRoot,R50_ANCHOR_NAME) ||
     typeof anchor.sha256!=='string' || !hex.test(anchor.sha256) ||
     typeof anchor.claimSha256!=='string' || !hex.test(anchor.claimSha256))
    throw Error('r50_parent_anchor');
  let reservation=null;
  try {
    reservation=await reserveLocal({baseRoot,attempt,proposalSha256,
      maxCostCents:gate.maxCostCents,
      maxHelperSeconds:gate.maxHelperSeconds,expiresAt:gate.expiresAt,
      anchor,authorize:async()=>grantSnapshot,
      clock:()=>new Date(clock()),createJournal});
    if(reservation?.reserved!==true ||
       reservation.root!==path.join(baseRoot,`r48-${attempt}`) ||
       reservation.proposalSha256!==proposalSha256 ||
       reservation.expiresAt!==gate.expiresAt ||
       reservation.workload?.root!==path.join(reservation.root,'workload') ||
       reservation.captureRoot!==path.join(reservation.root,'capture'))
      throw Error('r50_parent_reservation');
    const runtime=bindRuntime({attempt,gate,reservation,clock});
    if(!runtime || typeof runtime!=='object' || Array.isArray(runtime) ||
       requiredRuntime.some(name=>typeof runtime[name]!=='function'))
      throw Error('r50_parent_runtime');
    let staged=false;
    const renderStartup=async({attempt:asked,path:scriptPath})=>{
      if(staged || asked!==attempt ||
         scriptPath!==path.join(sourceRoot,`r48-startup-${attempt}.sh`))
        throw Error('r50_parent_startup_request');
      staged=true;
      return stageStartup({attempt,scriptPath,
        render:()=>renderBundle({attempt})});
    };
    const runner=makeRunner({attempt,
      workloadJournal:reservation.workload,
      safetyEntryPath,safetyEntrySha256,
      stageHandoff:request=>stageHandoff({...request,gate}),
      proposalSha256,captureRoot:reservation.captureRoot,
      authorize:async({attempt:asked}={})=>gate.authorize({attempt:asked}),
      reserve:async({attempt:asked}={})=>{
        gate.authorize({attempt:asked});return reservation;},
      renderStartup,audit:runtime.audit,
      replayLayout:runtime.replayLayout,readHelper:runtime.readHelper,
      readAdmissionCheck:request=>gate.readAdmissionCheck(request),
      effectAuthorizationCheck:request=>gate.effectAuthorizationCheck(request),
      archiveAdmissionCheck:request=>gate.archiveAdmissionCheck(request),
      tokenSupplier:runtime.tokenSupplier,fetchImpl:runtime.fetchImpl,
      sdkExecute:runtime.sdkExecute,sdkInspect:runtime.sdkInspect,
      sdkHashFile:runtime.sdkHashFile,effectExecute:runtime.effectExecute,
      effectInspect:runtime.effectInspect,
      effectReadFile:runtime.effectReadFile,
      effectHashFile:runtime.effectHashFile,clock,sleep:runtime.sleep});
    if(typeof runner?.run!=='function')throw Error('r50_parent_runner');
    return await runner.run();
  } finally {
    if(reservation?.workload)await reservation.workload.close();
  }
}

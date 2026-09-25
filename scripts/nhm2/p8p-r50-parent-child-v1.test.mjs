// Local-only R50 parent -> real detached R49 child lifecycle fixture.
// The production safety path is authenticated, then substituted by a
// temporary-root test child that wraps the same R49 CLI and R48 safety owner.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import * as fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import test from 'node:test';
import {runR50Parent} from './p8p-r50-parent-v1.mjs';
import {R50_ANCHOR_NAME,R50_PREPARED_HEADER}
  from './p8p-r50-ownership-v1.mjs';

const sourceRoot=String.raw`C:\NHM2-P8P-Workflow-Review`;
const names=['p8p_r48_admission_gate_v1.mjs',
  'p8p_r48_resource_plan_v1.mjs','p8p_r48_journal_v1.mjs',
  'p8p_r48_handoff_stage_v1.mjs','p8p_r48_safety_launcher_v1.mjs',
  'p8p_r48_release_protocol_v1.mjs','p8p_r48_safety_join_v1.mjs'];
const modules=await Promise.all(names.map(name=>
  import(pathToFileURL(path.join(sourceRoot,name)).href)));
const [admission,resource,journalModule,handoffModule,launcherModule,
  releaseModule,joinModule]=modules;
const childPath=fileURLToPath(new URL('./p8p-r50-harmless-child-v1.mjs',
  import.meta.url));
const attempt='7'.repeat(64);
const sha=body=>createHash('sha256').update(body).digest('hex');
const iso=time=>new Date(time).toISOString().replace(/\.\d{3}Z$/,'Z');

test('new anchor and real parent reach detached R49 READY and replayed STOP',
  {timeout:15_000},async t=>{
    const temp=await fs.realpath(os.tmpdir());
    const baseRoot=await fs.mkdtemp(path.join(temp,'p8p-r50-child-'));
    t.after(async()=>{
      await new Promise(resolve=>setTimeout(resolve,250));
      const real=await fs.realpath(baseRoot);
      if(!real.toLowerCase().startsWith(temp.toLowerCase()+path.sep) ||
         !path.basename(real).startsWith('p8p-r50-child-'))
        throw Error('r50_parent_child_cleanup_scope');
      await fs.rm(real,{recursive:true,force:false});
    });
    const old=path.join(baseRoot,'r48-host-anchor-v1.jsonl');
    const oldBytes=Buffer.from('consumed-old-anchor\n');
    await fs.writeFile(old,oldBytes,{flag:'wx'});
    await fs.writeFile(path.join(baseRoot,R50_ANCHOR_NAME),
      R50_PREPARED_HEADER,{flag:'wx'});
    const now=Date.now();
    const proposalBytes=Buffer.from('R50 same-root local fixture. '.repeat(5));
    const proposalSha256=sha(proposalBytes);
    const scope='R48_CANDIDATE_NEUTRAL_RECOVERY_ONLY';
    const grant={authorized:true,scope,proposalSha256,attempt,
      scientificAuthority:false,maxCostCents:100,maxHelperSeconds:1200,
      expiresAt:iso(now+3_600_000)};
    const auditor=path.join(sourceRoot,'audit_p8p_r48_journal_v1.py');
    const audit=async({root,attempt:asked,channel,anchorSeq,anchorSha256})=>{
      const args=[auditor,root,asked,channel];
      if(anchorSeq!==undefined)args.push('--anchor-seq',String(anchorSeq),
        '--anchor-sha256',anchorSha256);
      const replay=spawnSync('python',args,{encoding:'utf8',timeout:5_000,
        maxBuffer:8_192});
      assert.equal(replay.status,0,replay.stderr);
      return JSON.parse(replay.stdout);
    };
    const result=await runR50Parent({proposalBytes,proposalSha256,attempt,
      grant,quotedWorstCaseCents:90,
      authenticateUserGrant:async request=>({pass:true,
        proposalSha256:request.proposalSha256,attempt:request.attempt,
        scope:request.scope})},{
      fixtureControlRoot:baseRoot,createAdmissionGate:admission.createR48AdmissionGate,
      createJournal:journalModule.createR48Journal,
      renderBundle:async()=>Buffer.from('#!/bin/bash\nexit 0\n'),
      stageStartup:async({scriptPath})=>({pass:true,path:scriptPath,
        sha256:'e'.repeat(64)}),
      stageHandoff:handoffModule.stageR48ChildHandoff,
      bindRuntime:()=>({audit,replayLayout:async()=>{},
        readHelper:async()=>{},tokenSupplier:async()=>{},
        fetchImpl:async()=>{throw Error('NO_NETWORK')}}),
      makeRunner:ports=>({run:async()=>{
        assert.equal(ports.safetyEntryPath,
          path.join(sourceRoot,'p8p_r49_safety_cli_v1.mjs'));
        assert.equal(ports.safetyEntrySha256,
          'ccbb80800a532068a7773b0afdd2e3507af2602031ef679c4466f10e5922f355');
        const scriptPath=path.join(sourceRoot,
          `r48-startup-${attempt}.sh`);
        await ports.renderStartup({attempt,path:scriptPath});
        const begin=Date.now();
        const plan=resource.buildR48ResourcePlan({attempt,scriptPath,
          nowIso:iso(begin),stopIso:iso(begin+900_000),
          admittedSources:{pass:true,r47Preserved:true,
            sourceSnapshotReady:true,targetAbsent:true,
            guestAccessUnproven:true}});
        const attemptRoot=path.join(baseRoot,`r48-${attempt}`);
        const handoffPath=path.join(attemptRoot,'child-handoff.json');
        const workload=ports.workloadJournal;
        assert.equal((await workload.append({event:'HANDOFF_STAGE_INTENT',
          attempt,proposalSha256,stopIso:plan.stopIso,
          path:handoffPath})).durable,true);
        const handoff=await ports.stageHandoff({attempt,plan,
          root:attemptRoot,parentPid:process.pid});
        assert.equal((await workload.append({event:'HANDOFF_STAGE_BOUND',
          attempt,proposalSha256,stopIso:plan.stopIso,path:handoffPath,
          sha256:handoff.sha256,bytes:handoff.bytes})).durable,true);
        const launcher=launcherModule.createR48SafetyLauncher({attempt,
          workloadJournal:workload,entryPath:childPath,
          entrySha256:sha(await fs.readFile(childPath)),audit,
          handoffPath,handoffSha256:handoff.sha256,proposalSha256});
        const handle=await launcher.launch({attempt,plan});
        const ready=await launcher.waitReady({handle,maxWaitMs:5_000,
          pollMs:25});
        await fs.writeFile(path.join(attemptRoot,'fake-provider-running'),
          'running',{flag:'wx'});
        await releaseModule.publishR48SafetyRelease({journal:workload,
          attempt,stopIso:plan.stopIso,expectedId:'654'});
        const zonal=`https://www.googleapis.com/compute/v1/projects/`+
          `${plan.project}/zones/${plan.zone}`;
        const stoppedResource={name:plan.helper,id:'654',
          status:'TERMINATED',
          selfLink:`${zonal}/instances/${plan.helper}`,zone:zonal,
          machineType:`${zonal}/machineTypes/e2-small`,
          labels:{'nhm2-r48-a':attempt.slice(0,32),
            'nhm2-r48-b':attempt.slice(32)}};
        const joined=await joinModule.joinR48Safety({attempt,plan,handle,
          ready,expectedId:'654',audit,readHelper:async()=>stoppedResource,
          sleep:async()=>new Promise(resolve=>setTimeout(resolve,25))});
        assert.equal(await fs.readFile(path.join(attemptRoot,
          'fake-provider-stopped'),'utf8'),'stopped');
        return {status:'LOCAL_R50_READY_STOP',ready:ready.pass,
          terminal:joined.proof.replay.terminal,
          scientificAuthority:false};
      }}),
    });
    assert.deepEqual(result,{status:'LOCAL_R50_READY_STOP',ready:true,
      terminal:'R48_STOP_VERIFIED',scientificAuthority:false});
    assert.deepEqual(await fs.readFile(old),oldBytes);
  });

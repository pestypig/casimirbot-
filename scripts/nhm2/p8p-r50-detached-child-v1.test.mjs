import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import * as fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import test from 'node:test';

const sourceRoot=String.raw`C:\NHM2-P8P-Workflow-Review`;
const names=['p8p_r48_admission_gate_v1.mjs',
  'p8p_r48_resource_plan_v1.mjs','p8p_r48_journal_v1.mjs',
  'p8p_r48_child_handoff_v1.mjs','p8p_r48_safety_launcher_v1.mjs',
  'p8p_r48_release_protocol_v1.mjs','p8p_r48_safety_join_v1.mjs'];
const available=names.every(name=>existsSync(path.join(sourceRoot,name))) &&
  existsSync(path.join(sourceRoot,'audit_p8p_r48_journal_v1.py'));
const modules=available?await Promise.all(names.map(name=>
  import(pathToFileURL(path.join(sourceRoot,name)).href))):[];
const [admission,resource,journalModule,handoffModule,launcherModule,
  releaseModule,joinModule]=modules;
const entryPath=fileURLToPath(new URL('./p8p-r50-harmless-child-v1.mjs',
  import.meta.url));
const attempt='9'.repeat(64);
const sha=body=>createHash('sha256').update(body).digest('hex');
const iso=time=>new Date(time).toISOString().replace(/\.\d{3}Z$/,'Z');

test('real detached R49 child publishes READY, accepts release, and replays STOP',
  {skip:!available,timeout:15_000},async t=>{
    const temp=await fs.realpath(os.tmpdir());
    const base=await fs.mkdtemp(path.join(temp,'p8p-r50-child-'));
    t.after(async()=>{
      await new Promise(resolve=>setTimeout(resolve,250));
      const real=await fs.realpath(base);
      if(!real.toLowerCase().startsWith(temp.toLowerCase()+path.sep) ||
         !path.basename(real).startsWith('p8p-r50-child-'))
        throw Error('r50_fixture_cleanup_scope');
      await fs.rm(real,{recursive:true,force:false});
    });
    const attemptRoot=path.join(base,`r48-${attempt}`);
    await fs.mkdir(attemptRoot);
    const workload=await journalModule.createR48Journal({
      root:path.join(attemptRoot,'workload'),attempt,channel:'workload'});
    const now=Date.now();
    const plan=resource.buildR48ResourcePlan({attempt,
      scriptPath:`C:\\NHM2-P8P-Workflow-Review\\r48-startup-${attempt}.sh`,
      nowIso:iso(now),stopIso:iso(now+900_000),
      admittedSources:{pass:true,r47Preserved:true,
        sourceSnapshotReady:true,targetAbsent:true,
        guestAccessUnproven:true}});
    const proposalBytes=Buffer.from('R50 harmless child fixture. '.repeat(5));
    const proposalSha256=sha(proposalBytes);
    const scope='R48_CANDIDATE_NEUTRAL_RECOVERY_ONLY';
    const gate=await admission.createR48AdmissionGate({proposalBytes,
      proposalSha256,attempt,quotedWorstCaseCents:90,
      grant:{authorized:true,scope,proposalSha256,attempt,
        scientificAuthority:false,maxCostCents:100,maxHelperSeconds:1200,
        expiresAt:iso(now+3_600_000)},
      authenticateGrant:async()=>({pass:true,scope,proposalSha256,attempt})});
    const handoff=handoffModule.encodeR48ChildHandoff({gate,plan,
      parentPid:process.pid});
    const handoffPath=path.join(attemptRoot,'child-handoff.json');
    assert.equal((await workload.append({event:'HANDOFF_STAGE_INTENT',
      attempt,proposalSha256,stopIso:plan.stopIso,
      path:handoffPath})).durable,true);
    await fs.writeFile(handoffPath,handoff.bytes,{flag:'wx'});
    assert.equal((await workload.append({event:'HANDOFF_STAGE_BOUND',
      attempt,proposalSha256,stopIso:plan.stopIso,path:handoffPath,
      sha256:handoff.sha256,bytes:handoff.bytes.length})).durable,true);
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
    const launcher=launcherModule.createR48SafetyLauncher({attempt,
      workloadJournal:workload,entryPath,
      entrySha256:sha(await fs.readFile(entryPath)),audit,
      handoffPath,handoffSha256:handoff.sha256,proposalSha256});
    const handle=await launcher.launch({attempt,plan});
    const ready=await launcher.waitReady({handle,maxWaitMs:5_000,
      pollMs:25});
    assert.equal(ready.pass,true);
    assert.notEqual(ready.pid,process.pid);
    await fs.writeFile(path.join(attemptRoot,'fake-provider-running'),
      'running',{flag:'wx'});
    const release=await releaseModule.publishR48SafetyRelease({
      journal:workload,attempt,stopIso:plan.stopIso,expectedId:'654'});
    assert.equal(release.published,true);
    const zonal=`https://www.googleapis.com/compute/v1/projects/`+
      `${plan.project}/zones/${plan.zone}`;
    const stoppedResource={name:plan.helper,id:'654',
      status:'TERMINATED',selfLink:`${zonal}/instances/${plan.helper}`,
      zone:zonal,machineType:`${zonal}/machineTypes/e2-small`,
      labels:{'nhm2-r48-a':attempt.slice(0,32),
        'nhm2-r48-b':attempt.slice(32)}};
    const joined=await joinModule.joinR48Safety({attempt,plan,handle,
      ready,expectedId:'654',audit,readHelper:async()=>stoppedResource,
      sleep:async()=>new Promise(resolve=>setTimeout(resolve,25))});
    assert.equal(joined.status,'TERMINATED');
    assert.equal(joined.proof.replay.anchorMatched,true);
    assert.equal(joined.proof.replay.terminal,'R48_STOP_VERIFIED');
    assert.equal(await fs.readFile(path.join(attemptRoot,
      'fake-provider-stopped'),'utf8'),'stopped');
    await workload.close();
  });

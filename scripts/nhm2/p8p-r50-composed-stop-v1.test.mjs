// Test-only R50 parent -> real composed controller -> detached safety child.
// All provider effects are filesystem fakes; layout is deliberately invalid.
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
const load=name=>import(pathToFileURL(path.join(sourceRoot,name)).href);
const [admission,journal,handoff,composed]=await Promise.all([
  'p8p_r48_admission_gate_v1.mjs','p8p_r48_journal_v1.mjs',
  'p8p_r48_handoff_stage_v1.mjs','p8p_r48_composed_runner_v1.mjs'
].map(load));
const childPath=fileURLToPath(new URL('./p8p-r50-harmless-child-v1.mjs',
  import.meta.url));
const attempt='a'.repeat(64);
const sha=body=>createHash('sha256').update(body).digest('hex');
const iso=ms=>new Date(ms).toISOString().replace(/\.\d{3}Z$/,'Z');
const zonal='https://www.googleapis.com/compute/v1/projects/dark-stratum-455714-h4/zones/us-east1-b';
const global='https://www.googleapis.com/compute/v1/projects/dark-stratum-455714-h4/global';
const image='https://www.googleapis.com/compute/v1/projects/debian-cloud/global/images/debian-12-bookworm-v20260817';
const original='nhm2-h2-p8p-r32-e2-4-20260904';
const sourceVmName='nhm2-h2-p8p-r39-rescue-e2-small-20260904';
const r39Clone='nhm2-h2-p8p-r39-evidence-clone-20260904';
const oldHelper='nhm2-p8p-r47-rescue-e2-small-20260920';
const oldClone='nhm2-p8p-r46-r40-boot-clone-20260920';
const snapshot='nhm2-p8p-r46-r40-boot-snap-20260920';
const worker='nhm2-p8p-batch-worker@dark-stratum-455714-h4.iam.gserviceaccount.com';
const bucket='dark-stratum-455714-h4-nhm2-p8p-evidence-v1';
const pythonSha='4942b86a6597e5aee0128daa00050ed79bc21f6e709a78eb19cbfeb0c2f39ac9';
const gcloudSha='d223bce54ff2e1441268e73b06eec4830032dd7b4b17b8fa9e2638d4f6d8d39d';
const startup=Buffer.from('#!/bin/bash\nexit 0\n');
const disk=(name,id,size)=>({name,id,status:'READY',sizeGb:size,
  type:`${zonal}/diskTypes/pd-standard`,sourceImage:image,
  users:[`${zonal}/instances/${name}`]});
const exists=async file=>{try {await fs.lstat(file);return true;}
  catch(error) {if(error?.code==='ENOENT')return false;throw error;}};

function sourceData() {
  return {
    originalVm:{name:original,id:'1893159507643031574',status:'TERMINATED',
      zone:zonal,disks:[{boot:true,mode:'READ_WRITE',
        source:`${zonal}/disks/${original}`}]},
    sourceVm:{name:sourceVmName,id:'7129462452423922626',status:'TERMINATED',
      zone:zonal,machineType:`${zonal}/machineTypes/e2-small`,
      metadata:{items:[]},serviceAccounts:[{email:
        '992930110642-compute@developer.gserviceaccount.com',scopes:[
          'https://www.googleapis.com/auth/devstorage.read_only',
          'https://www.googleapis.com/auth/logging.write',
          'https://www.googleapis.com/auth/monitoring.write',
          'https://www.googleapis.com/auth/pubsub',
          'https://www.googleapis.com/auth/service.management.readonly',
          'https://www.googleapis.com/auth/servicecontrol',
          'https://www.googleapis.com/auth/trace.append']}],
      scheduling:{onHostMaintenance:'MIGRATE',automaticRestart:true,
        preemptible:false,provisioningModel:'STANDARD',
        instanceTerminationAction:'STOP',
        terminationTime:'2026-09-20T14:16:51Z'},
      disks:[{boot:true,mode:'READ_WRITE',diskSizeGb:'10',
        source:`${zonal}/disks/${sourceVmName}`},
        {boot:false,mode:'READ_ONLY',diskSizeGb:'30',
          source:`${zonal}/disks/${r39Clone}`}]},
    originalBootDisk:disk(original,'1129594698432208918','30'),
    sourceBootDisk:disk(sourceVmName,'1064813028101755842','10'),
    r39Clone:{name:r39Clone,id:'1644965210306810875',status:'READY',
      sizeGb:'30',type:`${zonal}/diskTypes/pd-standard`,
      users:[`${zonal}/instances/${sourceVmName}`]},
    snapshot:{name:snapshot,id:'29969082222486286',status:'READY',
      selfLink:`${global}/snapshots/${snapshot}`,
      snapshotType:'STANDARD',storageLocations:['us-east1'],
      sourceDisk:`${zonal}/disks/${sourceVmName}`,
      sourceDiskId:'1064813028101755842',diskSizeGb:'10'},
    clone:{name:oldClone,id:'966464393055150283',status:'READY',
      selfLink:`${zonal}/disks/${oldClone}`,zone:zonal,sizeGb:'10',
      type:`${zonal}/diskTypes/pd-standard`,
      sourceSnapshot:`${global}/snapshots/${snapshot}`,
      sourceSnapshotId:'29969082222486286',
      users:[`${zonal}/instances/${oldHelper}`]},
    r47Helper:{name:oldHelper,id:'1169782703124239604',zone:zonal,
      status:'TERMINATED',disks:[
        {boot:true,autoDelete:false,mode:'READ_WRITE',
          source:`${zonal}/disks/${oldHelper}`},
        {boot:false,autoDelete:false,mode:'READ_ONLY',
          source:`${zonal}/disks/${oldClone}`}]},
    worker:{email:worker,uniqueId:'100419308305217715515',disabled:false},
    bucketMetadata:{name:bucket,storage_url:`gs://${bucket}/`,
      location:'US-EAST1',location_type:'region',
      default_storage_class:'STANDARD',uniform_bucket_level_access:true,
      public_access_prevention:'enforced',
      soft_delete_policy:{retentionDurationSeconds:'604800'}},
    bucketPolicy:{etag:'fixture',bindings:[
      {role:'roles/storage.objectCreator',members:[`serviceAccount:${worker}`]},
      {role:'roles/storage.objectViewer',members:[`serviceAccount:${worker}`]}]},
  };
}
const clone=plan=>({name:plan.clone,id:'456',
  selfLink:`${zonal}/disks/${plan.clone}`,zone:zonal,status:'READY',
  sizeGb:'10',type:`${zonal}/diskTypes/pd-standard`,
  sourceSnapshot:`${global}/snapshots/${plan.snapshot}`,
  sourceSnapshotId:plan.snapshotId,users:[]});
const helper=(plan,status)=>({name:plan.helper,id:'654',status,
  selfLink:`${zonal}/instances/${plan.helper}`,zone:zonal,
  machineType:`${zonal}/machineTypes/e2-small`,
  labels:{'nhm2-r48-a':attempt.slice(0,32),
    'nhm2-r48-b':attempt.slice(32)},
  scheduling:{automaticRestart:false,instanceTerminationAction:'STOP',
    terminationTime:plan.stopIso},
  resourceStatus:{scheduling:{terminationTimestamp:plan.stopIso}},
  serviceAccounts:[{email:plan.worker,
    scopes:['https://www.googleapis.com/auth/devstorage.read_write']}],
  metadata:{items:[{key:'startup-script',value:startup.toString('utf8')}]},
  disks:[{boot:true,mode:'READ_WRITE',autoDelete:false,
    source:`${zonal}/disks/${plan.helper}`},
    {boot:false,mode:'READ_ONLY',autoDelete:false,
      deviceName:plan.device,source:`${zonal}/disks/${plan.clone}`}],
});

test('R50 real composition reaches fake effects and replayed safety STOP',
  {timeout:15_000},async t=>{
    const temp=await fs.realpath(os.tmpdir());
    const baseRoot=await fs.mkdtemp(path.join(temp,'p8p-r50-child-'));
    t.after(async()=>{
      await new Promise(resolve=>setTimeout(resolve,250));
      const real=await fs.realpath(baseRoot);
      assert.ok(real.toLowerCase().startsWith(temp.toLowerCase()+path.sep));
      assert.ok(path.basename(real).startsWith('p8p-r50-child-'));
      await fs.rm(real,{recursive:true,force:false});
    });
    await fs.writeFile(path.join(baseRoot,R50_ANCHOR_NAME),
      R50_PREPARED_HEADER,{flag:'wx'});
    const now=Date.now();
    let plan=null;
    const attemptRoot=path.join(baseRoot,`r48-${attempt}`);
    const running=path.join(attemptRoot,'fake-provider-running');
    const stopped=path.join(attemptRoot,'fake-provider-stopped');
    const source=sourceData();
    const effects=[];
    let sourceReads=0,objectReads=0,serialReads=0,layoutCalls=0;
    const inspect=async file=>({
      isFile:()=>!file.endsWith('p8p-r22-gcloud-config'),
      isDirectory:()=>file.endsWith('p8p-r22-gcloud-config'),
      isSymbolicLink:()=>false,size:startup.length});
    const hashFile=async file=>file.endsWith('python.exe')?
      pythonSha:gcloudSha;
    const sdkExecute=async(_exe,args)=>{
      const argv=args.slice(1,-1),key=argv.slice(0,3).join('/');
      let value;
      if(key==='config/get-value/account')value='pestypig@gmail.com';
      else if(key==='config/get-value/project')
        value='dark-stratum-455714-h4';
      else if(key==='compute/instances/list' ||
              key==='compute/disks/list')value='[]';
      else if(key==='compute/instances/describe')
        value=JSON.stringify({[original]:source.originalVm,
          [sourceVmName]:source.sourceVm,
          [oldHelper]:source.r47Helper,
          ...(plan?{[plan.helper]:helper(plan,'RUNNING')}:{})}[argv[3]]);
      else if(key==='compute/disks/describe')
        value=JSON.stringify({[original]:source.originalBootDisk,
          [sourceVmName]:source.sourceBootDisk,
          [r39Clone]:source.r39Clone,[oldClone]:source.clone,
          ...(plan?{[plan.clone]:clone(plan)}:{})}[argv[3]]);
      else if(key==='compute/snapshots/describe')
        value=JSON.stringify(source.snapshot);
      else if(key==='iam/service-accounts/describe')
        value=JSON.stringify(source.worker);
      else if(key==='storage/buckets/describe')
        value=JSON.stringify(source.bucketMetadata);
      else if(key==='storage/buckets/get-iam-policy')
        value=JSON.stringify(source.bucketPolicy);
      else if(key==='compute/instances/get-serial-port-output'){
        serialReads++;
        value='invalid layout serial\n';
      } else throw Error('unexpected_sdk_read');
      if(value===undefined)throw Error('missing_source_fixture');
      sourceReads++;
      return {code:0,signal:null,stdout:Buffer.from(value),
        stderr:Buffer.alloc(0)};
    };
    const audit=async({root,attempt:asked,channel,anchorSeq,
      anchorSha256})=>{
      const argv=[path.join(sourceRoot,'audit_p8p_r48_journal_v1.py'),
        root,asked,channel];
      if(anchorSeq!==undefined)argv.push('--anchor-seq',String(anchorSeq),
        '--anchor-sha256',anchorSha256);
      const replay=spawnSync('python',argv,{encoding:'utf8',timeout:5_000,
        maxBuffer:8_192});
      assert.equal(replay.status,0,replay.stderr);
      return JSON.parse(replay.stdout);
    };
    const proposalBytes=Buffer.from('R50 composed STOP fixture. '.repeat(5));
    const proposalSha256=sha(proposalBytes);
    const childSha256=sha(await fs.readFile(childPath));
    const result=await runR50Parent({proposalBytes,proposalSha256,attempt,
      grant:{authorized:true,scope:'R48_CANDIDATE_NEUTRAL_RECOVERY_ONLY',
        proposalSha256,attempt,scientificAuthority:false,
        maxCostCents:100,maxHelperSeconds:1200,
        expiresAt:iso(now+3_600_000)},quotedWorstCaseCents:90,
      authenticateUserGrant:async request=>({pass:true,
        proposalSha256:request.proposalSha256,attempt:request.attempt,
        scope:request.scope})},{
      fixtureControlRoot:baseRoot,
      createAdmissionGate:admission.createR48AdmissionGate,
      createJournal:journal.createR48Journal,
      renderBundle:async()=>startup,
      stageStartup:async({scriptPath})=>({pass:true,path:scriptPath,
        sha256:sha(startup)}),
      stageHandoff:handoff.stageR48ChildHandoff,
      bindRuntime:()=>({audit,
        replayLayout:async()=>{layoutCalls++;
          throw Error('r48_layout_replay_failed');},
        readHelper:async({plan:observedPlan})=>await exists(stopped)?
          helper(observedPlan,'TERMINATED'):await exists(running)?
            helper(observedPlan,'RUNNING'):null,
        tokenSupplier:async()=> 'fixture-token',
        fetchImpl:async()=>{objectReads++;
          return new Response('absent',{status:404});},
        sdkExecute,sdkInspect:inspect,sdkHashFile:hashFile,
        effectExecute:async(_exe,args)=>{
          const command=args.slice(1,-1);
          effects.push(command);
          if(command[1]==='instances')
            await fs.writeFile(running,'running',{flag:'wx'});
          return {code:0,signal:null,stdout:Buffer.from('submitted'),
            stderr:Buffer.alloc(0)};
        },
        effectInspect:inspect,effectReadFile:async()=>startup,
        effectHashFile:hashFile,
        sleep:async ms=>new Promise(resolve=>setTimeout(resolve,
          Math.min(ms,25))),
      }),
      makeRunner:ports=>{
        assert.equal(ports.safetyEntryPath,path.join(sourceRoot,
          'p8p_r49_safety_cli_v1.mjs'));
        assert.equal(ports.safetyEntrySha256,
          'ccbb80800a532068a7773b0afdd2e3507af2602031ef679c4466f10e5922f355');
        // Only this temp-root fixture replaces the authenticated production
        // child with a file-backed fake provider using the same R49 CLI.
        const originalAuthorization=ports.effectAuthorizationCheck;
        return composed.createR48ComposedRunner({...ports,
          effectAuthorizationCheck:request=>{
            plan=request.plan;
            return originalAuthorization(request);
          },
          safetyEntryPath:childPath,
          safetyEntrySha256:childSha256});
      },
    });
    assert.equal(result.status,'R48_FAILED');
    assert.equal(result.stopped,true);
    assert.equal(result.scientificAuthority,false);
    assert.deepEqual(effects.map(x=>x[1]),['disks','instances']);
    assert.ok(serialReads>=1 && serialReads<=24);
    assert.ok(layoutCalls<=1);
    assert.equal(objectReads,1);
    assert.ok(sourceReads>=20);
    assert.equal(await fs.readFile(stopped,'utf8'),'stopped');
    const safety=await audit({root:path.join(attemptRoot,'safety'),
      attempt,channel:'safety'});
    assert.equal(safety.terminal,'R48_STOP_VERIFIED');
    assert.equal(result.safetyTailSha256,safety.lastSha256);
    const workload=await audit({root:path.join(attemptRoot,'workload'),
      attempt,channel:'workload'});
    assert.equal(workload.validChain,true);
    assert.equal(workload.terminal,'R48_FAILED');
    const paired=spawnSync('python',[
      path.join(sourceRoot,'audit_p8p_r48_channel_pair_v1.py'),
      attemptRoot,attempt,'--expected-workload-tail',workload.lastSha256],
    {encoding:'utf8',timeout:5_000,maxBuffer:8_192});
    assert.equal(paired.status,0,paired.stderr);
    assert.equal(JSON.parse(paired.stdout).pairValid,true);
  });

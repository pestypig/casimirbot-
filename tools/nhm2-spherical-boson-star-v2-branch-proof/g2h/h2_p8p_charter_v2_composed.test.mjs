import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runRetrieval} from './h2_p8p_charter_v2_retrieval.mjs';
const root=new URL('../../../artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8p-r43-retrieval-v1-20260905/',import.meta.url);
const o=JSON.parse(JSON.parse(readFileSync(new URL('03-command.json',root))).stdout);
const h=JSON.parse(JSON.parse(readFileSync(new URL('04-command.json',root))).stdout);
const base='https://www.googleapis.com/compute/v1/projects/dark-stratum-455714-h4/zones/us-east1-b';
const d={id:'1064813028101755842',name:h.name,sizeGb:'10',type:`${base}/diskTypes/pd-standard`,sourceImage:'https://www.googleapis.com/compute/v1/projects/debian-cloud/global/images/debian-12-bookworm-v20260817',creationTimestamp:'2026-09-04T13:42:21.741-07:00',status:'READY',users:[`${base}/instances/${h.name}`]};
for(const fault of ['none','transfer','receipt_after_start','first_stop','all_stops','unconfirmed_stop'])test(`composed cleanup ${fault}`,async()=>{
  let started=false,stopped=false,stopCount=0,transferCount=0;
  const run=async(exe,args)=>{
    if(exe.endsWith('/plink.exe')){transferCount++;if(fault==='transfer')throw new Error('transfer_failure');return {stdout:'',stderr:'',exitCode:0};}
    const c=args.slice(3);let value;
    if(c[0]==='auth')return {stdout:'pestypig@gmail.com',stderr:'',exitCode:0};
    if(c[1]==='project-info')value={name:'dark-stratum-455714-h4',commonInstanceMetadata:{items:[{key:'ssh-keys'}]}};
    else if(c[1]==='disks')value=d;
    else if(c[2]==='start'){started=true;value={};}
    else if(c[2]==='stop'){stopCount++;if(fault==='unconfirmed_stop'&&stopCount===1)throw Object.assign(new Error('kill_failed'),{terminationConfirmed:false,pid:999});if(fault==='all_stops'||fault==='first_stop'&&stopCount===1)throw new Error('stop_failure');stopped=true;value={};}
    else if(c[2]==='describe')value=c[3]===o.name?o:{...h,status:started&&!stopped?'RUNNING':'TERMINATED',networkInterfaces:[{accessConfigs:[{natIP:'192.0.2.1'}]}]};
    else assert.fail(`unexpected command ${c}`);
    return {stdout:JSON.stringify(value),stderr:'',exitCode:0};
  };
  const archive={bytes:12122,sha256:'73029fde08f14f9fcd01490c4e5d5bc188213eaa2f9a8d857eb5e456b86d0922'};
  const store={freeBytes:()=>2**32,prepare(){},receipt(){if(started&&fault==='receipt_after_start')throw new Error('disk_full');},download:'C:/NHM2-CV2-R1/download-TEST/r40.tgz',inspectArchive:()=>archive,publish(){},inspectPublished:()=>archive};
  const r=await runRetrieval({store,run,wait:async()=>{},authenticateFile(){},sinkFactory:()=>({accept(){},finish(){},closePartial(){}})});
  assert.equal(r.stopConfirmed,fault!=='all_stops');
  assert.equal(stopCount,fault==='all_stops'?3:['first_stop','unconfirmed_stop'].includes(fault)?2:1);
  assert.equal(r.pass,fault==='none'||fault==='first_stop');
  assert.ok(transferCount<=1);
});

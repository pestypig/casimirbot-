import {performance} from 'node:perf_hooks';
export function executionClock(wall=Date.now(),mono=()=>performance.now()){
 const origin=mono();return ()=>Math.floor(wall+(mono()-origin));
}
export function checkDiscoveryAdmission(manifest,authorization,manifestSha,now){
 const expected={manifestSha256:manifestSha,ledgerSha256:manifest.ledgerSha256,
  scope:'one-retained-helper-discovery-startup-replacement-and-restart',helperId:'2570241336417567358',
  runtimeSeconds:1200,costCeilingUsd:0.1};
 for(const [k,v] of Object.entries(expected))if(authorization?.[k]!==v)throw Error('authorization_'+k);
 const at=Date.parse(authorization.authorizedAt),expiry=Date.parse(manifest.expiry);
 if(!Number.isFinite(at)||!Number.isFinite(expiry)||at>now||at>=expiry||now+1200000>expiry)throw Error('authorization_time');
 if(manifest.runtimeSeconds!==1200||manifest.costCeilingUsd!==.1||manifest.priorReservedSeconds!==12000||
  manifest.priorReservedUsd!==1.6||manifest.aggregateSeconds!==21600||manifest.aggregateUsd!==12||
  manifest.priorReservedSeconds+manifest.runtimeSeconds>manifest.aggregateSeconds||
  manifest.priorReservedUsd+manifest.costCeilingUsd>manifest.aggregateUsd)throw Error('authorization_budget');
 return true;
}
export async function boundedFinalWrite(record,event,now,deadline){
 const remaining=Math.min(5000,deadline-now());
 if(remaining<=0)throw Error('final_write_deadline');
 let timer;
 try{await Promise.race([Promise.resolve().then(()=>record(event)),new Promise((_,reject)=>{
  timer=setTimeout(()=>reject(Error('final_write_timeout')),remaining);
 })]);}finally{clearTimeout(timer);}
 if(now()>=deadline)throw Error('final_write_late');
}

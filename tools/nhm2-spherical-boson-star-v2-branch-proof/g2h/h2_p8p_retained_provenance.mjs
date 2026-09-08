// Retained history plus a fresh restart window. Pure checks, not API authentication.
import {validateResourceChain} from './h2_p8p_hostkey_provenance.mjs';
import {creationTime as time} from './h2_p8p_resource_enrollment.mjs';
const check=(v,label)=>{if(!v)throw Error(`retained_provenance_${label}`);};
const same=(a,b,keys,label)=>{
 for(const k of keys)check(typeof b?.[k]==='string'&&a?.[k]===b[k],`${label}_${k}`);
};
export function validateRetainedResourceChain(observed,frozen){
 check(frozen?.mode==='retained-helper-v1','mode');
 const start=time(frozen.successorStartedAt),end=time(frozen.deadline),history=time(frozen.historyStartedAt);
 check(history<start&&start<end,'windows');
 const before=observed.retainedBefore;
 check(before&&start<=time(before.observedAt)&&time(before.observedAt)<time(observed.helper.lastStartTimestamp),'preflight_time');
 for(const kind of ['snapshot','clone','helper']){
  same(observed[kind],frozen[kind],['id','selfLink','creationTimestamp'],kind);
  same(before[kind],frozen[kind],['id','selfLink','creationTimestamp'],`before_${kind}`);
  check(time(frozen[kind].creationTimestamp)<start,`${kind}_not_retained`);
 }
 const bootExpected={id:frozen.helper.bootDiskId,selfLink:frozen.helper.bootDisk,
  creationTimestamp:frozen.helper.bootDiskCreationTimestamp};
 same(observed.helperBootDisk,bootExpected,['id','selfLink','creationTimestamp'],'boot');
 same(before.helperBootDisk,bootExpected,['id','selfLink','creationTimestamp'],'before_boot');
 check(time(bootExpected.creationTimestamp)<start,'boot_not_retained');
 same(before.sourceVM,observed.sourceVM,['id','selfLink','status','lastStartTimestamp','lastStopTimestamp'],'source');
 check(JSON.stringify(before.sourceVM.disks)===JSON.stringify(observed.sourceVM.disks),'source_disks');
 check(before.helper.status==='TERMINATED','helper_initial_status');
 check(time(before.helper.lastStartTimestamp)<time(before.helper.lastStopTimestamp)&&
  time(before.helper.lastStopTimestamp)<=time(before.observedAt),'initial_stop');
 check(before.helper.lastStopTimestamp===observed.helper.lastStopTimestamp,'helper_stop_changed');
 check(start<=time(observed.helper.lastStartTimestamp),'restart_window');
 check(!before.clone.users||Array.isArray(before.clone.users)&&before.clone.users.length===0,'clone_initial_users');
 const disks=before.helper.disks;
 check(Array.isArray(disks)&&disks.length===1&&disks[0].boot===true&&disks[0].mode==='READ_WRITE'&&
  disks[0].autoDelete===false&&disks[0].source===frozen.helper.bootDisk,'initial_boot_only');
 for(const state of [observed.helperBeforeAttach?.vm,observed.helper]){
  const boot=state?.disks?.filter(d=>d.boot===true);
  check(boot?.length===1&&boot[0].autoDelete===false,'boot_retention');
 }
 // The original validator still checks the true historical source observation
 // and snapshot/clone chronology. No resource date or observation is rewritten.
 // Its start is explicitly the predecessor's history boundary, not this restart.
 const historicalWindow={...frozen,attemptStartedAt:frozen.historyStartedAt};
 const chain=validateResourceChain(observed,historicalWindow);
 return Object.freeze({...chain,mode:'retained-helper-v1',successorStartedAt:frozen.successorStartedAt});
}

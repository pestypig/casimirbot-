// Orchestration core only. No production adapter or CLI entry point is bound.
// All operation implementations must honor their supplied absolute deadline.
// This core does not cancel a hung operation: a production adapter must enforce
// process termination and independent safety-stop behavior before execution.
// Guest cleanup must unmount in a finally/trap before exporting ANY outcome.
// confirmGuestUnmounted verifies that independent cleanup on the success path.
// An execution adapter and separate cloud amendment are required before use.
export function runHostkeyRecovery(options) { return runRecovery(options, false); }
// Direct archive recovery shares lifecycle/cleanup only. It never calls a
// public-key operation or grants an SSH handoff. Operations remain injected;
// importing this module does not perform any cloud or filesystem action.
export function runDirectArchiveRecovery(options) { return runRecovery(options, true); }
export function runRetainedArchiveRecovery(options) { return runRecovery(options, true, true); }
async function runRecovery({ops,record,now,deadline,cleanupReserveMs=300000,recordTimeoutMs=5000},archiveMode,retainedMode=false) {
  const readPhase=archiveMode?'readArchiveReceipt':'readPublicKeyReceipt';
  const validatePhase=archiveMode?'validateArchiveReceipt':'validatePublicKeyReceipt';
  const valueField=archiveMode?'archive':'publicKey';
  if(!Number.isFinite(deadline)||!Number.isFinite(cleanupReserveMs)||cleanupReserveMs<300000)
    throw Error('invalid_deadline');
  if(!Number.isFinite(recordTimeoutMs)||recordTimeoutMs<=0||recordTimeoutMs>10000)throw Error('invalid_record_timeout');
  const events=[];
  let helperMayExist=false, stopped=false, failure=null, cleanupFailure=null, cleanupEvidence=null, value;
  let receiptFailure=null;
  async function emit(event) {
    events.push(event);
    let timer;
    try {await Promise.race([Promise.resolve().then(()=>record(event)),new Promise((_,reject)=>{
      timer=setTimeout(()=>reject(Error('receipt_timeout')),recordTimeoutMs);
    })]);}catch(e){receiptFailure??=String(e);throw e;}finally{clearTimeout(timer);}
  }
  async function step(name,input) {
    if(now()>=deadline-cleanupReserveMs)throw Error('operational_deadline');
    if(typeof ops[name]!=='function')throw Error(`missing_operation_${name}`);
    await emit({phase:name,kind:'intent',at:now()});
    // Set before dispatch: an API timeout may conceal successful creation.
    if(name==='createHelper'||name==='restartHelper')helperMayExist=true;
    const result=await ops[name](input,{deadline:deadline-cleanupReserveMs});
    await emit({phase:name,kind:'result',at:now(),result});
    return result;
  }
  try {
    const preflight=await step('preflight');
    let snapshot,clone,helper;
    if(retainedMode){
      const retained=await step('captureRetained',preflight);
      ({snapshot,clone,helper}=retained);
      if(!snapshot||!clone||!helper)throw Error('retained_inventory_missing');
      await step('replaceStartup',{preflight,retained});
      await step('verifyStoppedStartup',{preflight,retained});
      await step('restartHelper',{preflight,retained});
    }else{
      snapshot=await step('createSnapshot',preflight);
      clone=await step('createClone',{preflight,snapshot});
      helper=await step('createHelper',{preflight});
    }
    const running=await step('observeRunning',{helper});
    if(archiveMode){
      const fixture=await step('validateLinuxFixture',{helper,running});
      if(fixture?.pass!==true)throw Error('linux_fixture_not_passed');
    }
    const attachment=await step('attachReadOnly',{helper,clone,running});
    const chain=await step('captureAndValidateChain',{preflight,snapshot,clone,helper,running,attachment});
    const receipt=await step(readPhase,{helper,chain});
    value=await step(validatePhase,{receipt,chain});
    if(value===undefined||value===null)throw Error('validated_result_missing');
    if(archiveMode&&(!Buffer.isBuffer(value)||value.length!==12122))throw Error('validated_archive_shape');
    await step('confirmGuestUnmounted',{helper,receipt});
  }catch(e){failure=String(e);}
  finally {
    if(helperMayExist) {
      // Cleanup is independent of evidence-write health and ordinary deadline.
      try {
        const expired=now()>=deadline;
        if(expired)failure??='cleanup_deadline_exhausted';
        await ops.stopAndConfirm({deadline:expired?now()+60000:deadline,emergency:expired});
        stopped=true;
      }catch(e){
        cleanupFailure=String(e);
        stopped=e.stopped===true;
        cleanupEvidence={stopped,stopError:e.stopError?String(e.stopError):null,
          observationError:e.observationError?String(e.observationError):null,
          observation:e.observation??null};
      }
    }
  }
  const result={pass:!failure&&!cleanupFailure&&!receiptFailure&&stopped,
    failure,cleanupFailure,cleanupEvidence,receiptFailure,helperMayExist,stopped,
    ...(value&& !failure&&!cleanupFailure&&!receiptFailure&&stopped ? {[valueField]:value}:{}),events};
  try{await emit({phase:'terminal',kind:'result',at:now(),result:{...result,events:undefined}});}
  catch(e){result.receiptFailure=String(e);result.pass=false;delete result[valueField];}
  // No retained-helper restart/SSH occurs in this component. A separate
  // independently reviewed handoff must require pass and immutable receipts.
  return result;
}

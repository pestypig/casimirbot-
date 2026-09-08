// Diagnostic-only lifecycle. No CLI, SDK or process adapter is bound here.
// Adapters must enforce absolute deadlines and terminate their own subprocesses.
// A Promise timeout alone cannot safely cancel a cloud operation.
const HELPER='2570241336417567358';
const CLONE='6517758864936518301';
const PHASES=['preflight','replaceDiagnosticStartup','verifyStoppedStartup',
  'restartHelper','observeRunning','readDiagnostic','validateDiagnostic'];

export async function runDiscoveryDiagnostic({ops,record,now,deadline,attempt,
  recordTimeoutMs=5000}){
  const started=now();
  if(!Number.isFinite(started)||!Number.isFinite(deadline)||
    deadline-started>1200000||deadline-started<360000)throw Error('diagnostic_deadline');
  if(!/^[a-f0-9]{64}$/.test(attempt??''))throw Error('diagnostic_attempt');
  if(!Number.isFinite(recordTimeoutMs)||recordTimeoutMs<=0||recordTimeoutMs>5000)
    throw Error('record_timeout_bound');
  for(const name of [...PHASES,'stopAndConfirm'])
    if(typeof ops?.[name]!=='function')throw Error(`missing_${name}`);
  let restartDispatched=false,stopped=false,failure=null,receiptFailure=null,
    cleanupFailure=null,diagnostic=null;
  async function emit(event){
    let timer;
    try{
      await Promise.race([Promise.resolve().then(()=>record(structuredClone(event))),
        new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('record_timeout')),recordTimeoutMs);})]);
    }catch(error){receiptFailure??=String(error);throw error;}
    finally{clearTimeout(timer);}
  }
  async function step(name,input){
    if(now()>=deadline-300000)throw Error('diagnostic_operational_deadline');
    await emit({phase:name,kind:'intent',at:now(),attempt});
    if(name==='restartHelper')restartDispatched=true;
    const value=await ops[name](structuredClone(input),{deadline:deadline-300000});
    await emit({phase:name,kind:'result',at:now(),attempt,result:value});
    if(now()>=deadline-300000)throw Error('diagnostic_late_result');
    return value;
  }
  try{
    const preflight=await step('preflight',{helperId:HELPER,cloneId:CLONE,attempt});
    if(preflight?.helperId!==HELPER||preflight.cloneId!==CLONE||
      preflight.status!=='TERMINATED'||preflight.cloneMode!=='READ_ONLY'||
      preflight.authenticated!==true)throw Error('diagnostic_preflight');
    await step('replaceDiagnosticStartup',{preflight,attempt});
    const verified=await step('verifyStoppedStartup',{preflight,attempt});
    if(verified?.verified!==true||verified.helperId!==HELPER||verified.attempt!==attempt)
      throw Error('diagnostic_startup_binding');
    await step('restartHelper',{preflight,attempt});
    const running=await step('observeRunning',{preflight,attempt});
    if(running?.helperId!==HELPER||running.status!=='RUNNING'||running.authenticated!==true)
      throw Error('diagnostic_running_identity');
    const receipt=await step('readDiagnostic',{preflight,running,attempt});
    diagnostic=await step('validateDiagnostic',{preflight,running,attempt,receipt});
    if(diagnostic?.authenticated!==true||diagnostic.helperId!==HELPER||
      diagnostic.attempt!==attempt||diagnostic.mountAuthorized!==false||
      diagnostic.recoveryAuthorized!==false||diagnostic.scientificAuthority!==false)
      throw Error('diagnostic_receipt_binding');
    // A valid diagnostic may report a parser rejection. It is not build PASS.
  }catch(error){failure=String(error);}
  finally{
    if(restartDispatched){
      try{
        // Stop is independent of recorder health and ordinary work deadline.
        const cleanupStarted=now(),emergency=cleanupStarted>=deadline;
        if(emergency)failure??='diagnostic_deadline_exhausted';
        const result=await ops.stopAndConfirm({helperId:HELPER,
          deadline:emergency?cleanupStarted+60000:deadline,emergency});
        if(result?.helperId!==HELPER||result.stopped!==true)
          throw Error('diagnostic_stop_unconfirmed');
        stopped=true;
      }catch(error){
        cleanupFailure=String(error);
        // Adapter must supply both pinned identity and independent observation.
        stopped=error.helperId===HELPER&&error.stopped===true;
      }
    }
  }
  if(now()>=deadline)failure??='diagnostic_deadline_exhausted';
  const result={complete:!failure&&!receiptFailure&&!cleanupFailure&&stopped,
    failure,receiptFailure,cleanupFailure,restartDispatched,stopped,
    diagnostic:!failure&&!receiptFailure&&!cleanupFailure&&stopped?diagnostic:null};
  // The write may finish late. Never persist completion before its own outcome
  // is known. A durable caller must accept the returned status separately.
  try{await emit({phase:'diagnostic_terminal',kind:'provisional',at:now(),attempt,
    result:{...result,complete:false,readyForAcceptance:result.complete}});}
  catch(error){result.complete=false;result.receiptFailure=String(error);result.diagnostic=null;}
  if(now()>=deadline){result.complete=false;result.failure??='diagnostic_deadline_exhausted';result.diagnostic=null;}
  return result;
}

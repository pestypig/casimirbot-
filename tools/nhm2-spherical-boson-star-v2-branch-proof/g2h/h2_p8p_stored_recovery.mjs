// Local store/lifecycle composition. Cloud operations must be separately
// authenticated and authorized by the caller; no CLI or implicit dispatch.
import {createRecoveryStore} from './h2_p8p_recovery_store.mjs';
import {runDirectArchiveRecovery,runRetainedArchiveRecovery} from './h2_p8p_hostkey_controller.mjs';
export async function runStoredRecovery({root,ops,makeOps,now,deadline,revision='original'}){
 if(!['original','retained-helper-v1','retained-helper-v2'].includes(revision))throw Error('stored_revision');
 if((ops===undefined)===(makeOps===undefined))throw Error('exactly_one_operation_binding');
 const store=await createRecoveryStore(root);
 // Production binding receives this same exclusive recorder so SDK receipts
 // and lifecycle events cannot silently go to separate or ephemeral stores.
 if(makeOps!==undefined){
  if(typeof makeOps!=='function')throw Error('operation_factory');
  ops=makeOps({record:event=>store.record(event)});
 }
 const run=revision==='original'?runDirectArchiveRecovery:runRetainedArchiveRecovery;
 const result=await run({ops,now,deadline,record:event=>store.record({
  ...event,phase:event.phase==='terminal'?'transport_terminal':event.phase,
 })});
 let published=null,failure=result.failure||result.cleanupFailure||result.receiptFailure;
 if(result.pass){try{published=await store.publishArchive(result.archive);}
  catch(error){failure=String(error);}}
 const terminal={pass:result.pass&&published!==null&&!failure,
  stopped:result.stopped,failure,published};
 try{await store.record({phase:'recovery_terminal',result:terminal});}
 catch(error){terminal.pass=false;terminal.receiptFailure=String(error);}
 // A verified copy may survive failed final receipt persistence; never delete
 // it or claim complete recovery from its mere presence.
 return terminal;
}

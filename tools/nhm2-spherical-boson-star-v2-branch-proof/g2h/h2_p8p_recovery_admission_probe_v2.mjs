// Corrected SDK projection; new exclusive read-only capture, no VM operations.
import {createRecoveryStore} from './h2_p8p_recovery_store.mjs';
import {recoveryAccountAdmission} from './h2_p8p_recovery_account.mjs';
const root='C:/NHM2-CV2-Admission-20260905-v2';
const store=await createRecoveryStore(root);
try{
 const observations=await recoveryAccountAdmission({record:store.record,deadline:Date.now()+180000});
 await store.record({type:'admission_terminal',pass:true,observations});
 console.log(JSON.stringify({pass:true,root,scope:'read_only_account_project_startup_policy'}));
}catch(error){
 await store.record({type:'admission_terminal',pass:false,error:String(error)});
 console.error(JSON.stringify({pass:false,root,error:String(error)}));process.exitCode=1;
}

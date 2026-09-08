// Local process bridge. No cloud operation; source binding belongs to runner.
import {open,lstat} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {createHash} from 'node:crypto';
import {boundedProcess} from './h2_p8p_charter_v2_process.mjs';
const PYTHON='C:/Users/dan/AppData/Local/NHM2/p8p-r22-gcloud-583.0.0/sdk/google-cloud-sdk/platform/bundledpython/python.exe';
export function discoveryValidator({inputPath,record,now=Date.now,processImpl=boundedProcess}){
 let used=false;
 return async function validate({serial,attempt,helperId,deadline}){
  if(used)throw Error('validator_consumed');used=true;
  if(helperId!=='2570241336417567358'||!/^[a-f0-9]{64}$/.test(attempt??'')||!Number.isFinite(deadline)||deadline-now()<30000)throw Error('validator_admission');
  const raw=Buffer.from(serial.data.contents);
  if(raw.length>1048576)throw Error('validator_input_cap');
  for(let p=dirname(resolve(inputPath));;p=dirname(p)){
   const s=await lstat(p);if(!s.isDirectory()||s.isSymbolicLink())throw Error('validator_ancestor');
   if(dirname(p)===p)break;
  }
  const file=await open(inputPath,'wx');try{await file.writeFile(raw);await file.sync();}finally{await file.close();}
  const digest=createHash('sha256').update(raw).digest('hex');
  async function persist(event){
   let timer;
   try{await Promise.race([Promise.resolve().then(()=>record(event)),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('validator_record_timeout')),5000);})]);}
   finally{clearTimeout(timer);}
  }
  await persist({type:'diagnostic_audit_input',path:inputPath,bytes:raw.length,sha256:digest});
  if(deadline-now()<25000)throw Error('validator_dispatch_deadline');
  let result;
  try{result=await processImpl(PYTHON,['-B',resolve(import.meta.dirname,'h2_p8p_discovery_audit_cli.py'),
   '--audit-serial',attempt,inputPath,digest],{timeoutMs:Math.min(15000,deadline-now()-10000),killGraceMs:5000,maxBytes:16384});}
  catch(e){result={stdout:e.stdout??'',stderr:e.stderr??'',exitCode:e.exitCode??null,terminationConfirmed:e.terminationConfirmed??false,error:String(e)};}
  await persist({type:'diagnostic_audit_result',...result});
  if(result.exitCode!==0||result.terminationConfirmed!==true||now()>=deadline)throw Error('validator_process');
  const value=JSON.parse(result.stdout);
  if(value.authenticated!==true||value.helperId!==helperId||value.attempt!==attempt||value.serialSha256!==digest||
   value.mountAuthorized!==false||value.recoveryAuthorized!==false||value.scientificAuthority!==false)throw Error('validator_identity');
  return value;
 };
}

import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {retainedResourceCommand as command,retainedStartupPath} from './h2_p8p_retained_commands.mjs';
import {retainedSdkOperations} from './h2_p8p_recovery_sdk_operation.mjs';
test('exact retained commands have no creation or alternate resource path',()=>{
 for(const action of ['startup','restart','attach','stop']){
  const args=command(action,{startupPath:retainedStartupPath});
  assert.ok(args.includes('nhm2-p8p-cv2-hostkey-helper-20260905'));
  assert.ok(args.includes('--zone=us-east1-b'));
  assert.ok(!args.includes('create'));assert.ok(!args.includes('delete'));
 }
 for(const action of ['helper','clone','snapshot','delete','resize'])assert.throws(()=>command(action));
 assert.throws(()=>command('startup',{startupPath:'C:/other.sh'}));
 assert.ok(command('attach').includes('--mode=ro'));
});
test('installed SDK parses all four retained commands without network or execution',()=>{
 const python='C:/Users/dan/AppData/Local/NHM2/p8p-r22-gcloud-583.0.0/sdk/google-cloud-sdk/platform/bundledpython/python.exe';
 const commands=['startup','restart','attach','stop'].map(action=>command(action,{startupPath:retainedStartupPath}));
 commands.push(command('startup',{startupPath:'C:/NHM2-CV2-Retained-v2/startup.sh'}));
 const result=JSON.parse(execFileSync(python,['-B',`${import.meta.dirname}/h2_p8p_hostkey_sdk_parse.py`],{
  input:JSON.stringify(commands),encoding:'utf8',timeout:30000,maxBuffer:4096,windowsHide:true}));
 assert.equal(result.api_dispatch,false);assert.equal(result.results.length,5);
 assert.ok(result.results.every(r=>r.parsed===true));
});
test('retained SDK consumes ambiguous restart and permits cleanup only once',async()=>{
 const calls=[],records=[];
 const dispatch=retainedSdkOperations({record:async e=>records.push(e),startupPath:retainedStartupPath,startupSha256:'a'.repeat(64),now:()=>0,
  processImpl:async(exe,args)=>{calls.push(args);if(args.includes('start'))throw Error('ambiguous');
   return {stdout:'{}',stderr:'',exitCode:0,terminationConfirmed:true};}});
 await assert.rejects(dispatch('restart',{deadline:60000}),/ambiguous/);
 await assert.rejects(dispatch('restart',{deadline:60000}),/already_consumed/);
 await dispatch('stop',{deadline:60000});assert.equal(calls.length,2);
 await assert.rejects(dispatch('stop',{deadline:60000}),/already_consumed/);
 await assert.rejects(dispatch('helper',{deadline:60000}),/retained_operation_scope/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {discoveryCommand,discoveryCommands} from './h2_p8p_discovery_commands.mjs';
test('closed command inventory excludes resources and retries',async()=>{
 for(const action of ['attach','create','delete','resize'])assert.throws(()=>discoveryCommand(action));
 let calls=0;
 const dispatch=discoveryCommands({startupSha256:'a'.repeat(64),record:()=>{},now:()=>0,
  processImpl:async()=>{calls++;return {stdout:'{}',stderr:'',exitCode:0,terminationConfirmed:true};}});
 await dispatch('restart',{deadline:100000});
 await assert.rejects(dispatch('restart',{deadline:100000}),/consumed/);assert.equal(calls,1);
});
test('stop dispatch survives recorder failure',async()=>{
 let calls=0;
 const dispatch=discoveryCommands({startupSha256:'a'.repeat(64),record:()=>{throw Error('disk');},now:()=>0,
  processImpl:async()=>{calls++;return {stdout:'{}',stderr:'',exitCode:0,terminationConfirmed:true};}});
 await assert.rejects(dispatch('stop',{deadline:100000}));assert.equal(calls,1);
});

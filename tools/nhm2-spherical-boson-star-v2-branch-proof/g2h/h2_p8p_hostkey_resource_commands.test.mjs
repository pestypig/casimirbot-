import test from 'node:test';
import assert from 'node:assert/strict';
import {resourceCommand,proposedResources as r} from './h2_p8p_hostkey_resource_commands.mjs';
test('all commands bind account/project; no shell composed text',()=>{
 for(const action of ['snapshot','clone','helper','attach','stop']){
  const args=resourceCommand(action,{startupPath:'C:/NHM2-ATTEST/startup.sh'});
  assert.ok(args.includes('--account=pestypig@gmail.com'));assert.ok(args.includes(`--project=${r.project}`));
  assert.equal(args.filter(x=>x==='compute').length,1);assert.ok(!args.some(x=>x.includes('\n')));
 }
});
test('fixed RO attachment to only proposed helper',()=>{
 const args=resourceCommand('attach');assert.ok(args.includes('--mode=ro'));assert.ok(args.includes(r.helper));
 assert.ok(!args.includes(r.sourceDisk));assert.ok(!args.includes('--boot'));
});
test('helper retains boot disk and has server-side stop ceiling',()=>{
 const args=resourceCommand('helper',{startupPath:'C:/NHM2-ATTEST/startup.sh'});
 assert.ok(args.includes('--max-run-duration=3600s'));assert.ok(args.includes('--instance-termination-action=STOP'));
 assert.ok(args.some(x=>x.startsWith('--create-disk=')&&x.endsWith('boot=yes,auto-delete=no')));
 assert.ok(args.includes('--no-service-account'));assert.ok(args.includes('--no-scopes'));
});
test('rejects substitutions and dangerous startup path syntax',()=>{
 for(const action of ['delete','restart','resize','ssh'])assert.throws(()=>resourceCommand(action));
 for(const startupPath of [undefined,'C:/other/startup.sh','C:/NHM2-X/a.sh,b=bad','C:/NHM2-X/../a.sh'])
  assert.throws(()=>resourceCommand('helper',{startupPath}));
});

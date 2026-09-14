import fs from 'node:fs';
import assert from 'node:assert/strict';
import { classifyKnownMinecraftCommand } from '../server/services/helix-ask/workstation-tool-gateway/minecraft-command-risk';

const operations = [
  { min: [-5,64,8], max: [1,64,208], block:'minecraft:smooth_stone', purpose:'floor' },
  { min: [-4,65,8], max: [0,67,207], block:'minecraft:air', purpose:'clear interior and five-block doorway' },
  { min: [-5,65,8], max: [-5,67,208], block:'minecraft:smooth_stone', purpose:'west guard wall' },
  { min: [1,65,8], max: [1,67,208], block:'minecraft:smooth_stone', purpose:'east guard wall' },
  { min: [-4,65,208], max: [0,67,208], block:'minecraft:smooth_stone', purpose:'closed far end' },
];
const touched = new Set<string>();
const commands = operations.map(op=>{
  const volume=op.min.reduce((n,v,i)=>n*(op.max[i]-v+1),1);
  assert.ok(volume>0 && volume<=32768);
  for(let x=op.min[0];x<=op.max[0];x++)for(let y=op.min[1];y<=op.max[1];y++)for(let z=op.min[2];z<=op.max[2];z++){
    assert.ok(x>=-5&&x<=1&&y>=64&&y<=67&&z>=8&&z<=208);
    assert.ok(!touched.has(`${x},${y},${z}`)); touched.add(`${x},${y},${z}`);
  }
  const command=`execute in minecraft:overworld run fill ${op.min.join(' ')} ${op.max.join(' ')} ${op.block}`;
  const risk=classifyKnownMinecraftCommand(command);
  assert.deepEqual(risk,{category:'world_build',effect:'world_mutation'});
  return {...op,volume,command,risk};
});
assert.equal(touched.size,5628);
const proposal={schema:'casimirbot.cs3_controlled_corridor_proposal.v1',recorded_at:new Date().toISOString(),
  packet:'docs/work-packets/eh-g8-cs3-controlled-corridor-preparation-v1.md',
  proposed_bounds:{min:{x:-5,y:64,z:8},max:{x:1,y:67,z:208}},dimension:'minecraft:overworld',
  unique_positions:touched.size,commands,static_validation_passed:true,
  scope:'Exact volume/nonoverlap and existing local risk classifier only; not live Brigadier parsing, geometry, permission or execution',
  current_player_grant_allows_setup:false,human_setup_consent_received:false,world_mutation_performed:false,
  snapshot_verified:false,governed_execution_path_verified:false,
  setup_blockers:['callable_room_command_execution_disabled','region_checkpoint_exceeds_current_player_32_block_limit','unsurveyed_box_contents_unknown','separate_human_world_authority_consent_required_after_path_preparation'],
  et6_passed:false,cs3_complete:false,cs4_complete:false,nav1_unlocked:false};
fs.writeFileSync('docs/evidence/eh-g8-et6-continuous-session-build-v1/2026-09-14-cs3-controlled-corridor-proposal.json',JSON.stringify(proposal,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({static_validation_passed:true,operations:commands.length,unique_positions:touched.size,executed:false}));

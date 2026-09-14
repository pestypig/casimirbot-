const assert=require('node:assert/strict');
const fs=require('node:fs');
const {buildLinked}=require('./cs3-linked-plan-builder-20260914.cjs');
const evidence=JSON.parse(fs.readFileSync('docs/evidence/eh-g8-et6-continuous-session-build-v1/2026-09-14-cs3-root-attempt-4-request.json','utf8'));
const publication=evidence.frontier.frontier;
const frontier=publication.frontier;
const planning=publication.planning_context;
const actor=evidence.probe.observation.result.actor;
const candidates=[];
for(let i=0;i<4;i++){
 const previous=candidates.at(-1)?.plan;
 const draftFrontier={...frontier,identity:{...frontier.identity,observation_revision:frontier.identity.observation_revision+i,affordance_revision:frontier.identity.affordance_revision+i}};
 const currentPlanning={...planning,successor_context:previous?{available:true,previous_plan_id:previous.plan_id,previous_plan_hash:previous.plan_hash,checkpoint:{event_id:'fixture:checkpoint',checkpoint_id:'fixture:checkpoint'}}:planning.successor_context};
 const candidate=buildLinked(draftFrontier,currentPlanning,i?{...actor,yaw:0,pitch:0}:actor,i,previous);
 const native=candidate.compilation.arguments.nodes.find(n=>n.node_kind==='workflow_action'&&n.action.action_kind==='walk');
 assert.equal(native.earliest_tick,80+i*200);assert.equal(native.latest_start_tick,native.earliest_tick);assert.equal(native.action.duration_ms,10000);assert.equal(native.timeout_ticks,201);
 if(previous){assert.equal(candidate.plan.previous_plan_hash,previous.plan_hash);assert.equal(native.earliest_tick,previous.watermarks.committed_through_unit);assert.deepEqual(candidate.plan.clocks,previous.clocks);}
 assert.equal(candidate.plan.monotonic_deadline_elapsed_ms-candidate.plan.clocks.monotonic.elapsed_ms,47500);
 assert.equal(candidate.compilation.arguments.max_total_ticks,950);
 assert.equal(candidate.plan.automatic_replay,false);assert.equal(candidate.mutation_scope.world_mutation_allowed,false);
 candidates.push(candidate);
}
assert.throws(()=>buildLinked(frontier,planning,actor,4));
assert.throws(()=>buildLinked(frontier,planning,{...actor,health:2},0));
assert.throws(()=>buildLinked(frontier,planning,{...actor,yaw:90},1,candidates[0].plan));
assert.throws(()=>buildLinked(frontier,{...planning,successor_context:{available:true,previous_plan_id:'wrong',previous_plan_hash:'wrong'}},{...actor,yaw:0},1,candidates[0].plan));
console.log(JSON.stringify({scope:'Historical-observation candidate validation with synthetic successor locators; not live admission',count:4,hashes:candidates.map(c=>c.plan.plan_hash),scheduling:'four contiguous 200-tick walks following 80-tick launch window',guards:'invalid index, low health, changed heading and wrong predecessor rejected'}));

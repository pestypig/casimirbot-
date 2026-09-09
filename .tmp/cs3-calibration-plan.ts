// Caller-authored calibration only. No transport, sampling or execution loop.
import { readFileSync } from 'node:fs';
import { buildHelixEnvironmentTemporalPlan } from '../shared/helix-environment-time';
import { compileEnvironmentTimePlanToMinecraftFluidSequenceArtifact } from '../server/services/environment-connectors/temporal-plans/minecraft-environment-time-compiler';
const input = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const { frontier: publication, observation, goal, binding } = input;
const frontier = publication.frontier.frontier;
const context = publication.frontier.planning_context;
const clock = context.resident_clock_observation.clock;
const actor = observation.observation.result.actor;
if (!observation.ok || actor.health !== 20 || !actor.on_ground || actor.on_fire ||
    Math.abs(actor.position.x - 0.18) > 0.1 || Math.abs(actor.position.z - 7.12) > 0.1)
  throw new Error('calibration initial pose changed; requires caller review');
const route = observation.observation.result.navigation_frontier.ranked_frontiers
  .find((r: any) => r.steps.slice(0, 4).every((s: any, i: number) =>
    s.to.x === 0 && s.to.y === 65 && s.to.z === 6-i) && r.steps.length >= 4);
if (!route) throw new Error('north corridor not observed');
const grounded = {kind:'adapter_condition', condition_id:'minecraft.player_grounded', arguments:{expected:true}};
const action = (id: string, capability: string, args: unknown, next: string) => ({
  kind:'action', node_id:id, lane_id:'motion', capability_id:capability, capability_version:'1',
  arguments:args, required_resources:['resource:camera','resource:locomotion'],
  timing:{earliest_start_unit:0,latest_start_unit:200,maximum_duration_units:40},
  preconditions:[grounded], completion_conditions:[grounded], abort_guards:[],effect_budget:{},
  on_success_node_id:next,on_failure_node_id:'failed',on_timeout_node_id:'failed'});
const plan = buildHelixEnvironmentTemporalPlan({
  plan_id:'plan:cs3-calibration-20260908-1',previous_plan_id:null,previous_plan_hash:null,
  identity:frontier.identity,
  clocks:{environment:{kind:'tick',sequence:clock.tick_index,resolution_unit:'minecraft_tick',nominal_units_per_second:20},
    monotonic:{...clock.monotonic,elapsed_ms:Math.floor(clock.monotonic.elapsed_ms)},audit_at:clock.observed_at},
  adapter_id:'minecraft.fabric_client',adapter_version:'1',compiler_version:'environment_time_minecraft:1',resident_executor_version:'native_fabric:1',
  start_node_id:'look',maximum_total_units:400,monotonic_deadline_elapsed_ms:Math.floor(clock.monotonic.elapsed_ms)+20000,
  watermarks:{decision_unit:40,stop_unit:300,committed_through_unit:400,stabilization_node_id:'settled'},
  lanes:[{lane_id:'motion',priority:100,resource_keys:['resource:camera','resource:locomotion']}],effect_ceiling:{},
  nodes:[action('look','com.casimirbot.minecraft.player.look',{action_kind:'look_at',target:{target_kind:'position',position:{x:actor.position.x,y:66.62,z:0.12}},max_turn_degrees_per_tick:45},'walk'),
    action('walk','com.casimirbot.minecraft.player.walk',{action_kind:'walk',direction:'forward',duration_ms:1000,sprint:false},'settled'),
    {kind:'checkpoint',node_id:'settled',checkpoint_id:'checkpoint:cs3-calibration-end',required_evidence_kinds:['player_pose'],condition:grounded,wait_up_to_units:5,on_satisfied_node_id:'success',on_timeout_node_id:'failed'},
    {kind:'terminal',node_id:'success',outcome:'succeeded',reason_code:'calibration_done'},
    {kind:'terminal',node_id:'failed',outcome:'failed',reason_code:'calibration_failed'}] as any});
const mutation_scope = {world_mutation_allowed:false,max_block_mutations:0,max_inventory_transfers:0,allowed_block_ids:[],allowed_regions:[],combat_allowed:false as const};
const resource_bindings = {'resource:camera':'camera','resource:locomotion':'locomotion'} as const;
const artifact = compileEnvironmentTimePlanToMinecraftFluidSequenceArtifact({plan,mutation_scope,resource_bindings});
const created_at = new Date().toISOString();
const request = {schema:'helix.environment_action.request.v1',action_request_id:'action_request:cs3-calibration-20260908-1',workflow_id:'workflow:cs3-calibration-20260908-1',
  action_authority_id:goal.identity.action_authority_id,environment_binding_id:goal.identity.environment_binding_id,room_id:goal.identity.room_id,source_id:goal.identity.source_id,world_id:goal.identity.world_id,
  subject_binding_id:goal.identity.subject_binding_id,subject_native_id:goal.identity.subject_native_id,run_id:binding.run_id,turn_id:'cs3-calibration-20260908-1',provider_execution_id:binding.client_continuation_ref,tool_call_id:'tool:cs3-calibration-20260908-1',catalog_snapshot_id:context.catalog_snapshot_id,
  capability_id:'com.casimirbot.minecraft.player.sequence.execute',capability_version:1,action_kind:'execute_sequence',effect_class:'continuous_control',workflow_mode:'long_running',requested_control_engine:'native_fabric',
  preconditions:[],postconditions:[{condition_id:'sequence-complete',condition_kind:'minecraft.player.sequence_completed',required:true,parameters:{}}],idempotency_key:'cs3-calibration-20260908-1',confirmation_state:'not_required',approval_ref:null,created_at,deadline_at:new Date(Date.now()+20000).toISOString(),
  constraints:{max_duration_ms:20000,max_distance_blocks:6,max_block_mutations:0,max_inventory_transfers:0,manual_override_policy:'cancel',require_postcondition_verification:true,world_mutation_allowed:false,combat_allowed:false,host_access_allowed:false,automatic_replay_allowed:false},
  answer_authority:false,assistant_answer:false,terminal_eligible:false,raw_content_included:false};
console.log(JSON.stringify({submission:{...binding,expected_revision:1,goal_id:goal.goal_id,frontier_id:frontier.frontier_id,prior_turn_id:observation.prior_turn_id,probe_request_id:observation.observation.probe_request_ref,mutation_scope,resource_bindings,plan,request},compiled_node_count:artifact.arguments.nodes.length}));

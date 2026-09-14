import { buildHelixEnvironmentTemporalPlan } from '../shared/helix-environment-time';
import { compileEnvironmentTimePlanToMinecraftFluidSequenceArtifact } from '../server/services/environment-connectors/temporal-plans/minecraft-environment-time-compiler';

export function buildRoot(frontier: any, planning: any, actor: any) {
  const resident = planning.resident_clock_observation;
  if (!resident || resident.clock.clock_kind !== 'minecraft_game_tick' || !resident.clock.monotonic ||
      resident.producer_epoch_ref !== frontier.identity.producer_epoch) throw new Error('Observed resident clock required');
  const radians = actor.yaw * Math.PI / 180;
  // The plan wire format uses integer milliseconds. Floor the actual observed
  // value; retain its origin and shorten, never extend, the frozen deadline.
  const monotonic = { ...resident.clock.monotonic, elapsed_ms: Math.floor(resident.clock.monotonic.elapsed_ms) };
  const destination = { x: actor.position.x - Math.sin(radians) * 4.4, y: actor.position.y, z: actor.position.z + Math.cos(radians) * 4.4 };
  const condition = (name: string, args: any) => ({ kind:'adapter_condition', condition_id:`minecraft.${name}`, arguments:args });
  const plan = buildHelixEnvironmentTemporalPlan({
    schema:'environment.temporal_action_plan.v1', plan_id:'plan:cs3-root-motion-baseline-20260914-01',
    previous_plan_id:null, previous_plan_hash:null, identity:frontier.identity,
    clocks:{environment:{kind:'tick',sequence:resident.clock.tick_index,resolution_unit:'minecraft_tick',nominal_units_per_second:20},monotonic,audit_at:new Date().toISOString()},
    adapter_id:'minecraft.fabric_client', adapter_version:'1', compiler_version:'environment_time_minecraft:1', resident_executor_version:'native_fabric:1',
    start_node_id:'initial', maximum_total_units:150, monotonic_deadline_elapsed_ms:monotonic.elapsed_ms+7500,
    watermarks:{decision_unit:0,stop_unit:120,committed_through_unit:121,stabilization_node_id:'initial'},
    lanes:[{lane_id:'locomotion',priority:100,resource_keys:['resource:locomotion']}], effect_ceiling:{},
    nodes:[
      {kind:'checkpoint',node_id:'initial',checkpoint_id:'checkpoint:cs3-root-initial-20260914-01',required_evidence_kinds:['player_pose'],condition:condition('position_within',{position:actor.position,radius:0.75}),wait_up_to_units:1,on_satisfied_node_id:'walk',on_timeout_node_id:'failed'},
      {kind:'action',node_id:'walk',lane_id:'locomotion',capability_id:'com.casimirbot.minecraft.player.walk',capability_version:'1',arguments:{action_kind:'walk',direction:'forward',duration_ms:1050,sprint:false},required_resources:['resource:locomotion'],timing:{earliest_start_unit:0,latest_start_unit:80,maximum_duration_units:22},preconditions:[condition('player_grounded',{expected:true}),condition('health_at_least',{health:18})],completion_conditions:[condition('player_grounded',{expected:true})],abort_guards:[],effect_budget:{},on_success_node_id:'arrival',on_failure_node_id:'failed',on_timeout_node_id:'failed'},
      {kind:'checkpoint',node_id:'arrival',checkpoint_id:'checkpoint:cs3-root-arrival-20260914-01',required_evidence_kinds:['player_pose'],condition:condition('position_within',{position:destination,radius:1.5}),wait_up_to_units:1,on_satisfied_node_id:'success',on_timeout_node_id:'failed'},
      {kind:'terminal',node_id:'success',outcome:'succeeded',reason_code:'bounded_advance_verified'},
      {kind:'terminal',node_id:'failed',outcome:'failed',reason_code:'bounded_advance_stopped'}
    ],automatic_replay:false,adapter_strategy_authority:false,answer_authority:false,assistant_answer:false,terminal_eligible:false
  } as any);
  const mutation_scope = {world_mutation_allowed:false,max_block_mutations:0,max_inventory_transfers:0,allowed_block_ids:[],allowed_regions:[],combat_allowed:false} as const;
  const resource_bindings = {'resource:locomotion':'locomotion'} as const;
  const compilation = compileEnvironmentTimePlanToMinecraftFluidSequenceArtifact({plan,mutation_scope:mutation_scope as any,resource_bindings});
  return {plan,compilation,mutation_scope,resource_bindings,destination};
}

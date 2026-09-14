import { buildHelixEnvironmentTemporalPlan } from '../shared/helix-environment-time';
import { compileEnvironmentTimePlanToMinecraftFluidSequenceArtifact } from '../server/services/environment-connectors/temporal-plans/minecraft-environment-time-compiler';

export function buildLinked(frontier: any, planning: any, actor: any, index: number, previous?: any) {
  if (!Number.isInteger(index) || index < 0 || index > 3 || (index > 0 && !previous)) throw Error('Invalid finite trial index');
  const resident = planning.resident_clock_observation;
  if (!resident?.clock?.monotonic || resident.clock.clock_kind !== 'minecraft_game_tick' || resident.producer_epoch_ref !== frontier.identity.producer_epoch) throw Error('Observed resident clock required');
  if (actor.health < 18 || !actor.on_ground || actor.on_fire) throw Error('Current viable grounded actor required');
  if (index > 0 && Math.abs(actor.yaw) > 2) throw Error('Southward orientation changed');
  const successor = planning.successor_context;
  if (index > 0 && (!successor?.available || successor.previous_plan_id !== previous.plan_id || successor.previous_plan_hash !== previous.plan_hash)) throw Error('Exact verified predecessor required');
  const clocks = previous?.clocks ?? { environment: {kind:'tick', sequence:resident.clock.tick_index, resolution_unit:'minecraft_tick', nominal_units_per_second:20}, monotonic: {...resident.clock.monotonic, elapsed_ms:Math.floor(resident.clock.monotonic.elapsed_ms)}, audit_at:new Date().toISOString() };
  const start = 80 + index * 200;
  const id = `cs3-linked-walk-20260914-01-${index}`;
  const condition = (name: string, args: any) => ({kind:'adapter_condition',condition_id:`minecraft.${name}`,arguments:args});
  const grounded = condition('player_grounded',{expected:true});
  const action = (node_id: string, capability: string, args: any, lane: string, earliest: number, latest: number, duration: number, next: string) => ({kind:'action',node_id,lane_id:lane,capability_id:`com.casimirbot.minecraft.player.${capability}`,capability_version:'1',arguments:args,required_resources:[`resource:${lane}`],timing:{earliest_start_unit:earliest,latest_start_unit:latest,maximum_duration_units:duration},preconditions:[grounded,condition('health_at_least',{health:18})],completion_conditions:[grounded],abort_guards:[],effect_budget:{},on_success_node_id:next,on_failure_node_id:'failed',on_timeout_node_id:'failed'});
  const nodes:any[]=[{kind:'checkpoint',node_id:'initial',checkpoint_id:`checkpoint:${id}`,required_evidence_kinds:['player_pose'],condition:index===0?condition('position_within',{position:actor.position,radius:0.75}):grounded,wait_up_to_units:1,on_satisfied_node_id:index===0?'align':'walk',on_timeout_node_id:'failed'}];
  if(index===0) nodes.push(action('align','look',{action_kind:'look_at',target:{target_kind:'relative_rotation',yaw_delta_degrees:-actor.yaw,pitch_delta_degrees:-actor.pitch},max_turn_degrees_per_tick:15},'camera',0,80,30,'walk'));
  nodes.push(action('walk','walk',{action_kind:'walk',direction:'forward',duration_ms:10000,sprint:false},'locomotion',start,start,201,'success'),{kind:'terminal',node_id:'success',outcome:'succeeded',reason_code:'bounded_forward_segment_verified'},{kind:'terminal',node_id:'failed',outcome:'failed',reason_code:'bounded_forward_segment_stopped'});
  const plan=buildHelixEnvironmentTemporalPlan({schema:'environment.temporal_action_plan.v1',plan_id:`plan:${id}`,previous_plan_id:previous?.plan_id??null,previous_plan_hash:previous?.plan_hash??null,identity:frontier.identity,clocks,adapter_id:'minecraft.fabric_client',adapter_version:'1',compiler_version:'environment_time_minecraft:1',resident_executor_version:'native_fabric:1',start_node_id:'initial',maximum_total_units:950,monotonic_deadline_elapsed_ms:clocks.monotonic.elapsed_ms+47500,watermarks:{decision_unit:start,stop_unit:start+(index===3?202:199),committed_through_unit:start+(index===3?203:200),stabilization_node_id:'initial'},lanes:[{lane_id:'locomotion',priority:100,resource_keys:['resource:locomotion']},...(index===0?[{lane_id:'camera',priority:100,resource_keys:['resource:camera']}]:[])],effect_ceiling:{},nodes,automatic_replay:false,adapter_strategy_authority:false,answer_authority:false,assistant_answer:false,terminal_eligible:false} as any);
  const mutation_scope={world_mutation_allowed:false,max_block_mutations:0,max_inventory_transfers:0,allowed_block_ids:[],allowed_regions:[],combat_allowed:false} as const;
  const resource_bindings={'resource:locomotion':'locomotion','resource:camera':'camera'} as const;
  const compilation=compileEnvironmentTimePlanToMinecraftFluidSequenceArtifact({plan,mutation_scope:mutation_scope as any,resource_bindings});
  return {plan,compilation,mutation_scope,resource_bindings,id,checkpoint:index>0?successor.checkpoint:undefined};
}

import fs from "node:fs/promises";

const artifact = JSON.parse(await fs.readFile(
  "artifacts/helix-minecraft-guardian-v0.4/keyed-helix/unexpected-event/attempt-39-mid-execution-health/guardian_mid_execution_health_interrupt/ask-response.json",
  "utf8",
));
const queue = [artifact];
const seen = new Set();
const programs = [];
const measurements = [];
const executions = [];
while (queue.length > 0 && seen.size < 100_000) {
  const value = queue.shift();
  if (!value || typeof value !== "object" || seen.has(value)) continue;
  seen.add(value);
  if (value.program_schema === "helix.minecraft.reactive_program.v1") {
    if (Array.isArray(value.lanes)) {
      programs.push({
        program_id: value.program_id,
        max_total_ticks: value.max_total_ticks,
        completion_policy: value.completion_policy,
        lanes: value.lanes.map((lane) => ({
          lane_id: lane.lane_id,
          lane_kind: lane.lane_kind,
          activation: lane.activation,
          required: lane.required,
          start_node_id: lane.start_node_id,
          nodes: (lane.nodes ?? []).map((node) => ({
            node_id: node.node_id,
            node_kind: node.node_kind,
            action_kind: node.action?.action_kind,
            duration_ms: node.action?.duration_ms,
            terminal_outcome: node.terminal_outcome,
            reason_code: node.reason_code,
          })),
        })),
        interrupts: value.interrupts,
      });
    }
    if (typeof value.reason_code === "string") {
      measurements.push({
        program_id: value.program_id,
        reason_code: value.reason_code,
        tick_index: value.tick_index,
        interrupt_count: value.interrupt_count,
        condition_observations: value.condition_observations,
        controls_released: value.controls_released,
        lanes: value.lanes,
        world_mutations_performed: value.world_mutations_performed,
        inventory_mutations_performed: value.inventory_mutations_performed,
      });
    }
  }
  if (
    value.action_kind === "execute_reactive_program" &&
    typeof value.outcome === "string" &&
    (value.started_at || value.completed_at)
  ) {
    executions.push({
      action_request_id: value.action_request_id,
      workflow_id: value.workflow_id,
      outcome: value.outcome,
      summary: value.summary,
      started_at: value.started_at,
      completed_at: value.completed_at,
      duration_ticks: value.duration_ticks,
      program_id: value.measurements?.program_id,
      reason_code: value.measurements?.reason_code,
      tick_index: value.measurements?.tick_index,
      interrupt_count: value.measurements?.interrupt_count,
      condition_observations: value.measurements?.condition_observations,
    });
  }
  for (const child of Array.isArray(value) ? value : Object.values(value)) {
    if (child && typeof child === "object") queue.push(child);
  }
}
const unique = (values) => [...new Map(values.map((value) => [JSON.stringify(value), value])).values()];
process.stdout.write(`${JSON.stringify({
  programs: unique(programs),
  measurements: unique(measurements),
  executions: unique(executions),
  compound_summary: artifact.compound_capability_contract
    ? {
        rail_status: artifact.compound_capability_contract.rail_status,
        subgoals: artifact.compound_capability_contract.subgoals?.map((subgoal) => ({
          requested_capability: subgoal.requested_capability,
          capability_occurrence: subgoal.capability_occurrence,
          satisfaction: subgoal.satisfaction,
          evidence_gathered: subgoal.evidence_gathered,
          observation_refs: subgoal.observation_refs,
        })),
      }
    : null,
  terminal_summary: artifact.terminal_authority_single_writer
    ? {
        selected_artifact_kind:
          artifact.terminal_authority_single_writer.selection?.selectedArtifactKind,
        missing_itinerary_families:
          artifact.terminal_authority_single_writer.integrity?.missing_itinerary_families,
        provider_route_product_materialized:
          artifact.terminal_authority_single_writer.integrity?.provider_route_product_materialized,
        lifecycle_differential_audit:
          artifact.terminal_authority_single_writer.integrity?.lifecycle_differential_audit,
      }
    : null,
}, null, 2)}\n`);

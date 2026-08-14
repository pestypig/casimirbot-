import { readFileSync } from "node:fs";
import { classifyGuardianCollisionPredictionEvidence } from
  "./helix-minecraft-guardian-evidence.mjs";

const path = process.argv[2];
if (!path) throw new Error("ask_response_path_required");
const compact = process.argv.includes("--compact");
const metaOnly = process.argv.includes("--meta");
const regradeOnly = process.argv.includes("--regrade");
const statesOnly = process.argv.includes("--states");
const timingsOnly = process.argv.includes("--timings");
const programFilter = process.argv.find((arg) => arg.startsWith("--program="))?.slice("--program=".length);
const root = JSON.parse(readFileSync(path, "utf8"));
const guardian = "com.casimirbot.minecraft.player.guardian.execute";
const timingFields = [];
const timingSignatures = new Set();

function record(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value
    : null;
}

function array(value) {
  return Array.isArray(value) ? value : [];
}

function scalar(source, keys) {
  if (!source) return null;
  for (const key of keys) {
    const value = source[key];
    if (value === null || ["string", "number", "boolean"].includes(typeof value)) {
      if (value !== undefined) return value;
    }
  }
  return null;
}

function capability(source) {
  return scalar(source, ["capability_id", "capability", "capability_key", "source_capability_id", "delegated_capability_id"]);
}

function programArgs(source) {
  if (!source) return null;
  for (const key of ["arguments", "executed_args", "args", "lane_request"]) {
    const candidate = record(source[key]);
    if (candidate?.program_schema === "helix.minecraft.reactive_program.v1") return candidate;
  }
  return null;
}

function summarizeNode(node) {
  const condition = record(node.condition);
  const action = record(node.action);
  const binding = record(action?.position_binding);
  return {
    node_id: node.node_id,
    node_kind: node.node_kind,
    earliest_tick: node.earliest_tick,
    timeout_ticks: node.timeout_ticks,
    wait_up_to_ticks: node.wait_up_to_ticks,
    condition_kind: condition?.condition_kind,
    condition: condition,
    action_kind: action?.action_kind,
    direction: action?.direction,
    duration_ms: action?.duration_ms,
    block_id: action?.block_id,
    position_binding: binding ? {
      binding_kind: binding.binding_kind,
      horizon_ticks: binding.horizon_ticks,
      max_distance_blocks: binding.max_distance_blocks,
      require_replaceable: binding.require_replaceable,
    } : undefined,
    checkpoint_id: node.checkpoint_id,
    on_true: node.on_true,
    on_false: node.on_false,
    on_satisfied: node.on_satisfied,
    on_event: node.on_event,
    on_success: node.on_success,
    on_failure: node.on_failure,
    on_timeout: node.on_timeout,
    terminal_outcome: node.terminal_outcome,
    reason_code: node.reason_code,
  };
}

function compactNode(node) {
  const summary = summarizeNode(node);
  return Object.fromEntries(
    Object.entries(summary).filter(([, value]) => value !== undefined && value !== null),
  );
}

function summarizeProgram(args) {
  return {
    program_id: args.program_id,
    ruleset: args.ruleset,
    max_total_ticks: args.max_total_ticks,
    completion_policy: args.completion_policy,
    mutation_scope: args.mutation_scope,
    lanes: array(args.lanes).map(record).filter(Boolean).map((lane) => ({
      lane_id: lane.lane_id,
      lane_kind: lane.lane_kind,
      priority: lane.priority,
      required: lane.required,
      activation: lane.activation,
      resource_ceiling: lane.resource_ceiling,
      start_node_id: lane.start_node_id,
      nodes: array(lane.nodes).map(record).filter(Boolean).map(summarizeNode),
    })),
    races: args.races,
    interrupts: args.interrupts,
  };
}

function compactProgram(args) {
  return {
    program_id: args.program_id,
    max_total_ticks: args.max_total_ticks,
    completion_policy: args.completion_policy,
    mutation_scope: args.mutation_scope,
    lanes: array(args.lanes).map(record).filter(Boolean).map((lane) => ({
      lane_id: lane.lane_id,
      lane_kind: lane.lane_kind,
      required: lane.required,
      activation: lane.activation,
      resource_ceiling: lane.resource_ceiling,
      start_node_id: lane.start_node_id,
      nodes: array(lane.nodes).map(record).filter(Boolean).map(compactNode),
    })),
  };
}

const programs = [];
const programSignatures = new Set();
const outcomes = [];
const outcomeSignatures = new Set();
const successfulMeasurementSets = [];

function visit(value, pointer = "") {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => visit(entry, `${pointer}[${index}]`));
    return;
  }
  const source = record(value);
  if (!source) return;
  for (const [key, child] of Object.entries(source)) {
    if (
      /(?:elapsed|duration|latency|timing|started_at|completed_at|tick_index|total_ticks)/iu.test(key) &&
      (child === null || ["string", "number", "boolean"].includes(typeof child))
    ) {
      const entry = { pointer, key, value: child };
      const signature = JSON.stringify(entry);
      if (!timingSignatures.has(signature)) {
        timingSignatures.add(signature);
        timingFields.push(entry);
      }
    }
  }
  const sourceCapability = capability(source);
  const args = programArgs(source);
  if (sourceCapability === guardian && args) {
    const summary = compact ? compactProgram(args) : summarizeProgram(args);
    const signature = JSON.stringify(summary);
    if (!programSignatures.has(signature)) {
      programSignatures.add(signature);
      programs.push({ pointer, ...summary });
    }
  }
  if (sourceCapability === guardian) {
    const observation = record(source.observation);
    const result = record(source.result) ?? record(observation?.result);
    const measurements = record(result?.verified_terminal_measurements);
    const outcome = scalar(source, ["outcome", "status", "execution_status"])
      ?? scalar(observation, ["outcome", "status"]);
    const summaryText = scalar(source, ["summary", "observation_summary", "failure_message"])
      ?? scalar(observation, ["summary"]);
    if (outcome || summaryText || measurements) {
      const summary = {
        outcome,
        summary: summaryText,
        reason_code: scalar(measurements, ["reason_code", "failure_code"]),
        tick_index: scalar(measurements, ["tick_index"]),
        failed_lane_id: scalar(measurements, ["failed_lane_id"]),
        executed_action_count: scalar(measurements, ["executed_action_count"]),
        action_receipt_count: scalar(measurements, ["action_receipt_count"]),
        placement_prediction_count: scalar(measurements, ["placement_prediction_count"]),
        placement_action_success_count: scalar(measurements, ["placement_action_success_count"]),
        player_motion_performed: scalar(measurements, ["player_motion_performed"]),
        world_mutations_performed: scalar(measurements, ["world_mutations_performed"]),
        controls_released: scalar(measurements, ["controls_released"]),
      };
      const signature = JSON.stringify(summary);
      if (!outcomeSignatures.has(signature)) {
        outcomeSignatures.add(signature);
        outcomes.push({ pointer, ...summary });
      }
    }
    if (outcome === "succeeded" && measurements) {
      successfulMeasurementSets.push(measurements);
    }
  }
  for (const [key, child] of Object.entries(source)) {
    visit(child, pointer ? `${pointer}.${key}` : key);
  }
}

visit(root);
const laneLoop = record(root.runtime_lane_request_loop);
const rejection = record(record(root.runtime_lane_request_contract)?.continuation_lane_candidate_rejection);
const loopSummary = array(laneLoop?.candidate_chain).map((entry, index) => {
  const source = record(entry);
  return {
    index,
    keys: source ? Object.keys(source) : [],
    capability_id: capability(source),
    program_id: programArgs(source)?.program_id,
    outcome: scalar(source, ["outcome", "status", "execution_status"]),
    reason: scalar(source, ["reason", "reason_code", "failure_code", "rejection_reason"]),
    summary: scalar(source, ["summary", "failure_message", "message"]),
  };
});
const rejectionSummary = rejection ? {
  keys: Object.keys(rejection),
  reason: scalar(rejection, ["reason", "reason_code", "failure_code", "rejection_reason"]),
  summary: scalar(rejection, ["summary", "failure_message", "message", "detail"]),
  violations: rejection.violations,
  candidate_program_id: programArgs(rejection)?.program_id ?? programArgs(record(rejection.candidate))?.program_id,
} : null;
const gatewaySamples = array(record(record(root.debug)?.workstation_gateway_call_results)?.sample)
  .map((entry, index) => {
    const source = record(entry);
    const observation = record(source?.observation);
    const result = record(source?.result) ?? record(observation?.result);
    const measurements = record(result?.verified_terminal_measurements);
    return {
      index,
      capability_id: capability(source),
      program_id: programArgs(source)?.program_id,
      outcome: scalar(source, ["outcome", "status", "execution_status"])
        ?? scalar(observation, ["outcome", "status"]),
      summary: scalar(source, ["summary", "observation_summary", "failure_message"])
        ?? scalar(observation, ["summary"]),
      reason_code: scalar(measurements, ["reason_code", "failure_code"]),
      tick_index: scalar(measurements, ["tick_index"]),
      failed_lane_id: scalar(measurements, ["failed_lane_id"]),
      node_outcomes: measurements?.node_outcomes,
      condition_observations: measurements?.condition_observations,
      action_receipts: measurements?.action_receipts,
      resource_conflict_count: measurements?.resource_conflict_count,
    };
  });
const continuationStates = array(root.agent_continuation_states).map((entry, index) => {
  const source = record(entry);
  const attempt = record(source?.last_attempt);
  return {
    index,
    keys: source ? Object.keys(source) : [],
    decision: scalar(source, ["decision", "status", "state"]),
    reason: scalar(source, ["reason", "reason_code", "failure_code"]),
    step_count: scalar(source, ["step_count", "steps_used", "attempt_count"]),
    remaining_steps: scalar(source, ["remaining_steps", "steps_remaining", "remaining_budget"]),
    last_capability_id: capability(attempt),
    last_failure_class: scalar(attempt, ["failure_class"]),
    last_failure_code: scalar(attempt, ["failure_code"]),
    last_retryability: scalar(attempt, ["retryability"]),
    last_program_id: programArgs(attempt)?.program_id,
    last_outcome: scalar(attempt, ["outcome", "status", "execution_status"]),
    last_summary: scalar(attempt, ["summary", "failure_message", "message"]),
  };
});
const collisionEvidenceRegradeSignatures = new Set();
const collisionEvidenceRegrades = successfulMeasurementSets.flatMap((measurements) => {
  const classification = {
    program_id: measurements.program_id,
    ...classifyGuardianCollisionPredictionEvidence(measurements),
  };
  const signature = JSON.stringify(classification);
  if (collisionEvidenceRegradeSignatures.has(signature)) return [];
  collisionEvidenceRegradeSignatures.add(signature);
  return [classification];
});
console.log(JSON.stringify(regradeOnly
  ? { collision_evidence_regrades: collisionEvidenceRegrades }
  : timingsOnly
    ? { timing_fields: timingFields }
  : statesOnly
    ? { continuation_states: continuationStates }
  : metaOnly
    ? { loop_summary: loopSummary, rejection: rejectionSummary, gateway_samples: gatewaySamples, continuation_states: continuationStates, collision_evidence_regrades: collisionEvidenceRegrades }
    : { programs: programFilter ? programs.filter((program) => program.program_id?.includes(programFilter)) : programs, outcomes, loop_summary: loopSummary, rejection: rejectionSummary, gateway_samples: gatewaySamples, continuation_states: continuationStates, collision_evidence_regrades: collisionEvidenceRegrades }, null, 2));

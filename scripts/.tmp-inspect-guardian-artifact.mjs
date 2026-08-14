import { readFileSync } from "node:fs";
import { join } from "node:path";

const artifactDirectory = process.argv[2];
if (!artifactDirectory) throw new Error("artifact_directory_required");
const compactContinuationOnly = process.argv[3] === "continuation";

const interestingKeys = new Set([
  "agent_continuation_states",
  "agent_continuation_state",
  "generic_provider_continuation",
  "runtime_lane_request_loop",
  "verified_terminal_measurements",
  "capability_itinerary_execution_state",
]);

const capabilitySuffixes = [
  "situation_digest.read",
  "spatial_region.inspect",
  "actor.status.read",
  "inventory.check",
  "player.guardian.execute",
];

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function scalar(record, keys) {
  for (const key of keys) {
    const value = record[key];
    if (value === null || ["string", "number", "boolean"].includes(typeof value)) {
      if (value !== undefined) return value;
    }
  }
  return undefined;
}

function scalarArray(record, keys) {
  for (const key of keys) {
    const value = record[key];
    if (Array.isArray(value) && value.every((entry) => entry === null || ["string", "number", "boolean"].includes(typeof entry))) {
      return value;
    }
  }
  return undefined;
}

function summarizeContinuation(value) {
  const records = Array.isArray(value) ? value.filter(isRecord) : isRecord(value) ? [value] : [];
  return records.map((record) => {
    const lastAttempt = isRecord(record.last_attempt) ? record.last_attempt : {};
    const capabilityProposal = isRecord(record.capability_proposal) ? record.capability_proposal : {};
    const budget = isRecord(record.budget) ? record.budget : {};
    const progress = isRecord(record.progress) ? record.progress : {};
    return {
    sequence: scalar(record, ["sequence", "step", "attempt", "continuation_index"]),
    trigger: scalar(record, ["trigger", "continuation_trigger", "reason"]),
    phase: scalar(record, ["phase", "state", "status"]),
    last_capability_id: scalar(record, ["last_capability_id", "last_requested_capability_id", "capability_id"]),
    last_capability_status: scalar(record, ["last_capability_status", "last_execution_status", "outcome"]),
    failure_code: scalar(record, ["last_failure_code", "failure_code", "reason_code"]),
    retryable: scalar(record, ["retryable", "last_failure_retryable", "can_retry"]),
    allowed_decisions: scalarArray(record, ["allowed_decisions", "allowed_next_decisions", "next_allowed_decisions"]),
    missing_capability_ids: scalarArray(record, ["missing_required_capability_ids", "missing_capability_ids", "pending_required_capability_ids"]),
    missing_observation_ids: scalarArray(record, ["missing_required_observation_ids", "missing_observation_ids", "pending_required_observation_ids"]),
    missing_requirement_ids: scalarArray(record, ["missing_requirement_ids"]),
    last_attempt: Object.keys(lastAttempt).length > 0 ? {
      capability_id: scalar(lastAttempt, ["capability_id"]),
      status: scalar(lastAttempt, ["status"]),
      failure_code: scalar(lastAttempt, ["failure_code"]),
      failure_class: scalar(lastAttempt, ["failure_class"]),
      retryability: scalar(lastAttempt, ["retryability"]),
      observation_refs: scalarArray(lastAttempt, ["observation_refs"]),
    } : undefined,
    capability_proposal: Object.keys(capabilityProposal).length > 0 ? {
      capability_id: scalar(capabilityProposal, ["capability_id"]),
      status: scalar(capabilityProposal, ["status"]),
    } : undefined,
    budget,
    progress,
    };
  });
}

function summarizeGenericContinuation(value) {
  if (!isRecord(value)) return summarizeContinuation(value);
  return {
    max_steps: value.max_steps,
    step_count: value.step_count,
    stop_reason: value.stop_reason,
    rejection_count: value.rejection_count,
    terminal_review_count: value.terminal_review_count,
    terminal_reviewed: value.terminal_reviewed,
    terminal_eligible: value.terminal_eligible,
    pending_request: isRecord(value.pending_request) ? {
      capability_id: scalar(value.pending_request, ["capability_id"]),
      decision: scalar(value.pending_request, ["decision"]),
    } : value.pending_request,
  };
}

function summarizeTerminalMeasurements(record) {
  return {
    reason_code: scalar(record, ["reason_code", "failure_code", "code"]),
    tick_index: scalar(record, ["tick_index", "terminal_tick", "ticks_elapsed"]),
    duration_ms: scalar(record, ["duration_ms", "elapsed_ms"]),
    controls_released: scalar(record, ["controls_released"]),
    max_concurrent_lanes: scalar(record, ["max_concurrent_lanes", "max_parallel_lanes"]),
    player_motion_observed: scalar(record, ["player_motion_observed", "player_motion"]),
    placement_prediction_count: scalar(record, ["placement_prediction_count"]),
    placement_action_success_count: scalar(record, ["placement_action_success_count"]),
    world_mutations_performed: scalar(record, ["world_mutations_performed"]),
    inventory_mutations_performed: scalar(record, ["inventory_mutations_performed"]),
    final_health: scalar(record, ["final_health"]),
    lane_states: record.lane_states ?? record.lanes ?? undefined,
    keys: Object.keys(record).sort(),
  };
}

function summarizeItineraryExecution(record) {
  const ledger = Array.isArray(record.compound_subgoal_ledger)
    ? record.compound_subgoal_ledger.filter(isRecord).map((entry) => ({
        subgoal_id: scalar(entry, ["subgoal_id"]),
        requested_capability: scalar(entry, ["requested_capability"]),
        runtime_capability: scalar(entry, ["runtime_capability"]),
        executed_capability: scalar(entry, ["executed_capability"]),
        satisfaction: scalar(entry, ["satisfaction"]),
        observation_ref: scalar(entry, ["observation_ref"]),
        rail_status: scalar(entry, ["rail_status"]),
        rail_failure_code: scalar(entry, ["rail_failure_code"]),
      }))
    : [];
  return {
    applies: record.applies,
    complete: record.complete,
    required_capabilities: record.required_capabilities,
    missing_required_capabilities: record.missing_required_capabilities,
    missing_compound_subgoal_ids: record.missing_compound_subgoal_ids,
    missing_required_capability_any_of_groups:
      record.missing_required_capability_any_of_groups,
    ledger,
  };
}

function summarizeCapabilityRecord(record) {
  const capabilityId = scalar(record, ["capability_id", "requested_capability_id"]);
  if (typeof capabilityId !== "string" || !capabilitySuffixes.some((suffix) => capabilityId.endsWith(suffix))) return null;
  return {
    capability_id: capabilityId,
    status: scalar(record, ["status", "outcome", "execution_status"]),
    failure_code: scalar(record, ["failure_code", "reason_code", "code"]),
    retryable: scalar(record, ["retryable", "can_retry"]),
    observation_ref: scalar(record, ["observation_ref", "evidence_ref", "result_ref"]),
    observation_reentered: scalar(record, ["observation_reentered", "reentered"]),
    lane_executed: scalar(record, ["lane_executed", "executed"]),
    keys: Object.keys(record).sort(),
  };
}

for (const filename of ["ask-response.json", "debug-export.json", "probe-result.json"]) {
  const root = JSON.parse(readFileSync(join(artifactDirectory, filename), "utf8"));
  const found = [];
  const capabilityRecords = [];
  const seenCapabilitySignatures = new Set();

  function visit(value, path) {
    if (Array.isArray(value)) {
      value.forEach((entry, index) => visit(entry, `${path}[${index}]`));
      return;
    }
    if (!isRecord(value)) return;

    const capabilitySummary = summarizeCapabilityRecord(value);
    if (capabilitySummary) {
      const signature = JSON.stringify(capabilitySummary);
      if (!seenCapabilitySignatures.has(signature)) {
        seenCapabilitySignatures.add(signature);
        capabilityRecords.push({ path, ...capabilitySummary });
      }
    }

    for (const [key, child] of Object.entries(value)) {
      const childPath = path ? `${path}.${key}` : key;
      if (interestingKeys.has(key)) {
        found.push({
          path: childPath,
          summary: key === "verified_terminal_measurements" && isRecord(child)
            ? summarizeTerminalMeasurements(child)
            : key === "capability_itinerary_execution_state" && isRecord(child)
              ? summarizeItineraryExecution(child)
            : key === "generic_provider_continuation"
              ? summarizeGenericContinuation(child)
            : summarizeContinuation(child),
        });
      }
      visit(child, childPath);
    }
  }

  visit(root, "");
  console.log(JSON.stringify({
    filename,
    found,
    capability_records: compactContinuationOnly ? undefined : capabilityRecords,
  }, null, 2));
  if (compactContinuationOnly) break;
}

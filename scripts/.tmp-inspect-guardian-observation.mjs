import { readFileSync } from "node:fs";

const path = process.argv[2];
const artifactSuffix = process.argv[3];
if (!path || !artifactSuffix) throw new Error("path_and_artifact_suffix_required");
const root = JSON.parse(readFileSync(path, "utf8"));

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

const matches = [];
function visit(value, pointer = "") {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => visit(entry, `${pointer}[${index}]`));
    return;
  }
  if (!isRecord(value)) return;
  const id = typeof value.artifact_id === "string" ? value.artifact_id : null;
  if (id?.endsWith(artifactSuffix)) {
    const payload = isRecord(value.payload) ? value.payload : {};
    const result = isRecord(payload.result) ? payload.result : {};
    const observation = isRecord(payload.observation) ? payload.observation : {};
    const measurements = isRecord(result.verified_terminal_measurements)
      ? result.verified_terminal_measurements
      : isRecord(observation.verified_terminal_measurements)
        ? observation.verified_terminal_measurements
        : isRecord(payload.verified_terminal_measurements)
          ? payload.verified_terminal_measurements
          : {};
    matches.push({
      pointer,
      artifact_id: id,
      kind: value.kind,
      status: value.status,
      capability_key: value.capability_key,
      payload_keys: Object.keys(payload).sort(),
      payload_status: payload.status,
      result_keys: Object.keys(result).sort(),
      result_status: result.status,
      result_outcome: result.outcome,
      result_reason_code: result.reason_code,
      result_flags: {
        side_effects_performed: result.side_effects_performed,
        player_motion_performed: result.player_motion_performed,
        player_interaction_performed: result.player_interaction_performed,
        world_mutation_performed: result.world_mutation_performed,
        inventory_mutation_performed: result.inventory_mutation_performed,
      },
      postconditions: result.postconditions,
      measurements: {
        reason_code: measurements.reason_code,
        reactive_program_completed: measurements.reactive_program_completed,
        tick_index: measurements.tick_index,
        executed_action_count: measurements.executed_action_count,
        action_receipt_count: measurements.action_receipt_count,
        player_motion_performed: measurements.player_motion_performed,
        player_interaction_performed: measurements.player_interaction_performed,
        placement_action_success_count: measurements.placement_action_success_count,
        placement_mutation_success_count: measurements.placement_mutation_success_count,
        world_mutations_performed: measurements.world_mutations_performed,
        inventory_mutations_performed: measurements.inventory_mutations_performed,
        satisfied_checkpoint_ids: measurements.satisfied_checkpoint_ids,
        action_receipts: measurements.action_receipts,
      },
    });
  }
  for (const [key, child] of Object.entries(value)) visit(child, pointer ? `${pointer}.${key}` : key);
}

visit(root);
console.log(JSON.stringify(matches, null, 2));

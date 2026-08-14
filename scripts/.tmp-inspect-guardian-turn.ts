import { createReadStream } from "node:fs";
import { resolve } from "node:path";

async function readSnapshotTable(tableName: string): Promise<Record<string, unknown>[]> {
  const marker = `\"${tableName}\":`;
  const stream = createReadStream(resolve(".cal/local-pg-mem.json"), {
    encoding: "utf8",
    highWaterMark: 1024 * 1024,
  });
  let pending = "";
  let found = false;
  let collecting = false;
  let depth = 0;
  let inString = false;
  let escaped = false;
  let value = "";

  for await (const chunk of stream) {
    let text = pending + chunk;
    pending = "";
    if (!found) {
      const markerIndex = text.indexOf(marker);
      if (markerIndex < 0) {
        pending = text.slice(-marker.length);
        continue;
      }
      found = true;
      text = text.slice(markerIndex + marker.length);
    }
    for (const character of text) {
      if (!collecting) {
        if (/\s/u.test(character)) continue;
        if (character !== "[") throw new Error(`snapshot_table_not_array:${tableName}`);
        collecting = true;
      }
      value += character;
      if (inString) {
        if (escaped) escaped = false;
        else if (character === "\\") escaped = true;
        else if (character === '"') inString = false;
        continue;
      }
      if (character === '"') inString = true;
      else if (character === "[") depth += 1;
      else if (character === "]") {
        depth -= 1;
        if (depth === 0) {
          stream.destroy();
          return JSON.parse(value) as Record<string, unknown>[];
        }
      }
    }
  }
  throw new Error(`snapshot_table_not_found:${tableName}`);
}

const turn = process.argv[2];
if (!turn) throw new Error("turn_id_required");
const requests = (await readSnapshotTable("helix_environment_action_requests"))
  .filter((row) => row.turn_id === turn);
const requestIds = new Set(requests.map((row) => row.action_request_id));
const results = (await readSnapshotTable("helix_environment_action_results"))
  .filter((row) => requestIds.has(row.action_request_id));
const resultByRequest = new Map(results.map((row) => [row.action_request_id, row]));
const workflowIds = new Set(requests.map((row) => row.workflow_id));
const events = (await readSnapshotTable("helix_environment_action_workflow_events"))
  .filter((row) => workflowIds.has(row.workflow_id));
const eventsByWorkflow = new Map<string, Record<string, unknown>[]>();
for (const event of events) {
  const workflowId = String(event.workflow_id);
  const current = eventsByWorkflow.get(workflowId) ?? [];
  current.push(event);
  eventsByWorkflow.set(workflowId, current);
}

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? parsed as Record<string, unknown>
        : {};
    } catch {
      return {};
    }
  }
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

const rows = requests.map((request) => {
  const result = resultByRequest.get(request.action_request_id);
  const record = asRecord(result?.result_payload);
  const requestPayload = asRecord(request.request_payload);
  const requestArguments = asRecord(requestPayload.arguments);
  const measurements = record.measurements && typeof record.measurements === "object"
    && !Array.isArray(record.measurements)
    ? record.measurements as Record<string, unknown>
    : {};
  const terminalMeasurements = asRecord(record.verified_terminal_measurements);
  const workflowEvents = (eventsByWorkflow.get(String(request.workflow_id)) ?? [])
    .sort((left, right) => Number(left.sequence) - Number(right.sequence))
    .map((event) => {
      const eventPayload = asRecord(event.event_payload);
      return {
        sequence: event.sequence,
        event_type: event.event_type,
        summary: eventPayload.summary ?? null,
        reason: eventPayload.reason ?? eventPayload.failure_reason ?? null,
        code: eventPayload.code ?? eventPayload.failure_code ?? null,
        lane_id: eventPayload.lane_id ?? null,
        action_id: eventPayload.action_id ?? null,
        workflow_state: eventPayload.workflow_state ?? null,
      };
    });
  return {
    workflow_id: request.workflow_id,
    capability_id: request.capability_id,
    status: request.status,
    attempt_count: request.attempt_count,
    created_at: request.created_at,
    completed_at: request.completed_at ?? null,
    outcome: result?.outcome ?? null,
    controls_released: result?.controls_released ?? null,
    eligible_for_current_turn_reentry: result?.eligible_for_current_turn_reentry ?? null,
    request_payload_keys: Object.keys(requestPayload),
    request_argument_keys: Object.keys(requestArguments),
    request_program: {
      program_id: requestArguments.program_id ?? null,
      max_total_ticks: requestArguments.max_total_ticks ?? null,
      completion_policy: requestArguments.completion_policy ?? null,
      mutation_scope: requestArguments.mutation_scope ?? null,
      lanes: requestArguments.lanes ?? null,
      races: requestArguments.races ?? null,
      interrupts: requestArguments.interrupts ?? null,
    },
    result_payload_keys: Object.keys(record),
    failure_code: record.failure_code ?? record.code ?? record.reason_code ?? null,
    failure_reason: record.failure_reason ?? record.reason ?? record.message ?? null,
    typed_failure: record.typed_failure ?? null,
    summary: record.summary ?? null,
    verified_terminal_measurements: terminalMeasurements,
    workflow_events: workflowEvents,
    workflow_state: record.workflow_state ?? null,
    executed_action_count: measurements.executed_action_count ?? null,
    placement_prediction_count: measurements.placement_prediction_count ?? null,
    placement_action_success_count: measurements.placement_action_success_count ?? null,
    world_mutations_performed: measurements.world_mutations_performed ?? null,
    inventory_mutations_performed: measurements.inventory_mutations_performed ?? null,
    final_health: measurements.final_health ?? null,
  };
});

if (process.argv[3] === "compact") {
  console.log(`GUARDIAN_TURN_SUMMARY:${JSON.stringify({
    count: rows.length,
    rows: rows.map((row) => ({
      workflow_id: row.workflow_id,
      capability_id: row.capability_id,
      status: row.status,
      attempt_count: row.attempt_count,
      created_at: row.created_at,
      completed_at: row.completed_at,
      outcome: row.outcome,
      controls_released: row.controls_released,
      eligible_for_current_turn_reentry: row.eligible_for_current_turn_reentry,
      failure_code: row.failure_code,
      failure_reason: row.failure_reason,
      summary: row.summary,
      program_id: row.request_program.program_id,
      max_total_ticks: row.request_program.max_total_ticks,
      lane_count: Array.isArray(row.request_program.lanes) ? row.request_program.lanes.length : null,
      lane_ids: Array.isArray(row.request_program.lanes)
        ? row.request_program.lanes.map((lane) => asRecord(lane).lane_id ?? null)
        : [],
      terminal: {
        reason_code: row.verified_terminal_measurements.reason_code ?? null,
        tick_index: row.verified_terminal_measurements.tick_index ?? null,
        controls_released: row.verified_terminal_measurements.controls_released ?? null,
        executed_action_count: row.verified_terminal_measurements.executed_action_count ?? null,
        player_motion_performed: row.verified_terminal_measurements.player_motion_performed ?? null,
        player_interaction_performed: row.verified_terminal_measurements.player_interaction_performed ?? null,
        placement_prediction_count: row.verified_terminal_measurements.placement_prediction_count ?? null,
        placement_action_success_count: row.verified_terminal_measurements.placement_action_success_count ?? null,
        world_mutations_performed: row.verified_terminal_measurements.world_mutations_performed ?? null,
        inventory_mutations_performed: row.verified_terminal_measurements.inventory_mutations_performed ?? null,
        max_concurrent_lane_count: row.verified_terminal_measurements.max_concurrent_lane_count ?? null,
        parallel_tick_count: row.verified_terminal_measurements.parallel_tick_count ?? null,
        lanes: asArray(row.verified_terminal_measurements.lanes).map((lane) => {
          const entry = asRecord(lane);
          return {
            lane_id: entry.lane_id ?? null,
            lane_kind: entry.lane_kind ?? null,
            state: entry.state ?? null,
            node_id: entry.node_id ?? null,
            tick_index: entry.tick_index ?? null,
            iteration: entry.iteration ?? null,
            controls_released: entry.controls_released ?? null,
          };
        }),
        node_outcomes: asArray(row.verified_terminal_measurements.node_outcomes).map((outcome) => {
          const entry = asRecord(outcome);
          return {
            lane_id: entry.lane_id ?? null,
            node_id: entry.node_id ?? null,
            node_kind: entry.node_kind ?? null,
            outcome: entry.outcome ?? entry.status ?? null,
            reason_code: entry.reason_code ?? entry.failure_code ?? null,
            summary: entry.summary ?? entry.failure_reason ?? null,
            tick_index: entry.tick_index ?? null,
          };
        }),
        placement_predictions: asArray(row.verified_terminal_measurements.placement_predictions).map((prediction) => {
          const entry = asRecord(prediction);
          return {
            lane_id: entry.lane_id ?? null,
            node_id: entry.node_id ?? null,
            predicted_block: entry.predicted_block ?? entry.block_pos ?? null,
            collision_cell: entry.collision_cell ?? null,
            valid: entry.valid ?? entry.admitted ?? null,
            reason_code: entry.reason_code ?? entry.failure_code ?? null,
          };
        }),
        action_receipts: asArray(row.verified_terminal_measurements.action_receipts).map((receipt) => {
          const entry = asRecord(receipt);
          return {
            lane_id: entry.lane_id ?? null,
            node_id: entry.node_id ?? null,
            action_kind: entry.action_kind ?? entry.kind ?? null,
            status: entry.status ?? entry.outcome ?? null,
            reason_code: entry.reason_code ?? entry.failure_code ?? null,
          };
        }),
      },
      workflow_events: row.workflow_events,
    })),
  })}`);
} else {
  console.log(`GUARDIAN_TURN_SUMMARY:${JSON.stringify({ count: rows.length, rows })}`);
}

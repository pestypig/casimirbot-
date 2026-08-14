import { readFileSync } from "node:fs";
import { buildHelixCapabilityItineraryExecutionState } from "../server/services/helix-ask/capability-itinerary-execution";

const path = process.argv[2];
if (!path) throw new Error("ask_response_path_required");
const payload = JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
const artifacts = Array.isArray(payload.current_turn_artifact_ledger)
  ? payload.current_turn_artifact_ledger
  : [];
const state = buildHelixCapabilityItineraryExecutionState({
  capabilityItinerary: payload.capability_itinerary,
  artifacts,
});
console.log(JSON.stringify({
  complete: state.complete,
  missing_required_capabilities: state.missing_required_capabilities,
  missing_compound_subgoal_ids: state.missing_compound_subgoal_ids,
  missing_required_capability_any_of_groups:
    state.missing_required_capability_any_of_groups,
  compound_subgoal_ledger: state.compound_subgoal_ledger.map((entry) => ({
    subgoal_id: entry.subgoal_id,
    requested_capability: entry.requested_capability,
    satisfaction: entry.satisfaction,
    rail_status: entry.rail_status,
    rail_failure_code: entry.rail_failure_code,
    observation_ref: entry.observation_ref,
  })),
}, null, 2));

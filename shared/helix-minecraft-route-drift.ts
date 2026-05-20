import type { EvidenceSafety } from "./helix-minecraft-evidence.ts";
import { toolEvidenceSafety } from "./helix-minecraft-evidence.ts";

export const HELIX_MINECRAFT_ROUTE_DRIFT_EVENT_SCHEMA =
  "helix.minecraft_route_drift_event.v1" as const;

export type MinecraftRouteDriftEvent = EvidenceSafety & {
  schema: typeof HELIX_MINECRAFT_ROUTE_DRIFT_EVENT_SCHEMA;
  drift_event_id: string;
  route_rehearsal_id: string;
  room_id: string;
  world_id: string;
  actor_label?: string | null;
  current_position: { dimension: string; x: number; y: number; z: number };
  next_waypoint_label_code?: string | null;
  expected_direction?: string | null;
  observed_direction?: string | null;
  heading_error_degrees: number;
  distance_delta_blocks: number;
  sample_count: number;
  sample_window_ms: number;
  drift_status: "on_route" | "minor_drift" | "wrong_direction" | "unknown" | "stale_route";
  stale_reason?:
    | "objective_not_active"
    | "objective_closed"
    | "objective_stale"
    | "no_candidate_next_waypoint"
    | "dimension_mismatch"
    | "dimension_transition_observed"
    | null;
  salience_candidate: boolean;
  should_surface: false;
  evidence_refs: string[];
  normalized_by_deterministic_reducer: true;
  model_invoked_by_helix: false;
  ts: string;
};

export function createRouteDriftEvent(
  input: Omit<
    MinecraftRouteDriftEvent,
    | "schema"
    | keyof EvidenceSafety
    | "should_surface"
    | "normalized_by_deterministic_reducer"
    | "model_invoked_by_helix"
  >,
): MinecraftRouteDriftEvent {
  return {
    schema: HELIX_MINECRAFT_ROUTE_DRIFT_EVENT_SCHEMA,
    ...toolEvidenceSafety(),
    ...input,
    should_surface: false,
    normalized_by_deterministic_reducer: true,
    model_invoked_by_helix: false,
  };
}

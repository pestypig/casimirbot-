import type {
  EvidenceLayer,
  EvidenceSafety,
  EvidenceTrust,
} from "./helix-minecraft-evidence.ts";
import { toolEvidenceSafety } from "./helix-minecraft-evidence.ts";
import type { MinecraftRouteTargetType } from "./helix-minecraft-route-objective.ts";

export const HELIX_MINECRAFT_ROUTE_SOLVER_OBSERVATION_SCHEMA =
  "helix.minecraft_route_solver_observation.v1" as const;

export type HelixMinecraftRouteSolverProvider =
  | "helix_chunk_graph"
  | "server_chunk_snapshot"
  | "client_pathmind_observation"
  | "client_baritone_observation"
  | "manual_waypoint_graph"
  | "unknown";

export type HelixMinecraftRouteSolverObservation = EvidenceSafety & {
  schema: typeof HELIX_MINECRAFT_ROUTE_SOLVER_OBSERVATION_SCHEMA;
  observation_id: string;
  room_id: string;
  world_id: string;
  actor_label?: string | null;
  provider: HelixMinecraftRouteSolverProvider;
  evidence_layer: EvidenceLayer;
  evidence_trust: EvidenceTrust;
  from: {
    dimension: string;
    x: number;
    y?: number | null;
    z: number;
  };
  target: {
    label_code: string;
    dimension: string;
    x?: number | null;
    y?: number | null;
    z?: number | null;
    target_type: MinecraftRouteTargetType;
  };
  result_status:
    | "route_candidate_found"
    | "route_not_found"
    | "partial_route"
    | "not_enough_evidence"
    | "provider_unavailable"
    | "unknown";
  path_points?: Array<{
    dimension: string;
    x: number;
    y?: number | null;
    z: number;
    point_kind:
      | "start"
      | "waypoint"
      | "turn"
      | "bridge_segment"
      | "portal"
      | "target"
      | "unknown";
  }>;
  movement_requirements: Array<
    | "walk"
    | "jump"
    | "swim"
    | "bridge"
    | "dig"
    | "elytra"
    | "ender_pearl"
    | "portal_transition"
    | "unknown"
  >;
  risk_flags: Array<
    | "void_fall"
    | "lava"
    | "hostiles"
    | "low_light"
    | "water_crossing"
    | "unknown_terrain"
    | "unknown_gateway"
  >;
  route_cost?: number | null;
  provider_reported_confidence: number;
  helix_fused_confidence?: number | null;
  confidence_basis: Array<
    | "server_blocks"
    | "block_delta_overlay"
    | "seed_forecast"
    | "client_planner"
    | "route_math"
  >;
  missing_evidence_codes: Array<
    | "gateway_unconfirmed"
    | "chunk_unobserved"
    | "bridge_overlay_missing"
    | "requires_manual_action"
    | "home_binding_unknown"
    | "unknown"
  >;
  evidence_refs: string[];
  reported_by_provider: true;
  normalized_by_deterministic_reducer: true;
  model_invoked_by_helix: false;
  ts: string;
};

export function createRouteSolverObservation(
  input: Omit<
    HelixMinecraftRouteSolverObservation,
    | "schema"
    | keyof EvidenceSafety
    | "reported_by_provider"
    | "normalized_by_deterministic_reducer"
    | "model_invoked_by_helix"
  >,
): HelixMinecraftRouteSolverObservation {
  return {
    schema: HELIX_MINECRAFT_ROUTE_SOLVER_OBSERVATION_SCHEMA,
    ...toolEvidenceSafety(),
    ...input,
    reported_by_provider: true,
    normalized_by_deterministic_reducer: true,
    model_invoked_by_helix: false,
  };
}

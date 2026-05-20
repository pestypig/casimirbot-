import type { HelixMinecraftSeedMapClaim } from "./helix-minecraft-seed-map";
import type {
  HelixMinecraftEvidenceLayer,
  HelixMinecraftMissingEvidenceCode,
  HelixMinecraftRouteTargetType,
} from "./helix-minecraft-evidence";

export const HELIX_MINECRAFT_ROUTE_REHEARSAL_SCHEMA =
  "helix.minecraft_route_rehearsal.v1" as const;

export type HelixMinecraftRouteRisk = "low" | "medium" | "high" | "unknown";

export type HelixMinecraftRouteRequirement =
  | "walk"
  | "dig"
  | "bridge"
  | "swim"
  | "unknown";

export type HelixMinecraftRouteRehearsalStep = {
  label: string;
  direction?: string | null;
  distance_blocks?: number | null;
  risk: HelixMinecraftRouteRisk;
  requirement?: HelixMinecraftRouteRequirement | null;
};

export type HelixMinecraftRouteKind =
  | "return_home_from_end"
  | "single_dimension_waypoint"
  | "structure_seek"
  | "unknown";

export type HelixMinecraftRouteStage = {
  stage_id: string;
  label: string;
  from_dimension: string;
  to_dimension: string;
  from?: { x?: number | null; y?: number | null; z?: number | null };
  to?: { x?: number | null; y?: number | null; z?: number | null };
  target_type: HelixMinecraftRouteTargetType;
  route_basis: Array<
    | "observed_current_world"
    | "persisted_block_delta_overlay"
    | "seed_forecast"
    | "transcript_intent"
  >;
  reachable_confidence: number;
  risk: HelixMinecraftRouteRisk;
  missing_evidence: string[];
  missing_evidence_codes?: HelixMinecraftMissingEvidenceCode[];
};

export type HelixMinecraftCandidateNextWaypoint = {
  label: string;
  dimension: string;
  x?: number | null;
  y?: number | null;
  z?: number | null;
  expected_direction?: string | null;
  confidence: number;
  display_label_scope?: "ui_only";
  ask_context_admissible?: false;
};

export type HelixMinecraftRouteRehearsal = {
  schema: typeof HELIX_MINECRAFT_ROUTE_REHEARSAL_SCHEMA;
  rehearsal_id: string;
  room_id: string;
  world_id: string;
  actor_label?: string | null;
  evidence_trust: "route_math";
  instruction_authority: "none";
  ask_context_policy: "evidence_only";
  creates_ask_turn: false;
  turn_triggered: false;
  ask_instruction_authority: "none";
  context_role: "tool_evidence";
  objective_id: string;
  route_kind: HelixMinecraftRouteKind;
  from: { dimension: string; x: number; y?: number | null; z: number };
  stages: HelixMinecraftRouteStage[];
  candidate_next_waypoint?: HelixMinecraftCandidateNextWaypoint | null;
  route_confidence: number;
  raw_user_text_included: false;
  derived_by_deterministic_reducer: true;
  normalized_by_deterministic_reducer: true;
  model_invoked_by_helix: false;
  ts: string;
  route_basis?: HelixMinecraftEvidenceLayer[];
  provider_confidence?: number | null;
  helix_fused_confidence?: number | null;
  confidence_basis?: Array<"server_blocks" | "block_delta_overlay" | "seed_forecast" | "client_planner" | "route_math">;
  missing_evidence_codes?: HelixMinecraftMissingEvidenceCode[];
  route_summary_scope?: "ui_candidate_only";
  ask_context_admissible?: false;
  /**
   * Deprecated compatibility fields. Reducers must treat these as evidence
   * summaries, not answer policy or user-facing recommendations.
   */
  to: { x: number; y?: number | null; z: number };
  target_label: string;
  target_claim?: HelixMinecraftSeedMapClaim | null;
  route_summary: string;
  steps: HelixMinecraftRouteRehearsalStep[];
  reachable_confidence: number;
  missing_evidence: string[];
  evidence_refs: string[];
  deterministic: true;
  model_invoked: false;
  raw_logs_included: false;
  context_policy: "compact_context_pack_only";
};

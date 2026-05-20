export type HelixMinecraftEvidenceTrust =
  | "server_observation"
  | "player_transcript"
  | "model_summary"
  | "client_cache"
  | "client_planner_observation"
  | "seed_forecast"
  | "persisted_overlay"
  | "route_math";

export type HelixMinecraftInstructionAuthority = "none";

export type HelixMinecraftAskContextPolicy =
  | "evidence_only"
  | "ui_candidate_only"
  | "not_admissible";

export type HelixMinecraftEvidenceLayer =
  | "observed_current_world"
  | "persisted_block_delta_overlay"
  | "seed_forecast"
  | "client_route_planner_observation"
  | "route_math"
  | "transcript_intent"
  | "model_interpretation";

export type HelixMinecraftContextRole = "tool_evidence";

export type HelixMinecraftMissingEvidenceCode =
  | "gateway_unconfirmed"
  | "chunk_unobserved"
  | "bridge_overlay_missing"
  | "requires_manual_action"
  | "target_y_unknown"
  | "route_corridor_unobserved"
  | "provider_report_unverified"
  | "server_observation_missing"
  | "unknown";

export type HelixMinecraftConfidenceBasis =
  | "server_blocks"
  | "block_delta_overlay"
  | "seed_forecast"
  | "client_planner"
  | "route_math";

export type HelixMinecraftTurnIsolation = {
  creates_ask_turn: false;
  turn_triggered: false;
  ask_instruction_authority: "none";
  context_role: "tool_evidence";
};

export type HelixMinecraftEvidenceProvenance = {
  evidence_trust: HelixMinecraftEvidenceTrust;
  instruction_authority: HelixMinecraftInstructionAuthority;
  ask_context_policy: HelixMinecraftAskContextPolicy;
  raw_user_text_included: false;
  derived_by_deterministic_reducer: boolean;
  model_invoked: boolean;
};

export const HELIX_MINECRAFT_WORLD_DELTA_OVERLAY_SCHEMA =
  "helix.minecraft_world_delta_overlay.v1" as const;

export const HELIX_MINECRAFT_CHUNK_SNAPSHOT_SAMPLE_SCHEMA =
  "helix.minecraft_chunk_snapshot_sample.v1" as const;

export const HELIX_MINECRAFT_ROUTE_OBJECTIVE_SCHEMA =
  "helix.minecraft_route_objective.v1" as const;

export const HELIX_MINECRAFT_ROUTE_DRIFT_EVENT_SCHEMA =
  "helix.minecraft_route_drift_event.v1" as const;

export const HELIX_MINECRAFT_ROUTE_SOLVER_OBSERVATION_SCHEMA =
  "helix.minecraft_route_solver_observation.v1" as const;

export const HELIX_MINECRAFT_NAVIGATION_STATE_SCHEMA =
  "helix.minecraft_navigation_state.v1" as const;

export const HELIX_MINECRAFT_NAVIGATION_STATE_QUERY_RESULT_SCHEMA =
  "helix.minecraft_navigation_state_query_result.v1" as const;

export type HelixMinecraftWorldDeltaOverlay = {
  schema: typeof HELIX_MINECRAFT_WORLD_DELTA_OVERLAY_SCHEMA;
  overlay_id: string;
  room_id: string;
  world_id: string;
  dimension: string;
  evidence_layer: "persisted_block_delta_overlay";
  evidence_trust: "persisted_overlay";
  instruction_authority: "none";
  ask_context_policy: "evidence_only";
  chunk: { x: number; z: number };
  block_deltas: Array<{
    x: number;
    y: number;
    z: number;
    before?: string | null;
    after: string;
    actor_id?: string | null;
    actor_label?: string | null;
    ts: string;
    traversal_hint:
      | "walkable_added"
      | "walkable_removed"
      | "barrier_added"
      | "hazard_added"
      | "unknown";
  }>;
  evidence_refs: string[];
  creates_ask_turn: false;
  turn_triggered: false;
  ask_instruction_authority: "none";
  context_role: "tool_evidence";
  raw_user_text_included: false;
  derived_by_deterministic_reducer: true;
  model_invoked: false;
  ts: string;
};

export type HelixMinecraftChunkSnapshotSample = {
  schema: typeof HELIX_MINECRAFT_CHUNK_SNAPSHOT_SAMPLE_SCHEMA;
  sample_id: string;
  room_id: string;
  world_id: string;
  dimension: string;
  evidence_layer: "observed_current_world";
  evidence_trust: "server_observation";
  instruction_authority: "none";
  ask_context_policy: "evidence_only";
  chunk: { x: number; z: number };
  sampled_radius_chunks: number;
  surface_cells: Array<{
    x: number;
    y: number;
    z: number;
    block_type: string;
    walkable: boolean;
    hazard?: "void_edge" | "lava" | "fall" | "hostile" | "unknown" | null;
  }>;
  gateway_blocks?: Array<{ x: number; y: number; z: number }>;
  bridge_like_blocks?: Array<{ x: number; y: number; z: number; block_type: string }>;
  missing_evidence: string[];
  evidence_refs: string[];
  creates_ask_turn: false;
  turn_triggered: false;
  ask_instruction_authority: "none";
  context_role: "tool_evidence";
  raw_logs_included: false;
  raw_user_text_included: false;
  derived_by_deterministic_reducer: true;
  model_invoked: false;
  ts: string;
};

export type HelixMinecraftRouteObjectiveIntent =
  | "return_home_from_end"
  | "go_to_waypoint"
  | "find_gateway"
  | "return_to_spawn"
  | "custom";

export type HelixMinecraftRouteTargetType =
  | "end_gateway"
  | "exit_portal"
  | "respawn_location"
  | "home_waypoint"
  | "structure_candidate"
  | "waypoint"
  | "unknown";

export type HelixMinecraftRouteObjective = {
  schema: typeof HELIX_MINECRAFT_ROUTE_OBJECTIVE_SCHEMA;
  objective_id: string;
  room_id: string;
  world_id: string;
  actor_label?: string | null;
  evidence_layer: "transcript_intent";
  evidence_trust: "player_transcript";
  instruction_authority: "none";
  ask_context_policy: "evidence_only";
  intent_label: HelixMinecraftRouteObjectiveIntent;
  source: "voice_intent" | "manual_waypoint" | "world_event" | "model_hypothesis";
  authority: "none";
  requires_external_evidence: boolean;
  transcript_mode: "ambient" | "direct_address" | "manual";
  creates_ask_turn: false;
  turn_triggered: false;
  ask_instruction_authority: "none";
  context_role: "tool_evidence";
  direct_address_detected: boolean;
  salience_candidate: boolean;
  target_chain: Array<{
    label: string;
    dimension: string;
    x?: number | null;
    y?: number | null;
    z?: number | null;
    target_type: HelixMinecraftRouteTargetType;
    evidence_layer: HelixMinecraftEvidenceLayer;
    confidence: number;
  }>;
  confidence: number;
  missing_evidence: string[];
  evidence_refs: string[];
  missing_evidence_codes: HelixMinecraftMissingEvidenceCode[];
  raw_user_text_included: false;
  derived_by_deterministic_reducer: boolean;
  model_invoked: boolean;
  ts: string;
};

export type HelixMinecraftRouteDriftEvent = {
  schema: typeof HELIX_MINECRAFT_ROUTE_DRIFT_EVENT_SCHEMA;
  drift_event_id: string;
  room_id: string;
  world_id: string;
  route_rehearsal_id: string;
  actor_label?: string | null;
  evidence_trust: "route_math";
  instruction_authority: "none";
  ask_context_policy: "evidence_only";
  creates_ask_turn: false;
  turn_triggered: false;
  ask_instruction_authority: "none";
  context_role: "tool_evidence";
  current_position: { dimension: string; x: number; y: number; z: number };
  next_waypoint_label: string;
  expected_direction: string;
  observed_direction: string;
  heading_error_degrees: number;
  distance_delta_blocks: number;
  sample_count: number;
  sample_window_ms: number;
  drift_status: "on_route" | "minor_drift" | "wrong_direction" | "unknown";
  salience_candidate: boolean;
  policy_surface_status:
    | "not_candidate"
    | "candidate_pending_gate"
    | "approved"
    | "suppressed"
    | "unknown";
  salience_reason?:
    | "distance_increasing"
    | "heading_opposes_route"
    | "route_stage_regression"
    | "unknown"
    | null;
  blocking_context?: {
    in_combat?: boolean;
    falling?: boolean;
    bridging?: boolean;
    swimming?: boolean;
    inventory_blocked?: boolean;
  } | null;
  evidence_refs: string[];
  missing_evidence_codes: HelixMinecraftMissingEvidenceCode[];
  raw_logs_included: false;
  raw_user_text_included: false;
  derived_by_deterministic_reducer: true;
  model_invoked: false;
  ts: string;
};

export type HelixMinecraftRouteSolverProvider =
  | "helix_chunk_graph"
  | "server_chunk_snapshot"
  | "client_pathmind_observation"
  | "client_baritone_observation"
  | "manual_waypoint_graph"
  | "unknown";

export type HelixMinecraftRouteSolverResultStatus =
  | "route_candidate_found"
  | "route_to_goal_found"
  | "route_not_found"
  | "route_canceled"
  | "route_exception"
  | "partial_route"
  | "movement_unreachable_after_world_change"
  | "not_enough_evidence"
  | "provider_unavailable"
  | "unknown";

export type HelixMinecraftRouteSolverMovementRequirement =
  | "walk"
  | "jump"
  | "swim"
  | "bridge"
  | "dig"
  | "ascend"
  | "descend"
  | "elytra"
  | "ender_pearl"
  | "portal_transition"
  | "unknown";

export type HelixMinecraftRouteSolverRiskFlag =
  | "void_fall"
  | "lava"
  | "hostiles"
  | "low_light"
  | "water_crossing"
  | "unknown_terrain"
  | "unknown_gateway";

export type HelixMinecraftPlannerObservationMode =
  | "passive_runtime_state"
  | "path_preview"
  | "calculation_result"
  | "movement_status"
  | "path_event"
  | "unknown";

export type HelixMinecraftPlannerExecutionState =
  | "not_executing"
  | "planning_only"
  | "executing"
  | "paused"
  | "completed"
  | "failed"
  | "unknown";

export type HelixMinecraftPlannerSideEffectRisk =
  | "none_observation_only"
  | "possible_client_motion"
  | "active_client_motion"
  | "unknown";

export type HelixMinecraftPlannerExecutionLayer =
  | "pathmind_native"
  | "pathmind_baritone_node"
  | "baritone_api"
  | "helix_internal"
  | "unknown";

export type HelixMinecraftPlannerWorldStateDependency =
  | "server_observed"
  | "client_loaded_chunks"
  | "client_cache"
  | "seed_forecast"
  | "mixed";

export type HelixMinecraftBaritonePathKind =
  | "current_execution_path"
  | "best_path_so_far"
  | "most_recent_node_path"
  | "none";

export type HelixMinecraftRouteSolverObservation = {
  schema: typeof HELIX_MINECRAFT_ROUTE_SOLVER_OBSERVATION_SCHEMA;
  observation_id: string;
  room_id: string;
  world_id: string;
  actor_label?: string | null;
  provider: HelixMinecraftRouteSolverProvider;
  nested_provider?: "client_baritone_observation" | null;
  planner_execution_layer?: HelixMinecraftPlannerExecutionLayer;
  evidence_layer:
    | "observed_current_world"
    | "persisted_block_delta_overlay"
    | "seed_forecast"
    | "client_route_planner_observation"
    | "route_math";
  evidence_trust:
    | "server_observation"
    | "client_cache"
    | "client_planner_observation"
    | "seed_forecast"
    | "route_math";
  instruction_authority: "none";
  ask_context_policy: "evidence_only";
  creates_ask_turn: false;
  turn_triggered: false;
  ask_instruction_authority: "none";
  context_role: "tool_evidence";
  raw_user_text_included: false;
  from: { dimension: string; x: number; y?: number | null; z: number };
  target: {
    display_label?: string | null;
    display_label_scope?: "ui_only";
    ask_context_admissible: false;
    dimension: string;
    x?: number | null;
    y?: number | null;
    z?: number | null;
    target_type: HelixMinecraftRouteTargetType;
  };
  result_status: HelixMinecraftRouteSolverResultStatus;
  planner_observation_mode: HelixMinecraftPlannerObservationMode;
  planner_execution_state: HelixMinecraftPlannerExecutionState;
  planner_side_effect_risk: HelixMinecraftPlannerSideEffectRisk;
  world_state_dependency: HelixMinecraftPlannerWorldStateDependency;
  baritone_path_state?: {
    has_goal: boolean;
    is_pathing: boolean;
    has_current_path: boolean;
    has_in_progress_finder: boolean;
    estimated_ticks_to_goal?: number | null;
    estimated_ticks_remaining_in_segment?: number | null;
    path_kind: HelixMinecraftBaritonePathKind;
  } | null;
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
  movement_segments?: Array<{
    src: { x: number; y: number; z: number };
    dest: { x: number; y: number; z: number };
    provider_cost?: number | null;
    calculated_while_loaded?: boolean | null;
    inferred_requirement: Extract<
      HelixMinecraftRouteSolverMovementRequirement,
      "walk" | "jump" | "ascend" | "descend" | "bridge" | "dig" | "unknown"
    >;
  }>;
  movement_requirements: HelixMinecraftRouteSolverMovementRequirement[];
  risk_flags: HelixMinecraftRouteSolverRiskFlag[];
  route_cost?: number | null;
  provider_confidence: number;
  helix_fused_confidence?: number | null;
  confidence_basis: HelixMinecraftConfidenceBasis[];
  missing_evidence_codes: HelixMinecraftMissingEvidenceCode[];
  missing_evidence: string[];
  evidence_refs: string[];
  reported_by_provider: boolean;
  normalized_by_deterministic_reducer: true;
  model_invoked_by_helix: false;
  ts: string;
};

export type HelixMinecraftNavigationState = {
  schema: typeof HELIX_MINECRAFT_NAVIGATION_STATE_SCHEMA;
  state_id: string;
  room_id: string;
  world_id: string;
  actor_label?: string | null;
  latest_objective_id?: string | null;
  latest_rehearsal_id?: string | null;
  latest_drift_event_id?: string | null;
  current_position?: {
    dimension: string;
    x: number;
    y?: number | null;
    z: number;
  } | null;
  route_status:
    | "no_objective"
    | "objective_detected"
    | "rehearsal_ready"
    | "on_route"
    | "minor_drift"
    | "wrong_direction_candidate"
    | "policy_approved_surface"
    | "blocked"
    | "unknown";
  policy_surface_status:
    | "not_candidate"
    | "candidate_pending_gate"
    | "approved"
    | "suppressed"
    | "unknown";
  provider_observation_refs: string[];
  route_rehearsal_refs: string[];
  route_drift_refs: string[];
  evidence_refs: string[];
  missing_evidence: string[];
  instruction_authority: "none";
  ask_instruction_authority: "none";
  ask_context_policy: "evidence_only";
  context_role: "tool_evidence";
  creates_ask_turn: false;
  turn_triggered: false;
  assistant_answer: false;
  raw_content_included: false;
  raw_user_text_included: false;
  updated_at: string;
};

export type HelixMinecraftNavigationStateQueryResult = {
  schema: typeof HELIX_MINECRAFT_NAVIGATION_STATE_QUERY_RESULT_SCHEMA;
  ok: boolean;
  room_id?: string | null;
  world_id?: string | null;
  actor_label?: string | null;
  navigation_state?: HelixMinecraftNavigationState | null;
  latest_objective?: HelixMinecraftRouteObjective | null;
  latest_rehearsal?: import("./helix-minecraft-route-rehearsal").HelixMinecraftRouteRehearsal | null;
  latest_drift?: HelixMinecraftRouteDriftEvent | null;
  latest_solver_observations: HelixMinecraftRouteSolverObservation[];
  evidence_layers_present: Array<
    | "observed_current_world"
    | "persisted_block_delta_overlay"
    | "seed_forecast"
    | "transcript_intent"
    | "client_planner_observation"
    | "route_math"
    | "model_hypothesis"
  >;
  missing_evidence: string[];
  assistant_answer: false;
  raw_content_included: false;
  raw_user_text_included: false;
  context_role: "tool_evidence";
  ask_context_policy: "evidence_only";
};

// Compatibility exports for live-scenario safety reducers ported from the Codex patch workspace.
export type {
  AskContextPolicy,
  AskInstructionAuthority,
  InstructionAuthority,
  LiveEvidenceLayer as EvidenceLayer,
  LiveEvidenceTrust as EvidenceTrust,
  LiveScenarioSafetyEnvelope,
} from "./helix-live-scenario-evidence.ts";

import type {
  AskContextPolicy,
  InstructionAuthority,
  LiveScenarioContextRole,
} from "./helix-live-scenario-evidence.ts";

export type ContextRole = LiveScenarioContextRole | "ui_summary";

export type NaturalLanguageScope =
  | "ui_summary_only"
  | "operator_summary_only";

export type EvidenceSafety = {
  context_role: ContextRole;
  instruction_authority: InstructionAuthority;
  ask_instruction_authority: InstructionAuthority;
  ask_context_policy: AskContextPolicy;
  creates_ask_turn: false;
  turn_triggered: false;
  raw_user_text_included?: false;
  raw_transcript_included?: false;
  raw_image_included?: false;
  raw_caption_included?: false;
  natural_language_scope?: NaturalLanguageScope;
  ask_admissible: boolean;
};

export const TOOL_EVIDENCE_SAFETY: EvidenceSafety = Object.freeze({
  context_role: "tool_evidence",
  instruction_authority: "none",
  ask_instruction_authority: "none",
  ask_context_policy: "evidence_only",
  creates_ask_turn: false,
  turn_triggered: false,
  raw_user_text_included: false,
  raw_transcript_included: false,
  raw_image_included: false,
  raw_caption_included: false,
  ask_admissible: true,
});

export function toolEvidenceSafety(
  overrides: Partial<EvidenceSafety> = {},
): EvidenceSafety {
  return {
    ...TOOL_EVIDENCE_SAFETY,
    ...overrides,
    instruction_authority: "none",
    ask_instruction_authority: "none",
    creates_ask_turn: false,
    turn_triggered: false,
  };
}

export function isAskAdmissibleEvidence(value: unknown): value is EvidenceSafety {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<EvidenceSafety>;
  return (
    candidate.ask_admissible === true &&
    candidate.instruction_authority === "none" &&
    candidate.ask_instruction_authority === "none" &&
    candidate.creates_ask_turn === false &&
    candidate.turn_triggered === false &&
    candidate.natural_language_scope === undefined &&
    candidate.ask_context_policy !== "not_admissible"
  );
}

export function assertEvidenceHasNoInstructionAuthority(value: unknown): void {
  if (!value || typeof value !== "object") {
    throw new Error("Evidence item must be an object.");
  }

  const candidate = value as Partial<EvidenceSafety>;
  if (candidate.instruction_authority !== "none") {
    throw new Error("Evidence item has non-none instruction_authority.");
  }
  if (candidate.ask_instruction_authority !== "none") {
    throw new Error("Evidence item has non-none ask_instruction_authority.");
  }
  if (candidate.creates_ask_turn !== false) {
    throw new Error("Evidence item may create an Ask turn.");
  }
  if (candidate.turn_triggered !== false) {
    throw new Error("Evidence item was turn-triggered.");
  }
}

export function makeId(prefix: string, seed: string | number): string {
  return `${prefix}_${String(seed).replace(/[^a-zA-Z0-9_-]/g, "_")}`;
}

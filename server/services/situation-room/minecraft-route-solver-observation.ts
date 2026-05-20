import crypto from "node:crypto";
import {
  HELIX_MINECRAFT_ROUTE_SOLVER_OBSERVATION_SCHEMA,
  type HelixMinecraftConfidenceBasis,
  type HelixMinecraftEvidenceLayer,
  type HelixMinecraftEvidenceTrust,
  type HelixMinecraftMissingEvidenceCode,
  type HelixMinecraftPlannerExecutionLayer,
  type HelixMinecraftPlannerExecutionState,
  type HelixMinecraftPlannerObservationMode,
  type HelixMinecraftPlannerSideEffectRisk,
  type HelixMinecraftPlannerWorldStateDependency,
  type HelixMinecraftRouteSolverObservation,
  type HelixMinecraftRouteSolverProvider,
  type HelixMinecraftRouteSolverResultStatus,
} from "@shared/helix-minecraft-evidence";

const stableJson = (value: unknown): string => JSON.stringify(value);
const hashShort = (value: unknown, size = 12): string =>
  crypto.createHash("sha256").update(stableJson(value)).digest("hex").slice(0, size);

const clamp = (value: number): number => Math.max(0, Math.min(1, value));

const evidenceLayerForProvider = (provider: HelixMinecraftRouteSolverProvider): HelixMinecraftEvidenceLayer => {
  if (provider === "client_pathmind_observation" || provider === "client_baritone_observation") {
    return "client_route_planner_observation";
  }
  if (provider === "server_chunk_snapshot") return "observed_current_world";
  if (provider === "manual_waypoint_graph") return "transcript_intent";
  return "route_math";
};

const evidenceTrustForProvider = (provider: HelixMinecraftRouteSolverProvider): HelixMinecraftEvidenceTrust => {
  if (provider === "client_pathmind_observation" || provider === "client_baritone_observation") {
    return "client_planner_observation";
  }
  if (provider === "server_chunk_snapshot") return "server_observation";
  return "route_math";
};

const confidenceBasisForProvider = (provider: HelixMinecraftRouteSolverProvider): HelixMinecraftConfidenceBasis[] => {
  if (provider === "client_pathmind_observation" || provider === "client_baritone_observation") return ["client_planner"];
  if (provider === "server_chunk_snapshot") return ["server_blocks"];
  if (provider === "manual_waypoint_graph") return ["route_math"];
  return ["route_math"];
};

export function normalizeMinecraftRouteSolverObservation(input: {
  roomId: string;
  worldId: string;
  actorLabel?: string | null;
  provider: HelixMinecraftRouteSolverProvider;
  nestedProvider?: HelixMinecraftRouteSolverObservation["nested_provider"];
  plannerExecutionLayer?: HelixMinecraftPlannerExecutionLayer;
  from: HelixMinecraftRouteSolverObservation["from"];
  target: Omit<HelixMinecraftRouteSolverObservation["target"], "display_label_scope" | "ask_context_admissible">;
  resultStatus: HelixMinecraftRouteSolverResultStatus;
  plannerObservationMode?: HelixMinecraftPlannerObservationMode;
  plannerExecutionState?: HelixMinecraftPlannerExecutionState;
  plannerSideEffectRisk?: HelixMinecraftPlannerSideEffectRisk;
  worldStateDependency?: HelixMinecraftPlannerWorldStateDependency;
  baritonePathState?: HelixMinecraftRouteSolverObservation["baritone_path_state"];
  pathPoints?: HelixMinecraftRouteSolverObservation["path_points"];
  movementSegments?: HelixMinecraftRouteSolverObservation["movement_segments"];
  movementRequirements?: HelixMinecraftRouteSolverObservation["movement_requirements"];
  riskFlags?: HelixMinecraftRouteSolverObservation["risk_flags"];
  routeCost?: number | null;
  providerConfidence?: number;
  missingEvidenceCodes?: HelixMinecraftMissingEvidenceCode[];
  evidenceRefs?: string[];
  ts: string;
}): HelixMinecraftRouteSolverObservation {
  const providerConfidence = clamp(input.providerConfidence ?? 0.5);
  const evidenceLayer = evidenceLayerForProvider(input.provider);
  return {
    schema: HELIX_MINECRAFT_ROUTE_SOLVER_OBSERVATION_SCHEMA,
    observation_id: `minecraft_route_solver_observation:${hashShort([
      input.roomId,
      input.worldId,
      input.provider,
      input.from,
      input.target,
      input.resultStatus,
      input.ts,
    ], 18)}`,
    room_id: input.roomId,
    world_id: input.worldId,
    actor_label: input.actorLabel ?? null,
    provider: input.provider,
    nested_provider: input.nestedProvider ?? null,
    planner_execution_layer: input.plannerExecutionLayer ?? (input.provider === "client_baritone_observation" ? "baritone_api" : "unknown"),
    evidence_layer: evidenceLayer as HelixMinecraftRouteSolverObservation["evidence_layer"],
    evidence_trust: evidenceTrustForProvider(input.provider) as HelixMinecraftRouteSolverObservation["evidence_trust"],
    instruction_authority: "none",
    ask_context_policy: "evidence_only",
    creates_ask_turn: false,
    turn_triggered: false,
    ask_instruction_authority: "none",
    context_role: "tool_evidence",
    raw_user_text_included: false,
    from: input.from,
    target: {
      ...input.target,
      display_label_scope: input.target.display_label ? "ui_only" : undefined,
      ask_context_admissible: false,
    },
    result_status: input.resultStatus,
    planner_observation_mode: input.plannerObservationMode ?? "unknown",
    planner_execution_state: input.plannerExecutionState ?? "unknown",
    planner_side_effect_risk: input.plannerSideEffectRisk ?? "unknown",
    world_state_dependency: input.worldStateDependency ?? (input.provider.startsWith("client_") ? "client_cache" : "mixed"),
    baritone_path_state: input.baritonePathState ?? null,
    path_points: input.pathPoints,
    movement_segments: input.movementSegments,
    movement_requirements: input.movementRequirements ?? ["unknown"],
    risk_flags: input.riskFlags ?? ["unknown_terrain"],
    route_cost: input.routeCost ?? null,
    provider_confidence: providerConfidence,
    helix_fused_confidence: null,
    confidence_basis: confidenceBasisForProvider(input.provider),
    missing_evidence_codes: input.missingEvidenceCodes ?? ["provider_report_unverified"],
    missing_evidence: [],
    evidence_refs: input.evidenceRefs ?? [],
    reported_by_provider: input.provider === "client_pathmind_observation" || input.provider === "client_baritone_observation",
    normalized_by_deterministic_reducer: true,
    model_invoked_by_helix: false,
    ts: input.ts,
  };
}

import type {
  HelixMinecraftBaritonePathKind,
  HelixMinecraftPlannerExecutionLayer,
  HelixMinecraftPlannerExecutionState,
  HelixMinecraftPlannerObservationMode,
  HelixMinecraftPlannerSideEffectRisk,
  HelixMinecraftPlannerWorldStateDependency,
  HelixMinecraftRouteSolverMovementRequirement,
  HelixMinecraftRouteSolverObservation,
  HelixMinecraftRouteSolverProvider,
  HelixMinecraftRouteSolverResultStatus,
  HelixMinecraftRouteSolverRiskFlag,
} from "@shared/helix-minecraft-evidence";
import { normalizeMinecraftRouteSolverObservation } from "./minecraft-route-solver-observation";

export const routeSolverObservationAdapterCapabilities = [
  "observe_path_state",
] as const;

export type BaritoneCalculationType =
  | "SUCCESS_TO_GOAL"
  | "SUCCESS_SEGMENT"
  | "FAILURE"
  | "CANCELLATION"
  | "EXCEPTION";

export type BaritoneMovementStatus =
  | "PREPPING"
  | "WAITING"
  | "RUNNING"
  | "SUCCESS"
  | "UNREACHABLE"
  | "FAILED"
  | "CANCELED";

export type PlannerObservationInput = {
  roomId: string;
  worldId: string;
  actorLabel?: string | null;
  dimension?: string;
  from?: HelixMinecraftRouteSolverObservation["from"];
  target?: Omit<HelixMinecraftRouteSolverObservation["target"], "display_label_scope" | "ask_context_admissible">;
  evidenceRefs?: string[];
  ts: string;
} & (
  | {
      provider: "client_baritone_observation";
      baritone?: {
        path_event?: string | null;
        calculation_type?: string | null;
        movement_status?: string | null;
        has_goal?: boolean | null;
        is_pathing?: boolean | null;
        has_current_path?: boolean | null;
        has_in_progress_finder?: boolean | null;
        estimated_ticks_to_goal?: number | null;
        estimated_ticks_remaining_in_segment?: number | null;
        path_kind?: HelixMinecraftBaritonePathKind | null;
        positions?: Array<{ x: number; y?: number | null; z: number }>;
        movements?: Array<{
          src: { x: number; y: number; z: number };
          dest: { x: number; y: number; z: number };
          cost?: number | null;
          calculated_while_loaded?: boolean | null;
        }>;
      };
    }
  | {
      provider: "client_pathmind_observation";
      pathmind?: {
        workflow_id?: string | null;
        node_id?: string | null;
        node_kind?: string | null;
        runtime_state?: string | null;
        path_preview_available?: boolean | null;
        execution_requested?: boolean | null;
        execution_active?: boolean | null;
        nested_provider?: "client_baritone_observation" | null;
      };
    }
);

export const mapBaritoneCalculationType = (
  type: BaritoneCalculationType,
): HelixMinecraftRouteSolverResultStatus => {
  switch (type) {
    case "SUCCESS_TO_GOAL":
      return "route_to_goal_found";
    case "SUCCESS_SEGMENT":
      return "partial_route";
    case "FAILURE":
      return "route_not_found";
    case "CANCELLATION":
      return "route_canceled";
    case "EXCEPTION":
      return "route_exception";
  }
};

export const mapBaritoneMovementStatus = (
  status: BaritoneMovementStatus,
): HelixMinecraftRouteSolverResultStatus => {
  switch (status) {
    case "PREPPING":
    case "WAITING":
    case "RUNNING":
      return "route_candidate_found";
    case "SUCCESS":
      return "route_to_goal_found";
    case "UNREACHABLE":
      return "movement_unreachable_after_world_change";
    case "FAILED":
      return "route_not_found";
    case "CANCELED":
      return "route_canceled";
  }
};

const isBaritoneCalculationType = (value: string | null | undefined): value is BaritoneCalculationType =>
  value === "SUCCESS_TO_GOAL" ||
  value === "SUCCESS_SEGMENT" ||
  value === "FAILURE" ||
  value === "CANCELLATION" ||
  value === "EXCEPTION";

const isBaritoneMovementStatus = (value: string | null | undefined): value is BaritoneMovementStatus =>
  value === "PREPPING" ||
  value === "WAITING" ||
  value === "RUNNING" ||
  value === "SUCCESS" ||
  value === "UNREACHABLE" ||
  value === "FAILED" ||
  value === "CANCELED";

const defaultFrom = (input: PlannerObservationInput): HelixMinecraftRouteSolverObservation["from"] =>
  input.from ?? {
    dimension: input.dimension ?? input.target?.dimension ?? "minecraft:overworld",
    x: 0,
    y: null,
    z: 0,
  };

const defaultTarget = (input: PlannerObservationInput): Omit<HelixMinecraftRouteSolverObservation["target"], "display_label_scope" | "ask_context_admissible"> =>
  input.target ?? {
    dimension: input.dimension ?? input.from?.dimension ?? "minecraft:overworld",
    target_type: "unknown",
  };

const pathPointsFor = (
  dimension: string,
  positions?: Array<{ x: number; y?: number | null; z: number }>,
): HelixMinecraftRouteSolverObservation["path_points"] | undefined => {
  if (!positions?.length) return undefined;
  return positions.map((position, index) => ({
    dimension,
    x: position.x,
    y: position.y ?? null,
    z: position.z,
    point_kind: index === 0
      ? "start" as const
      : index === positions.length - 1
        ? "target" as const
        : "waypoint" as const,
  }));
};

const movementRequirementForSegment = (
  movement: { src: { y: number }; dest: { y: number } },
): Extract<HelixMinecraftRouteSolverMovementRequirement, "walk" | "jump" | "ascend" | "descend" | "bridge" | "dig" | "unknown"> => {
  if (movement.dest.y > movement.src.y) return "ascend";
  if (movement.dest.y < movement.src.y) return "descend";
  return "walk";
};

const pathmindMode = (pathmind: NonNullable<Extract<PlannerObservationInput, { provider: "client_pathmind_observation" }>["pathmind"]>): HelixMinecraftPlannerObservationMode => {
  if (pathmind.path_preview_available) return "path_preview";
  return "passive_runtime_state";
};

const pathmindExecutionState = (pathmind: NonNullable<Extract<PlannerObservationInput, { provider: "client_pathmind_observation" }>["pathmind"]>): HelixMinecraftPlannerExecutionState => {
  if (pathmind.execution_active) return "executing";
  if (pathmind.runtime_state === "planning" || pathmind.runtime_state === "path_candidate") return "planning_only";
  if (pathmind.runtime_state === "completed") return "completed";
  if (pathmind.runtime_state === "failed" || pathmind.runtime_state === "blocked") return "failed";
  return "not_executing";
};

const pathmindSideEffectRisk = (pathmind: NonNullable<Extract<PlannerObservationInput, { provider: "client_pathmind_observation" }>["pathmind"]>): HelixMinecraftPlannerSideEffectRisk => {
  if (pathmind.execution_active) return "active_client_motion";
  if (pathmind.execution_requested) return "possible_client_motion";
  return "none_observation_only";
};

const baritoneMode = (baritone: NonNullable<Extract<PlannerObservationInput, { provider: "client_baritone_observation" }>["baritone"]>): HelixMinecraftPlannerObservationMode => {
  if (isBaritoneCalculationType(baritone.calculation_type)) return "calculation_result";
  if (isBaritoneMovementStatus(baritone.movement_status)) return "movement_status";
  if (baritone.path_event) return "path_event";
  if (baritone.positions?.length) return "path_preview";
  return "passive_runtime_state";
};

const baritoneResultStatus = (baritone: NonNullable<Extract<PlannerObservationInput, { provider: "client_baritone_observation" }>["baritone"]>): HelixMinecraftRouteSolverResultStatus => {
  if (isBaritoneCalculationType(baritone.calculation_type)) return mapBaritoneCalculationType(baritone.calculation_type);
  if (isBaritoneMovementStatus(baritone.movement_status)) return mapBaritoneMovementStatus(baritone.movement_status);
  if (baritone.has_current_path || baritone.has_in_progress_finder || baritone.positions?.length) return "route_candidate_found";
  return "unknown";
};

const baritoneExecutionState = (baritone: NonNullable<Extract<PlannerObservationInput, { provider: "client_baritone_observation" }>["baritone"]>): HelixMinecraftPlannerExecutionState => {
  if (baritone.is_pathing || baritone.movement_status === "RUNNING") return "executing";
  if (baritone.has_in_progress_finder || isBaritoneCalculationType(baritone.calculation_type)) return "planning_only";
  if (baritone.movement_status === "SUCCESS") return "completed";
  if (baritone.movement_status === "FAILED" || baritone.movement_status === "UNREACHABLE") return "failed";
  return "not_executing";
};

const baritoneSideEffectRisk = (baritone: NonNullable<Extract<PlannerObservationInput, { provider: "client_baritone_observation" }>["baritone"]>): HelixMinecraftPlannerSideEffectRisk => {
  if (baritone.is_pathing || baritone.movement_status === "RUNNING") return "active_client_motion";
  if (baritone.has_current_path) return "possible_client_motion";
  return "none_observation_only";
};

const riskFlagsForBaritone = (baritone: NonNullable<Extract<PlannerObservationInput, { provider: "client_baritone_observation" }>["baritone"]>): HelixMinecraftRouteSolverRiskFlag[] => {
  if (baritone.movement_status === "UNREACHABLE" || baritone.calculation_type === "FAILURE") return ["unknown_terrain"];
  return ["unknown_terrain"];
};

export function normalizeMinecraftRoutePlannerObservation(
  input: PlannerObservationInput,
): HelixMinecraftRouteSolverObservation {
  const from = defaultFrom(input);
  const target = defaultTarget(input);
  const dimension = from.dimension || target.dimension;
  if (input.provider === "client_pathmind_observation") {
    const pathmind = input.pathmind ?? {};
    return normalizeMinecraftRouteSolverObservation({
      roomId: input.roomId,
      worldId: input.worldId,
      actorLabel: input.actorLabel,
      provider: input.provider,
      nestedProvider: pathmind.nested_provider ?? null,
      plannerExecutionLayer: pathmind.nested_provider === "client_baritone_observation"
        ? "pathmind_baritone_node"
        : "pathmind_native",
      from,
      target,
      resultStatus: pathmind.runtime_state === "path_candidate"
        ? "route_candidate_found"
        : pathmind.runtime_state === "failed" || pathmind.runtime_state === "blocked"
          ? "route_not_found"
          : "unknown",
      plannerObservationMode: pathmindMode(pathmind),
      plannerExecutionState: pathmindExecutionState(pathmind),
      plannerSideEffectRisk: pathmindSideEffectRisk(pathmind),
      worldStateDependency: "client_loaded_chunks",
      movementRequirements: ["unknown"],
      riskFlags: ["unknown_terrain"],
      providerConfidence: pathmind.path_preview_available ? 0.58 : 0.42,
      missingEvidenceCodes: ["provider_report_unverified"],
      evidenceRefs: input.evidenceRefs,
      ts: input.ts,
    });
  }

  const baritone = input.baritone ?? {};
  const pathPoints = pathPointsFor(dimension, baritone.positions);
  const movementSegments = baritone.movements?.map((movement) => ({
    src: movement.src,
    dest: movement.dest,
    provider_cost: movement.cost ?? null,
    calculated_while_loaded: movement.calculated_while_loaded ?? null,
    inferred_requirement: movementRequirementForSegment(movement),
  }));
  const pathKind = baritone.path_kind ?? (baritone.has_current_path ? "current_execution_path" : baritone.has_in_progress_finder ? "best_path_so_far" : "none");
  return normalizeMinecraftRouteSolverObservation({
    roomId: input.roomId,
    worldId: input.worldId,
    actorLabel: input.actorLabel,
    provider: input.provider,
    plannerExecutionLayer: "baritone_api",
    from,
    target,
    resultStatus: baritoneResultStatus(baritone),
    plannerObservationMode: baritoneMode(baritone),
    plannerExecutionState: baritoneExecutionState(baritone),
    plannerSideEffectRisk: baritoneSideEffectRisk(baritone),
    worldStateDependency: "client_loaded_chunks",
    baritonePathState: {
      has_goal: Boolean(baritone.has_goal),
      is_pathing: Boolean(baritone.is_pathing),
      has_current_path: Boolean(baritone.has_current_path),
      has_in_progress_finder: Boolean(baritone.has_in_progress_finder),
      estimated_ticks_to_goal: baritone.estimated_ticks_to_goal ?? null,
      estimated_ticks_remaining_in_segment: baritone.estimated_ticks_remaining_in_segment ?? null,
      path_kind: pathKind,
    },
    pathPoints,
    movementSegments,
    movementRequirements: movementSegments?.length
      ? Array.from(new Set(movementSegments.map((segment) => segment.inferred_requirement)))
      : ["unknown"],
    riskFlags: riskFlagsForBaritone(baritone),
    routeCost: movementSegments?.reduce((sum, segment) => sum + (segment.provider_cost ?? 0), 0) ?? null,
    providerConfidence: baritone.has_current_path || pathPoints?.length ? 0.68 : 0.45,
    missingEvidenceCodes: baritone.movement_status === "UNREACHABLE"
      ? ["provider_report_unverified", "chunk_unobserved"]
      : ["provider_report_unverified"],
    evidenceRefs: input.evidenceRefs,
    ts: input.ts,
  });
}

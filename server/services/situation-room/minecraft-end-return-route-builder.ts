import type {
  EvidenceSafety,
} from "../../../shared/helix-minecraft-evidence.ts";
import { makeId, toolEvidenceSafety } from "../../../shared/helix-minecraft-evidence.ts";
import type { MinecraftRouteObjectiveState } from "../../../shared/helix-minecraft-route-objective.ts";

export const HELIX_MINECRAFT_ROUTE_REHEARSAL_SCHEMA =
  "helix.minecraft_route_rehearsal.v1" as const;

export type MinecraftRoutePoint = {
  dimension: string;
  x: number;
  y?: number | null;
  z: number;
};

export type MinecraftRouteEvidenceCell = MinecraftRoutePoint & {
  block_type?: string | null;
  tags?: string[];
  evidence_refs?: string[];
};

export type MinecraftRouteRehearsalStage = {
  stage_code:
    | "reach_return_end_gateway"
    | "return_to_central_end"
    | "reach_end_exit_portal"
    | "return_to_respawn_or_home"
    | "find_return_gateway";
  from_dimension: string;
  to_dimension: string;
  target_type: "end_gateway" | "portal_transition" | "exit_portal" | "respawn_location";
  route_basis: Array<
    | "observed_current_world"
    | "persisted_block_delta_overlay"
    | "seed_forecast"
    | "server_observation"
    | "game_rule"
    | "visual_capture"
    | "transcript_intent"
  >;
  reachable_confidence: number;
  risk: "low" | "medium" | "high" | "unknown";
  missing_evidence_codes: Array<
    | "gateway_unconfirmed"
    | "no_gateway_candidate"
    | "no_observed_gateway"
    | "no_seed_forecast_gateway"
    | "no_client_planner_gateway_candidate"
    | "cannot_compute_return_route_without_gateway"
    | "route_includes_void_adjacent_bridge"
    | "ender_pearl_unknown"
    | "gateway_destination_unconfirmed"
    | "central_island_position_unsampled"
    | "home_binding_unknown"
  >;
};

export type MinecraftRouteRehearsal = EvidenceSafety & {
  schema: typeof HELIX_MINECRAFT_ROUTE_REHEARSAL_SCHEMA;
  route_rehearsal_id: string;
  objective_id: string;
  room_id: string;
  world_id: string;
  route_kind: "return_home_from_end";
  result_status:
    | "route_candidate_found"
    | "partial_route"
    | "not_enough_evidence";
  route_confidence: number;
  stages: MinecraftRouteRehearsalStage[];
  missing_evidence_codes: MinecraftRouteRehearsalStage["missing_evidence_codes"];
  current_position: MinecraftRoutePoint;
  candidate_next_waypoint:
    | (MinecraftRoutePoint & {
        label_code: "return_end_gateway_candidate";
        expected_direction: string;
        confidence: number;
      })
    | null;
  evidence_refs: string[];
  normalized_by_deterministic_reducer: true;
  model_invoked_by_helix: false;
  ts: string;
};

export type BuildEndReturnRouteInput = {
  objective: MinecraftRouteObjectiveState;
  current_position: MinecraftRoutePoint;
  gateway_candidate?: MinecraftRoutePoint | null;
  observed_gateway_candidate?: MinecraftRoutePoint | null;
  seed_forecast_gateway_candidate?: MinecraftRoutePoint | null;
  client_planner_gateway_candidate?: MinecraftRoutePoint | null;
  chunk_surface_cells?: MinecraftRouteEvidenceCell[];
  block_delta_overlay_cells?: MinecraftRouteEvidenceCell[];
  bridge_overlay_observed: boolean;
  ender_pearl_known_available?: boolean | null;
  respawn_location_known: boolean;
  evidence_refs: string[];
  ts: string;
};

const hasTag = (cell: MinecraftRouteEvidenceCell, pattern: RegExp): boolean =>
  (cell.tags ?? []).some((tag) => pattern.test(tag));

const firstTaggedCell = (
  cells: MinecraftRouteEvidenceCell[],
  pattern: RegExp,
): MinecraftRouteEvidenceCell | null =>
  cells.find((cell) => hasTag(cell, pattern) || pattern.test(cell.block_type ?? "")) ?? null;

const uniqueEvidenceRefs = (input: BuildEndReturnRouteInput): string[] =>
  Array.from(new Set([
    ...input.evidence_refs,
    ...(input.chunk_surface_cells ?? []).flatMap((cell) => cell.evidence_refs ?? []),
    ...(input.block_delta_overlay_cells ?? []).flatMap((cell) => cell.evidence_refs ?? []),
  ]));

export function buildEndReturnRouteRehearsal(
  input: BuildEndReturnRouteInput,
): MinecraftRouteRehearsal {
  const chunkSurfaceCells = input.chunk_surface_cells ?? [];
  const blockDeltaOverlayCells = input.block_delta_overlay_cells ?? [];
  const chunkGateway = firstTaggedCell(chunkSurfaceCells, /gateway|portal/i);
  const gateway =
    input.observed_gateway_candidate ??
    input.gateway_candidate ??
    (chunkGateway ? {
      dimension: chunkGateway.dimension,
      x: chunkGateway.x,
      y: chunkGateway.y ?? null,
      z: chunkGateway.z,
    } : null) ??
    input.seed_forecast_gateway_candidate ??
    input.client_planner_gateway_candidate ??
    null;
  const gatewayBasis =
    input.observed_gateway_candidate || input.gateway_candidate || chunkGateway
      ? "observed_current_world"
      : input.seed_forecast_gateway_candidate
        ? "seed_forecast"
        : input.client_planner_gateway_candidate
          ? "client_planner"
          : null;
  const bridgeOverlayObserved =
    input.bridge_overlay_observed ||
    blockDeltaOverlayCells.length > 0 ||
    chunkSurfaceCells.some((cell) => hasTag(cell, /bridge_like|traversable/i));
  const currentWorldObserved = chunkSurfaceCells.length > 0 || Boolean(input.observed_gateway_candidate) || Boolean(input.gateway_candidate);
  const routeIncludesVoidRisk = bridgeOverlayObserved || chunkSurfaceCells.some((cell) => hasTag(cell, /void|drop|hazard_lava/i));
  const evidenceRefs = uniqueEvidenceRefs(input);

  if (!gateway) {
    const missingEvidence: MinecraftRouteRehearsalStage["missing_evidence_codes"] = [
      "no_gateway_candidate",
      ...(input.observed_gateway_candidate || input.gateway_candidate || chunkGateway ? [] : ["no_observed_gateway" as const]),
      ...(input.seed_forecast_gateway_candidate ? [] : ["no_seed_forecast_gateway" as const]),
      ...(input.client_planner_gateway_candidate ? [] : ["no_client_planner_gateway_candidate" as const]),
      "cannot_compute_return_route_without_gateway",
    ];

    return {
      schema: HELIX_MINECRAFT_ROUTE_REHEARSAL_SCHEMA,
      ...toolEvidenceSafety(),
      route_rehearsal_id: makeId("route_rehearsal", input.objective.objective_id),
      objective_id: input.objective.objective_id,
      room_id: input.objective.room_id,
      world_id: input.objective.world_id,
      route_kind: "return_home_from_end",
      result_status: "not_enough_evidence",
      route_confidence: 0.25,
      stages: [
        {
          stage_code: "find_return_gateway",
          from_dimension: "minecraft:the_end",
          to_dimension: "minecraft:the_end",
          target_type: "end_gateway",
          route_basis: [],
          reachable_confidence: 0.2,
          risk: "unknown",
          missing_evidence_codes: missingEvidence,
        },
      ],
      missing_evidence_codes: missingEvidence,
      current_position: input.current_position,
      candidate_next_waypoint: null,
      evidence_refs: [input.objective.objective_id, ...evidenceRefs],
      normalized_by_deterministic_reducer: true,
      model_invoked_by_helix: false,
      ts: input.ts,
    };
  }

  const routeConfidence =
    0.38 +
    (gatewayBasis === "observed_current_world" ? 0.2 : 0) +
    (gatewayBasis === "seed_forecast" ? 0.12 : 0) +
    (gatewayBasis === "client_planner" ? 0.1 : 0) +
    (bridgeOverlayObserved ? 0.12 : 0) +
    (chunkSurfaceCells.length > 0 ? 0.08 : 0) +
    (input.ender_pearl_known_available ? 0.08 : 0) +
    (input.respawn_location_known ? 0.08 : 0);

  const reachGatewayMissingEvidence: MinecraftRouteRehearsalStage["missing_evidence_codes"] = [
    ...(gatewayBasis === "observed_current_world" ? [] : ["gateway_unconfirmed" as const]),
    ...(routeIncludesVoidRisk ? ["route_includes_void_adjacent_bridge" as const] : []),
    ...(input.ender_pearl_known_available ? [] : ["ender_pearl_unknown" as const]),
  ];
  const reachGatewayBasis: MinecraftRouteRehearsalStage["route_basis"] = [
    ...(bridgeOverlayObserved ? ["persisted_block_delta_overlay" as const] : []),
    ...(currentWorldObserved ? ["observed_current_world" as const] : []),
    ...(gatewayBasis === "seed_forecast" ? ["seed_forecast" as const] : []),
    ...(input.objective.evidence_refs.length > 0 ? ["transcript_intent" as const] : []),
  ];

  return {
    schema: HELIX_MINECRAFT_ROUTE_REHEARSAL_SCHEMA,
    ...toolEvidenceSafety(),
    route_rehearsal_id: makeId("route_rehearsal", input.objective.objective_id),
    objective_id: input.objective.objective_id,
    room_id: input.objective.room_id,
    world_id: input.objective.world_id,
    route_kind: "return_home_from_end",
    result_status: "route_candidate_found",
    route_confidence: Math.min(routeConfidence, 0.9),
    stages: [
      {
        stage_code: "reach_return_end_gateway",
        from_dimension: "minecraft:the_end",
        to_dimension: "minecraft:the_end",
        target_type: "end_gateway",
        route_basis: reachGatewayBasis,
        reachable_confidence: Math.min(0.42 + (routeConfidence * 0.35), 0.82),
        risk: routeIncludesVoidRisk ? "high" : "medium",
        missing_evidence_codes: reachGatewayMissingEvidence,
      },
      {
        stage_code: "return_to_central_end",
        from_dimension: "minecraft:the_end",
        to_dimension: "minecraft:the_end",
        target_type: "portal_transition",
        route_basis: ["observed_current_world"],
        reachable_confidence: 0.7,
        risk: "medium",
        missing_evidence_codes: ["gateway_destination_unconfirmed"],
      },
      {
        stage_code: "reach_end_exit_portal",
        from_dimension: "minecraft:the_end",
        to_dimension: "minecraft:the_end",
        target_type: "exit_portal",
        route_basis: ["game_rule", "observed_current_world"],
        reachable_confidence: 0.75,
        risk: "medium",
        missing_evidence_codes: ["central_island_position_unsampled"],
      },
      {
        stage_code: "return_to_respawn_or_home",
        from_dimension: "minecraft:the_end",
        to_dimension: "minecraft:overworld",
        target_type: "respawn_location",
        route_basis: ["server_observation"],
        reachable_confidence: input.respawn_location_known ? 0.82 : 0.5,
        risk: input.respawn_location_known ? "low" : "unknown",
        missing_evidence_codes: input.respawn_location_known ? [] : ["home_binding_unknown"],
      },
    ],
    missing_evidence_codes: [
      ...(routeIncludesVoidRisk ? ["route_includes_void_adjacent_bridge" as const] : []),
      ...(input.ender_pearl_known_available ? [] : ["ender_pearl_unknown" as const]),
      "gateway_destination_unconfirmed",
      "central_island_position_unsampled",
      ...(input.respawn_location_known ? [] : ["home_binding_unknown" as const]),
    ],
    current_position: input.current_position,
    candidate_next_waypoint: {
      ...gateway,
      label_code: "return_end_gateway_candidate",
      expected_direction: compassDirection(input.current_position, gateway),
      confidence: gatewayBasis === "observed_current_world" ? 0.68 : gatewayBasis === "seed_forecast" ? 0.52 : 0.48,
    },
    evidence_refs: [input.objective.objective_id, ...evidenceRefs],
    normalized_by_deterministic_reducer: true,
    model_invoked_by_helix: false,
    ts: input.ts,
  };
}

export function compassDirection(from: MinecraftRoutePoint, to: MinecraftRoutePoint): string {
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  const angle = Math.atan2(-dz, dx) * (180 / Math.PI);
  const normalized = (angle + 360) % 360;
  const directions = [
    "east",
    "east-northeast",
    "northeast",
    "north-northeast",
    "north",
    "north-northwest",
    "northwest",
    "west-northwest",
    "west",
    "west-southwest",
    "southwest",
    "south-southwest",
    "south",
    "south-southeast",
    "southeast",
    "east-southeast",
  ];
  return directions[Math.round(normalized / 22.5) % directions.length];
}

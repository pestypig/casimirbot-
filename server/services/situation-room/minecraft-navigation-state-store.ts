import crypto from "node:crypto";
import {
  HELIX_MINECRAFT_NAVIGATION_STATE_QUERY_RESULT_SCHEMA,
  HELIX_MINECRAFT_NAVIGATION_STATE_SCHEMA,
  type HelixMinecraftNavigationState,
  type HelixMinecraftNavigationStateQueryResult,
  type HelixMinecraftRouteDriftEvent,
  type HelixMinecraftRouteObjective,
  type HelixMinecraftRouteSolverObservation,
} from "@shared/helix-minecraft-evidence";
import type { HelixMinecraftRouteRehearsal } from "@shared/helix-minecraft-route-rehearsal";
import type { HelixMinecraftSpatialEvent } from "@shared/helix-minecraft-spatial-event";

type NavigationStateRecord = {
  state: HelixMinecraftNavigationState;
  latest_objective: HelixMinecraftRouteObjective | null;
  latest_rehearsal: HelixMinecraftRouteRehearsal | null;
  latest_drift: HelixMinecraftRouteDriftEvent | null;
  solver_observations: HelixMinecraftRouteSolverObservation[];
};

const recordsByKey = new Map<string, NavigationStateRecord>();

const stableJson = (value: unknown): string => JSON.stringify(value);
const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(stableJson(value)).digest("hex").slice(0, size);

const keyFor = (roomId: string, worldId: string, actorLabel?: string | null): string =>
  `${roomId}:${worldId}:${actorLabel ?? "unknown_actor"}`;

const uniqueStrings = (values: unknown[]): string[] =>
  Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));

const routeStatusFor = (input: {
  objective?: HelixMinecraftRouteObjective | null;
  rehearsal?: HelixMinecraftRouteRehearsal | null;
  drift?: HelixMinecraftRouteDriftEvent | null;
}): HelixMinecraftNavigationState["route_status"] => {
  if (input.drift?.policy_surface_status === "approved") return "policy_approved_surface";
  if (input.drift?.drift_status === "wrong_direction") return "wrong_direction_candidate";
  if (input.drift?.drift_status === "minor_drift") return "minor_drift";
  if (input.drift?.drift_status === "on_route") return "on_route";
  if (input.rehearsal) return "rehearsal_ready";
  if (input.objective) return "objective_detected";
  return "no_objective";
};

const policyStatusFor = (drift?: HelixMinecraftRouteDriftEvent | null): HelixMinecraftNavigationState["policy_surface_status"] =>
  drift?.policy_surface_status ?? "not_candidate";

const baseState = (input: {
  roomId: string;
  worldId: string;
  actorLabel?: string | null;
  updatedAt: string;
}): HelixMinecraftNavigationState => ({
  schema: HELIX_MINECRAFT_NAVIGATION_STATE_SCHEMA,
  state_id: `minecraft_navigation_state:${hashShort([input.roomId, input.worldId, input.actorLabel ?? null])}`,
  room_id: input.roomId,
  world_id: input.worldId,
  actor_label: input.actorLabel ?? null,
  latest_objective_id: null,
  latest_rehearsal_id: null,
  latest_drift_event_id: null,
  current_position: null,
  route_status: "no_objective",
  policy_surface_status: "not_candidate",
  provider_observation_refs: [],
  route_rehearsal_refs: [],
  route_drift_refs: [],
  evidence_refs: [],
  missing_evidence: [],
  instruction_authority: "none",
  ask_instruction_authority: "none",
  ask_context_policy: "evidence_only",
  context_role: "tool_evidence",
  creates_ask_turn: false,
  turn_triggered: false,
  assistant_answer: false,
  raw_content_included: false,
  raw_user_text_included: false,
  updated_at: input.updatedAt,
});

const upsertRecord = (input: {
  roomId: string;
  worldId: string;
  actorLabel?: string | null;
  updatedAt: string;
  mutate: (record: NavigationStateRecord) => NavigationStateRecord;
}): NavigationStateRecord => {
  const key = keyFor(input.roomId, input.worldId, input.actorLabel);
  const existing = recordsByKey.get(key) ?? {
    state: baseState(input),
    latest_objective: null,
    latest_rehearsal: null,
    latest_drift: null,
    solver_observations: [],
  };
  const next = input.mutate(existing);
  const state: HelixMinecraftNavigationState = {
    ...next.state,
    latest_objective_id: next.latest_objective?.objective_id ?? next.state.latest_objective_id ?? null,
    latest_rehearsal_id: next.latest_rehearsal?.rehearsal_id ?? next.state.latest_rehearsal_id ?? null,
    latest_drift_event_id: next.latest_drift?.drift_event_id ?? next.state.latest_drift_event_id ?? null,
    route_status: routeStatusFor({
      objective: next.latest_objective,
      rehearsal: next.latest_rehearsal,
      drift: next.latest_drift,
    }),
    policy_surface_status: policyStatusFor(next.latest_drift),
    provider_observation_refs: next.solver_observations.map((entry) => entry.observation_id).slice(-12),
    route_rehearsal_refs: uniqueStrings([
      ...next.state.route_rehearsal_refs,
      next.latest_rehearsal?.rehearsal_id,
    ]).slice(-12),
    route_drift_refs: uniqueStrings([
      ...next.state.route_drift_refs,
      next.latest_drift?.drift_event_id,
    ]).slice(-12),
    evidence_refs: uniqueStrings([
      ...next.state.evidence_refs,
      ...(next.latest_objective?.evidence_refs ?? []),
      ...(next.latest_rehearsal?.evidence_refs ?? []),
      ...(next.latest_drift?.evidence_refs ?? []),
      ...next.solver_observations.flatMap((entry) => entry.evidence_refs),
    ]).slice(-48),
    missing_evidence: uniqueStrings([
      ...next.state.missing_evidence,
      ...(next.latest_objective?.missing_evidence ?? []),
      ...(next.latest_rehearsal?.missing_evidence ?? []),
      ...next.solver_observations.flatMap((entry) => entry.missing_evidence),
    ]).slice(-24),
    updated_at: input.updatedAt,
  };
  const finalized = { ...next, state };
  recordsByKey.set(key, finalized);
  return finalized;
};

export function recordMinecraftRouteObjective(objective: HelixMinecraftRouteObjective): HelixMinecraftNavigationState {
  return upsertRecord({
    roomId: objective.room_id,
    worldId: objective.world_id,
    actorLabel: objective.actor_label ?? null,
    updatedAt: objective.ts,
    mutate: (record) => ({
      ...record,
      latest_objective: objective,
    }),
  }).state;
}

export function recordMinecraftRouteSolverObservation(
  observation: HelixMinecraftRouteSolverObservation,
): HelixMinecraftNavigationState {
  return upsertRecord({
    roomId: observation.room_id,
    worldId: observation.world_id,
    actorLabel: observation.actor_label ?? null,
    updatedAt: observation.ts,
    mutate: (record) => ({
      ...record,
      solver_observations: [...record.solver_observations, observation].slice(-12),
    }),
  }).state;
}

export function recordMinecraftNavigationEvidence(input: {
  spatialEvent?: HelixMinecraftSpatialEvent | null;
  routeRehearsal?: HelixMinecraftRouteRehearsal | null;
  routeDrift?: HelixMinecraftRouteDriftEvent | null;
  now: string;
}): HelixMinecraftNavigationState | null {
  const anchor = input.spatialEvent ?? null;
  const route = input.routeRehearsal ?? null;
  const drift = input.routeDrift ?? null;
  if (!anchor && !route && !drift) return null;
  const roomId = anchor?.room_id ?? route?.room_id ?? drift?.room_id;
  const worldId = anchor?.world_id ?? route?.world_id ?? drift?.world_id;
  if (!roomId || !worldId) return null;
  const actorLabel = anchor?.actor_label ?? route?.actor_label ?? drift?.actor_label ?? null;
  return upsertRecord({
    roomId,
    worldId,
    actorLabel,
    updatedAt: input.now,
    mutate: (record) => ({
      ...record,
      latest_rehearsal: route ?? record.latest_rehearsal,
      latest_drift: drift ?? record.latest_drift,
      state: {
        ...record.state,
        current_position: anchor
          ? {
              dimension: anchor.dimension,
              x: anchor.location.x,
              y: anchor.location.y,
              z: anchor.location.z,
            }
          : record.state.current_position ?? null,
      },
    }),
  }).state;
}

export function queryMinecraftNavigationState(input: {
  roomId?: string | null;
  worldId?: string | null;
  actorLabel?: string | null;
  limit?: number;
}): HelixMinecraftNavigationStateQueryResult {
  const candidates = Array.from(recordsByKey.values())
    .filter((record) => !input.roomId || record.state.room_id === input.roomId)
    .filter((record) => !input.worldId || record.state.world_id === input.worldId)
    .filter((record) => !input.actorLabel || record.state.actor_label === input.actorLabel)
    .sort((a, b) => a.state.updated_at.localeCompare(b.state.updated_at));
  const record = candidates.at(-1) ?? null;
  const latestSolverObservations = record?.solver_observations.slice(-(input.limit ?? 6)) ?? [];
  const evidenceLayers = uniqueStrings([
    record?.latest_objective?.evidence_layer,
    ...(record?.latest_rehearsal?.route_basis ?? []),
    record?.latest_drift ? "route_math" : null,
    ...latestSolverObservations.map((entry) =>
      entry.evidence_layer === "client_route_planner_observation"
        ? "client_planner_observation"
        : entry.evidence_layer,
    ),
  ]) as HelixMinecraftNavigationStateQueryResult["evidence_layers_present"];
  return {
    schema: HELIX_MINECRAFT_NAVIGATION_STATE_QUERY_RESULT_SCHEMA,
    ok: true,
    room_id: input.roomId ?? record?.state.room_id ?? null,
    world_id: input.worldId ?? record?.state.world_id ?? null,
    actor_label: input.actorLabel ?? record?.state.actor_label ?? null,
    navigation_state: record?.state ?? null,
    latest_objective: record?.latest_objective ?? null,
    latest_rehearsal: record?.latest_rehearsal ?? null,
    latest_drift: record?.latest_drift ?? null,
    latest_solver_observations: latestSolverObservations,
    evidence_layers_present: evidenceLayers,
    missing_evidence: record?.state.missing_evidence ?? ["No Minecraft navigation state has been recorded yet."],
    assistant_answer: false,
    raw_content_included: false,
    raw_user_text_included: false,
    context_role: "tool_evidence",
    ask_context_policy: "evidence_only",
  };
}

export function getLatestMinecraftNavigationStateForRoom(roomId: string): HelixMinecraftNavigationState | null {
  return queryMinecraftNavigationState({ roomId }).navigation_state ?? null;
}

export function resetMinecraftNavigationStateStoreForTest(): void {
  recordsByKey.clear();
}

import crypto from "node:crypto";
import {
  HELIX_MINECRAFT_ROUTE_DRIFT_EVENT_SCHEMA,
  type HelixMinecraftRouteDriftEvent,
} from "@shared/helix-minecraft-evidence";
import type { HelixMinecraftRouteRehearsal } from "@shared/helix-minecraft-route-rehearsal";
import type { HelixMinecraftSpatialEvent } from "@shared/helix-minecraft-spatial-event";
import { directionBetween } from "./minecraft-spatial-graph";

type RouteSample = {
  ts: string;
  position: { dimension: string; x: number; y: number; z: number };
  evidence_refs: string[];
};

type RouteDriftState = {
  route: HelixMinecraftRouteRehearsal;
  samples: RouteSample[];
  updated_at: string;
};

const stateByKey = new Map<string, RouteDriftState>();

const stableJson = (value: unknown): string => JSON.stringify(value);
const hashShort = (value: unknown, size = 12): string =>
  crypto.createHash("sha256").update(stableJson(value)).digest("hex").slice(0, size);

const keyFor = (roomId: string, worldId: string, actorLabel?: string | null): string =>
  `${roomId}:${worldId}:${actorLabel ?? "unknown_actor"}`;

const distance2d = (from: { x: number; z: number }, to: { x?: number | null; z?: number | null }): number | null => {
  if (typeof to.x !== "number" || typeof to.z !== "number") return null;
  return Math.hypot(to.x - from.x, to.z - from.z);
};

const headingDegrees = (from: { x: number; z: number }, to: { x?: number | null; z?: number | null }): number | null => {
  if (typeof to.x !== "number" || typeof to.z !== "number") return null;
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  if (Math.abs(dx) < 0.001 && Math.abs(dz) < 0.001) return null;
  return (Math.atan2(dz, dx) * 180 / Math.PI + 360) % 360;
};

const headingError = (expected: number | null, observed: number | null): number => {
  if (expected === null || observed === null) return 0;
  const diff = Math.abs(expected - observed) % 360;
  return Math.round(Math.min(diff, 360 - diff));
};

const parseTime = (ts: string): number => {
  const parsed = Date.parse(ts);
  return Number.isFinite(parsed) ? parsed : 0;
};

const evidenceRefsFor = (
  route: HelixMinecraftRouteRehearsal,
  samples: RouteSample[],
): string[] => Array.from(new Set([
  ...route.evidence_refs,
  ...samples.flatMap((sample) => sample.evidence_refs),
])).slice(-32);

export function resetMinecraftRouteDriftStateForTest(): void {
  stateByKey.clear();
}

export function getMinecraftRouteDriftStateForTest(input: {
  roomId: string;
  worldId: string;
  actorLabel?: string | null;
}): RouteDriftState | null {
  return stateByKey.get(keyFor(input.roomId, input.worldId, input.actorLabel)) ?? null;
}

export function reduceMinecraftRouteDrift(input: {
  spatialEvent?: HelixMinecraftSpatialEvent | null;
  routeRehearsal?: HelixMinecraftRouteRehearsal | null;
  minSampleWindowMs?: number;
}): HelixMinecraftRouteDriftEvent | null {
  const event = input.spatialEvent;
  if (!event || event.event_type !== "player_location_sample") return null;
  const route = input.routeRehearsal;
  if (!route) return null;
  const waypoint = route.candidate_next_waypoint;
  if (!waypoint || typeof waypoint.x !== "number" || typeof waypoint.z !== "number") return null;
  const key = keyFor(event.room_id, event.world_id, event.actor_label ?? route.actor_label ?? null);
  const existing = stateByKey.get(key);
  const nextSample: RouteSample = {
    ts: event.ts,
    position: { dimension: event.dimension, ...event.location },
    evidence_refs: event.evidence_refs,
  };
  const samples = [...(existing?.route.rehearsal_id === route.rehearsal_id ? existing.samples : []), nextSample]
    .sort((a, b) => parseTime(a.ts) - parseTime(b.ts))
    .slice(-6);
  stateByKey.set(key, { route, samples, updated_at: event.ts });

  if (route.route_confidence < 0.55 || samples.length < 3) return null;
  const first = samples[0];
  const previous = samples[samples.length - 2];
  const current = samples[samples.length - 1];
  const sampleWindowMs = parseTime(current.ts) - parseTime(first.ts);
  if (sampleWindowMs < (input.minSampleWindowMs ?? 1000)) return null;
  const firstDistance = distance2d(first.position, waypoint);
  const currentDistance = distance2d(current.position, waypoint);
  if (firstDistance === null || currentDistance === null) return null;
  const distanceDelta = Math.round(currentDistance - firstDistance);
  const expectedHeading = headingDegrees(current.position, waypoint);
  const observedHeading = headingDegrees(previous.position, current.position);
  const error = headingError(expectedHeading, observedHeading);
  const wrongDirection = error >= 75 && distanceDelta > 0;
  const minorDrift = !wrongDirection && error >= 35 && distanceDelta > 0;
  const driftStatus: HelixMinecraftRouteDriftEvent["drift_status"] = wrongDirection
    ? "wrong_direction"
    : minorDrift
      ? "minor_drift"
      : "on_route";
  return {
    schema: HELIX_MINECRAFT_ROUTE_DRIFT_EVENT_SCHEMA,
    drift_event_id: `minecraft_route_drift:${hashShort([route.rehearsal_id, current.ts, current.position], 18)}`,
    room_id: event.room_id,
    world_id: event.world_id,
    route_rehearsal_id: route.rehearsal_id,
    actor_label: event.actor_label ?? route.actor_label ?? null,
    evidence_trust: "route_math",
    instruction_authority: "none",
    ask_context_policy: "evidence_only",
    creates_ask_turn: false,
    turn_triggered: false,
    ask_instruction_authority: "none",
    context_role: "tool_evidence",
    current_position: current.position,
    next_waypoint_label: waypoint.label,
    expected_direction: waypoint.expected_direction ?? directionBetween(current.position, waypoint),
    observed_direction: directionBetween(previous.position, current.position),
    heading_error_degrees: error,
    distance_delta_blocks: distanceDelta,
    sample_count: samples.length,
    sample_window_ms: sampleWindowMs,
    drift_status: driftStatus,
    salience_candidate: driftStatus === "wrong_direction",
    policy_surface_status: driftStatus === "wrong_direction" ? "candidate_pending_gate" : "not_candidate",
    salience_reason: driftStatus === "wrong_direction"
      ? error >= 75
        ? "heading_opposes_route"
        : "distance_increasing"
      : null,
    blocking_context: null,
    evidence_refs: evidenceRefsFor(route, samples),
    missing_evidence_codes: driftStatus === "wrong_direction" ? [] : ["unknown"],
    raw_logs_included: false,
    raw_user_text_included: false,
    derived_by_deterministic_reducer: true,
    model_invoked: false,
    ts: current.ts,
  };
}

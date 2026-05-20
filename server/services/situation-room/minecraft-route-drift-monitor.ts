import { makeId } from "../../../shared/helix-minecraft-evidence.ts";
import {
  createRouteDriftEvent,
  type MinecraftRouteDriftEvent,
} from "../../../shared/helix-minecraft-route-drift.ts";
import type { MinecraftRouteObjectiveState } from "../../../shared/helix-minecraft-route-objective.ts";
import type {
  MinecraftRoutePoint,
  MinecraftRouteRehearsal,
} from "./minecraft-end-return-route-builder.ts";
import { compassDirection } from "./minecraft-end-return-route-builder.ts";

export type PlayerLocationSample = MinecraftRoutePoint & {
  ts_ms: number;
  event_type?: "location_sample" | "dimension_changed";
  falling?: boolean;
  in_combat?: boolean;
  bridging?: boolean;
};

export type RouteDriftMonitorInput = {
  objective: MinecraftRouteObjectiveState;
  rehearsal: MinecraftRouteRehearsal;
  samples: PlayerLocationSample[];
  now: string;
  stale_after_ms?: number;
};

const DEFAULT_STALE_AFTER_MS = 5 * 60 * 1000;

export function monitorRouteDrift(input: RouteDriftMonitorInput): MinecraftRouteDriftEvent {
  const staleAfterMs = input.stale_after_ms ?? DEFAULT_STALE_AFTER_MS;
  const latestSample = input.samples.at(-1);

  if (input.objective.lifecycle !== "active") {
    return staleDrift(input, "objective_not_active", latestSample);
  }

  if (
    input.objective.intent_status === "completed" ||
    input.objective.intent_status === "cancelled"
  ) {
    return staleDrift(input, "objective_closed", latestSample);
  }

  if (isStale(input.objective.updated_at, input.now, staleAfterMs)) {
    return staleDrift(input, "objective_stale", latestSample);
  }

  const waypoint = input.rehearsal.candidate_next_waypoint;
  if (!waypoint) {
    return unknownDrift(input, "no_candidate_next_waypoint", latestSample);
  }

  if (!latestSample || input.samples.length < 3) {
    return unknownDrift(input, null, latestSample);
  }

  if (latestSample.dimension !== waypoint.dimension) {
    return staleDrift(input, "dimension_mismatch", latestSample);
  }

  if (input.samples.some((sample) => sample.event_type === "dimension_changed")) {
    return staleDrift(input, "dimension_transition_observed", latestSample);
  }

  const window = input.samples.slice(-3);
  const first = window[0];
  const last = window[window.length - 1];

  if (window.some((sample) => sample.falling || sample.in_combat || sample.bridging)) {
    return unknownDrift(input, null, latestSample);
  }

  const startDistance = distance2d(first, waypoint);
  const endDistance = distance2d(last, waypoint);
  const distanceDelta = endDistance - startDistance;
  const observedDirection = compassDirection(first, last);
  const headingError = directionErrorDegrees(
    bearingDegrees(first, waypoint),
    bearingDegrees(first, last),
  );

  const wrongDirection =
    headingError > 75 &&
    distanceDelta > 0 &&
    input.rehearsal.route_confidence >= 0.55 &&
    window.every((sample, index) => {
      if (index === 0) {
        return true;
      }
      return distance2d(sample, waypoint) > distance2d(window[index - 1], waypoint);
    });

  return createRouteDriftEvent({
    drift_event_id: makeId("route_drift", `${input.rehearsal.route_rehearsal_id}_${last.ts_ms}`),
    route_rehearsal_id: input.rehearsal.route_rehearsal_id,
    room_id: input.rehearsal.room_id,
    world_id: input.rehearsal.world_id,
    current_position: currentPosition(last),
    next_waypoint_label_code: waypoint.label_code,
    expected_direction: waypoint.expected_direction,
    observed_direction: observedDirection,
    heading_error_degrees: Math.round(headingError),
    distance_delta_blocks: Math.round(distanceDelta),
    sample_count: window.length,
    sample_window_ms: last.ts_ms - first.ts_ms,
    drift_status: wrongDirection ? "wrong_direction" : distanceDelta > 0 ? "minor_drift" : "on_route",
    stale_reason: null,
    salience_candidate: wrongDirection,
    evidence_refs: [input.rehearsal.route_rehearsal_id],
    ts: input.now,
  });
}

export function evaluateRouteDrift(
  rehearsal: MinecraftRouteRehearsal,
  samples: PlayerLocationSample[],
): MinecraftRouteDriftEvent | null {
  if (samples.length < 3 || !rehearsal.candidate_next_waypoint) {
    return null;
  }

  return monitorRouteDrift({
    objective: {
      schema: "helix.minecraft_route_objective.v1",
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
      objective_id: rehearsal.objective_id,
      room_id: rehearsal.room_id,
      world_id: rehearsal.world_id,
      intent_label: "return_home_from_end",
      intent_status: "confirmed",
      lifecycle: "active",
      created_from: "server_event",
      target_chain: [],
      confidence: rehearsal.route_confidence,
      evidence_refs: [rehearsal.route_rehearsal_id],
      model_invoked_by_helix: false,
      requires_external_evidence: false,
      updated_at: new Date(samples.at(-1)?.ts_ms ?? Date.now()).toISOString(),
    },
    rehearsal,
    samples,
    now: new Date(samples.at(-1)?.ts_ms ?? Date.now()).toISOString(),
  });
}

function staleDrift(
  input: RouteDriftMonitorInput,
  staleReason: NonNullable<MinecraftRouteDriftEvent["stale_reason"]>,
  latestSample?: PlayerLocationSample,
): MinecraftRouteDriftEvent {
  return guardedDrift(input, "stale_route", staleReason, latestSample);
}

function unknownDrift(
  input: RouteDriftMonitorInput,
  staleReason: MinecraftRouteDriftEvent["stale_reason"],
  latestSample?: PlayerLocationSample,
): MinecraftRouteDriftEvent {
  return guardedDrift(input, "unknown", staleReason ?? null, latestSample);
}

function guardedDrift(
  input: RouteDriftMonitorInput,
  driftStatus: "unknown" | "stale_route",
  staleReason: MinecraftRouteDriftEvent["stale_reason"],
  latestSample?: PlayerLocationSample,
): MinecraftRouteDriftEvent {
  const waypoint = input.rehearsal.candidate_next_waypoint;
  return createRouteDriftEvent({
    drift_event_id: makeId(
      "route_drift",
      `${input.rehearsal.route_rehearsal_id}_${staleReason ?? driftStatus}_${input.now}`,
    ),
    route_rehearsal_id: input.rehearsal.route_rehearsal_id,
    room_id: input.rehearsal.room_id,
    world_id: input.rehearsal.world_id,
    current_position: currentPosition(latestSample ?? input.rehearsal.current_position),
    next_waypoint_label_code: waypoint?.label_code ?? null,
    expected_direction: waypoint?.expected_direction ?? null,
    observed_direction: null,
    heading_error_degrees: 0,
    distance_delta_blocks: 0,
    sample_count: input.samples.length,
    sample_window_ms: sampleWindowMs(input.samples),
    drift_status: driftStatus,
    stale_reason: staleReason,
    salience_candidate: false,
    evidence_refs: [input.rehearsal.route_rehearsal_id, input.objective.objective_id],
    ts: input.now,
  });
}

function currentPosition(sample: MinecraftRoutePoint): { dimension: string; x: number; y: number; z: number } {
  return {
    dimension: sample.dimension,
    x: sample.x,
    y: sample.y ?? 0,
    z: sample.z,
  };
}

function isStale(updatedAt: string, now: string, staleAfterMs: number): boolean {
  const updatedMs = Date.parse(updatedAt);
  const nowMs = Date.parse(now);
  if (!Number.isFinite(updatedMs) || !Number.isFinite(nowMs)) {
    return true;
  }

  return nowMs - updatedMs > staleAfterMs;
}

function sampleWindowMs(samples: PlayerLocationSample[]): number {
  if (samples.length < 2) {
    return 0;
  }

  return samples[samples.length - 1].ts_ms - samples[0].ts_ms;
}

function distance2d(a: MinecraftRoutePoint, b: MinecraftRoutePoint): number {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

function bearingDegrees(a: MinecraftRoutePoint, b: MinecraftRoutePoint): number {
  return ((Math.atan2(-(b.z - a.z), b.x - a.x) * 180) / Math.PI + 360) % 360;
}

function directionErrorDegrees(expected: number, observed: number): number {
  const diff = Math.abs(expected - observed) % 360;
  return diff > 180 ? 360 - diff : diff;
}

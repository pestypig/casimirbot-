import {
  LIVE_SOURCE_OBSERVATION_SCHEMA,
  type LiveSourceFreshnessStatus,
  type LiveSourceObservation,
} from "@shared/live-source-observation";
import { evaluateLiveSourceFreshness } from "./source-freshness";
import { makeLiveSourceObservationId } from "./live-source-observation-store";

type MinecraftRouteStatus = "on_route" | "drift_candidate" | "drift_confirmed" | "unknown";

const routeStatus = (value: unknown): MinecraftRouteStatus => {
  if (value === "on_route" || value === "drift_candidate" || value === "drift_confirmed") return value;
  if (value === "drift" || value === "off_route") return "drift_confirmed";
  if (value === "candidate") return "drift_candidate";
  return "unknown";
};

const freshnessStatus = (value: unknown): LiveSourceFreshnessStatus | null =>
  value === "fresh" || value === "stale" || value === "missing" || value === "blocked" || value === "unknown"
    ? value
    : null;

const numberOrUndefined = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

export function normalizeMinecraftSourceEvent(input: {
  thread_id?: string | null;
  room_id?: string | null;
  environment_id?: string | null;
  source_id: string;
  binding_id?: string | null;
  job_contract_ids?: string[] | null;
  observed_at?: string | null;
  now?: Date;
  stale_after_ms?: number | null;
  freshness_status?: LiveSourceFreshnessStatus | null;
  source_label?: string | null;
  confidence?: "low" | "medium" | "high" | null;
  position?: { x?: number; y?: number; z?: number; dimension?: string } | null;
  route_state?: {
    status?: MinecraftRouteStatus | "drift" | "off_route" | "candidate" | null;
    target?: string | null;
    distance_from_route?: number | null;
  } | null;
  evidence_refs?: string[] | null;
}): LiveSourceObservation {
  const observedAt = input.observed_at ?? new Date().toISOString();
  const normalizedRouteStatus = routeStatus(input.route_state?.status);
  const hasRoute = normalizedRouteStatus !== "unknown";
  const hasPosition = Boolean(input.position);
  const freshness = evaluateLiveSourceFreshness({
    observedAt,
    now: input.now,
    staleAfterMs: input.stale_after_ms ?? 10_000,
    explicitStatus: freshnessStatus(input.freshness_status),
  });
  const eventKind = freshness.status === "missing" || freshness.status === "stale" || freshness.status === "blocked"
    ? "source_health"
    : hasRoute
      ? "route_state"
      : hasPosition
        ? "position_update"
        : "unknown";
  const summary = hasRoute
    ? `Minecraft route state: ${normalizedRouteStatus}.`
    : hasPosition
      ? "Minecraft position update observed."
      : `Minecraft source health is ${freshness.status}.`;

  const observation: LiveSourceObservation = {
    schema: LIVE_SOURCE_OBSERVATION_SCHEMA,
    observation_id: makeLiveSourceObservationId({
      sourceId: input.source_id,
      sourceKind: "minecraft_world_events",
      eventKind,
      observedAt,
      summary,
    }),
    thread_id: input.thread_id ?? undefined,
    room_id: input.room_id ?? null,
    environment_id: input.environment_id ?? null,
    source_id: input.source_id,
    binding_id: input.binding_id ?? undefined,
    job_contract_ids: input.job_contract_ids ?? [],
    source_kind: "minecraft_world_events",
    event_kind: eventKind,
    observed_at: observedAt,
    freshness,
    provenance: {
      adapter: "minecraft_source_event_normalizer",
      source_label: input.source_label ?? undefined,
      confidence: input.confidence ?? "high",
    },
    compact_summary: summary,
    payload_summary: {
      ...(input.position
        ? {
            position: {
              x: numberOrUndefined(input.position.x),
              y: numberOrUndefined(input.position.y),
              z: numberOrUndefined(input.position.z),
              dimension: input.position.dimension,
            },
          }
        : {}),
      ...(hasRoute
        ? {
            route_state: {
              status: normalizedRouteStatus,
              target: input.route_state?.target ?? undefined,
              distance_from_route: numberOrUndefined(input.route_state?.distance_from_route),
            },
          }
        : {}),
    },
    evidence_refs: input.evidence_refs ?? [],
    assistant_answer: false,
    raw_content_included: false,
  };

  return observation;
}

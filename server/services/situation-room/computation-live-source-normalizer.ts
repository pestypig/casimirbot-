import {
  HELIX_LIVE_COMPUTATION_EVENT_SCHEMA,
  type LiveComputationEvent,
} from "@shared/helix-live-computation-event";
import type { WorkstationLiveSourceEvent } from "@shared/helix-workstation-live-source";

const asNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

export function normalizeComputationLiveSourceEvent(
  event: WorkstationLiveSourceEvent,
): LiveComputationEvent | null {
  if (event.kind !== "calculator_series" && event.kind !== "physics_simulation") return null;
  const environmentId = typeof event.environment_id === "string" && event.environment_id.trim()
    ? event.environment_id.trim()
    : null;
  if (!environmentId) return null;
  const residual = asNumber(event.payload.residual);
  const tolerance = asNumber(event.payload.tolerance);
  return {
    schema: HELIX_LIVE_COMPUTATION_EVENT_SCHEMA,
    event_id: `computation:${event.event_id}`,
    source_id: event.source_id,
    environment_id: environmentId,
    seq: event.seq,
    expression: typeof event.payload.expression === "string" ? event.payload.expression : undefined,
    inputs: Object.fromEntries(
      Object.entries(event.payload)
        .filter(([, value]) => value === null || typeof value === "number" || typeof value === "string" || typeof value === "boolean")
        .slice(0, 32),
    ) as Record<string, number | string | boolean | null>,
    output: event.payload,
    ok: event.payload.ok !== false,
    error: typeof event.payload.error === "string" ? event.payload.error : null,
    tolerance,
    residual,
    stability: event.payload.stability && typeof event.payload.stability === "object"
      ? event.payload.stability as LiveComputationEvent["stability"]
      : null,
    evidence_refs: event.evidence_refs,
    ts: event.ts,
  };
}

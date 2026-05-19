import type { HelixVisualSnapshotSource } from "@shared/helix-visual-snapshot-source";
import type { HelixSituationSourceModality, HelixSituationSourceStatus } from "@shared/helix-situation-source-capability";

const TTL_BY_MODALITY_MS: Record<HelixSituationSourceModality, number | null> = {
  world_event: 60_000,
  environment_state: 30_000,
  environment_affordance: 30_000,
  visual_frame: 45_000,
  audio_transcript: 30_000,
  voice_identity: 60_000,
  text_chat: 120_000,
  calculator_stream: 30_000,
  simulation_stream: 30_000,
  procedure_graph: 120_000,
  document_context: null,
  note_context: null,
};

const parseTs = (value?: string | null): number | null => {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export function getSourceHeartbeatTtlMs(modality: HelixSituationSourceModality): number | null {
  return TTL_BY_MODALITY_MS[modality] ?? null;
}

export function resolveHeartbeatStatus(input: {
  modality: HelixSituationSourceModality;
  currentStatus: HelixSituationSourceStatus;
  lastEventTs?: string | null;
  now?: string;
  ttlMs?: number | null;
  heartbeatExempt?: boolean;
}): HelixSituationSourceStatus {
  if (input.currentStatus !== "active") return input.currentStatus;
  if (input.heartbeatExempt) return input.currentStatus;
  const ttlMs = input.ttlMs === undefined ? getSourceHeartbeatTtlMs(input.modality) : input.ttlMs;
  if (ttlMs === null) return input.currentStatus;
  const last = parseTs(input.lastEventTs);
  if (last === null) return input.currentStatus;
  const now = parseTs(input.now) ?? Date.now();
  return now - last > ttlMs ? "stale" : input.currentStatus;
}

export function isVisualHeartbeatExempt(source: Pick<HelixVisualSnapshotSource, "capture_mode">): boolean {
  return source.capture_mode === "manual";
}

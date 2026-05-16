import {
  HELIX_SITUATION_SOURCE_CAPABILITY_SCHEMA,
  type HelixSituationSourceCapability,
  type HelixSituationSourceCapabilityRead,
  type HelixSituationSourceContribution,
  type HelixSituationSourceModality,
  type HelixSituationSourceStatus,
} from "@shared/helix-situation-source-capability";
import type { WorkstationLiveSource, WorkstationLiveSourceKind } from "@shared/helix-workstation-live-source";
import type { HelixVisualSnapshotSource } from "@shared/helix-visual-snapshot-source";
import { listWorkstationLiveSources } from "./workstation-live-source-ingest";
import { listVisualFrames, listVisualSnapshotSources } from "./visual-snapshot-store";
import { isVisualHeartbeatExempt, resolveHeartbeatStatus } from "./source-heartbeat-monitor";

const explicitCapabilities = new Map<string, HelixSituationSourceCapability>();

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

const nowIso = (): string => new Date().toISOString();

const cleanString = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
};

const normalizeModality = (value: unknown): HelixSituationSourceModality => {
  if (
    value === "world_event" ||
    value === "visual_frame" ||
    value === "audio_transcript" ||
    value === "voice_identity" ||
    value === "text_chat" ||
    value === "calculator_stream" ||
    value === "simulation_stream" ||
    value === "document_context" ||
    value === "note_context"
  ) return value;
  return "text_chat";
};

const normalizeStatus = (value: unknown): HelixSituationSourceStatus => {
  if (
    value === "active" ||
    value === "waiting_for_client" ||
    value === "permission_required" ||
    value === "configured_missing" ||
    value === "stale" ||
    value === "error" ||
    value === "paused" ||
    value === "stopped"
  ) return value;
  return "configured_missing";
};

const normalizeContribution = (value: unknown): HelixSituationSourceContribution => {
  if (
    value === "place" ||
    value === "activity" ||
    value === "risk" ||
    value === "dialogue" ||
    value === "visual_scene" ||
    value === "identity" ||
    value === "calculation" ||
    value === "reference" ||
    value === "memory"
  ) return value;
  return "activity";
};

const statusFromWorkstationSource = (source: WorkstationLiveSource, now: string): HelixSituationSourceStatus => {
  if (source.status === "error" || source.status === "paused" || source.status === "stopped") return source.status;
  return resolveHeartbeatStatus({
    modality: modalityForKind(source.kind),
    currentStatus: "active",
    lastEventTs: source.last_event_ts,
    now,
  });
};

const modalityForKind = (kind: WorkstationLiveSourceKind): HelixSituationSourceModality => {
  if (kind === "minecraft_world_events") return "world_event";
  if (kind === "browser_audio_transcript") return "audio_transcript";
  if (kind === "screen_summary") return "visual_frame";
  if (kind === "calculator_series") return "calculator_stream";
  if (kind === "physics_simulation") return "simulation_stream";
  return "text_chat";
};

const contributionForModality = (modality: HelixSituationSourceModality): HelixSituationSourceContribution => {
  if (modality === "world_event") return "risk";
  if (modality === "visual_frame") return "visual_scene";
  if (modality === "audio_transcript") return "dialogue";
  if (modality === "voice_identity") return "identity";
  if (modality === "calculator_stream") return "calculation";
  if (modality === "document_context") return "reference";
  if (modality === "note_context") return "memory";
  return "activity";
};

const fidelityForStatus = (status: HelixSituationSourceStatus): number => {
  if (status === "active") return 1;
  if (status === "waiting_for_client") return 0.3;
  if (status === "stale") return 0.35;
  if (status === "permission_required" || status === "paused") return 0.2;
  return 0;
};

const capability = (input: Omit<HelixSituationSourceCapability, "schema" | "raw_content_included" | "assistant_answer">): HelixSituationSourceCapability => ({
  schema: HELIX_SITUATION_SOURCE_CAPABILITY_SCHEMA,
  ...input,
  fidelity_score: clamp01(input.fidelity_score),
  raw_content_included: false,
  assistant_answer: false,
});

const fromWorkstationSource = (source: WorkstationLiveSource, now: string): HelixSituationSourceCapability => {
  const modality = modalityForKind(source.kind);
  const status = statusFromWorkstationSource(source, now);
  return capability({
    source_id: source.source_id,
    thread_id: source.thread_id ?? "helix-ask:desktop",
    room_id: typeof source.config?.room_id === "string" ? source.config.room_id : null,
    participant_id: typeof source.config?.participant_id === "string" ? source.config.participant_id : null,
    modality,
    status,
    contribution: contributionForModality(modality),
    fidelity_score: fidelityForStatus(status),
    last_event_ts: source.last_event_ts ?? null,
    missing_reason: status === "stale" ? "No recent source heartbeat or event." : null,
    next_required_action: status === "stale" ? "send_source_heartbeat" : null,
  });
};

const fromVisualSource = (source: HelixVisualSnapshotSource, now: string): HelixSituationSourceCapability => {
  const latestFrame = listVisualFrames({ threadId: source.thread_id, limit: 100 })
    .filter((frame: { source_id?: string }) => frame.source_id === source.source_id)
    .at(-1) ?? null;
  const status = resolveHeartbeatStatus({
    modality: "visual_frame",
    currentStatus: source.status,
    lastEventTs: latestFrame?.ts ?? source.updated_at,
    now,
    heartbeatExempt: isVisualHeartbeatExempt(source),
  });
  const waitingForFirstFrame = status === "active" && !latestFrame;
  return capability({
    source_id: source.source_id,
    thread_id: source.thread_id,
    room_id: source.room_id ?? null,
    participant_id: null,
    modality: "visual_frame",
    status,
    contribution: "visual_scene",
    fidelity_score: fidelityForStatus(status),
    last_event_ts: latestFrame?.ts ?? source.updated_at,
    missing_reason: status === "permission_required"
      ? "Browser capture permission has not been granted for this visual source."
      : waitingForFirstFrame
        ? "Visual capture is active and waiting for the first frame."
      : status === "stale"
        ? "Visual source has not produced a recent frame or status update."
        : null,
    next_required_action: status === "permission_required"
      ? "grant_visual_capture_permission"
      : waitingForFirstFrame
        ? "capture_first_frame"
      : status === "stale"
        ? "capture_frame_now"
        : null,
  });
};

const missingCapability = (input: {
  threadId: string;
  roomId?: string | null;
  modality: HelixSituationSourceModality;
  reason: string;
  nextAction: string;
}): HelixSituationSourceCapability =>
  capability({
    source_id: `missing:${input.modality}:${input.threadId}`,
    thread_id: input.threadId,
    room_id: input.roomId ?? null,
    participant_id: null,
    modality: input.modality,
    status: "configured_missing",
    contribution: contributionForModality(input.modality),
    fidelity_score: 0,
    last_event_ts: null,
    missing_reason: input.reason,
    next_required_action: input.nextAction,
  });

export function registerSituationSourceCapability(input: Record<string, unknown>): HelixSituationSourceCapability {
  const threadId = cleanString(input.thread_id) ?? "helix-ask:desktop";
  const modality = normalizeModality(input.modality);
  const status = normalizeStatus(input.status);
  const sourceId = cleanString(input.source_id) ?? `${modality}:${threadId}`;
  const entry = capability({
    source_id: sourceId,
    thread_id: threadId,
    room_id: cleanString(input.room_id),
    participant_id: cleanString(input.participant_id),
    modality,
    status,
    contribution: normalizeContribution(input.contribution),
    fidelity_score: typeof input.fidelity_score === "number" ? input.fidelity_score : fidelityForStatus(status),
    last_event_ts: cleanString(input.last_event_ts),
    missing_reason: cleanString(input.missing_reason),
    next_required_action: cleanString(input.next_required_action),
  });
  explicitCapabilities.set(entry.source_id, entry);
  return entry;
}

export function updateSituationSourceCapability(input: Record<string, unknown>): HelixSituationSourceCapability | null {
  const sourceId = cleanString(input.source_id);
  if (!sourceId) return null;
  const existing = explicitCapabilities.get(sourceId);
  if (!existing) return registerSituationSourceCapability(input);
  const status = input.status ? normalizeStatus(input.status) : existing.status;
  const updated = capability({
    ...existing,
    room_id: cleanString(input.room_id) ?? existing.room_id ?? null,
    participant_id: cleanString(input.participant_id) ?? existing.participant_id ?? null,
    status,
    contribution: input.contribution ? normalizeContribution(input.contribution) : existing.contribution,
    fidelity_score: typeof input.fidelity_score === "number" ? input.fidelity_score : fidelityForStatus(status),
    last_event_ts: cleanString(input.last_event_ts) ?? existing.last_event_ts ?? null,
    missing_reason: cleanString(input.missing_reason) ?? existing.missing_reason ?? null,
    next_required_action: cleanString(input.next_required_action) ?? existing.next_required_action ?? null,
  });
  explicitCapabilities.set(updated.source_id, updated);
  return updated;
}

export function recordSituationSourceHeartbeat(input: {
  source_id: string;
  thread_id?: string | null;
  modality?: string | null;
  room_id?: string | null;
  status?: string | null;
  ts?: string | null;
}): HelixSituationSourceCapability {
  const existing = explicitCapabilities.get(input.source_id);
  const status = input.status ? normalizeStatus(input.status) : "active";
  const next = capability({
    source_id: input.source_id,
    thread_id: input.thread_id ?? existing?.thread_id ?? "helix-ask:desktop",
    room_id: input.room_id ?? existing?.room_id ?? null,
    participant_id: existing?.participant_id ?? null,
    modality: input.modality ? normalizeModality(input.modality) : existing?.modality ?? "text_chat",
    status,
    contribution: existing?.contribution ?? contributionForModality(input.modality ? normalizeModality(input.modality) : "text_chat"),
    fidelity_score: fidelityForStatus(status),
    last_event_ts: input.ts ?? nowIso(),
    missing_reason: null,
    next_required_action: null,
  });
  explicitCapabilities.set(next.source_id, next);
  return next;
}

export function buildSituationSourceCapabilities(input: {
  threadId: string;
  roomId?: string | null;
  includeDefaults?: boolean;
  now?: string;
}): HelixSituationSourceCapability[] {
  const now = input.now ?? nowIso();
  const inferred: HelixSituationSourceCapability[] = [
    ...listWorkstationLiveSources()
      .filter((source: WorkstationLiveSource) => !source.thread_id || source.thread_id === input.threadId)
      .map((source: WorkstationLiveSource) => fromWorkstationSource(source, now)),
    ...listVisualSnapshotSources({ threadId: input.threadId })
      .map((source: HelixVisualSnapshotSource) => fromVisualSource(source, now)),
    ...Array.from(explicitCapabilities.values())
      .filter((entry: HelixSituationSourceCapability) => entry.thread_id === input.threadId)
      .map((entry: HelixSituationSourceCapability) => {
        const status = resolveHeartbeatStatus({
          modality: entry.modality,
          currentStatus: entry.status,
          lastEventTs: entry.last_event_ts,
          now,
        });
        return status === entry.status
          ? entry
          : {
              ...entry,
              status,
              fidelity_score: fidelityForStatus(status),
              missing_reason: entry.missing_reason ?? "Source heartbeat is stale.",
              next_required_action: entry.next_required_action ?? "send_source_heartbeat",
            };
      }),
  ];
  const deduped = new Map<string, HelixSituationSourceCapability>();
  for (const entry of inferred) {
    if (input.roomId && entry.room_id && entry.room_id !== input.roomId) continue;
    const existing = deduped.get(entry.source_id);
    if (existing?.modality === "visual_frame" && entry.modality === "visual_frame") continue;
    deduped.set(entry.source_id, entry);
  }
  const capabilities = Array.from(deduped.values());
  if (input.includeDefaults !== false) {
    const modalities = new Set(capabilities.map((entry: HelixSituationSourceCapability) => entry.modality));
    if (!modalities.has("world_event")) {
      capabilities.push(missingCapability({
        threadId: input.threadId,
        roomId: input.roomId,
        modality: "world_event",
        reason: "No world-event source is attached or emitting.",
        nextAction: "attach_world_event_source",
      }));
    }
    if (!modalities.has("visual_frame")) {
      capabilities.push(missingCapability({
        threadId: input.threadId,
        roomId: input.roomId,
        modality: "visual_frame",
        reason: "No visual capture source is registered.",
        nextAction: "grant_visual_capture_permission",
      }));
    }
    if (!modalities.has("audio_transcript")) {
      capabilities.push(missingCapability({
        threadId: input.threadId,
        roomId: input.roomId,
        modality: "audio_transcript",
        reason: "No audio transcript source is active.",
        nextAction: "attach_audio_or_transcript_source",
      }));
    }
  }
  return capabilities.sort((a: HelixSituationSourceCapability, b: HelixSituationSourceCapability) => {
    const statusRank = (status: HelixSituationSourceStatus) => status === "active" ? 0 : status === "stale" ? 1 : status === "waiting_for_client" ? 2 : status === "permission_required" ? 3 : 4;
    return statusRank(a.status) - statusRank(b.status) || a.modality.localeCompare(b.modality) || a.source_id.localeCompare(b.source_id);
  });
}

export function readSituationSourceCapabilities(input: {
  threadId: string;
  roomId?: string | null;
}): HelixSituationSourceCapabilityRead {
  return {
    schema: "helix.situation_source_capability_read.v1",
    thread_id: input.threadId,
    room_id: input.roomId ?? null,
    capabilities: buildSituationSourceCapabilities({
      threadId: input.threadId,
      roomId: input.roomId,
    }),
    raw_content_included: false,
    assistant_answer: false,
    context_policy: "compact_context_pack_only",
  };
}

export function resetSituationSourceCapabilitiesForTest(): void {
  explicitCapabilities.clear();
}

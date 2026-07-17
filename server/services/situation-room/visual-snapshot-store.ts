import crypto from "node:crypto";
import type {
  HelixRawImageStoragePolicy,
  HelixVisualCaptureMode,
  HelixVisualSnapshotSource,
  HelixVisualSnapshotSourceFamily,
  HelixVisualSnapshotSourceReceipt,
  HelixVisualSnapshotSourceStatus,
  HelixVisualSourceSurface,
} from "@shared/helix-visual-snapshot-source";
import {
  HELIX_VISUAL_SNAPSHOT_SOURCE_SCHEMA,
} from "@shared/helix-visual-snapshot-source";
import type {
  HelixVisualFrameEvidence,
  HelixVisualFrameRecord,
  HelixVisualFrameSupportClaim,
  HelixVisualPlayerPosition,
} from "@shared/helix-visual-frame-evidence";
import {
  HELIX_VISUAL_FRAME_EVIDENCE_SCHEMA,
  HELIX_VISUAL_FRAME_RECORD_SCHEMA,
} from "@shared/helix-visual-frame-evidence";
import type { HelixVisualEventAlignment } from "@shared/helix-visual-event-alignment";
import { HELIX_VISUAL_EVENT_ALIGNMENT_SCHEMA } from "@shared/helix-visual-event-alignment";
import { enqueueStagePlayLiveSourceMailItem } from "../stage-play/stage-play-live-source-mailbox-store";
import { getLiveSourceProducer } from "./live-source-chunk-buffer";

const sourcesById = new Map<string, HelixVisualSnapshotSource>();
const framesByThread = new Map<string, HelixVisualFrameRecord[]>();
const evidenceByThread = new Map<string, HelixVisualFrameEvidence[]>();
const alignmentsByThread = new Map<string, HelixVisualEventAlignment[]>();

const nowIso = (): string => new Date().toISOString();

const compactHash = (value: unknown, length = 16): string =>
  crypto.createHash("sha256").update(typeof value === "string" ? value : JSON.stringify(value)).digest("hex").slice(0, length);

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const readNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const uniqueStrings = (value: unknown): string[] =>
  Array.isArray(value) ? Array.from(new Set(value.map((entry) => String(entry ?? "").trim()).filter(Boolean))) : [];

const readRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;

const parseStructuredVisualObserverOutput = (value: unknown): Record<string, unknown> | null => {
  const direct = readRecord(value);
  if (direct) return direct;
  const text = readString(value);
  if (!text) return null;
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return readRecord(JSON.parse(text.slice(start, end + 1)));
  } catch {
    return null;
  }
};

const normalizeCaptureMode = (value: unknown): HelixVisualCaptureMode =>
  value === "interval" || value === "salience_triggered" ? value : "manual";

const normalizeSourceSurface = (value: unknown): HelixVisualSourceSurface =>
  value === "browser_tab" ||
  value === "desktop_window" ||
  value === "screen_share_window" ||
  value === "device_camera" ||
  value === "minecraft_client_window" ||
  value === "manual_upload"
    ? value
    : "manual_upload";

const normalizeSourceFamily = (value: unknown): HelixVisualSnapshotSourceFamily =>
  value === "screen_capture" || value === "discord_screen_context" ? value : "visual_snapshot";

const normalizeStoragePolicy = (value: unknown): HelixRawImageStoragePolicy =>
  value === "debug_retained" || value === "profile_opt_in" ? value : "ephemeral";

const normalizeStatus = (value: unknown): HelixVisualSnapshotSourceStatus | null =>
  value === "permission_required" ||
  value === "active" ||
  value === "paused" ||
  value === "stopped" ||
  value === "error"
    ? value
    : null;

const playerPositionFromInput = (value: unknown): HelixVisualPlayerPosition | null => {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const worldId = readString(record.world_id);
  const x = readNumber(record.x);
  const y = readNumber(record.y);
  const z = readNumber(record.z);
  if (!worldId || x === null || y === null || z === null) return null;
  return {
    world_id: worldId,
    x,
    y,
    z,
    ...(readNumber(record.yaw) !== null ? { yaw: readNumber(record.yaw) as number } : {}),
    ...(readNumber(record.pitch) !== null ? { pitch: readNumber(record.pitch) as number } : {}),
  };
};

export function startVisualSnapshotSource(input: Record<string, unknown>): HelixVisualSnapshotSourceReceipt {
  const threadId = readString(input.thread_id) ?? "helix-ask:desktop";
  const sourceSurface = normalizeSourceSurface(input.source_surface);
  const sourceId =
    readString(input.source_id) ??
    `visual_source:${compactHash([
      threadId,
      input.room_id ?? null,
      sourceSurface,
      input.session_id ?? null,
      Date.now(),
    ])}`;
  const now = nowIso();
  const source: HelixVisualSnapshotSource = {
    schema: HELIX_VISUAL_SNAPSHOT_SOURCE_SCHEMA,
    source_id: sourceId,
    thread_id: threadId,
    room_id: readString(input.room_id),
    session_id: readString(input.session_id),
    profile_id: readString(input.profile_id),
    source_family: normalizeSourceFamily(input.source_family),
    capture_mode: normalizeCaptureMode(input.capture_mode),
    source_surface: sourceSurface,
    status: normalizeStatus(input.status) ?? "active",
    cadence_ms: readNumber(input.cadence_ms),
    raw_image_storage_policy: normalizeStoragePolicy(input.raw_image_storage_policy),
    context_policy: "compact_context_pack_only",
    raw_image_included: false,
    assistant_answer: false,
    created_at: sourcesById.get(sourceId)?.created_at ?? now,
    updated_at: now,
  };
  sourcesById.set(sourceId, source);
  return {
    schema: "helix.visual_snapshot_source_receipt.v1",
    ok: true,
    source,
    error: null,
    assistant_answer: false,
    raw_image_included: false,
    context_policy: "compact_context_pack_only",
  };
}

export function setVisualSnapshotSourceStatus(input: {
  sourceId: string;
  status: HelixVisualSnapshotSourceStatus;
}): HelixVisualSnapshotSourceReceipt {
  const source = sourcesById.get(input.sourceId);
  if (!source) {
    return {
      schema: "helix.visual_snapshot_source_receipt.v1",
      ok: false,
      source: null,
      error: "visual_source_not_found",
      assistant_answer: false,
      raw_image_included: false,
      context_policy: "compact_context_pack_only",
    };
  }
  const updated: HelixVisualSnapshotSource = {
    ...source,
    status: input.status,
    updated_at: nowIso(),
  };
  sourcesById.set(updated.source_id, updated);
  return {
    schema: "helix.visual_snapshot_source_receipt.v1",
    ok: true,
    source: updated,
    error: null,
    assistant_answer: false,
    raw_image_included: false,
    context_policy: "compact_context_pack_only",
  };
}

export function touchVisualSnapshotSource(input: {
  sourceId: string;
  status?: HelixVisualSnapshotSourceStatus | null;
  ts?: string | null;
}): HelixVisualSnapshotSource | null {
  const source = sourcesById.get(input.sourceId);
  if (!source) return null;
  const updated: HelixVisualSnapshotSource = {
    ...source,
    ...(input.status ? { status: input.status } : {}),
    updated_at: input.ts ?? nowIso(),
  };
  sourcesById.set(updated.source_id, updated);
  return updated;
}

export function updateVisualSnapshotSource(input: Record<string, unknown>): HelixVisualSnapshotSourceReceipt {
  const sourceId = readString(input.source_id);
  if (!sourceId) {
    return {
      schema: "helix.visual_snapshot_source_receipt.v1",
      ok: false,
      source: null,
      error: "missing_source_id",
      assistant_answer: false,
      raw_image_included: false,
      context_policy: "compact_context_pack_only",
    };
  }
  const existing = sourcesById.get(sourceId);
  if (!existing) return setVisualSnapshotSourceStatus({ sourceId, status: "error" });
  const status = normalizeStatus(input.status) ?? existing.status;
  const updated: HelixVisualSnapshotSource = {
    ...existing,
    capture_mode: normalizeCaptureMode(input.capture_mode ?? existing.capture_mode),
    cadence_ms: readNumber(input.cadence_ms) ?? existing.cadence_ms ?? null,
    status,
    updated_at: nowIso(),
  };
  sourcesById.set(sourceId, updated);
  return {
    schema: "helix.visual_snapshot_source_receipt.v1",
    ok: true,
    source: updated,
    error: null,
    assistant_answer: false,
    raw_image_included: false,
    context_policy: "compact_context_pack_only",
  };
}

export function recordVisualFrame(input: Record<string, unknown>): HelixVisualFrameRecord {
  const sourceId = readString(input.source_id) ?? "source:visual-snapshot";
  const source = sourcesById.get(sourceId);
  const threadId = readString(input.thread_id) ?? source?.thread_id ?? "helix-ask:desktop";
  const ts = readString(input.ts) ?? nowIso();
  const imageSha = readString(input.image_sha256) ?? (
    readString(input.image_ref)
      ? compactHash(readString(input.image_ref), 64)
      : null
  );
  const frame: HelixVisualFrameRecord = {
    schema: HELIX_VISUAL_FRAME_RECORD_SCHEMA,
    frame_id: readString(input.frame_id) ?? `visual_frame:${compactHash([sourceId, threadId, ts, imageSha ?? Date.now()])}`,
    source_id: sourceId,
    thread_id: threadId,
    room_id: readString(input.room_id) ?? source?.room_id ?? null,
    ts,
    player_position: playerPositionFromInput(input.player_position),
    related_event_refs: uniqueStrings(input.related_event_refs),
    image_ref: readString(input.image_ref),
    image_sha256: imageSha,
    mime_type: readString(input.mime_type),
    raw_image_storage_policy: source?.raw_image_storage_policy ?? normalizeStoragePolicy(input.raw_image_storage_policy),
    raw_image_included: false,
    assistant_answer: false,
    context_policy: "compact_context_pack_only",
  };
  const existing = framesByThread.get(threadId) ?? [];
  framesByThread.set(threadId, [...existing.filter((entry) => entry.frame_id !== frame.frame_id), frame].slice(-500));
  if (source) {
    touchVisualSnapshotSource({ sourceId: source.source_id, status: "active", ts: frame.ts });
  }
  return frame;
}

export function analyzeVisualFrame(input: Record<string, unknown>): HelixVisualFrameEvidence {
  const threadId = readString(input.thread_id) ?? "helix-ask:desktop";
  const frameId = readString(input.frame_id);
  const frame = frameId ? getVisualFrame({ threadId, frameId }) : getLatestVisualFrame({ threadId });
  if (!frame) {
    throw new Error("visual_frame_not_found");
  }
  const supportClaims = Array.isArray(input.supports_claims)
    ? input.supports_claims.map((entry): HelixVisualFrameSupportClaim | null => {
        if (!entry || typeof entry !== "object") return null;
        const record = entry as Record<string, unknown>;
        const claim = readString(record.claim);
        if (!claim) return null;
        const status = record.support_status === "supports" ||
          record.support_status === "contradicts" ||
          record.support_status === "partial" ||
          record.support_status === "unknown"
          ? record.support_status
          : "unknown";
        return {
          claim,
          support_status: status,
          confidence: readNumber(record.confidence) ?? 0.5,
        };
      }).filter((entry): entry is HelixVisualFrameSupportClaim => Boolean(entry))
    : [];
  const evidence: HelixVisualFrameEvidence = {
    schema: HELIX_VISUAL_FRAME_EVIDENCE_SCHEMA,
    frame_id: frame.frame_id,
    evidence_id: readString(input.evidence_id) ?? `visual_evidence:${compactHash([frame.frame_id, input.summary ?? "", Date.now()])}`,
    source_id: frame.source_id,
    thread_id: frame.thread_id,
    ts: readString(input.ts) ?? nowIso(),
    player_position: frame.player_position ?? null,
    related_event_refs: uniqueStrings(input.related_event_refs).length > 0
      ? uniqueStrings(input.related_event_refs)
      : frame.related_event_refs,
    image_model: readString(input.image_model) ?? "external_visual_summary",
    model_invoked: true,
    summary: readString(input.summary) ?? "Visual frame analysis recorded.",
    detected_objects: uniqueStrings(input.detected_objects),
    detected_scene_relations: uniqueStrings(input.detected_scene_relations),
    uncertainty: uniqueStrings(input.uncertainty),
    supports_claims: supportClaims,
    visual_observer_profile_id: readString(input.visual_observer_profile_id) ?? readString(input.visualObserverProfileId),
    visual_observer_profile_title: readString(input.visual_observer_profile_title) ?? readString(input.visualObserverProfileTitle),
    visual_prompt_hash: readString(input.visual_prompt_hash) ?? readString(input.visualPromptHash),
    visual_output_mode: readString(input.visual_output_mode) ?? readString(input.visualOutputMode),
    visual_observer_structured_output:
      parseStructuredVisualObserverOutput(input.visual_observer_structured_output) ??
      parseStructuredVisualObserverOutput(input.visualObserverStructuredOutput) ??
      parseStructuredVisualObserverOutput(input.summary),
    raw_image_included: false,
    assistant_answer: false,
    context_policy: "compact_context_pack_only",
  };
  const existing = evidenceByThread.get(frame.thread_id) ?? [];
  evidenceByThread.set(frame.thread_id, [...existing.filter((entry) => entry.evidence_id !== evidence.evidence_id), evidence].slice(-500));
  touchVisualSnapshotSource({ sourceId: frame.source_id, status: "active", ts: evidence.ts });
  const source = sourcesById.get(evidence.source_id) ?? null;
  const liveSourceProducer = getLiveSourceProducer(evidence.source_id);
  const captureIntervalMs =
    source?.capture_mode === "interval" && source.cadence_ms
      ? source.cadence_ms
      : liveSourceProducer?.capture_mode === "interval" && liveSourceProducer.cadence_ms
        ? liveSourceProducer.cadence_ms
        : null;
  enqueueStagePlayLiveSourceMailItem({
    threadId: evidence.thread_id,
    roomId: frame.room_id ?? null,
    sourceId: evidence.source_id,
    sourceKind: "visual_frame",
    frameRef: evidence.frame_id,
    evidenceRef: evidence.evidence_id,
    summaryText: evidence.summary,
    confidence: evidence.supports_claims[0]?.confidence ?? null,
    analysisState: "analysis_ready",
    evidenceRefs: [
      evidence.source_id,
      evidence.frame_id,
      evidence.evidence_id,
      evidence.visual_observer_profile_id,
      evidence.visual_prompt_hash ? `visual_prompt_hash:${evidence.visual_prompt_hash}` : null,
    ].filter((ref): ref is string => Boolean(ref)),
    captureIntervalMs,
    createdAt: evidence.ts,
  });
  return evidence;
}

export function alignVisualFrameWithEvents(input: Record<string, unknown>): HelixVisualEventAlignment {
  const threadId = readString(input.thread_id) ?? "helix-ask:desktop";
  const frameIds = uniqueStrings(input.frame_ids);
  const latestFrame = getLatestVisualFrame({ threadId });
  const selectedFrameIds = frameIds.length > 0 ? frameIds : latestFrame ? [latestFrame.frame_id] : [];
  const alignment: HelixVisualEventAlignment = {
    schema: HELIX_VISUAL_EVENT_ALIGNMENT_SCHEMA,
    alignment_id: readString(input.alignment_id) ?? `visual_alignment:${compactHash([threadId, selectedFrameIds, input.event_refs ?? [], Date.now()])}`,
    thread_id: threadId,
    frame_ids: selectedFrameIds,
    event_refs: uniqueStrings(input.event_refs),
    place_id: readString(input.place_id),
    summary: readString(input.summary) ?? "Visual frame and event window were aligned as compact evidence.",
    confidence: readNumber(input.confidence) ?? 0.5,
    missing_evidence: uniqueStrings(input.missing_evidence),
    assistant_answer: false,
    raw_image_included: false,
    context_policy: "compact_context_pack_only",
  };
  const existing = alignmentsByThread.get(threadId) ?? [];
  alignmentsByThread.set(threadId, [...existing.filter((entry) => entry.alignment_id !== alignment.alignment_id), alignment].slice(-500));
  return alignment;
}

export function getVisualSnapshotSource(sourceId: string): HelixVisualSnapshotSource | null {
  return sourcesById.get(sourceId) ?? null;
}

export function listVisualSnapshotSources(input: { threadId?: string | null; status?: string | null } = {}): HelixVisualSnapshotSource[] {
  return Array.from(sourcesById.values()).filter((source) => {
    if (input.threadId && source.thread_id !== input.threadId) return false;
    if (input.status && source.status !== input.status) return false;
    return true;
  });
}

export function getVisualFrame(input: { threadId: string; frameId: string }): HelixVisualFrameRecord | null {
  return (framesByThread.get(input.threadId) ?? []).find((frame) => frame.frame_id === input.frameId) ?? null;
}

export function getLatestVisualFrame(input: { threadId: string }): HelixVisualFrameRecord | null {
  return (framesByThread.get(input.threadId) ?? []).at(-1) ?? null;
}

export function listVisualFrames(input: { threadId?: string | null; limit?: number } = {}): HelixVisualFrameRecord[] {
  const entries = input.threadId
    ? [...(framesByThread.get(input.threadId) ?? [])]
    : Array.from(framesByThread.values()).flat();
  return entries.slice(-(input.limit ?? 100));
}

export function listVisualFrameEvidence(input: { threadId?: string | null; limit?: number } = {}): HelixVisualFrameEvidence[] {
  const entries = input.threadId
    ? [...(evidenceByThread.get(input.threadId) ?? [])]
    : Array.from(evidenceByThread.values()).flat();
  return entries.slice(-(input.limit ?? 100));
}

export function listVisualEventAlignments(input: { threadId?: string | null; limit?: number } = {}): HelixVisualEventAlignment[] {
  const entries = input.threadId
    ? [...(alignmentsByThread.get(input.threadId) ?? [])]
    : Array.from(alignmentsByThread.values()).flat();
  return entries.slice(-(input.limit ?? 100));
}

export function resetVisualSnapshotStoreForTest(): void {
  sourcesById.clear();
  framesByThread.clear();
  evidenceByThread.clear();
  alignmentsByThread.clear();
}

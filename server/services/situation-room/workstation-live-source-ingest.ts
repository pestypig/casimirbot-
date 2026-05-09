import crypto from "node:crypto";
import {
  HELIX_WORKSTATION_LIVE_SOURCE_EVENT_SCHEMA,
  HELIX_WORKSTATION_LIVE_SOURCE_SCHEMA,
  type WorkstationLiveSource,
  type WorkstationLiveSourceFamily,
  type WorkstationLiveSourceEvent,
  type WorkstationLiveSourceKind,
} from "@shared/helix-workstation-live-source";
import type { LiveComputationEvent } from "@shared/helix-live-computation-event";
import type {
  LiveAnswerEnvironment,
  LiveAnswerEnvironmentDelta,
} from "@shared/helix-live-answer-environment";
import {
  getActiveLiveAnswerEnvironmentForSource,
  getLiveAnswerEnvironment,
} from "./live-answer-environment-store";
import { normalizeComputationLiveSourceEvent } from "./computation-live-source-normalizer";
import { reduceLiveAnswerEnvironmentFromSourceEvent } from "./live-answer-environment-reducer";

const sources = new Map<string, WorkstationLiveSource>();
const eventsBySource = new Map<string, WorkstationLiveSourceEvent[]>();

const stableJson = (value: unknown): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key: string) => `${JSON.stringify(key)}:${stableJson(record[key])}`).join(",")}}`;
};

const hashShort = (value: unknown, size = 16): string =>
  crypto.createHash("sha256").update(stableJson(value)).digest("hex").slice(0, size);

const cleanString = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
};

const normalizeKind = (value: unknown): WorkstationLiveSourceKind => {
  if (
    value === "minecraft_world_events" ||
    value === "minecraft_world" ||
    value === "calculator_series" ||
    value === "calculator_stream" ||
    value === "physics_simulation" ||
    value === "browser_audio_transcript" ||
    value === "browser_audio" ||
    value === "screen_summary" ||
    value === "manual_feed" ||
    value === "manual_debug" ||
    value === "custom_panel"
  ) {
    if (value === "minecraft_world") return "minecraft_world_events";
    if (value === "calculator_stream") return "calculator_series";
    if (value === "browser_audio") return "browser_audio_transcript";
    if (value === "manual_debug") return "manual_feed";
    return value;
  }
  return "custom_panel";
};

const sourceFamilyForKind = (kind: WorkstationLiveSourceKind): WorkstationLiveSourceFamily => {
  if (kind === "minecraft_world_events") return "minecraft_world";
  if (kind === "calculator_series") return "calculator_stream";
  if (kind === "physics_simulation") return "physics_simulation";
  if (kind === "browser_audio_transcript") return "browser_audio";
  if (kind === "screen_summary") return "screen_summary";
  return "manual_debug";
};

export function upsertWorkstationLiveSource(input: {
  source_id: string;
  kind: WorkstationLiveSourceKind | string;
  panel_id?: string | null;
  thread_id?: string | null;
  environment_id?: string | null;
  tick_rate_ms?: number | null;
  config?: Record<string, unknown>;
  now?: string;
}): WorkstationLiveSource {
  const now = input.now ?? new Date().toISOString();
  const sourceId = cleanString(input.source_id) ?? `source:live:${hashShort([input.kind, input.environment_id, now], 12)}`;
  const existing = sources.get(sourceId);
  const source: WorkstationLiveSource = {
    schema: HELIX_WORKSTATION_LIVE_SOURCE_SCHEMA,
    source_id: sourceId,
    kind: normalizeKind(input.kind),
    panel_id: cleanString(input.panel_id),
    thread_id: cleanString(input.thread_id) ?? existing?.thread_id ?? null,
    environment_id: cleanString(input.environment_id) ?? existing?.environment_id ?? null,
    status: "active",
    tick_rate_ms: typeof input.tick_rate_ms === "number" && Number.isFinite(input.tick_rate_ms) ? input.tick_rate_ms : existing?.tick_rate_ms ?? null,
    config: { ...(existing?.config ?? {}), ...(input.config ?? {}) },
    created_at: existing?.created_at ?? now,
    updated_at: now,
  };
  sources.set(sourceId, source);
  return source;
}

export function ingestWorkstationLiveSourceEvent(input: {
  source_id: string;
  kind: WorkstationLiveSourceKind | string;
  event_type: string;
  payload?: Record<string, unknown>;
  environment_id?: string | null;
  seq?: number;
  ts?: string;
  panel_id?: string | null;
  thread_id?: string | null;
  trace?: Record<string, unknown> | null;
  evidence_refs?: string[];
}): {
  ok: boolean;
  source: WorkstationLiveSource;
  event: WorkstationLiveSourceEvent;
  computation_event: LiveComputationEvent | null;
  live_answer_environment: LiveAnswerEnvironment | null;
  live_answer_environment_delta: LiveAnswerEnvironmentDelta | null;
} {
  const ts = input.ts ?? new Date().toISOString();
  const kind = normalizeKind(input.kind);
  const payload = input.payload ?? {};
  const source = upsertWorkstationLiveSource({
    source_id: input.source_id,
    kind,
    panel_id: input.panel_id,
    thread_id: input.thread_id,
    environment_id: input.environment_id,
    config: {},
    now: ts,
  });
  const environment =
    (input.environment_id ? getLiveAnswerEnvironment(input.environment_id) : null) ??
    (source.environment_id ? getLiveAnswerEnvironment(source.environment_id) : null) ??
    getActiveLiveAnswerEnvironmentForSource(source.source_id);
  const seq = typeof input.seq === "number" && Number.isFinite(input.seq)
    ? Math.trunc(input.seq)
    : (eventsBySource.get(source.source_id)?.length ?? 0) + 1;
  const event: WorkstationLiveSourceEvent = {
    schema: HELIX_WORKSTATION_LIVE_SOURCE_EVENT_SCHEMA,
    event_id: `live_source_event:${hashShort([source.source_id, environment?.environment_id ?? null, seq, input.event_type, payload], 18)}`,
    source_event_id: `live_source_event:${hashShort([source.source_id, environment?.environment_id ?? null, seq, input.event_type, payload], 18)}`,
    source_id: source.source_id,
    environment_id: environment?.environment_id ?? source.environment_id ?? null,
    thread_id: environment?.thread_id ?? source.thread_id ?? cleanString(input.thread_id),
    seq,
    tick_index: seq,
    ts,
    kind,
    source_family: sourceFamilyForKind(kind),
    event_type: cleanString(input.event_type) ?? "source_tick",
    payload,
    evidence_refs: Array.from(new Set([...(input.evidence_refs ?? []), `source:${source.source_id}:seq:${seq}`])).slice(-24),
    deterministic: input.trace?.deterministic === false ? false : true,
    trace: input.trace ?? null,
  };
  eventsBySource.set(source.source_id, [...(eventsBySource.get(source.source_id) ?? []), event].slice(-256));
  const computationEvent = normalizeComputationLiveSourceEvent(event);
  const reduction = reduceLiveAnswerEnvironmentFromSourceEvent({
    environment,
    event,
    computationEvent,
    now: ts,
  });
  return {
    ok: true,
    source,
    event,
    computation_event: computationEvent,
    live_answer_environment: reduction?.environment ?? environment,
    live_answer_environment_delta: reduction?.delta ?? null,
  };
}

export function listWorkstationLiveSources(): WorkstationLiveSource[] {
  return Array.from(sources.values()).sort((a: WorkstationLiveSource, b: WorkstationLiveSource) => b.updated_at.localeCompare(a.updated_at));
}

export function listWorkstationLiveSourceEvents(sourceId?: string | null): WorkstationLiveSourceEvent[] {
  if (sourceId) return eventsBySource.get(sourceId) ?? [];
  return Array.from(eventsBySource.values()).flat().sort((a: WorkstationLiveSourceEvent, b: WorkstationLiveSourceEvent) => a.ts.localeCompare(b.ts));
}

export function setWorkstationLiveSourceStatus(input: {
  source_id: string;
  status: WorkstationLiveSource["status"];
  now?: string;
}): WorkstationLiveSource | null {
  const existing = sources.get(input.source_id);
  if (!existing) return null;
  const next: WorkstationLiveSource = {
    ...existing,
    status: input.status,
    updated_at: input.now ?? new Date().toISOString(),
  };
  sources.set(next.source_id, next);
  return next;
}

export function resetWorkstationLiveSources(): void {
  sources.clear();
  eventsBySource.clear();
}

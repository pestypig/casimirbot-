import crypto from "node:crypto";
import {
  HELIX_WORKSTATION_LIVE_SOURCE_EVENT_SCHEMA,
  HELIX_WORKSTATION_LIVE_SOURCE_SCHEMA,
  type WorkstationLiveSource,
  type WorkstationLiveSourceFamily,
  type WorkstationLiveSourceEvent,
  type WorkstationLiveSourceKind,
  type LiveSourceWindowPolicy,
  type LiveSourceWindowSummary,
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
import { listLiveWorkstationPipelinesForSource } from "./live-workstation-pipeline-store";
import { runLiveTransformsForSourceEvent } from "./live-transform-runner";
import { runLiveOutputSinks } from "./live-output-sink-runner";
import type { LiveTransformResult } from "@shared/helix-live-transform";
import type { LiveOutputSinkReceipt } from "@shared/helix-live-output-sink";
import { recordLiveCommentaryForDelta } from "./live-commentary";
import type {
  LiveCommentaryDeliveryReceipt,
  LiveCommentaryProposal,
  LiveCommentarySession,
} from "@shared/helix-live-commentary";

const sources = new Map<string, WorkstationLiveSource>();
const eventsBySource = new Map<string, WorkstationLiveSourceEvent[]>();
const windowsBySource = new Map<string, LiveSourceWindowSummary[]>();

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

const defaultWindowPolicyForKind = (kind: WorkstationLiveSourceKind): LiveSourceWindowPolicy => {
  if (kind === "physics_simulation") {
    return {
      window_ms: 5000,
      max_events_per_window: 20,
      emit_line_delta_on: "window_close",
      max_thread_appends_per_minute: 6,
    };
  }
  if (kind === "calculator_series") {
    return {
      window_ms: 5000,
      max_events_per_window: 20,
      emit_line_delta_on: "value_changed",
      max_thread_appends_per_minute: 12,
    };
  }
  return {
    window_ms: 5000,
    max_events_per_window: 20,
    emit_line_delta_on: "salience_only",
    max_thread_appends_per_minute: 6,
  };
};

const numberFromConfig = (config: Record<string, unknown>, key: string, fallback: number): number => {
  const value = config[key];
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : fallback;
};

const windowPolicyForSource = (source: WorkstationLiveSource): LiveSourceWindowPolicy => {
  const fallback = defaultWindowPolicyForKind(source.kind);
  const configured = source.config?.window_policy && typeof source.config.window_policy === "object"
    ? source.config.window_policy as Record<string, unknown>
    : {};
  const emit = configured.emit_line_delta_on;
  return {
    window_ms: numberFromConfig(configured, "window_ms", fallback.window_ms),
    max_events_per_window: numberFromConfig(configured, "max_events_per_window", fallback.max_events_per_window),
    emit_line_delta_on:
      emit === "every_tick" || emit === "value_changed" || emit === "window_close" || emit === "salience_only"
        ? emit
        : fallback.emit_line_delta_on,
    max_thread_appends_per_minute: numberFromConfig(configured, "max_thread_appends_per_minute", fallback.max_thread_appends_per_minute),
  };
};

const updateWindowSummary = (source: WorkstationLiveSource, ts: string, seq: number, evidenceRefs: string[]): LiveSourceWindowSummary => {
  const policy = windowPolicyForSource(source);
  const tsMs = Date.parse(ts);
  const safeTsMs = Number.isFinite(tsMs) ? tsMs : Date.now();
  const windowStartMs = Math.floor(safeTsMs / policy.window_ms) * policy.window_ms;
  const windowId = `live_window:${hashShort([source.source_id, source.environment_id ?? null, windowStartMs], 16)}`;
  const existing = windowsBySource.get(source.source_id) ?? [];
  const previous = existing.find((window: LiveSourceWindowSummary) => window.window_id === windowId);
  const summary: LiveSourceWindowSummary = {
    window_id: windowId,
    source_id: source.source_id,
    environment_id: source.environment_id ?? null,
    from_ts: new Date(windowStartMs).toISOString(),
    to_ts: ts,
    event_count: (previous?.event_count ?? 0) + 1,
    window_count: existing.some((window: LiveSourceWindowSummary) => window.window_id === windowId)
      ? existing.findIndex((window: LiveSourceWindowSummary) => window.window_id === windowId) + 1
      : existing.length + 1,
    policy,
    evidence_refs: Array.from(new Set([...(previous?.evidence_refs ?? []), ...evidenceRefs, `source:${source.source_id}:seq:${seq}`])).slice(-24),
  };
  windowsBySource.set(source.source_id, [
    ...existing.filter((window: LiveSourceWindowSummary) => window.window_id !== windowId),
    summary,
  ].slice(-64));
  return summary;
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
    status: existing?.status ?? "active",
    tick_rate_ms: typeof input.tick_rate_ms === "number" && Number.isFinite(input.tick_rate_ms) ? input.tick_rate_ms : existing?.tick_rate_ms ?? null,
    config: { ...(existing?.config ?? {}), ...(input.config ?? {}) },
    run_id: existing?.run_id ?? `live_source_run:${hashShort([sourceId, input.environment_id ?? null, now], 14)}`,
    last_tick_index: existing?.last_tick_index ?? null,
    last_event_ts: existing?.last_event_ts ?? null,
    event_count: existing?.event_count ?? 0,
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
  live_commentary?: {
    session: LiveCommentarySession;
    proposal: LiveCommentaryProposal;
    delivery: LiveCommentaryDeliveryReceipt;
    turn_id?: string | null;
  } | null;
  pipeline_results?: Array<{
    pipeline_id: string;
    transform_results: LiveTransformResult[];
    sink_receipts: LiveOutputSinkReceipt[];
  }>;
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
  if (source.status === "paused" || source.status === "stopped") {
    const event: WorkstationLiveSourceEvent = {
      schema: HELIX_WORKSTATION_LIVE_SOURCE_EVENT_SCHEMA,
      event_id: `live_source_event:${hashShort([source.source_id, source.status, seq, input.event_type, payload], 18)}`,
      source_event_id: `live_source_event:${hashShort([source.source_id, source.status, seq, input.event_type, payload], 18)}`,
      source_id: source.source_id,
      environment_id: environment?.environment_id ?? source.environment_id ?? null,
      thread_id: environment?.thread_id ?? source.thread_id ?? cleanString(input.thread_id),
      seq,
      tick_index: seq,
      ts,
      kind,
      source_family: sourceFamilyForKind(kind),
      event_type: "source_tick_suppressed",
      payload: { status: source.status, original_event_type: input.event_type },
      evidence_refs: [`source:${source.source_id}:suppressed:${seq}`],
      deterministic: true,
      window_id: null,
      window_event_count: null,
      trace: { suppressed_reason: `source_${source.status}` },
    };
    eventsBySource.set(source.source_id, [...(eventsBySource.get(source.source_id) ?? []), event].slice(-256));
    return {
      ok: true,
      source,
      event,
      computation_event: null,
      live_answer_environment: environment,
      live_answer_environment_delta: null,
      pipeline_results: [],
    };
  }
  const baseEvidenceRefs = Array.from(new Set([...(input.evidence_refs ?? []), `source:${source.source_id}:seq:${seq}`])).slice(-24);
  const windowSummary = updateWindowSummary(source, ts, seq, baseEvidenceRefs);
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
    evidence_refs: baseEvidenceRefs,
    deterministic: input.trace?.deterministic === false ? false : true,
    window_id: windowSummary.window_id,
    window_event_count: windowSummary.event_count,
    trace: {
      ...(input.trace ?? {}),
      window_id: windowSummary.window_id,
      window_count: windowSummary.window_count,
      window_event_count: windowSummary.event_count,
      window_policy: windowSummary.policy,
    },
  };
  eventsBySource.set(source.source_id, [...(eventsBySource.get(source.source_id) ?? []), event].slice(-256));
  sources.set(source.source_id, {
    ...source,
    last_tick_index: seq,
    last_event_ts: ts,
    event_count: (source.event_count ?? 0) + 1,
    updated_at: ts,
  });
  const computationEvent = normalizeComputationLiveSourceEvent(event);
  const reduction = reduceLiveAnswerEnvironmentFromSourceEvent({
    environment,
    event,
    computationEvent,
    now: ts,
  });
  const liveCommentary = reduction?.delta
    ? recordLiveCommentaryForDelta({
        delta: reduction.delta,
        appendThread: reduction.delta.environment_snapshot.status === "active",
      })
    : null;
  const pipelineResults = listLiveWorkstationPipelinesForSource(source.source_id).map((pipeline) => {
    const transformResults = runLiveTransformsForSourceEvent({
      pipeline,
      event,
      now: ts,
    });
    const sinkReceipts = runLiveOutputSinks({
      pipeline,
      results: transformResults,
      now: ts,
    });
    return {
      pipeline_id: pipeline.pipeline_id,
      transform_results: transformResults,
      sink_receipts: sinkReceipts,
    };
  });
  return {
    ok: true,
    source,
    event,
    computation_event: computationEvent,
    live_answer_environment: reduction?.environment ?? environment,
    live_answer_environment_delta: reduction?.delta ?? null,
    live_commentary: liveCommentary,
    pipeline_results: pipelineResults,
  };
}

export function listWorkstationLiveSources(): WorkstationLiveSource[] {
  return Array.from(sources.values()).sort((a: WorkstationLiveSource, b: WorkstationLiveSource) => b.updated_at.localeCompare(a.updated_at));
}

export function listWorkstationLiveSourceEvents(sourceId?: string | null): WorkstationLiveSourceEvent[] {
  if (sourceId) return eventsBySource.get(sourceId) ?? [];
  return Array.from(eventsBySource.values()).flat().sort((a: WorkstationLiveSourceEvent, b: WorkstationLiveSourceEvent) => a.ts.localeCompare(b.ts));
}

export function listWorkstationLiveSourceWindows(sourceId?: string | null): LiveSourceWindowSummary[] {
  if (sourceId) return windowsBySource.get(sourceId) ?? [];
  return Array.from(windowsBySource.values()).flat().sort((a: LiveSourceWindowSummary, b: LiveSourceWindowSummary) => a.from_ts.localeCompare(b.from_ts));
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

export function setWorkstationLiveSourceTickRate(input: {
  source_id: string;
  tick_rate_ms: number;
  now?: string;
}): WorkstationLiveSource | null {
  const existing = sources.get(input.source_id);
  if (!existing) return null;
  const next: WorkstationLiveSource = {
    ...existing,
    tick_rate_ms: Number.isFinite(input.tick_rate_ms) && input.tick_rate_ms > 0 ? Math.trunc(input.tick_rate_ms) : existing.tick_rate_ms,
    updated_at: input.now ?? new Date().toISOString(),
  };
  sources.set(next.source_id, next);
  return next;
}

export function resetWorkstationLiveSourceCounters(input: {
  source_id: string;
  now?: string;
}): WorkstationLiveSource | null {
  const existing = sources.get(input.source_id);
  if (!existing) return null;
  const now = input.now ?? new Date().toISOString();
  eventsBySource.set(existing.source_id, []);
  windowsBySource.set(existing.source_id, []);
  const next: WorkstationLiveSource = {
    ...existing,
    run_id: `live_source_run:${hashShort([existing.source_id, existing.environment_id ?? null, now], 14)}`,
    last_tick_index: null,
    last_event_ts: null,
    event_count: 0,
    updated_at: now,
  };
  sources.set(next.source_id, next);
  return next;
}

export function resetWorkstationLiveSources(): void {
  sources.clear();
  eventsBySource.clear();
  windowsBySource.clear();
}

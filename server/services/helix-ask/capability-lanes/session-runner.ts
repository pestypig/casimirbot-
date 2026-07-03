import {
  HELIX_CAPABILITY_LANE_IDS,
  type HelixCapabilityLaneId,
} from "@shared/helix-capability-lane";
import type {
  HelixCapabilityLaneSessionCall,
  HelixCapabilityLaneSessionDebugSummary,
  HelixCapabilityLaneSessionEventAction,
  HelixCapabilityLaneSessionResult,
  HelixCapabilityLaneSessionSourceBinding,
} from "@shared/helix-capability-lane-session";
import type { HelixAgentProvider } from "../agent-providers/types";
import {
  buildHelixCapabilityLaneSessionDebugSummaries,
} from "./session-summary";
import {
  helixCapabilityLaneSessionStore,
  type HelixCapabilityLaneSessionStore,
} from "./session-manager";

type RecordLike = Record<string, unknown>;

export type HelixCapabilityLaneSessionRunnerResult = {
  schema: "helix.capability_lane.session_runner_result.v1";
  requested: boolean;
  session_results: HelixCapabilityLaneSessionResult[];
  session_debug_summaries: HelixCapabilityLaneSessionDebugSummary[];
  debug_projection: {
    capability_lane_session_results: HelixCapabilityLaneSessionResult[];
    capability_lane_session_debug_summaries: HelixCapabilityLaneSessionDebugSummary[];
  };
  terminal_eligible: false;
  assistant_answer: false;
  raw_content_included: false;
};

const laneIds = new Set<string>(HELIX_CAPABILITY_LANE_IDS);

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as RecordLike) : null;

const readString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const readNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const readBoolean = (value: unknown): boolean | null =>
  typeof value === "boolean" ? value : null;

const readAction = (value: unknown): HelixCapabilityLaneSessionEventAction | null => {
  const text = readString(value).toLowerCase();
  return text === "start" ||
    text === "pause" ||
    text === "resume" ||
    text === "stop" ||
    text === "record_observation"
    ? text
    : null;
};

const readLaneId = (value: unknown): HelixCapabilityLaneId | null => {
  const text = readString(value);
  return laneIds.has(text) ? (text as HelixCapabilityLaneId) : null;
};

const readSourceKind = (
  value: unknown,
): HelixCapabilityLaneSessionSourceBinding["source_kind"] => {
  const text = readString(value).toLowerCase();
  if (
    text === "docs" ||
    text === "docs_hover" ||
    text === "docs_selection" ||
    text === "audio" ||
    text === "visual" ||
    text === "ask_turn"
  ) {
    return text;
  }
  return "unknown";
};

const readSourceBinding = (value: unknown): HelixCapabilityLaneSessionSourceBinding => {
  const record = readRecord(value);
  return {
    source_id: readString(record?.source_id ?? record?.sourceId),
    source_hash:
      readString(record?.source_hash ?? record?.sourceHash) || null,
    source_kind: readSourceKind(record?.source_kind ?? record?.sourceKind),
    projection_target:
      readString(record?.projection_target ?? record?.projectionTarget) || null,
    account_locale:
      readString(record?.account_locale ?? record?.accountLocale) || null,
    target_language:
      readString(record?.target_language ?? record?.targetLanguage) || null,
  };
};

const readStructuredSessionCalls = (body: RecordLike): HelixCapabilityLaneSessionCall[] => {
  const candidate =
    body.capability_lane_session_call ??
    body.capabilityLaneSessionCall ??
    body.lane_session_call ??
    body.laneSessionCall;
  const rawCalls = Array.isArray(candidate) ? candidate : [candidate];
  return rawCalls
    .map((entry) => readRecord(entry))
    .filter((entry): entry is RecordLike => Boolean(entry))
    .map((entry) => ({
      action: readAction(entry.action) ?? "start",
      lane_id: readLaneId(entry.lane_id ?? entry.laneId),
      lane_session_id: readString(entry.lane_session_id ?? entry.laneSessionId) || null,
      requested_backend_provider:
        readString(entry.requested_backend_provider ?? entry.requestedBackendProvider) || null,
      source_binding: readSourceBinding(entry.source_binding ?? entry.sourceBinding),
      source_id: readString(entry.source_id ?? entry.sourceId) || null,
      observation_ref: readString(entry.observation_ref ?? entry.observationRef) || null,
      receipt_ref: readString(entry.receipt_ref ?? entry.receiptRef) || null,
      chunk_id: readString(entry.chunk_id ?? entry.chunkId) || null,
      chunk_index: readNumber(entry.chunk_index ?? entry.chunkIndex),
      dedupe_key: readString(entry.dedupe_key ?? entry.dedupeKey) || null,
      source_event_id: readString(entry.source_event_id ?? entry.sourceEventId) || null,
      source_event_ms: readNumber(entry.source_event_ms ?? entry.sourceEventMs),
      observed_at_ms: readNumber(entry.observed_at_ms ?? entry.observedAtMs),
      freshness_status: readString(entry.freshness_status ?? entry.freshnessStatus) || null,
      source_text_hash: readString(entry.source_text_hash ?? entry.sourceTextHash) || null,
      source_text_char_count: readNumber(entry.source_text_char_count ?? entry.sourceTextCharCount),
      projection_target: readString(entry.projection_target ?? entry.projectionTarget) || null,
      cancel_requested: readBoolean(entry.cancel_requested ?? entry.cancelRequested),
      reason: readString(entry.reason) || null,
      now_ms: readNumber(entry.now_ms ?? entry.nowMs),
    }));
};

const blocked = (
  action: HelixCapabilityLaneSessionEventAction,
  blockedReason: string,
  metadata: Partial<Pick<
    HelixCapabilityLaneSessionResult,
    "lane_id" | "selected_runtime_agent_provider" | "requested_backend_provider" | "session_supported"
  >> = {},
): HelixCapabilityLaneSessionResult => ({
  ok: false,
  action,
  ...metadata,
  lane_session: null,
  blocked_reason: blockedReason,
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
});

export const runHelixCapabilityLaneSessionRequests = (input: {
  provider: HelixAgentProvider;
  body: Record<string, unknown>;
  env?: NodeJS.ProcessEnv;
  store?: HelixCapabilityLaneSessionStore;
}): HelixCapabilityLaneSessionRunnerResult => {
  const store = input.store ?? helixCapabilityLaneSessionStore;
  const calls = readStructuredSessionCalls(input.body);
  const results: HelixCapabilityLaneSessionResult[] = [];

  for (const call of calls) {
    const action = call.action;
    const blockedMetadata = {
      lane_id: call.lane_id ?? null,
      selected_runtime_agent_provider: input.provider.id,
      requested_backend_provider: call.requested_backend_provider ?? null,
      session_supported: null,
    };
    if (input.provider.supports.capabilityLaneSessions !== true) {
      results.push(blocked(action, "runtime_provider_capability_lane_sessions_not_supported", blockedMetadata));
      continue;
    }
    if (action === "start") {
      if (!call.lane_id) {
        results.push(blocked("start", "missing_capability_lane", blockedMetadata));
        continue;
      }
      results.push(store.start({
        provider: input.provider,
        laneId: call.lane_id,
        laneSessionId: call.lane_session_id,
        sourceBinding: readSourceBinding(call.source_binding),
        requestedBackendProvider: call.requested_backend_provider,
        nowMs: call.now_ms ?? undefined,
        env: input.env,
      }));
      continue;
    }

    const laneSessionId = readString(call.lane_session_id);
    if (!laneSessionId) {
      results.push(blocked(action, "missing_lane_session_id", blockedMetadata));
      continue;
    }
    if (action === "pause") {
      results.push(store.pause({
        laneSessionId,
        nowMs: call.now_ms ?? undefined,
        reason: call.reason,
      }));
    } else if (action === "resume") {
      results.push(store.resume({
        laneSessionId,
        nowMs: call.now_ms ?? undefined,
        reason: call.reason,
      }));
    } else if (action === "stop") {
      results.push(store.stop({
        laneSessionId,
        nowMs: call.now_ms ?? undefined,
        reason: call.reason,
      }));
    } else {
      results.push(store.recordObservation({
        laneSessionId,
        observationRef: readString(call.observation_ref),
        receiptRef: call.receipt_ref,
        sourceId: call.source_id || call.source_binding?.source_id || null,
        chunkId: call.chunk_id,
        chunkIndex: call.chunk_index,
        dedupeKey: call.dedupe_key,
        sourceEventId: call.source_event_id,
        sourceHash: call.source_binding?.source_hash ?? null,
        targetLanguage: call.source_binding?.target_language ?? null,
        sourceEventMs: call.source_event_ms,
        observedAtMs: call.observed_at_ms,
        freshnessStatus: call.freshness_status,
        sourceTextHash: call.source_text_hash,
        sourceTextCharCount: call.source_text_char_count,
        projectionTarget: call.projection_target,
        cancelRequested: call.cancel_requested,
        nowMs: call.now_ms ?? undefined,
      }));
    }
  }

  const sessions = results
    .map((result) => result.lane_session)
    .filter((session): session is NonNullable<typeof session> => Boolean(session));
  const sessionDebugSummaries = buildHelixCapabilityLaneSessionDebugSummaries(sessions);

  return {
    schema: "helix.capability_lane.session_runner_result.v1",
    requested: calls.length > 0,
    session_results: results,
    session_debug_summaries: sessionDebugSummaries,
    debug_projection: {
      capability_lane_session_results: results,
      capability_lane_session_debug_summaries: sessionDebugSummaries,
    },
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
  };
};

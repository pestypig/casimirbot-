import {
  HELIX_CAPABILITY_LANE_IDS,
  type HelixCapabilityLaneId,
} from "@shared/helix-capability-lane";
import type {
  HelixCapabilityLaneSessionCall,
  HelixCapabilityLaneSessionCallAction,
  HelixCapabilityLaneSessionDebugSummary,
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
  reentry_required: true;
  context_role: "tool_evidence";
  answer_authority: false;
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

const readAction = (value: unknown): HelixCapabilityLaneSessionCallAction | null => {
  const text = readString(value).toLowerCase();
  return text === "start" ||
    text === "pause" ||
    text === "resume" ||
    text === "stop" ||
    text === "record_observation" ||
    text === "list"
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
  if (text === "document_markdown" || text === "docs_viewer") return "docs";
  if (text === "audio_transcript") return "audio";
  if (text === "visual_frame" || text === "visual_capture") return "visual";
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

const readOptionalSourceKind = (
  value: unknown,
): HelixCapabilityLaneSessionSourceBinding["source_kind"] | null => {
  const text = readString(value).toLowerCase();
  if (!text) return null;
  return readSourceKind(text);
};

const readSourceBinding = (
  value: unknown,
  fallback?: RecordLike | null,
): HelixCapabilityLaneSessionSourceBinding => {
  const record = readRecord(value);
  return {
    source_id: readString(record?.source_id ?? record?.sourceId ?? fallback?.source_id ?? fallback?.sourceId),
    source_hash:
      readString(record?.source_hash ?? record?.sourceHash ?? fallback?.source_hash ?? fallback?.sourceHash) || null,
    source_binding_key:
      readString(
        record?.source_binding_key ??
        record?.sourceBindingKey ??
        fallback?.source_binding_key ??
        fallback?.sourceBindingKey,
      ) || null,
    source_identity_key:
      readString(
        record?.latest_source_identity_key ??
        record?.latestSourceIdentityKey ??
        fallback?.latest_source_identity_key ??
        fallback?.latestSourceIdentityKey ??
        record?.source_identity_key ??
        record?.sourceIdentityKey ??
        fallback?.source_identity_key ??
        fallback?.sourceIdentityKey,
      ) || null,
    source_text_hash:
      readString(
        record?.source_text_hash ??
        record?.sourceTextHash ??
        fallback?.source_text_hash ??
        fallback?.sourceTextHash,
      ) || null,
    source_text_char_count:
      readNumber(
        record?.source_text_char_count ??
        record?.sourceTextCharCount ??
        fallback?.source_text_char_count ??
        fallback?.sourceTextCharCount,
      ),
    source_kind: readSourceKind(record?.source_kind ?? record?.sourceKind ?? fallback?.source_kind ?? fallback?.sourceKind),
    projection_target:
      readString(record?.projection_target ?? record?.projectionTarget ?? fallback?.projection_target ?? fallback?.projectionTarget) || null,
    account_locale:
      readString(record?.account_locale ?? record?.accountLocale ?? fallback?.account_locale ?? fallback?.accountLocale) || null,
    target_language:
      readString(record?.target_language ?? record?.targetLanguage ?? fallback?.target_language ?? fallback?.targetLanguage) || null,
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
      source_binding: readSourceBinding(entry.source_binding ?? entry.sourceBinding, entry),
      source_id: readString(entry.source_id ?? entry.sourceId) || null,
      source_hash: readString(entry.source_hash ?? entry.sourceHash) || null,
      source_identity_key:
        readString(
          entry.latest_source_identity_key ??
          entry.latestSourceIdentityKey ??
          entry.source_identity_key ??
          entry.sourceIdentityKey,
        ) || null,
      source_kind: readOptionalSourceKind(entry.source_kind ?? entry.sourceKind),
      account_locale: readString(entry.account_locale ?? entry.accountLocale) || null,
      target_language: readString(entry.target_language ?? entry.targetLanguage) || null,
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
      context_role: "tool_evidence",
      answer_authority: false,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    }));
};

const blocked = (
  action: HelixCapabilityLaneSessionCallAction,
  blockedReason: string,
  metadata: Partial<Pick<
    HelixCapabilityLaneSessionResult,
    | "lane_id"
    | "lane_session_id"
    | "selected_runtime_agent_provider"
    | "requested_backend_provider"
    | "session_supported"
    | "source_id"
    | "source_hash"
    | "source_binding_key"
    | "source_identity_key"
    | "source_text_hash"
    | "source_text_char_count"
    | "projection_target"
    | "account_locale"
    | "target_language"
  >> = {},
): HelixCapabilityLaneSessionResult => ({
  ok: false,
  action,
  ...metadata,
  lane_session: null,
  blocked_reason: blockedReason,
  reentry_required: true,
  context_role: "tool_evidence",
  answer_authority: false,
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
});

const sessionMatchesCall = (
  session: NonNullable<HelixCapabilityLaneSessionResult["lane_session"]>,
  call: HelixCapabilityLaneSessionCall,
): boolean => {
  const laneSessionId = readString(call.lane_session_id);
  if (laneSessionId && session.lane_session_id !== laneSessionId) return false;
  if (call.lane_id && session.lane_id !== call.lane_id) return false;
  const sourceId = readString(call.source_id) || readString(call.source_binding?.source_id);
  if (sourceId && session.source_binding.source_id !== sourceId) return false;
  const sourceHash = readString(call.source_hash) || readString(call.source_binding?.source_hash);
  if (sourceHash && session.source_binding.source_hash !== sourceHash) return false;
  const sourceBindingKey =
    readString(call.source_binding_key) || readString(call.source_binding?.source_binding_key);
  if (sourceBindingKey && session.source_binding.source_binding_key !== sourceBindingKey) return false;
  const sourceIdentityKey =
    readString(call.source_identity_key) ||
    readString(call.latest_source_identity_key) ||
    readString(call.source_binding?.latest_source_identity_key) ||
    readString(call.source_binding?.source_identity_key);
  if (sourceIdentityKey && session.source_binding.source_identity_key !== sourceIdentityKey) return false;
  return true;
};

const blockedMetadataForCall = (
  provider: HelixAgentProvider,
  call: HelixCapabilityLaneSessionCall,
): Partial<Pick<
  HelixCapabilityLaneSessionResult,
  | "lane_id"
  | "lane_session_id"
  | "selected_runtime_agent_provider"
  | "requested_backend_provider"
  | "session_supported"
  | "source_id"
  | "source_hash"
  | "source_binding_key"
  | "source_identity_key"
  | "source_text_hash"
  | "source_text_char_count"
  | "projection_target"
  | "account_locale"
  | "target_language"
>> => ({
  lane_id: call.lane_id ?? null,
  lane_session_id: readString(call.lane_session_id) || null,
  selected_runtime_agent_provider: provider.id,
  requested_backend_provider: call.requested_backend_provider ?? null,
  session_supported: null,
  source_id: readString(call.source_id) || readString(call.source_binding?.source_id) || null,
  source_hash: readString(call.source_hash) || readString(call.source_binding?.source_hash) || null,
  source_binding_key: readString(call.source_binding_key) || readString(call.source_binding?.source_binding_key) || null,
  source_identity_key:
    readString(call.source_identity_key) ||
    readString(call.latest_source_identity_key) ||
    readString(call.source_binding?.latest_source_identity_key) ||
    readString(call.source_binding?.source_identity_key) ||
    null,
  source_text_hash: readString(call.source_text_hash) || readString(call.source_binding?.source_text_hash) || null,
  source_text_char_count:
    typeof call.source_text_char_count === "number" && Number.isFinite(call.source_text_char_count)
      ? Math.trunc(call.source_text_char_count)
      : typeof call.source_binding?.source_text_char_count === "number" &&
          Number.isFinite(call.source_binding.source_text_char_count)
        ? Math.trunc(call.source_binding.source_text_char_count)
        : null,
  projection_target: readString(call.projection_target) || readString(call.source_binding?.projection_target) || null,
  account_locale: readString(call.account_locale) || readString(call.source_binding?.account_locale) || null,
  target_language: readString(call.target_language) || readString(call.source_binding?.target_language) || null,
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
  const summarySessions: NonNullable<HelixCapabilityLaneSessionResult["lane_session"]>[] = [];

  const pushResult = (result: HelixCapabilityLaneSessionResult, laneSessionId?: string | null) => {
    results.push(result);
    if (result.lane_session) {
      summarySessions.push(result.lane_session);
      return;
    }
    const existing = readString(laneSessionId);
    if (
      existing &&
      result.blocked_reason &&
      (result.action === "start" ||
        result.action === "pause" ||
        result.action === "resume" ||
        result.action === "stop")
    ) {
      const session = store.get(existing);
      if (session) summarySessions.push(session);
    }
  };

  for (const call of calls) {
    const action = call.action;
    const blockedMetadata = blockedMetadataForCall(input.provider, call);
    if (input.provider.supports.capabilityLaneSessions !== true) {
      pushResult(blocked(action, "runtime_provider_capability_lane_sessions_not_supported", blockedMetadata), call.lane_session_id);
      continue;
    }
    if (action === "list") {
      store.list()
        .filter((session) => sessionMatchesCall(session, call))
        .forEach((session) => summarySessions.push(session));
      pushResult({
        ok: true,
        action: "list",
        ...blockedMetadata,
        session_supported: true,
        lane_session: null,
        blocked_reason: null,
        reentry_required: true,
        context_role: "tool_evidence",
        answer_authority: false,
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
      }, call.lane_session_id);
      continue;
    }
    if (action === "start") {
      if (!call.lane_id) {
        pushResult(blocked("start", "missing_capability_lane", blockedMetadata), call.lane_session_id);
        continue;
      }
      pushResult(store.start({
        provider: input.provider,
        laneId: call.lane_id,
        laneSessionId: call.lane_session_id,
        sourceBinding: readSourceBinding(call.source_binding),
        requestedBackendProvider: call.requested_backend_provider,
        sourceIdentityKey: call.source_identity_key,
        nowMs: call.now_ms ?? undefined,
        env: input.env,
      }), call.lane_session_id);
      continue;
    }

    const laneSessionId = readString(call.lane_session_id);
    if (!laneSessionId) {
      pushResult(blocked(action, "missing_lane_session_id", blockedMetadata), laneSessionId);
      continue;
    }
    if (action === "pause") {
      pushResult(store.pause({
        laneSessionId,
        nowMs: call.now_ms ?? undefined,
        reason: call.reason,
      }), laneSessionId);
    } else if (action === "resume") {
      pushResult(store.resume({
        laneSessionId,
        nowMs: call.now_ms ?? undefined,
        reason: call.reason,
      }), laneSessionId);
    } else if (action === "stop") {
      pushResult(store.stop({
        laneSessionId,
        nowMs: call.now_ms ?? undefined,
        reason: call.reason,
      }), laneSessionId);
    } else {
      pushResult(store.recordObservation({
        laneSessionId,
        observationRef: readString(call.observation_ref),
        receiptRef: call.receipt_ref,
        sourceId: call.source_id || call.source_binding?.source_id || null,
        sourceBindingKey: call.source_binding_key || call.source_binding?.source_binding_key || null,
        sourceIdentityKey: call.source_identity_key || call.source_binding?.source_identity_key || null,
        sourceKind: call.source_kind || call.source_binding?.source_kind || null,
        chunkId: call.chunk_id,
        chunkIndex: call.chunk_index,
        dedupeKey: call.dedupe_key,
        sourceEventId: call.source_event_id,
        sourceHash: call.source_hash || call.source_binding?.source_hash || null,
        targetLanguage: call.target_language || call.source_binding?.target_language || null,
        accountLocale: call.account_locale || call.source_binding?.account_locale || null,
        sourceEventMs: call.source_event_ms,
        observedAtMs: call.observed_at_ms,
        freshnessStatus: call.freshness_status,
        sourceTextHash: call.source_text_hash || call.source_binding?.source_text_hash || null,
        sourceTextCharCount: call.source_text_char_count ?? call.source_binding?.source_text_char_count ?? null,
        projectionTarget: call.projection_target || call.source_binding?.projection_target || null,
        cancelRequested: call.cancel_requested,
        nowMs: call.now_ms ?? undefined,
      }), laneSessionId);
    }
  }

  const sessionDebugSummaries = buildHelixCapabilityLaneSessionDebugSummaries(summarySessions);

  return {
    schema: "helix.capability_lane.session_runner_result.v1",
    requested: calls.length > 0,
    session_results: results,
    session_debug_summaries: sessionDebugSummaries,
    debug_projection: {
      capability_lane_session_results: results,
      capability_lane_session_debug_summaries: sessionDebugSummaries,
    },
    reentry_required: true,
    context_role: "tool_evidence",
    answer_authority: false,
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
  };
};

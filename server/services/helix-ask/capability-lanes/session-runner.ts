import {
  HELIX_CAPABILITY_LANE_IDS,
  type HelixCapabilityLaneId,
} from "@shared/helix-capability-lane";
import type {
  HelixCapabilityLaneSessionAction,
  HelixCapabilityLaneSessionCall,
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

const readAction = (value: unknown): HelixCapabilityLaneSessionAction | null => {
  const text = readString(value).toLowerCase();
  return text === "start" || text === "pause" || text === "resume" || text === "stop"
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
    source_kind: readSourceKind(record?.source_kind ?? record?.sourceKind),
    projection_target:
      readString(record?.projection_target ?? record?.projectionTarget) || null,
    account_locale:
      readString(record?.account_locale ?? record?.accountLocale) || null,
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
      reason: readString(entry.reason) || null,
      now_ms: readNumber(entry.now_ms ?? entry.nowMs),
    }));
};

const blocked = (
  action: HelixCapabilityLaneSessionAction,
  blockedReason: string,
): HelixCapabilityLaneSessionResult => ({
  ok: false,
  action,
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
    if (input.provider.supports.capabilityLaneSessions !== true) {
      results.push(blocked(action, "runtime_provider_capability_lane_sessions_not_supported"));
      continue;
    }
    if (action === "start") {
      if (!call.lane_id) {
        results.push(blocked("start", "missing_capability_lane"));
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
      results.push(blocked(action, "missing_lane_session_id"));
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
    } else {
      results.push(store.stop({
        laneSessionId,
        nowMs: call.now_ms ?? undefined,
        reason: call.reason,
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

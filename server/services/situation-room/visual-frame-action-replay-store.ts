import crypto from "node:crypto";
import {
  HELIX_VISUAL_FRAME_ACTION_REPLAY_REQUEST_SCHEMA,
  HELIX_VISUAL_FRAME_ACTION_REPLAY_RESULT_SCHEMA,
  type HelixVisualFrameActionReplayRequest,
  type HelixVisualFrameActionReplayResult,
  type HelixVisualFrameActionReplayStatus,
} from "@shared/helix-visual-frame-action-replay";

const requestsById = new Map<string, HelixVisualFrameActionReplayRequest>();
const resultsByRequestId = new Map<string, HelixVisualFrameActionReplayResult[]>();

const DEFAULT_REPLAY_TTL_MS = 10 * 60 * 1000;
const MAX_REPLAY_REQUESTS = 200;
const MAX_REPLAY_RESULTS_PER_REQUEST = 100;

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const uniqueStrings = (values: unknown): string[] => {
  const raw = Array.isArray(values) ? values : values == null ? [] : [values];
  return Array.from(new Set(raw.map((value) => String(value ?? "").trim()).filter(Boolean)));
};

const readNumber = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const clampMaxFrames = (value: unknown): number =>
  Math.max(1, Math.min(Math.round(readNumber(value, 12)), 50));

const addMs = (iso: string, ms: number): string =>
  new Date(Date.parse(iso) + ms).toISOString();

function expireRequests(now = new Date().toISOString()): void {
  const nowMs = Date.parse(now);
  for (const [id, request] of requestsById.entries()) {
    if (request.status === "completed" || request.status === "failed" || request.status === "expired") continue;
    if (Date.parse(request.expires_at) <= nowMs) {
      requestsById.set(id, {
        ...request,
        status: "expired",
        updated_at: now,
        failure_reason: request.failure_reason ?? "visual_action_replay_request_expired",
      });
    }
  }
  const entries = Array.from(requestsById.values()).sort((left, right) => left.requested_at.localeCompare(right.requested_at));
  if (entries.length > MAX_REPLAY_REQUESTS) {
    for (const entry of entries.slice(0, entries.length - MAX_REPLAY_REQUESTS)) {
      requestsById.delete(entry.replay_request_id);
      resultsByRequestId.delete(entry.replay_request_id);
    }
  }
}

export function requestVisualFrameActionReplay(input: Record<string, unknown>): HelixVisualFrameActionReplayRequest {
  const now = readString(input.now) ?? new Date().toISOString();
  expireRequests(now);
  const threadId = readString(input.thread_id ?? input.threadId) ?? "helix-ask:desktop";
  const sourceId = readString(input.source_id ?? input.sourceId) ?? `source:visual_frame:${threadId}`;
  const shadeProfileIds = uniqueStrings(input.shade_profile_ids ?? input.shadeProfileIds ?? input.profile_ids ?? input.profileIds);
  const requestedFrameHistoryIds = uniqueStrings(input.frame_history_ids ?? input.frameHistoryIds ?? input.history_ids ?? input.historyIds);
  const requestedFrameIds = uniqueStrings(input.frame_ids ?? input.frameIds);
  const maxFrames = clampMaxFrames(input.max_frames ?? input.maxFrames);
  const replay: HelixVisualFrameActionReplayRequest = {
    schema: HELIX_VISUAL_FRAME_ACTION_REPLAY_REQUEST_SCHEMA,
    replay_request_id: `visual_frame_action_replay:${hashShort([threadId, sourceId, requestedFrameHistoryIds, requestedFrameIds, shadeProfileIds, input.from_ts, input.to_ts, input.summary_query, now])}`,
    thread_id: threadId,
    room_id: readString(input.room_id ?? input.roomId),
    environment_id: readString(input.environment_id ?? input.environmentId),
    source_id: sourceId,
    requested_frame_history_ids: requestedFrameHistoryIds,
    requested_frame_ids: requestedFrameIds,
    from_ts: readString(input.from_ts ?? input.fromTs),
    to_ts: readString(input.to_ts ?? input.toTs),
    summary_query: readString(input.summary_query ?? input.summaryQuery),
    shade_profile_ids: shadeProfileIds,
    max_frames: maxFrames,
    status: "pending_client_frames",
    requested_at: now,
    updated_at: now,
    expires_at: readString(input.expires_at ?? input.expiresAt) ?? addMs(now, DEFAULT_REPLAY_TTL_MS),
    client_claimed_at: null,
    completed_at: null,
    result_count: 0,
    failure_reason: null,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
    context_role: "tool_evidence",
  };
  requestsById.set(replay.replay_request_id, replay);
  return replay;
}

export function listPendingVisualFrameActionReplayRequests(input: {
  threadId?: string | null;
  sourceId?: string | null;
  now?: string;
  limit?: number;
} = {}): HelixVisualFrameActionReplayRequest[] {
  const now = input.now ?? new Date().toISOString();
  expireRequests(now);
  const limit = Math.max(1, Math.min(input.limit ?? 25, 100));
  return Array.from(requestsById.values())
    .filter((request) => request.status === "pending_client_frames" || request.status === "running")
    .filter((request) => !input.threadId || request.thread_id === input.threadId)
    .filter((request) => !input.sourceId || request.source_id === input.sourceId)
    .sort((left, right) => left.requested_at.localeCompare(right.requested_at))
    .slice(0, limit);
}

export function updateVisualFrameActionReplayRequestStatus(input: {
  replayRequestId: string;
  status: HelixVisualFrameActionReplayStatus;
  failureReason?: string | null;
  now?: string;
}): HelixVisualFrameActionReplayRequest | null {
  const existing = requestsById.get(input.replayRequestId);
  if (!existing) return null;
  const now = input.now ?? new Date().toISOString();
  const updated: HelixVisualFrameActionReplayRequest = {
    ...existing,
    status: input.status,
    updated_at: now,
    client_claimed_at: input.status === "running" ? existing.client_claimed_at ?? now : existing.client_claimed_at,
    completed_at: input.status === "completed" || input.status === "failed" ? now : existing.completed_at,
    failure_reason: input.failureReason ?? existing.failure_reason ?? null,
  };
  requestsById.set(updated.replay_request_id, updated);
  return updated;
}

export function recordVisualFrameActionReplayResult(input: Record<string, unknown>): {
  request: HelixVisualFrameActionReplayRequest | null;
  result: HelixVisualFrameActionReplayResult;
} {
  const now = readString(input.created_at ?? input.createdAt) ?? new Date().toISOString();
  const replayRequestId = readString(input.replay_request_id ?? input.replayRequestId) ?? "visual_frame_action_replay:unknown";
  const status = input.status === "failed" || input.status === "skipped" ? input.status : "completed";
  const result: HelixVisualFrameActionReplayResult = {
    schema: HELIX_VISUAL_FRAME_ACTION_REPLAY_RESULT_SCHEMA,
    replay_result_id: readString(input.replay_result_id ?? input.replayResultId) ??
      `visual_frame_action_replay_result:${hashShort([replayRequestId, input.source_frame_history_id, input.source_frame_id, input.shade_profile_id, now])}`,
    replay_request_id: replayRequestId,
    thread_id: readString(input.thread_id ?? input.threadId) ?? "helix-ask:desktop",
    source_id: readString(input.source_id ?? input.sourceId) ?? "source:visual_frame:unknown",
    source_frame_history_id: readString(input.source_frame_history_id ?? input.sourceFrameHistoryId),
    source_frame_id: readString(input.source_frame_id ?? input.sourceFrameId),
    replay_frame_id: readString(input.replay_frame_id ?? input.replayFrameId),
    evidence_id: readString(input.evidence_id ?? input.evidenceId),
    shade_profile_id: readString(input.shade_profile_id ?? input.shadeProfileId),
    shade_title: readString(input.shade_title ?? input.shadeTitle),
    visual_prompt_hash: readString(input.visual_prompt_hash ?? input.visualPromptHash),
    summary: readString(input.summary) ?? (status === "completed" ? "Visual action replay completed." : "Visual action replay did not complete."),
    status,
    failure_reason: readString(input.failure_reason ?? input.failureReason),
    created_at: now,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
    context_role: "tool_evidence",
  };
  const existing = resultsByRequestId.get(replayRequestId) ?? [];
  resultsByRequestId.set(replayRequestId, [...existing, result].slice(-MAX_REPLAY_RESULTS_PER_REQUEST));
  const request = requestsById.get(replayRequestId) ?? null;
  if (!request) return { request: null, result };
  const results = resultsByRequestId.get(replayRequestId) ?? [];
  const completedCount = results.filter((entry) => entry.status === "completed").length;
  const failedCount = results.filter((entry) => entry.status === "failed").length;
  const terminalStatus: HelixVisualFrameActionReplayStatus =
    completedCount > 0
      ? "completed"
      : failedCount > 0 && results.length >= Math.max(1, request.shade_profile_ids.length || 1)
        ? "failed"
        : request.status === "pending_client_frames"
          ? "running"
          : request.status;
  const updated: HelixVisualFrameActionReplayRequest = {
    ...request,
    status: terminalStatus,
    updated_at: now,
    completed_at: terminalStatus === "completed" || terminalStatus === "failed" ? now : request.completed_at,
    result_count: results.length,
    failure_reason: terminalStatus === "failed" ? result.failure_reason ?? "visual_action_replay_failed" : request.failure_reason,
  };
  requestsById.set(replayRequestId, updated);
  return { request: updated, result };
}

export function listVisualFrameActionReplayResults(input: {
  replayRequestId?: string | null;
  threadId?: string | null;
  limit?: number;
} = {}): HelixVisualFrameActionReplayResult[] {
  const limit = Math.max(1, Math.min(input.limit ?? 100, 250));
  const entries = input.replayRequestId
    ? [...(resultsByRequestId.get(input.replayRequestId) ?? [])]
    : Array.from(resultsByRequestId.values()).flat();
  return entries
    .filter((entry) => !input.threadId || entry.thread_id === input.threadId)
    .sort((left, right) => left.created_at.localeCompare(right.created_at))
    .slice(-limit);
}

export function resetVisualFrameActionReplayStoreForTest(): void {
  requestsById.clear();
  resultsByRequestId.clear();
}

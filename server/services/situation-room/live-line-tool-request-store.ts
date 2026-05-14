import type { HelixLiveLineToolEvaluation } from "@shared/helix-live-line-tool-evaluation";
import type {
  HelixLiveLineToolRequest,
  HelixLiveLineToolRequestStatus,
} from "@shared/helix-live-line-tool-request";

const requestsByThread = new Map<string, HelixLiveLineToolRequest[]>();
const evaluationsByThread = new Map<string, HelixLiveLineToolEvaluation[]>();

export function recordLiveLineToolRequest(request: HelixLiveLineToolRequest): HelixLiveLineToolRequest {
  const existing = requestsByThread.get(request.thread_id) ?? [];
  const filtered = existing.filter((entry) => entry.request_id !== request.request_id);
  requestsByThread.set(request.thread_id, [...filtered, request].slice(-500));
  return request;
}

export function updateLiveLineToolRequestStatus(input: {
  threadId: string;
  requestId: string;
  status: HelixLiveLineToolRequestStatus;
}): HelixLiveLineToolRequest | null {
  const existing = requestsByThread.get(input.threadId) ?? [];
  const updated = existing.map((entry) =>
    entry.request_id === input.requestId
      ? { ...entry, status: input.status }
      : entry,
  );
  requestsByThread.set(input.threadId, updated);
  return updated.find((entry) => entry.request_id === input.requestId) ?? null;
}

export function getLiveLineToolRequest(input: {
  threadId: string;
  requestId: string;
}): HelixLiveLineToolRequest | null {
  return (requestsByThread.get(input.threadId) ?? []).find((entry) => entry.request_id === input.requestId) ?? null;
}

export function listLiveLineToolRequests(input: {
  threadId?: string | null;
  status?: HelixLiveLineToolRequestStatus | "any";
  limit?: number;
} = {}): HelixLiveLineToolRequest[] {
  const entries = input.threadId
    ? [...(requestsByThread.get(input.threadId) ?? [])]
    : Array.from(requestsByThread.values()).flat();
  const filtered = !input.status || input.status === "any"
    ? entries
    : entries.filter((entry) => entry.status === input.status);
  return filtered.slice(-(input.limit ?? 200));
}

export function recordLiveLineToolEvaluation(evaluation: HelixLiveLineToolEvaluation): HelixLiveLineToolEvaluation {
  const existing = evaluationsByThread.get(evaluation.thread_id) ?? [];
  const filtered = existing.filter((entry) => entry.evaluation_id !== evaluation.evaluation_id);
  evaluationsByThread.set(evaluation.thread_id, [...filtered, evaluation].slice(-500));
  updateLiveLineToolRequestStatus({
    threadId: evaluation.thread_id,
    requestId: evaluation.request_id,
    status: "evaluated",
  });
  return evaluation;
}

export function listLiveLineToolEvaluations(input: {
  threadId?: string | null;
  requestId?: string | null;
  limit?: number;
} = {}): HelixLiveLineToolEvaluation[] {
  const entries = input.threadId
    ? [...(evaluationsByThread.get(input.threadId) ?? [])]
    : Array.from(evaluationsByThread.values()).flat();
  const filtered = input.requestId
    ? entries.filter((entry) => entry.request_id === input.requestId)
    : entries;
  return filtered.slice(-(input.limit ?? 200));
}

export function clearLiveLineToolRequestStoreForTest(): void {
  requestsByThread.clear();
  evaluationsByThread.clear();
}

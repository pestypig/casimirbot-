import crypto from "node:crypto";
import {
  HELIX_VISUAL_COMPARISON_SESSION_SCHEMA,
  type HelixVisualComparisonSession,
  type HelixVisualComparisonSessionStatus,
} from "@shared/helix-visual-comparison-session";

const sessionsByThread = new Map<string, HelixVisualComparisonSession[]>();

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

export function createVisualComparisonSession(input: {
  threadId: string;
  situationRunId: string;
  baselineEpoch: number;
  baselineObservationRef: string;
  now?: string;
}): HelixVisualComparisonSession {
  const now = input.now ?? new Date().toISOString();
  const session: HelixVisualComparisonSession = {
    schema: HELIX_VISUAL_COMPARISON_SESSION_SCHEMA,
    comparison_session_id: `visual_comparison_session:${hashShort([
      input.threadId,
      input.situationRunId,
      input.baselineEpoch,
      input.baselineObservationRef,
    ])}`,
    thread_id: input.threadId,
    situation_run_id: input.situationRunId,
    baseline_epoch: input.baselineEpoch,
    baseline_observation_ref: input.baselineObservationRef,
    waiting_for_next_visual_observation: true,
    status: "waiting",
    assistant_answer: false,
    raw_content_included: false,
    created_at: now,
    updated_at: now,
  };
  const existing = sessionsByThread.get(input.threadId) ?? [];
  sessionsByThread.set(input.threadId, [
    ...existing.filter((entry: HelixVisualComparisonSession) => entry.comparison_session_id !== session.comparison_session_id),
    session,
  ].slice(-100));
  return session;
}

export function updateVisualComparisonSessionStatus(input: {
  comparisonSessionId: string;
  status: HelixVisualComparisonSessionStatus;
  now?: string;
}): HelixVisualComparisonSession | null {
  for (const [threadId, sessions] of sessionsByThread.entries()) {
    const current = sessions.find((entry: HelixVisualComparisonSession) => entry.comparison_session_id === input.comparisonSessionId);
    if (!current) continue;
    const updated: HelixVisualComparisonSession = {
      ...current,
      status: input.status,
      waiting_for_next_visual_observation: input.status === "waiting",
      updated_at: input.now ?? new Date().toISOString(),
    };
    sessionsByThread.set(threadId, [
      ...sessions.filter((entry: HelixVisualComparisonSession) => entry.comparison_session_id !== updated.comparison_session_id),
      updated,
    ]);
    return updated;
  }
  return null;
}

export function listVisualComparisonSessions(input: {
  threadId?: string | null;
  situationRunId?: string | null;
  status?: HelixVisualComparisonSessionStatus | null;
  limit?: number;
} = {}): HelixVisualComparisonSession[] {
  const limit = Math.max(0, Math.min(200, Math.trunc(input.limit ?? 80)));
  return Array.from(sessionsByThread.values()).flat()
    .filter((entry: HelixVisualComparisonSession) => !input.threadId || entry.thread_id === input.threadId)
    .filter((entry: HelixVisualComparisonSession) => !input.situationRunId || entry.situation_run_id === input.situationRunId)
    .filter((entry: HelixVisualComparisonSession) => !input.status || entry.status === input.status)
    .sort((a: HelixVisualComparisonSession, b: HelixVisualComparisonSession) => a.updated_at.localeCompare(b.updated_at))
    .slice(-limit);
}

export function resetVisualComparisonSessionsForTest(): void {
  sessionsByThread.clear();
}

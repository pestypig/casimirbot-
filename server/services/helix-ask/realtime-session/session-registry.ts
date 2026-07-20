import crypto from "node:crypto";
import type { HelixRealtimeStagePlayContextSyncV1 } from "@shared/contracts/helix-realtime-stage-play.v1";
import type { HelixRuntimeGoalAccountScope } from "../runtime-goals/runtime-goal-account-binding";

const SESSION_TTL_MS = 15 * 60_000;

export type HelixRealtimeAdmittedSession = {
  realtimeSessionId: string;
  requesterRef: string;
  visibleUserConsentReceipt: string;
  model: string;
  voice: string | null;
  threadId: string;
  boundGoalId: string | null;
  boundRuntimeSessionRef: string | null;
  boundRuntimeAgentProvider: string | null;
  selectedRuntimeAgentProvider: string | null;
  runtimeGoalAccountScope: HelixRuntimeGoalAccountScope | null;
  sourceBinding: Record<string, unknown> | null;
  providerCallId: string | null;
  providerCallRef: string | null;
  sidebandState: "not_connected" | "connecting" | "open" | "closed" | "failed";
  inputSpeechActive: boolean;
  responseActive: boolean;
  playbackActive: boolean;
  latestContextSync: HelixRealtimeStagePlayContextSyncV1 | null;
  createdAtMs: number;
  expiresAtMs: number;
};

const sessions = new Map<string, HelixRealtimeAdmittedSession>();

type RealtimeSessionRemovalListener = (
  session: HelixRealtimeAdmittedSession,
  reason: "stopped" | "expired" | "test_reset",
) => void;

const removalListeners = new Set<RealtimeSessionRemovalListener>();

export const buildRealtimeRequesterRef = (sessionCookie: string | null): string =>
  `requester:realtime:${crypto
    .createHash("sha256")
    .update(sessionCookie || "anonymous")
    .digest("hex")
    .slice(0, 20)}`;

const pruneExpiredSessions = (nowMs: number): void => {
  for (const [sessionId, session] of sessions) {
    if (session.expiresAtMs <= nowMs) {
      sessions.delete(sessionId);
      for (const listener of removalListeners) listener(session, "expired");
    }
  }
};

export const admitRealtimeSession = (input: {
  realtimeSessionId: string;
  requesterRef: string;
  visibleUserConsentReceipt: string;
  model: string;
  voice?: string | null;
  threadId?: string | null;
  sourceBinding?: Record<string, unknown> | null;
  selectedRuntimeAgentProvider?: string | null;
  runtimeGoalAccountScope?: HelixRuntimeGoalAccountScope | null;
  nowMs?: number;
}): HelixRealtimeAdmittedSession => {
  const nowMs = input.nowMs ?? Date.now();
  pruneExpiredSessions(nowMs);
  const session: HelixRealtimeAdmittedSession = {
    realtimeSessionId: input.realtimeSessionId,
    requesterRef: input.requesterRef,
    visibleUserConsentReceipt: input.visibleUserConsentReceipt,
    model: input.model,
    voice: input.voice?.trim() || null,
    threadId: input.threadId?.trim() || "helix-ask:desktop",
    boundGoalId: null,
    boundRuntimeSessionRef: null,
    boundRuntimeAgentProvider: null,
    selectedRuntimeAgentProvider: input.selectedRuntimeAgentProvider?.trim() || null,
    runtimeGoalAccountScope: input.runtimeGoalAccountScope ?? null,
    sourceBinding: input.sourceBinding ?? null,
    providerCallId: null,
    providerCallRef: null,
    sidebandState: "not_connected",
    inputSpeechActive: false,
    responseActive: false,
    playbackActive: false,
    latestContextSync: null,
    createdAtMs: nowMs,
    expiresAtMs: nowMs + SESSION_TTL_MS,
  };
  sessions.set(session.realtimeSessionId, session);
  return session;
};

export const updateAdmittedRealtimeSession = (input: {
  realtimeSessionId: string;
  requesterRef?: string | null;
  patch: Partial<Pick<
    HelixRealtimeAdmittedSession,
    | "providerCallId"
    | "providerCallRef"
    | "sidebandState"
    | "inputSpeechActive"
    | "responseActive"
    | "playbackActive"
    | "latestContextSync"
    | "sourceBinding"
    | "boundGoalId"
    | "boundRuntimeSessionRef"
    | "boundRuntimeAgentProvider"
    | "selectedRuntimeAgentProvider"
    | "runtimeGoalAccountScope"
  >>;
}): HelixRealtimeAdmittedSession | null => {
  const session = sessions.get(input.realtimeSessionId);
  if (!session || (input.requesterRef && session.requesterRef !== input.requesterRef)) return null;
  const updated: HelixRealtimeAdmittedSession = { ...session, ...input.patch };
  sessions.set(updated.realtimeSessionId, updated);
  return updated;
};

export const listAdmittedRealtimeSessions = (input: {
  threadId?: string | null;
  nowMs?: number;
} = {}): HelixRealtimeAdmittedSession[] => {
  pruneExpiredSessions(input.nowMs ?? Date.now());
  return Array.from(sessions.values()).filter(
    (session: HelixRealtimeAdmittedSession) =>
      !input.threadId || session.threadId === input.threadId,
  );
};

export const readAdmittedRealtimeSession = (input: {
  realtimeSessionId: string;
  requesterRef: string;
  nowMs?: number;
}): HelixRealtimeAdmittedSession | null => {
  const nowMs = input.nowMs ?? Date.now();
  pruneExpiredSessions(nowMs);
  const session = sessions.get(input.realtimeSessionId) ?? null;
  return session?.requesterRef === input.requesterRef ? session : null;
};

export const removeAdmittedRealtimeSession = (input: {
  realtimeSessionId: string;
  requesterRef: string;
}): boolean => {
  const session = sessions.get(input.realtimeSessionId);
  if (!session || session.requesterRef !== input.requesterRef) return false;
  const removed = sessions.delete(input.realtimeSessionId);
  if (removed) {
    for (const listener of removalListeners) listener(session, "stopped");
  }
  return removed;
};

export const subscribeRealtimeSessionRemoval = (
  listener: RealtimeSessionRemovalListener,
): (() => void) => {
  removalListeners.add(listener);
  return () => removalListeners.delete(listener);
};

export const resetRealtimeSessionRegistryForTests = (): void => {
  for (const session of sessions.values()) {
    for (const listener of removalListeners) listener(session, "test_reset");
  }
  sessions.clear();
};

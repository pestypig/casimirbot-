import crypto from "node:crypto";

const SESSION_TTL_MS = 15 * 60_000;

export type HelixRealtimeAdmittedSession = {
  realtimeSessionId: string;
  requesterRef: string;
  visibleUserConsentReceipt: string;
  model: string;
  voice: string | null;
  createdAtMs: number;
  expiresAtMs: number;
};

const sessions = new Map<string, HelixRealtimeAdmittedSession>();

export const buildRealtimeRequesterRef = (sessionCookie: string | null): string =>
  `requester:realtime:${crypto
    .createHash("sha256")
    .update(sessionCookie || "anonymous")
    .digest("hex")
    .slice(0, 20)}`;

const pruneExpiredSessions = (nowMs: number): void => {
  for (const [sessionId, session] of sessions) {
    if (session.expiresAtMs <= nowMs) sessions.delete(sessionId);
  }
};

export const admitRealtimeSession = (input: {
  realtimeSessionId: string;
  requesterRef: string;
  visibleUserConsentReceipt: string;
  model: string;
  voice?: string | null;
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
    createdAtMs: nowMs,
    expiresAtMs: nowMs + SESSION_TTL_MS,
  };
  sessions.set(session.realtimeSessionId, session);
  return session;
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
  return sessions.delete(input.realtimeSessionId);
};

export const resetRealtimeSessionRegistryForTests = (): void => {
  sessions.clear();
};

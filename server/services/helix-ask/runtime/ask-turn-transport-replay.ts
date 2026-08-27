import crypto from "node:crypto";

type RecordLike = Record<string, unknown>;

export type HelixAskTurnTransportReplayEntry = {
  turn_id: string;
  request_fingerprint: string;
  source_transport: "ask_turn_json" | "ask_turn_sse";
  payload: RecordLike;
  recorded_at_ms: number;
};

const completedTurnPayloads = new Map<string, HelixAskTurnTransportReplayEntry>();
const inFlightTurnExecutions = new Map<string, {
  request_fingerprint: string;
  started_at_ms: number;
}>();
const MAX_REPLAY_ENTRIES = 200;
const IN_FLIGHT_TTL_MS = 10 * 60_000;

const normalize = (value: string | null | undefined): string => value?.trim() ?? "";

const requestFingerprint = (sessionId: string, prompt: string): string =>
  `sha256:${crypto.createHash("sha256").update(`${sessionId}\n${prompt}`).digest("hex")}`;

const clone = (payload: RecordLike): RecordLike => {
  if (typeof structuredClone === "function") return structuredClone(payload);
  return JSON.parse(JSON.stringify(payload)) as RecordLike;
};

export const claimHelixAskTurnTransportExecution = (input: {
  turnId: string;
  sessionId: string | null;
  prompt: string | null;
}): {
  status: "claimed" | "already_in_flight" | "identity_mismatch" | "identity_incomplete";
  request_fingerprint: string | null;
  started_at_ms: number | null;
} => {
  const sessionId = normalize(input.sessionId);
  const prompt = normalize(input.prompt);
  if (!sessionId || !prompt) {
    return { status: "identity_incomplete", request_fingerprint: null, started_at_ms: null };
  }
  const fingerprint = requestFingerprint(sessionId, prompt);
  const existing = inFlightTurnExecutions.get(input.turnId);
  if (existing && Date.now() - existing.started_at_ms > IN_FLIGHT_TTL_MS) {
    inFlightTurnExecutions.delete(input.turnId);
  }
  const active = inFlightTurnExecutions.get(input.turnId);
  if (active) {
    return {
      status: active.request_fingerprint === fingerprint ? "already_in_flight" : "identity_mismatch",
      request_fingerprint: fingerprint,
      started_at_ms: active.started_at_ms,
    };
  }
  const startedAtMs = Date.now();
  inFlightTurnExecutions.set(input.turnId, {
    request_fingerprint: fingerprint,
    started_at_ms: startedAtMs,
  });
  return { status: "claimed", request_fingerprint: fingerprint, started_at_ms: startedAtMs };
};

export const rememberHelixAskTurnTransportReplay = (input: {
  turnId: string;
  sessionId: string | null;
  prompt: string | null;
  sourceTransport?: "ask_turn_json" | "ask_turn_sse";
  payload: RecordLike;
}): void => {
  const sessionId = normalize(input.sessionId);
  const prompt = normalize(input.prompt);
  if (!sessionId || !prompt) return;
  const fingerprint = requestFingerprint(sessionId, prompt);
  const admission = input.payload.ask_turn_admission;
  if (
    admission &&
    typeof admission === "object" &&
    !Array.isArray(admission) &&
    (admission as RecordLike).status === "queued"
  ) {
    return;
  }
  completedTurnPayloads.set(input.turnId, {
    turn_id: input.turnId,
    request_fingerprint: fingerprint,
    source_transport: input.sourceTransport ?? "ask_turn_json",
    payload: clone(input.payload),
    recorded_at_ms: Date.now(),
  });
  while (completedTurnPayloads.size > MAX_REPLAY_ENTRIES) {
    const oldest = completedTurnPayloads.keys().next().value;
    if (!oldest) break;
    completedTurnPayloads.delete(oldest);
  }
  const inFlight = inFlightTurnExecutions.get(input.turnId);
  if (inFlight?.request_fingerprint === fingerprint) {
    inFlightTurnExecutions.delete(input.turnId);
  }
};

export const readHelixAskTurnTransportReplay = (input: {
  turnId: string;
  sessionId: string | null;
  prompt: string | null;
}): HelixAskTurnTransportReplayEntry | null => {
  const sessionId = normalize(input.sessionId);
  const prompt = normalize(input.prompt);
  if (!sessionId || !prompt) return null;
  const entry = completedTurnPayloads.get(input.turnId);
  if (entry?.request_fingerprint !== requestFingerprint(sessionId, prompt)) return null;
  return entry ? { ...entry, payload: clone(entry.payload) } : null;
};

export const resetHelixAskTurnTransportReplayForTests = (): void => {
  completedTurnPayloads.clear();
  inFlightTurnExecutions.clear();
};

type RecordLike = Record<string, unknown>;

export type HelixAskPublicLifecycleEntry = {
  turn_id: string;
  session_id: string | null;
  source: string;
  events: unknown[];
  recorded_at_ms: number;
};

const entries = new Map<string, HelixAskPublicLifecycleEntry>();
const MAX_ENTRIES = 200;

const text = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const record = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value) ? value as RecordLike : null;

const clone = <T>(value: T): T => {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value)) as T;
};

export const rememberHelixAskPublicLifecycle = (
  payload: RecordLike,
  options?: { sessionId?: string | null },
): void => {
  const debug = record(payload.debug) ?? {};
  const turnId = text(payload.turn_id) ?? text(debug.turn_id);
  const events = Array.isArray(payload.turn_transcript_events)
    ? payload.turn_transcript_events
    : Array.isArray(debug.turn_transcript_events)
      ? debug.turn_transcript_events
      : [];
  if (!turnId || events.length === 0) return;
  const existing = entries.get(turnId);
  entries.set(turnId, {
    turn_id: turnId,
    session_id:
      text(options?.sessionId) ?? text(payload.session_id) ?? text(payload.sessionId) ??
      text(debug.session_id) ?? text(debug.sessionId) ?? existing?.session_id ?? null,
    source: text(payload.turn_transcript_source) ?? text(debug.turn_transcript_source) ?? "unknown",
    events: clone(events),
    recorded_at_ms: Date.now(),
  });
  while (entries.size > MAX_ENTRIES) {
    const oldest = entries.keys().next().value;
    if (!oldest) break;
    entries.delete(oldest);
  }
};

export const readHelixAskPublicLifecycle = (turnId: string): HelixAskPublicLifecycleEntry | null => {
  const entry = entries.get(turnId);
  return entry ? clone(entry) : null;
};

export const resetHelixAskPublicLifecycleForTests = (): void => {
  entries.clear();
};

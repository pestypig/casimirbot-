import { getHelixThreadLedgerEvents } from "./ledger";
import { type HelixThreadEvent, type HelixThreadTurn } from "./types";

const clampNumber = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const normalizeOptionalString = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const clipHistoryText = (value: unknown, limit = 1200): string | null => {
  const normalized = normalizeOptionalString(value)?.replace(/\s+/g, " ") ?? "";
  if (!normalized) return null;
  if (normalized.length <= limit) return normalized;
  return `${normalized.slice(0, Math.max(0, limit - 3)).trimEnd()}...`;
};

const sortBySequence = (events: HelixThreadEvent[]): HelixThreadEvent[] =>
  events
    .slice()
    .sort(
      (a, b) =>
        a.seq - b.seq ||
        a.ts.localeCompare(b.ts) ||
        a.event_id.localeCompare(b.event_id),
    );

export const buildHelixThreadTurnsFromEvents = (
  events: HelixThreadEvent[],
): HelixThreadTurn[] => {
  const byTurnId = new Map<string, HelixThreadTurn>();
  for (const event of sortBySequence(events)) {
    const existing = byTurnId.get(event.turn_id);
    const next: HelixThreadTurn =
      existing ?? {
        thread_id: event.thread_id,
        turn_id: event.turn_id,
        route: event.route,
        session_id: event.session_id ?? null,
        trace_id: event.trace_id ?? null,
        status: "in_progress",
        started_at: event.ts,
        updated_at: event.ts,
        user_text: event.user_text ?? null,
        assistant_text: event.assistant_text ?? null,
        classifier_result: event.classifier_result ?? null,
        route_reason: event.route_reason ?? null,
        brief_status: event.brief_status ?? null,
        final_gate_outcome: event.final_gate_outcome ?? null,
        fail_reason: event.fail_reason ?? null,
        answer_surface_mode: event.answer_surface_mode ?? null,
        memory_citation: event.memory_citation ?? null,
        last_seq: event.seq,
        event_count: 0,
      };
    next.thread_id = event.thread_id;
    next.route = event.route;
    next.session_id = event.session_id ?? next.session_id ?? null;
    next.trace_id = event.trace_id ?? next.trace_id ?? null;
    next.updated_at = event.ts;
    next.last_seq = event.seq;
    next.event_count += 1;
    if (event.user_text) next.user_text = event.user_text;
    if (event.assistant_text) next.assistant_text = event.assistant_text;
    if (event.classifier_result) next.classifier_result = event.classifier_result;
    if (event.route_reason) next.route_reason = event.route_reason;
    if (event.brief_status) next.brief_status = event.brief_status;
    if (event.final_gate_outcome) next.final_gate_outcome = event.final_gate_outcome;
    if (event.fail_reason) next.fail_reason = event.fail_reason;
    if (event.answer_surface_mode) next.answer_surface_mode = event.answer_surface_mode;
    if (event.memory_citation) next.memory_citation = event.memory_citation;
    if (
      event.event_type === "conversation_turn_started" ||
      event.event_type === "ask_started"
    ) {
      next.status = "in_progress";
      next.started_at = existing?.started_at ?? event.ts;
    } else if (
      event.event_type === "conversation_turn_failed" ||
      event.event_type === "ask_failed"
    ) {
      next.status = "failed";
    } else if (
      event.event_type === "conversation_turn_interrupted" ||
      event.event_type === "ask_interrupted"
    ) {
      next.status = "interrupted";
    } else if (
      event.event_type === "conversation_turn_completed" ||
      event.event_type === "ask_completed"
    ) {
      if (next.status !== "failed" && next.status !== "interrupted") {
        next.status = "completed";
      }
    }
    byTurnId.set(event.turn_id, next);
  }
  return Array.from(byTurnId.values()).sort(
    (a, b) => a.last_seq - b.last_seq || a.started_at.localeCompare(b.started_at),
  );
};

export const buildRecentTurnsFromHelixThread = (args: {
  sessionId?: string | null;
  threadId?: string | null;
  events?: HelixThreadEvent[];
  limit?: number;
  excludeTurnId?: string | null;
}): string[] => {
  const sessionId = normalizeOptionalString(args.sessionId);
  const threadId = normalizeOptionalString(args.threadId);
  if (!sessionId && !threadId) return [];
  const limit = clampNumber(args.limit ?? 6, 1, 12);
  const excludeTurnId = normalizeOptionalString(args.excludeTurnId);
  const turns = buildHelixThreadTurnsFromEvents(
    args.events ??
      getHelixThreadLedgerEvents({
        sessionId,
        threadId,
      }),
  )
    .filter((turn) => (sessionId ? turn.session_id === sessionId : turn.thread_id === threadId))
    .filter((turn) => !excludeTurnId || turn.turn_id !== excludeTurnId)
    .sort((a, b) => a.last_seq - b.last_seq);
  const lines: string[] = [];
  for (const turn of turns) {
    const userText = clipHistoryText(turn.user_text, 440);
    if (userText) {
      lines.push(`user: ${userText}`);
    }
    const assistantText = clipHistoryText(turn.assistant_text, 440);
    if (assistantText) {
      lines.push(`dottie: ${assistantText}`);
    }
  }
  return lines.slice(-limit);
};

import {
  buildConversationTurnsFromEvents,
  type HelixConversationHistoryEvent,
  type HelixConversationHistoryTurn,
} from "../helix-ask/conversation-history";
import { getHelixThreadLedgerEvents } from "./ledger";
import {
  buildHelixThreadCitationView,
  buildHelixThreadTurnsFromEvents,
  buildRecentTurnsFromHelixThread,
} from "./reducer";
import {
  type HelixThreadEvent,
  type HelixThreadMemoryCitation,
  type HelixThreadTurn,
} from "./types";

const COARSE_EVENT_TYPES = new Set<HelixThreadEvent["event_type"]>([
  "conversation_turn_started",
  "conversation_turn_classified",
  "conversation_turn_brief_ready",
  "conversation_turn_completed",
  "conversation_turn_failed",
  "conversation_turn_interrupted",
  "ask_started",
  "ask_completed",
  "ask_failed",
  "ask_interrupted",
]);

const sortBySequence = (events: HelixThreadEvent[]): HelixThreadEvent[] =>
  events
    .slice()
    .sort(
      (a, b) =>
        a.seq - b.seq ||
        a.ts.localeCompare(b.ts) ||
        a.event_id.localeCompare(b.event_id),
    );

const toCompatibilityEventType = (
  turn: HelixThreadTurn,
  phase: "started" | "final",
): HelixConversationHistoryEvent["event_type"] => {
  if (turn.route === "/ask") {
    if (phase === "started") return "ask_started";
    if (turn.status === "failed") return "ask_failed";
    if (turn.status === "interrupted") return "ask_interrupted";
    return "ask_completed";
  }
  if (phase === "started") return "conversation_turn_started";
  if (turn.status === "failed") return "conversation_turn_failed";
  if (turn.status === "interrupted") return "conversation_turn_interrupted";
  return "conversation_turn_completed";
};

export const projectHelixThreadEventToConversationHistoryEvent = (
  event: HelixThreadEvent,
): HelixConversationHistoryEvent => ({
  kind: "helix.ask.conversation_history",
  version: 1,
  event_id: event.event_id,
  seq: event.seq,
  ts: event.ts,
  route: event.route,
  event_type: event.event_type as HelixConversationHistoryEvent["event_type"],
  turn_id: event.turn_id,
  session_id: event.session_id ?? null,
  trace_id: event.trace_id ?? null,
  user_text: event.user_text ?? null,
  assistant_text: event.assistant_text ?? null,
  classifier_result: event.classifier_result ?? null,
  route_reason: event.route_reason ?? null,
  brief_status: event.brief_status ?? null,
  final_gate_outcome: event.final_gate_outcome ?? null,
  fail_reason: event.fail_reason ?? null,
  meta: event.meta ?? null,
});

export const projectHelixThreadEventsToConversationHistory = (
  events: HelixThreadEvent[],
): HelixConversationHistoryEvent[] => {
  const coarseEvents = sortBySequence(events)
    .filter((event) => COARSE_EVENT_TYPES.has(event.event_type))
    .map((event) => projectHelixThreadEventToConversationHistoryEvent(event));
  if (coarseEvents.length > 0) return coarseEvents;
  const turns = buildHelixThreadTurnsFromEvents(events);
  const projected: HelixConversationHistoryEvent[] = [];
  let syntheticSeq = 1;
  for (const turn of turns) {
    projected.push({
      kind: "helix.ask.conversation_history",
      version: 1,
      event_id: `compat:${turn.thread_id}:${turn.turn_id}:start`,
      seq: syntheticSeq++,
      ts: turn.started_at,
      route: turn.route,
      event_type: toCompatibilityEventType(turn, "started"),
      turn_id: turn.turn_id,
      session_id: turn.session_id ?? null,
      trace_id: turn.trace_id ?? null,
      user_text: turn.user_text ?? null,
      assistant_text: null,
      classifier_result: turn.classifier_result ?? null,
      route_reason: turn.route_reason ?? null,
      brief_status: "pending",
      final_gate_outcome: "in_progress",
      fail_reason: null,
      meta: null,
    });
    projected.push({
      kind: "helix.ask.conversation_history",
      version: 1,
      event_id: `compat:${turn.thread_id}:${turn.turn_id}:final`,
      seq: syntheticSeq++,
      ts: turn.updated_at,
      route: turn.route,
      event_type: toCompatibilityEventType(turn, "final"),
      turn_id: turn.turn_id,
      session_id: turn.session_id ?? null,
      trace_id: turn.trace_id ?? null,
      user_text: turn.user_text ?? null,
      assistant_text: turn.assistant_text ?? null,
      classifier_result: turn.classifier_result ?? null,
      route_reason: turn.route_reason ?? null,
      brief_status: turn.brief_status ?? null,
      final_gate_outcome: turn.final_gate_outcome ?? null,
      fail_reason: turn.fail_reason ?? null,
      meta: null,
    });
  }
  return projected;
};

export const buildConversationTurnsFromHelixThreadEvents = (
  events: HelixThreadEvent[],
): HelixConversationHistoryTurn[] =>
  buildConversationTurnsFromEvents(projectHelixThreadEventsToConversationHistory(events));

export const buildRecentTurnsFromHelixThreadProjection = (
  args: Parameters<typeof buildRecentTurnsFromHelixThread>[0],
): string[] => buildRecentTurnsFromHelixThread(args);

export const buildLegacyParityTurnsFromHelixThread = (
  events: HelixThreadEvent[],
): {
  threadTurns: HelixThreadTurn[];
  legacyTurns: HelixConversationHistoryTurn[];
} => ({
  threadTurns: buildHelixThreadTurnsFromEvents(events),
  legacyTurns: buildConversationTurnsFromHelixThreadEvents(events),
});

export const deriveCompatibilityMemoryCitationFromThread = (args: {
  threadId: string;
  turnId: string;
  events?: HelixThreadEvent[];
}): HelixThreadMemoryCitation | null =>
  buildHelixThreadCitationView(args)?.memory_citation ?? null;

export const buildLegacyProjectionFromThreadState = (args: {
  threadId: string;
  events?: HelixThreadEvent[];
}): {
  events: HelixConversationHistoryEvent[];
  turns: HelixConversationHistoryTurn[];
} => {
  const projectedEvents = projectHelixThreadEventsToConversationHistory(
    args.events ?? getHelixThreadLedgerEvents({ threadId: args.threadId }),
  );
  return {
    events: projectedEvents,
    turns: buildConversationTurnsFromEvents(projectedEvents),
  };
};

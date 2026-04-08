import {
  buildConversationTurnsFromEvents,
  type HelixConversationHistoryEvent,
  type HelixConversationHistoryTurn,
} from "../helix-ask/conversation-history";
import { buildRecentTurnsFromHelixThread, buildHelixThreadTurnsFromEvents } from "./reducer";
import { type HelixThreadEvent, type HelixThreadTurn } from "./types";

export const projectHelixThreadEventToConversationHistoryEvent = (
  event: HelixThreadEvent,
): HelixConversationHistoryEvent => ({
  kind: "helix.ask.conversation_history",
  version: 1,
  event_id: event.event_id,
  seq: event.seq,
  ts: event.ts,
  route: event.route,
  event_type: event.event_type,
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
): HelixConversationHistoryEvent[] =>
  events.map((event) => projectHelixThreadEventToConversationHistoryEvent(event));

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

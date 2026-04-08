export type HelixThreadRoute = "/ask" | "/ask/conversation-turn";

export type HelixThreadEventType =
  | "conversation_turn_started"
  | "conversation_turn_classified"
  | "conversation_turn_brief_ready"
  | "conversation_turn_completed"
  | "conversation_turn_failed"
  | "conversation_turn_interrupted"
  | "ask_started"
  | "ask_completed"
  | "ask_failed"
  | "ask_interrupted";

export type HelixThreadTurnStatus =
  | "in_progress"
  | "completed"
  | "failed"
  | "interrupted";

export type HelixThreadClassifierResult = {
  mode?: string | null;
  confidence?: number | null;
  dispatch_hint?: boolean | null;
  clarify_needed?: boolean | null;
  reason?: string | null;
  source?: string | null;
};

export type HelixThreadMemoryCitationEntry = {
  path: string;
  line_start: number | null;
  line_end: number | null;
  note: string;
};

export type HelixThreadMemoryCitation = {
  entries: HelixThreadMemoryCitationEntry[];
  rollout_ids: string[];
};

export type HelixThreadAnswerSurfaceMode =
  | "conversational"
  | "structured_report"
  | "fail_closed";

export type HelixThreadEvent = {
  kind: "helix.thread.event";
  version: 1;
  event_id: string;
  seq: number;
  ts: string;
  thread_id: string;
  route: HelixThreadRoute;
  event_type: HelixThreadEventType;
  turn_id: string;
  session_id?: string | null;
  trace_id?: string | null;
  user_text?: string | null;
  assistant_text?: string | null;
  classifier_result?: HelixThreadClassifierResult | null;
  route_reason?: string | null;
  brief_status?: string | null;
  final_gate_outcome?: string | null;
  fail_reason?: string | null;
  answer_surface_mode?: HelixThreadAnswerSurfaceMode | null;
  memory_citation?: HelixThreadMemoryCitation | null;
  meta?: Record<string, unknown> | null;
};

export type HelixThreadEventInput = Omit<
  HelixThreadEvent,
  "kind" | "version" | "event_id" | "seq" | "ts" | "thread_id"
> & {
  event_id?: string;
  ts?: string;
  thread_id?: string | null;
};

export type HelixThreadTurn = {
  thread_id: string;
  turn_id: string;
  route: HelixThreadRoute;
  session_id?: string | null;
  trace_id?: string | null;
  status: HelixThreadTurnStatus;
  started_at: string;
  updated_at: string;
  user_text?: string | null;
  assistant_text?: string | null;
  classifier_result?: HelixThreadClassifierResult | null;
  route_reason?: string | null;
  brief_status?: string | null;
  final_gate_outcome?: string | null;
  fail_reason?: string | null;
  answer_surface_mode?: HelixThreadAnswerSurfaceMode | null;
  memory_citation?: HelixThreadMemoryCitation | null;
  last_seq: number;
  event_count: number;
};

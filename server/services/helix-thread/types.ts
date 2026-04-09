export type HelixThreadRoute = "/ask" | "/ask/conversation-turn";

export type HelixThreadStatus =
  | "idle"
  | "active"
  | "interrupted"
  | "failed"
  | "archived";

export type HelixTurnKind =
  | "ask"
  | "conversation_turn"
  | "review"
  | "compact"
  | "auxiliary";

export type HelixNonSteerableTurnKind = "review" | "compact";

export type HelixThreadItemType =
  | "userMessage"
  | "classification"
  | "brief"
  | "plan"
  | "retrieval"
  | "toolObservation"
  | "validation"
  | "answer"
  | "requestUserInput"
  | "approval"
  | "commandExecution"
  | "dynamicToolCall"
  | "review"
  | "contextCompaction";

export type HelixThreadItemStatus =
  | "in_progress"
  | "completed"
  | "failed"
  | "declined"
  | "cancelled";

export type HelixThreadItemStream = "plan" | "answer" | "tool" | "observation";

export type HelixThreadRequestKind =
  | "request_user_input"
  | "approval"
  | "elicitation";

export type HelixThreadEventType =
  | "thread_started"
  | "thread_resumed"
  | "thread_forked"
  | "thread_archived"
  | "turn_started"
  | "turn_completed"
  | "turn_failed"
  | "turn_interrupted"
  | "turn_plan_updated"
  | "item_started"
  | "item_delta"
  | "item_completed"
  | "server_request_created"
  | "server_request_resolved"
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

export type HelixThreadClaimLink = {
  claim_id: string;
  source_item_ids: string[];
};

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
  thread_status?: HelixThreadStatus | null;
  turn_kind?: HelixTurnKind | null;
  item_id?: string | null;
  item_type?: HelixThreadItemType | null;
  item_status?: HelixThreadItemStatus | null;
  item_stream?: HelixThreadItemStream | null;
  delta_text?: string | null;
  request_id?: string | null;
  request_kind?: HelixThreadRequestKind | null;
  request_payload?: Record<string, unknown> | null;
  observation_ref?: Record<string, unknown> | null;
  source_item_ids?: string[] | null;
  claim_links?: HelixThreadClaimLink[] | null;
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
  turn_kind?: HelixTurnKind | null;
  item_count: number;
  request_count: number;
  latest_plan_summary?: string | null;
  latest_answer_summary?: string | null;
  source_thread_id?: string | null;
  source_turn_id?: string | null;
};

export type HelixThreadItem = {
  thread_id: string;
  turn_id: string;
  item_id: string;
  item_type: HelixThreadItemType;
  item_status: HelixThreadItemStatus;
  item_stream?: HelixThreadItemStream | null;
  started_at: string;
  updated_at: string;
  completed_at?: string | null;
  text?: string | null;
  delta_count: number;
  last_seq: number;
  source_item_ids?: string[] | null;
  claim_links?: HelixThreadClaimLink[] | null;
  observation_ref?: Record<string, unknown> | null;
  meta?: Record<string, unknown> | null;
};

export type HelixThreadServerRequestStatus =
  | "pending"
  | "resolved"
  | "declined"
  | "cancelled";

export type HelixThreadServerRequest = {
  thread_id: string;
  turn_id: string;
  request_id: string;
  request_kind: HelixThreadRequestKind;
  status: HelixThreadServerRequestStatus;
  created_at: string;
  updated_at: string;
  resolved_at?: string | null;
  payload?: Record<string, unknown> | null;
  last_seq: number;
};

export type HelixThreadState = {
  thread_id: string;
  session_id?: string | null;
  status: HelixThreadStatus;
  turns: HelixThreadTurn[];
  items: HelixThreadItem[];
  unresolved_requests: HelixThreadServerRequest[];
  latest_turn_id?: string | null;
  active_turn_id?: string | null;
  latest_plan_summary?: string | null;
  latest_answer_summary?: string | null;
  latest_memory_citation?: HelixThreadMemoryCitation | null;
  item_count: number;
  request_count: number;
};

export type HelixThreadTurnState = HelixThreadTurn & {
  items: HelixThreadItem[];
  unresolved_requests: HelixThreadServerRequest[];
};

export type HelixThreadExecutionView = {
  thread_id: string;
  turn_id: string;
  turn_kind?: HelixTurnKind | null;
  plan_items: HelixThreadItem[];
  retrieval_items: HelixThreadItem[];
  validation_items: HelixThreadItem[];
  answer_items: HelixThreadItem[];
  observation_items: HelixThreadItem[];
  unresolved_requests: HelixThreadServerRequest[];
  latest_plan_summary?: string | null;
  latest_answer_summary?: string | null;
};

export type HelixThreadCitationView = {
  thread_id: string;
  turn_id: string;
  source_item_ids: string[];
  observation_items: HelixThreadItem[];
  claim_links: HelixThreadClaimLink[];
  memory_citation: HelixThreadMemoryCitation | null;
};

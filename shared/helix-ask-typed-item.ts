export const HELIX_ASK_TYPED_ITEM_SCHEMA = "helix.ask_typed_item.v1" as const;
export const HELIX_ASK_TYPED_ITEM_DEBUG_EXPORT_SCHEMA =
  "helix.ask_typed_item_debug_export.v1" as const;
export const HELIX_ASK_TYPED_ITEM_LIFECYCLE_EVENT_SCHEMA =
  "helix.ask_typed_item_lifecycle_event.v1" as const;

export type HelixAskTypedItemKind =
  | "agent_message"
  | "reasoning"
  | "command_execution"
  | "file_change"
  | "mcp_tool_call"
  | "web_search"
  | "todo_list"
  | "error"
  | "user_message"
  | "classification"
  | "brief"
  | "plan"
  | "retrieval"
  | "tool_observation"
  | "validation"
  | "request_user_input"
  | "approval"
  | "dynamic_tool_call"
  | "review"
  | "context_compaction"
  | "observation_journal_entry"
  | "field_worker_run"
  | "field_evaluation"
  | "terminal_assistant_answer"
  | "typed_failure";

export type HelixAskTypedItemStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "failed"
  | "blocked"
  | "declined"
  | "cancelled";

export type HelixAskTypedItem = {
  schema: typeof HELIX_ASK_TYPED_ITEM_SCHEMA;
  thread_id: string;
  turn_id?: string | null;
  situation_run_id?: string | null;
  item_id: string;
  item_kind: HelixAskTypedItemKind;
  status: HelixAskTypedItemStatus;
  evidence_refs: string[];
  assistant_answer: boolean;
  raw_content_included: false;
  terminal_eligible?: boolean;
  source_item_type?: string | null;
  created_at: string;
  updated_at?: string | null;
};

export type HelixAskTypedItemLifecycleEventType =
  | "thread.started"
  | "turn.started"
  | "item.started"
  | "item.updated"
  | "item.completed"
  | "turn.completed"
  | "turn.failed";

export type HelixAskTypedItemLifecycleEvent = {
  schema: typeof HELIX_ASK_TYPED_ITEM_LIFECYCLE_EVENT_SCHEMA;
  event_id: string;
  event_type: HelixAskTypedItemLifecycleEventType;
  thread_id: string;
  turn_id?: string | null;
  item_id?: string | null;
  item_kind?: HelixAskTypedItemKind | null;
  status?: HelixAskTypedItemStatus | null;
  assistant_answer: false;
  raw_content_included: false;
  created_at: string;
};

export type HelixAskTypedItemDebugExport = {
  schema: typeof HELIX_ASK_TYPED_ITEM_DEBUG_EXPORT_SCHEMA;
  thread_id: string;
  turn_id?: string | null;
  items: HelixAskTypedItem[];
  events: HelixAskTypedItemLifecycleEvent[];
  terminal_item_id?: string | null;
  assistant_answer_item_count: number;
  assistant_answer: false;
  raw_content_included: false;
  created_at: string;
};

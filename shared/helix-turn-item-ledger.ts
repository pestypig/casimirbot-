export const HELIX_TURN_ITEM_SCHEMA = "helix.turn_item.v1" as const;
export const HELIX_TURN_ITEM_LEDGER_SCHEMA = "helix.turn_item_ledger.v1" as const;

export type HelixTurnItemKind =
  | "user_input"
  | "source_event"
  | "dynamic_tool_call"
  | "tool_observation"
  | "validation"
  | "synthetic_evidence"
  | "request_user_input"
  | "ui_projection"
  | "worker_lifecycle"
  | "assistant_answer"
  | "failure";

export type HelixTurnItemPhase =
  | "planned"
  | "started"
  | "completed"
  | "failed"
  | "blocked";

export type HelixTurnItem = {
  schema: typeof HELIX_TURN_ITEM_SCHEMA;
  item_id: string;
  thread_id: string;
  turn_id: string;
  kind: HelixTurnItemKind;
  phase: HelixTurnItemPhase;
  summary: string;
  text?: string | null;
  evidence_refs: string[];
  related_ids: string[];
  assistant_answer: boolean;
  raw_content_included: false;
  created_at: string;
};

export type HelixTurnItemLedger = {
  schema: typeof HELIX_TURN_ITEM_LEDGER_SCHEMA;
  thread_id: string;
  turn_id: string;
  items: HelixTurnItem[];
  terminal_item_id: string;
  assistant_answer_item_count: number;
  request_user_input_item_count: number;
  worker_output_promoted_to_answer_count: 0;
  raw_content_included: false;
  assistant_answer: false;
};

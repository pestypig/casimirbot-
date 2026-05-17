export const HELIX_TERMINAL_TURN_STATE_SCHEMA =
  "helix.terminal_turn_state.v1" as const;

export type HelixTerminalTurnState = {
  schema: typeof HELIX_TERMINAL_TURN_STATE_SCHEMA;
  thread_id: string;
  turn_id: string;
  terminal_item_id: string;
  terminal_kind:
    | "assistant_answer"
    | "workspace_action_receipt"
    | "request_user_input"
    | "error";
  server_authoritative: true;
  assistant_answer: false;
  raw_content_included: false;
  created_at: string;
};

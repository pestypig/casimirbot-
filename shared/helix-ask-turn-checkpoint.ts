export const HELIX_ASK_TURN_CHECKPOINT_SCHEMA =
  "helix.ask.turn_checkpoint.v1" as const;

export const HELIX_ASK_TURN_RECOVERY_SCHEMA =
  "helix.ask.turn_recovery.v1" as const;

export type HelixAskTurnCheckpointType =
  | "turn_started"
  | "transcript_event"
  | "terminal_payload"
  | "turn_completed"
  | "turn_failed"
  | "turn_interrupted";

export type HelixAskTurnCheckpointStatus =
  | "running"
  | "checkpointed"
  | "final_answer"
  | "final_failure"
  | "pending_input"
  | "completed"
  | "failed"
  | "interrupted";

export type HelixAskTurnCheckpointTranscriptEvent = {
  id: string;
  turn_id?: string | null;
  seq?: number;
  at_ms: number;
  role: "user" | "agent" | "tool" | "final" | "system";
  type: string;
  status?: string | null;
  text: string;
  detail?: string | null;
  source_event_type?: string | null;
  event_source?: "live" | "runtime" | "reconstructed";
  reconstructed?: boolean;
};

export type HelixAskTurnCheckpointAuthority = {
  assistant_answer: false;
  raw_content_included: false;
  terminal_eligible: false;
  terminal_ineligible_reason: "ask_turn_checkpoint_is_recovery_context_only";
};

export type HelixAskTurnCheckpointRecord = {
  schema: typeof HELIX_ASK_TURN_CHECKPOINT_SCHEMA;
  record_id: string;
  recorded_at: string;
  thread_id: string;
  turn_id: string;
  session_id?: string | null;
  trace_id?: string | null;
  route: "/ask" | "/ask/turn" | "/ask/turn/stream" | string;
  checkpoint_type: HelixAskTurnCheckpointType;
  status: HelixAskTurnCheckpointStatus;
  prompt_text?: string | null;
  transcript_event?: HelixAskTurnCheckpointTranscriptEvent | null;
  terminal_text?: string | null;
  terminal_text_hash?: string | null;
  terminal_artifact_kind?: string | null;
  final_answer_source?: string | null;
  error_code?: string | null;
  authority: HelixAskTurnCheckpointAuthority;
};

export type HelixAskTurnRecovery = {
  schema: typeof HELIX_ASK_TURN_RECOVERY_SCHEMA;
  thread_id: string;
  turn_id: string;
  session_id?: string | null;
  trace_id?: string | null;
  status: HelixAskTurnCheckpointStatus | "unknown";
  recoverable: boolean;
  checkpoint_count: number;
  last_checkpoint_at?: string | null;
  prompt_text?: string | null;
  transcript_events: HelixAskTurnCheckpointTranscriptEvent[];
  latest_visible_text?: string | null;
  terminal_text?: string | null;
  terminal_text_hash?: string | null;
  terminal_artifact_kind?: string | null;
  final_answer_source?: string | null;
  authority: HelixAskTurnCheckpointAuthority;
};

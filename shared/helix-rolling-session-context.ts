export const HELIX_ROLLING_SESSION_CONTEXT_PACKET_SCHEMA =
  "helix.rolling_session_context_packet.v1" as const;

export type HelixRollingSessionCompactionMode =
  | "none"
  | "recommended"
  | "required";

export type HelixContextFidelityCompactionMode =
  | "none"
  | "eligible"
  | "active"
  | "forced";

export type HelixContextFidelityHandoffState =
  | "idle"
  | "pause_recommended"
  | "pause_required"
  | "compacting";

export type HelixContextFidelityMeter = {
  schema: "helix.context_fidelity_meter.v1";
  model_context_window_tokens: number;
  active_context_total_tokens: number;
  usage_ratio: number;
  auto_compact_token_limit: number;
  compact_warning_ratio: number;
  compaction_mode: HelixContextFidelityCompactionMode;
  retained_turn_ids: string[];
  compacted_turn_ids: string[];
  pending_user_inputs_count: number;
  unresolved_task_frames_count: number;
  model_visible_context_included: boolean;
  model_visible_context_token_estimate: number;
  raw_history_excluded: boolean;
  handoff_state: {
    state: HelixContextFidelityHandoffState;
    chat_turns_paused: boolean;
    reason: string;
  };
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

export type HelixContextCompactionLifecycleItem = {
  schema: "helix.context_compaction_lifecycle_item.v1";
  item_type: "context_compaction";
  trigger: "auto";
  phase: "pre_turn";
  status: "not_required" | "recommended" | "paused_for_resume";
  reason: string;
  model_context_window_tokens: number;
  active_context_total_tokens: number;
  auto_compact_token_limit: number;
  replacement_context_summary: string;
  replacement_history_available: boolean;
  resume_frame_required: boolean;
  codex_parity_note: string;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

export type HelixRollingSessionContextPacket = {
  schema: typeof HELIX_ROLLING_SESSION_CONTEXT_PACKET_SCHEMA;

  thread_id: string;
  current_turn_id: string;
  session_id?: string | null;

  context_scope: "current_thread";
  accounting_version: "v1";

  model_context_window_tokens: number;
  auto_compact_token_limit: number;

  estimated_tokens: {
    current_user_prompt: number;
    prior_thread_turns: number;
    retained_turns: number;
    compacted_summary: number;
    conversation_memory_packet: number;
    current_turn_attachments?: number;
    active_context_total: number;
  };

  compaction_mode: HelixRollingSessionCompactionMode;
  compaction_reason: string;
  full_context_window_limit_reached: boolean;
  context_fidelity_meter: HelixContextFidelityMeter;
  context_compaction_item: HelixContextCompactionLifecycleItem;

  retained_turn_ids: string[];
  compacted_turn_ids: string[];
  dropped_turn_ids: string[];

  retained_context_summary: string;
  compacted_context_summary: string;
  model_visible_summary: string;

  missing_or_uncertain: string[];

  terminal_eligible: false;
  assistant_answer: false;
  raw_content_included: false;
};

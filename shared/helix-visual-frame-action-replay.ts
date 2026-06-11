export const HELIX_VISUAL_FRAME_ACTION_REPLAY_REQUEST_SCHEMA =
  "helix.visual_frame_action_replay_request.v1" as const;
export const HELIX_VISUAL_FRAME_ACTION_REPLAY_RESULT_SCHEMA =
  "helix.visual_frame_action_replay_result.v1" as const;

export type HelixVisualFrameActionReplayStatus =
  | "pending_client_frames"
  | "running"
  | "completed"
  | "failed"
  | "expired";

export type HelixVisualFrameActionReplayRequest = {
  schema: typeof HELIX_VISUAL_FRAME_ACTION_REPLAY_REQUEST_SCHEMA;
  replay_request_id: string;
  thread_id: string;
  room_id?: string | null;
  environment_id?: string | null;
  source_id: string;
  requested_frame_history_ids: string[];
  requested_frame_ids: string[];
  from_ts?: string | null;
  to_ts?: string | null;
  summary_query?: string | null;
  shade_profile_ids: string[];
  max_frames: number;
  status: HelixVisualFrameActionReplayStatus;
  requested_at: string;
  updated_at: string;
  expires_at: string;
  client_claimed_at?: string | null;
  completed_at?: string | null;
  result_count: number;
  failure_reason?: string | null;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
  context_role: "tool_evidence";
};

export type HelixVisualFrameActionReplayResult = {
  schema: typeof HELIX_VISUAL_FRAME_ACTION_REPLAY_RESULT_SCHEMA;
  replay_result_id: string;
  replay_request_id: string;
  thread_id: string;
  source_id: string;
  source_frame_history_id?: string | null;
  source_frame_id?: string | null;
  replay_frame_id?: string | null;
  evidence_id?: string | null;
  shade_profile_id?: string | null;
  shade_title?: string | null;
  visual_prompt_hash?: string | null;
  summary: string;
  status: "completed" | "failed" | "skipped";
  failure_reason?: string | null;
  created_at: string;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
  context_role: "tool_evidence";
};

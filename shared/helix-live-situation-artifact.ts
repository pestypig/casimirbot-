export const HELIX_LIVE_SITUATION_ARTIFACT_SCHEMA =
  "helix.live_situation_artifact.v1" as const;
export const HELIX_LIVE_SITUATION_ARTIFACT_DELTA_SCHEMA =
  "helix.live_situation_artifact_delta.v1" as const;
export const HELIX_LIVE_SITUATION_SUBGOAL_SCHEMA =
  "helix.live_situation_subgoal.v1" as const;
export const HELIX_LIVE_SITUATION_EVALUATION_SCHEMA =
  "helix.live_situation_evaluation.v1" as const;

export type LiveSituationArtifactStatus =
  | "active"
  | "paused"
  | "completed"
  | "error";

export type LiveSituationArtifactMode =
  | "text_only"
  | "voice_on_confirm"
  | "critical_voice"
  | "direct_address_only";

export type LiveSituationSubgoalStatus =
  | "hypothesis"
  | "active"
  | "progress"
  | "blocked"
  | "completed"
  | "stale";

export type LiveSituationSubgoal = {
  schema: typeof HELIX_LIVE_SITUATION_SUBGOAL_SCHEMA;
  subgoal_id: string;
  label: string;
  status: LiveSituationSubgoalStatus;
  confidence: number;
  evidence_refs: string[];
  updated_at: string;
};

export type LiveSituationEvaluation = {
  schema: typeof HELIX_LIVE_SITUATION_EVALUATION_SCHEMA;
  evaluation_id: string;
  artifact_id: string;
  thread_id: string;
  trigger:
    | "source_event"
    | "episode_update"
    | "risk_update"
    | "goal_progress"
    | "goal_blocked"
    | "direct_user_question"
    | "manual_refresh";
  summary: string;
  recommendation?: string | null;
  interjection_decision:
    | "silent_keep_in_context"
    | "show_text"
    | "voice_on_confirm"
    | "request_user_input";
  model_invoked: boolean;
  deterministic_gate: boolean;
  evidence_refs: string[];
  created_at: string;
};

export type LiveSituationArtifact = {
  schema: typeof HELIX_LIVE_SITUATION_ARTIFACT_SCHEMA;
  artifact_id: string;
  thread_id: string;
  created_turn_id: string;
  session_id?: string | null;
  room_id: string;
  world_id?: string | null;
  source_ids: string[];
  graph_id?: string | null;
  status: LiveSituationArtifactStatus;
  mode: LiveSituationArtifactMode;
  objective: string;
  current_state_lines: {
    now: string;
    goal: string;
    risk: string;
    progress: string;
    unknowns: string;
    last_decision: string;
  };
  subgoals: LiveSituationSubgoal[];
  latest_evaluation?: LiveSituationEvaluation | null;
  evidence_refs: string[];
  created_at: string;
  updated_at: string;
  context_policy: "compact_context_pack_only";
  raw_transcript_included: false;
  raw_audio_included: false;
  deterministic_content_role: "observation_not_assistant_answer";
};

export type LiveSituationArtifactDelta = {
  schema: typeof HELIX_LIVE_SITUATION_ARTIFACT_DELTA_SCHEMA;
  delta_id: string;
  artifact_id: string;
  thread_id: string;
  turn_id: string;
  reason:
    | "source_event"
    | "episode_update"
    | "risk_update"
    | "goal_progress"
    | "goal_blocked"
    | "manual_refresh";
  previous_hash?: string | null;
  next_hash: string;
  changed_fields: string[];
  artifact_snapshot: LiveSituationArtifact;
  evidence_refs: string[];
  ts: string;
};

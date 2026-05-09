export const HELIX_SITUATION_CONTEXT_PACK_SCHEMA =
  "helix.situation_context_pack.v1" as const;

export type SituationContextPack = {
  schema: typeof HELIX_SITUATION_CONTEXT_PACK_SCHEMA;
  context_pack_id: string;
  thread_id: string;
  room_id: string;
  session_id?: string | null;
  mission_memory?: import("./helix-mission-memory").HelixMissionMemory | null;
  live_situation_artifact?: {
    artifact_id: string;
    objective: string;
    current_state_lines: import("./helix-live-situation-artifact").LiveSituationArtifact["current_state_lines"];
    subgoals: import("./helix-live-situation-artifact").LiveSituationSubgoal[];
    latest_evaluation?: import("./helix-live-situation-artifact").LiveSituationEvaluation | null;
  } | null;
  live_answer_environment?: {
    environment_id: string;
    objective: string;
    lines: import("./helix-live-answer-environment").LiveAnswerLineState[];
    subgoals?: import("./helix-live-answer-environment").LiveAnswerEnvironmentSubgoal[];
    latest_evaluation?: import("./helix-live-answer-environment").LiveAnswerEvaluation | null;
    latest_summary: string;
    evidence_refs: string[];
    updated_at: string;
  } | null;
  objective?: string | null;
  current_goal?: string | null;
  latest_projection?: Record<string, unknown> | null;
  recent_episodes: Array<{
    episode_id: string;
    summary: string;
    narration?: string | null;
    prediction?: string | null;
    evidence_refs: string[];
  }>;
  active_predictions: Array<{
    predicted_goal: string;
    confidence: number;
    status: string;
    evidence_refs: string[];
  }>;
  recent_salience: Array<{
    reason: string;
    priority: string;
    summary: string;
    should_notify_helix: boolean;
    evidence_refs: string[];
  }>;
  callouts: unknown[];
  suppression_summary: Record<string, number>;
  known_risks: string[];
  known_unknowns: string[];
  evidence_refs: string[];
  created_at: string;
  context_policy: "compact_context_pack_only";
  raw_logs_included?: false;
  raw_transcript_included: false;
  raw_audio_included: false;
  deterministic_content_role: "observation_not_assistant_answer";
};

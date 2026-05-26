export const HELIX_LIVE_ENVIRONMENT_COMMENTARY_SCHEMA =
  "helix.live_environment_commentary.v1" as const;

export type HelixLiveEnvironmentCommentarySubject =
  | "dottie_observer"
  | "minecraft_route"
  | "source_health"
  | "visual_source"
  | "workstation_pipeline"
  | "translation"
  | "browser_audio"
  | "terminal_authority"
  | "unknown";

export type HelixLiveEnvironmentCommentaryKind =
  | "observation"
  | "prediction"
  | "missing_evidence"
  | "salience_candidate"
  | "tool_trace"
  | "field_evaluation"
  | "terminal_ready"
  | "terminal_blocked";

export type HelixLiveEnvironmentCommentaryStatus =
  | "candidate"
  | "observed"
  | "blocked"
  | "satisfied"
  | "needs_more_evidence"
  | "policy_pending"
  | "policy_approved";

export type HelixLiveEnvironmentCommentary = {
  schema: typeof HELIX_LIVE_ENVIRONMENT_COMMENTARY_SCHEMA;
  commentary_id: string;
  thread_id: string;
  room_id?: string | null;
  environment_id?: string | null;
  subject: HelixLiveEnvironmentCommentarySubject;
  kind: HelixLiveEnvironmentCommentaryKind;
  status: HelixLiveEnvironmentCommentaryStatus;
  compact_summary: string;
  evidence_refs: string[];
  related_artifact_ids: string[];
  related_worker_ids?: string[];
  related_perturbation_ids?: string[];
  missing_evidence: string[];
  confidence: number;
  model_invoked: boolean;
  derived_by_deterministic_reducer: boolean;
  assistant_answer: false;
  raw_content_included: false;
  raw_user_text_included: false;
  instruction_authority: "none";
  ask_instruction_authority: "none";
  context_role: "tool_evidence";
  ask_context_policy: "evidence_only";
  created_at: string;
};

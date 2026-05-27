export const HELIX_SITUATION_CONSTRUCT_SCHEMA =
  "helix.situation_construct.v1" as const;

export type HelixSituationConstructType =
  | "live_environment"
  | "source_binding"
  | "transcription_job"
  | "observer"
  | "voice_policy"
  | "commentary_policy"
  | "field_worker_policy"
  | "field_worker"
  | "dottie_manifest"
  | "route_evidence_view"
  | "live_answer_output"
  | "commentary_output"
  | "note_output";

export type HelixSituationConstructStatus =
  | "planned"
  | "receipt_only"
  | "active"
  | "blocked"
  | "stale"
  | "detached"
  | "completed";

export type HelixSituationConstructOutputKind =
  | "live_answer_environment"
  | "transcript_stream"
  | "typed_commentary"
  | "voice_proposal"
  | "route_evidence_view"
  | "note";

export type HelixSituationConstructOutputBinding = {
  output_kind: HelixSituationConstructOutputKind;
  artifact_ref?: string | null;
  status: "planned" | "active" | "blocked" | "detached";
};

export const HELIX_LIVE_ANSWER_CONSTRUCT_LINE_KEYS = [
  "agent_commentary",
  "route_evidence",
  "missing_evidence",
  "situation",
  "latest_transcript",
] as const;

export type HelixLiveAnswerConstructLineKey = (typeof HELIX_LIVE_ANSWER_CONSTRUCT_LINE_KEYS)[number];

export type HelixSituationConstruct = {
  schema: typeof HELIX_SITUATION_CONSTRUCT_SCHEMA;
  construct_id: string;
  type: HelixSituationConstructType;
  name: string;
  description?: string | null;
  status: HelixSituationConstructStatus;
  thread_id: string;
  room_id: string;
  environment_id?: string | null;
  source_ids: string[];
  parent_construct_ids: string[];
  child_construct_ids: string[];
  artifact_refs: string[];
  receipt_refs: string[];
  commentary_refs: string[];
  evidence_refs: string[];
  output_bindings: HelixSituationConstructOutputBinding[];
  policy: {
    may_execute_tools: boolean;
    allowed_tools: string[];
    may_spawn_workers: boolean;
    may_speak: boolean;
    may_surface_user_text: boolean;
    requires_user_confirmation: boolean;
    witness_only: boolean;
  };
  safety: {
    assistant_answer: false;
    raw_content_included: false;
    raw_audio_included: false;
    raw_user_text_included: false;
    instruction_authority: "none";
    ask_instruction_authority: "none";
    ask_context_policy: "evidence_only" | "operator_only" | "not_admissible";
    context_role: "tool_evidence" | "operator_referral";
  };
  created_at: string;
  updated_at: string;
};

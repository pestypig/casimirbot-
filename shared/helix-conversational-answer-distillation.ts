export const HELIX_CONVERSATIONAL_ANSWER_DISTILLATION_SCHEMA =
  "helix.conversational_answer_distillation.v1" as const;

export type HelixConversationalAnswerSourceKind =
  | "situation_context_question"
  | "procedure_epoch_replay"
  | "live_pipeline_receipt"
  | "tool_evaluation"
  | "direct_answer";

export type HelixConversationalAnswerStyle =
  | "brief"
  | "operational"
  | "voice"
  | "debug";

export type HelixConversationalAnswerDistillation = {
  schema: typeof HELIX_CONVERSATIONAL_ANSWER_DISTILLATION_SCHEMA;
  distillation_id: string;
  turn_id: string;
  thread_id: string;
  situation_run_id?: string | null;
  source_answer_kind: HelixConversationalAnswerSourceKind;
  full_reasoning_refs: string[];
  selected_evidence_refs: string[];
  concise_answer: string;
  caveat?: string | null;
  expansion_available: boolean;
  expansion_ref?: string | null;
  style: HelixConversationalAnswerStyle;
  assistant_answer: false;
  raw_content_included: false;
};

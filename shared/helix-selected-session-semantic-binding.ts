export const HELIX_SELECTED_SESSION_SEMANTIC_BINDING_SCHEMA =
  "helix.selected_session_semantic_binding.v1" as const;

export type HelixSessionSemanticBindingMatchBasis =
  | "literal_reuse"
  | "recent_user_phrase"
  | "visible_label"
  | "prior_scene_memory"
  | "procedure_memory"
  | "operator_correction"
  | "semantic_similarity";

export type HelixSelectedSessionSemanticBindingEntry = {
  user_phrase: string;
  bound_kind:
    | "visual_scene"
    | "folder_label"
    | "app_window"
    | "file_term"
    | "recent_activity"
    | "prior_user_label"
    | "unknown";
  bound_ref: string;
  confidence: number;
  evidence_refs: string[];
  match_basis: HelixSessionSemanticBindingMatchBasis;
};

export type HelixRejectedSessionSemanticBindingEntry = {
  user_phrase: string;
  candidate_ref: string;
  reason:
    | "lower_confidence"
    | "wrong_domain"
    | "too_old"
    | "ambiguous"
    | "missing_evidence"
    | "outside_session_scope";
  confidence: number;
  evidence_refs: string[];
};

export type HelixSelectedSessionSemanticBinding = {
  schema: typeof HELIX_SELECTED_SESSION_SEMANTIC_BINDING_SCHEMA;
  binding_id: string;
  turn_id: string;
  thread_id: string;
  semantic_intent_id: string;
  selected_bindings: HelixSelectedSessionSemanticBindingEntry[];
  rejected_bindings: HelixRejectedSessionSemanticBindingEntry[];
  ambiguity:
    | "none"
    | "multiple_plausible_bindings"
    | "missing_local_referent"
    | "insufficient_context";
  missing_evidence: string[];
  assistant_answer: false;
  raw_content_included: false;
};

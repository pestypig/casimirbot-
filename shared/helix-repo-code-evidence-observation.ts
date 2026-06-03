import type { HelixEvidenceObservation } from "./helix-evidence-observation";

export const HELIX_REPO_CODE_EVIDENCE_OBSERVATION_SCHEMA =
  "helix.repo_code_evidence_observation.v1" as const;

export const HELIX_REPO_CODE_SEARCH_CONCEPT_CAPABILITY =
  "repo-code.search_concept" as const;

export const HELIX_MODEL_SYNTHESIZE_FROM_REPO_EVIDENCE_CAPABILITY =
  "model.synthesize_from_repo_evidence" as const;

export const HELIX_REPO_SYNTHESIS_STEP_IDENTITY_REPAIR_SCHEMA =
  "helix.repo_synthesis_step_identity_repair.v1" as const;

export type HelixRepoCodeEvidenceObservation = {
  schema: typeof HELIX_REPO_CODE_EVIDENCE_OBSERVATION_SCHEMA;
  artifact_id: string;
  turn_id: string;
  concept: string;
  query: string;
  normalized_terms: string[];
  search_strategy: {
    exact_terms: string[];
    symbol_terms: string[];
    path_globs_considered: string[];
    max_spans: number;
  };
  evidence_refs: string[];
  observations: HelixEvidenceObservation[];
  spans: Array<{
    ref: string;
    path: string;
    start_line: number;
    end_line: number;
    excerpt: string;
    raw_excerpt?: string;
    sanitized_excerpt?: string;
    raw_excerpt_hash?: string;
    sanitizer_changed?: boolean;
    reason: string;
    source_kind: "repo_code" | "repo_doc";
    score: number;
  }>;
  source_target_exact_contract?: {
    schema: "helix.source_target_exact_contract.v1";
    contract_id: string;
    turn_id: string;
    requested_source_kind: string;
    requested_source_identity: string;
    requested_path?: string;
    requested_heading?: string;
    extraction_status: "found" | "ambiguous" | "missing" | "unsupported";
    evidence_refs: string[];
    evidence_hash: string;
    required_terms: string[];
    required_claims: string[];
    unsupported_terms: string[];
    unsupported_claims: string[];
    terminal_allowed: boolean;
    assistant_answer: false;
    raw_content_included: false;
  };
  selected_for_answer: boolean;
  assistant_answer: false;
  raw_content_included: false;
};

export type HelixRepoCodeEvidenceAnswerKind =
  | "repo_code_evidence_answer"
  | "repo_entity_definition";

export type HelixRepoCodeEvidenceAnswerContract = {
  schema: "helix.repo_code_evidence_answer_contract.v1";
  turn_id: string;
  required_terminal_product: HelixRepoCodeEvidenceAnswerKind;
  required_capability: typeof HELIX_REPO_CODE_SEARCH_CONCEPT_CAPABILITY;
  required_observation_schema: typeof HELIX_REPO_CODE_EVIDENCE_OBSERVATION_SCHEMA;
  required_observation_kinds: ["repo_code_evidence_observation"];
  forbidden_terminal_artifact_kinds: [
    "direct_answer_text",
    "no_tool_direct",
    "model_only_concept",
    "panel_generated_answer",
  ];
  requires_followup_model_synthesis: true;
  requires_file_evidence_refs: true;
  assistant_answer: false;
  raw_content_included: false;
};

export type HelixRepoCodeEvidenceAnswer = {
  schema: "helix.repo_code_evidence_answer.v1";
  artifact_id: string;
  turn_id: string;
  concept: string;
  answer_text: string;
  final_answer_draft_ref?: string;
  final_answer_draft_authority?: "llm_post_observation_composer" | "deterministic_receipt_fallback" | "typed_failure";
  model_step_capability?: typeof HELIX_MODEL_SYNTHESIZE_FROM_REPO_EVIDENCE_CAPABILITY;
  model_authored?: boolean;
  synthesis_attempt_ref?: string;
  source_observation_refs?: string[];
  support_refs: string[];
  claim_support_ref?: string;
  raw_spans_debug_ref?: string;
  uncertainty: string[];
  evidence_observation_ref: string;
  assistant_answer: true;
  raw_content_included: false;
};

export type HelixRepoEvidenceSynthesisAttempt = {
  schema: "helix.repo_evidence_synthesis_attempt.v1";
  attempt_id: string;
  turn_id: string;
  source_observation_refs: string[];
  model_input_refs: string[];
  produced_final_answer_draft_ref?: string;
  produced_repo_code_evidence_answer_ref?: string;
  model_invoked: true;
  model_step_kind: "post_observation_synthesis";
  model_step_capability?: typeof HELIX_MODEL_SYNTHESIZE_FROM_REPO_EVIDENCE_CAPABILITY;
  required_terminal_kind?: "repo_code_evidence_answer";
  status:
    | "succeeded"
    | "empty"
    | "stale"
    | "excerpt_like"
    | "renderer_hostile"
    | "unsupported_claims"
    | "failed";
  assistant_answer: false;
  raw_content_included: false;
};

export type HelixRepoSynthesisStepIdentityRepair = {
  schema: typeof HELIX_REPO_SYNTHESIS_STEP_IDENTITY_REPAIR_SCHEMA;
  turn_id: string;
  observation_id: string;
  rejected_capability: "model.direct_answer";
  required_capability: typeof HELIX_MODEL_SYNTHESIZE_FROM_REPO_EVIDENCE_CAPABILITY;
  required_terminal_kind: "repo_code_evidence_answer";
  reason:
    | "repo_evidence_observation_present"
    | "repo_code_terminal_required"
    | "internal_concept_requires_repo_grounding";
  assistant_answer: false;
  raw_content_included: false;
};

export const HELIX_REPO_EVIDENCE_SYNTHESIS_REPAIR_OBSERVATION_SCHEMA =
  "helix.repo_evidence_synthesis_repair_observation.v1" as const;

export type HelixRepoEvidenceSynthesisRepairObservation = {
  schema: typeof HELIX_REPO_EVIDENCE_SYNTHESIS_REPAIR_OBSERVATION_SCHEMA;
  observation_id: string;
  turn_id: string;
  failed_attempt_ref: string;
  source_observation_refs: string[];
  repair_reason:
    | "empty_answer"
    | "stale_answer"
    | "excerpt_like_answer"
    | "renderer_hostile_answer"
    | "unsupported_claims"
    | "missing_support_refs"
    | "canned_fallback_text";
  instruction_to_model: string;
  assistant_answer: false;
  raw_content_included: false;
};

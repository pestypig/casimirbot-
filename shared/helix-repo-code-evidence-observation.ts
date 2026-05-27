import type { HelixEvidenceObservation } from "./helix-evidence-observation";

export const HELIX_REPO_CODE_EVIDENCE_OBSERVATION_SCHEMA =
  "helix.repo_code_evidence_observation.v1" as const;

export const HELIX_REPO_CODE_SEARCH_CONCEPT_CAPABILITY =
  "repo-code.search_concept" as const;

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
    reason: string;
    source_kind: "repo_code" | "repo_doc";
    score: number;
  }>;
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
  support_refs: string[];
  uncertainty: string[];
  evidence_observation_ref: string;
  assistant_answer: true;
  raw_content_included: false;
};

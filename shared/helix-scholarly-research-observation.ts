export const HELIX_SCHOLARLY_RESEARCH_OBSERVATION_SCHEMA =
  "helix.scholarly_research_observation.v1" as const;

export const HELIX_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY =
  "scholarly-research.lookup_papers" as const;

export const HELIX_SCHOLARLY_FULL_TEXT_OBSERVATION_SCHEMA =
  "helix.scholarly_full_text_observation.v1" as const;

export const HELIX_SCHOLARLY_FULL_TEXT_FETCH_CAPABILITY =
  "scholarly-research.fetch_full_text" as const;

export const HELIX_SCHOLARLY_NUMERIC_PARAMETER_OBSERVATION_SCHEMA =
  "helix.scholarly_numeric_parameter_observation.v1" as const;

export const HELIX_SCHOLARLY_NUMERIC_PARAMETER_EXTRACT_CAPABILITY =
  "scholarly-research.extract_numeric_parameters" as const;

export const HELIX_MODEL_SYNTHESIZE_FROM_SCHOLARLY_RESEARCH_CAPABILITY =
  "model.synthesize_from_scholarly_research" as const;

export type HelixScholarlyResearchProvider =
  | "pubmed"
  | "arxiv"
  | "openalex"
  | "crossref"
  | "semantic_scholar"
  | "unpaywall"
  | "core";

export type HelixScholarlyResearchIntentMode =
  | "paper_search"
  | "doi_lookup"
  | "citation_lookup"
  | "reference_lookup"
  | "bibliography_repair";

export type HelixScholarlyRequestedWorkflow =
  | "metadata_search"
  | "doi_lookup"
  | "full_text_summary"
  | "numeric_extraction"
  | "numeric_calculation"
  | "bibliography_repair";

export type HelixScholarlyTerminalEvidenceRequirement =
  | "metadata"
  | "full_text"
  | "numeric_values"
  | "calculation_from_numeric_values";

export type HelixScholarlyEvidenceDepth =
  | "metadata_lookup"
  | "abstract_or_snippet"
  | "full_text"
  | "page_image_parse"
  | "scientific_evidence_packet"
  | "numeric_values"
  | "calculation_from_numeric_values";

export type HelixScholarlyEvidenceProduct =
  | "paper_metadata"
  | "full_text_summary"
  | "page_grounded_passage"
  | "exact_equation"
  | "numeric_parameters"
  | "calculation";

export type HelixScholarlyEvidenceAlternative = {
  product: HelixScholarlyEvidenceProduct;
  minimum_depth: HelixScholarlyEvidenceDepth;
  exactness: "bounded" | "exact";
};

export type HelixScholarlyEvidenceDemand = {
  schema: "helix.scholarly_evidence_demand.v1";
  satisfaction: "all_of" | "any_of";
  alternatives: HelixScholarlyEvidenceAlternative[];
  required_modes: string[];
  optional_modes: string[];
  minimum_satisfying_depth: HelixScholarlyEvidenceDepth;
  derivation_reasons: string[];
  assistant_answer: false;
  raw_content_included: false;
};

export type HelixScholarlySourceTargetKind =
  | "pubmed"
  | "pmc"
  | "doi"
  | "arxiv"
  | "pdf"
  | "publisher";

export type HelixScholarlySourceTarget = {
  schema: "helix.scholarly_source_target.v1";
  source_url: string;
  canonical_url: string;
  kind: HelixScholarlySourceTargetKind;
  retrieval_strategy: "metadata_lookup" | "direct_full_text";
  doi?: string;
  arxiv_id?: string;
  pmid?: string;
  pmcid?: string;
};

export type HelixScholarlyIntent = {
  schema: "helix.scholarly_intent.v1";
  original_prompt: string;
  scholarly_query: string;
  quoted_topic?: string;
  requested_workflow: HelixScholarlyRequestedWorkflow;
  requested_outputs: string[];
  requires_full_text: boolean;
  requires_numeric_extraction: boolean;
  requires_calculation: boolean;
  terminal_evidence_requirement: HelixScholarlyTerminalEvidenceRequirement;
  evidence_demand: HelixScholarlyEvidenceDemand;
  query_normalization_reasons: string[];
  supporting_sources_only?: boolean;
  source_targets?: HelixScholarlySourceTarget[];
  assistant_answer: false;
  raw_content_included: false;
};

export type HelixScholarlyCapabilityChainPlan = {
  schema: "helix.scholarly_capability_chain_plan.v1";
  requested_workflow: HelixScholarlyRequestedWorkflow;
  planned_capabilities: string[];
  terminal_evidence_requirement: HelixScholarlyTerminalEvidenceRequirement;
  calculator_requires_numeric_evidence: boolean;
  assistant_answer: false;
  raw_content_included: false;
};

export type HelixScholarlyEvidenceState =
  | "lookup_usable"
  | "lookup_weak_match"
  | "lookup_blocked"
  | "full_text_usable"
  | "full_text_unavailable"
  | "page_image_parse_required"
  | "numeric_evidence_usable"
  | "numeric_evidence_missing"
  | "answer_ready"
  | "answer_blocked";

export const HELIX_SCHOLARLY_TERMINAL_READY_EVIDENCE_STATES = [
  "lookup_usable",
  "full_text_usable",
  "numeric_evidence_usable",
  "answer_ready",
] as const satisfies readonly HelixScholarlyEvidenceState[];

export type HelixScholarlyResponseMode =
  | "scholarly_metadata_answer"
  | "scholarly_exploratory_candidates"
  | "scholarly_recovery_plan"
  | "scholarly_full_text_answer"
  | "scholarly_parse_required"
  | "scholarly_numeric_binding"
  | "scholarly_numeric_missing"
  | "scholarly_research_answer";

export type HelixScholarlyResponseModeSelection = {
  schema: "helix.scholarly_response_mode_selection.v1";
  scholarly_response_mode: HelixScholarlyResponseMode;
  allowed_response_modes: HelixScholarlyResponseMode[];
  selected_response_mode: HelixScholarlyResponseMode;
  evidence_state: HelixScholarlyEvidenceState | string | null;
  selected_for_answer: boolean;
  selected_for_exploration: boolean;
  candidate_relevance_reasons: unknown[];
  rejected_candidate_reasons: unknown[];
  next_affordances: unknown[];
  recovery_queries?: string[];
  missing_requirements?: string[];
  terminal_artifact_kind: string;
  terminal_eligible?: boolean;
  assistant_answer: false;
  raw_content_included: false;
};

export type HelixScholarlyNextAffordance = {
  capability: string;
  reason: string;
  query?: string;
  source_ref?: string;
  paper_result_id?: string;
  variables?: string[];
};

export type HelixScholarlyRecoveryAffordance = {
  schema: string;
  reason: string;
  recommended_next_capability?: string;
  next_affordances?: HelixScholarlyNextAffordance[];
  recovery_queries?: string[];
  recovery_query_basis?: Record<string, unknown>;
  terminal_eligible: false;
  post_tool_model_step_required?: true;
  assistant_answer: false;
  raw_content_included: false;
  [key: string]: unknown;
};

export type HelixScholarlyPaperIdentifier = {
  doi?: string;
  arxiv_id?: string;
  pmid?: string;
  pmcid?: string;
  openalex_id?: string;
  semantic_scholar_id?: string;
  url?: string;
  pdf_url?: string;
  full_text_url?: string;
};

export type HelixScholarlyPaperAuthor = {
  name: string;
  orcid?: string;
};

export type HelixScholarlyEvidenceRef = {
  ref: string;
  provider: HelixScholarlyResearchProvider;
  url?: string;
  license?: string;
  retrieved_at_ms: number;
};

export type HelixScholarlyPaperResult = {
  result_id: string;
  title: string;
  authors: HelixScholarlyPaperAuthor[];
  year?: number;
  venue?: string;
  abstract?: string;
  identifiers: HelixScholarlyPaperIdentifier;
  citation_count?: number;
  reference_count?: number;
  is_open_access?: boolean;
  evidence_refs: string[];
  source_providers: HelixScholarlyResearchProvider[];
  confidence: "high" | "medium" | "low";
};

export type HelixScholarlyResearchObservation = {
  schema: typeof HELIX_SCHOLARLY_RESEARCH_OBSERVATION_SCHEMA;
  artifact_id: string;
  turn_id: string;
  capability: typeof HELIX_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY;
  query: string;
  intent: HelixScholarlyResearchIntentMode;
  providers_considered: HelixScholarlyResearchProvider[];
  providers_called: HelixScholarlyResearchProvider[];
  /** Provider result rows observed before cross-provider identity deduplication. */
  provider_record_count?: number;
  /** Unique paper identities remaining after DOI/arXiv/title identity deduplication. */
  unique_paper_count?: number;
  deduplication?: {
    provider_record_count: number;
    unique_paper_count: number;
    duplicate_record_count: number;
  };
  evidence_refs: HelixScholarlyEvidenceRef[];
  papers: HelixScholarlyPaperResult[];
  evidence_state: HelixScholarlyEvidenceState;
  next_affordances: HelixScholarlyNextAffordance[];
  lookup_relevance_gate?: Record<string, unknown>;
  semantic_relevance_authority?: "runtime_agent";
  deterministic_lookup_relevance_role?: "advisory_only";
  runtime_agent_semantic_selection_required?: true;
  scholarly_lookup_recovery_affordance?: HelixScholarlyRecoveryAffordance;
  recovery_query_basis?: Record<string, unknown>;
  recovery_affordances?: HelixScholarlyRecoveryAffordance[];
  missing_requirements: string[];
  selected_for_answer: boolean;
  terminal_eligible: false;
  post_tool_model_step_required: true;
  assistant_answer: false;
  raw_content_included: false;
};

export type HelixScholarlyFullTextSourceKind =
  | "pdf"
  | "html"
  | "unknown";

export type HelixScholarlyFullTextPage = {
  page: number;
  text_char_count: number;
  extraction_status: "text" | "empty" | "error";
  text_ref: string;
};

export type HelixScholarlyFullTextChunk = {
  chunk_id: string;
  paper_result_id?: string;
  title?: string;
  page_start: number;
  page_end: number;
  section_hint?: string;
  text_excerpt: string;
  relevance_score: number;
  citation_ref: string;
  source_text_ref: string;
  char_start?: number;
  char_end?: number;
};

export type HelixScholarlyPdfVisualCandidate = {
  page: number;
  reason: string;
  image_artifact_ref?: string;
};

export type HelixScholarlyFullTextFetchAttempt = {
  paper_result_id?: string;
  title?: string;
  source_url?: string;
  evidence_state: HelixScholarlyEvidenceState;
  source_kind: HelixScholarlyFullTextSourceKind;
  missing_requirements: string[];
};

export type HelixScholarlyFullTextObservation = {
  schema: typeof HELIX_SCHOLARLY_FULL_TEXT_OBSERVATION_SCHEMA;
  artifact_id: string;
  turn_id: string;
  capability: typeof HELIX_SCHOLARLY_FULL_TEXT_FETCH_CAPABILITY;
  query: string;
  paper_result_id?: string;
  title?: string;
  source_url?: string;
  source_kind: HelixScholarlyFullTextSourceKind;
  source_pdf_ref?: string;
  cache_integrity_hash?: string;
  cache_path?: string;
  total_pages?: number;
  pages_parsed: number;
  page_text_refs: HelixScholarlyFullTextPage[];
  selected_chunks: HelixScholarlyFullTextChunk[];
  visual_candidates: HelixScholarlyPdfVisualCandidate[];
  evidence_state: HelixScholarlyEvidenceState;
  full_text_fetch_attempts?: HelixScholarlyFullTextFetchAttempt[];
  next_affordances: HelixScholarlyNextAffordance[];
  scholarly_full_text_recovery_affordance?: HelixScholarlyRecoveryAffordance;
  recovery_affordances?: HelixScholarlyRecoveryAffordance[];
  missing_requirements: string[];
  selected_for_answer: boolean;
  terminal_eligible: false;
  post_tool_model_step_required: true;
  assistant_answer: false;
  raw_content_included: false;
  context_policy: "compact_context_pack_only";
  research_library_document_ref?: string;
  research_library_persistence_status?: "saved" | "not_requested" | "failed";
  research_library_persistence_reason?: string;
};

export type HelixScholarlyNumericParameterEvidence = {
  variable: string;
  value: number;
  unit: string;
  normalized_value: number;
  normalized_unit: string;
  source_snippet: string;
  section?: string;
  page: number | null;
  table: string | null;
  confidence: "high" | "medium" | "low";
  evidence_ref: string;
};

export type HelixScholarlyRejectedNumericCandidate = {
  variable: string;
  text: string;
  reason:
    | "ambiguous_unit"
    | "missing_unit"
    | "uncited_value"
    | "unsupported_unit"
    | "not_numeric";
};

export type HelixScholarlyNumericParameterObservation = {
  schema: typeof HELIX_SCHOLARLY_NUMERIC_PARAMETER_OBSERVATION_SCHEMA;
  artifact_id: string;
  turn_id: string;
  capability: typeof HELIX_SCHOLARLY_NUMERIC_PARAMETER_EXTRACT_CAPABILITY;
  capability_key: typeof HELIX_SCHOLARLY_NUMERIC_PARAMETER_EXTRACT_CAPABILITY;
  source_ref: string | null;
  paper: {
    title?: string;
    doi?: string;
    arxiv_id?: string;
    url?: string;
  };
  requested_variables: string[];
  parameters: HelixScholarlyNumericParameterEvidence[];
  missing_variables: string[];
  rejected_candidates: HelixScholarlyRejectedNumericCandidate[];
  evidence_state: HelixScholarlyEvidenceState;
  next_affordances: HelixScholarlyNextAffordance[];
  scholarly_numeric_recovery_affordance?: HelixScholarlyRecoveryAffordance;
  recovery_affordances?: HelixScholarlyRecoveryAffordance[];
  missing_requirements: string[];
  selected_for_answer: boolean;
  extraction_mode?: "requested_variables" | "open_supported_parameters";
  terminal_eligible: false;
  post_tool_model_step_required: true;
  assistant_answer: false;
  raw_content_included: false;
};

export type HelixScholarlyResearchAnswerContract = {
  schema: "helix.scholarly_research_answer_contract.v1";
  answer_kind: "scholarly_research_answer";
  required_capability:
    | typeof HELIX_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY
    | typeof HELIX_SCHOLARLY_FULL_TEXT_FETCH_CAPABILITY;
  required_observation_schema:
    | typeof HELIX_SCHOLARLY_RESEARCH_OBSERVATION_SCHEMA
    | typeof HELIX_SCHOLARLY_FULL_TEXT_OBSERVATION_SCHEMA;
  required_observation_kinds: Array<
    "scholarly_research_observation" | "scholarly_full_text_observation"
  >;
  forbidden_terminal_sources: [
    "docs_viewer_receipt",
    "active_doc_identity",
    "doc_summary",
    "repo_code_evidence_answer",
    "direct_answer_text",
    "model_only_concept",
    "no_tool_direct",
  ];
  assistant_answer: false;
  raw_content_included: false;
};

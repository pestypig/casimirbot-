export const HELIX_SCHOLARLY_RESEARCH_OBSERVATION_SCHEMA =
  "helix.scholarly_research_observation.v1" as const;

export const HELIX_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY =
  "scholarly-research.lookup_papers" as const;

export const HELIX_MODEL_SYNTHESIZE_FROM_SCHOLARLY_RESEARCH_CAPABILITY =
  "model.synthesize_from_scholarly_research" as const;

export type HelixScholarlyResearchProvider =
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

export type HelixScholarlyPaperIdentifier = {
  doi?: string;
  arxiv_id?: string;
  openalex_id?: string;
  semantic_scholar_id?: string;
  url?: string;
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
  evidence_refs: HelixScholarlyEvidenceRef[];
  papers: HelixScholarlyPaperResult[];
  missing_requirements: string[];
  selected_for_answer: boolean;
  assistant_answer: false;
  raw_content_included: false;
};

export type HelixScholarlyResearchAnswerContract = {
  schema: "helix.scholarly_research_answer_contract.v1";
  answer_kind: "scholarly_research_answer";
  required_capability: typeof HELIX_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY;
  required_observation_schema: typeof HELIX_SCHOLARLY_RESEARCH_OBSERVATION_SCHEMA;
  required_observation_kinds: ["scholarly_research_observation"];
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

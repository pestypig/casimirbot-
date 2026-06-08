export const HELIX_INTERNET_SEARCH_OBSERVATION_SCHEMA =
  "helix.internet_search_observation.v1" as const;

export const HELIX_INTERNET_SEARCH_CAPABILITY =
  "internet-search.search_web" as const;

export const HELIX_MODEL_SYNTHESIZE_FROM_INTERNET_SEARCH_CAPABILITY =
  "model.synthesize_from_internet_search" as const;

export type HelixInternetSearchProvider =
  | "tavily"
  | "exa"
  | "google_custom_search";

export type HelixInternetSearchResult = {
  result_id: string;
  title: string;
  url: string;
  snippet?: string;
  content_excerpt?: string;
  published_at?: string;
  source_provider: HelixInternetSearchProvider;
  rank: number;
  evidence_refs: string[];
  confidence: "high" | "medium" | "low";
};

export type HelixInternetSearchEvidenceRef = {
  ref: string;
  provider: HelixInternetSearchProvider;
  url?: string;
  retrieved_at_ms: number;
};

export type HelixInternetSearchObservation = {
  schema: typeof HELIX_INTERNET_SEARCH_OBSERVATION_SCHEMA;
  artifact_id: string;
  turn_id: string;
  capability: typeof HELIX_INTERNET_SEARCH_CAPABILITY;
  query: string;
  providers_considered: HelixInternetSearchProvider[];
  providers_called: HelixInternetSearchProvider[];
  evidence_refs: HelixInternetSearchEvidenceRef[];
  results: HelixInternetSearchResult[];
  domains?: string[];
  recency_days?: number;
  missing_requirements: string[];
  provider_configuration_missing?: boolean;
  selected_for_answer: boolean;
  assistant_answer: false;
  raw_content_included: false;
};

export type HelixInternetSearchAnswerContract = {
  schema: "helix.internet_search_answer_contract.v1";
  answer_kind: "internet_search_answer";
  required_capability: typeof HELIX_INTERNET_SEARCH_CAPABILITY;
  required_observation_schema: typeof HELIX_INTERNET_SEARCH_OBSERVATION_SCHEMA;
  required_observation_kinds: ["internet_search_observation"];
  forbidden_terminal_sources: [
    "docs_viewer_receipt",
    "active_doc_identity",
    "doc_summary",
    "repo_code_evidence_answer",
    "scholarly_research_answer",
    "direct_answer_text",
    "model_only_concept",
    "no_tool_direct",
  ];
  assistant_answer: false;
  raw_content_included: false;
};

import type { HelixPaperEvidenceSidecarV1 } from "./helix-paper-evidence-sidecar";

export const HELIX_RESEARCH_LIBRARY_DOCUMENT_SCHEMA =
  "helix.research_library_document.v1" as const;

export const HELIX_RESEARCH_LIBRARY_LIST_SCHEMA =
  "helix.research_library_list.v1" as const;

export const HELIX_RESEARCH_LIBRARY_READ_CAPABILITY =
  "research-library.read_document" as const;

export const HELIX_RESEARCH_LIBRARY_OBSERVATION_SCHEMA =
  "helix.research_library_observation.v1" as const;

export const isSavedResearchLibraryEvidencePrompt = (prompt: string): boolean =>
  /\b(?:existing|saved|previously\s+(?:saved|extracted)|already\s+extracted|research\s+library|private\s+library)\b[\s\S]{0,120}\b(?:full[-\s]?text|paper|pdf|evidence|extraction|document)\b/i.test(prompt) ||
  /\b(?:use|read|search|from)\b[\s\S]{0,80}\b(?:research\s+library|saved\s+(?:paper|extraction|document))\b/i.test(prompt);

export type HelixResearchLibraryPage = {
  page: number;
  text: string;
  text_char_count: number;
  extraction_status: "text" | "empty" | "error";
  source_text_ref: string;
};

export type HelixResearchLibrarySidecarRef = {
  sidecar_id: string;
  kind: "image_lens" | "scientific_evidence" | "translation" | string;
  artifact_ref: string;
  page_start?: number;
  page_end?: number;
  created_at: string;
};

export type HelixResearchLibraryDocumentSummary = {
  schema: typeof HELIX_RESEARCH_LIBRARY_DOCUMENT_SCHEMA;
  document_id: string;
  profile_id: string;
  title: string;
  source_url: string | null;
  source_kind: "pdf" | "html" | "unknown";
  source_pdf_ref: string | null;
  source_integrity_hash: string;
  paper_result_id: string | null;
  query: string | null;
  page_count: number;
  text_char_count: number;
  extraction_status: "full_text_usable" | "page_image_parse_required";
  language: string | null;
  sidecar_refs: HelixResearchLibrarySidecarRef[];
  created_at: string;
  updated_at: string;
  private: true;
  raw_content_included: false;
};

export type HelixResearchLibraryDocument = Omit<
  HelixResearchLibraryDocumentSummary,
  "raw_content_included"
> & {
  pages: HelixResearchLibraryPage[];
  paper_evidence_sidecars: HelixPaperEvidenceSidecarV1[];
  raw_content_included: true;
};

export type HelixResearchLibraryList = {
  schema: typeof HELIX_RESEARCH_LIBRARY_LIST_SCHEMA;
  ok: true;
  profile_id: string;
  documents: HelixResearchLibraryDocumentSummary[];
  private: true;
  raw_content_included: false;
};

export type HelixResearchLibraryEvidencePage = {
  page: number;
  text_excerpt: string;
  source_text_ref: string;
  text_char_count: number;
  first_nonblank_sentence?: string;
  last_nonblank_sentence?: string;
};

export type HelixResearchLibraryObservation = {
  schema: typeof HELIX_RESEARCH_LIBRARY_OBSERVATION_SCHEMA;
  artifact_id: string;
  turn_id: string;
  capability: typeof HELIX_RESEARCH_LIBRARY_READ_CAPABILITY;
  document: HelixResearchLibraryDocumentSummary;
  selected_pages: HelixResearchLibraryEvidencePage[];
  requested_source_url: string | null;
  requested_document_id: string | null;
  resolved_document_id?: string | null;
  requested_query: string | null;
  page_numbers: number[] | null;
  page_start: number | null;
  page_end: number | null;
  page_boundary_mode?: "first_last_nonblank_sentence" | null;
  search_term?: string | null;
  match_count?: number;
  match_pages?: number[];
  evidence_state: "full_text_usable" | "saved_full_text_missing";
  selected_for_answer: boolean;
  missing_requirements: string[];
  terminal_eligible: false;
  post_tool_model_step_required: true;
  assistant_answer: false;
  raw_content_included: false;
};

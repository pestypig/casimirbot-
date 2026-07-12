export const HELIX_RESEARCH_LIBRARY_DOCUMENT_SCHEMA =
  "helix.research_library_document.v1" as const;

export const HELIX_RESEARCH_LIBRARY_LIST_SCHEMA =
  "helix.research_library_list.v1" as const;

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

export type HelixResearchLibraryDocument = HelixResearchLibraryDocumentSummary & {
  pages: HelixResearchLibraryPage[];
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


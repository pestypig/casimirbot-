export const HELIX_DOC_EQUATION_EXTRACTION_SCHEMA = "helix.doc_equation_extraction.v1" as const;

export type HelixDocEquationExtraction = {
  schema: typeof HELIX_DOC_EQUATION_EXTRACTION_SCHEMA;
  extraction_id: string;
  thread_id: string;
  turn_id: string;
  source_doc_path: string;
  source_title?: string | null;
  equation_text: string;
  normalized_expression?: string | null;
  location_hint?: string | null;
  confidence: number;
  caveats: string[];
  evidence_refs: string[];
  assistant_answer: false;
  raw_content_included: false;
  context_policy: "compact_context_pack_only";
  created_at: string;
};


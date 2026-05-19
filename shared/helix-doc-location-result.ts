export const HELIX_DOC_LOCATION_RESULT_SCHEMA =
  "helix.doc_location_result.v1" as const;

export type HelixDocLocation = {
  anchor: string;
  section_title?: string;
  evidence_snippet: string;
  confidence: number;
};

export type HelixDocLocationResult = {
  schema: typeof HELIX_DOC_LOCATION_RESULT_SCHEMA;
  result_id: string;
  turn_id: string;
  doc_path: string;
  locate_query: string;
  locations: HelixDocLocation[];
  exact_match_found: boolean;
  assistant_answer: false;
  raw_content_included: false;
};

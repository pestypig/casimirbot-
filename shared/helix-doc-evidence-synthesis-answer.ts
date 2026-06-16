export type HelixDocEvidenceSynthesisKind =
  | "compare"
  | "focused_explanation"
  | "locate_then_explain"
  | "multi_doc_summary"
  | "runbook_answer";

export type HelixDocEvidenceSynthesisAnswer = {
  schema: "helix.doc_evidence_synthesis_answer.v1";
  artifact_id: string;
  turn_id: string;

  answer_text: string;

  source_target: "docs_viewer";
  goal_kind: "doc_evidence_synthesis";
  terminal_artifact_kind: "doc_evidence_synthesis_answer";

  source_docs: Array<{
    path: string;
    title?: string | null;
    evidence_refs: string[];
    anchors: string[];
  }>;

  cited_anchors: Array<{
    path: string;
    anchor: string;
    line_start?: number | null;
    line_end?: number | null;
    evidence_ref: string;
  }>;

  synthesis_kind: HelixDocEvidenceSynthesisKind;
  missing_requirements: string[];
  support_refs: string[];

  terminal_eligible: true;
  assistant_answer: false;
  raw_content_included: false;
};

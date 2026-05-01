export type DocEvidenceSourceScope = "current_turn" | "prior_turn_context" | "workspace_state";
export type MathEvidenceConfidence = "high" | "medium" | "low";
export type MathEvidenceKind = "explicit_equation" | "table_key_value" | "derived_relation" | "interpretive_metric";

export type DocEvidenceSnippet = {
  text: string;
  line_start?: number;
  line_end?: number;
  table_name?: string;
  row_label?: string;
  column_names?: string[];
};

export type DocEvidenceBase = {
  artifact_id: string;
  turn_id: string;
  source_scope: DocEvidenceSourceScope;
  source_path: string;
  source_title?: string;
  query: string;
  target_terms: string[];
  snippets: DocEvidenceSnippet[];
  confidence: MathEvidenceConfidence;
};

export type DocEquationLocation = DocEvidenceBase & {
  kind: "doc_equation_location";
  evidence_kind: "explicit_equation";
  equations: Array<{
    raw_text: string;
    normalized_lhs?: string;
    normalized_rhs?: string;
    markers: string[];
    calculator_usable: boolean;
  }>;
  calculator_ingest?: CalculatorIngestPayload;
};

export type CalculatorSemanticRole =
  | "alpha"
  | "proper_vs_coordinate_ratio"
  | "coordinate_vs_classical_ratio"
  | "coordinate_time"
  | "proper_time"
  | "unknown";

export type DocCalculatorEvidence = DocEvidenceBase & {
  kind: "doc_calculator_evidence";
  evidence_kind: "table_key_value" | "derived_relation";
  fields: Array<{
    name: string;
    value: string | number;
    unit?: string;
    raw_text: string;
    semantic_role: CalculatorSemanticRole;
    line_start?: number;
    line_end?: number;
  }>;
  derived_relations: Array<{
    expression: string;
    derived_from_fields: string[];
    derivation_rule: "alpha_times_coordinate_time" | "ratio_interpretation" | "explicit_table_mapping";
    confidence: MathEvidenceConfidence;
  }>;
  derived_formula?: string;
  calculator_ingest?: CalculatorIngestPayload;
};

export type DocEvidenceSynthesisAnswer = DocEvidenceBase & {
  kind: "doc_evidence_synthesis_answer";
  evidence_kind: "interpretation";
  answer_text: string;
  conclusion: {
    label: "proper_time_shortened" | "coordinate_time_unchanged" | "ambiguous" | "other";
    confidence: MathEvidenceConfidence;
  };
  evidence_artifact_ids: string[];
  supporting_fields?: Array<{
    field: "properVsCoordinate_ratio" | "coordinateVsClassical_ratio" | "shiftLapseCenterlineDtauDt";
    value: number;
    interpretation: string;
  }>;
};

export type CalculatorIngestPayload = {
  source_artifact_id: string;
  source_path: string;
  expression: string;
  variables: Array<{
    name: string;
    value?: number | string;
    unit?: string;
    source_field?: string;
  }>;
  assumptions: string[];
  source_snippets: Array<{
    text: string;
    line_start?: number;
    line_end?: number;
  }>;
  confidence: MathEvidenceConfidence;
};

export type MathEvidenceCandidate = {
  path: string;
  title?: string;
  source_role: "scientific_report" | "audit_doc" | "data_table" | "artifact_json" | "runbook" | "unknown";
  explicit_formula_score: number;
  table_evidence_score: number;
  calculator_usability_score: number;
  topic_anchor_score: number;
  recency_score?: number;
  matched_terms: string[];
  missing_terms: string[];
  evidence_kinds_found: MathEvidenceKind[];
  total_score: number;
  rejection_reason?: string;
};

export type TypedMathEvidenceFailure = {
  code: "calculator_evidence_unavailable" | "equation_source_unavailable" | "interpretation_unavailable";
  message: string;
};

export type MathEvidenceAntiBrittlenessAudit = {
  hardcoded_source_path_used: boolean;
  hardcoded_source_path_reason?: string;
  selected_by_score: boolean;
  selected_candidate_score?: MathEvidenceCandidate;
  artifact_validation_passed: boolean;
  artifact_validation_failures: string[];
  derived_relation_declared: boolean;
  derived_relation_assumptions: string[];
  verdict: "clean" | "warning" | "violation";
};

export type MathEvidenceToolInput = {
  turn_id: string;
  query: string;
  source_hint?: {
    path?: string;
    title?: string;
    explicit_user_path?: boolean;
  };
  target_terms: string[];
  calculator_intent: boolean;
  preferred_evidence_kinds?: MathEvidenceKind[];
  source_scope?: DocEvidenceSourceScope;
};

export type MathEvidenceToolResult = {
  kind: "math_evidence_tool_result";
  turn_id: string;
  query: string;
  selected_artifact: DocEquationLocation | DocCalculatorEvidence | DocEvidenceSynthesisAnswer | null;
  candidates: MathEvidenceCandidate[];
  anti_brittleness_audit: MathEvidenceAntiBrittlenessAudit;
  failure?: TypedMathEvidenceFailure;
};

export type ValidationResult = { valid: boolean; failures: string[] };

export const validateEquationLocation = (artifact: DocEquationLocation | null): ValidationResult => {
  const failures: string[] = [];
  if (!artifact) return { valid: false, failures: ["artifact_missing"] };
  if (artifact.kind !== "doc_equation_location") failures.push("kind_mismatch");
  if (artifact.evidence_kind !== "explicit_equation") failures.push("evidence_kind_mismatch");
  if (!artifact.source_path) failures.push("source_path_missing");
  if (!artifact.snippets?.length) failures.push("snippets_missing");
  if (!artifact.equations?.length) failures.push("equations_missing");
  if (!artifact.equations?.some((entry) => entry.calculator_usable)) failures.push("calculator_usable_equation_missing");
  return { valid: failures.length === 0, failures };
};

export const validateCalculatorEvidence = (artifact: DocCalculatorEvidence | null): ValidationResult => {
  const failures: string[] = [];
  if (!artifact) return { valid: false, failures: ["artifact_missing"] };
  if (artifact.kind !== "doc_calculator_evidence") failures.push("kind_mismatch");
  if (!["table_key_value", "derived_relation"].includes(artifact.evidence_kind)) failures.push("evidence_kind_mismatch");
  if (!artifact.source_path) failures.push("source_path_missing");
  if (!artifact.snippets?.length) failures.push("snippets_missing");
  if (!artifact.fields?.length) failures.push("fields_missing");
  const hasUsableRelation = artifact.derived_relations?.some(
    (relation) => Boolean(relation.expression) && relation.derived_from_fields.length > 0,
  );
  if (!hasUsableRelation) failures.push("derived_relation_missing");
  return { valid: failures.length === 0, failures };
};

export const validateEvidenceSynthesis = (artifact: DocEvidenceSynthesisAnswer | null): ValidationResult => {
  const failures: string[] = [];
  if (!artifact) return { valid: false, failures: ["artifact_missing"] };
  if (artifact.kind !== "doc_evidence_synthesis_answer") failures.push("kind_mismatch");
  if (artifact.evidence_kind !== "interpretation") failures.push("evidence_kind_mismatch");
  if (!artifact.source_path) failures.push("source_path_missing");
  if (!artifact.snippets?.length) failures.push("snippets_missing");
  if (!artifact.answer_text) failures.push("answer_text_missing");
  if (!artifact.conclusion?.label || artifact.conclusion.label === "ambiguous") failures.push("conclusion_missing");
  return { valid: failures.length === 0, failures };
};

export const buildCalculatorIngestPayload = (
  artifact: DocEquationLocation | DocCalculatorEvidence,
): CalculatorIngestPayload | null => {
  if (artifact.kind === "doc_equation_location") {
    const equation = artifact.equations.find((entry) => entry.calculator_usable) ?? artifact.equations[0];
    if (!equation) return null;
    const variables: CalculatorIngestPayload["variables"] = [];
    if (/\bT\b/.test(equation.raw_text)) variables.push({ name: "T", source_field: "coordinateTimeS" });
    if (/\balpha\b/i.test(equation.raw_text)) variables.push({ name: "alpha", source_field: "centerlineAlpha" });
    return {
      source_artifact_id: artifact.artifact_id,
      source_path: artifact.source_path,
      expression: equation.raw_text,
      variables,
      assumptions: [],
      source_snippets: artifact.snippets.map((snippet) => ({
        text: snippet.text,
        line_start: snippet.line_start,
        line_end: snippet.line_end,
      })),
      confidence: artifact.confidence,
    };
  }

  const relation = artifact.derived_relations[0];
  if (!relation) return null;
  const alphaField = artifact.fields.find((field) => field.semantic_role === "alpha");
  const variables: CalculatorIngestPayload["variables"] = [];
  if (alphaField) {
    variables.push({
      name: "alpha",
      value: alphaField.value,
      source_field: alphaField.name,
    });
  }
  return {
    source_artifact_id: artifact.artifact_id,
    source_path: artifact.source_path,
    expression: relation.expression,
    variables,
    assumptions: ["Derived from table evidence rather than explicit formula line."],
    source_snippets: artifact.snippets.map((snippet) => ({
      text: snippet.text,
      line_start: snippet.line_start,
      line_end: snippet.line_end,
    })),
    confidence: artifact.confidence,
  };
};

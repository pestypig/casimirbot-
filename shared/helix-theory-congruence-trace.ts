import {
  validateTheoryMasterProblemV1,
  type TheoryMasterProblemV1,
} from "./contracts/theory-master-problem.v1";

export const HELIX_THEORY_CONGRUENCE_TRACE_SCHEMA =
  "helix.theory_congruence_trace.v1" as const;

export const HELIX_ASK_DEPTHS = [
  "direct",
  "source_grounded",
  "congruence_trace",
  "audit_deep",
] as const;

export type HelixAskDepth = (typeof HELIX_ASK_DEPTHS)[number];

export const THEORY_TOOL_ADMISSION_STATUSES = [
  "admitted",
  "skipped",
  "blocked",
  "not_applicable",
  "failed_observation",
] as const;

export type TheoryToolAdmissionStatus = (typeof THEORY_TOOL_ADMISSION_STATUSES)[number];

export const THEORY_TOOL_KINDS = [
  "theory_badge_graph",
  "physics_atlas",
  "calculator_loadout",
  "repo_search",
  "docs_viewer",
  "scholarly_probe",
  "web_current",
  "benchmark_runner",
  "forbidden_claim_scan",
] as const;

export type TheoryToolKind = (typeof THEORY_TOOL_KINDS)[number];

const THEORY_OBSERVATION_LANES = THEORY_TOOL_KINDS.filter(
  (tool): tool is Exclude<TheoryToolKind, "web_current"> => tool !== "web_current",
);

export type TheoryToolAdmissionDecision = {
  tool: TheoryToolKind;
  status: TheoryToolAdmissionStatus;
  required: boolean;
  reason: string;
  prompt_cue?: string;
  blocked_reason?: string;
  observation_id?: string;
};

export type TheoryEvidenceObservation = {
  id: string;
  lane: Exclude<TheoryToolKind, "web_current" | "docs_viewer"> | "docs_viewer";
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
  status: "ok" | "partial" | "missing" | "failed";
  source_refs: string[];
  compact_summary: string;
  missing_requirements: string[];
  suggested_next_tools: TheoryToolKind[];
};

export type TheoryCongruenceTraceV1 = {
  schema: typeof HELIX_THEORY_CONGRUENCE_TRACE_SCHEMA;
  trace_id: string;
  turn_id: string;
  depth_requested?: HelixAskDepth;
  depth_selected: HelixAskDepth;
  depth_reason: string;
  candidate_tools: TheoryToolAdmissionDecision[];
  observations: TheoryEvidenceObservation[];
  first_principles: Array<{
    id: string;
    label: string;
    role: "anchor" | "equation" | "observable" | "boundary_condition";
    source_refs: string[];
  }>;
  theory_badges: Array<{
    badge_id: string;
    label: string;
    role: "concept" | "equation" | "observable" | "calculator_row" | "claim_boundary";
    connected_badge_ids: string[];
    source_refs: string[];
  }>;
  calculator_payloads: Array<{
    row_id: string;
    expression_id?: string;
    status: "loadable" | "reference_only" | "missing" | "failed";
    variables?: string[];
    units?: string[];
    result_ref?: string;
  }>;
  repo_sources: Array<{
    ref_id: string;
    path: string;
    line_start?: number;
    line_end?: number;
    role: "definition" | "implementation" | "test" | "doc" | "boundary";
  }>;
  paper_sources: Array<{
    paper_id: string;
    source_kind: "arxiv" | "semantic_scholar" | "direct_pdf" | "manual";
    status: "resolved" | "metadata_failed" | "pdf_extracted" | "failed";
    title?: string;
    pdf_url?: string;
    page_count?: number;
    span_refs?: string[];
  }>;
  inferred_links: Array<{
    from: string;
    to: string;
    synthesis: string;
    support_level: "direct_source" | "calculator_supported" | "badge_edge" | "inferred";
    caveat?: string;
  }>;
  master_problem: TheoryMasterProblemV1;
  claim_boundaries: Array<{
    boundary_id: string;
    text: string;
    applies_to: string[];
    severity: "note" | "guard" | "fail_closed";
  }>;
  forbidden_claim_scan: {
    status: "pass" | "fail";
    forbidden_terms_found: string[];
    failure_reason?: string;
  };
  goal_satisfaction: {
    status: "satisfied" | "partial" | "unsatisfied" | "budget_exhausted";
    missing_evidence: string[];
    next_best_tool?: TheoryToolKind;
  };
  solver_boundary: {
    eligible_for_answer: false;
    candidate_answer_kind:
      | "direct_answer"
      | "repo_code_evidence_answer"
      | "theory_congruence_answer"
      | "typed_failure";
    completed_solver_path_required: true;
    reason: string;
  };
  assistant_answer: false;
  raw_content_included: false;
  terminal_eligible: false;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const includes = <T extends readonly string[]>(items: T, value: unknown): value is T[number] =>
  typeof value === "string" && items.includes(value);

function validateAdmission(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  if (!includes(THEORY_TOOL_KINDS, value.tool)) issues.push(`${prefix}.tool is invalid`);
  if (!includes(THEORY_TOOL_ADMISSION_STATUSES, value.status)) issues.push(`${prefix}.status is invalid`);
  if (typeof value.required !== "boolean") issues.push(`${prefix}.required must be boolean`);
  if (!isNonEmptyString(value.reason)) issues.push(`${prefix}.reason must be a non-empty string`);
}

function validateObservation(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  if (!isNonEmptyString(value.id)) issues.push(`${prefix}.id must be a non-empty string`);
  if (!includes(THEORY_OBSERVATION_LANES, value.lane)) {
    issues.push(`${prefix}.lane is invalid`);
  }
  if (value.assistant_answer !== false) issues.push(`${prefix}.assistant_answer must be false`);
  if (value.terminal_eligible !== false) issues.push(`${prefix}.terminal_eligible must be false`);
  if (value.raw_content_included !== false) issues.push(`${prefix}.raw_content_included must be false`);
  if (!["ok", "partial", "missing", "failed"].includes(String(value.status))) {
    issues.push(`${prefix}.status is invalid`);
  }
  if (!isStringArray(value.source_refs)) issues.push(`${prefix}.source_refs must be strings`);
  if (!isNonEmptyString(value.compact_summary)) issues.push(`${prefix}.compact_summary must be a non-empty string`);
  if (!isStringArray(value.missing_requirements)) issues.push(`${prefix}.missing_requirements must be strings`);
  if (!Array.isArray(value.suggested_next_tools) || !value.suggested_next_tools.every((tool) => includes(THEORY_TOOL_KINDS, tool))) {
    issues.push(`${prefix}.suggested_next_tools must contain valid tool kinds`);
  }
}

export function validateTheoryCongruenceTraceV1(value: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["theory congruence trace must be an object"];
  if (value.schema !== HELIX_THEORY_CONGRUENCE_TRACE_SCHEMA) {
    issues.push(`schema must be ${HELIX_THEORY_CONGRUENCE_TRACE_SCHEMA}`);
  }
  if (!isNonEmptyString(value.trace_id)) issues.push("trace_id must be a non-empty string");
  if (!isNonEmptyString(value.turn_id)) issues.push("turn_id must be a non-empty string");
  if (!includes(HELIX_ASK_DEPTHS, value.depth_selected)) issues.push("depth_selected is invalid");
  if (value.depth_requested !== undefined && !includes(HELIX_ASK_DEPTHS, value.depth_requested)) {
    issues.push("depth_requested is invalid");
  }
  if (!isNonEmptyString(value.depth_reason)) issues.push("depth_reason must be a non-empty string");
  if (!Array.isArray(value.candidate_tools)) {
    issues.push("candidate_tools must be an array");
  } else {
    value.candidate_tools.forEach((entry, index) => validateAdmission(`candidate_tools[${index}]`, entry, issues));
  }
  if (!Array.isArray(value.observations)) {
    issues.push("observations must be an array");
  } else {
    value.observations.forEach((entry, index) => validateObservation(`observations[${index}]`, entry, issues));
  }
  for (const field of [
    "first_principles",
    "theory_badges",
    "calculator_payloads",
    "repo_sources",
    "paper_sources",
    "inferred_links",
    "claim_boundaries",
  ] as const) {
    if (!Array.isArray(value[field])) issues.push(`${field} must be an array`);
  }
  for (const issue of validateTheoryMasterProblemV1(value.master_problem)) {
    issues.push(`master_problem.${issue}`);
  }
  if (!isRecord(value.forbidden_claim_scan)) {
    issues.push("forbidden_claim_scan must be an object");
  } else {
    if (value.forbidden_claim_scan.status !== "pass" && value.forbidden_claim_scan.status !== "fail") {
      issues.push("forbidden_claim_scan.status is invalid");
    }
    if (!isStringArray(value.forbidden_claim_scan.forbidden_terms_found)) {
      issues.push("forbidden_claim_scan.forbidden_terms_found must be strings");
    }
  }
  if (!isRecord(value.goal_satisfaction)) issues.push("goal_satisfaction must be an object");
  if (!isRecord(value.solver_boundary)) {
    issues.push("solver_boundary must be an object");
  } else {
    if (value.solver_boundary.eligible_for_answer !== false) {
      issues.push("solver_boundary.eligible_for_answer must be false");
    }
    if (
      ![
        "direct_answer",
        "repo_code_evidence_answer",
        "theory_congruence_answer",
        "typed_failure",
      ].includes(String(value.solver_boundary.candidate_answer_kind))
    ) {
      issues.push("solver_boundary.candidate_answer_kind is invalid");
    }
    if (value.solver_boundary.completed_solver_path_required !== true) {
      issues.push("solver_boundary.completed_solver_path_required must be true");
    }
    if (!isNonEmptyString(value.solver_boundary.reason)) {
      issues.push("solver_boundary.reason must be a non-empty string");
    }
  }
  if (value.assistant_answer !== false) issues.push("assistant_answer must be false");
  if (value.raw_content_included !== false) issues.push("raw_content_included must be false");
  if (value.terminal_eligible !== false) issues.push("terminal_eligible must be false");
  return issues;
}

export function isTheoryCongruenceTraceV1(value: unknown): value is TheoryCongruenceTraceV1 {
  return validateTheoryCongruenceTraceV1(value).length === 0;
}

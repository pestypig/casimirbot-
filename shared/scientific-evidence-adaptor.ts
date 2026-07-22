export const SCIENTIFIC_EVIDENCE_PACKET_SCHEMA = "helix.scientific_evidence_packet.v1" as const;
export const SCIENTIFIC_IMAGE_EVIDENCE_SIDECAR_SCHEMA = "helix.scientific_image_evidence_sidecar.v1" as const;
export const SCIENTIFIC_BRANCH_GATE_SCHEMA = "helix.scientific_branch_gate.v1" as const;
export const SCIENTIFIC_RUN_TRACE_SCHEMA = "helix.scientific_run_trace.v1" as const;
export const SCIENTIFIC_EVIDENCE_GRAPH_REFLECTION_SCHEMA =
  "helix.scientific_evidence_graph_reflection.v1" as const;
export const PROMOTED_SCIENTIFIC_IMAGE_EVIDENCE_SCHEMA =
  "helix.promoted_scientific_image_evidence.v1" as const;

export const SCIENTIFIC_EVIDENCE_DOMAIN_VALUES = [
  "adm_gr",
  "weyl_bianchi",
  "tokamak_plasma",
  "casimir_cavity",
  "unknown_math",
] as const;

export type ScientificEvidenceDomainV1 = (typeof SCIENTIFIC_EVIDENCE_DOMAIN_VALUES)[number];

export const SCIENTIFIC_CONGRUENCE_GRADE_VALUES = [
  "exact_symbol_match",
  "same_equation_family",
  "domain_context_match",
  "analogy_only",
  "false_friend",
  "insufficient_evidence",
] as const;

export type ScientificCongruenceGradeV1 = (typeof SCIENTIFIC_CONGRUENCE_GRADE_VALUES)[number];

export type ScientificExactEquationAdmissibilityV1 =
  | "admissible_for_exact_equation"
  | "partial_candidate"
  | "inadmissible_for_exact_equation";

export type ScientificEquationLabelMatchStatusV1 =
  | "not_applicable"
  | "matched"
  | "missing_observed_label"
  | "mismatched"
  | "ambiguous";

export type ScientificEvidencePacketV1 = {
  schema: typeof SCIENTIFIC_EVIDENCE_PACKET_SCHEMA;
  evidence_type: "image_lens_region_ocr_math";
  source_ref_hash: string;
  source_image: {
    source_id: string | null;
    ref_hash: string;
    source_kind: "image_lens_source" | "image_attachment" | "pdf_page_render" | "manual_image_url" | "prompt_context" | "unknown";
    page_number: number | null;
    raw_ref_included: false;
  };
  crop_region_id: string;
  crop_region: {
    region_id: string;
    bbox_px: { x: number; y: number; width: number; height: number };
    source_ref_hash: string;
  };
  bbox_px: { x: number; y: number; width: number; height: number };
  evidence_role: "context_only" | "exact_equation_candidate";
  equation_capture_mode?: "context" | "exact_row" | "exact_block";
  requested_equation_label: string | null;
  observed_equation_labels: string[];
  label_match_status: ScientificEquationLabelMatchStatusV1;
  exact_equation_admissibility: ScientificExactEquationAdmissibilityV1;
  row_quality_diagnostics: {
    crop_dimensions_px: { width: number; height: number };
    source_dimensions_px: { width: number; height: number } | null;
    crop_area_px: number;
    row_contains_requested_label: boolean | null;
    row_contains_multiple_equation_like_lines: boolean;
    label_mismatch_reason: string | null;
    has_truncation_or_ellipsis: boolean;
    has_malformed_latex: boolean;
    needs_higher_resolution_source: boolean;
    source_quality_flags: string[];
  };
  exact_row_promotion: {
    status: "promoted" | "partial" | "rejected" | "not_applicable";
    reasons: string[];
  };
  block_quality_diagnostics?: {
    displayed_line_count: number | null;
    displayed_lines_complete: boolean;
    visual_structure: string | null;
    equation_bbox_present: boolean;
    requested_label_present: boolean | null;
    neighboring_equation_label_count: number;
    complete_block_candidate: boolean;
  };
  exact_block_promotion?: {
    status: "promoted" | "partial" | "rejected" | "not_applicable";
    reasons: string[];
  };
  quality_flags: string[];
  quality_rejection_reasons: string[];
  retry_debug: {
    retry_count: number;
    best_candidate_reason: string;
    retry_reasons: string[];
  };
  ocr_text_candidate: string | null;
  text_candidate: string | null;
  latex_candidate: string | null;
  symbol_candidates: string[];
  domain_candidates: Array<{
    domain: ScientificEvidenceDomainV1;
    score: number;
    reasons: string[];
  }>;
  primary_domain: ScientificEvidenceDomainV1;
  confidence: number;
  uncertainty: string[];
  extraction_status: "extracted" | "partial" | "failed" | "not_run";
  admissibility: {
    status: "admissible_observation" | "unverified_math_observation" | "inadmissible_for_exact_mapping";
    allowed_branch_hints: string[];
    blocked_branch_hints: string[];
    congruence_grade_floor: ScientificCongruenceGradeV1;
    claim_boundary: "observation_only_not_proof";
  };
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

export type PromotedScientificImageEvidenceV1 = {
  schema: typeof PROMOTED_SCIENTIFIC_IMAGE_EVIDENCE_SCHEMA;
  evidence_id: string;
  sidecar_id: string;
  packet_ref: string;
  source_id: string | null;
  source_kind: ScientificEvidencePacketV1["source_image"]["source_kind"];
  source_hash: string;
  page_number: number | null;
  bbox_px: ScientificEvidencePacketV1["bbox_px"];
  crop_ref: string;
  crop_region_id: string;
  text_candidate: string | null;
  latex_candidate: string | null;
  requested_label: string | null;
  observed_label: string | null;
  observed_labels: string[];
  evidence_depth:
    | "exact_block_promoted"
    | "exact_block_admissible"
    | "exact_block_partial"
    | "exact_row_promoted"
    | "exact_row_admissible"
    | "exact_row_partial"
    | "page_image_ocr_math_candidate";
  admissibility: ScientificEvidencePacketV1["admissibility"]["status"];
  exact_equation_admissibility: ScientificExactEquationAdmissibilityV1;
  exact_row_promotion: ScientificEvidencePacketV1["exact_row_promotion"];
  exact_block_promotion?: ScientificEvidencePacketV1["exact_block_promotion"];
  active_blockers: string[];
  promotion_reasons: string[];
  claim_boundary: "observation_only_not_proof";
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

export type ScientificImageEvidenceSidecarV1 = {
  schema: typeof SCIENTIFIC_IMAGE_EVIDENCE_SIDECAR_SCHEMA;
  sidecar_id: string;
  sidecar_kind: "transient_scientific_image_evidence";
  source_ref_hash: string;
  source_kind: ScientificEvidencePacketV1["source_image"]["source_kind"] | "mixed";
  packet_count: number;
  packets: ScientificEvidencePacketV1[];
  packet_refs: string[];
  crop_regions: Array<{
    crop_region_id: string;
    bbox_px: ScientificEvidencePacketV1["bbox_px"];
    source_ref_hash: string;
    extraction_status: ScientificEvidencePacketV1["extraction_status"];
    admissibility_status: ScientificEvidencePacketV1["admissibility"]["status"];
    exact_equation_admissibility?: ScientificExactEquationAdmissibilityV1;
    requested_equation_label?: string | null;
    observed_equation_labels?: string[];
    label_match_status?: ScientificEquationLabelMatchStatusV1;
    confidence: number;
    row_quality_diagnostics?: ScientificEvidencePacketV1["row_quality_diagnostics"];
    exact_row_promotion?: ScientificEvidencePacketV1["exact_row_promotion"];
    exact_block_promotion?: ScientificEvidencePacketV1["exact_block_promotion"];
  }>;
  primary_packet_ref: string | null;
  active_promoted_row: PromotedScientificImageEvidenceV1 | null;
  active_promoted_block?: PromotedScientificImageEvidenceV1 | null;
  selected_evidence_object: PromotedScientificImageEvidenceV1 | null;
  promoted_equation_ref: string | null;
  promoted_equation_latex: string | null;
  promoted_equation_text: string | null;
  active_blockers: string[];
  historical_blockers: string[];
  evidence_depth: PromotedScientificImageEvidenceV1["evidence_depth"] | "missing";
  primary_domain: ScientificEvidenceDomainV1;
  primary_domains: ScientificEvidenceDomainV1[];
  extraction_summary: {
    extracted_count: number;
    partial_count: number;
    failed_count: number;
    not_run_count: number;
    admissible_count: number;
    unverified_count: number;
    inadmissible_count: number;
    confidence_max: number;
    confidence_avg: number;
  };
  exact_equation_summary: {
    admissible_row_count: number;
    partial_row_count: number;
    rejected_row_count: number;
    context_only_count: number;
    promoted_row_count: number;
    admissible_block_count?: number;
    partial_block_count?: number;
    rejected_block_count?: number;
    promoted_block_count?: number;
    requested_labels: string[];
    observed_labels: string[];
    rejected_reasons: string[];
    promotion_blockers: string[];
  };
  admissibility: {
    status: "admissible_observation" | "unverified_math_observation" | "inadmissible_for_exact_mapping";
    reasons: string[];
    claim_boundary: "observation_only_not_proof";
  };
  memory_classification: {
    memory_kind: "transient_scientific_image_evidence";
    retrieval_tags: string[];
    suggested_consumers: Array<
      | "visual_analysis.inspect_image_region"
      | "theory-badge-graph.reflect_discussion_context"
      | "scientific-calculator.solve_expression"
    >;
    claim_boundary: "observation_only_not_proof";
  };
  compound_route_stages: ScientificRunTraceStageV1[];
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

export type ScientificBranchGateV1 = {
  schema: typeof SCIENTIFIC_BRANCH_GATE_SCHEMA;
  status: "not_applicable" | "admitted" | "restricted" | "blocked";
  primary_domain: ScientificEvidenceDomainV1;
  allowed_branch_hints: string[];
  blocked_branch_hints: string[];
  congruence_grade_floor: ScientificCongruenceGradeV1;
  rejected_badge_ids: string[];
  rejected_calculator_payload_ids: string[];
  congruence_assessments: Array<{
    target_ref: string;
    target_kind: "badge" | "calculator_payload";
    grade: ScientificCongruenceGradeV1;
    reasons: string[];
    matched_symbols: string[];
    blocked_by_branch_hint: boolean;
  }>;
  notes: string[];
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

export type ScientificRunTraceStageV1 = {
  stage:
    | "image_extraction"
    | "scientific_evidence_sidecar"
    | "theory_reflection"
    | "source_observation"
    | "ocr_math_extraction"
    | "evidence_normalization"
    | "domain_branch_gate"
    | "theory_graph_reflection"
    | "calculator_payload_filter"
    | "final_answer_guard";
  status: "observed" | "candidate" | "admitted" | "restricted" | "blocked" | "not_applicable";
  artifact_refs: string[];
  notes: string[];
};

export type ScientificRunTraceV1 = {
  schema: typeof SCIENTIFIC_RUN_TRACE_SCHEMA;
  trace_id: string;
  source_ref_hash: string;
  primary_domain: ScientificEvidenceDomainV1;
  evidence_ref: string | null;
  branch_gate_status: ScientificBranchGateV1["status"];
  congruence_grade_floor: ScientificCongruenceGradeV1;
  admitted_calculator_payload_ids: string[];
  rejected_calculator_payload_ids: string[];
  rejected_badge_ids: string[];
  stages: ScientificRunTraceStageV1[];
  final_answer_guard: {
    required_claim_boundary: "observation_ocr_graph_match_not_proof";
    must_disclose_uncertainty: boolean;
    must_disclose_rejections: boolean;
  };
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

export type ScientificEvidenceGraphReflectionV1 = {
  schema: typeof SCIENTIFIC_EVIDENCE_GRAPH_REFLECTION_SCHEMA;
  reflection_id: string;
  evidence_depth:
    | "metadata_lookup"
    | "abstract_or_snippet"
    | "page_grounded_ocr"
    | "promoted_exact_equation_row"
    | "promoted_exact_equation_block"
    | "multi_equation_derivation_candidate"
    | "calculator_template_candidate";
  evidence_object_class:
    | "metadata_record"
    | "provider_abstract_or_snippet"
    | "page_ocr_math_candidate"
    | "curved_spacetime_field_action"
    | "boundary_condition"
    | "stress_energy_or_vacuum_energy_expression"
    | "calculator_template_candidate"
    | "unknown_scientific_object";
  normalized_scientific_features: {
    latex_candidates: string[];
    text_candidates: string[];
    operators: string[];
    variables: string[];
    constants: string[];
    fields: string[];
    geometry_terms: string[];
    domain_hints: string[];
    symbol_candidates: string[];
  };
  graph_attachments: Array<{
    node_id: string;
    node_kind: "badge" | "calculator_payload";
    attachment_strength: "strong" | "moderate" | "weak" | "blocked";
    evidence_depth: ScientificEvidenceGraphReflectionV1["evidence_depth"];
    mathematical_reasons: string[];
    matched_symbols: string[];
    claim_boundary: "diagnostic_only";
  }>;
  attachment_reasons: string[];
  claim_boundary: {
    diagnostic_only: true;
    observation_not_proof: true;
    no_physical_validation: true;
    no_badge_promotion: true;
    no_calculator_authority_without_bound_payload: true;
  };
  blocked_authorities: Array<{
    authority: "proof" | "physical_validation" | "badge_promotion" | "calculator_payload";
    blocked_reason: string;
  }>;
  upgrade_requirements: string[];
  next_tool_affordances: Array<{
    capability: string;
    reason: string;
  }>;
  provenance_refs: string[];
  selected_evidence_object: PromotedScientificImageEvidenceV1 | null;
  exact_evidence_ref: string | null;
  exact_evidence_latex: string | null;
  exact_evidence_text: string | null;
  branch_gate_status: ScientificBranchGateV1["status"];
  congruence_grade_floor: ScientificCongruenceGradeV1;
  terminal_eligible: false;
  assistant_answer: false;
  raw_content_included: false;
};

type CandidateInput = {
  textCandidate?: string | null;
  latexCandidate?: string | null;
  uncertainty?: string[] | null;
  extractionStatus?: ScientificEvidencePacketV1["extraction_status"];
  requestedEquationLabel?: string | null;
  regionLabel?: string | null;
  cropRegionId: string;
  sourceRefHash: string;
  sourceImageRefHash?: string | null;
  sourceId?: string | null;
  sourceKind?: ScientificEvidencePacketV1["source_image"]["source_kind"] | null;
  pageNumber?: number | null;
  bboxPx: ScientificEvidencePacketV1["bbox_px"];
  sourceDimensionsPx?: { width: number; height: number } | null;
  equationCaptureMode?: "context" | "exact_row" | "exact_block" | null;
  visualLayoutCandidate?: {
    displayed_line_count?: number | null;
    displayed_lines?: string[] | null;
    structure?: string | null;
    equation_bbox_px?: { x: number; y: number; width: number; height: number } | null;
  } | null;
};

const DOMAIN_PATTERNS: Record<ScientificEvidenceDomainV1, Array<{ pattern: RegExp; reason: string; weight: number }>> = {
  adm_gr: [
    { pattern: /\b(?:ADM|3\+1|lapse|shift|foliation|Eulerian|extrinsic|Einstein tensor|stress[- ]energy|T_?\{?mu|T_?\{?0|energy condition|WEC|NEC|SEC|DEC)\b/i, reason: "ADM / same-chart tensor terminology", weight: 3 },
    { pattern: /\\(?:alpha|beta|gamma|mu|nu)|\b(?:alpha|beta\^i|gamma_ij|T00|T0i|Tij)\b|T_\{?0|T_\{?ij/i, reason: "GR tensor/projection symbol cue", weight: 3 },
  ],
  weyl_bianchi: [
    { pattern: /\b(?:Bianchi|Weyl|Ricci|Riemann|Petrov|curvature invariant|Natario|congruence)\b/i, reason: "Weyl/Bianchi/curvature terminology", weight: 4 },
    { pattern: /\\(?:nabla|Delta|Box|Phi|Psi|psi|phi|gamma|sigma|rho|mu|nu)\b|[∇∆□]/i, reason: "differential-geometry symbol cue", weight: 2 },
  ],
  tokamak_plasma: [
    { pattern: /\b(?:tokamak|plasma|confinement|thermal pressure|magnetic pressure|plasma beta|toroidal|poloidal)\b/i, reason: "tokamak/plasma terminology", weight: 4 },
    { pattern: /\b(?:n_m3|T_eV|B_T|P_loss|tau_E|W_th|p_Pa|p_B|mu0)\b/i, reason: "tokamak calculator symbol cue", weight: 5 },
  ],
  casimir_cavity: [
    { pattern: /\b(?:Casimir|cavity|Lifshitz|QEI|quantum inequality|plate|vacuum energy|negative energy|Scharnhorst)\b/i, reason: "Casimir/QEI terminology", weight: 4 },
    { pattern: /\b(?:U_Q|Q_cavity|gap|plate|hbar|epsilon_0)\b/i, reason: "Casimir calculator/source symbol cue", weight: 2 },
  ],
  unknown_math: [],
};

const DOMAIN_BRANCH_HINTS: Record<ScientificEvidenceDomainV1, { allowed: string[]; blocked: string[] }> = {
  adm_gr: {
    allowed: ["nhm2", "adm", "same_chart", "observer", "stress_energy", "energy_condition", "curvature", "natario"],
    blocked: ["tokamak", "plasma_beta", "thermal_pressure_proxy", "confinement_time_proxy"],
  },
  weyl_bianchi: {
    allowed: ["nhm2", "adm", "weyl", "bianchi", "curvature", "natario", "observer", "stress_energy"],
    blocked: ["tokamak", "plasma_beta", "thermal_pressure_proxy", "confinement_time_proxy"],
  },
  tokamak_plasma: {
    allowed: ["tokamak", "plasma", "thermal_pressure_proxy", "magnetic_pressure", "confinement_time_proxy"],
    blocked: ["nhm2_transport_promotion", "route_eta", "physical_viability"],
  },
  casimir_cavity: {
    allowed: ["casimir", "cavity", "qei", "nhm2_source", "material_receipt", "vacuum_energy"],
    blocked: ["tokamak", "plasma_beta", "thermal_pressure_proxy"],
  },
  unknown_math: {
    allowed: [],
    blocked: ["calculator_payload", "physical_validation", "proof_authority"],
  },
};

const normalizeScore = (score: number): number => Math.max(0, Math.min(1, Number(score.toFixed(4))));

const unique = (values: string[]): string[] => Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));

const normalizeEquationLabel = (value: string): string => value.trim().replace(/^[^\d]*/, "").replace(/[^\d.'a-z-]+$/i, "");

export function extractObservedEquationLabels(input: string): string[] {
  const labels = [
    ...Array.from(input.matchAll(/\\tag\{([^}]+)\}/g)).map((match) => match[1]),
    ...Array.from(input.matchAll(/\((\d+\.\d+(?:[a-z']+)?)\)/gi)).map((match) => match[1]),
    ...Array.from(input.matchAll(/(?:^|[^\w])\\?\s*\(\s*(\d{1,3})\s*\)/g)).map((match) => match[1]),
  ].map(normalizeEquationLabel);
  return unique(labels).slice(0, 12);
}

const isExactEquationRegion = (input: CandidateInput): boolean =>
  Boolean(input.requestedEquationLabel?.trim()) ||
  /^(?:equation[_-]?\d+\.\d+|equation[_-]?row|exact[_-]?equation|retry[_-]?equation)/i.test(input.regionLabel ?? "");

const scientificEvidenceRole = (input: CandidateInput): ScientificEvidencePacketV1["evidence_role"] =>
  isExactEquationRegion(input) ? "exact_equation_candidate" : "context_only";

const classifyLabelMatch = (
  requestedEquationLabel: string | null,
  observedEquationLabels: string[],
): ScientificEquationLabelMatchStatusV1 => {
  if (!requestedEquationLabel) return "not_applicable";
  if (!observedEquationLabels.length) return "missing_observed_label";
  if (observedEquationLabels.length > 1) return "ambiguous";
  if (observedEquationLabels.includes(requestedEquationLabel)) return "matched";
  return observedEquationLabels.length > 1 ? "ambiguous" : "mismatched";
};

const isEquationLabelOnlyCandidate = (value: string): boolean => {
  const normalized = value
    .replace(/```[\s\S]*?```/g, "")
    .replace(/\\(?:,|;|!|quad|qquad|left|right)/g, " ")
    .replace(/\\tag\s*\{\s*([^}]+)\s*\}/g, "($1)")
    .replace(/\s+/g, " ")
    .trim();
  if (!normalized) return false;
  return /^(?:\(?\s*[A-Za-z]?\d+(?:\.\d+)?[A-Za-z]?\s*\)?|[\[\{]\s*[A-Za-z]?\d+(?:\.\d+)?[A-Za-z]?\s*[\]\}])$/i.test(normalized);
};

const isLabelOnlyExactEquationCandidate = (input: { text: string; latex: string; hasCandidate: boolean }): boolean => {
  if (!input.hasCandidate) return false;
  const candidates = [input.text, input.latex].map((entry) => entry.trim()).filter(Boolean);
  return candidates.length > 0 && candidates.every(isEquationLabelOnlyCandidate);
};

const containsMultipleDisplayedEquationCandidates = (input: {
  text: string;
  latex: string;
  observedEquationLabels: string[];
}): boolean => {
  const combined = `${input.text}\n${input.latex}`;
  if (input.observedEquationLabels.length > 1) return true;
  if (/\blatex_candidate\b[\s\S]{0,80}\[\s*["']/i.test(combined)) return true;
  return false;
};

const hasEquationLikeCandidateSyntax = (input: { text: string; latex: string }): boolean => {
  if (input.latex.trim()) return true;
  const text = input.text.trim();
  if (!text) return false;
  return /\\(?:frac|sum|int|sqrt|partial|nabla|begin|left|right|mathrm|mathbf|mathcal)\b/.test(text) ||
    /[A-Za-z0-9)\]}]\s*(?:=|<=|>=|<|>|\+\-|~=)\s*[A-Za-z0-9([{\\]/.test(text) ||
    /\b[A-Za-z][A-Za-z0-9]*\s*[_^]\s*(?:\{[^}]+\}|[A-Za-z0-9]+)/.test(text) ||
    /(?:âˆ«|âˆ‘|âˆš|âˆ‚|âˆ‡|â‰¤|â‰¥|Î”|Î£)/.test(text);
};

const detectScientificQualityFlags = (input: {
  text: string;
  latex: string;
  evidenceRole: ScientificEvidencePacketV1["evidence_role"];
  requestedEquationLabel: string | null;
  observedEquationLabels: string[];
  labelMatchStatus: ScientificEquationLabelMatchStatusV1;
  extractionStatus: ScientificEvidencePacketV1["extraction_status"];
  hasCandidate: boolean;
  equationCandidateRequested: boolean;
  equationLikeCandidate: boolean;
}): string[] => {
  const flags: string[] = [];
  const combined = `${input.text}\n${input.latex}`;
  const textLines = input.text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const latexLines = input.latex.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (
    !input.hasCandidate ||
    input.extractionStatus === "failed" ||
    input.extractionStatus === "not_run" ||
    (input.equationCandidateRequested && !input.equationLikeCandidate)
  ) {
    flags.push("no_ocr_or_latex_candidate");
  }
  if (input.equationCandidateRequested && input.hasCandidate && !input.equationLikeCandidate) {
    flags.push("non_equation_text_candidate");
  }
  if (input.extractionStatus === "partial") {
    flags.push("partial_extraction_status");
  }
  if (/\b(?:formalism|scenario)\b/i.test(combined)) {
    flags.push(input.evidenceRole === "exact_equation_candidate"
      ? "row_crop_contains_page_prose_or_invented_formalism"
      : "context_crop_contains_unverified_formalism_prose");
  }
  if (input.evidenceRole === "exact_equation_candidate") {
    if (isLabelOnlyExactEquationCandidate(input)) flags.push("label_only_equation_locator");
    if (containsMultipleDisplayedEquationCandidates(input)) flags.push("candidate_contains_multiple_display_equations");
    if (!input.requestedEquationLabel && input.observedEquationLabels.length > 0) {
      flags.push("observed_equation_label_without_requested_binding");
    }
    if (input.labelMatchStatus === "missing_observed_label") flags.push("missing_requested_equation_label");
    if (input.labelMatchStatus === "mismatched") flags.push("mismatched_equation_label");
    if (input.labelMatchStatus === "ambiguous") flags.push("ambiguous_equation_label");
    if (input.requestedEquationLabel && input.labelMatchStatus === "matched" && input.latex && !input.latex.includes(input.requestedEquationLabel)) {
      flags.push("requested_label_missing_from_latex_candidate");
    }
    if (textLines.length > 1 || latexLines.length > 1) {
      flags.push("row_crop_contains_multiple_equation_lines");
    }
  }
  if (/[�]|Ã|Â|Î|Ï|ð|Ø|Ù|\\\s+abla|\\nabla\s*[;,\]]/i.test(combined)) flags.push("mojibake_or_corrupted_symbol_text");
  const ellipsisCount = (combined.match(/(?:\.\.\.|…|\\ldots|\\cdots)/g) ?? []).length;
  if (ellipsisCount > 0) flags.push("ellipsized_or_truncated_equation");
  if (input.latex && /(?:\\\s+abla|\\\[|\]\]|\{\s*\}|_\s*$|\\begin\{[^}]+$|\$[^$]*$)/.test(input.latex)) {
    flags.push("malformed_latex_candidate");
  }
  if (input.evidenceRole === "exact_equation_candidate" && input.text.length > 600) {
    flags.push("row_crop_too_broad_for_exact_equation");
  }
  return unique(flags);
};

const detectSourceQualityFlags = (input: {
  bboxPx: ScientificEvidencePacketV1["bbox_px"];
  sourceDimensionsPx?: { width: number; height: number } | null;
  evidenceRole: ScientificEvidencePacketV1["evidence_role"];
  hasCandidate: boolean;
}): string[] => {
  const flags: string[] = [];
  const area = input.bboxPx.width * input.bboxPx.height;
  if (input.bboxPx.width <= 1 || input.bboxPx.height <= 1) {
    flags.push("degenerate_crop_dimensions");
  }
  if (input.evidenceRole === "exact_equation_candidate" && (input.bboxPx.width < 80 || input.bboxPx.height < 24)) {
    flags.push("exact_row_crop_too_small_for_reliable_math_ocr");
  }
  if (input.evidenceRole === "exact_equation_candidate" && area < 4_000) {
    flags.push("exact_row_crop_area_too_small");
  }
  if (input.evidenceRole === "exact_equation_candidate" && !input.hasCandidate && area < 8_000) {
    flags.push("needs_higher_resolution_source");
  }
  if (
    input.evidenceRole === "exact_equation_candidate" &&
    input.sourceDimensionsPx &&
    (input.sourceDimensionsPx.width < 128 || input.sourceDimensionsPx.height < 128)
  ) {
    flags.push("source_image_resolution_low_for_exact_math_ocr");
  }
  return unique(flags);
};

const qualityFlagReason = (flag: string): string => {
  switch (flag) {
    case "no_ocr_or_latex_candidate": return "No OCR equation text or LaTeX candidate was returned.";
    case "non_equation_text_candidate": return "The OCR candidate is prose rather than an equation-like expression.";
    case "missing_requested_equation_label": return "The requested equation label was not observed in the crop.";
    case "mismatched_equation_label": return "The observed equation label does not match the requested crop label.";
    case "ambiguous_equation_label": return "Multiple observed equation labels make this crop ambiguous for exact use.";
    case "row_crop_contains_page_prose_or_invented_formalism": return "The exact row crop contains page-level prose or likely invented formalism text.";
    case "context_crop_contains_unverified_formalism_prose": return "The context crop contains unverified formalism prose that may be OCR/model invention.";
    case "partial_extraction_status": return "The extraction backend marked this crop as partial.";
    case "requested_label_missing_from_latex_candidate": return "The requested equation label was observed in text but not preserved in the LaTeX candidate.";
    case "row_crop_contains_multiple_equation_lines": return "The exact row crop contains multiple equation-like lines and is not a clean single-row extraction.";
    case "mojibake_or_corrupted_symbol_text": return "The OCR/LaTeX candidate contains corrupted symbols or mojibake.";
    case "ellipsized_or_truncated_equation": return "The equation candidate is ellipsized or visibly truncated.";
    case "malformed_latex_candidate": return "The LaTeX candidate is malformed.";
    case "label_only_equation_locator": return "The crop contains only an equation label locator, not the equation row.";
    case "candidate_contains_multiple_display_equations": return "The crop contains multiple displayed equation candidates and must be narrowed before exact-row use.";
    case "observed_equation_label_without_requested_binding": return "The exact-row crop observed an equation label that was not bound by the request.";
    case "row_crop_too_broad_for_exact_equation": return "The row crop is too broad to treat as one exact equation row.";
    case "degenerate_crop_dimensions": return "The crop dimensions are degenerate and cannot support exact extraction.";
    case "exact_row_crop_too_small_for_reliable_math_ocr": return "The exact row crop is too small for reliable math OCR.";
    case "exact_row_crop_area_too_small": return "The exact row crop area is too small for reliable exact-row promotion.";
    case "needs_higher_resolution_source": return "The source/crop resolution is too low for exact math extraction.";
    case "source_image_resolution_low_for_exact_math_ocr": return "The source image resolution is low for exact math OCR.";
    default: return flag.replace(/_/g, " ");
  }
};

const buildRetryDebug = (qualityFlags: string[]): ScientificEvidencePacketV1["retry_debug"] => ({
  retry_count: qualityFlags.length ? 1 : 0,
  best_candidate_reason: qualityFlags.length
    ? "quality_flags_require_padded_or_contrast_normalized_retry_before_exact_use"
    : "initial_candidate_has_no_local_quality_retry_trigger",
  retry_reasons: qualityFlags,
});

const evidencePacketRef = (packet: ScientificEvidencePacketV1): string =>
  `${packet.source_ref_hash}#crop=${packet.bbox_px.x},${packet.bbox_px.y},${packet.bbox_px.width},${packet.bbox_px.height}`;

const SCIENTIFIC_IMAGE_EXACT_ROW_PROMOTION_REASON_VALUES = new Set([
  "requested_label_matched",
  "unlabeled_row_no_equation_label_observed",
  "single_clean_row",
  "extracted_latex_candidate_present",
  "no_truncation_or_ellipsis",
  "no_malformed_latex",
  "higher_resolution_retry_not_required",
]);

const scientificImageEvidenceDepthForPacket = (
  packet: ScientificEvidencePacketV1 | null,
): PromotedScientificImageEvidenceV1["evidence_depth"] | "missing" => {
  if (!packet) return "missing";
  if (packet.exact_block_promotion?.status === "promoted") return "exact_block_promoted";
  if (packet.equation_capture_mode === "exact_block" && packet.exact_equation_admissibility === "admissible_for_exact_equation") return "exact_block_admissible";
  if (packet.equation_capture_mode === "exact_block") return "exact_block_partial";
  if (packet.exact_row_promotion.status === "promoted") return "exact_row_promoted";
  if (packet.exact_equation_admissibility === "admissible_for_exact_equation") return "exact_row_admissible";
  if (packet.evidence_role === "exact_equation_candidate") return "exact_row_partial";
  return "page_image_ocr_math_candidate";
};

const activeBlockersForScientificPacket = (packet: ScientificEvidencePacketV1 | null): string[] =>
  packet
    ? packet.equation_capture_mode === "exact_block"
      ? packet.exact_block_promotion?.status === "promoted"
        ? []
        : unique(packet.exact_block_promotion?.reasons ?? [])
      : unique(packet.exact_row_promotion.reasons.filter((reason) =>
          !SCIENTIFIC_IMAGE_EXACT_ROW_PROMOTION_REASON_VALUES.has(reason)))
    : [];

const promotionReasonsForScientificPacket = (packet: ScientificEvidencePacketV1 | null): string[] =>
  packet
    ? unique(packet.equation_capture_mode === "exact_block"
        ? packet.exact_block_promotion?.status === "promoted"
          ? packet.exact_block_promotion.reasons
          : []
        : packet.exact_row_promotion.reasons.filter((reason) =>
            SCIENTIFIC_IMAGE_EXACT_ROW_PROMOTION_REASON_VALUES.has(reason)))
    : [];

const isLabelOnlyScientificPacket = (packet: ScientificEvidencePacketV1): boolean =>
  packet.quality_flags.includes("label_only_equation_locator") ||
  isLabelOnlyExactEquationCandidate({
    text: packet.text_candidate ?? packet.ocr_text_candidate ?? "",
    latex: packet.latex_candidate ?? "",
    hasCandidate: Boolean(packet.text_candidate || packet.ocr_text_candidate || packet.latex_candidate),
  });

const isNonSelectableScientificImagePacket = (packet: ScientificEvidencePacketV1): boolean =>
  isLabelOnlyScientificPacket(packet) ||
  packet.quality_flags.includes("candidate_contains_multiple_display_equations");

const selectStructuredScientificImageEvidencePacket = (
  packets: ScientificEvidencePacketV1[],
): ScientificEvidencePacketV1 | null => {
  const ranked = packets.slice().sort((left, right) => {
    const score = (packet: ScientificEvidencePacketV1): number => {
      if (isNonSelectableScientificImagePacket(packet)) return -10_000;
      let total = 0;
      if (packet.exact_block_promotion?.status === "promoted") total += 12_000;
      if (packet.exact_row_promotion.status === "promoted") total += 10_000;
      if (packet.exact_equation_admissibility === "admissible_for_exact_equation") total += 4_000;
      if (packet.evidence_role === "exact_equation_candidate") total += 1_000;
      if (packet.extraction_status === "extracted") total += 300;
      if (packet.extraction_status === "partial") total += 100;
      if (packet.latex_candidate) total += 40;
      if (packet.text_candidate || packet.ocr_text_candidate) total += 20;
      total += packet.confidence;
      return total;
    };
    return score(right) - score(left);
  });
  return ranked.find((packet) => !isNonSelectableScientificImagePacket(packet)) ?? null;
};

const buildPromotedScientificImageEvidence = (
  packet: ScientificEvidencePacketV1 | null,
  sidecarId: string,
): PromotedScientificImageEvidenceV1 | null => {
  if (!packet) return null;
  const packetRef = evidencePacketRef(packet);
  const evidenceDepth = scientificImageEvidenceDepthForPacket(packet);
  if (evidenceDepth === "missing") return null;
  return {
    schema: PROMOTED_SCIENTIFIC_IMAGE_EVIDENCE_SCHEMA,
    evidence_id: `promoted_scientific_image_evidence:${packet.crop_region_id}`,
    sidecar_id: sidecarId,
    packet_ref: packetRef,
    source_id: packet.source_image.source_id,
    source_kind: packet.source_image.source_kind,
    source_hash: packet.source_image.ref_hash,
    page_number: packet.source_image.page_number,
    bbox_px: packet.bbox_px,
    crop_ref: packetRef,
    crop_region_id: packet.crop_region_id,
    text_candidate: packet.text_candidate ?? packet.ocr_text_candidate ?? null,
    latex_candidate: packet.latex_candidate ?? null,
    requested_label: packet.requested_equation_label,
    observed_label: packet.observed_equation_labels[0] ?? null,
    observed_labels: packet.observed_equation_labels,
    evidence_depth: evidenceDepth,
    admissibility: packet.admissibility.status,
    exact_equation_admissibility: packet.exact_equation_admissibility,
    exact_row_promotion: packet.exact_row_promotion,
    exact_block_promotion: packet.exact_block_promotion,
    active_blockers: activeBlockersForScientificPacket(packet),
    promotion_reasons: promotionReasonsForScientificPacket(packet),
    claim_boundary: "observation_only_not_proof",
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
};

const scientificPacketRank = (packet: ScientificEvidencePacketV1): number => {
  const admissibilityRank =
    packet.admissibility.status === "admissible_observation"
      ? 3
      : packet.admissibility.status === "unverified_math_observation"
        ? 2
        : 1;
  const extractionRank =
    packet.extraction_status === "extracted"
      ? 3
      : packet.extraction_status === "partial"
        ? 2
        : 1;
  return admissibilityRank * 100 + extractionRank * 10 + packet.confidence;
};

export function extractScientificSymbolCandidates(input: string): string[] {
  const latexCommands = Array.from(input.matchAll(/\\[A-Za-z]+/g)).map((match) => match[0]);
  const plainSymbols = Array.from(input.matchAll(/\b[A-Za-z][A-Za-z0-9_]*(?:\^[A-Za-z0-9{}]+)?(?:_[A-Za-z0-9{}]+)?\b/g))
    .map((match) => match[0])
    .filter((token) => token.length > 1)
    .filter((token) => !/^(?:and|the|for|with|from|these|they|field|equations|written|candidate)$/i.test(token));
  const unicodeOperators = Array.from(input.matchAll(/[∇∆□ΦΨψφγρσμν]/g)).map((match) => match[0]);
  return unique([...latexCommands, ...plainSymbols, ...unicodeOperators]).slice(0, 32);
}

export function buildScientificEvidencePacket(input: CandidateInput): ScientificEvidencePacketV1 {
  const textCandidate = input.textCandidate?.trim() || null;
  const latexCandidate = input.latexCandidate?.trim() || null;
  const text = [textCandidate, latexCandidate].filter(Boolean).join("\n");
  const symbolCandidates = extractScientificSymbolCandidates(text);
  const scored = SCIENTIFIC_EVIDENCE_DOMAIN_VALUES
    .filter((domain) => domain !== "unknown_math")
    .map((domain) => {
      const reasons: string[] = [];
      const score = DOMAIN_PATTERNS[domain].reduce((sum, entry) => {
        if (!entry.pattern.test(text)) return sum;
        reasons.push(entry.reason);
        return sum + entry.weight;
      }, 0);
      return { domain, score, reasons };
    })
    .filter((candidate) => candidate.score > 0)
    .sort((left, right) => right.score - left.score || left.domain.localeCompare(right.domain));
  const topScore = scored[0]?.score ?? 0;
  const domainCandidates = scored.map((candidate) => ({
    domain: candidate.domain,
    score: normalizeScore(candidate.score / Math.max(topScore, 1)),
    reasons: candidate.reasons,
  }));
  const primaryDomain = (scored[0]?.domain ?? "unknown_math") as ScientificEvidenceDomainV1;
  const status = input.extractionStatus ?? "not_run";
  const hasCandidate = Boolean(textCandidate || latexCandidate);
  const requestedEquationLabel = input.requestedEquationLabel ? normalizeEquationLabel(input.requestedEquationLabel) : null;
  const observedEquationLabels = extractObservedEquationLabels(text);
  const labelMatchStatus = classifyLabelMatch(requestedEquationLabel, observedEquationLabels);
  const evidenceRole = scientificEvidenceRole(input);
  const equationCaptureMode = input.equationCaptureMode ??
    (evidenceRole === "exact_equation_candidate" ? "exact_row" : "context");
  const equationCandidateRequested =
    equationCaptureMode === "exact_row" ||
    equationCaptureMode === "exact_block" ||
    /(?:^|[_\-\s])equation(?:$|[_\-\s])/i.test(input.regionLabel ?? "");
  const equationLikeCandidate = hasEquationLikeCandidateSyntax({
    text: textCandidate ?? "",
    latex: latexCandidate ?? "",
  });
  const isExactBlock = equationCaptureMode === "exact_block";
  const rawQualityFlags = detectScientificQualityFlags({
    text: textCandidate ?? "",
    latex: latexCandidate ?? "",
    evidenceRole,
    requestedEquationLabel,
    observedEquationLabels,
    labelMatchStatus,
    extractionStatus: status,
    hasCandidate,
    equationCandidateRequested,
    equationLikeCandidate,
  });
  const sourceQualityFlags = detectSourceQualityFlags({
    bboxPx: input.bboxPx,
    sourceDimensionsPx: input.sourceDimensionsPx,
    evidenceRole,
    hasCandidate,
  });
  const rowOnlyQualityFlags = new Set([
    "row_crop_contains_multiple_equation_lines",
    "row_crop_too_broad_for_exact_equation",
    "exact_row_crop_too_small_for_reliable_math_ocr",
    "exact_row_crop_area_too_small",
  ]);
  const qualityFlags = isExactBlock
    ? rawQualityFlags.filter((flag) => !rowOnlyQualityFlags.has(flag))
    : rawQualityFlags;
  const allQualityFlags = unique([...qualityFlags, ...sourceQualityFlags]);
  const qualityRejectionReasons = allQualityFlags.map(qualityFlagReason);
  const forcedUncertainty = unique([
    ...(input.uncertainty ?? []),
    ...qualityRejectionReasons.map((reason) => `local_quality_gate: ${reason}`),
  ]);
  const visualLayout = input.visualLayoutCandidate ?? null;
  const displayedLineCount = visualLayout?.displayed_line_count ??
    (visualLayout?.displayed_lines?.length ? visualLayout.displayed_lines.length : null);
  const displayedLinesComplete = Boolean(
    displayedLineCount && displayedLineCount > 1 &&
    visualLayout?.displayed_lines?.length === displayedLineCount
  );
  const blockStructure = visualLayout?.structure ?? null;
  const blockStructureSupported = ["multi_line", "aligned_block", "cases", "matrix"].includes(blockStructure ?? "");
  const equationBboxPresent = Boolean(visualLayout?.equation_bbox_px);
  const requestedLabelPresent = requestedEquationLabel
    ? observedEquationLabels.includes(requestedEquationLabel)
    : null;
  const neighboringEquationLabelCount = requestedEquationLabel
    ? observedEquationLabels.filter((label) => label !== requestedEquationLabel).length
    : observedEquationLabels.length > 1 ? observedEquationLabels.length - 1 : 0;
  const completeBlockCandidate = Boolean(
    isExactBlock &&
    hasCandidate &&
    latexCandidate &&
    status === "extracted" &&
    labelMatchStatus === "matched" &&
    displayedLinesComplete &&
    blockStructureSupported &&
    equationBboxPresent &&
    neighboringEquationLabelCount === 0 &&
    allQualityFlags.length === 0
  );
  const hardBlockRejection = Boolean(
    !hasCandidate ||
    status === "failed" ||
    status === "not_run" ||
    labelMatchStatus === "mismatched" ||
    labelMatchStatus === "ambiguous" ||
    neighboringEquationLabelCount > 0 ||
    allQualityFlags.includes("label_only_equation_locator") ||
    allQualityFlags.includes("candidate_contains_multiple_display_equations")
  );
  const exactEquationAdmissibility: ScientificExactEquationAdmissibilityV1 =
    evidenceRole === "context_only"
      ? allQualityFlags.includes("non_equation_text_candidate")
        ? "inadmissible_for_exact_equation"
        : "partial_candidate"
      : isExactBlock
        ? hardBlockRejection
          ? "inadmissible_for_exact_equation"
          : completeBlockCandidate
            ? "admissible_for_exact_equation"
            : "partial_candidate"
      : !hasCandidate ||
        status === "failed" ||
        status === "not_run" ||
        labelMatchStatus === "mismatched" ||
        labelMatchStatus === "ambiguous" ||
        allQualityFlags.includes("label_only_equation_locator") ||
        allQualityFlags.includes("candidate_contains_multiple_display_equations")
        ? "inadmissible_for_exact_equation"
        : (labelMatchStatus === "matched" || (requestedEquationLabel === null && labelMatchStatus === "not_applicable")) &&
          allQualityFlags.length === 0 &&
          status === "extracted"
          ? "admissible_for_exact_equation"
          : "partial_candidate";
  const promotionReasons = exactEquationAdmissibility === "admissible_for_exact_equation" && !isExactBlock
    ? [
        requestedEquationLabel ? "requested_label_matched" : "unlabeled_row_no_equation_label_observed",
        "single_clean_row",
        "extracted_latex_candidate_present",
      ]
    : evidenceRole === "context_only"
      ? ["context_crop_not_exact_equation_row"]
      : [
          ...(labelMatchStatus === "matched" ? [] : [`label_match_status:${labelMatchStatus}`]),
          ...(status === "extracted" ? [] : [`extraction_status:${status}`]),
          ...allQualityFlags,
        ];
  const exactRowPromotion: ScientificEvidencePacketV1["exact_row_promotion"] =
    evidenceRole === "context_only"
      ? { status: "not_applicable", reasons: promotionReasons }
      : isExactBlock
        ? { status: "not_applicable", reasons: ["multi_line_exact_equation_block_uses_block_promotion"] }
      : exactEquationAdmissibility === "admissible_for_exact_equation"
        ? { status: "promoted", reasons: promotionReasons }
        : exactEquationAdmissibility === "partial_candidate"
          ? { status: "partial", reasons: unique(promotionReasons) }
          : { status: "rejected", reasons: unique(promotionReasons) };
  const blockPromotionReasons = !isExactBlock
    ? ["not_an_exact_equation_block_request"]
    : completeBlockCandidate
      ? [
          "requested_label_matched",
          "complete_multi_line_equation_block",
          "displayed_lines_complete",
          "equation_bbox_present",
          "single_requested_equation_label_observed",
          "extracted_latex_candidate_present",
        ]
      : unique([
          ...(labelMatchStatus === "matched" ? [] : [`label_match_status:${labelMatchStatus}`]),
          ...(status === "extracted" ? [] : [`extraction_status:${status}`]),
          ...(latexCandidate ? [] : ["latex_candidate_missing"]),
          ...(displayedLinesComplete ? [] : ["displayed_lines_incomplete"]),
          ...(blockStructureSupported ? [] : ["multi_line_block_structure_missing"]),
          ...(equationBboxPresent ? [] : ["equation_bbox_missing"]),
          ...(neighboringEquationLabelCount === 0 ? [] : ["neighboring_equation_label_observed"]),
          ...allQualityFlags,
        ]);
  const exactBlockPromotion: NonNullable<ScientificEvidencePacketV1["exact_block_promotion"]> =
    !isExactBlock
      ? { status: "not_applicable", reasons: blockPromotionReasons }
      : completeBlockCandidate
        ? { status: "promoted", reasons: blockPromotionReasons }
        : hardBlockRejection
          ? { status: "rejected", reasons: blockPromotionReasons }
          : { status: "partial", reasons: blockPromotionReasons };
  const confidence =
    primaryDomain === "unknown_math" || !hasCandidate || status === "failed" || status === "not_run"
      ? 0
      : normalizeScore(Math.max(0, Math.min(0.9, 0.35 + Math.min(topScore, 6) / 10 - allQualityFlags.length * 0.08)));
  const branchHints = DOMAIN_BRANCH_HINTS[primaryDomain];
  const admissibilityStatus =
    !hasCandidate || status === "failed" || status === "not_run" || exactEquationAdmissibility === "inadmissible_for_exact_equation"
      ? "inadmissible_for_exact_mapping"
      : confidence <= 0.55 || allQualityFlags.length > 0 || (evidenceRole === "exact_equation_candidate" && exactEquationAdmissibility === "partial_candidate")
        ? "unverified_math_observation"
        : "admissible_observation";
  return {
    schema: SCIENTIFIC_EVIDENCE_PACKET_SCHEMA,
    evidence_type: "image_lens_region_ocr_math",
    source_ref_hash: input.sourceRefHash,
    source_image: {
      source_id: input.sourceId?.trim() || null,
      ref_hash: input.sourceImageRefHash?.trim() || input.sourceRefHash,
      source_kind: input.sourceKind ?? (input.sourceRefHash === "prompt_context" ? "prompt_context" : "unknown"),
      page_number: input.pageNumber ?? null,
      raw_ref_included: false,
    },
    crop_region_id: input.cropRegionId,
    crop_region: {
      region_id: input.cropRegionId,
      bbox_px: input.bboxPx,
      source_ref_hash: input.sourceRefHash,
    },
    bbox_px: input.bboxPx,
    evidence_role: evidenceRole,
    equation_capture_mode: equationCaptureMode,
    requested_equation_label: requestedEquationLabel,
    observed_equation_labels: observedEquationLabels,
    label_match_status: labelMatchStatus,
    exact_equation_admissibility: exactEquationAdmissibility,
    row_quality_diagnostics: {
      crop_dimensions_px: { width: input.bboxPx.width, height: input.bboxPx.height },
      source_dimensions_px: input.sourceDimensionsPx ?? null,
      crop_area_px: input.bboxPx.width * input.bboxPx.height,
      row_contains_requested_label: requestedEquationLabel ? observedEquationLabels.includes(requestedEquationLabel) : null,
      row_contains_multiple_equation_like_lines: allQualityFlags.includes("row_crop_contains_multiple_equation_lines"),
      label_mismatch_reason:
        labelMatchStatus === "mismatched"
          ? "observed_label_does_not_match_requested_label"
          : labelMatchStatus === "missing_observed_label"
            ? "requested_label_not_observed"
            : labelMatchStatus === "ambiguous"
              ? "multiple_observed_labels_for_requested_row"
              : null,
      has_truncation_or_ellipsis: allQualityFlags.includes("ellipsized_or_truncated_equation"),
      has_malformed_latex: allQualityFlags.includes("malformed_latex_candidate"),
      needs_higher_resolution_source: allQualityFlags.includes("needs_higher_resolution_source") ||
        allQualityFlags.includes("exact_row_crop_too_small_for_reliable_math_ocr") ||
        allQualityFlags.includes("exact_row_crop_area_too_small") ||
        allQualityFlags.includes("source_image_resolution_low_for_exact_math_ocr") ||
        allQualityFlags.includes("degenerate_crop_dimensions"),
      source_quality_flags: sourceQualityFlags,
    },
    exact_row_promotion: exactRowPromotion,
    block_quality_diagnostics: {
      displayed_line_count: displayedLineCount,
      displayed_lines_complete: displayedLinesComplete,
      visual_structure: blockStructure,
      equation_bbox_present: equationBboxPresent,
      requested_label_present: requestedLabelPresent,
      neighboring_equation_label_count: neighboringEquationLabelCount,
      complete_block_candidate: completeBlockCandidate,
    },
    exact_block_promotion: exactBlockPromotion,
    quality_flags: allQualityFlags,
    quality_rejection_reasons: qualityRejectionReasons,
    retry_debug: buildRetryDebug(allQualityFlags),
    ocr_text_candidate: textCandidate,
    text_candidate: textCandidate,
    latex_candidate: latexCandidate,
    symbol_candidates: symbolCandidates,
    domain_candidates: domainCandidates.length
      ? domainCandidates
      : [{ domain: "unknown_math", score: 1, reasons: ["No supported scientific domain cues found."] }],
    primary_domain: primaryDomain,
    confidence,
    uncertainty: forcedUncertainty,
    extraction_status: status,
    admissibility: {
      status: admissibilityStatus,
      allowed_branch_hints: branchHints.allowed,
      blocked_branch_hints: branchHints.blocked,
      congruence_grade_floor: admissibilityStatus === "admissible_observation" ? "domain_context_match" : "insufficient_evidence",
      claim_boundary: "observation_only_not_proof",
    },
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
}

export function buildScientificImageEvidenceSidecar(input: {
  sidecarId?: string | null;
  packets: ScientificEvidencePacketV1[];
  sourceRefHash?: string | null;
}): ScientificImageEvidenceSidecarV1 {
  const packets = input.packets.filter((packet) => packet.schema === SCIENTIFIC_EVIDENCE_PACKET_SCHEMA);
  const sortedPackets = packets.slice().sort((left, right) => scientificPacketRank(right) - scientificPacketRank(left));
  const primaryPacket = sortedPackets[0] ?? null;
  const packetRefs = packets.map(evidencePacketRef);
  const sourceKinds = unique(packets.map((packet) => packet.source_image.source_kind));
  const extractedCount = packets.filter((packet) => packet.extraction_status === "extracted").length;
  const partialCount = packets.filter((packet) => packet.extraction_status === "partial").length;
  const failedCount = packets.filter((packet) => packet.extraction_status === "failed").length;
  const notRunCount = packets.filter((packet) => packet.extraction_status === "not_run").length;
  const admissibleCount = packets.filter((packet) => packet.admissibility.status === "admissible_observation").length;
  const unverifiedCount = packets.filter((packet) => packet.admissibility.status === "unverified_math_observation").length;
  const inadmissibleCount = packets.filter((packet) => packet.admissibility.status === "inadmissible_for_exact_mapping").length;
  const exactCandidates = packets.filter((packet) => packet.evidence_role === "exact_equation_candidate");
  const exactBlocks = exactCandidates.filter((packet) => packet.equation_capture_mode === "exact_block");
  const exactRows = exactCandidates.filter((packet) => packet.equation_capture_mode !== "exact_block");
  const admissibleExactRowCount = exactRows.filter((packet) => packet.exact_equation_admissibility === "admissible_for_exact_equation").length;
  const partialExactRowCount = exactRows.filter((packet) => packet.exact_equation_admissibility === "partial_candidate").length;
  const rejectedExactRowCount = exactRows.filter((packet) => packet.exact_equation_admissibility === "inadmissible_for_exact_equation").length;
  const exactRejectedReasons = unique(exactCandidates.flatMap((packet) => packet.quality_rejection_reasons));
  const promotedExactRowCount = exactRows.filter((packet) => packet.exact_row_promotion.status === "promoted").length;
  const admissibleExactBlockCount = exactBlocks.filter((packet) => packet.exact_equation_admissibility === "admissible_for_exact_equation").length;
  const partialExactBlockCount = exactBlocks.filter((packet) => packet.exact_equation_admissibility === "partial_candidate").length;
  const rejectedExactBlockCount = exactBlocks.filter((packet) => packet.exact_equation_admissibility === "inadmissible_for_exact_equation").length;
  const promotedExactBlockCount = exactBlocks.filter((packet) => packet.exact_block_promotion?.status === "promoted").length;
  const promotionBlockers = unique(exactRows
    .filter((packet) => packet.exact_row_promotion.status !== "promoted")
    .flatMap((packet) => packet.exact_row_promotion.reasons)
    .concat(exactBlocks
      .filter((packet) => packet.exact_block_promotion?.status !== "promoted")
      .flatMap((packet) => packet.exact_block_promotion?.reasons ?? [])));
  const confidenceMax = normalizeScore(Math.max(0, ...packets.map((packet) => packet.confidence)));
  const confidenceAvg = normalizeScore(
    packets.length ? packets.reduce((sum, packet) => sum + packet.confidence, 0) / packets.length : 0,
  );
  const status: ScientificImageEvidenceSidecarV1["admissibility"]["status"] =
    promotedExactRowCount > 0 || promotedExactBlockCount > 0
      ? "admissible_observation"
      : unverifiedCount > 0 || admissibleCount > 0
        ? "unverified_math_observation"
        : "inadmissible_for_exact_mapping";
  const reasons = [
    packets.length ? `${packets.length} Image Lens scientific evidence packet(s) normalized.` : "No Image Lens scientific evidence packets were supplied.",
    `${admissibleCount} packet(s) admissible, ${unverifiedCount} unverified, ${inadmissibleCount} inadmissible.`,
    ...(status === "admissible_observation"
      ? [promotedExactBlockCount > 0
          ? "At least one complete labeled multi-line equation block was promoted for candidate graph reflection."
          : "At least one clean exact equation row was promoted for candidate graph reflection."]
      : status === "unverified_math_observation"
        ? ["Only unverified math observations or context crops were available; graph/calculator handoff must remain restricted until an exact row is promoted."]
        : ["No crop observation is admissible for exact graph or calculator mapping."]),
  ];
  const primaryDomains = unique(
    packets
      .map((packet) => packet.primary_domain)
      .filter((domain) => domain !== "unknown_math"),
  ) as ScientificEvidenceDomainV1[];
  const sourceRefHash = input.sourceRefHash?.trim() || primaryPacket?.source_ref_hash || "scientific_image_sidecar";
  const sidecarId = input.sidecarId?.trim() || `scientific_image_sidecar:${sourceRefHash}`;
  const selectedEvidencePacket = selectStructuredScientificImageEvidencePacket(packets);
  const selectedEvidenceObject = buildPromotedScientificImageEvidence(selectedEvidencePacket, sidecarId);
  const primaryPacketRef = selectedEvidenceObject?.packet_ref ?? (primaryPacket ? evidencePacketRef(primaryPacket) : null);
  const activeBlockers = selectedEvidenceObject?.active_blockers ?? [];
  const historicalBlockers = unique(exactCandidates
    .filter((packet) => packet !== selectedEvidencePacket || (
      packet.equation_capture_mode === "exact_block"
        ? packet.exact_block_promotion?.status !== "promoted"
        : packet.exact_row_promotion.status !== "promoted"
    ))
    .flatMap((packet) => [
      ...(packet.equation_capture_mode === "exact_block"
        ? packet.exact_block_promotion?.reasons ?? []
        : packet.exact_row_promotion.reasons),
      ...packet.quality_flags,
    ])
    .filter((reason) => !SCIENTIFIC_IMAGE_EXACT_ROW_PROMOTION_REASON_VALUES.has(reason)));
  const routeStatus = status === "admissible_observation"
    ? "candidate"
    : status === "unverified_math_observation"
      ? "restricted"
      : "blocked";
  return {
    schema: SCIENTIFIC_IMAGE_EVIDENCE_SIDECAR_SCHEMA,
    sidecar_id: sidecarId,
    sidecar_kind: "transient_scientific_image_evidence",
    source_ref_hash: sourceRefHash,
    source_kind: sourceKinds.length === 1
      ? sourceKinds[0] as ScientificImageEvidenceSidecarV1["source_kind"]
      : sourceKinds.length > 1
        ? "mixed"
        : "unknown",
    packet_count: packets.length,
    packets,
    packet_refs: packetRefs,
    crop_regions: packets.map((packet) => ({
      crop_region_id: packet.crop_region_id,
      bbox_px: packet.bbox_px,
      source_ref_hash: packet.source_ref_hash,
      extraction_status: packet.extraction_status,
      admissibility_status: packet.admissibility.status,
      exact_equation_admissibility: packet.exact_equation_admissibility,
      requested_equation_label: packet.requested_equation_label,
      observed_equation_labels: packet.observed_equation_labels,
      label_match_status: packet.label_match_status,
      confidence: packet.confidence,
      row_quality_diagnostics: packet.row_quality_diagnostics,
      exact_row_promotion: packet.exact_row_promotion,
      exact_block_promotion: packet.exact_block_promotion,
    })),
    primary_packet_ref: primaryPacketRef,
    active_promoted_row: selectedEvidenceObject?.evidence_depth === "exact_row_promoted" ? selectedEvidenceObject : null,
    active_promoted_block: selectedEvidenceObject?.evidence_depth === "exact_block_promoted" ? selectedEvidenceObject : null,
    selected_evidence_object: selectedEvidenceObject,
    promoted_equation_ref: selectedEvidenceObject?.evidence_depth === "exact_row_promoted" || selectedEvidenceObject?.evidence_depth === "exact_block_promoted" ? selectedEvidenceObject.packet_ref : null,
    promoted_equation_latex: selectedEvidenceObject?.evidence_depth === "exact_row_promoted" || selectedEvidenceObject?.evidence_depth === "exact_block_promoted" ? selectedEvidenceObject.latex_candidate : null,
    promoted_equation_text: selectedEvidenceObject?.evidence_depth === "exact_row_promoted" || selectedEvidenceObject?.evidence_depth === "exact_block_promoted" ? selectedEvidenceObject.text_candidate : null,
    active_blockers: activeBlockers,
    historical_blockers: historicalBlockers,
    evidence_depth: selectedEvidenceObject?.evidence_depth ?? "missing",
    primary_domain: primaryPacket?.primary_domain ?? "unknown_math",
    primary_domains: primaryDomains.length ? primaryDomains : ["unknown_math"],
    extraction_summary: {
      extracted_count: extractedCount,
      partial_count: partialCount,
      failed_count: failedCount,
      not_run_count: notRunCount,
      admissible_count: admissibleCount,
      unverified_count: unverifiedCount,
      inadmissible_count: inadmissibleCount,
      confidence_max: confidenceMax,
      confidence_avg: confidenceAvg,
    },
    exact_equation_summary: {
      admissible_row_count: admissibleExactRowCount,
      partial_row_count: partialExactRowCount,
      rejected_row_count: rejectedExactRowCount,
      context_only_count: packets.filter((packet) => packet.evidence_role === "context_only").length,
      promoted_row_count: promotedExactRowCount,
      admissible_block_count: admissibleExactBlockCount,
      partial_block_count: partialExactBlockCount,
      rejected_block_count: rejectedExactBlockCount,
      promoted_block_count: promotedExactBlockCount,
      requested_labels: unique(exactRows.map((packet) => packet.requested_equation_label ?? "")),
      observed_labels: unique(exactRows.flatMap((packet) => packet.observed_equation_labels)),
      rejected_reasons: exactRejectedReasons,
      promotion_blockers: promotionBlockers,
    },
    admissibility: {
      status,
      reasons,
      claim_boundary: "observation_only_not_proof",
    },
    memory_classification: {
      memory_kind: "transient_scientific_image_evidence",
      retrieval_tags: unique([
        "scientific_image",
        "image_lens",
        "ocr_math",
        "latex_candidate",
        ...primaryDomains,
        ...packets.flatMap((packet) => packet.symbol_candidates.slice(0, 8)),
      ]),
      suggested_consumers: [
        "visual_analysis.inspect_image_region",
        "theory-badge-graph.reflect_discussion_context",
        "scientific-calculator.solve_expression",
      ],
      claim_boundary: "observation_only_not_proof",
    },
    compound_route_stages: [
      {
        stage: "image_extraction",
        status: packets.length ? "observed" : "blocked",
        artifact_refs: packetRefs,
        notes: [
          "Image Lens crop observations carry bbox, crop refs, text candidates, LaTeX candidates, symbols, uncertainty, and provenance.",
          `extracted=${extractedCount}; partial=${partialCount}; failed=${failedCount}; not_run=${notRunCount}.`,
          `exact_rows_admissible=${admissibleExactRowCount}; partial=${partialExactRowCount}; rejected=${rejectedExactRowCount}.`,
        ],
      },
      {
        stage: "scientific_evidence_sidecar",
        status: status === "admissible_observation" ? "admitted" : routeStatus,
        artifact_refs: [sidecarId],
        notes: reasons,
      },
      {
        stage: "theory_reflection",
        status: status === "admissible_observation" ? "candidate" : "blocked",
        artifact_refs: primaryPacketRef ? [primaryPacketRef] : [],
        notes: [
          "Theory graph branch admission must consume this sidecar, not prompt text.",
          admissibleExactRowCount > 0
            ? "At least one exact equation row is admissible for exact comparison."
            : "No exact equation row is admissible; theory reflection must remain context-only or restricted.",
        ],
      },
      {
        stage: "calculator_payload_filter",
        status: status === "admissible_observation" ? "candidate" : "blocked",
        artifact_refs: [],
        notes: ["Calculator handoff is blocked unless graph reflection keeps the evidence admissible."],
      },
      {
        stage: "final_answer_guard",
        status: "restricted",
        artifact_refs: [],
        notes: ["Final answers must separate OCR candidates, graph congruence, calculator output, and proof authority."],
      },
    ],
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
}

const includesAnyHint = (haystack: string, hints: string[]): boolean =>
  hints.some((hint) => haystack.includes(hint.toLowerCase().replace(/[^a-z0-9]+/g, "_")) || haystack.includes(hint.toLowerCase()));

const normalizeScientificToken = (value: string): string =>
  value
    .replace(/^\\/, "")
    .replace(/[{}]/g, "")
    .replace(/[^a-z0-9]+/gi, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();

const findMatchedScientificSymbols = (targetText: string, symbols: string[]): string[] => {
  const normalizedTarget = ` ${normalizeScientificToken(targetText)} `;
  return unique(symbols.filter((symbol) => {
    const normalizedSymbol = normalizeScientificToken(symbol);
    return normalizedSymbol.length > 1 && normalizedTarget.includes(normalizedSymbol);
  })).slice(0, 12);
};

const SCIENTIFIC_IMAGE_EVIDENCE_PROMPT_RE =
  /\b(?:image\s*lens|image\s+region|crop|bbox|attached\s+image|document\s+image|scientific\s+(?:image|document|page)|visual\s+evidence|ocr|latex\s+candidate|extract\s+(?:the\s+)?equations?|scientific\s+evidence\s+(?:packet|sidecar)|re-?entered\s+image|crop\s+receipt)\b/i;

const isPromptContextScientificEvidence = (evidence: ScientificEvidencePacketV1): boolean => {
  const bbox = evidence.bbox_px;
  const sourceKind = evidence.source_image?.source_kind;
  return (
    sourceKind === "prompt_context" ||
    evidence.source_ref_hash === "prompt_context" ||
    evidence.source_ref_hash === "theory_reflection_prompt_context" ||
    evidence.crop_region_id === "prompt_context" ||
    evidence.crop_region_id === "theory_reflection_prompt_context" ||
    (bbox.x === 0 && bbox.y === 0 && bbox.width === 1 && bbox.height === 1) ||
    evidence.uncertainty.some((note) => /prompt-context scientific branch gate/i.test(note))
  );
};

const buildScientificCongruenceAssessment = (input: {
  evidence: ScientificEvidencePacketV1;
  targetRef: string;
  targetKind: "badge" | "calculator_payload";
  targetText: string;
  blockedByBranchHint: boolean;
  allowedByBranchHint: boolean;
}): ScientificBranchGateV1["congruence_assessments"][number] => {
  const matchedSymbols = findMatchedScientificSymbols(input.targetText, input.evidence.symbol_candidates);
  const reasons: string[] = [];
  let grade: ScientificCongruenceGradeV1;
  if (input.blockedByBranchHint) {
    grade = "false_friend";
    reasons.push("Target matched a blocked scientific branch hint for this evidence domain.");
  } else if (input.evidence.admissibility.status !== "admissible_observation") {
    grade = "insufficient_evidence";
    reasons.push(`Evidence admissibility is ${input.evidence.admissibility.status}.`);
  } else if (matchedSymbols.length >= 2 && input.allowedByBranchHint) {
    grade = "exact_symbol_match";
    reasons.push("Target shares multiple extracted symbols and an allowed branch hint.");
  } else if (matchedSymbols.length > 0) {
    grade = "same_equation_family";
    reasons.push("Target shares extracted symbol candidates with the observation.");
  } else if (input.allowedByBranchHint) {
    grade = "domain_context_match";
    reasons.push("Target matched an allowed scientific branch hint without direct symbol overlap.");
  } else {
    grade = "analogy_only";
    reasons.push("Target was not blocked, but no direct symbol or branch match was found.");
  }
  return {
    target_ref: input.targetRef,
    target_kind: input.targetKind,
    grade,
    reasons,
    matched_symbols: matchedSymbols,
    blocked_by_branch_hint: input.blockedByBranchHint,
  };
};

export function buildScientificBranchGate(input: {
  evidence?: ScientificEvidencePacketV1 | null;
  sidecar?: ScientificImageEvidenceSidecarV1 | null;
  prompt: string;
  mentionedDomains?: string[];
  badgeIds?: string[];
  calculatorPayloads?: Array<{ badge_id?: string | null; badgeId?: string | null; payload_id?: string | null; payloadId?: string | null; expression?: string | null }>;
  requireAdmissibleEvidence?: boolean;
}): ScientificBranchGateV1 {
  const explicitEvidenceSupplied = Boolean(input.evidence);
  const promptEvidence = buildScientificEvidencePacket({
    cropRegionId: "prompt_context",
    sourceRefHash: "prompt_context",
    bboxPx: { x: 0, y: 0, width: 1, height: 1 },
    textCandidate: [input.prompt, ...(input.mentionedDomains ?? [])].join("\n"),
    latexCandidate: null,
    uncertainty: [],
    extractionStatus: "extracted",
  });
  const evidence = input.evidence ?? promptEvidence;
  const branchHints = evidence.admissibility;
  const exactSummary = input.sidecar?.exact_equation_summary ?? null;
  const exactEvidenceRequired = Boolean(input.sidecar) && input.requireAdmissibleEvidence === true;
  const admissibleExactEquationCount =
    (exactSummary?.admissible_row_count ?? 0) + (exactSummary?.admissible_block_count ?? 0);
  const insufficientExactEquationEvidence = exactEvidenceRequired && admissibleExactEquationCount < 1;
  const promptContextEvidence = isPromptContextScientificEvidence(evidence);
  const directImageEvidenceRequired =
    SCIENTIFIC_IMAGE_EVIDENCE_PROMPT_RE.test(input.prompt) ||
    evidence.uncertainty.some((note) => /not a direct Image Lens crop receipt/i.test(note));
  const calculatorPayloadEntries = (input.calculatorPayloads ?? []).map((payload) => {
    const targetRef = String(payload.payload_id ?? payload.payloadId ?? payload.badge_id ?? payload.badgeId ?? "unknown_payload");
    const joined = [payload.badge_id, payload.badgeId, payload.payload_id, payload.payloadId, payload.expression]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    const blockedByBranchHint = includesAnyHint(joined, branchHints.blocked_branch_hints) && !includesAnyHint(joined, branchHints.allowed_branch_hints);
    const allowedByBranchHint = includesAnyHint(joined, branchHints.allowed_branch_hints);
    return { payload, targetRef, joined, blockedByBranchHint, allowedByBranchHint };
  });
  const hardEvidenceBlock =
    (explicitEvidenceSupplied &&
      (evidence.primary_domain === "unknown_math" || evidence.admissibility.status === "inadmissible_for_exact_mapping")) ||
    (input.requireAdmissibleEvidence === true && evidence.admissibility.status !== "admissible_observation") ||
    insufficientExactEquationEvidence ||
    (directImageEvidenceRequired && promptContextEvidence);
  if (hardEvidenceBlock) {
    const rejectedBadgeIds = unique(input.badgeIds ?? []);
    const rejectedCalculatorPayloadIds = unique(calculatorPayloadEntries.map((entry) => entry.targetRef));
    return {
      schema: SCIENTIFIC_BRANCH_GATE_SCHEMA,
      status: "blocked",
      primary_domain: evidence.primary_domain,
      allowed_branch_hints: branchHints.allowed_branch_hints,
      blocked_branch_hints: branchHints.blocked_branch_hints,
      congruence_grade_floor: "insufficient_evidence",
      rejected_badge_ids: rejectedBadgeIds,
      rejected_calculator_payload_ids: rejectedCalculatorPayloadIds,
      congruence_assessments: [
        ...rejectedBadgeIds.map((badgeId) => ({
          target_ref: badgeId,
          target_kind: "badge" as const,
          grade: "insufficient_evidence" as const,
          reasons: ["Explicit scientific evidence was not admissible for exact graph mapping."],
          matched_symbols: [],
          blocked_by_branch_hint: true,
        })),
        ...calculatorPayloadEntries.map((entry) => ({
          target_ref: entry.targetRef,
          target_kind: "calculator_payload" as const,
          grade: "insufficient_evidence" as const,
          reasons: ["Explicit scientific evidence was not admissible for calculator handoff."],
          matched_symbols: [],
          blocked_by_branch_hint: true,
        })),
      ],
      notes: [
        `Scientific branch gate blocked ${promptContextEvidence ? "prompt_context" : evidence.primary_domain}.`,
        `Evidence admissibility is ${evidence.admissibility.status}.`,
        "Explicit Image Lens evidence was not replaced by prompt context.",
        "Image Lens evidence was not replaced by prompt context.",
        ...(input.requireAdmissibleEvidence === true && evidence.admissibility.status !== "admissible_observation"
          ? ["Strict scientific image sidecar gating requires admissible Image Lens evidence before graph or calculator handoff."]
          : []),
        ...(insufficientExactEquationEvidence
          ? [
              "insufficient_exact_equation_evidence: no Image Lens equation row or complete equation block is admissible for exact comparison.",
              `Exact equation rows: admissible=${exactSummary?.admissible_row_count ?? 0}; partial=${exactSummary?.partial_row_count ?? 0}; rejected=${exactSummary?.rejected_row_count ?? 0}.`,
              `Exact equation blocks: admissible=${exactSummary?.admissible_block_count ?? 0}; partial=${exactSummary?.partial_block_count ?? 0}; rejected=${exactSummary?.rejected_block_count ?? 0}.`,
            ]
          : []),
        ...(promptContextEvidence ? ["Prompt-context fallback packets cannot admit graph or calculator branches for source-targeted image prompts."] : []),
        ...(rejectedCalculatorPayloadIds.length ? ["Calculator payloads were suppressed because exact mapping evidence is missing."] : []),
        ...(rejectedBadgeIds.length ? ["Badge refs were marked rejected because graph mapping evidence is missing."] : []),
      ],
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    };
  }
  if (evidence.primary_domain === "unknown_math") {
    return {
      schema: SCIENTIFIC_BRANCH_GATE_SCHEMA,
      status: "not_applicable",
      primary_domain: "unknown_math",
      allowed_branch_hints: [],
      blocked_branch_hints: [],
      congruence_grade_floor: "insufficient_evidence",
      rejected_badge_ids: [],
      rejected_calculator_payload_ids: [],
      congruence_assessments: [],
      notes: ["No scientific branch gate applied because no supported domain was detected."],
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    };
  }
  const rejectedBadgeIds = (input.badgeIds ?? []).filter((badgeId) => {
    const normalized = badgeId.toLowerCase();
    return includesAnyHint(normalized, branchHints.blocked_branch_hints) && !includesAnyHint(normalized, branchHints.allowed_branch_hints);
  });
  const rejectedCalculatorPayloadIds = calculatorPayloadEntries
    .filter((entry) => entry.blockedByBranchHint)
    .map((entry) => entry.targetRef);
  const congruenceAssessments: ScientificBranchGateV1["congruence_assessments"] = [
    ...(input.badgeIds ?? []).map((badgeId) => {
      const normalized = badgeId.toLowerCase();
      const blockedByBranchHint = rejectedBadgeIds.includes(badgeId);
      const allowedByBranchHint = includesAnyHint(normalized, branchHints.allowed_branch_hints);
      return buildScientificCongruenceAssessment({
        evidence,
        targetRef: badgeId,
        targetKind: "badge",
        targetText: badgeId,
        blockedByBranchHint,
        allowedByBranchHint,
      });
    }),
    ...calculatorPayloadEntries.map((entry) => buildScientificCongruenceAssessment({
      evidence,
      targetRef: entry.targetRef,
      targetKind: "calculator_payload",
      targetText: entry.joined,
      blockedByBranchHint: entry.blockedByBranchHint,
      allowedByBranchHint: entry.allowedByBranchHint,
    })),
  ];
  const restricted = rejectedBadgeIds.length > 0 || rejectedCalculatorPayloadIds.length > 0 || branchHints.status !== "admissible_observation";
  return {
    schema: SCIENTIFIC_BRANCH_GATE_SCHEMA,
    status: restricted ? "restricted" : "admitted",
    primary_domain: evidence.primary_domain,
    allowed_branch_hints: branchHints.allowed_branch_hints,
    blocked_branch_hints: branchHints.blocked_branch_hints,
    congruence_grade_floor: branchHints.congruence_grade_floor,
    rejected_badge_ids: rejectedBadgeIds,
    rejected_calculator_payload_ids: rejectedCalculatorPayloadIds,
    congruence_assessments: congruenceAssessments,
    notes: [
      `Scientific branch gate detected ${evidence.primary_domain}.`,
      ...(branchHints.status === "admissible_observation" ? [] : [`Evidence admissibility is ${branchHints.status}.`]),
      ...(exactSummary ? [
        `Exact equation rows: admissible=${exactSummary.admissible_row_count}; partial=${exactSummary.partial_row_count}; rejected=${exactSummary.rejected_row_count}.`,
        `Exact equation blocks: admissible=${exactSummary.admissible_block_count ?? 0}; partial=${exactSummary.partial_block_count ?? 0}; rejected=${exactSummary.rejected_block_count ?? 0}.`,
      ] : []),
      ...(rejectedCalculatorPayloadIds.length ? ["Incompatible calculator payloads were suppressed before handoff."] : []),
      ...(rejectedBadgeIds.length ? ["Incompatible badge ids were marked rejected before synthesis."] : []),
    ],
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
}

export function buildScientificRunTrace(input: {
  turnId?: string | null;
  evidence?: ScientificEvidencePacketV1 | null;
  branchGate: ScientificBranchGateV1;
  reflectedBadgeIds?: string[];
  admittedCalculatorPayloadIds?: string[];
}): ScientificRunTraceV1 {
  const evidenceRef = input.evidence
    ? `${input.evidence.source_ref_hash}#crop=${input.evidence.bbox_px.x},${input.evidence.bbox_px.y},${input.evidence.bbox_px.width},${input.evidence.bbox_px.height}`
    : null;
  const admittedPayloadIds = unique(input.admittedCalculatorPayloadIds ?? []);
  const rejectedPayloadIds = unique(input.branchGate.rejected_calculator_payload_ids);
  const rejectedBadgeIds = unique(input.branchGate.rejected_badge_ids);
  const reflectedBadgeIds = unique(input.reflectedBadgeIds ?? []);
  const primaryDomain = input.evidence?.primary_domain ?? input.branchGate.primary_domain;
  const traceIdSeed = [
    input.turnId ?? "turn",
    input.evidence?.source_ref_hash ?? "prompt_context",
    input.evidence?.crop_region_id ?? "scientific_context",
    input.branchGate.status,
    primaryDomain,
  ].join(":");
  return {
    schema: SCIENTIFIC_RUN_TRACE_SCHEMA,
    trace_id: `scientific_run:${traceIdSeed}`,
    source_ref_hash: input.evidence?.source_ref_hash ?? "prompt_context",
    primary_domain: primaryDomain,
    evidence_ref: evidenceRef,
    branch_gate_status: input.branchGate.status,
    congruence_grade_floor: input.branchGate.congruence_grade_floor,
    admitted_calculator_payload_ids: admittedPayloadIds,
    rejected_calculator_payload_ids: rejectedPayloadIds,
    rejected_badge_ids: rejectedBadgeIds,
    stages: [
      {
        stage: "image_extraction",
        status: input.evidence ? "observed" : "candidate",
        artifact_refs: evidenceRef ? [evidenceRef] : ["prompt_context"],
        notes: input.evidence
          ? ["Source evidence came from a typed scientific evidence packet."]
          : ["No Image Lens evidence packet was supplied; branch gate used prompt context."],
      },
      {
        stage: "scientific_evidence_sidecar",
        status: input.evidence?.admissibility.status === "inadmissible_for_exact_mapping"
          ? "blocked"
          : input.evidence?.admissibility.status === "admissible_observation"
            ? "admitted"
            : "restricted",
        artifact_refs: input.evidence ? [input.evidence.crop_region_id] : ["prompt_context"],
        notes: [
          `Primary scientific domain: ${primaryDomain}.`,
          `Congruence grade floor: ${input.branchGate.congruence_grade_floor}.`,
        ],
      },
      {
        stage: "theory_reflection",
        status: input.branchGate.status,
        artifact_refs: [],
        notes: input.branchGate.notes,
      },
      {
        stage: "calculator_payload_filter",
        status: input.branchGate.status === "blocked" ? "blocked" : rejectedPayloadIds.length ? "restricted" : "admitted",
        artifact_refs: [...admittedPayloadIds.slice(0, 12), ...rejectedPayloadIds.slice(0, 12)],
        notes: [
          `${admittedPayloadIds.length} calculator payload(s) admitted.`,
          `${rejectedPayloadIds.length} incompatible calculator payload(s) rejected.`,
        ],
      },
      {
        stage: "final_answer_guard",
        status: input.branchGate.status === "blocked" ? "blocked" : "restricted",
        artifact_refs: [],
        notes: [
          "Final answer must label OCR, graph reflection, calculator output, and proof/validation separately.",
        ],
      },
    ],
    final_answer_guard: {
      required_claim_boundary: "observation_ocr_graph_match_not_proof",
      must_disclose_uncertainty: Boolean(input.evidence?.uncertainty.length),
      must_disclose_rejections: rejectedPayloadIds.length > 0 || rejectedBadgeIds.length > 0,
    },
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
}

const evidenceRefForPacket = (packet: ScientificEvidencePacketV1): string =>
  `${packet.source_ref_hash}#crop=${packet.bbox_px.x},${packet.bbox_px.y},${packet.bbox_px.width},${packet.bbox_px.height}`;

const detectScientificEvidenceDepth = (input: {
  evidence?: ScientificEvidencePacketV1 | null;
  sidecar?: ScientificImageEvidenceSidecarV1 | null;
  branchGate: ScientificBranchGateV1;
  calculatorPayloadCount: number;
}): ScientificEvidenceGraphReflectionV1["evidence_depth"] => {
  if (!input.evidence) return "metadata_lookup";
  if (
    input.calculatorPayloadCount > 0 &&
    input.evidence.admissibility.status === "admissible_observation" &&
    input.branchGate.status === "admitted"
  ) {
    return "calculator_template_candidate";
  }
  const promotedRows = input.sidecar?.exact_equation_summary.promoted_row_count ?? 0;
  const promotedBlocks = input.sidecar?.exact_equation_summary.promoted_block_count ?? 0;
  const equationPacketCount = input.sidecar?.packets.filter((packet) => packet.evidence_role === "exact_equation_candidate").length ?? 0;
  if (equationPacketCount > 1) return "multi_equation_derivation_candidate";
  if (
    promotedBlocks > 0 ||
    input.evidence.exact_block_promotion?.status === "promoted"
  ) {
    return "promoted_exact_equation_block";
  }
  if (
    promotedRows > 0 ||
    input.evidence.exact_equation_admissibility === "admissible_for_exact_equation" ||
    input.evidence.exact_row_promotion.status === "promoted"
  ) {
    return "promoted_exact_equation_row";
  }
  if (input.evidence.source_image.source_kind === "prompt_context") return "abstract_or_snippet";
  return "page_grounded_ocr";
};

const normalizedEvidenceText = (evidence: ScientificEvidencePacketV1 | null | undefined): string =>
  [
    evidence?.latex_candidate,
    evidence?.text_candidate,
    evidence?.ocr_text_candidate,
    ...(evidence?.symbol_candidates ?? []),
  ].filter(Boolean).join("\n");

const detectScientificEvidenceObjectClass = (
  evidence: ScientificEvidencePacketV1 | null,
): ScientificEvidenceGraphReflectionV1["evidence_object_class"] => {
  if (!evidence) return "metadata_record";
  if (evidence.source_image.source_kind === "prompt_context") return "provider_abstract_or_snippet";
  const text = normalizedEvidenceText(evidence).toLowerCase();
  if (/\bs\s*\[|\\sqrt\{-?g\}|sqrt\(-?g\)|\\box|\\square|□|\\xi\s*r|ξ\s*r|ricci|curvature coupling/i.test(text)) {
    return "curved_spacetime_field_action";
  }
  if (/\bboundary|robin|dirichlet|neumann|plate|surface condition/i.test(text)) return "boundary_condition";
  if (/stress[-\s]?energy|energy density|vacuum energy|casimir force|pressure|force law/i.test(text)) {
    return "stress_energy_or_vacuum_energy_expression";
  }
  if (evidence.evidence_role === "exact_equation_candidate") return "page_ocr_math_candidate";
  return "unknown_scientific_object";
};

const findFeatureMatches = (text: string, entries: Array<[string, RegExp]>): string[] =>
  unique(entries.filter(([, pattern]) => pattern.test(text)).map(([label]) => label));

const normalizeScientificEvidenceFeatures = (
  evidence: ScientificEvidencePacketV1 | null,
): ScientificEvidenceGraphReflectionV1["normalized_scientific_features"] => {
  const text = normalizedEvidenceText(evidence);
  const lower = text.toLowerCase();
  return {
    latex_candidates: evidence?.latex_candidate ? [evidence.latex_candidate] : [],
    text_candidates: evidence?.text_candidate ? [evidence.text_candidate] : [],
    operators: findFeatureMatches(text, [
      ["dAlembertian_or_wave_operator", /\\box|\\square|□|box/i],
      ["spacetime_volume_integral", /\\int|∫/],
      ["metric_determinant_density", /\\sqrt\{-?g\}|sqrt\(-?g\)|√\(-?g\)/i],
      ["curvature_coupling_operator", /\\xi\s*R|ξ\s*R|xi\s*R/i],
    ]),
    variables: unique([
      ...(evidence?.symbol_candidates ?? []),
      ...Array.from(text.matchAll(/\b[A-Za-z][A-Za-z0-9_]*(?:\^[A-Za-z0-9{}]+)?(?:_[A-Za-z0-9{}]+)?\b/g)).map((match) => match[0]),
    ]).slice(0, 24),
    constants: findFeatureMatches(lower, [
      ["hbar", /\\hbar|ℏ/],
      ["speed_of_light", /\bc\b/],
      ["pi", /\\pi|π|\bpi\b/],
      ["curvature_coupling_xi", /\\xi|ξ|\bxi\b/],
    ]),
    fields: findFeatureMatches(text, [
      ["scalar_field_phi", /\\varphi|\\phi|φ|ϕ|phi|varphi/i],
      ["metric_field_g", /\bg\b|g_{\w+}|g\]/i],
    ]),
    geometry_terms: findFeatureMatches(text, [
      ["metric_determinant", /\\sqrt\{-?g\}|sqrt\(-?g\)|√\(-?g\)/i],
      ["ricci_scalar_R", /\bR\b|ricci/i],
      ["curved_spacetime_dimension_D", /d\^D\s*x|D-dimensional|d-dimensional/i],
      ["spacetime_manifold_M", /\\int_\{M\}|∫_M|\bM\b/],
    ]),
    domain_hints: unique([
      ...(evidence?.domain_candidates.map((candidate) => candidate.domain) ?? []),
      ...(evidence?.admissibility.allowed_branch_hints ?? []),
      ...(evidence?.primary_domain ? [evidence.primary_domain] : []),
    ]).slice(0, 16),
    symbol_candidates: evidence?.symbol_candidates.slice(0, 32) ?? [],
  };
};

const attachmentStrengthForGrade = (
  grade: ScientificCongruenceGradeV1,
): ScientificEvidenceGraphReflectionV1["graph_attachments"][number]["attachment_strength"] => {
  switch (grade) {
    case "exact_symbol_match":
      return "strong";
    case "same_equation_family":
    case "domain_context_match":
      return "moderate";
    case "false_friend":
    case "insufficient_evidence":
      return "blocked";
    case "analogy_only":
    default:
      return "weak";
  }
};

const blockedAuthoritiesForReflection = (input: {
  branchGate: ScientificBranchGateV1;
  evidenceDepth: ScientificEvidenceGraphReflectionV1["evidence_depth"];
  calculatorPayloadCount: number;
}): ScientificEvidenceGraphReflectionV1["blocked_authorities"] => {
  const blocked: ScientificEvidenceGraphReflectionV1["blocked_authorities"] = [
    { authority: "proof", blocked_reason: "Scientific evidence packets are observations, not proof authority." },
    { authority: "physical_validation", blocked_reason: "OCR, metadata, and graph adjacency do not validate a physical theory." },
    { authority: "badge_promotion", blocked_reason: "Badge promotion requires graph gates beyond diagnostic reflection." },
  ];
  if (
    input.calculatorPayloadCount === 0 ||
    input.branchGate.rejected_calculator_payload_ids.length > 0 ||
    input.evidenceDepth !== "calculator_template_candidate"
  ) {
    blocked.push({
      authority: "calculator_payload",
      blocked_reason: "Calculator handoff requires bound variables, units, assumptions, and an admitted derivation chain.",
    });
  }
  return blocked;
};

const upgradeRequirementsForReflection = (input: {
  evidenceDepth: ScientificEvidenceGraphReflectionV1["evidence_depth"];
  objectClass: ScientificEvidenceGraphReflectionV1["evidence_object_class"];
  branchGate: ScientificBranchGateV1;
  sidecar?: ScientificImageEvidenceSidecarV1 | null;
}): string[] => unique([
  ...(input.evidenceDepth === "metadata_lookup" ? ["Materialize abstract/snippet or full-text evidence before scientific claims."] : []),
  ...(input.evidenceDepth === "abstract_or_snippet" ? ["Fetch full text or render PDF pages for page-grounded evidence."] : []),
  ...(input.evidenceDepth === "page_grounded_ocr" ? ["Crop and promote exact equation rows before graph or calculator use."] : []),
  ...(["promoted_exact_equation_row", "promoted_exact_equation_block"].includes(input.evidenceDepth)
    ? [
        "Extract neighboring definitions, assumptions, and boundary conditions.",
        "Extract derived stress-energy, energy-density, force, or pressure equations if present.",
      ]
    : []),
  ...(input.objectClass === "curved_spacetime_field_action"
    ? [
        "Derive or extract the stress-energy tensor relation tied to this action.",
        "Bind curvature coupling, field, metric, and integration-domain definitions.",
      ]
    : []),
  ...(input.branchGate.status === "blocked" || input.branchGate.status === "restricted"
    ? input.branchGate.notes.slice(0, 4)
    : []),
  ...((input.sidecar?.exact_equation_summary.partial_row_count ?? 0) > 0
    ? ["Retry partial equation rows with exact row crops before promotion."]
    : []),
  ...((input.sidecar?.exact_equation_summary.partial_block_count ?? 0) > 0
    ? ["Retry partial equation blocks with one complete labeled block crop before promotion."]
    : []),
]);

const nextAffordancesForReflection = (input: {
  evidenceDepth: ScientificEvidenceGraphReflectionV1["evidence_depth"];
  objectClass: ScientificEvidenceGraphReflectionV1["evidence_object_class"];
  calculatorBlocked: boolean;
}): ScientificEvidenceGraphReflectionV1["next_tool_affordances"] => [
  ...(input.evidenceDepth === "metadata_lookup" || input.evidenceDepth === "abstract_or_snippet"
    ? [{
        capability: "scholarly-research.fetch_full_text",
        reason: "Fetch full text or PDF source before equation-level reflection.",
      }]
    : []),
  ...(input.evidenceDepth === "page_grounded_ocr"
    ? [{
        capability: "visual_analysis.inspect_image_region",
        reason: "Crop exact equation rows and promote only if exact equation admissibility passes.",
      }]
    : []),
  ...(["promoted_exact_equation_row", "promoted_exact_equation_block"].includes(input.evidenceDepth)
    ? [{
        capability: "visual_analysis.inspect_image_region",
        reason: "Inspect adjacent rows/pages for definitions, boundary conditions, and derived equations.",
      }]
    : []),
  ...(input.objectClass === "curved_spacetime_field_action"
    ? [{
        capability: "scholarly-research.extract_numeric_parameters",
        reason: "Look for parameter definitions, units, assumptions, and derived measurable forms.",
      }]
    : []),
  ...(input.calculatorBlocked
    ? [{
        capability: "scientific-calculator.bind_variables",
        reason: "Attempt calculator preflight only after variables, units, and assumptions are bound.",
      }]
    : []),
];

export function buildScientificEvidenceGraphReflection(input: {
  turnId?: string | null;
  evidence?: ScientificEvidencePacketV1 | null;
  sidecar?: ScientificImageEvidenceSidecarV1 | null;
  branchGate: ScientificBranchGateV1;
  reflectedBadgeIds?: string[];
  calculatorPayloads?: Array<{ payload_id?: string | null; payloadId?: string | null; badge_id?: string | null; badgeId?: string | null; expression?: string | null }>;
  provenanceRefs?: string[];
}): ScientificEvidenceGraphReflectionV1 {
  const calculatorPayloads = input.calculatorPayloads ?? [];
  const selectedEvidenceObject = input.sidecar?.selected_evidence_object ?? buildPromotedScientificImageEvidence(input.evidence ?? null, input.sidecar?.sidecar_id ?? "scientific_image_sidecar:reflection");
  const evidenceDepth = detectScientificEvidenceDepth({
    evidence: input.evidence,
    sidecar: input.sidecar,
    branchGate: input.branchGate,
    calculatorPayloadCount: calculatorPayloads.length,
  });
  const objectClass = evidenceDepth === "calculator_template_candidate"
    ? "calculator_template_candidate"
    : detectScientificEvidenceObjectClass(input.evidence ?? null);
  const features = normalizeScientificEvidenceFeatures(input.evidence ?? null);
  const reflectedBadgeIds = unique(input.reflectedBadgeIds ?? []);
  const assessedRefs = new Set(input.branchGate.congruence_assessments.map((assessment) => assessment.target_ref));
  const assessmentAttachments = input.branchGate.congruence_assessments.map((assessment) => ({
    node_id: assessment.target_ref,
    node_kind: assessment.target_kind,
    attachment_strength: attachmentStrengthForGrade(assessment.grade),
    evidence_depth: evidenceDepth,
    mathematical_reasons: assessment.reasons.length
      ? assessment.reasons
      : [`Graph target received ${assessment.grade} from the scientific branch gate.`],
    matched_symbols: assessment.matched_symbols,
    claim_boundary: "diagnostic_only" as const,
  }));
  const unassessedBadgeAttachments = reflectedBadgeIds
    .filter((badgeId) => !assessedRefs.has(badgeId))
    .slice(0, 12)
    .map((badgeId) => ({
      node_id: badgeId,
      node_kind: "badge" as const,
      attachment_strength: input.branchGate.rejected_badge_ids.includes(badgeId) ? "blocked" as const : "weak" as const,
      evidence_depth: evidenceDepth,
      mathematical_reasons: [
        input.branchGate.rejected_badge_ids.includes(badgeId)
          ? "Badge was rejected by the scientific branch gate."
          : "Badge was surfaced by graph reflection but lacks direct symbol-level support from the evidence packet.",
      ],
      matched_symbols: [],
      claim_boundary: "diagnostic_only" as const,
    }));
  const calculatorBlocked =
    calculatorPayloads.length === 0 ||
    input.branchGate.rejected_calculator_payload_ids.length > 0 ||
    evidenceDepth !== "calculator_template_candidate";
  return {
    schema: SCIENTIFIC_EVIDENCE_GRAPH_REFLECTION_SCHEMA,
    reflection_id: `scientific_evidence_graph_reflection:${input.turnId ?? "turn"}:${input.evidence?.source_ref_hash ?? "metadata"}:${input.branchGate.status}`,
    evidence_depth: evidenceDepth,
    evidence_object_class: objectClass,
    normalized_scientific_features: features,
    graph_attachments: [...assessmentAttachments, ...unassessedBadgeAttachments].slice(0, 24),
    attachment_reasons: unique([
      `Evidence object classified as ${objectClass}.`,
      `Evidence depth classified as ${evidenceDepth}.`,
      `Scientific branch gate status is ${input.branchGate.status} with floor ${input.branchGate.congruence_grade_floor}.`,
      ...input.branchGate.notes.slice(0, 6),
    ]),
    claim_boundary: {
      diagnostic_only: true,
      observation_not_proof: true,
      no_physical_validation: true,
      no_badge_promotion: true,
      no_calculator_authority_without_bound_payload: true,
    },
    blocked_authorities: blockedAuthoritiesForReflection({
      branchGate: input.branchGate,
      evidenceDepth,
      calculatorPayloadCount: calculatorPayloads.length,
    }),
    upgrade_requirements: upgradeRequirementsForReflection({
      evidenceDepth,
      objectClass,
      branchGate: input.branchGate,
      sidecar: input.sidecar,
    }),
    next_tool_affordances: nextAffordancesForReflection({
      evidenceDepth,
      objectClass,
      calculatorBlocked,
    }),
    provenance_refs: unique([
      ...(input.provenanceRefs ?? []),
      ...(selectedEvidenceObject ? [selectedEvidenceObject.evidence_id, selectedEvidenceObject.packet_ref] : []),
      ...(input.evidence ? [evidenceRefForPacket(input.evidence), input.evidence.crop_region_id] : []),
      ...(input.sidecar ? [input.sidecar.sidecar_id, ...input.sidecar.packet_refs] : []),
    ]).slice(0, 24),
    selected_evidence_object: selectedEvidenceObject,
    exact_evidence_ref: selectedEvidenceObject?.packet_ref ?? null,
    exact_evidence_latex: selectedEvidenceObject?.latex_candidate ?? null,
    exact_evidence_text: selectedEvidenceObject?.text_candidate ?? null,
    branch_gate_status: input.branchGate.status,
    congruence_grade_floor: input.branchGate.congruence_grade_floor,
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
  };
}

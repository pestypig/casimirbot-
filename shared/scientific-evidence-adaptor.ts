export const SCIENTIFIC_EVIDENCE_PACKET_SCHEMA = "helix.scientific_evidence_packet.v1" as const;
export const SCIENTIFIC_IMAGE_EVIDENCE_SIDECAR_SCHEMA = "helix.scientific_image_evidence_sidecar.v1" as const;
export const SCIENTIFIC_BRANCH_GATE_SCHEMA = "helix.scientific_branch_gate.v1" as const;
export const SCIENTIFIC_RUN_TRACE_SCHEMA = "helix.scientific_run_trace.v1" as const;

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
  requested_equation_label: string | null;
  observed_equation_labels: string[];
  label_match_status: ScientificEquationLabelMatchStatusV1;
  exact_equation_admissibility: ScientificExactEquationAdmissibilityV1;
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
  }>;
  primary_packet_ref: string | null;
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
    requested_labels: string[];
    observed_labels: string[];
    rejected_reasons: string[];
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

type CandidateInput = {
  textCandidate?: string | null;
  latexCandidate?: string | null;
  uncertainty?: string[] | null;
  extractionStatus?: ScientificEvidencePacketV1["extraction_status"];
  requestedEquationLabel?: string | null;
  regionLabel?: string | null;
  cropRegionId: string;
  sourceRefHash: string;
  sourceKind?: ScientificEvidencePacketV1["source_image"]["source_kind"] | null;
  pageNumber?: number | null;
  bboxPx: ScientificEvidencePacketV1["bbox_px"];
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
  ].map(normalizeEquationLabel);
  return unique(labels).slice(0, 12);
}

const isExactEquationRegion = (input: CandidateInput): boolean =>
  Boolean(input.requestedEquationLabel?.trim()) || /^equation[_-]?\d+\.\d+/i.test(input.regionLabel ?? "");

const scientificEvidenceRole = (input: CandidateInput): ScientificEvidencePacketV1["evidence_role"] =>
  isExactEquationRegion(input) ? "exact_equation_candidate" : "context_only";

const classifyLabelMatch = (
  requestedEquationLabel: string | null,
  observedEquationLabels: string[],
): ScientificEquationLabelMatchStatusV1 => {
  if (!requestedEquationLabel) return "not_applicable";
  if (!observedEquationLabels.length) return "missing_observed_label";
  if (observedEquationLabels.includes(requestedEquationLabel)) return "matched";
  return observedEquationLabels.length > 1 ? "ambiguous" : "mismatched";
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
}): string[] => {
  const flags: string[] = [];
  const combined = `${input.text}\n${input.latex}`;
  const textLines = input.text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const latexLines = input.latex.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (!input.hasCandidate || input.extractionStatus === "failed" || input.extractionStatus === "not_run") {
    flags.push("no_ocr_or_latex_candidate");
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

const qualityFlagReason = (flag: string): string => {
  switch (flag) {
    case "no_ocr_or_latex_candidate": return "No OCR text or LaTeX candidate was returned.";
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
    case "row_crop_too_broad_for_exact_equation": return "The row crop is too broad to treat as one exact equation row.";
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
  const qualityFlags = detectScientificQualityFlags({
    text: textCandidate ?? "",
    latex: latexCandidate ?? "",
    evidenceRole,
    requestedEquationLabel,
    observedEquationLabels,
    labelMatchStatus,
    extractionStatus: status,
    hasCandidate,
  });
  const qualityRejectionReasons = qualityFlags.map(qualityFlagReason);
  const forcedUncertainty = unique([
    ...(input.uncertainty ?? []),
    ...qualityRejectionReasons.map((reason) => `local_quality_gate: ${reason}`),
  ]);
  const exactEquationAdmissibility: ScientificExactEquationAdmissibilityV1 =
    evidenceRole === "context_only"
      ? "partial_candidate"
      : !hasCandidate || status === "failed" || status === "not_run" || labelMatchStatus === "mismatched" || labelMatchStatus === "ambiguous"
        ? "inadmissible_for_exact_equation"
        : labelMatchStatus === "matched" && qualityFlags.length === 0 && status === "extracted"
          ? "admissible_for_exact_equation"
          : "partial_candidate";
  const confidence =
    primaryDomain === "unknown_math" || !hasCandidate || status === "failed" || status === "not_run"
      ? 0
      : normalizeScore(Math.max(0, Math.min(0.9, 0.35 + Math.min(topScore, 6) / 10 - qualityFlags.length * 0.08)));
  const branchHints = DOMAIN_BRANCH_HINTS[primaryDomain];
  const admissibilityStatus =
    !hasCandidate || status === "failed" || status === "not_run" || exactEquationAdmissibility === "inadmissible_for_exact_equation"
      ? "inadmissible_for_exact_mapping"
      : confidence <= 0.55 || qualityFlags.length > 0 || (evidenceRole === "exact_equation_candidate" && exactEquationAdmissibility === "partial_candidate")
        ? "unverified_math_observation"
        : "admissible_observation";
  return {
    schema: SCIENTIFIC_EVIDENCE_PACKET_SCHEMA,
    evidence_type: "image_lens_region_ocr_math",
    source_ref_hash: input.sourceRefHash,
    source_image: {
      ref_hash: input.sourceRefHash,
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
    requested_equation_label: requestedEquationLabel,
    observed_equation_labels: observedEquationLabels,
    label_match_status: labelMatchStatus,
    exact_equation_admissibility: exactEquationAdmissibility,
    quality_flags: qualityFlags,
    quality_rejection_reasons: qualityRejectionReasons,
    retry_debug: buildRetryDebug(qualityFlags),
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
  const exactRows = packets.filter((packet) => packet.evidence_role === "exact_equation_candidate");
  const admissibleExactRowCount = exactRows.filter((packet) => packet.exact_equation_admissibility === "admissible_for_exact_equation").length;
  const partialExactRowCount = exactRows.filter((packet) => packet.exact_equation_admissibility === "partial_candidate").length;
  const rejectedExactRowCount = exactRows.filter((packet) => packet.exact_equation_admissibility === "inadmissible_for_exact_equation").length;
  const exactRejectedReasons = unique(exactRows.flatMap((packet) => packet.quality_rejection_reasons));
  const confidenceMax = normalizeScore(Math.max(0, ...packets.map((packet) => packet.confidence)));
  const confidenceAvg = normalizeScore(
    packets.length ? packets.reduce((sum, packet) => sum + packet.confidence, 0) / packets.length : 0,
  );
  const status: ScientificImageEvidenceSidecarV1["admissibility"]["status"] =
    admissibleCount > 0
      ? "admissible_observation"
      : unverifiedCount > 0
        ? "unverified_math_observation"
        : "inadmissible_for_exact_mapping";
  const reasons = [
    packets.length ? `${packets.length} Image Lens scientific evidence packet(s) normalized.` : "No Image Lens scientific evidence packets were supplied.",
    `${admissibleCount} packet(s) admissible, ${unverifiedCount} unverified, ${inadmissibleCount} inadmissible.`,
    ...(status === "admissible_observation"
      ? ["At least one crop observation has enough domain and symbol evidence for candidate graph reflection."]
      : status === "unverified_math_observation"
        ? ["Only unverified math observations were available; graph/calculator handoff must remain restricted."]
        : ["No crop observation is admissible for exact graph or calculator mapping."]),
  ];
  const primaryDomains = unique(
    packets
      .map((packet) => packet.primary_domain)
      .filter((domain) => domain !== "unknown_math"),
  ) as ScientificEvidenceDomainV1[];
  const sourceRefHash = input.sourceRefHash?.trim() || primaryPacket?.source_ref_hash || "scientific_image_sidecar";
  const sidecarId = input.sidecarId?.trim() || `scientific_image_sidecar:${sourceRefHash}`;
  const primaryPacketRef = primaryPacket ? evidencePacketRef(primaryPacket) : null;
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
    })),
    primary_packet_ref: primaryPacketRef,
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
      requested_labels: unique(exactRows.map((packet) => packet.requested_equation_label ?? "")),
      observed_labels: unique(exactRows.flatMap((packet) => packet.observed_equation_labels)),
      rejected_reasons: exactRejectedReasons,
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
  /\b(?:image\s*lens|image\s+region|crop|bbox|attached\s+image|document\s+image|scientific\s+(?:image|document|page)|visual\s+evidence|ocr|latex\s+candidate|extract\s+(?:the\s+)?equations?|scientific\s+evidence\s+(?:packet|sidecar)|theory\s+(?:badge\s+)?graph|re-?entered\s+image|crop\s+receipt)\b/i;

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
    extractionStatus: "partial",
  });
  const evidence = input.evidence ?? promptEvidence;
  const branchHints = evidence.admissibility;
  const exactSummary = input.sidecar?.exact_equation_summary ?? null;
  const exactEvidenceRequired = Boolean(input.sidecar) && input.requireAdmissibleEvidence === true;
  const insufficientExactEquationEvidence = exactEvidenceRequired && (exactSummary?.admissible_row_count ?? 0) < 1;
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
              "insufficient_exact_equation_evidence: no Image Lens equation row crop is admissible for exact comparison.",
              `Exact equation rows: admissible=${exactSummary?.admissible_row_count ?? 0}; partial=${exactSummary?.partial_row_count ?? 0}; rejected=${exactSummary?.rejected_row_count ?? 0}.`,
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
      ...(exactSummary ? [`Exact equation rows: admissible=${exactSummary.admissible_row_count}; partial=${exactSummary.partial_row_count}; rejected=${exactSummary.rejected_row_count}.`] : []),
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

import type { HelixResearchLibraryPage } from "./helix-research-library";

export const HELIX_PAPER_EVIDENCE_SIDECAR_SCHEMA =
  "helix.paper_evidence_sidecar.v1" as const;

export const HELIX_PAPER_EVIDENCE_SIDECAR_KIND = "paper_evidence" as const;

export type HelixPaperEvidenceCandidateLevelV1 =
  | "full_text_machine_text"
  | "page_image_required";

export type HelixPaperEvidenceContextKindV1 =
  | "claim"
  | "limitation"
  | "value";

export type HelixPaperEquationBindingStatusV1 =
  | "prefill_ready"
  | "needs_variable_binding"
  | "needs_source_context";

export type HelixPaperEquationClassificationV1 =
  | "governing_equation"
  | "bound"
  | "definition"
  | "derived_relation"
  | "constraint"
  | "other";

export type HelixPaperEvidenceBasisV1 = "paper" | "agent_inference";

export type HelixPaperEquationSymbolBindingV1 = {
  symbol: string;
  meaning: string;
  value: string | number | null;
  unit: string | null;
  basis: HelixPaperEvidenceBasisV1;
  source_refs: string[];
  inference_note: string | null;
  confidence: number;
};

export type HelixPaperEquationAssumptionV1 = {
  text: string;
  basis: HelixPaperEvidenceBasisV1;
  source_refs: string[];
  inference_note: string | null;
  confidence: number;
};

export type HelixPaperEquationAgentEnrichmentV1 = {
  schema: "helix.paper_equation_agent_enrichment.v1";
  proposal_id: string;
  agent_authored: true;
  classification: HelixPaperEquationClassificationV1;
  normalized_latex: string;
  evidence_depth: "machine_text_interpretation" | "page_grounded";
  symbol_bindings: HelixPaperEquationSymbolBindingV1[];
  assumptions: HelixPaperEquationAssumptionV1[];
  calculator: {
    prefill_expression: string;
    bound_expression: string | null;
    missing_variables: string[];
    auto_run_allowed: false;
  };
  authority: {
    exact_equation_authority: false;
    claim_boundary: "agent_enriched_candidate_not_verified_exact_equation";
  };
  applied_at: string;
};

export type HelixPaperEvidenceEnrichmentHistoryEntryV1 = {
  proposal_id: string;
  proposal_fingerprint?: string;
  from_revision: number;
  to_revision: number;
  updated_equation_ids: string[];
  applied_at: string;
  agent_authored: true;
};

export type HelixPaperEquationCandidateV1 = {
  equation_id: string;
  page: number;
  source_text_ref: string;
  raw_text: string;
  latex_candidate: string;
  extraction_method: "machine_text_line" | "delimited_math";
  confidence: number;
  symbols: string[];
  unit_candidates: string[];
  assumptions: string[];
  calculator: {
    prefill_ready: boolean;
    binding_status: HelixPaperEquationBindingStatusV1;
    missing_variables: string[];
    required_assumptions: string[];
    auto_run_allowed: false;
  };
  evidence: {
    level: HelixPaperEvidenceCandidateLevelV1;
    exact_equation_authority: false;
    page_image_or_crop_ref: null;
    claim_boundary: "candidate_not_verified_exact_equation";
  };
  agent_enrichment: HelixPaperEquationAgentEnrichmentV1 | null;
};

export type HelixPaperContextCandidateV1 = {
  item_id: string;
  kind: HelixPaperEvidenceContextKindV1;
  page: number;
  source_text_ref: string;
  text: string;
  confidence: number;
  evidence_level: "full_text_machine_text";
};

export type HelixPaperEvidenceSidecarV1 = {
  schema: typeof HELIX_PAPER_EVIDENCE_SIDECAR_SCHEMA;
  sidecar_id: string;
  sidecar_kind: typeof HELIX_PAPER_EVIDENCE_SIDECAR_KIND;
  document_id: string;
  source_integrity_hash: string;
  paper_result_id: string | null;
  generated_at: string;
  updated_at: string;
  revision: number;
  parent_revision: number | null;
  generation_mode: "deterministic_first_pass";
  status: "extracted_candidate" | "agent_enriched_candidate";
  evidence_level: HelixPaperEvidenceCandidateLevelV1;
  equation_candidates: HelixPaperEquationCandidateV1[];
  context_candidates: HelixPaperContextCandidateV1[];
  summary: {
    equation_candidate_count: number;
    claim_candidate_count: number;
    limitation_candidate_count: number;
    value_candidate_count: number;
    calculator_prefill_ready_count: number;
    calculator_binding_required_count: number;
  };
  enrichment: {
    agent_enrichment_status: "not_run" | "applied";
    agent_enrichment_allowed: true;
    last_proposal_id: string | null;
    history: HelixPaperEvidenceEnrichmentHistoryEntryV1[];
    suggested_capabilities: Array<
      | "research-library.read_document"
      | "visual_analysis.inspect_image_region"
      | "scientific-calculator.solve_expression"
    >;
    missing_requirements: string[];
  };
  authority: {
    assistant_answer: false;
    terminal_eligible: false;
    raw_content_included: true;
    validates_paper_claims: false;
    exact_equation_authority: false;
    theory_graph_promotion_allowed: false;
    claim_boundary: "extracted_candidates_require_agent_and_evidence_review";
  };
};

export type BuildHelixPaperEvidenceSidecarInput = {
  document_id: string;
  source_integrity_hash: string;
  paper_result_id?: string | null;
  extraction_status: "full_text_usable" | "page_image_parse_required";
  pages: HelixResearchLibraryPage[];
  generated_at?: string;
};

const compact = (value: string): string => value.replace(/\s+/g, " ").trim();

const unique = (values: string[]): string[] =>
  Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));

const clampConfidence = (value: number): number =>
  Math.max(0, Math.min(1, Number(value.toFixed(3))));

const normalizeMathText = (value: string): string =>
  compact(value)
    .replace(/≤/g, "\\leq ")
    .replace(/≥/g, "\\geq ")
    .replace(/≠/g, "\\neq ")
    .replace(/≈/g, "\\approx ")
    .replace(/∞/g, "\\infty ")
    .replace(/∫/g, "\\int ")
    .replace(/∑/g, "\\sum ")
    .replace(/√/g, "\\sqrt{} ")
    .replace(/π/g, "\\pi ")
    .replace(/τ/g, "\\tau ")
    .replace(/ρ/g, "\\rho ")
    .replace(/μ/g, "\\mu ")
    .replace(/ν/g, "\\nu ")
    .replace(/\s+/g, " ")
    .trim();

const hasRelation = (value: string): boolean =>
  /(?:=|≤|≥|≠|≈|<|>|\\(?:leq|geq|neq|approx)\b)/.test(value);

const hasMathSignal = (value: string): boolean => {
  const operatorCount = (value.match(/[+\-*/^]|\\(?:frac|sqrt|int|sum|partial|nabla)\b/g) ?? []).length;
  const symbolCount = (value.match(/(?:\\[A-Za-z]+|[A-Za-z](?:_[A-Za-z0-9{}]+)?)/g) ?? []).length;
  return /[$\\_^{}]|[∫∑√πτρμν]/.test(value) || operatorCount >= 1 || symbolCount >= 2;
};

const looksLikeEquation = (value: string): boolean => {
  const text = compact(value);
  if (!text || text.length < 3 || text.length > 480) return false;
  if (!hasRelation(text) || !hasMathSignal(text)) return false;
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const prosePunctuation = (text.match(/[.!?]/g) ?? []).length;
  return wordCount <= 45 && prosePunctuation <= 2;
};

const SYMBOL_STOPLIST = new Set([
  "and", "or", "the", "for", "with", "where", "from", "this", "that", "is", "are", "to",
  "frac", "sqrt", "int", "sum", "partial", "nabla", "left", "right", "mathrm", "text", "leq",
  "geq", "neq", "approx", "infty", "begin", "end", "cdot", "times", "pi",
]);

const extractSymbols = (value: string): string[] => {
  const matches = value.match(/\\[A-Za-z]+|\b[A-Za-z][A-Za-z0-9]*(?:_[A-Za-z0-9{}]+)?\b/g) ?? [];
  return unique(matches)
    .filter((symbol) => !SYMBOL_STOPLIST.has(symbol.replace(/^\\/, "").toLowerCase()))
    .slice(0, 24);
};

const extractUnits = (value: string): string[] => {
  const matches = value.match(
    /(?:\b(?:m|cm|mm|km|s|ms|Hz|kHz|MHz|GHz|J|eV|keV|MeV|GeV|K|Pa|bar|kg|g|mol|A|V|W|T)\b|m\/s|m\^?2|m\^?3|s\^-?1)/g,
  ) ?? [];
  return unique(matches).slice(0, 12);
};

const delimitedMathSegments = (line: string): string[] => {
  const segments: string[] = [];
  for (const match of line.matchAll(/\$\$([^$]+)\$\$|\\\[([^\]]+)\\\]|\$([^$\n]+)\$/g)) {
    const candidate = compact(match[1] ?? match[2] ?? match[3] ?? "");
    if (looksLikeEquation(candidate)) segments.push(candidate);
  }
  return segments;
};

const sentenceCandidates = (text: string): string[] =>
  text
    .split(/(?<=[.!?])\s+|\r?\n+/)
    .map(compact)
    .filter((value) => value.length >= 28 && value.length <= 420);

const classifyContextCandidate = (text: string): HelixPaperEvidenceContextKindV1 | null => {
  if (/\b(?:limitation|however|cannot|does not|do not|not sufficient|restricted to|valid only|requires|assum(?:e|ed|ption))\b/i.test(text)) {
    return "limitation";
  }
  if (/\b\d+(?:\.\d+)?\s*(?:m|cm|mm|km|s|ms|Hz|kHz|MHz|GHz|J|eV|keV|MeV|GeV|K|Pa|bar|kg|g|mol|A|V|W|T)\b/.test(text)) {
    return "value";
  }
  if (/\b(?:we (?:show|find|demonstrate|derive|conclude)|our results|the results (?:show|imply)|this (?:shows|implies|establishes)|is bounded by|is constrained by)\b/i.test(text)) {
    return "claim";
  }
  return null;
};

export function buildHelixPaperEvidenceSidecarV1(
  input: BuildHelixPaperEvidenceSidecarInput,
): HelixPaperEvidenceSidecarV1 {
  const equationCandidates: HelixPaperEquationCandidateV1[] = [];
  const contextCandidates: HelixPaperContextCandidateV1[] = [];
  const seenEquations = new Set<string>();
  const seenContext = new Set<string>();

  for (const page of input.pages) {
    const lines = page.text.split(/\r?\n/).map(compact).filter(Boolean);
    for (const [lineIndex, line] of lines.entries()) {
      const candidates = [
        ...delimitedMathSegments(line).map((raw) => ({ raw, method: "delimited_math" as const })),
        ...(looksLikeEquation(line) ? [{ raw: line, method: "machine_text_line" as const }] : []),
      ];
      for (const candidate of candidates) {
        const latex = normalizeMathText(candidate.raw.replace(/^\$+|\$+$/g, ""));
        const dedupeKey = `${page.page}:${latex}`;
        if (!latex || seenEquations.has(dedupeKey) || equationCandidates.length >= 120) continue;
        seenEquations.add(dedupeKey);
        const symbols = extractSymbols(latex);
        const unitCandidates = extractUnits(candidate.raw);
        const missingVariables = symbols;
        const bindingStatus: HelixPaperEquationBindingStatusV1 = missingVariables.length > 0
          ? "needs_variable_binding"
          : "prefill_ready";
        equationCandidates.push({
          equation_id: `paper-equation:p${page.page}:l${lineIndex + 1}`,
          page: page.page,
          source_text_ref: page.source_text_ref,
          raw_text: candidate.raw,
          latex_candidate: latex,
          extraction_method: candidate.method,
          confidence: clampConfidence(candidate.method === "delimited_math" ? 0.82 : 0.64),
          symbols,
          unit_candidates: unitCandidates,
          assumptions: [],
          calculator: {
            prefill_ready: true,
            binding_status: bindingStatus,
            missing_variables: missingVariables,
            required_assumptions: [],
            auto_run_allowed: false,
          },
          evidence: {
            level: input.extraction_status === "page_image_parse_required"
              ? "page_image_required"
              : "full_text_machine_text",
            exact_equation_authority: false,
            page_image_or_crop_ref: null,
            claim_boundary: "candidate_not_verified_exact_equation",
          },
          agent_enrichment: null,
        });
      }
    }

    for (const [sentenceIndex, sentence] of sentenceCandidates(page.text).entries()) {
      const kind = classifyContextCandidate(sentence);
      const dedupeKey = `${kind}:${sentence.toLowerCase()}`;
      if (!kind || seenContext.has(dedupeKey) || contextCandidates.length >= 120) continue;
      seenContext.add(dedupeKey);
      contextCandidates.push({
        item_id: `paper-context:p${page.page}:s${sentenceIndex + 1}`,
        kind,
        page: page.page,
        source_text_ref: page.source_text_ref,
        text: sentence,
        confidence: clampConfidence(kind === "claim" ? 0.7 : 0.62),
        evidence_level: "full_text_machine_text",
      });
    }
  }

  const counts = (kind: HelixPaperEvidenceContextKindV1) =>
    contextCandidates.filter((candidate) => candidate.kind === kind).length;
  const bindingRequired = equationCandidates.filter(
    (candidate) => candidate.calculator.binding_status !== "prefill_ready",
  ).length;
  const missingRequirements = unique([
    equationCandidates.length === 0 ? "equation_candidates_missing" : "",
    bindingRequired > 0 ? "agent_symbol_unit_assumption_binding_available" : "",
    equationCandidates.length > 0 ? "exact_equation_page_image_review_not_run" : "",
  ]);

  return {
    schema: HELIX_PAPER_EVIDENCE_SIDECAR_SCHEMA,
    sidecar_id: `${input.document_id}:paper-evidence:v1`,
    sidecar_kind: HELIX_PAPER_EVIDENCE_SIDECAR_KIND,
    document_id: input.document_id,
    source_integrity_hash: input.source_integrity_hash,
    paper_result_id: input.paper_result_id?.trim() || null,
    generated_at: input.generated_at ?? new Date().toISOString(),
    updated_at: input.generated_at ?? new Date().toISOString(),
    revision: 1,
    parent_revision: null,
    generation_mode: "deterministic_first_pass",
    status: "extracted_candidate",
    evidence_level: input.extraction_status === "page_image_parse_required"
      ? "page_image_required"
      : "full_text_machine_text",
    equation_candidates: equationCandidates,
    context_candidates: contextCandidates,
    summary: {
      equation_candidate_count: equationCandidates.length,
      claim_candidate_count: counts("claim"),
      limitation_candidate_count: counts("limitation"),
      value_candidate_count: counts("value"),
      calculator_prefill_ready_count: equationCandidates.length,
      calculator_binding_required_count: bindingRequired,
    },
    enrichment: {
      agent_enrichment_status: "not_run",
      agent_enrichment_allowed: true,
      last_proposal_id: null,
      history: [],
      suggested_capabilities: [
        "research-library.read_document",
        "visual_analysis.inspect_image_region",
        "scientific-calculator.solve_expression",
      ],
      missing_requirements: missingRequirements,
    },
    authority: {
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: true,
      validates_paper_claims: false,
      exact_equation_authority: false,
      theory_graph_promotion_allowed: false,
      claim_boundary: "extracted_candidates_require_agent_and_evidence_review",
    },
  };
}

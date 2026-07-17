import type { HelixResearchLibraryPage } from "./helix-research-library";
import type {
  HelixPaperEquationAgentEnrichmentV1,
  HelixPaperEquationAssumptionV1,
  HelixPaperEquationClassificationV1,
  HelixPaperEquationSymbolBindingV1,
  HelixPaperEvidenceBasisV1,
  HelixPaperEvidenceSidecarV1,
} from "./helix-paper-evidence-sidecar";

export const HELIX_RESEARCH_LIBRARY_APPLY_EVIDENCE_ENRICHMENT_CAPABILITY =
  "research-library.apply_evidence_enrichment" as const;

export const HELIX_PAPER_EVIDENCE_ENRICHMENT_PROPOSAL_SCHEMA =
  "helix.paper_evidence_enrichment_proposal.v1" as const;

export const HELIX_PAPER_EVIDENCE_ENRICHMENT_OBSERVATION_SCHEMA =
  "helix.paper_evidence_enrichment_observation.v1" as const;

export const HELIX_PAPER_EVIDENCE_ENRICHMENT_PROPOSAL_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "schema",
    "proposal_id",
    "document_id",
    "sidecar_id",
    "source_integrity_hash",
    "expected_revision",
    "agent_authored",
    "equation_updates",
    "assistant_answer",
    "terminal_eligible",
    "raw_content_included",
  ],
  properties: {
    schema: { type: "string", enum: [HELIX_PAPER_EVIDENCE_ENRICHMENT_PROPOSAL_SCHEMA] },
    proposal_id: { type: "string" },
    document_id: { type: "string" },
    sidecar_id: { type: "string" },
    source_integrity_hash: { type: "string" },
    expected_revision: { type: "number" },
    agent_authored: { type: "boolean", enum: [true] },
    equation_updates: {
      type: "array",
      minItems: 1,
      maxItems: 40,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "equation_id",
          "classification",
          "normalized_latex",
          "evidence_depth",
          "symbol_bindings",
          "assumptions",
          "calculator",
          "exact_equation_authority_requested",
        ],
        properties: {
          equation_id: { type: "string" },
          classification: {
            type: "string",
            enum: ["governing_equation", "bound", "definition", "derived_relation", "constraint", "other"],
          },
          normalized_latex: { type: "string" },
          evidence_depth: { type: "string", enum: ["machine_text_interpretation", "page_grounded"] },
          symbol_bindings: {
            type: "array",
            maxItems: 80,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["symbol", "meaning", "value", "unit", "basis", "source_refs", "inference_note", "confidence"],
              properties: {
                symbol: { type: "string" },
                meaning: { type: "string" },
                value: { type: ["string", "number", "null"] },
                unit: { type: ["string", "null"] },
                basis: { type: "string", enum: ["paper", "agent_inference"] },
                source_refs: { type: "array", items: { type: "string" } },
                inference_note: { type: ["string", "null"] },
                confidence: { type: "number", minimum: 0, maximum: 1 },
              },
            },
          },
          assumptions: {
            type: "array",
            maxItems: 40,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["text", "basis", "source_refs", "inference_note", "confidence"],
              properties: {
                text: { type: "string" },
                basis: { type: "string", enum: ["paper", "agent_inference"] },
                source_refs: { type: "array", items: { type: "string" } },
                inference_note: { type: ["string", "null"] },
                confidence: { type: "number", minimum: 0, maximum: 1 },
              },
            },
          },
          calculator: {
            type: "object",
            additionalProperties: false,
            required: ["prefill_expression", "missing_variables", "auto_run_allowed"],
            properties: {
              prefill_expression: { type: "string" },
              bound_expression: { type: ["string", "null"] },
              missing_variables: { type: "array", items: { type: "string" } },
              auto_run_allowed: { type: "boolean", enum: [false] },
            },
          },
          exact_equation_authority_requested: { type: "boolean", enum: [false] },
        },
      },
    },
    assistant_answer: { type: "boolean", enum: [false] },
    terminal_eligible: { type: "boolean", enum: [false] },
    raw_content_included: { type: "boolean", enum: [false] },
  },
} as const;

export type HelixPaperEvidenceEnrichmentEquationUpdateV1 = {
  equation_id: string;
  classification: HelixPaperEquationClassificationV1;
  normalized_latex: string;
  evidence_depth: "machine_text_interpretation" | "page_grounded";
  symbol_bindings: HelixPaperEquationSymbolBindingV1[];
  assumptions: HelixPaperEquationAssumptionV1[];
  calculator: {
    prefill_expression: string;
    bound_expression?: string | null;
    missing_variables: string[];
    auto_run_allowed: false;
  };
  exact_equation_authority_requested: false;
};

export type HelixPaperEvidenceEnrichmentProposalV1 = {
  schema: typeof HELIX_PAPER_EVIDENCE_ENRICHMENT_PROPOSAL_SCHEMA;
  proposal_id: string;
  document_id: string;
  sidecar_id: string;
  source_integrity_hash: string;
  expected_revision: number;
  agent_authored: true;
  equation_updates: HelixPaperEvidenceEnrichmentEquationUpdateV1[];
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

export type HelixPaperEvidenceEnrichmentFailureCode =
  | "paper_evidence_enrichment_proposal_invalid"
  | "paper_evidence_enrichment_identity_mismatch"
  | "paper_evidence_enrichment_stale_revision"
  | "paper_evidence_enrichment_equation_missing"
  | "paper_evidence_enrichment_source_ref_invalid"
  | "paper_evidence_enrichment_inference_note_required"
  | "paper_evidence_enrichment_auto_run_forbidden"
  | "exact_equation_authority_requires_verified_image_lane";

export type ApplyHelixPaperEvidenceEnrichmentResultV1 =
  | {
      ok: true;
      status: "applied" | "idempotent";
      sidecar: HelixPaperEvidenceSidecarV1;
      from_revision: number;
      to_revision: number;
      updated_equation_ids: string[];
      proposal_id: string;
    }
  | {
      ok: false;
      status: "blocked";
      failure_code: HelixPaperEvidenceEnrichmentFailureCode;
      missing_requirements: string[];
    };

const clean = (value: unknown): string => typeof value === "string" ? value.trim() : "";

const confidence = (value: unknown): number => {
  const numeric = typeof value === "number" && Number.isFinite(value) ? value : 0;
  return Math.max(0, Math.min(1, Number(numeric.toFixed(3))));
};

const uniqueStrings = (values: unknown): string[] => Array.isArray(values)
  ? Array.from(new Set(values.map(clean).filter(Boolean)))
  : [];

const stableJsonValue = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(stableJsonValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, stableJsonValue(entry)]),
    );
  }
  return value;
};

const proposalFingerprint = (value: unknown): string => {
  const text = JSON.stringify(stableJsonValue(value));
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return `fnv1a:${hash.toString(16).padStart(8, "0")}`;
};

const classifications = new Set<HelixPaperEquationClassificationV1>([
  "governing_equation",
  "bound",
  "definition",
  "derived_relation",
  "constraint",
  "other",
]);

const evidenceBasis = (value: unknown): HelixPaperEvidenceBasisV1 | null =>
  value === "paper" || value === "agent_inference" ? value : null;

const blocked = (
  failureCode: HelixPaperEvidenceEnrichmentFailureCode,
  ...missingRequirements: string[]
): ApplyHelixPaperEvidenceEnrichmentResultV1 => ({
  ok: false,
  status: "blocked",
  failure_code: failureCode,
  missing_requirements: Array.from(new Set(missingRequirements.filter(Boolean))),
});

const parseBinding = (value: unknown): HelixPaperEquationSymbolBindingV1 | null => {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const basis = evidenceBasis(record.basis);
  const symbol = clean(record.symbol);
  const meaning = clean(record.meaning);
  if (!basis || !symbol || !meaning) return null;
  const rawValue = record.value;
  return {
    symbol,
    meaning,
    value: typeof rawValue === "number" && Number.isFinite(rawValue)
      ? rawValue
      : clean(rawValue) || null,
    unit: clean(record.unit) || null,
    basis,
    source_refs: uniqueStrings(record.source_refs),
    inference_note: clean(record.inference_note) || null,
    confidence: confidence(record.confidence),
  };
};

const parseAssumption = (value: unknown): HelixPaperEquationAssumptionV1 | null => {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const basis = evidenceBasis(record.basis);
  const text = clean(record.text);
  if (!basis || !text) return null;
  return {
    text,
    basis,
    source_refs: uniqueStrings(record.source_refs),
    inference_note: clean(record.inference_note) || null,
    confidence: confidence(record.confidence),
  };
};

const normalizeRevision = (sidecar: HelixPaperEvidenceSidecarV1): number =>
  Number.isInteger(sidecar.revision) && sidecar.revision > 0 ? sidecar.revision : 1;

export function applyHelixPaperEvidenceEnrichmentV1(input: {
  sidecar: HelixPaperEvidenceSidecarV1;
  pages: HelixResearchLibraryPage[];
  proposal: unknown;
  applied_at?: string;
}): ApplyHelixPaperEvidenceEnrichmentResultV1 {
  if (!input.proposal || typeof input.proposal !== "object") {
    return blocked("paper_evidence_enrichment_proposal_invalid", "structured_proposal_required");
  }
  let serializedProposal = "";
  try {
    serializedProposal = JSON.stringify(input.proposal);
  } catch {
    return blocked("paper_evidence_enrichment_proposal_invalid", "proposal_must_be_json_serializable");
  }
  if (serializedProposal.length > 256_000) {
    return blocked("paper_evidence_enrichment_proposal_invalid", "proposal_size_limit_exceeded");
  }
  const proposal = input.proposal as Record<string, unknown>;
  const proposalId = clean(proposal.proposal_id);
  const currentRevision = normalizeRevision(input.sidecar);
  const existingHistory = Array.isArray(input.sidecar.enrichment?.history)
    ? input.sidecar.enrichment.history
    : [];
  if (
    proposal.schema !== HELIX_PAPER_EVIDENCE_ENRICHMENT_PROPOSAL_SCHEMA ||
    proposal.agent_authored !== true ||
    proposal.assistant_answer !== false ||
    proposal.terminal_eligible !== false ||
    proposal.raw_content_included !== false ||
    !proposalId ||
    !Array.isArray(proposal.equation_updates) ||
    proposal.equation_updates.length === 0 ||
    proposal.equation_updates.length > 40
  ) {
    return blocked("paper_evidence_enrichment_proposal_invalid", "proposal_contract_unsatisfied");
  }
  if (
    clean(proposal.document_id) !== input.sidecar.document_id ||
    clean(proposal.sidecar_id) !== input.sidecar.sidecar_id ||
    clean(proposal.source_integrity_hash) !== input.sidecar.source_integrity_hash
  ) {
    return blocked("paper_evidence_enrichment_identity_mismatch", "document_sidecar_integrity_identity_match_required");
  }
  const fingerprint = proposalFingerprint(proposal);
  const existing = existingHistory.find((entry) => entry.proposal_id === proposalId);
  if (existing) {
    if (existing.proposal_fingerprint && existing.proposal_fingerprint !== fingerprint) {
      return blocked("paper_evidence_enrichment_proposal_invalid", "proposal_id_reused_with_different_content");
    }
    return {
      ok: true,
      status: "idempotent",
      sidecar: input.sidecar,
      from_revision: existing.from_revision,
      to_revision: existing.to_revision,
      updated_equation_ids: [...existing.updated_equation_ids],
      proposal_id: proposalId,
    };
  }
  if (proposal.expected_revision !== currentRevision) {
    return blocked("paper_evidence_enrichment_stale_revision", `expected_revision:${currentRevision}`);
  }

  const pageSourceRefs = new Set(input.pages.map((page) => clean(page.source_text_ref)).filter(Boolean));
  const candidatesById = new Map(input.sidecar.equation_candidates.map((candidate) => [candidate.equation_id, candidate]));
  const normalizedUpdates: Array<{ equationId: string; enrichment: HelixPaperEquationAgentEnrichmentV1 }> = [];
  const seenEquationIds = new Set<string>();
  const appliedAt = input.applied_at ?? new Date().toISOString();

  for (const rawUpdate of proposal.equation_updates) {
    if (!rawUpdate || typeof rawUpdate !== "object") {
      return blocked("paper_evidence_enrichment_proposal_invalid", "equation_update_invalid");
    }
    const update = rawUpdate as Record<string, unknown>;
    const equationId = clean(update.equation_id);
    const candidate = candidatesById.get(equationId);
    if (!candidate || seenEquationIds.has(equationId)) {
      return blocked("paper_evidence_enrichment_equation_missing", `equation_id:${equationId || "missing"}`);
    }
    seenEquationIds.add(equationId);
    if (update.exact_equation_authority_requested !== false) {
      return blocked("exact_equation_authority_requires_verified_image_lane", "verified_page_image_observation_required");
    }
    const calculator = update.calculator && typeof update.calculator === "object"
      ? update.calculator as Record<string, unknown>
      : null;
    if (!calculator || calculator.auto_run_allowed !== false) {
      return blocked("paper_evidence_enrichment_auto_run_forbidden", "calculator_auto_run_must_be_false");
    }
    const classification = classifications.has(update.classification as HelixPaperEquationClassificationV1)
      ? update.classification as HelixPaperEquationClassificationV1
      : null;
    const normalizedLatex = clean(update.normalized_latex);
    const prefillExpression = clean(calculator.prefill_expression);
    const evidenceDepth = update.evidence_depth === "page_grounded"
      ? "page_grounded"
      : update.evidence_depth === "machine_text_interpretation"
        ? "machine_text_interpretation"
        : null;
    const bindings = Array.isArray(update.symbol_bindings)
      ? update.symbol_bindings.map(parseBinding)
      : [];
    const assumptions = Array.isArray(update.assumptions)
      ? update.assumptions.map(parseAssumption)
      : [];
    if (
      !classification || !normalizedLatex || !prefillExpression || !evidenceDepth ||
      normalizedLatex.length > 8_000 || prefillExpression.length > 8_000 ||
      bindings.length > 80 || assumptions.length > 40 ||
      bindings.some((binding) => binding === null) || assumptions.some((assumption) => assumption === null)
    ) {
      return blocked("paper_evidence_enrichment_proposal_invalid", `equation_update_contract:${equationId}`);
    }

    const evidenceItems = [
      ...(bindings as HelixPaperEquationSymbolBindingV1[]),
      ...(assumptions as HelixPaperEquationAssumptionV1[]),
    ];
    for (const item of evidenceItems) {
      if (item.basis === "paper") {
        if (item.source_refs.length === 0 || item.source_refs.some((ref) => !pageSourceRefs.has(ref))) {
          return blocked("paper_evidence_enrichment_source_ref_invalid", `equation_id:${equationId}`);
        }
      } else if (!item.inference_note) {
        return blocked("paper_evidence_enrichment_inference_note_required", `equation_id:${equationId}`);
      }
    }
    if (evidenceDepth === "page_grounded" && !pageSourceRefs.has(candidate.source_text_ref)) {
      return blocked("paper_evidence_enrichment_source_ref_invalid", `candidate_source_ref:${equationId}`);
    }

    normalizedUpdates.push({
      equationId,
      enrichment: {
        schema: "helix.paper_equation_agent_enrichment.v1",
        proposal_id: proposalId,
        agent_authored: true,
        classification,
        normalized_latex: normalizedLatex,
        evidence_depth: evidenceDepth,
        symbol_bindings: bindings as HelixPaperEquationSymbolBindingV1[],
        assumptions: assumptions as HelixPaperEquationAssumptionV1[],
        calculator: {
          prefill_expression: prefillExpression,
          bound_expression: clean(calculator.bound_expression) || null,
          missing_variables: uniqueStrings(calculator.missing_variables),
          auto_run_allowed: false,
        },
        authority: {
          exact_equation_authority: false,
          claim_boundary: "agent_enriched_candidate_not_verified_exact_equation",
        },
        applied_at: appliedAt,
      },
    });
  }

  const updatesById = new Map(normalizedUpdates.map((update) => [update.equationId, update.enrichment]));
  const equationCandidates = input.sidecar.equation_candidates.map((candidate) => {
    const enrichment = updatesById.get(candidate.equation_id);
    if (!enrichment) return candidate;
    return {
      ...candidate,
      calculator: {
        ...candidate.calculator,
        prefill_ready: enrichment.calculator.missing_variables.length === 0,
        binding_status: enrichment.calculator.missing_variables.length === 0
          ? "prefill_ready" as const
          : "needs_variable_binding" as const,
        missing_variables: [...enrichment.calculator.missing_variables],
        required_assumptions: enrichment.assumptions.map((assumption) => assumption.text),
        auto_run_allowed: false as const,
      },
      agent_enrichment: enrichment,
    };
  });
  const toRevision = currentRevision + 1;
  const updatedEquationIds = normalizedUpdates.map((update) => update.equationId);
  const bindingRequiredCount = equationCandidates.filter(
    (candidate) => candidate.calculator.binding_status !== "prefill_ready",
  ).length;
  const sidecar: HelixPaperEvidenceSidecarV1 = {
    ...input.sidecar,
    revision: toRevision,
    parent_revision: currentRevision,
    updated_at: appliedAt,
    status: "agent_enriched_candidate",
    equation_candidates: equationCandidates,
    summary: {
      ...input.sidecar.summary,
      calculator_prefill_ready_count: equationCandidates.length - bindingRequiredCount,
      calculator_binding_required_count: bindingRequiredCount,
    },
    enrichment: {
      ...input.sidecar.enrichment,
      agent_enrichment_status: "applied",
      agent_enrichment_allowed: true,
      last_proposal_id: proposalId,
      history: [
        ...existingHistory,
        {
          proposal_id: proposalId,
          proposal_fingerprint: fingerprint,
          from_revision: currentRevision,
          to_revision: toRevision,
          updated_equation_ids: updatedEquationIds,
          applied_at: appliedAt,
          agent_authored: true as const,
        },
      ].slice(-50),
    },
    authority: {
      ...input.sidecar.authority,
      assistant_answer: false,
      terminal_eligible: false,
      validates_paper_claims: false,
      exact_equation_authority: false,
      theory_graph_promotion_allowed: false,
    },
  };
  return {
    ok: true,
    status: "applied",
    sidecar,
    from_revision: currentRevision,
    to_revision: toRevision,
    updated_equation_ids: updatedEquationIds,
    proposal_id: proposalId,
  };
}

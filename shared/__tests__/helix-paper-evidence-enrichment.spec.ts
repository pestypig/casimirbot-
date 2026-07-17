import { describe, expect, it } from "vitest";

import { applyHelixPaperEvidenceEnrichmentV1 } from "../helix-paper-evidence-enrichment";
import { buildHelixPaperEvidenceSidecarV1 } from "../helix-paper-evidence-sidecar";
import type { HelixResearchLibraryPage } from "../helix-research-library";

const page: HelixResearchLibraryPage = {
  page: 4,
  text: "The sampled bound is rho >= -C/tau_0^4.",
  text_char_count: 43,
  extraction_status: "text",
  source_text_ref: "artifact://ford-roman.pdf#page=4&text",
};

const sidecar = () => buildHelixPaperEvidenceSidecarV1({
  document_id: "research:ford-roman",
  source_integrity_hash: "sha256:ford-roman",
  paper_result_id: "arxiv:gr-qc/9510071",
  extraction_status: "full_text_usable",
  pages: [page],
  generated_at: "2026-07-16T12:00:00.000Z",
});

const proposal = (overrides: Record<string, unknown> = {}) => ({
  schema: "helix.paper_evidence_enrichment_proposal.v1",
  proposal_id: "proposal:ford-roman:eq1",
  document_id: "research:ford-roman",
  sidecar_id: "research:ford-roman:paper-evidence:v1",
  source_integrity_hash: "sha256:ford-roman",
  expected_revision: 1,
  agent_authored: true,
  equation_updates: [{
    equation_id: "paper-equation:p4:l1",
    classification: "bound",
    normalized_latex: "\\rho \\geq -C/\\tau_0^4",
    evidence_depth: "page_grounded",
    symbol_bindings: [{
      symbol: "\\rho",
      meaning: "sampled energy density",
      value: null,
      unit: null,
      basis: "paper",
      source_refs: [page.source_text_ref],
      inference_note: null,
      confidence: 0.91,
    }],
    assumptions: [{
      text: "The paper's stated sampling setup applies.",
      basis: "paper",
      source_refs: [page.source_text_ref],
      inference_note: null,
      confidence: 0.88,
    }],
    calculator: {
      prefill_expression: "rho >= -C/tau_0^4",
      bound_expression: null,
      missing_variables: ["rho", "C", "tau_0"],
      auto_run_allowed: false,
    },
    exact_equation_authority_requested: false,
  }],
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
  ...overrides,
});

describe("paper evidence enrichment authority boundary", () => {
  it("applies a grounded agent proposal as a new non-terminal revision", () => {
    const result = applyHelixPaperEvidenceEnrichmentV1({
      sidecar: sidecar(),
      pages: [page],
      proposal: proposal(),
      applied_at: "2026-07-16T12:10:00.000Z",
    });
    expect(result).toMatchObject({ ok: true, status: "applied", from_revision: 1, to_revision: 2 });
    if (!result.ok) return;
    expect(result.sidecar.equation_candidates[0]?.agent_enrichment).toMatchObject({
      classification: "bound",
      authority: { exact_equation_authority: false },
      calculator: { auto_run_allowed: false },
    });
    expect(result.sidecar.authority).toMatchObject({
      terminal_eligible: false,
      validates_paper_claims: false,
      theory_graph_promotion_allowed: false,
    });
  });

  it.each([
    ["stale revision", { expected_revision: 9 }, "paper_evidence_enrichment_stale_revision"],
    ["wrong document identity", { document_id: "research:other" }, "paper_evidence_enrichment_identity_mismatch"],
    ["wrong sidecar identity", { sidecar_id: "research:other:paper-evidence:v1" }, "paper_evidence_enrichment_identity_mismatch"],
    ["wrong source integrity hash", { source_integrity_hash: "sha256:other" }, "paper_evidence_enrichment_identity_mismatch"],
  ])("blocks %s", (_label, overrides, code) => {
    const result = applyHelixPaperEvidenceEnrichmentV1({ sidecar: sidecar(), pages: [page], proposal: proposal(overrides) });
    expect(result).toMatchObject({ ok: false, failure_code: code });
  });

  it("blocks unknown candidates and forged paper source refs", () => {
    const unknown = proposal();
    (unknown.equation_updates[0] as Record<string, unknown>).equation_id = "paper-equation:missing";
    expect(applyHelixPaperEvidenceEnrichmentV1({ sidecar: sidecar(), pages: [page], proposal: unknown }))
      .toMatchObject({ ok: false, failure_code: "paper_evidence_enrichment_equation_missing" });

    const forged = proposal();
    const binding = (forged.equation_updates[0].symbol_bindings[0] as Record<string, unknown>);
    binding.source_refs = ["artifact://forged#page=1"];
    expect(applyHelixPaperEvidenceEnrichmentV1({ sidecar: sidecar(), pages: [page], proposal: forged }))
      .toMatchObject({ ok: false, failure_code: "paper_evidence_enrichment_source_ref_invalid" });
  });

  it("requires inference labels and refuses exact-equation or auto-run elevation", () => {
    const inference = proposal();
    Object.assign(inference.equation_updates[0].symbol_bindings[0], {
      basis: "agent_inference",
      source_refs: [],
      inference_note: null,
    });
    expect(applyHelixPaperEvidenceEnrichmentV1({ sidecar: sidecar(), pages: [page], proposal: inference }))
      .toMatchObject({ ok: false, failure_code: "paper_evidence_enrichment_inference_note_required" });

    const exact = proposal();
    (exact.equation_updates[0] as Record<string, unknown>).exact_equation_authority_requested = true;
    expect(applyHelixPaperEvidenceEnrichmentV1({ sidecar: sidecar(), pages: [page], proposal: exact }))
      .toMatchObject({ ok: false, failure_code: "exact_equation_authority_requires_verified_image_lane" });

    const autoRun = proposal();
    (autoRun.equation_updates[0].calculator as Record<string, unknown>).auto_run_allowed = true;
    expect(applyHelixPaperEvidenceEnrichmentV1({ sidecar: sidecar(), pages: [page], proposal: autoRun }))
      .toMatchObject({ ok: false, failure_code: "paper_evidence_enrichment_auto_run_forbidden" });
  });

  it("treats replayed proposal ids as idempotent", () => {
    const first = applyHelixPaperEvidenceEnrichmentV1({ sidecar: sidecar(), pages: [page], proposal: proposal() });
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    const replay = applyHelixPaperEvidenceEnrichmentV1({ sidecar: first.sidecar, pages: [page], proposal: proposal() });
    expect(replay).toMatchObject({ ok: true, status: "idempotent", to_revision: 2 });

    const changed = proposal();
    changed.equation_updates[0].normalized_latex = "\\rho = 0";
    expect(applyHelixPaperEvidenceEnrichmentV1({ sidecar: first.sidecar, pages: [page], proposal: changed }))
      .toMatchObject({
        ok: false,
        failure_code: "paper_evidence_enrichment_proposal_invalid",
        missing_requirements: ["proposal_id_reused_with_different_content"],
      });

    expect(applyHelixPaperEvidenceEnrichmentV1({
      sidecar: first.sidecar,
      pages: [page],
      proposal: proposal({ document_id: "research:other" }),
    })).toMatchObject({ ok: false, failure_code: "paper_evidence_enrichment_identity_mismatch" });
  });
});

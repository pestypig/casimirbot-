import { describe, expect, it } from "vitest";
import { buildHelixPaperEvidenceSidecarV1 } from "../helix-paper-evidence-sidecar";

describe("paper evidence sidecar", () => {
  it("extracts conservative calculator-prefill and context candidates without granting authority", () => {
    const sidecar = buildHelixPaperEvidenceSidecarV1({
      document_id: "research:test-paper",
      source_integrity_hash: "hash:test-paper",
      paper_result_id: "arxiv:gr-qc/9510071",
      extraction_status: "full_text_usable",
      generated_at: "2026-07-16T00:00:00.000Z",
      pages: [{
        page: 4,
        text: [
          "We show that negative energy is constrained by a sampled inequality.",
          "rho >= -3/(32*pi^2*tau_0^4)",
          "However, the result requires a free scalar field and a specified sampling function.",
        ].join("\n"),
        text_char_count: 180,
        extraction_status: "text",
        source_text_ref: "artifact://ford-roman#page=4&text",
      }],
    });

    expect(sidecar).toMatchObject({
      schema: "helix.paper_evidence_sidecar.v1",
      sidecar_kind: "paper_evidence",
      status: "extracted_candidate",
      evidence_level: "full_text_machine_text",
      summary: {
        equation_candidate_count: 1,
        claim_candidate_count: 1,
        limitation_candidate_count: 1,
        calculator_prefill_ready_count: 1,
        calculator_binding_required_count: 1,
      },
      authority: {
        assistant_answer: false,
        terminal_eligible: false,
        validates_paper_claims: false,
        exact_equation_authority: false,
        theory_graph_promotion_allowed: false,
      },
    });
    expect(sidecar.equation_candidates[0]).toMatchObject({
      page: 4,
      source_text_ref: "artifact://ford-roman#page=4&text",
      calculator: {
        prefill_ready: true,
        binding_status: "needs_variable_binding",
        auto_run_allowed: false,
      },
      evidence: {
        exact_equation_authority: false,
        page_image_or_crop_ref: null,
      },
    });
    expect(sidecar.equation_candidates[0].latex_candidate).toContain("tau_0^4");
  });

  it("marks machine-text candidates as needing page-image evidence when PDF parsing is shallow", () => {
    const sidecar = buildHelixPaperEvidenceSidecarV1({
      document_id: "research:image-required",
      source_integrity_hash: "hash:image-required",
      extraction_status: "page_image_parse_required",
      pages: [{
        page: 1,
        text: "E = mc^2",
        text_char_count: 8,
        extraction_status: "text",
        source_text_ref: "artifact://image-required#page=1&text",
      }],
    });

    expect(sidecar.evidence_level).toBe("page_image_required");
    expect(sidecar.equation_candidates[0]?.evidence.level).toBe("page_image_required");
    expect(sidecar.authority.exact_equation_authority).toBe(false);
  });
});


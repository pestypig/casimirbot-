import { describe, expect, it } from "vitest";
import {
  buildScientificBranchGate,
  buildScientificEvidencePacket,
  buildScientificEvidenceGraphReflection,
  buildScientificImageEvidenceSidecar,
} from "../scientific-evidence-adaptor";
import type { ScientificBranchGateV1 } from "../scientific-evidence-adaptor";

describe("scientific evidence adaptor", () => {
  it("rejects page prose as an equation candidate when the requested region is equation-scoped", () => {
    const packet = buildScientificEvidencePacket({
      cropRegionId: "scholarly_pdf_page_2_equation_pass",
      sourceRefHash: "sha256:page-two-prose",
      sourceKind: "pdf_page_render",
      pageNumber: 2,
      bboxPx: { x: 0, y: 0, width: 1224, height: 1584 },
      sourceDimensionsPx: { width: 1224, height: 1584 },
      regionLabel: "scholarly_pdf_page_2_equation_pass",
      textCandidate:
        "The X-ray flares following short GRBs may indicate long activity of the central engine, but the mechanism remains unclear.",
      latexCandidate: null,
      uncertainty: [],
      extractionStatus: "partial",
    });

    expect(packet).toMatchObject({
      evidence_role: "context_only",
      exact_equation_admissibility: "inadmissible_for_exact_equation",
      admissibility: expect.objectContaining({ status: "inadmissible_for_exact_mapping" }),
      quality_flags: expect.arrayContaining([
        "no_ocr_or_latex_candidate",
        "non_equation_text_candidate",
      ]),
    });
  });

  it("keeps symbolic OCR from an equation-scoped page as a usable partial candidate", () => {
    const packet = buildScientificEvidencePacket({
      cropRegionId: "scholarly_pdf_page_3_equation_pass",
      sourceRefHash: "sha256:page-three-equation",
      sourceKind: "pdf_page_render",
      pageNumber: 3,
      bboxPx: { x: 0, y: 0, width: 1224, height: 1584 },
      sourceDimensionsPx: { width: 1224, height: 1584 },
      regionLabel: "scholarly_pdf_page_3_equation_pass",
      textCandidate: "L_0 = 10^49 B_{15}^2 P_{-3}^{-4} erg s^{-1}",
      latexCandidate: null,
      uncertainty: ["page-level OCR candidate"],
      extractionStatus: "partial",
    });

    expect(packet.quality_flags).not.toContain("no_ocr_or_latex_candidate");
    expect(packet.quality_flags).not.toContain("non_equation_text_candidate");
    expect(packet.exact_equation_admissibility).toBe("partial_candidate");
  });

  it("materializes a transient sidecar from Image Lens scientific packets", () => {
    const admissiblePacket = buildScientificEvidencePacket({
      cropRegionId: "image_lens_region:weyl",
      sourceRefHash: "sha256:weyl",
      sourceKind: "image_attachment",
      bboxPx: { x: 0, y: 70, width: 346, height: 65 },
      textCandidate: "Bianchi identities as field equations for the Weyl tensor.",
      latexCandidate: "\\nabla^\\mu \\psi_\\nu - D_\\nu S_\\phi = 0",
      uncertainty: ["candidate OCR"],
      extractionStatus: "extracted",
    });
    const failedPacket = buildScientificEvidencePacket({
      cropRegionId: "image_lens_region:failed",
      sourceRefHash: "sha256:failed",
      sourceKind: "image_attachment",
      bboxPx: { x: 0, y: 135, width: 346, height: 65 },
      textCandidate: null,
      latexCandidate: null,
      uncertainty: ["not readable"],
      extractionStatus: "failed",
    });

    const sidecar = buildScientificImageEvidenceSidecar({
      sidecarId: "sidecar:test",
      packets: [failedPacket, admissiblePacket],
    });

    expect(sidecar).toMatchObject({
      schema: "helix.scientific_image_evidence_sidecar.v1",
      sidecar_kind: "transient_scientific_image_evidence",
      sidecar_id: "sidecar:test",
      packet_count: 2,
      primary_domain: "weyl_bianchi",
      admissibility: expect.objectContaining({
        status: "unverified_math_observation",
        claim_boundary: "observation_only_not_proof",
      }),
      extraction_summary: expect.objectContaining({
        extracted_count: 1,
        failed_count: 1,
        admissible_count: 1,
        inadmissible_count: 1,
      }),
      exact_equation_summary: expect.objectContaining({
        promoted_row_count: 0,
        context_only_count: 2,
      }),
      memory_classification: expect.objectContaining({
        memory_kind: "transient_scientific_image_evidence",
        retrieval_tags: expect.arrayContaining(["scientific_image", "image_lens", "weyl_bianchi"]),
      }),
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
    expect(sidecar.compound_route_stages.map((stage) => stage.stage)).toEqual([
      "image_extraction",
      "scientific_evidence_sidecar",
      "theory_reflection",
      "calculator_payload_filter",
      "final_answer_guard",
    ]);
    expect(sidecar.primary_packet_ref).toContain("sha256:weyl#crop=0,70,346,65");
  });

  it("promotes only clean exact equation rows for graph and calculator handoff", () => {
    const exactRow = buildScientificEvidencePacket({
      cropRegionId: "equation_3.55",
      sourceRefHash: "sha256:exact-row",
      sourceKind: "image_attachment",
      bboxPx: { x: 0, y: 305, width: 346, height: 56 },
      requestedEquationLabel: "3.55",
      regionLabel: "equation_3.55",
      textCandidate: "Bianchi Weyl row \\nabla_\\mu \\psi_\\nu = 0 (3.55)",
      latexCandidate: "\\nabla_\\mu \\psi_\\nu = 0 \\tag{3.55}",
      uncertainty: [],
      extractionStatus: "extracted",
    });
    const sidecar = buildScientificImageEvidenceSidecar({
      sidecarId: "sidecar:exact-row",
      packets: [exactRow],
    });

    expect(exactRow).toMatchObject({
      exact_equation_admissibility: "admissible_for_exact_equation",
      exact_row_promotion: {
        status: "promoted",
        reasons: expect.arrayContaining(["requested_label_matched", "single_clean_row"]),
      },
      row_quality_diagnostics: expect.objectContaining({
        row_contains_requested_label: true,
        row_contains_multiple_equation_like_lines: false,
        needs_higher_resolution_source: false,
      }),
    });
    expect(sidecar).toMatchObject({
      admissibility: expect.objectContaining({ status: "admissible_observation" }),
      exact_equation_summary: expect.objectContaining({
        admissible_row_count: 1,
        promoted_row_count: 1,
      }),
    });
  });

  it("recognizes plain integer equation labels in exact row OCR", () => {
    const exactRow = buildScientificEvidencePacket({
      cropRegionId: "equation_7",
      sourceRefHash: "sha256:equation-7",
      sourceKind: "pdf_page_render",
      pageNumber: 5,
      bboxPx: { x: 73, y: 570, width: 1077, height: 87 },
      sourceDimensionsPx: { width: 1224, height: 1584 },
      requestedEquationLabel: "7",
      regionLabel: "equation_7",
      textCandidate: "S = \\int d^4x \\sqrt{-g} e^{-\\phi} \\{ R + 2\\Lambda e^{-\\phi} + \\kappa e^{-\\phi} L_m \\}, \\ (7)",
      latexCandidate: "S = \\int d^4x \\sqrt{-g} e^{-\\phi} \\{ R + 2\\Lambda e^{-\\phi} + \\kappa e^{-\\phi} L_m \\}, \\ (7)",
      uncertainty: [],
      extractionStatus: "extracted",
    });

    expect(exactRow).toMatchObject({
      requested_equation_label: "7",
      observed_equation_labels: expect.arrayContaining(["7"]),
      label_match_status: "matched",
      exact_equation_admissibility: "admissible_for_exact_equation",
      exact_row_promotion: {
        status: "promoted",
        reasons: expect.arrayContaining(["requested_label_matched", "single_clean_row"]),
      },
    });
  });

  it("promotes a complete labeled multi-line equation block without pretending it is one row", () => {
    const exactBlock = buildScientificEvidencePacket({
      cropRegionId: "equation_47_block",
      sourceRefHash: "sha256:equation-47-block",
      sourceKind: "pdf_page_render",
      pageNumber: 8,
      bboxPx: { x: 80, y: 120, width: 1060, height: 300 },
      sourceDimensionsPx: { width: 1224, height: 1584 },
      requestedEquationLabel: "47",
      regionLabel: "equation_47_block",
      equationCaptureMode: "exact_block",
      textCandidate: [
        "max_R Tr[-R_xs^H R_x^-1 R_xs + R_s]",
        "s.t.",
        "Tr[R + Rhat - 2(Rhat^1/2 R Rhat^1/2)^1/2] <= epsilon_0^2 (47)",
        "R >= 0, R_x > 0.",
      ].join("\n"),
      latexCandidate: [
        "\\begin{aligned}",
        "\\max_R\\quad &\\operatorname{Tr}[-R_{xs}^{H}R_x^{-1}R_{xs}+R_s]\\\\",
        "\\text{s.t.}\\quad &\\operatorname{Tr}[R+\\hat R-2(\\hat R^{1/2}R\\hat R^{1/2})^{1/2}]\\le\\epsilon_0^2 \\tag{47}\\\\",
        "&R\\succeq0,\\quad R_x>0.",
        "\\end{aligned}",
      ].join("\n"),
      visualLayoutCandidate: {
        displayed_line_count: 6,
        displayed_lines: [
          "max_R",
          "Tr[-R_xs^H R_x^-1 R_xs + R_s]",
          "s.t.",
          "Wasserstein trace constraint",
          "R >= 0",
          "R_x > 0 (47)",
        ],
        horizontal_alignment: "aligned_at_relation",
        structure: "aligned_block",
        equation_bbox_px: { x: 20, y: 18, width: 1010, height: 250 },
        notes: [],
      },
      uncertainty: [],
      extractionStatus: "extracted",
    });
    const sidecar = buildScientificImageEvidenceSidecar({
      sidecarId: "sidecar:equation-47-block",
      packets: [exactBlock],
    });

    expect(exactBlock).toMatchObject({
      equation_capture_mode: "exact_block",
      exact_equation_admissibility: "admissible_for_exact_equation",
      exact_row_promotion: {
        status: "not_applicable",
        reasons: ["multi_line_exact_equation_block_uses_block_promotion"],
      },
      block_quality_diagnostics: expect.objectContaining({
        displayed_line_count: 6,
        displayed_lines_complete: true,
        visual_structure: "aligned_block",
        equation_bbox_present: true,
        requested_label_present: true,
        neighboring_equation_label_count: 0,
        complete_block_candidate: true,
      }),
      exact_block_promotion: {
        status: "promoted",
        reasons: expect.arrayContaining([
          "requested_label_matched",
          "complete_multi_line_equation_block",
          "displayed_lines_complete",
        ]),
      },
    });
    expect(sidecar).toMatchObject({
      evidence_depth: "exact_block_promoted",
      active_promoted_row: null,
      active_promoted_block: expect.objectContaining({
        crop_region_id: "equation_47_block",
        evidence_depth: "exact_block_promoted",
      }),
      exact_equation_summary: expect.objectContaining({
        promoted_row_count: 0,
        promoted_block_count: 1,
        admissible_block_count: 1,
        partial_block_count: 0,
        rejected_block_count: 0,
      }),
    });
    expect(sidecar.promoted_equation_ref).toContain("sha256:equation-47-block#crop=80,120,1060,300");
  });

  it("does not promote an equation block when neighboring labels or layout fields make it ambiguous", () => {
    const ambiguousBlock = buildScientificEvidencePacket({
      cropRegionId: "equation_47_48_block",
      sourceRefHash: "sha256:equation-47-48-block",
      sourceKind: "pdf_page_render",
      pageNumber: 8,
      bboxPx: { x: 80, y: 120, width: 1060, height: 520 },
      sourceDimensionsPx: { width: 1224, height: 1584 },
      requestedEquationLabel: "47",
      regionLabel: "equation_47_block",
      equationCaptureMode: "exact_block",
      textCandidate: "objective and constraints (47)\nfollowing reformulation (48)",
      latexCandidate: "\\max_R f(R) \\tag{47}\n\\min_V g(V) \\tag{48}",
      visualLayoutCandidate: {
        displayed_line_count: 6,
        displayed_lines: [],
        horizontal_alignment: "left",
        structure: "multi_line",
        equation_bbox_px: null,
        notes: [],
      },
      uncertainty: [],
      extractionStatus: "extracted",
    });

    expect(ambiguousBlock).toMatchObject({
      equation_capture_mode: "exact_block",
      label_match_status: "ambiguous",
      exact_equation_admissibility: "inadmissible_for_exact_equation",
      exact_row_promotion: expect.objectContaining({ status: "not_applicable" }),
      exact_block_promotion: expect.objectContaining({
        status: "rejected",
        reasons: expect.arrayContaining([
          "label_match_status:ambiguous",
          "displayed_lines_incomplete",
          "equation_bbox_missing",
          "neighboring_equation_label_observed",
        ]),
      }),
      block_quality_diagnostics: expect.objectContaining({
        displayed_lines_complete: false,
        equation_bbox_present: false,
        neighboring_equation_label_count: 1,
        complete_block_candidate: false,
      }),
    });
  });

  it("treats label-only equation crops as locators instead of selected equation evidence", () => {
    const labelOnly = buildScientificEvidencePacket({
      cropRegionId: "image_lens_region:label-only-7",
      sourceRefHash: "sha256:label-only",
      sourceKind: "pdf_page_render",
      pageNumber: 5,
      bboxPx: { x: 866, y: 567, width: 266, height: 36 },
      sourceDimensionsPx: { width: 1224, height: 1584 },
      requestedEquationLabel: "7",
      regionLabel: "equation_7",
      textCandidate: "(7)",
      latexCandidate: "(7)",
      uncertainty: [],
      extractionStatus: "extracted",
    });
    const fullRowPartial = buildScientificEvidencePacket({
      cropRegionId: "image_lens_region:full-row-partial-7",
      sourceRefHash: "sha256:full-row-partial",
      sourceKind: "pdf_page_render",
      pageNumber: 5,
      bboxPx: { x: 73, y: 570, width: 1077, height: 87 },
      sourceDimensionsPx: { width: 1224, height: 1584 },
      requestedEquationLabel: "7",
      regionLabel: "equation_7",
      textCandidate: "S = \\int d^4x \\sqrt{-g} e^{-\\phi} \\{ R + 2\\Lambda e^{-\\phi} + \\kappa e^{-\\phi} L_m \\}, \\ (7)",
      latexCandidate: "S = \\int d^4x \\sqrt{-g} e^{-\\phi} \\{ R + 2\\Lambda e^{-\\phi} + \\kappa e^{-\\phi} L_m \\}, \\ (7)",
      uncertainty: ["partial OCR"],
      extractionStatus: "partial",
    });

    const sidecar = buildScientificImageEvidenceSidecar({
      sidecarId: "sidecar:label-locator",
      packets: [labelOnly, fullRowPartial],
    });
    const labelOnlySidecar = buildScientificImageEvidenceSidecar({
      sidecarId: "sidecar:label-only",
      packets: [labelOnly],
    });

    expect(labelOnly).toMatchObject({
      quality_flags: expect.arrayContaining(["label_only_equation_locator"]),
      exact_equation_admissibility: "inadmissible_for_exact_equation",
      exact_row_promotion: expect.objectContaining({
        status: "rejected",
        reasons: expect.arrayContaining(["label_only_equation_locator"]),
      }),
    });
    expect(sidecar.selected_evidence_object).toMatchObject({
      crop_region_id: "image_lens_region:full-row-partial-7",
      evidence_depth: "exact_row_partial",
      latex_candidate: expect.stringContaining("S = \\int d^4x"),
    });
    expect(sidecar.selected_evidence_object?.latex_candidate).not.toBe("(7)");
    expect(sidecar.historical_blockers).toEqual(expect.arrayContaining(["label_only_equation_locator"]));
    expect(labelOnlySidecar.selected_evidence_object).toBeNull();
    expect(labelOnlySidecar.promoted_equation_ref).toBeNull();
    expect(labelOnlySidecar.exact_equation_summary).toMatchObject({
      promoted_row_count: 0,
      admissible_row_count: 0,
      rejected_row_count: 1,
    });
  });

  it("treats bundled multi-equation page candidates as scouting evidence, not exact rows", () => {
    const bundledPageCandidate = buildScientificEvidencePacket({
      cropRegionId: "scholarly_pdf_page_5_equation_pass",
      sourceRefHash: "sha256:page-5",
      sourceKind: "pdf_page_render",
      pageNumber: 5,
      bboxPx: { x: 0, y: 0, width: 1224, height: 1584 },
      sourceDimensionsPx: { width: 1224, height: 1584 },
      requestedEquationLabel: "7",
      regionLabel: "equation_7",
      textCandidate: [
        "S = \\int d^4x \\sqrt{-g} e^{-\\phi} \\{ R + 2\\Lambda e^{-\\phi} + \\kappa e^{-\\phi} L_m \\}, (7)",
        "S_n = \\int d^nx \\sqrt{-g} e^{(1 - n/2)\\phi} \\{ R + 2\\Lambda e^{-\\phi} + \\kappa e^{-\\phi} L_m \\}, (8)",
        "\\Delta \\tau = \\int_a^b e^{\\phi/2} (g_{\\mu\\nu} dx^\\mu/d\\lambda dx^\\nu/d\\lambda)^{1/2} d\\lambda, (9)",
      ].join("\n"),
      latexCandidate: [
        "S = \\int d^4x \\sqrt{-g} e^{-\\phi} \\{ R + 2\\Lambda e^{-\\phi} + \\kappa e^{-\\phi} L_m \\}, \\quad (7)",
        "S_n = \\int d^nx \\sqrt{-g} e^{(1 - n/2)\\phi} \\{ R + 2\\Lambda e^{-\\phi} + \\kappa e^{-\\phi} L_m \\}, \\quad (8)",
        "\\Delta \\tau = \\int_a^b e^{\\phi/2} \\left(g_{\\mu\\nu} \\frac{dx^\\mu}{d\\lambda} \\frac{dx^\\nu}{d\\lambda}\\right)^{1/2} d\\lambda, \\quad (9)",
      ].join("\n"),
      uncertainty: ["page-level OCR candidate list"],
      extractionStatus: "partial",
    });
    const sidecar = buildScientificImageEvidenceSidecar({
      sidecarId: "sidecar:multi-equation-page-candidate",
      packets: [bundledPageCandidate],
    });

    expect(bundledPageCandidate).toMatchObject({
      observed_equation_labels: expect.arrayContaining(["7", "8", "9"]),
      label_match_status: "ambiguous",
      quality_flags: expect.arrayContaining([
        "candidate_contains_multiple_display_equations",
        "row_crop_contains_multiple_equation_lines",
      ]),
      exact_equation_admissibility: "inadmissible_for_exact_equation",
      exact_row_promotion: expect.objectContaining({
        status: "rejected",
        reasons: expect.arrayContaining(["candidate_contains_multiple_display_equations"]),
      }),
    });
    expect(sidecar.selected_evidence_object).toBeNull();
    expect(sidecar.promoted_equation_ref).toBeNull();
    expect(sidecar.historical_blockers).toEqual(expect.arrayContaining([
      "candidate_contains_multiple_display_equations",
    ]));
  });

  it("projects promoted rows as stable structured evidence objects", () => {
    const exactLatex = "S = \\int d^4x \\sqrt{-g} e^{-\\phi} \\{ R + 2\\Lambda e^{-\\phi} + \\kappa e^{-\\phi} L_m \\}, \\, (7)";
    const exactRow = buildScientificEvidencePacket({
      cropRegionId: "equation_7",
      sourceRefHash: "sha256:crop-row",
      sourceImageRefHash: "sha256:page-source",
      sourceKind: "pdf_page_render",
      pageNumber: 5,
      bboxPx: { x: 73, y: 570, width: 1077, height: 87 },
      sourceDimensionsPx: { width: 1224, height: 1584 },
      requestedEquationLabel: "7",
      regionLabel: "equation_7",
      textCandidate: exactLatex,
      latexCandidate: exactLatex,
      uncertainty: [],
      extractionStatus: "extracted",
    });
    const partialRow = buildScientificEvidencePacket({
      cropRegionId: "equation_7_partial",
      sourceRefHash: "sha256:page-full",
      sourceKind: "pdf_page_render",
      pageNumber: 5,
      bboxPx: { x: 73, y: 570, width: 1077, height: 87 },
      requestedEquationLabel: "7",
      regionLabel: "equation_7",
      textCandidate: `${exactLatex} where R denotes surrounding page explanation`,
      latexCandidate: null,
      uncertainty: ["context crop"],
      extractionStatus: "partial",
    });

    const sidecar = buildScientificImageEvidenceSidecar({
      sidecarId: "sidecar:stable-row",
      packets: [partialRow, exactRow],
    });

    expect(sidecar.evidence_depth).toBe("exact_row_promoted");
    expect(sidecar.promoted_equation_latex).toBe(exactLatex);
    expect(sidecar.active_blockers).toEqual([]);
    expect(sidecar.historical_blockers).toEqual(expect.arrayContaining(["partial_extraction_status"]));
    expect(sidecar.active_promoted_row).toMatchObject({
      schema: "helix.promoted_scientific_image_evidence.v1",
      sidecar_id: "sidecar:stable-row",
      source_kind: "pdf_page_render",
      source_hash: "sha256:page-source",
      page_number: 5,
      crop_ref: "sha256:crop-row#crop=73,570,1077,87",
      latex_candidate: exactLatex,
      requested_label: "7",
      observed_label: "7",
      evidence_depth: "exact_row_promoted",
      claim_boundary: "observation_only_not_proof",
      raw_content_included: false,
    });
    expect(sidecar.selected_evidence_object?.latex_candidate).not.toContain("where R denotes");
  });

  it("keeps missing-label and tiny-source exact rows out of exact promotion", () => {
    const missingLabel = buildScientificEvidencePacket({
      cropRegionId: "equation_3.52",
      sourceRefHash: "sha256:missing-label",
      sourceKind: "image_attachment",
      bboxPx: { x: 0, y: 128, width: 346, height: 59 },
      requestedEquationLabel: "3.52",
      regionLabel: "equation_3.52",
      textCandidate: "3(\\delta \\phi_1 - \\delta \\phi_2) = 0",
      latexCandidate: "3(\\delta \\phi_1 - \\delta \\phi_2) = 0",
      uncertainty: [],
      extractionStatus: "extracted",
    });
    const tinySource = buildScientificEvidencePacket({
      cropRegionId: "equation_3.53",
      sourceRefHash: "sha256:tiny-source",
      sourceKind: "image_attachment",
      bboxPx: { x: 0, y: 10, width: 90, height: 28 },
      sourceDimensionsPx: { width: 96, height: 96 },
      requestedEquationLabel: "3.53",
      regionLabel: "equation_3.53",
      textCandidate: "Bianchi row \\nabla_\\mu \\psi_\\nu = 0 (3.53)",
      latexCandidate: "\\nabla_\\mu \\psi_\\nu = 0 \\tag{3.53}",
      uncertainty: [],
      extractionStatus: "extracted",
    });

    expect(missingLabel).toMatchObject({
      label_match_status: "missing_observed_label",
      exact_row_promotion: expect.objectContaining({
        status: "partial",
        reasons: expect.arrayContaining(["label_match_status:missing_observed_label"]),
      }),
      row_quality_diagnostics: expect.objectContaining({
        row_contains_requested_label: false,
        label_mismatch_reason: "requested_label_not_observed",
      }),
    });
    expect(tinySource).toMatchObject({
      exact_equation_admissibility: "partial_candidate",
      exact_row_promotion: expect.objectContaining({
        status: "partial",
        reasons: expect.arrayContaining(["source_image_resolution_low_for_exact_math_ocr"]),
      }),
      row_quality_diagnostics: expect.objectContaining({
        source_dimensions_px: { width: 96, height: 96 },
        needs_higher_resolution_source: true,
        source_quality_flags: expect.arrayContaining(["source_image_resolution_low_for_exact_math_ocr"]),
      }),
    });
  });

  it("blocks sidecar consumers when all image evidence is failed or missing", () => {
    const packet = buildScientificEvidencePacket({
      cropRegionId: "image_lens_region:failed",
      sourceRefHash: "sha256:failed",
      sourceKind: "image_attachment",
      bboxPx: { x: 0, y: 0, width: 346, height: 72 },
      textCandidate: null,
      latexCandidate: null,
      uncertainty: ["no extraction payload"],
      extractionStatus: "failed",
    });

    const sidecar = buildScientificImageEvidenceSidecar({
      sidecarId: "sidecar:failed",
      packets: [packet],
    });

    expect(sidecar.admissibility.status).toBe("inadmissible_for_exact_mapping");
    expect(sidecar.compound_route_stages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ stage: "theory_reflection", status: "blocked" }),
        expect.objectContaining({ stage: "calculator_payload_filter", status: "blocked" }),
      ]),
    );
  });

  it("restricts low-confidence symbol-only image evidence from graph and calculator handoff", () => {
    const packet = buildScientificEvidencePacket({
      cropRegionId: "image_lens_region:low-confidence",
      sourceRefHash: "sha256:low-confidence",
      sourceKind: "image_attachment",
      bboxPx: { x: 12, y: 88, width: 120, height: 30 },
      textCandidate: null,
      latexCandidate: "\\nabla",
      uncertainty: ["symbol-only crop; no equation body recovered"],
      extractionStatus: "partial",
    });

    const sidecar = buildScientificImageEvidenceSidecar({
      sidecarId: "sidecar:low-confidence",
      packets: [packet],
    });

    expect(packet).toMatchObject({
      confidence: 0.47,
      admissibility: expect.objectContaining({
        status: "unverified_math_observation",
        congruence_grade_floor: "insufficient_evidence",
      }),
      row_quality_diagnostics: expect.objectContaining({
        needs_higher_resolution_source: false,
        source_quality_flags: [],
      }),
    });
    expect(sidecar).toMatchObject({
      admissibility: expect.objectContaining({
        status: "unverified_math_observation",
      }),
      exact_equation_summary: expect.objectContaining({
        promoted_row_count: 0,
      }),
      extraction_summary: expect.objectContaining({
        unverified_count: 1,
        admissible_count: 0,
      }),
    });
    expect(sidecar.compound_route_stages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ stage: "scientific_evidence_sidecar", status: "restricted" }),
        expect.objectContaining({ stage: "theory_reflection", status: "blocked" }),
        expect.objectContaining({ stage: "calculator_payload_filter", status: "blocked" }),
      ]),
    );
  });

  it("builds metadata-level scientific graph reflections with upgrade affordances", () => {
    const branchGate = buildScientificBranchGate({
      evidence: null,
      prompt: "Reflect this paper metadata to the Theory Badge Graph.",
      mentionedDomains: ["casimir cavity"],
      badgeIds: ["nhm2.profile.campaign_search"],
      calculatorPayloads: [],
    });
    const reflection = buildScientificEvidenceGraphReflection({
      turnId: "turn:test:metadata-reflection",
      evidence: null,
      sidecar: null,
      branchGate,
      reflectedBadgeIds: ["nhm2.profile.campaign_search"],
      provenanceRefs: ["scholarly-metadata:test"],
    });

    expect(reflection).toMatchObject({
      schema: "helix.scientific_evidence_graph_reflection.v1",
      evidence_depth: "metadata_lookup",
      evidence_object_class: "metadata_record",
      graph_attachments: expect.arrayContaining([
        expect.objectContaining({
          node_id: "nhm2.profile.campaign_search",
          claim_boundary: "diagnostic_only",
        }),
      ]),
      blocked_authorities: expect.arrayContaining([
        expect.objectContaining({ authority: "proof" }),
        expect.objectContaining({ authority: "physical_validation" }),
        expect.objectContaining({ authority: "calculator_payload" }),
      ]),
      upgrade_requirements: expect.arrayContaining([
        "Materialize abstract/snippet or full-text evidence before scientific claims.",
      ]),
      next_tool_affordances: expect.arrayContaining([
        expect.objectContaining({ capability: "scholarly-research.fetch_full_text" }),
      ]),
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
  });

  it("builds abstract/snippet scientific graph reflections without proof authority", () => {
    const packet = buildScientificEvidencePacket({
      cropRegionId: "theory_reflection_prompt_context",
      sourceRefHash: "theory_reflection_prompt_context",
      sourceKind: "prompt_context",
      bboxPx: { x: 0, y: 0, width: 1, height: 1 },
      textCandidate: "Abstract: scalar field Casimir energy with Robin boundary conditions on plates.",
      latexCandidate: null,
      uncertainty: ["Provider abstract/snippet, not a page-grounded OCR row."],
      extractionStatus: "partial",
    });
    const branchGate = buildScientificBranchGate({
      evidence: packet,
      prompt: "Reflect this abstract to the Theory Badge Graph.",
      mentionedDomains: ["casimir cavity"],
      badgeIds: ["nhm2.experimental.layer_stack_support_fraction_sweep"],
      calculatorPayloads: [],
      requireAdmissibleEvidence: false,
    });
    const reflection = buildScientificEvidenceGraphReflection({
      turnId: "turn:test:abstract-reflection",
      evidence: packet,
      sidecar: null,
      branchGate,
      reflectedBadgeIds: ["nhm2.experimental.layer_stack_support_fraction_sweep"],
      provenanceRefs: ["scholarly-abstract:test"],
    });

    expect(reflection).toMatchObject({
      evidence_depth: "abstract_or_snippet",
      evidence_object_class: "provider_abstract_or_snippet",
      claim_boundary: expect.objectContaining({
        diagnostic_only: true,
        observation_not_proof: true,
      }),
      upgrade_requirements: expect.arrayContaining([
        "Fetch full text or render PDF pages for page-grounded evidence.",
      ]),
      next_tool_affordances: expect.arrayContaining([
        expect.objectContaining({ capability: "scholarly-research.fetch_full_text" }),
      ]),
      blocked_authorities: expect.arrayContaining([
        expect.objectContaining({ authority: "proof" }),
        expect.objectContaining({ authority: "badge_promotion" }),
      ]),
    });
  });

  it("classifies multiple promoted exact rows as a derivation candidate", () => {
    const actionRow = buildScientificEvidencePacket({
      cropRegionId: "equation_row_action",
      sourceRefHash: "sha256:multi-equation-paper",
      sourceKind: "pdf_page_render",
      bboxPx: { x: 73, y: 697, width: 1078, height: 87 },
      regionLabel: "equation_row_action",
      textCandidate: "S[phi, g] = -1/2 int_M d^D x sqrt(-g) phi [square + xi R] phi",
      latexCandidate: "S[\\varphi, g] = - \\frac{1}{2} \\int_{M} d^D x \\sqrt{-g} \\varphi [ \\square + \\xi R] \\varphi",
      uncertainty: [],
      extractionStatus: "extracted",
    });
    const stressRow = buildScientificEvidencePacket({
      cropRegionId: "equation_row_stress",
      sourceRefHash: "sha256:multi-equation-paper",
      sourceKind: "pdf_page_render",
      bboxPx: { x: 80, y: 812, width: 1020, height: 82 },
      regionLabel: "equation_row_stress",
      textCandidate: "T_mn = 2 / sqrt(-g) delta S / delta g^mn",
      latexCandidate: "T_{\\mu\\nu} = \\frac{2}{\\sqrt{-g}} \\frac{\\delta S}{\\delta g^{\\mu\\nu}}",
      uncertainty: [],
      extractionStatus: "extracted",
    });
    const sidecar = buildScientificImageEvidenceSidecar({
      sidecarId: "sidecar:multi-equation",
      packets: [actionRow, stressRow],
    });
    const branchGate = buildScientificBranchGate({
      evidence: actionRow,
      sidecar,
      prompt: "Reflect these page-grounded equations to the Theory Badge Graph.",
      mentionedDomains: ["weyl curvature", "general relativity"],
      badgeIds: ["nhm2.experimental.layer_stack_support_fraction_sweep"],
      calculatorPayloads: [],
      requireAdmissibleEvidence: false,
    });
    const reflection = buildScientificEvidenceGraphReflection({
      turnId: "turn:test:multi-equation-reflection",
      evidence: actionRow,
      sidecar,
      branchGate,
      reflectedBadgeIds: ["nhm2.experimental.layer_stack_support_fraction_sweep"],
      provenanceRefs: ["paper:page=2"],
    });

    expect(reflection).toMatchObject({
      evidence_depth: "multi_equation_derivation_candidate",
      evidence_object_class: "curved_spacetime_field_action",
      claim_boundary: expect.objectContaining({
        diagnostic_only: true,
        no_physical_validation: true,
        no_badge_promotion: true,
      }),
      blocked_authorities: expect.arrayContaining([
        expect.objectContaining({ authority: "proof" }),
        expect.objectContaining({ authority: "physical_validation" }),
        expect.objectContaining({ authority: "badge_promotion" }),
        expect.objectContaining({ authority: "calculator_payload" }),
      ]),
      normalized_scientific_features: expect.objectContaining({
        operators: expect.arrayContaining(["dAlembertian_or_wave_operator", "spacetime_volume_integral"]),
        fields: expect.arrayContaining(["scalar_field_phi", "metric_field_g"]),
        geometry_terms: expect.arrayContaining(["metric_determinant", "ricci_scalar_R"]),
      }),
      provenance_refs: expect.arrayContaining(["sidecar:multi-equation"]),
    });
  });

  it("classifies admitted bound calculator payloads without granting proof authority", () => {
    const pressureRow = buildScientificEvidencePacket({
      cropRegionId: "equation_row_pressure",
      sourceRefHash: "sha256:calculator-candidate",
      sourceKind: "pdf_page_render",
      bboxPx: { x: 64, y: 540, width: 1040, height: 76 },
      regionLabel: "equation_row_pressure",
      textCandidate: "Casimir pressure for parallel plates: P = - pi^2 hbar c / (240 a^4)",
      latexCandidate: "P = -\\frac{\\pi^2 \\hbar c}{240 a^4}",
      uncertainty: [],
      extractionStatus: "extracted",
    });
    const branchGate: ScientificBranchGateV1 = {
      schema: "helix.scientific_branch_gate.v1",
      status: "admitted",
      primary_domain: "casimir_cavity",
      allowed_branch_hints: ["casimir", "cavity", "vacuum_energy"],
      blocked_branch_hints: [],
      congruence_grade_floor: "domain_context_match",
      rejected_badge_ids: [],
      rejected_calculator_payload_ids: [],
      congruence_assessments: [{
        target_ref: "casimir_pressure_payload",
        target_kind: "calculator_payload",
        grade: "domain_context_match",
        reasons: ["Calculator payload matches the admitted Casimir cavity branch."],
        matched_symbols: ["P", "a"],
        blocked_by_branch_hint: false,
      }],
      notes: ["Scientific branch gate admitted the Casimir cavity calculator branch."],
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    };
    const reflection = buildScientificEvidenceGraphReflection({
      turnId: "turn:test:calculator-candidate-reflection",
      evidence: pressureRow,
      sidecar: null,
      branchGate,
      reflectedBadgeIds: [],
      calculatorPayloads: [{
        payload_id: "casimir_pressure_payload",
        expression: "P = -pi^2*hbar*c/(240*a^4)",
      }],
      provenanceRefs: ["scientific-calculator:preflight"],
    });

    expect(reflection).toMatchObject({
      evidence_depth: "calculator_template_candidate",
      evidence_object_class: "calculator_template_candidate",
      graph_attachments: [
        expect.objectContaining({
          node_id: "casimir_pressure_payload",
          node_kind: "calculator_payload",
          attachment_strength: "moderate",
          claim_boundary: "diagnostic_only",
        }),
      ],
      claim_boundary: expect.objectContaining({
        diagnostic_only: true,
        observation_not_proof: true,
        no_badge_promotion: true,
      }),
      blocked_authorities: expect.arrayContaining([
        expect.objectContaining({ authority: "proof" }),
        expect.objectContaining({ authority: "physical_validation" }),
        expect.objectContaining({ authority: "badge_promotion" }),
      ]),
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(reflection.blocked_authorities).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ authority: "calculator_payload" })]),
    );
    expect(reflection.next_tool_affordances).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ capability: "scientific-calculator.bind_variables" })]),
    );
  });

  it("keeps proof and physical-validation authority blocked for hard-boundary reflection prompts", () => {
    const exactRow = buildScientificEvidencePacket({
      cropRegionId: "equation_row_validation_request",
      sourceRefHash: "sha256:validation-boundary",
      sourceKind: "pdf_page_render",
      bboxPx: { x: 84, y: 620, width: 980, height: 80 },
      regionLabel: "equation_row_validation_request",
      textCandidate: "Casimir pressure for parallel plates: P = - pi^2 hbar c / (240 a^4)",
      latexCandidate: "P = -\\frac{\\pi^2 \\hbar c}{240 a^4}",
      uncertainty: [],
      extractionStatus: "extracted",
    });
    const branchGate = buildScientificBranchGate({
      evidence: exactRow,
      prompt: "Use this extracted paper equation to prove and physically validate the theory badge.",
      mentionedDomains: ["casimir cavity"],
      badgeIds: ["nhm2.experimental.full_apparatus_receipt_loop"],
      calculatorPayloads: [],
      requireAdmissibleEvidence: false,
    });
    const reflection = buildScientificEvidenceGraphReflection({
      turnId: "turn:test:hard-boundary-reflection",
      evidence: exactRow,
      sidecar: null,
      branchGate,
      reflectedBadgeIds: ["nhm2.experimental.full_apparatus_receipt_loop"],
      provenanceRefs: ["paper:page=3#equation-row"],
    });

    expect(reflection).toMatchObject({
      evidence_depth: "promoted_exact_equation_row",
      claim_boundary: {
        diagnostic_only: true,
        observation_not_proof: true,
        no_physical_validation: true,
        no_badge_promotion: true,
        no_calculator_authority_without_bound_payload: true,
      },
      blocked_authorities: expect.arrayContaining([
        expect.objectContaining({ authority: "proof" }),
        expect.objectContaining({ authority: "physical_validation" }),
        expect.objectContaining({ authority: "badge_promotion" }),
      ]),
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(reflection.graph_attachments.every((attachment) => attachment.claim_boundary === "diagnostic_only")).toBe(true);
  });
});

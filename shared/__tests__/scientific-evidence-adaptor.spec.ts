import { describe, expect, it } from "vitest";
import {
  buildScientificEvidencePacket,
  buildScientificImageEvidenceSidecar,
} from "../scientific-evidence-adaptor";

describe("scientific evidence adaptor", () => {
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
});

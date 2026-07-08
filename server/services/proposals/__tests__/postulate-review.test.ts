import { describe, expect, it } from "vitest";
import {
  buildPostulateReviewFinalText,
  buildPostulateSubmissionTextAndEvidence,
  evaluatePostulateSubmissionGate,
  extractPostulateEvidenceContextFromRuntimePayload,
  parseAskPostulateReviewRequest,
  parsePostulateReadinessReview,
} from "../postulate-review";

const evidenceContext = {
  evidenceSidecarRefs: ["scientific_image_sidecar:paper-page-2"],
  promotedEquationRowRefs: ["promoted_equation_row:eq-2.1"],
  pageRenderRefs: ["page_render:paper:2"],
  cropRefs: ["equation_crop:eq-2.1-row"],
  graphReflectionRefs: ["graph_reflection:theory-badge-graph:/warp/qei/residual"],
  provenanceAuditRefs: ["provenance_audit:paper-page-2"],
  calculatorCheckRefs: ["calculator_check:dimensional:eq-2.1"],
  uncertaintyReductionRefs: ["uncertainty_reduction:qei-residual"],
};

const submitReviewJson = JSON.stringify({
  schema: "helix.postulate_readiness_review.v1",
  readinessRating: 91,
  decision: "submit",
  reason: "The candidate is constructive and has page-grounded evidence with diagnostic graph reflection.",
  missingDefinitions: [],
  missingEvidence: [],
  claimBoundaryWarnings: ["accepted for structured review only"],
  calculatorStatus: "bound_but_unsolved",
  boardReadyTitle: "Warp/QEI residual review target",
  boardReadyDraft:
    "A warp/QEI residual may be accepted for structured review when the cited row, crop, page, and graph reflection all point to the same residual constraint; this is not proof or certification.",
});

describe("postulate runtime review gate", () => {
  it("parses /postulate review requests with structured evidence refs", () => {
    const request = parseAskPostulateReviewRequest([
      "/postulate",
      "Review this postulate candidate.",
      "Evidence context:",
      JSON.stringify(evidenceContext),
      "Candidate postulate:",
      "A candidate that references scientific_image_sidecar:paper-page-2 and promoted_equation_row:eq-2.1.",
      "Originating session: turn-1",
      "Originating answer: answer-1",
    ].join("\n"));

    expect(request?.originatingSessionId).toBe("turn-1");
    expect(request?.originatingAnswerId).toBe("answer-1");
    expect(request?.evidenceContext.evidenceSidecarRefs).toContain("scientific_image_sidecar:paper-page-2");
    expect(request?.evidenceContext.promotedEquationRowRefs).toContain("promoted_equation_row:eq-2.1");
  });

  it("allows a high-rating submit decision only when required evidence refs are present", () => {
    const review = parsePostulateReadinessReview(submitReviewJson);
    const gate = evaluatePostulateSubmissionGate({
      review,
      evidenceContext,
      proposalText: review?.boardReadyDraft,
    });

    expect(review?.readinessRating).toBe(91);
    expect(review?.decision).toBe("submit");
    expect(gate.shouldSubmit).toBe(true);
    expect(gate.reasons).toEqual([]);
  });

  it("blocks low-rating runtime reviews without submitting", () => {
    const review = parsePostulateReadinessReview(JSON.stringify({
      ...JSON.parse(submitReviewJson),
      readinessRating: 58,
      decision: "revise",
      missingEvidence: ["Need exact row promotion"],
    }));
    const gate = evaluatePostulateSubmissionGate({ review, evidenceContext });

    expect(gate.shouldSubmit).toBe(false);
    expect(gate.reasons).toContain("decision_revise");
    expect(gate.reasons).toContain("rating_below_75");
  });

  it("blocks otherwise strong reviews when sidecar-backed evidence is missing", () => {
    const review = parsePostulateReadinessReview(submitReviewJson);
    const gate = evaluatePostulateSubmissionGate({
      review,
      evidenceContext: {
        ...evidenceContext,
        evidenceSidecarRefs: [],
      },
    });

    expect(gate.shouldSubmit).toBe(false);
    expect(gate.reasons).toContain("scientific_sidecar_ref_missing");
  });

  it("blocks proof or graph-promotion claims even with a high rating", () => {
    const review = parsePostulateReadinessReview(JSON.stringify({
      ...JSON.parse(submitReviewJson),
      boardReadyDraft: "The badge graph has been promoted and the residual is proven.",
    }));
    const gate = evaluatePostulateSubmissionGate({
      review,
      evidenceContext,
      proposalText: review?.boardReadyDraft,
    });

    expect(gate.shouldSubmit).toBe(false);
    expect(gate.reasons).toContain("unsupported_proof_or_graph_promotion_claim");
  });

  it("builds a no-submit final answer without claiming a receipt", () => {
    const review = parsePostulateReadinessReview(JSON.stringify({
      ...JSON.parse(submitReviewJson),
      readinessRating: 60,
      decision: "block",
    }));
    const gate = evaluatePostulateSubmissionGate({ review, evidenceContext });
    const finalText = buildPostulateReviewFinalText({ review, gate });

    expect(finalText).toContain("Submitted: no.");
    expect(finalText).not.toContain("Receipt:");
  });

  it("uses the board-ready draft and merges refs for a passing submission", () => {
    const request = parseAskPostulateReviewRequest([
      "/postulate",
      "Candidate postulate:",
      "Candidate refs scientific_image_sidecar:paper-page-2 and graph_reflection:theory-badge-graph:/warp/qei/residual.",
    ].join("\n"));
    const review = parsePostulateReadinessReview(submitReviewJson);
    const built = buildPostulateSubmissionTextAndEvidence({
      request: request!,
      review: review!,
    });

    expect(built.proposalText).toContain("accepted for structured review");
    expect(built.evidenceContext.evidenceSidecarRefs).toContain("scientific_image_sidecar:paper-page-2");
    expect(built.evidenceContext.graphReflectionRefs).toContain("graph_reflection:theory-badge-graph:/warp/qei/residual");
  });

  it("hydrates postulate evidence context from runtime sidecar and graph artifacts", () => {
    const hydrated = extractPostulateEvidenceContextFromRuntimePayload({
      debug: {
        current_turn_artifact_ledger: [
          {
            schema: "helix.current_turn_artifact.v1",
            kind: "scientific_image_evidence_sidecar",
            sidecar_id: "scientific_image_sidecar:weyl-page-5",
            packet_refs: ["scientific_packet:weyl-page-5-row-7"],
            produced_artifact_refs: ["scientific_image_sidecar:weyl-page-5"],
            payload: {
              schema: "helix.scientific_image_evidence_sidecar.v1",
              sidecar_id: "scientific_image_sidecar:weyl-page-5",
              packet_refs: ["scientific_packet:weyl-page-5-row-7"],
              packets: [
                {
                  schema: "helix.scientific_evidence_packet.v1",
                  source_ref_hash: "sha256:pagehash",
                  source_image: {
                    ref_hash: "sha256:pagehash",
                    source_kind: "pdf_page_render",
                    page_number: 5,
                  },
                  crop_region_id: "image_lens_region:eq7",
                  crop_region: {
                    region_id: "image_lens_region:eq7",
                    source_ref_hash: "sha256:pagehash",
                    bbox_px: { x: 73, y: 570, width: 1078, height: 87 },
                  },
                  bbox_px: { x: 73, y: 570, width: 1078, height: 87 },
                  exact_row_promotion: {
                    status: "promoted",
                    reasons: ["single_clean_row"],
                  },
                },
              ],
            },
          },
          {
            schema: "helix.theory_context_reflection.v1",
            kind: "theory_graph_reflection",
            id: "graph_reflection:latest-weyl",
          },
          {
            schema: "helix.calculator_template_admissibility.v1",
            status: "template_admissible",
            admitted_template_count: 4,
          },
          {
            schema: "helix.scientific_image_graph_reflection_lookup.v1",
            status: "found",
            selected_lookup_key: "scientific_image:account:pesty",
            selected_reflection_id: "theory_context_reflection:latest-scoped",
            selected_gate_state: "domain_context_match",
          },
        ],
      },
    });

    expect(hydrated.evidenceSidecarRefs).toContain("scientific_image_sidecar:weyl-page-5");
    expect(hydrated.promotedEquationRowRefs).toContain("scientific_packet:weyl-page-5-row-7");
    expect(hydrated.promotedEquationRowRefs).toContain("promoted_equation_row:image_lens_region:eq7");
    expect(hydrated.pageRenderRefs).toContain("page_render:sha256:pagehash:page:5");
    expect(hydrated.cropRefs).toContain("equation_crop:sha256:pagehash#crop=73,570,1078,87");
    expect(hydrated.graphReflectionRefs).toContain("graph_reflection:latest-weyl");
    expect(hydrated.graphReflectionRefs).toContain("theory_context_reflection:latest-scoped");
    expect(hydrated.calculatorCheckRefs).toContain("calculator_check:template_admissibility:template_admissible:4");
  });
});

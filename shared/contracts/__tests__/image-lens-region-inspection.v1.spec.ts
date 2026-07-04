import { describe, expect, it } from "vitest";
import {
  IMAGE_LENS_REGION_INSPECTION_CAPABILITY,
  IMAGE_LENS_REGION_INSPECTION_RECEIPT_SCHEMA,
  IMAGE_LENS_REGION_INSPECTION_REQUEST_SCHEMA,
  validateImageLensRegionInspectionReceiptV1,
  validateImageLensRegionInspectionRequestV1,
  type ImageLensRegionInspectionReceiptV1,
  type ImageLensRegionInspectionRequestV1,
} from "../image-lens-region-inspection.v1";

describe("image lens region inspection contract", () => {
  it("accepts a governed crop request for a PDF equation region", () => {
    const request: ImageLensRegionInspectionRequestV1 = {
      schema: IMAGE_LENS_REGION_INSPECTION_REQUEST_SCHEMA,
      capability: IMAGE_LENS_REGION_INSPECTION_CAPABILITY,
      source_id: "pdf-page-render:test:3",
      source_attachment_id: "attachment:paper",
      source_kind: "pdf_page_render",
      page_number: 3,
      page_image_ref: "ephemeral://pdf/page/3",
      bbox_px: { x: 12, y: 20, width: 300, height: 90 },
      question: "Read this equation.",
      reason_for_crop: "Equation is small in the full page.",
      detail: "high",
      region_kind: "equation",
      assistant_answer: false,
      terminal_eligible: false,
    };

    expect(validateImageLensRegionInspectionRequestV1(request)).toEqual([]);
  });

  it("accepts a non-terminal crop receipt with embedded document-region provenance", () => {
    const receipt: ImageLensRegionInspectionReceiptV1 = {
      schema: IMAGE_LENS_REGION_INSPECTION_RECEIPT_SCHEMA,
      capability: IMAGE_LENS_REGION_INSPECTION_CAPABILITY,
      region_id: "image_lens_region:test",
      crop_image_ref: "ephemeral://crop/test",
      source_kind: "image_lens_source",
      source_image_ref: "ephemeral://source/test",
      page_number: null,
      page_image_ref: null,
      bbox_px: { x: 1, y: 2, width: 30, height: 40 },
      source_refs: ["image-lens-source:test", "frame:test"],
      summary: "Equation candidate crop.",
      text_candidate: "T00 = rho",
      latex_candidate: "T_{00}=\\rho",
      uncertainty: ["symbol clarity is candidate-only"],
      evidence_id: "evidence:image-lens:test",
      requested_question: "Read the equation.",
      reason_for_crop: "small text",
      parent_region_id: null,
      detail: "high",
      document_region_receipt: {
        contractVersion: "document_image_region_receipt/v1",
        generatedAt: "2026-07-04T12:00:00.000Z",
        sourceAttachmentId: "attachment:test",
        sourceKind: "image_lens_source",
        crop: {
          regionId: "image_lens_region:test",
          bboxPx: { x: 1, y: 2, width: 30, height: 40 },
          imageRef: "ephemeral://crop/test",
          imageHash: "sha256:test",
        },
        visualSource: {
          sourceId: "image-lens-source:test",
          frameId: "frame:test",
          observerProfileId: "stage_play_visual_observer_profile:image-lens-region:v1",
        },
        classification: {
          kind: "equation",
          confidence: 0.7,
          summary: "Equation candidate crop.",
        },
        extraction: {
          textCandidate: "T00 = rho",
          latexCandidate: "T_{00}=\\rho",
          status: "candidate",
        },
        locatorAnchor: {
          pageNumber: null,
          bboxPx: { x: 1, y: 2, width: 30, height: 40 },
          anchorConfidence: 0.7,
        },
        claimBoundary: {
          ocrCandidateOnly: true,
          notProofAuthority: true,
        },
      },
      claim_boundary: {
        cropObservationOnly: true,
        ocrCandidateOnly: true,
        notProofAuthority: true,
      },
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    };

    expect(validateImageLensRegionInspectionReceiptV1(receipt)).toEqual([]);
  });
});

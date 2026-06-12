import { describe, expect, it } from "vitest";
import {
  isDocumentImageRegionReceiptV1,
  validateDocumentImageRegionReceiptV1,
  type DocumentImageRegionReceiptV1,
} from "../document-image-region-receipt.v1";

const baseReceipt: DocumentImageRegionReceiptV1 = {
  contractVersion: "document_image_region_receipt/v1",
  generatedAt: "2026-06-11T12:00:00.000Z",
  sourceAttachmentId: "image-attachment:test",
  sourceKind: "image_attachment",
  crop: {
    regionId: "doc-image-region:test",
    bboxPx: { x: 10, y: 20, width: 120, height: 60 },
    imageRef: "data:image/png;base64,test",
    imageHash: "fnv1a32:test",
  },
  visualSource: {
    sourceId: "visual_source:document_image:test",
    frameId: "visual_frame:doc-image-region:test",
    observerProfileId: "stage_play_visual_observer_profile:document-image:v1",
    shadePromptId: "document_region_extraction",
  },
  classification: {
    kind: "equation",
    confidence: 0.7,
    summary: "Equation candidate.",
  },
  extraction: {
    textCandidate: "T00 = rho",
    latexCandidate: "T_{00}=\\rho",
    status: "candidate",
  },
  locatorAnchor: {
    pageNumber: null,
    bboxPx: { x: 10, y: 20, width: 120, height: 60 },
    anchorConfidence: 0.7,
  },
  claimBoundary: {
    ocrCandidateOnly: true,
    notProofAuthority: true,
  },
};

describe("document image region receipt v1", () => {
  it("accepts a candidate region receipt", () => {
    expect(validateDocumentImageRegionReceiptV1(baseReceipt)).toEqual([]);
    expect(isDocumentImageRegionReceiptV1(baseReceipt)).toBe(true);
  });

  it("requires claim boundary to keep image extraction from becoming proof authority", () => {
    const issues = validateDocumentImageRegionReceiptV1({
      ...baseReceipt,
      claimBoundary: {
        ocrCandidateOnly: true,
        notProofAuthority: false,
      },
    });

    expect(issues).toContain("claimBoundary.notProofAuthority must be true");
  });

  it("rejects zero-sized crop boxes", () => {
    const issues = validateDocumentImageRegionReceiptV1({
      ...baseReceipt,
      crop: {
        ...baseReceipt.crop,
        bboxPx: { x: 0, y: 0, width: 0, height: 20 },
      },
    });

    expect(issues).toContain("crop.bboxPx.width must be positive");
  });
});

import { afterEach, describe, expect, it } from "vitest";
import type { ImageLensRegionInspectionReceiptV1 } from "@shared/contracts/image-lens-region-inspection.v1";
import { useDocumentImageRegionStore } from "@/store/useDocumentImageRegionStore";
import { useVisualSourceCaptureStore } from "@/store/useVisualSourceCaptureStore";
import { applyImageLensRegionInspectionReceipt } from "../imageLensRegionInspectionClient";

const documentInitialState = useDocumentImageRegionStore.getState();
const visualInitialState = useVisualSourceCaptureStore.getState();

afterEach(() => {
  useDocumentImageRegionStore.setState(documentInitialState, true);
  useVisualSourceCaptureStore.setState(visualInitialState, true);
});

function receiptFixture(): ImageLensRegionInspectionReceiptV1 {
  return {
    schema: "image_lens_region_inspection_receipt/v1",
    capability: "visual_analysis.inspect_image_region",
    region_id: "image_lens_region:test",
    crop_image_ref: "data:image/png;base64,crop",
    source_kind: "image_lens_source",
    source_image_ref: "data:image/png;base64,source",
    page_number: null,
    page_image_ref: null,
    bbox_px: { x: 10, y: 20, width: 120, height: 80 },
    source_refs: ["image-lens-source:test", "frame:test"],
    summary: "Equation candidate crop.",
    text_candidate: "T00 = rho",
    latex_candidate: "T_{00}=\\rho",
    extraction_status: "extracted",
    uncertainty: ["candidate-only OCR"],
    evidence_id: "evidence:image-lens:test",
    requested_question: "Read the equation.",
    reason_for_crop: "Equation is small in the full image.",
    parent_region_id: null,
    detail: "high",
    document_region_receipt: {
      contractVersion: "document_image_region_receipt/v1",
      generatedAt: "2026-07-04T12:00:00.000Z",
      sourceAttachmentId: "attachment:image:test",
      sourceKind: "image_lens_source",
      crop: {
        regionId: "image_lens_region:test",
        bboxPx: { x: 10, y: 20, width: 120, height: 80 },
        imageRef: "data:image/png;base64,crop",
        imageHash: "sha256:test",
      },
      visualSource: {
        sourceId: "image-lens-source:test",
        frameId: "frame:test",
        observerProfileId: "stage_play_visual_observer_profile:image-lens-region:v1",
      },
      classification: {
        kind: "equation",
        confidence: 0.8,
        summary: "Equation candidate crop.",
      },
      extraction: {
        textCandidate: "T00 = rho",
        latexCandidate: "T_{00}=\\rho",
        status: "candidate",
      },
      locatorAnchor: {
        pageNumber: null,
        bboxPx: { x: 10, y: 20, width: 120, height: 80 },
        anchorConfidence: 0.8,
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
}

describe("Image Lens region inspection client adapter", () => {
  it("projects an inspection receipt into crop receipts and visual frame history", () => {
    const frame = applyImageLensRegionInspectionReceipt({
      receipt: receiptFixture(),
      threadId: "thread:test",
      capturedAt: "2026-07-04T12:00:00.000Z",
    });

    expect(useDocumentImageRegionStore.getState().lastReceipt?.crop.regionId).toBe("image_lens_region:test");
    expect(useDocumentImageRegionStore.getState().lastReceipt?.claimBoundary.notProofAuthority).toBe(true);
    expect(useDocumentImageRegionStore.getState().source).toMatchObject({
      sourceImageUrl: "data:image/png;base64,source",
      sourceAttachmentId: "attachment:image:test",
      sourceKind: "image_lens_source",
      pageNumber: null,
    });
    expect(useDocumentImageRegionStore.getState().cropDraft).toEqual({ x: 10, y: 20, width: 120, height: 80 });
    expect(frame).toMatchObject({
      source_id: "image-lens-source:test",
      frame_id: "frame:test",
      evidence_id: "evidence:image-lens:test",
      source_kind: "image_lens_crop",
      crop_only: true,
      crop_bbox_px: { x: 10, y: 20, width: 120, height: 80 },
      crop_region_id: "image_lens_region:test",
      summary: "Equation candidate crop.",
    });
    expect(useVisualSourceCaptureStore.getState().producers["image-lens-source:test"]).toMatchObject({
      source_id: "image-lens-source:test",
      thread_id: "thread:test",
      last_frame_preview_data_url: "data:image/png;base64,crop",
      frame_history: [
        expect.objectContaining({
          history_id: "image_lens_region_history:image_lens_region:test",
          source_kind: "image_lens_crop",
          crop_region_id: "image_lens_region:test",
        }),
      ],
    });
  });
});

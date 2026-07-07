import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { useDocumentImageRegionStore } from "@/store/useDocumentImageRegionStore";
import { useVisualSourceCaptureStore } from "@/store/useVisualSourceCaptureStore";
import type { ImageLensRegionInspectionReceiptV1 } from "@shared/contracts/image-lens-region-inspection.v1";

let runAskTurnStream: typeof import("@/lib/agi/api").runAskTurnStream;
let runCapabilityLaneOneShot: typeof import("@/lib/agi/api").runCapabilityLaneOneShot;

const documentInitialState = useDocumentImageRegionStore.getState();
const visualInitialState = useVisualSourceCaptureStore.getState();

beforeAll(async () => {
  ({ runAskTurnStream, runCapabilityLaneOneShot } = await import("@/lib/agi/api"));
});

afterEach(() => {
  vi.unstubAllGlobals();
  useDocumentImageRegionStore.setState(documentInitialState, true);
  useVisualSourceCaptureStore.setState(visualInitialState, true);
});

function receiptFixture(): ImageLensRegionInspectionReceiptV1 {
  return {
    schema: "image_lens_region_inspection_receipt/v1",
    capability: "visual_analysis.inspect_image_region",
    region_id: "image_lens_region:api",
    crop_image_ref: "data:image/png;base64,api-crop",
    source_kind: "image_lens_source",
    source_image_ref: "data:image/png;base64,api-source",
    page_number: null,
    page_image_ref: null,
    bbox_px: { x: 3, y: 4, width: 50, height: 60 },
    source_refs: ["image-lens-source:api", "frame:api"],
    summary: "API crop receipt.",
    extraction_status: "failed",
    uncertainty: ["No Image Lens OCR/math extraction backend returned text_candidate or latex_candidate for this crop."],
    evidence_id: "evidence:image-lens:api",
    requested_question: "What is in the crop?",
    reason_for_crop: "small subject",
    parent_region_id: null,
    detail: "auto",
    document_region_receipt: {
      contractVersion: "document_image_region_receipt/v1",
      generatedAt: "2026-07-04T12:00:00.000Z",
      sourceAttachmentId: "attachment:api",
      sourceKind: "image_lens_source",
      crop: {
        regionId: "image_lens_region:api",
        bboxPx: { x: 3, y: 4, width: 50, height: 60 },
        imageRef: "data:image/png;base64,api-crop",
        imageHash: "sha256:api",
      },
      visualSource: {
        sourceId: "image-lens-source:api",
        frameId: "frame:api",
        observerProfileId: "stage_play_visual_observer_profile:image-lens-region:v1",
      },
      classification: {
        kind: "unknown",
        confidence: 0.5,
        summary: "API crop receipt.",
      },
      extraction: {
        status: "rejected",
      },
      locatorAnchor: {
        pageNumber: null,
        bboxPx: { x: 3, y: 4, width: 50, height: 60 },
        anchorConfidence: 0.5,
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

describe("Image Lens region inspection API ingestion", () => {
  it("applies one-shot region receipts to Image Lens stores", async () => {
    const receipt = receiptFixture();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          schema: "helix.capability_lane.one_shot_response.v1",
          ok: true,
          turn_id: "turn:image-lens-api",
          capability_lane_call_results: [
            {
              schema: "helix.image_lens_region_inspection_result.v1",
              ok: true,
              receipt,
            },
          ],
          capability_lane_observation_packets: [
            {
              state_delta: {
                visual_analysis_region_inspection: {
                  receipt,
                },
              },
            },
          ],
          terminal_eligible: false,
          assistant_answer: false,
          raw_content_included: false,
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      ),
    ));

    await runCapabilityLaneOneShot({
      turn_id: "turn:image-lens-api",
      capability_lane_call: {
        capability: "visual_analysis.inspect_image_region",
        source_id: "image-lens-source:api",
        bbox_px: { x: 3, y: 4, width: 50, height: 60 },
      },
    });

    expect(useDocumentImageRegionStore.getState().lastReceipt?.crop.regionId).toBe("image_lens_region:api");
    expect(useVisualSourceCaptureStore.getState().producers["image-lens-source:api"]?.frame_history).toEqual([
      expect.objectContaining({
        evidence_id: "evidence:image-lens:api",
        source_kind: "image_lens_crop",
        crop_region_id: "image_lens_region:api",
      }),
    ]);
  });

  it("applies streamed ask turn Image Lens receipts before final payload compaction", async () => {
    const receipt = {
      ...receiptFixture(),
      source_kind: "pdf_page_render" as const,
      page_number: 2,
      page_image_ref: "data:image/png;base64,pdf-page-source",
      source_image_ref: null,
      document_region_receipt: {
        ...receiptFixture().document_region_receipt,
        sourceAttachmentId: "pdf-page-render:api",
        sourceKind: "pdf_page_render" as const,
        locatorAnchor: {
          ...receiptFixture().document_region_receipt.locatorAnchor,
          pageNumber: 2,
        },
      },
    };
    const streamText = [
      "event: turn_transcript_event",
      `data: ${JSON.stringify({
        capability_lane_observation_packets: [{
          state_delta: {
            visual_analysis_region_inspection: {
              receipt,
            },
          },
        }],
      })}`,
      "",
      "event: turn_final",
      `data: ${JSON.stringify({
        ok: true,
        selected_final_answer: "done",
        debug: {},
      })}`,
      "",
    ].join("\n");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response(streamText, {
        status: 200,
        headers: { "content-type": "text/event-stream" },
      }),
    ));

    await runAskTurnStream({
      turn_id: "turn:image-lens-stream",
      question: "Inspect the PDF page.",
    });

    expect(useDocumentImageRegionStore.getState().source).toMatchObject({
      sourceImageUrl: "data:image/png;base64,pdf-page-source",
      sourceAttachmentId: "pdf-page-render:api",
      sourceKind: "pdf_page_render",
      pageNumber: 2,
    });
    expect(useDocumentImageRegionStore.getState().lastReceipt?.crop.regionId).toBe("image_lens_region:api");
  });
});

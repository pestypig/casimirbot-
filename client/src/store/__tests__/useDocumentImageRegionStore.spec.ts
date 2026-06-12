import { afterEach, describe, expect, it } from "vitest";
import { buildDocumentImageRegionReceipt } from "@/lib/document-image/documentImageRegions";
import { useDocumentImageRegionStore } from "../useDocumentImageRegionStore";

const initialState = useDocumentImageRegionStore.getState();

afterEach(() => {
  useDocumentImageRegionStore.setState(initialState, true);
});

function makeReceipt() {
  return buildDocumentImageRegionReceipt({
    generatedAt: "2026-06-11T12:00:00.000Z",
    sourceAttachmentId: "image-attachment:test",
    sourceKind: "image_attachment",
    sourceImageRef: "data:image/png;base64,source",
    bboxPx: { x: 1, y: 2, width: 30, height: 40 },
    imageRef: "data:image/png;base64,crop",
    kind: "equation",
    confidence: 0.8,
    summary: "Equation candidate.",
  });
}

describe("document image region store", () => {
  it("records source image state and recent receipts", () => {
    useDocumentImageRegionStore.getState().setSourceImage({
      sourceImageUrl: "data:image/png;base64,source",
      sourceAttachmentId: "image-attachment:test",
      sourceKind: "image_attachment",
      pageNumber: null,
    });
    const receipt = makeReceipt();

    useDocumentImageRegionStore.getState().addReceipt(receipt);

    expect(useDocumentImageRegionStore.getState().source?.sourceAttachmentId).toBe("image-attachment:test");
    expect(useDocumentImageRegionStore.getState().lastReceipt).toBe(receipt);
    expect(useDocumentImageRegionStore.getState().receipts).toEqual([receipt]);
  });

  it("updates candidate review status without changing claim boundary", () => {
    const receipt = makeReceipt();
    useDocumentImageRegionStore.getState().addReceipt(receipt);
    useDocumentImageRegionStore.getState().updateReceiptStatus(receipt.crop.regionId, "confirmed");

    const updated = useDocumentImageRegionStore.getState().receipts[0];
    expect(updated?.extraction.status).toBe("confirmed");
    expect(updated?.claimBoundary.notProofAuthority).toBe(true);
  });
});

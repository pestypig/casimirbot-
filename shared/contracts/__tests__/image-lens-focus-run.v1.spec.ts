import { describe, expect, it } from "vitest";
import {
  IMAGE_LENS_FOCUS_RUN_REQUEST_VERSION,
  buildImageLensFocusRunResultV1,
  clampImageLensFocusBboxPct,
  normalizeImageLensFocusRunRequestV1,
  validateImageLensFocusRunRequestV1,
} from "../image-lens-focus-run.v1";

describe("image-lens-focus-run.v1", () => {
  it("clamps percentage crop regions inside the image bounds", () => {
    const bbox = clampImageLensFocusBboxPct({ x: -1, y: 0.9, width: 5, height: 5 });
    expect(bbox.x).toBe(0);
    expect(bbox.y).toBe(0.9);
    expect(bbox.width).toBe(1);
    expect(bbox.height).toBeCloseTo(0.1);
  });

  it("normalizes raw action args into an observation-only request", () => {
    const request = normalizeImageLensFocusRunRequestV1({
      sourceId: "visual-source:test",
      mode: "broad_then_regions",
      maxRegions: 2,
      regions: [
        {
          region_id: "eq-1",
          bbox_pct: { x: 0.1, y: 0.2, width: 0.3, height: 0.4 },
          reason: "equation block",
        },
      ],
    });

    expect(request).toMatchObject({
      contractVersion: IMAGE_LENS_FOCUS_RUN_REQUEST_VERSION,
      sourceId: "visual-source:test",
      mode: "broad_then_regions",
      maxRegions: 2,
      claimBoundary: {
        observationOnly: true,
        notAnswerAuthority: true,
      },
    });
    expect(validateImageLensFocusRunRequestV1(request)).toEqual([]);
  });

  it("builds result artifacts that cannot become answer authority", () => {
    const result = buildImageLensFocusRunResultV1({
      sourceId: "visual-source:test",
      blockers: ["source missing"],
    });

    expect(result).toMatchObject({
      contractVersion: "image_lens_focus_run_result/v1",
      sourceId: "visual-source:test",
      submittedRegions: [],
      blockers: ["source missing"],
      claimBoundary: {
        observationOnly: true,
        notAnswerAuthority: true,
      },
    });
  });
});

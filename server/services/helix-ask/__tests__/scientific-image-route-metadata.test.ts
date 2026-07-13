import { describe, expect, it } from "vitest";
import { readHardToolBackendEntrypointRouteMetadata } from "../hard-tool-route-metadata";
import {
  buildAskTurnScientificImageComparisonRouteMetadata,
  isAskTurnScientificImageTextComparisonPrompt,
} from "../scientific-image-route-metadata";

describe("scientific Image Lens comparison route metadata", () => {
  const prompt =
    "Using the saved machine-readable page-8 text and the Image Lens crop, compare equation (47) row by row. Report the actual detected display-row count, symbol/subscript agreements, and mismatches.";

  it("commits a retained-sidecar route without forcing a fresh crop", () => {
    expect(isAskTurnScientificImageTextComparisonPrompt(prompt)).toBe(true);
    const built = buildAskTurnScientificImageComparisonRouteMetadata({
      turnId: "ask:scientific-comparison",
      threadId: "thread:scientific-comparison",
    });

    expect(readHardToolBackendEntrypointRouteMetadata(built.metadata)).toBeTruthy();
    expect(built.metadata).toMatchObject({
      source: "hard_tool_backend_entrypoint",
      sourceTarget: "scientific_image_evidence",
      requiredToolFamily: "visual_analysis",
      source_target_intent: {
        target_source: "scientific_image_evidence",
        target_kind: "scientific_image_evidence_sidecar",
        reuse_retained_scientific_image_sidecar: true,
        requested_outputs: expect.arrayContaining([
          "scientific_evidence_sidecar",
          "machine_text_visual_comparison",
          "model_authored_synthesis",
        ]),
      },
    });
    expect(built.metadata).not.toHaveProperty("mandatory_next_tool");
  });
});

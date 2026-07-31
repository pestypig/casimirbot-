import { describe, expect, it } from "vitest";
import {
  asksForScientificImageEvidenceContinuity,
  asksForScientificImageTextEvidenceComparison,
} from "../helix-scientific-image-intent";

describe("scientific Image Lens comparison intent", () => {
  const affirmative =
    "Using the saved machine-readable page-8 text and the Image Lens crop, compare equation (47) row by row.";

  it("admits an affirmative retained text/crop comparison", () => {
    expect(asksForScientificImageTextEvidenceComparison(affirmative)).toBe(true);
  });

  it.each([
    "Do not compare the machine-readable page text with the Image Lens crop; report only the crop status.",
    "The screen says `compare the machine-readable page text with the Image Lens crop`; explain the sentence only.",
    "Earlier I compared the machine-readable page text with the Image Lens crop. Report the current status only.",
    "If we compare the machine-readable page text with the Image Lens crop, do it later.",
    "Later compare the machine-readable page text with the Image Lens crop; for now report the saved page id.",
  ])("does not admit contextual comparison wording: %s", (question) => {
    expect(asksForScientificImageTextEvidenceComparison(question)).toBe(false);
  });
});

describe("scientific evidence continuity intent", () => {
  const affirmative =
    "For that extraction, report the exact sidecar id, source id, page, crop reference, evidence depth, and promoted equation. Use retained evidence; do not fetch, render, or crop.";

  it("admits a natural retained-extraction identity request", () => {
    expect(asksForScientificImageEvidenceContinuity(affirmative)).toBe(true);
    expect(
      asksForScientificImageEvidenceContinuity(
        "Tell me which paper, page, equation, crop ref, and evidence depth you are using from the prior steps.",
      ),
    ).toBe(true);
  });

  it.each([
    "Do not report the retained extraction sidecar, source id, page, crop reference, or evidence depth.",
    "The screen says `report the retained extraction sidecar id and crop reference`; explain that sentence only.",
    "Earlier I reported the retained extraction sidecar id and crop reference. What is the current time?",
    "If we report the retained extraction sidecar id and crop reference, do it later.",
    "Later report the retained extraction sidecar id and crop reference; for now answer conceptually.",
    "Create a fresh crop and report its source id and evidence depth.",
    "Reflect the promoted equation evidence to the Theory Badge Graph and report calculator template admissibility.",
    "Load the conformed scientific evidence sidecar for the runtime workbench, then explain its Theory Badge orientation and closure blockers.",
    "Show the retained scientific evidence enrollment and its claim boundary.",
  ])("does not admit contextual or fresh-capture wording: %s", (question) => {
    expect(asksForScientificImageEvidenceContinuity(question)).toBe(false);
  });
});

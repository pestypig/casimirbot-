import { describe, expect, it } from "vitest";
import { asksForScientificImageTextEvidenceComparison } from "../helix-scientific-image-intent";

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

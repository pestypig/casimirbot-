import { describe, expect, it } from "vitest";
import {
  buildEvidenceUnitsFromText,
  selectEvidencePassages,
} from "../retrieval/evidence-passage-selection";

describe("evidence passage selection", () => {
  it("keeps sentence boundaries and gives exact query terms priority over generic metadata", () => {
    const units = [
      ...buildEvidenceUnitsFromText({
        page: 1,
        text: "Abstract. This magnetar paper discusses future telescopes and broad emission geometry.",
      }),
      ...buildEvidenceUnitsFromText({
        page: 3,
        text: "Results. We show that line energy is linear with line width within error bars. The magnetic flux tube shape can be determined when width, depth, and energy are studied concurrently.",
      }),
    ];

    const passages = selectEvidencePassages({
      units,
      query: 'What does it say about "line energy is linear with line width"?',
      source_ref: "artifact://scholarly-pdf/test.pdf",
      title: "Probing Magnetars Using Spectral Lines",
      max_passages: 2,
    });

    expect(passages[0]).toMatchObject({ page: 3, section: "Results" });
    expect(passages[0]?.text).toContain("line energy is linear with line width within error bars.");
    expect(passages[0]?.text.trim().endsWith(".")).toBe(true);
    expect(passages[0]?.citation_ref).toMatch(/#page=3&char=\d+-\d+/);
    expect(passages[0]?.citation_label).toBe("Probing Magnetars Using Spectral Lines, p. 3, Results");
  });

  it("uses structural summary sections when a casual prompt has no topical terms", () => {
    const units = buildEvidenceUnitsFromText({
      page: 1,
      text: [
        "Title page material without a claim.",
        "",
        "Abstract",
        "The study reports a bounded diagnostic result and explicitly withholds a physical viability claim.",
        "",
        "References",
        "A long reference entry about an unrelated historical source.",
      ].join("\n"),
    });

    const passages = selectEvidencePassages({
      units,
      query: "Can you explain what this paper is about?",
      source_ref: "artifact://scholarly-pdf/summary.pdf",
      title: "Bounded Study",
      max_passages: 1,
    });

    expect(passages[0]).toMatchObject({ section: "Abstract" });
    expect(passages[0]?.text).toContain("withholds a physical viability claim");
  });
});

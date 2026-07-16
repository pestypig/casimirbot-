import { describe, expect, it } from "vitest";
import { deriveScholarlyEvidenceDemand } from "../scholarly-evidence-demand";

describe("scholarly evidence demand", () => {
  it("models passage or equation as alternative evidence products", () => {
    const demand = deriveScholarlyEvidenceDemand({
      promptText: [
        "Fetch and parse the full text for arXiv gr-qc/9510071.",
        "Return one page-numbered passage or equation supporting a quantum inequality.",
        "Do not search for other papers.",
      ].join(" "),
      workflow: "full_text_summary",
    });

    expect(demand).toMatchObject({
      satisfaction: "any_of",
      required_modes: ["full_text"],
      optional_modes: ["equation_extraction", "page_image_parse"],
      minimum_satisfying_depth: "full_text",
      derivation_reasons: ["passage_or_equation_is_disjunctive"],
    });
    expect(demand.alternatives).toEqual([
      {
        product: "page_grounded_passage",
        minimum_depth: "full_text",
        exactness: "bounded",
      },
      {
        product: "exact_equation",
        minimum_depth: "page_image_parse",
        exactness: "exact",
      },
    ]);
  });

  it("keeps an exact equation request on the page-image rail", () => {
    expect(deriveScholarlyEvidenceDemand({
      promptText: "Fetch the full text, then extract and transcribe its main equation exactly.",
      workflow: "full_text_summary",
    })).toMatchObject({
      satisfaction: "all_of",
      required_modes: ["equation_extraction", "page_image_parse", "full_text"],
      optional_modes: [],
      minimum_satisfying_depth: "page_image_parse",
      alternatives: [{
        product: "exact_equation",
        minimum_depth: "page_image_parse",
        exactness: "exact",
      }],
    });
  });

  it("scopes negated, historical, future, conditional, and quoted equation cues", () => {
    const prompts = [
      "Fetch full text and return a passage. Do not use Image Lens or extract equations.",
      "Previously I extracted the main equation. Fetch full text and return a passage now.",
      "Fetch full text and return a passage. Later, if needed, transcribe the main equation.",
      "Fetch full text and return a passage. If full text fails, use Image Lens to inspect an equation.",
      "Fetch full text and return a passage. The phrase `extract the equation exactly` is only an example.",
    ];

    for (const promptText of prompts) {
      expect(deriveScholarlyEvidenceDemand({
        promptText,
        workflow: "full_text_summary",
      })).toMatchObject({
        required_modes: ["full_text"],
        optional_modes: [],
        minimum_satisfying_depth: "full_text",
      });
    }
  });

  it("keeps an affirmative page render as a page-image requirement", () => {
    expect(deriveScholarlyEvidenceDemand({
      promptText: "Render and inspect PDF page 4 before answering.",
      workflow: "full_text_summary",
    })).toMatchObject({
      required_modes: ["page_image_parse", "full_text"],
      minimum_satisfying_depth: "page_image_parse",
    });
  });
});

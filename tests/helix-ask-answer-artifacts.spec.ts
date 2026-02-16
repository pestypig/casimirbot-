import { describe, expect, it } from "vitest";
import { stripRunawayAnswerArtifacts } from "../server/services/helix-ask/answer-artifacts";

describe("stripRunawayAnswerArtifacts", () => {
  it("removes leaked instruction preamble and trailing debug sections", () => {
    const input = [
      "In answer, use the context and evidence bullets to craft your response. Certainly! Let's dive into the concept.",
      "",
      "Feedback loops are governance cycles that rely on verified signals.",
      "",
      "Ask debug",
      "- internal=1",
      "",
      "Context sources",
      "docs/ethos/ideology.json",
    ].join("\n");
    const cleaned = stripRunawayAnswerArtifacts(input);
    expect(cleaned).toBe("Feedback loops are governance cycles that rely on verified signals.");
  });

  it("removes END_OF_ANSWER and deduplicates repeated Sources lines", () => {
    const input = [
      "Feedback Loop Hygiene means close loops with verified signals.",
      "",
      "END_OF_ANSWER",
      "",
      "Sources: docs/knowledge/ethos/feedback-loop-hygiene.md, docs/ethos/ideology.json",
      "Sources: docs/knowledge/ethos/feedback-loop-hygiene.md, docs/ethos/ideology.json",
    ].join("\n");
    const cleaned = stripRunawayAnswerArtifacts(input);
    expect(cleaned).toBe([
      "Feedback Loop Hygiene means close loops with verified signals.",
      "",
      "Sources: docs/knowledge/ethos/feedback-loop-hygiene.md, docs/ethos/ideology.json",
    ].join("\n"));
  });
});

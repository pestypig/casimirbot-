import { describe, expect, it } from "vitest";
import { enforceHelixAskAnswerFormat } from "../server/services/helix-ask/format";

describe("Helix Ask format compliance", () => {
  it("collapses bullet-only answers into paragraphs for compare", () => {
    const raw = [
      "- Definition: Epistemology is the study of knowledge",
      "- Key questions: What counts as knowledge?",
      "- Notes: It contrasts empirical and rational standards.",
      "In practice, epistemology evaluates belief reliability.",
    ].join("\n");
    const formatted = enforceHelixAskAnswerFormat(raw, "compare", "What is epistemology?");
    expect(formatted).not.toMatch(/^\s*[-*]\s+/m);
    expect(formatted).toContain("Definition:");
    expect(formatted).toContain("In practice");
  });

  it("drops trailing bullet lists when paragraphs already exist", () => {
    const raw = [
      "Epistemology studies knowledge and justification.",
      "",
      "- Definition: Epistemology is the study of knowledge.",
      "- Key questions: What counts as knowledge?",
      "- Notes: It contrasts empirical and rational standards.",
      "In practice, epistemology evaluates belief reliability.",
    ].join("\n");
    const formatted = enforceHelixAskAnswerFormat(raw, "compare", "What is epistemology?");
    expect(formatted).toContain("Epistemology studies knowledge");
    expect(formatted).not.toMatch(/^\s*[-*]\s+/m);
  });

  it("keeps list content when only non-list paragraph is In practice", () => {
    const raw = [
      "- Definition: Epistemology is the study of knowledge.",
      "- Key questions: What counts as knowledge?",
      "- Notes: It contrasts empirical and rational standards.",
      "In practice, epistemology evaluates belief reliability.",
    ].join("\n");
    const formatted = enforceHelixAskAnswerFormat(raw, "compare", "What is epistemology?");
    expect(formatted).toContain("Definition:");
    expect(formatted).toContain("In practice");
    expect(formatted).not.toMatch(/^\s*[-*]\s+/m);
  });
});

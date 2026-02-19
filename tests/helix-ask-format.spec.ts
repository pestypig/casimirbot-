import { describe, expect, it } from "vitest";
import { enforceHelixAskAnswerFormat, enforceNonReportPromptShape } from "../server/services/helix-ask/format";

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

  it("strips report scaffolding when report mode is disabled", () => {
    const raw = [
      "## Report",
      "Section 1: Summary",
      "Warp bubbles require bounded constraint checks.",
      "### Findings",
      "Mission ethos adds stewardship constraints.",
    ].join("\n");
    const formatted = enforceNonReportPromptShape(raw, false);
    expect(formatted).not.toContain("## Report");
    expect(formatted).not.toContain("Section 1:");
    expect(formatted).toContain("Warp bubbles require bounded constraint checks.");
  });
});

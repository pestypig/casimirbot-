import { describe, expect, it } from "vitest";
import {
  cleanPromptLine,
  normalizeQuestionMatch,
  stripAnswerBoundaryPrefix,
  stripInlineQuestionLine,
  stripLeadingQuestion,
  stripQuestionPrefixText,
  stripStageTags,
} from "../ask-output-cleanup";

describe("ask output cleanup", () => {
  it("removes answer boundary prefixes repeatedly", () => {
    expect(stripAnswerBoundaryPrefix("  ANSWER_START ANSWER_END Final text")).toBe("Final text");
  });

  it("strips stage tags from line endings only", () => {
    expect(stripStageTags("First (observe)\nKeep (observe) inside sentence.\nFinal (explain)")).toBe(
      "First\nKeep (observe) inside sentence.\nFinal",
    );
  });

  it("normalizes question text for matching", () => {
    expect(normalizeQuestionMatch("Current NHM2 whitepaper?")).toBe("current nhm2 whitepaper");
  });

  it("extracts inline question answer tails", () => {
    expect(stripInlineQuestionLine("Question: What is 3+5? 8", "What is 3+5?")).toBe("8");
    expect(stripInlineQuestionLine("Question: Question: What is 3+5? 8")).toBe("8");
    expect(stripInlineQuestionLine("Answer: 8")).toBeNull();
  });

  it("strips question prefix text from the first line only", () => {
    expect(stripQuestionPrefixText("Question: What is 3+5? 8\nDetails", "What is 3+5?")).toBe("8\nDetails");
    expect(stripQuestionPrefixText("Question:\n8")).toBe("8");
  });

  it("cleans prompt punctuation wrappers", () => {
    expect(cleanPromptLine('  "`..Answer.,`"  ')).toBe("Answer");
  });

  it("removes leading echoed question scaffolding", () => {
    const response = ["Question: What is 3+5?", "Context: calculator", "", "8"].join("\n");
    expect(stripLeadingQuestion(response, "What is 3+5?")).toBe("8");
  });
});

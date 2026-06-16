import { beforeAll, describe, expect, it } from "vitest";

let parseHelixAskQueuedQuestionsInput: typeof import("@/components/helix/HelixAskPill").parseHelixAskQueuedQuestionsInput;

beforeAll(async () => {
  (globalThis as Record<string, unknown>).__HELIX_ASK_JOB_TIMEOUT_MS__ = "1200000";
  ({ parseHelixAskQueuedQuestionsInput } = await import("@/components/helix/HelixAskPill"));
});

describe("Helix Ask queued input parser", () => {
  it("preserves multiline prompt instructions as one user turn", () => {
    const prompt = [
      "Call scientific-calculator.solve_expression with this exact expression: ((sqrt(81)+ln(e^3))*7-5^2)/2.",
      "",
      "Use the calculator tool, wait for its observation, re-enter the calculator receipt as evidence, then answer from the calculator-backed terminal result only. Do not answer from mental math or a model-synthesized fallback.",
    ].join("\n");

    expect(parseHelixAskQueuedQuestionsInput(prompt)).toEqual([prompt.trim()]);
  });

  it("preserves delimiter-looking text as content instead of creating queued turns", () => {
    const prompt = "First paragraph\n---\nSecond paragraph";

    expect(parseHelixAskQueuedQuestionsInput(prompt)).toEqual([prompt]);
  });

  it("preserves numbered question labels as content instead of creating queued turns", () => {
    const prompt = "Question 1: First turn\nPrompt 2: Second turn";

    expect(parseHelixAskQueuedQuestionsInput(prompt)).toEqual([prompt]);
  });
});

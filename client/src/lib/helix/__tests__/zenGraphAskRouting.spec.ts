import { describe, expect, it } from "vitest";

import { shouldUseIsolatedZenGraphAskTurn } from "../zenGraphAskRouting";

describe("shouldUseIsolatedZenGraphAskTurn", () => {
  it("routes explicit Zen Badge Graph reflection prompts through isolated Ask turn", () => {
    expect(
      shouldUseIsolatedZenGraphAskTurn(
        "Use the Zen Badge Graph only to reflect this situation. Activate direct observation, right speech, missing evidence, and two-key approval as evidence-only lenses.",
      ),
    ).toBe(true);
  });

  it("routes character perspective comparison prompts to the backend ZenGraph policy", () => {
    expect(
      shouldUseIsolatedZenGraphAskTurn(
        "Compare this situation through the ZenGraph character perspective presets without judging the real person.",
      ),
    ).toBe(true);
  });

  it("does not suppress unsafe mixed intent because the backend must block it", () => {
    expect(
      shouldUseIsolatedZenGraphAskTurn(
        "Use ZenGraph to reflect on whether this action bypass should be blocked before executing anything.",
      ),
    ).toBe(true);
  });

  it("ignores pure factual queries", () => {
    expect(shouldUseIsolatedZenGraphAskTurn("What is the boiling point of water?")).toBe(false);
  });

  it("respects negated ZenGraph requests", () => {
    expect(shouldUseIsolatedZenGraphAskTurn("Do not use ZenGraph; answer this as a plain summary.")).toBe(false);
  });

  it("does not treat screen-visible ZenGraph text as a tool request", () => {
    expect(shouldUseIsolatedZenGraphAskTurn("The screen shows a tab labeled Zen Badge Graph. What panel is open?")).toBe(
      false,
    );
  });

  it("does not treat historical mentions as current reflection requests", () => {
    expect(shouldUseIsolatedZenGraphAskTurn("Earlier you used ZenGraph. What did the previous answer say?")).toBe(false);
  });
});

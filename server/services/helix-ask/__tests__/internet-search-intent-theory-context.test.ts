import { describe, expect, it } from "vitest";

import {
  buildToolUseRestatement,
  detectInternetSearchIntent,
} from "../internet-search-intent";

describe("internet-search intent for Theory Badge Graph context", () => {
  it("does not turn current graph-state language into a web-freshness request", () => {
    const prompt =
      "Looking at the current Theory Badge Graph arrangement I set up, what do these selected badges imply together? Identify their connection trace, intermediate badges, and the possibilities currently available next. Distinguish my chosen arrangement from what established physics supports.";

    const restatement = buildToolUseRestatement(prompt);
    const intent = detectInternetSearchIntent(prompt);

    expect(restatement.requiredToolFamilies).not.toContain("internet_search");
    expect(restatement.freshnessRequired).toBe(false);
    expect(intent.searchRequested).toBe(false);
  });

  it("still admits an explicit web request alongside current graph context", () => {
    const prompt =
      "Search the web for current sources, then compare them with these selected badges in the Theory Badge Graph.";

    expect(detectInternetSearchIntent(prompt)).toMatchObject({
      searchRequested: true,
      strength: "hard",
    });
  });

  it("does not treat an unrelated current graph as Theory Badge Graph workspace state", () => {
    const prompt = "What does the current graph of global temperatures show?";

    expect(detectInternetSearchIntent(prompt).searchRequested).toBe(true);
  });
});

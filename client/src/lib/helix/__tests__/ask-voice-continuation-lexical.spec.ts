import { describe, expect, it } from "vitest";
import {
  extractIntentTerms,
  extractLatestContinuationQuestionFocus,
  hasDanglingTurnTail,
  hasSufficientLexicalCarryover,
  isLikelyNearTurnContinuation,
  isLowInformationTailTranscript,
} from "../ask-voice-continuation-lexical";

describe("ask voice continuation lexical helpers", () => {
  it("extracts stable intent terms with a cap", () => {
    expect(extractIntentTerms("Current NHM2 whitepaper: compare verified claims", 3)).toEqual([
      "current",
      "nhm2",
      "whitepaper",
    ]);
  });

  it("detects dangling turn tails", () => {
    expect(hasDanglingTurnTail("the virtual particles of the energy density is the")).toBe(true);
    expect(hasDanglingTurnTail("quantum systems exhibit superposition.")).toBe(false);
  });

  it("classifies low-information tails without suppressing action words", () => {
    expect(isLowInformationTailTranscript("Friends.")).toBe(true);
    expect(isLowInformationTailTranscript("Define quantum system")).toBe(false);
  });

  it("extracts a latest continuation question focus", () => {
    expect(
      extractLatestContinuationQuestionFocus("Okay, define a system. So, what about a statistical quantum system?"),
    ).toBe("So, what about a statistical quantum system?");
    expect(extractLatestContinuationQuestionFocus("Just a single sentence?")).toBeNull();
  });

  it("requires at least two lexical carryover terms", () => {
    expect(hasSufficientLexicalCarryover("compare energy density now", "explain energy density comparison")).toBe(true);
    expect(hasSufficientLexicalCarryover("compare calculator result", "explain energy density comparison")).toBe(false);
  });

  it("detects near-turn continuations from deixis, connectors, or lexical carryover", () => {
    expect(isLikelyNearTurnContinuation({ transcript: "where is that from", priorUserTurn: "Open the paper" })).toBe(true);
    expect(isLikelyNearTurnContinuation({ transcript: "and compare energy density", priorUserTurn: "Explain energy density" })).toBe(true);
    expect(
      isLikelyNearTurnContinuation({
        transcript: "compare energy density now",
        priorUserTurn: "explain energy density comparison",
      }),
    ).toBe(true);
    expect(isLikelyNearTurnContinuation({ transcript: "new unrelated topic", priorUserTurn: "explain energy density" })).toBe(false);
  });
});

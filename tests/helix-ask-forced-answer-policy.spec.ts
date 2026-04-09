import { describe, expect, it } from "vitest";

import {
  isHelixAskClarifyForcedShortCircuitRule,
  isHelixAskConceptForcedShortCircuitRule,
  isHelixAskHardForcedShortCircuitRule,
  renderHelixAskSimpleCompositionalAnswer,
  shouldFastPathFinalizeHelixAskForcedAnswer,
  shouldPreserveHelixAskForcedAnswerAcrossComposer,
  shouldPreserveHelixAskForcedAnswerAcrossFinalizer,
} from "../server/services/helix-ask/policy/forced-answer";

describe("helix ask forced answer policy", () => {
  it("renders simple composition prompts locally", () => {
    expect(renderHelixAskSimpleCompositionalAnswer("Say hello in one sentence.")).toBe("Hello.");
    expect(renderHelixAskSimpleCompositionalAnswer("Respond with ok")).toBe("Ok.");
  });

  it("fast-path finalizes hard forced answers only when they are structured enough", () => {
    expect(
      shouldFastPathFinalizeHelixAskForcedAnswer({
        shouldShortCircuitAnswer: true,
        fallbackAnswer:
          "Lead with the direct answer.\n\nSources: docs/helix-ask-flow.md, docs/helix-ask-agent-policy.md",
        forcedAnswerIsHard: true,
        forcedRule: "forcedAnswer:simple_composition",
        conceptFastPath: false,
        isIdeologyReferenceIntent: false,
        verbosity: "brief",
      }),
    ).toBe(true);
    expect(
      shouldFastPathFinalizeHelixAskForcedAnswer({
        shouldShortCircuitAnswer: true,
        fallbackAnswer: "Lead with the direct answer.",
        forcedAnswerIsHard: true,
        forcedRule: "forcedAnswer:simple_composition",
        conceptFastPath: false,
        isIdeologyReferenceIntent: false,
        verbosity: "brief",
      }),
    ).toBe(false);
  });

  it("preserves only the intended forced-answer categories across composer and finalizer", () => {
    expect(isHelixAskHardForcedShortCircuitRule("forcedAnswer:concept_short_definition")).toBe(
      true,
    );
    expect(isHelixAskConceptForcedShortCircuitRule("forcedAnswer:concept")).toBe(true);
    expect(isHelixAskClarifyForcedShortCircuitRule("forcedAnswer:pre_intent_clarify")).toBe(
      true,
    );
    expect(
      shouldPreserveHelixAskForcedAnswerAcrossComposer({
        forcedAnswerPinned: true,
        forcedRule: "forcedAnswer:concept_short_definition",
      }),
    ).toBe(true);
    expect(
      shouldPreserveHelixAskForcedAnswerAcrossFinalizer({
        forcedAnswerPinned: true,
        forcedRule: "forcedAnswer:concept_short_definition",
      }),
    ).toBe(false);
  });
});

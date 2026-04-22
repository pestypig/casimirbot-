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
    expect(
      shouldFastPathFinalizeHelixAskForcedAnswer({
        shouldShortCircuitAnswer: true,
        fallbackAnswer: "Hello! How can I assist you today?",
        forcedAnswerIsHard: true,
        forcedRule: "forcedAnswer:smalltalk_fast_path",
        conceptFastPath: false,
        isIdeologyReferenceIntent: false,
        verbosity: "brief",
      }),
    ).toBe(true);
  });

  it("preserves only the intended forced-answer categories across composer and finalizer", () => {
    expect(isHelixAskHardForcedShortCircuitRule("forcedAnswer:concept_short_definition")).toBe(
      true,
    );
    expect(
      isHelixAskHardForcedShortCircuitRule("forcedAnswer:pre_intent_microplanner_answer"),
    ).toBe(true);
    expect(isHelixAskHardForcedShortCircuitRule("forcedAnswer:smalltalk_fast_path")).toBe(true);
    expect(isHelixAskConceptForcedShortCircuitRule("forcedAnswer:concept")).toBe(true);
    expect(isHelixAskClarifyForcedShortCircuitRule("forcedAnswer:pre_intent_clarify")).toBe(
      true,
    );
    expect(
      isHelixAskClarifyForcedShortCircuitRule("forcedAnswer:pre_intent_clarify_deictic"),
    ).toBe(true);
    expect(
      shouldPreserveHelixAskForcedAnswerAcrossComposer({
        forcedAnswerPinned: true,
        forcedRule: "forcedAnswer:concept_short_definition",
      }),
    ).toBe(true);
    expect(
      shouldPreserveHelixAskForcedAnswerAcrossFinalizer({
        forcedAnswerPinned: true,
        forcedRule: "forcedAnswer:pre_intent_microplanner_answer",
      }),
    ).toBe(true);
    expect(
      shouldPreserveHelixAskForcedAnswerAcrossFinalizer({
        forcedAnswerPinned: true,
        forcedRule: "forcedAnswer:smalltalk_fast_path",
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

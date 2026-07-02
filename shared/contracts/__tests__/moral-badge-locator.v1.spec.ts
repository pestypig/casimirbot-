import { describe, expect, it } from "vitest";
import {
  buildMoralBadgeLocatorV1,
  isMoralBadgeLocatorV1,
  validateMoralBadgeLocatorV1,
} from "../moral-badge-locator.v1";

function buildLocator() {
  return buildMoralBadgeLocatorV1({
    generatedAt: "2026-06-01T00:00:00.000Z",
    locatorId: "moral-badge-locator:test",
    input: {
      kind: "user_prompt",
      summary: "Use right speech before action.",
      refs: ["turn:test"],
    },
    graph: {
      graphId: "moral-graph",
      rootId: "wisdom-first-principles",
      source: "docs/ethos/ideology.json",
    },
    locatedBadges: {
      exact: [
        {
          nodeId: "right-speech-and-accurate-formulation",
          label: "Right Speech and Accurate Formulation",
          confidence: 0.9,
          matchType: "label",
          pathToBinding: ["right-speech-and-accurate-formulation", "wisdom-first-principles"],
          proceduralExpression:
            "principle.right-speech-and-accurate-formulation constrains result.procedural_posture",
          reasonCodes: ["moral_badge_locator", "match_type:label"],
          tags: ["first_principle", "right_speech"],
        },
      ],
      likely: [],
      inferred: [],
    },
    locatedBindings: [
      {
        id: "wisdom-first-principles",
        label: "Wisdom First Principles",
        bindingType: "objective_binding",
        pathNodeIds: ["right-speech-and-accurate-formulation", "wisdom-first-principles"],
        reasonCodes: ["located_path_to_binding"],
        confidence: 0.9,
      },
    ],
    comparisonSeed: {
      selectedNodeIds: ["right-speech-and-accurate-formulation", "wisdom-first-principles"],
      proceduralExpression:
        "principle.right-speech-and-accurate-formulation constrains result.procedural_posture => constrained_action_posture",
      expectedFruitionPosture: "constrained_action_posture",
      reasonCodes: ["moral_badge_locator", "deterministic_badge_comparison"],
    },
  });
}

describe("moral_badge_locator/v1 contract", () => {
  it("builds a valid evidence-only locator artifact", () => {
    const locator = buildLocator();

    expect(validateMoralBadgeLocatorV1(locator)).toEqual([]);
    expect(isMoralBadgeLocatorV1(locator)).toBe(true);
    expect(locator).toMatchObject({
      artifactId: "moral_badge_locator",
      schemaVersion: "moral_badge_locator/v1",
      authority: {
        assistant_answer: false,
        raw_content_included: false,
        terminal_eligible: false,
        context_role: "tool_policy",
        ask_context_policy: "evidence_only",
        agent_executable: false,
      },
    });
  });

  it("rejects executable authority", () => {
    const locator = buildLocator();

    expect(validateMoralBadgeLocatorV1({ ...locator, authority: { ...locator.authority, agent_executable: true } })).toEqual(
      expect.arrayContaining(["authority.agent_executable must be false"]),
    );
  });

  it("requires valid located badge match types", () => {
    const locator = buildLocator();
    const invalid = {
      ...locator,
      locatedBadges: {
        ...locator.locatedBadges,
        exact: [{ ...locator.locatedBadges.exact[0], matchType: "moral_verdict" }],
      },
    };

    expect(validateMoralBadgeLocatorV1(invalid)).toEqual(
      expect.arrayContaining(["locatedBadges.exact[0].matchType is invalid"]),
    );
  });
});

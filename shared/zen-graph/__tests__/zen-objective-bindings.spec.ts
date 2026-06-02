import { describe, expect, it } from "vitest";
import { buildZenBadgeLocatorV1 } from "../../zen-badge-locator";
import {
  isZenObjectiveBindingV1,
  validateZenObjectiveBindingV1,
} from "../../contracts/zen-objective-binding.v1";
import { REINHARD_VON_LOHENGRAMM_PROFILE } from "../character-profiles/reinhard-von-lohengramm";
import {
  buildCharacterPresetObjectiveBindingV1,
  buildSituationObjectiveBindingFromLocatorV1,
  buildWisdomPresetObjectiveBindingV1,
} from "../zen-objective-bindings";

function locatorFixture() {
  return buildZenBadgeLocatorV1({
    locatorId: "zen-badge-locator:objective-binding-test",
    input: {
      kind: "user_prompt",
      summary: "A user asks how to handle a conflict with uncertain evidence.",
      refs: ["prompt:test"],
    },
    graph: {
      graphId: "zen-graph",
      rootId: "wisdom-first-principles",
      source: "docs/ethos/ideology.json",
    },
    locatedBadges: {
      exact: [
        {
          nodeId: "direct-observation-before-claim",
          label: "Direct Observation Before Claim",
          confidence: 0.96,
          matchType: "label",
          pathToBinding: ["direct-observation-before-claim", "wisdom-first-principles"],
          proceduralExpression: "observation.supports.claim_boundary",
          reasonCodes: ["label_match"],
          tags: ["observation"],
        },
      ],
      likely: [
        {
          nodeId: "skillful-action-under-uncertainty",
          label: "Skillful Action Under Uncertainty",
          confidence: 0.74,
          matchType: "keyword_overlap",
          pathToBinding: ["skillful-action-under-uncertainty", "wisdom-first-principles"],
          proceduralExpression: "uncertainty.requires.review",
          reasonCodes: ["missing_risk_context"],
          tags: ["uncertainty", "review"],
        },
      ],
      inferred: [],
    },
    locatedBindings: [],
    comparisonSeed: {
      selectedNodeIds: ["direct-observation-before-claim", "skillful-action-under-uncertainty"],
      proceduralExpression: "observation + uncertainty => requires_check",
      expectedFruitionPosture: "requires_check",
      reasonCodes: ["zen_badge_locator", "missing_badge_match"],
    },
  });
}

describe("ZenObjectiveBindingV1 resolvers", () => {
  it("resolves a wisdom preset into ZenObjectiveBindingV1", () => {
    const binding = buildWisdomPresetObjectiveBindingV1();

    expect(validateZenObjectiveBindingV1(binding)).toEqual([]);
    expect(isZenObjectiveBindingV1(binding)).toBe(true);
    expect(binding.artifact).toBe("zen_objective_binding");
    expect(binding.version).toBe("v1");
    expect(binding.subject.kind).toBe("wisdom_preset");
    expect(binding.bindings.map((entry) => entry.principleId)).toContain("direct-observation-before-claim");
    expect(binding.bindings.every((entry) => entry.source === "ideology_tree")).toBe(true);
  });

  it("resolves a character preset into ZenObjectiveBindingV1 without creating a special character graph", () => {
    const binding = buildCharacterPresetObjectiveBindingV1(REINHARD_VON_LOHENGRAMM_PROFILE);

    expect(validateZenObjectiveBindingV1(binding)).toEqual([]);
    expect(binding.subject.kind).toBe("character_preset");
    expect(binding.subject.label).toBe("Reinhard von Lohengramm");
    expect(binding.objectiveState.label).toMatch(/character perspective preset/i);
    expect(binding.bindings.map((entry) => entry.badgeId)).toEqual(
      expect.arrayContaining(["direct-observation-before-claim", "sovereign-ambition"]),
    );
    expect(binding.bindings.every((entry) => entry.source === "preset")).toBe(true);
    expect(binding.trace[0]?.reason).toMatch(/not a separate graph/i);
  });

  it("resolves a situation locator into ZenObjectiveBindingV1", () => {
    const binding = buildSituationObjectiveBindingFromLocatorV1(locatorFixture());

    expect(validateZenObjectiveBindingV1(binding)).toEqual([]);
    expect(binding.subject.kind).toBe("user_prompt");
    expect(binding.subject.refs).toEqual(["prompt:test"]);
    expect(binding.objectiveState.label).toBe("Situation objective binding");
    expect(binding.bindings.map((entry) => entry.badgeId)).toEqual([
      "direct-observation-before-claim",
      "skillful-action-under-uncertainty",
    ]);
    expect(binding.bindings.map((entry) => entry.source)).toEqual(["exact", "inferred"]);
  });

  it("preserves missing evidence in situation bindings", () => {
    const binding = buildSituationObjectiveBindingFromLocatorV1(locatorFixture());

    expect(binding.missingEvidence.map((entry) => entry.id)).toEqual(
      expect.arrayContaining(["missing_badge_match", "missing_risk_context"]),
    );
    expect(binding.missingEvidence.every((entry) => entry.requiredFor === "zen-badge-locator:objective-binding-test")).toBe(
      true,
    );
  });

  it("keeps authorityBoundary evidence-only", () => {
    const binding = buildWisdomPresetObjectiveBindingV1();

    expect(binding.authorityBoundary).toEqual({
      assistant_answer: false,
      raw_content_included: false,
      terminal_eligible: false,
      context_role: "tool_policy",
      ask_context_policy: "evidence_only",
      agent_executable: false,
    });
  });

  it("does not let character presets imply character judgment or moral finality", () => {
    const binding = buildCharacterPresetObjectiveBindingV1(REINHARD_VON_LOHENGRAMM_PROFILE);

    expect(binding.claimBoundaries).toEqual({
      diagnosticOnly: true,
      avoidCharacterJudgment: true,
      avoidMoralFinality: true,
      requiresUserConsentForAction: true,
    });
    expect(binding.authorityBoundary.assistant_answer).toBe(false);
    expect(binding.authorityBoundary.agent_executable).toBe(false);
  });
});

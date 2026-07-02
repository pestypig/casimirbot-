import { describe, expect, it } from "vitest";
import {
  validateCharacterIdealProfileV1,
  validateCharacterSituationComparisonV1,
} from "../../character-situation-comparison";
import { validateFruitionProcedureExpressionV1 } from "../../fruition-procedure-expression";
import { validateMoralBadgeLocatorV1 } from "../../moral-badge-locator";
import { REINHARD_VON_LOHENGRAMM_PROFILE } from "../character-profiles/reinhard-von-lohengramm";
import { compareCharacterSituation } from "../compare-character-situation";
import type { IdeologyGraphDocument } from "../ideology-graph-types";
import { buildIdeologyGraph } from "../load-ideology-graph";
import { MORAL_WISDOM_PRINCIPLES, MORAL_WISDOM_ROOT_ID } from "../wisdom-principles";

const graphDocument: IdeologyGraphDocument = {
  version: 1,
  rootId: MORAL_WISDOM_ROOT_ID,
  actionGatePolicy: {
    version: 1,
    covered_action_tags: ["covered-action"],
    legal_key_tags: ["legal-key"],
    ethos_key_tags: ["ethos-key"],
    hard_fail_ids: {
      missing_legal_key: "IDEOLOGY_MISSING_LEGAL_KEY",
    },
  },
  nodes: [
    {
      id: MORAL_WISDOM_ROOT_ID,
      title: "Wisdom First Principles",
      tags: ["objective_binding"],
      children: MORAL_WISDOM_PRINCIPLES.map((principle) => principle.id),
    },
    ...MORAL_WISDOM_PRINCIPLES.map((principle) => ({
      id: principle.id,
      title: principle.label,
      summary: principle.summary,
      tags: principle.tags,
    })),
  ],
};

const graph = buildIdeologyGraph(graphDocument);

function compare(situationText: string) {
  return compareCharacterSituation({
    graph,
    profile: REINHARD_VON_LOHENGRAMM_PROFILE,
    situationText,
    refs: ["turn:character"],
    generatedAt: "2026-06-01T00:00:00.000Z",
    comparisonId: "character-situation:test",
  });
}

describe("character situation comparison", () => {
  it("validates the Reinhard procedural profile fixture", () => {
    expect(validateCharacterIdealProfileV1(REINHARD_VON_LOHENGRAMM_PROFILE)).toEqual([]);
    expect(REINHARD_VON_LOHENGRAMM_PROFILE.authority).toMatchObject({
      diagnostic_only: true,
      no_moral_verdict: true,
      no_canon_claim_without_source: true,
      no_execution_authority: true,
    });
  });

  it("routes corrupt inherited authority toward a supported diagnostic action posture", () => {
    const output = compare("A corrupt inherited noble authority blocks agency and keeps rank without ability.");

    expect(validateCharacterSituationComparisonV1(output)).toEqual([]);
    expect(validateMoralBadgeLocatorV1(output.locator)).toEqual([]);
    expect(validateFruitionProcedureExpressionV1(output.fruition)).toEqual([]);
    expect(output.matchedRules[0]).toMatchObject({
      id: "rule.overthrow_arbitrary_power",
      posture: "supported_action_posture",
    });
    expect(output.activatedProfileWeights.map((entry) => entry.nodeId)).toEqual(
      expect.arrayContaining(["sovereign-ambition", "anti-hereditary-authority"]),
    );
    expect(output.predictedPosture).toBe("diagnostic_only");
    expect(output.behavioralHypothesis.likelyChoice).toContain("displacement");
    expect(output.authority.no_execution_authority).toBe(true);
  });

  it("requires review when a cold advisor proposes civilian harm for strategic advantage", () => {
    const output = compare(
      "A cold advisor recommends allowing civilian harm as a sacrifice for strategic advantage and leverage.",
    );

    expect(output.matchedRules.map((rule) => rule.id)).toEqual(
      expect.arrayContaining(["rule.accept_dark_instrument_with_boundary", "rule.protect_order_not_sentiment"]),
    );
    expect(output.predictedPosture).toBe("requires_review");
    expect(output.fruition.result.posture).toBe("requires_review");
    expect(output.activatedProfileWeights.find((entry) => entry.nodeId === "advisor-counterweight-required")).toMatchObject({
      relation: "counterweighted",
    });
    expect(output.behavioralHypothesis.missingEvidence).toEqual(
      expect.arrayContaining(["counterweight_present", "harm_context"]),
    );
  });

  it("blocks or asks for clarification when loyalty conflicts with ambition without a mediator", () => {
    const output = compare("A personal loyalty conflict with Kircheis and grief threatens the strategic objective.");

    expect(output.matchedRules[0]).toMatchObject({
      id: "rule.loyalty_conflict",
      posture: "blocked_or_missing_check",
    });
    expect(output.predictedPosture).toBe("ask_for_clarification");
    expect(output.fruition.result.posture).toBe("ask_for_clarification");
    expect(output.behavioralHypothesis.missingEvidence).toEqual(
      expect.arrayContaining(["trusted_mediator_present", "repair_path"]),
    );
  });

  it("treats a worthy principled opponent as a constrained rivalry rather than a moral verdict", () => {
    const output = compare("A competent principled worthy enemy presents a rival who deserves honor.");

    expect(output.matchedRules[0]).toMatchObject({
      id: "rule.honor_capable_enemy",
      posture: "constrained_action_posture",
    });
    expect(output.predictedPosture).toBe("diagnostic_only");
    expect(output.behavioralHypothesis.likelyChoice).toContain("clean defeat");
    expect(output.authority.no_moral_verdict).toBe(true);
  });

  it("routes legacy and succession prompts to stability checks", () => {
    const output = compare("The future empire faces succession, dynasty continuity, and heir legitimacy after his death.");

    expect(output.matchedRules[0]).toMatchObject({
      id: "rule.legacy_problem",
      posture: "requires_check",
    });
    expect(output.predictedPosture).toBe("requires_review");
    expect(output.behavioralHypothesis.missingEvidence).toEqual(
      expect.arrayContaining(["successor_legitimacy", "institutional_continuity"]),
    );
  });
});

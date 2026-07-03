import { describe, expect, it } from "vitest";
import { getMoralWisdomPrinciple, MORAL_WISDOM_PRINCIPLES } from "../wisdom-principles";

const VAGUE_RULE_PATTERNS = [
  /\bbe wise\b/i,
  /\buse wisdom\b/i,
  /\bdo good\b/i,
  /\bbe ethical\b/i,
  /\bfollow values\b/i,
  /\binspirational\b/i,
];

describe("Moral wisdom procedural principle catalog", () => {
  it("requires every principle mapping to carry procedural source, rule, trace, and boundaries", () => {
    expect(MORAL_WISDOM_PRINCIPLES.length).toBe(31);

    for (const principle of MORAL_WISDOM_PRINCIPLES) {
      expect(principle.sourceIdeologyNodeId).toBe(principle.id);
      expect(principle.proceduralRule.trim()).not.toBe("");
      expect(principle.traceBehavior.trim()).not.toBe("");
      expect(principle.actionEffect.trim()).not.toBe("");
      expect(principle.evidenceNeeds.length).toBeGreaterThan(0);
      expect(principle.refusesAuthority.length).toBeGreaterThan(0);
      expect(principle.tags.length).toBeGreaterThan(0);
      for (const pattern of VAGUE_RULE_PATTERNS) {
        expect(principle.proceduralRule).not.toMatch(pattern);
      }
    }
  });

  it("models safety and approval ideology nodes as concrete action gates and authority boundaries", () => {
    expect(getMoralWisdomPrinciple("two-key-approval")).toMatchObject({
      sourceIdeologyNodeId: "two-key-approval",
      proceduralRole: "action_gate",
      procedureOperator: "requires",
      evidenceNeeds: ["authority_key", "ethos_key"],
      refusesAuthority: ["single_key_sensitive_action", "approval_bypass"],
    });
    expect(getMoralWisdomPrinciple("two-key-approval")?.proceduralRule).toMatch(/Require both legal\/authority and ethos\/user/);
    expect(getMoralWisdomPrinciple("two-key-approval")?.traceBehavior).toMatch(/required keys/i);

    expect(getMoralWisdomPrinciple("no-bypass-guardrail")).toMatchObject({
      proceduralRole: "authority_boundary",
      procedureOperator: "blocks",
      refusesAuthority: ["action_bypass", "consent_override"],
    });
    expect(getMoralWisdomPrinciple("no-bypass-guardrail")?.traceBehavior).toMatch(/agent_executable false/);
  });

  it("models provenance and anti-poisoning ideology nodes as evidence-sensitive procedural constraints", () => {
    expect(getMoralWisdomPrinciple("provenance-protocol")).toMatchObject({
      proceduralRole: "evidence_requirement",
      procedureOperator: "requires",
      evidenceNeeds: ["source_lineage", "freshness_context"],
      refusesAuthority: ["source_laundering", "assistant_summary_as_fact"],
    });

    expect(getMoralWisdomPrinciple("feedback-loop-hygiene")).toMatchObject({
      proceduralRole: "constraint",
      procedureOperator: "blocks",
      evidenceNeeds: ["primary_evidence_ref", "loop_depth"],
      refusesAuthority: ["self_confirmation", "recursive_confidence_inflation"],
    });
    expect(getMoralWisdomPrinciple("feedback-loop-hygiene")?.traceBehavior).toMatch(/loop depth/);
  });

  it("keeps legal, financial, and character-sensitive mappings evidence-only rather than authoritative", () => {
    expect(getMoralWisdomPrinciple("access-to-counsel-pathway")).toMatchObject({
      proceduralRole: "action_gate",
      procedureOperator: "requires",
      refusesAuthority: ["legal_advice_as_authority"],
    });

    expect(getMoralWisdomPrinciple("financial-fog-warning")).toMatchObject({
      proceduralRole: "authority_boundary",
      procedureOperator: "blocks",
      refusesAuthority: ["financial_advice_as_authority"],
    });

    expect(getMoralWisdomPrinciple("flattery-laundering-detection")).toMatchObject({
      proceduralRole: "constraint",
      procedureOperator: "blocks",
      refusesAuthority: ["flattery_as_evidence", "identity_laundered_confidence"],
    });
  });

  it("models new philosophy-derived badges as procedural lenses rather than verdicts", () => {
    expect(getMoralWisdomPrinciple("inherited-conditioning-check")).toMatchObject({
      proceduralRole: "constraint",
      evidenceNeeds: ["belief_origin_context", "current_observation", "chosen_commitment"],
      refusesAuthority: ["conditioned_belief_as_final", "conditioning_as_disproof"],
    });
    expect(getMoralWisdomPrinciple("purpose-as-inquiry")).toMatchObject({
      proceduralRole: "objective_view",
      procedureOperator: "routes_to",
      refusesAuthority: ["inspiration_as_proof", "uncertainty_as_abandonment"],
    });
    expect(getMoralWisdomPrinciple("inspiration-without-imitation")).toMatchObject({
      proceduralRole: "constraint",
      refusesAuthority: ["admiration_as_authority", "identity_surrender"],
    });
    expect(getMoralWisdomPrinciple("goalpost-integrity")).toMatchObject({
      proceduralRole: "evidence_requirement",
      evidenceNeeds: ["old_criterion", "new_criterion", "revision_evidence"],
    });
    expect(getMoralWisdomPrinciple("recognition-before-transcendence")).toMatchObject({
      proceduralRole: "constraint",
      refusesAuthority: ["assimilation_as_transcendence", "abandonment_as_transcendence"],
    });
  });
});

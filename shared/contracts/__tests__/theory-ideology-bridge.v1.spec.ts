import { describe, expect, it } from "vitest";
import {
  buildTheoryIdeologyBridgeV1,
  isTheoryIdeologyBridgeV1,
  validateTheoryIdeologyBridgeV1,
  type TheoryIdeologyBridgeV1,
} from "../theory-ideology-bridge.v1";

function baseBridge(
  overrides: Partial<Parameters<typeof buildTheoryIdeologyBridgeV1>[0]> = {},
): TheoryIdeologyBridgeV1 {
  return buildTheoryIdeologyBridgeV1({
    generatedAt: "2026-06-05T00:00:00.000Z",
    bridgeId: "theory-ideology-bridge:test",
    sourceTheoryReflectionId: "theory-context-reflection:test",
    sourceIdeologyReflectionId: "ideology-context-reflection:test",
    inputs: {
      prompt:
        "Reflect entropy, conservation, self-organization, fairness, and Moral due process without overclaiming.",
      objective: "Build an evidence-only procedural bridge.",
      refs: ["turn:test", "theory:entropy", "ideology:fairness"],
    },
    links: [
      {
        id: "bridge:observation-to-direct-observation",
        theoryBadgeIds: ["theory.observation_boundary"],
        theoryLabels: ["Observation boundary"],
        ideologyNodeIds: ["direct-observation-before-claim"],
        ideologyLabels: ["Direct Observation Before Claim"],
        relation: "requires_evidence",
        explanation:
          "Incomplete observation on the theory side maps to a Moral requirement to separate observation from interpretation.",
        proceduralEffect:
          "Ask for missing evidence and preserve uncertainty before claim formulation.",
        confidence: 0.84,
        evidenceRefs: ["theory:entropy", "ideology:direct-observation"],
        missingEvidence: ["observation_refs"],
        refusesAuthority: ["moral_finality", "execution_authority"],
        reasonCodes: ["incomplete_observation", "direct_observation_required"],
      },
      {
        id: "bridge:entropy-to-revision",
        theoryBadgeIds: ["theory.entropy_drift"],
        theoryLabels: ["Entropy and drift"],
        ideologyNodeIds: ["impermanence-entropy-and-revision"],
        ideologyLabels: ["Impermanence, Entropy, and Revision"],
        relation: "constrains",
        explanation:
          "Drift risk constrains confidence and routes the posture toward revision checks.",
        proceduralEffect:
          "Require a revision trigger when evidence, context, or system state changes.",
        confidence: 0.78,
        evidenceRefs: ["theory:entropy", "ideology:revision"],
        refusesAuthority: ["permanent_certainty"],
        reasonCodes: ["drift_risk", "revision_required"],
      },
      {
        id: "bridge:conservation-to-due-process",
        theoryBadgeIds: ["theory.boundary_conditions", "theory.conservation_constraint"],
        theoryLabels: ["Boundary conditions", "Conservation constraint"],
        ideologyNodeIds: ["fairness-due-process-and-justification"],
        ideologyLabels: ["Fairness, Due Process, and Justification"],
        relation: "analogy_only",
        explanation:
          "Boundary and conservation language can illuminate contestability and role boundaries, but it remains an analogy.",
        proceduralEffect:
          "Require jurisdiction context and contestability before any actionable posture.",
        confidence: 0.62,
        evidenceRefs: ["theory:boundary", "ideology:due-process"],
        missingEvidence: ["jurisdiction_context", "contestability_path"],
        refusesAuthority: [
          "moral_finality",
          "physics_derived_moral_certainty",
          "execution_permission",
        ],
        reasonCodes: ["analogy_only", "due_process_required"],
      },
    ],
    missingEvidence: ["observation_refs", "jurisdiction_context", "contestability_path"],
    recommendedActions: [
      {
        id: "bridge-action:ask-for-observation-refs",
        type: "ask_for_missing_evidence",
        label: "Ask for missing observation refs before increasing confidence.",
        reasonCodes: ["missing_observation_refs", "evidence_only_bridge"],
      },
      {
        id: "bridge-action:preserve-uncertainty",
        type: "preserve_uncertainty",
        label: "Preserve uncertainty and avoid moral finality.",
        description:
          "Use the bridge as procedural context for the next model synthesis, not as a terminal conclusion.",
        reasonCodes: ["overclaim_guard", "terminal_authority_false"],
      },
    ],
    ...overrides,
  });
}

describe("theory ideology bridge v1", () => {
  it("builds a valid evidence-only bridge artifact", () => {
    const bridge = baseBridge();

    expect(validateTheoryIdeologyBridgeV1(bridge)).toEqual([]);
    expect(isTheoryIdeologyBridgeV1(bridge)).toBe(true);
    expect(bridge.artifactId).toBe("theory_ideology_bridge");
    expect(bridge.schemaVersion).toBe("theory_ideology_bridge/v1");
    expect(bridge.authority).toMatchObject({
      assistant_answer: false,
      raw_content_included: false,
      terminal_eligible: false,
      context_role: "tool_policy",
      ask_context_policy: "evidence_only",
      agent_executable: false,
      moral_finality: false,
      execution_permission: false,
      physics_proves_morality: false,
    });
  });

  it("represents theory-to-Moral procedural relations and analogy-only warnings", () => {
    const bridge = baseBridge();

    expect(bridge.links.map((link) => link.relation)).toEqual([
      "requires_evidence",
      "constrains",
      "analogy_only",
    ]);
    expect(bridge.links[2]).toMatchObject({
      theoryBadgeIds: ["theory.boundary_conditions", "theory.conservation_constraint"],
      ideologyNodeIds: ["fairness-due-process-and-justification"],
      refusesAuthority: [
        "moral_finality",
        "physics_derived_moral_certainty",
        "execution_permission",
      ],
    });
  });

  it("requires analogy-only links to refuse physics-derived certainty", () => {
    const bridge = baseBridge();
    const issues = validateTheoryIdeologyBridgeV1({
      ...bridge,
      links: [
        {
          ...bridge.links[2],
          refusesAuthority: ["moral_finality", "execution_permission"],
        },
      ],
    });

    expect(issues).toContain(
      "links[0].analogy_only links must refuse physics_derived_moral_certainty",
    );
  });

  it("rejects bridge overclaims and character verdict language", () => {
    const issues = validateTheoryIdeologyBridgeV1({
      ...baseBridge(),
      links: [
        {
          ...baseBridge().links[0],
          explanation: "physics proves morality and gives objective moral proof.",
        },
      ],
      recommendedActions: [
        {
          id: "bad-verdict",
          type: "verdict",
          label: "bad person",
        },
      ],
    });

    expect(issues.some((issue) => issue.includes("forbidden theory-ideology overclaim text"))).toBe(true);
  });

  it("rejects terminal and execution authority", () => {
    const issues = validateTheoryIdeologyBridgeV1({
      ...baseBridge(),
      authority: {
        ...baseBridge().authority,
        terminal_eligible: true,
        agent_executable: true,
        moral_finality: true,
        execution_permission: true,
        physics_proves_morality: true,
      },
    });

    expect(issues).toContain("authority.terminal_eligible must be false");
    expect(issues).toContain("authority.agent_executable must be false");
    expect(issues).toContain("authority.moral_finality must be false");
    expect(issues).toContain("authority.execution_permission must be false");
    expect(issues).toContain("authority.physics_proves_morality must be false");
  });

  it("rejects malformed bridge links", () => {
    const issues = validateTheoryIdeologyBridgeV1({
      ...baseBridge(),
      links: [
        {
          ...baseBridge().links[0],
          theoryBadgeIds: [],
          ideologyNodeIds: [],
          relation: "moral_proof",
          confidence: 1.2,
        },
      ],
    });

    expect(issues).toContain("links[0].theoryBadgeIds must contain at least one non-empty string");
    expect(issues).toContain("links[0].ideologyNodeIds must contain at least one non-empty string");
    expect(issues).toContain("links[0].relation is invalid");
    expect(issues).toContain("links[0].confidence must be between 0 and 1");
  });
});

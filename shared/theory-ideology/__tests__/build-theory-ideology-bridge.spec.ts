import { describe, expect, it } from "vitest";
import { buildTheoryContextReflectionV1 } from "../../contracts/theory-context-reflection.v1";
import { buildIdeologyContextReflectionV1 } from "../../ideology-context-reflection";
import {
  buildTheoryIdeologyBridgeFromReflections,
} from "../build-theory-ideology-bridge";
import { validateTheoryIdeologyBridgeV1 } from "../../theory-ideology-bridge";

const generatedAt = "2026-06-05T00:00:00.000Z";

function baseTheoryReflection(
  text = "observation provenance falsifiability",
  badgeId = "theory.observation-evidence",
  title = "Observation Evidence",
) {
  return buildTheoryContextReflectionV1({
    generatedAt,
    reflectionId: "theory-context-reflection:test",
    graphId: "theory-badge-graph:test",
    input: {
      prompt: text,
      conversationContext: null,
      mentionedEquations: [],
      mentionedSymbols: [],
      mentionedDomains: [],
      source: "helix_ask",
      confidenceMode: "soft_locator",
    },
    exactMatches: [
      {
        badgeId,
        title,
        score: 0.92,
        reasons: [text],
        matchedSymbols: [],
        matchedEquationFamilies: [],
        matchedRepoPaths: [],
        claimBoundaryNotes: [`Claim note: ${text}`],
      },
    ],
    likelyMatches: [],
    inferredDomains: [],
    overlay: {
      centerBadgeIds: [badgeId],
      highlightedBadgeIds: [badgeId],
      highlightedEdgeIds: [],
      heatByBadgeId: { [badgeId]: 0.92 },
      exactBadgeIds: [badgeId],
      likelyBadgeIds: [],
      softRegion: null,
    },
    evidenceForAsk: {
      summary: text,
      claimBoundaries: [`Claim note: ${text}`],
      recommendedNextActions: [],
    },
  });
}

function baseIdeologyReflection(nodeId = "direct-observation-before-claim", label = "Direct Observation Before Claim") {
  return buildIdeologyContextReflectionV1({
    generatedAt,
    reflectionId: "ideology-context-reflection:test",
    graph: {
      graphId: "moral-graph:test",
      rootId: "wisdom-first-principles",
      source: "docs/ethos/ideology.json",
    },
    input: {
      kind: "user_prompt",
      summary: "Reflect through observation, fairness, and review.",
      refs: ["turn:test"],
    },
    matches: {
      exact: [
        {
          nodeId,
          label,
          score: 0.9,
          reasons: [nodeId, label],
          tags: ["lens"],
          pathToRoot: ["wisdom-first-principles", nodeId],
        },
      ],
      likely: [],
      inferred_lenses: [],
    },
    activated_traits: [
      {
        nodeId,
        label,
        confidence: 0.88,
        pathToRoot: ["wisdom-first-principles", nodeId],
        tags: ["trait"],
      },
    ],
    claim_boundaries: {
      diagnostic_only: true,
      avoid_character_judgment: true,
      needs_user_confirmation: true,
    },
    recommended_actions: [],
  });
}

describe("buildTheoryIdeologyBridgeFromReflections", () => {
  it("maps observation and provenance evidence to direct-observation Moral procedures", () => {
    const bridge = buildTheoryIdeologyBridgeFromReflections({
      generatedAt,
      bridgeId: "theory-ideology-bridge:observation",
      prompt: "Use observation and provenance before justice claims.",
      refs: ["turn:test"],
      theoryReflection: baseTheoryReflection(),
      ideologyReflection: baseIdeologyReflection(),
    });

    expect(validateTheoryIdeologyBridgeV1(bridge)).toEqual([]);
    expect(bridge.links).toHaveLength(1);
    expect(bridge.links[0]).toMatchObject({
      relation: "requires_evidence",
      theoryBadgeIds: ["theory.observation-evidence", "claim_boundary:1"],
      ideologyNodeIds: ["direct-observation-before-claim"],
    });
    expect(bridge.authority).toMatchObject({
      assistant_answer: false,
      terminal_eligible: false,
      agent_executable: false,
      moral_finality: false,
      physics_proves_morality: false,
    });
  });

  it("maps entropy and drift to revision posture", () => {
    const bridge = buildTheoryIdeologyBridgeFromReflections({
      generatedAt,
      bridgeId: "theory-ideology-bridge:entropy",
      prompt: "Entropy and drift should keep the procedure revisable.",
      theoryReflection: baseTheoryReflection(
        "entropy drift irreversibility",
        "theory.entropy-drift",
        "Entropy and Drift",
      ),
      ideologyReflection: baseIdeologyReflection(
        "impermanence-entropy-and-revision",
        "Impermanence, Entropy, and Revision",
      ),
    });

    expect(validateTheoryIdeologyBridgeV1(bridge)).toEqual([]);
    expect(bridge.links[0]).toMatchObject({
      relation: "constrains",
      ideologyNodeIds: ["impermanence-entropy-and-revision"],
    });
  });

  it("marks conservation and boundary mappings as analogy-only with authority refusal", () => {
    const bridge = buildTheoryIdeologyBridgeFromReflections({
      generatedAt,
      bridgeId: "theory-ideology-bridge:boundary",
      prompt: "Conservation and boundary constraints should inform fairness review.",
      theoryReflection: baseTheoryReflection(
        "conservation boundary stress_energy_conservation",
        "theory.boundary-constraint",
        "Boundary Constraint",
      ),
      ideologyReflection: baseIdeologyReflection(
        "fairness-due-process-and-justification",
        "Fairness, Due Process, and Justification",
      ),
    });

    expect(validateTheoryIdeologyBridgeV1(bridge)).toEqual([]);
    expect(bridge.links[0]).toMatchObject({
      relation: "analogy_only",
      refusesAuthority: [
        "moral_finality",
        "physics_derived_moral_certainty",
        "execution_permission",
      ],
    });
  });

  it("maps feedback loops and self-organization to feedback-loop hygiene", () => {
    const bridge = buildTheoryIdeologyBridgeFromReflections({
      generatedAt,
      bridgeId: "theory-ideology-bridge:feedback",
      prompt: "Self-organization and feedback loop risk should inform review posture.",
      theoryReflection: baseTheoryReflection(
        "feedback loop self_organization self-organization",
        "theory.feedback-loop",
        "Feedback Loop",
      ),
      ideologyReflection: baseIdeologyReflection(
        "feedback-loop-hygiene",
        "Feedback Loop Hygiene",
      ),
    });

    expect(validateTheoryIdeologyBridgeV1(bridge)).toEqual([]);
    expect(bridge.links[0]).toMatchObject({
      relation: "constrains",
      theoryBadgeIds: ["theory.feedback-loop", "claim_boundary:1"],
      ideologyNodeIds: ["feedback-loop-hygiene"],
    });
    expect(bridge.links[0].proceduralEffect).toContain(
      "Prevent self-confirming evidence loops",
    );
  });

  it("maps replicated coherence-window selection hypotheses to guarded transformation stewardship", () => {
    const bridge = buildTheoryIdeologyBridgeFromReflections({
      generatedAt,
      bridgeId: "theory-ideology-bridge:transformation-window",
      prompt:
        "If independently replicated, compare a boundary-sensitive coherence lifetime with the useful transformation timescale.",
      theoryReflection: baseTheoryReflection(
        "coherence lifetime dielectric environment useful transformation independent replication",
        "biology.evolution.boundary_sensitive_coherence_selection",
        "Boundary-Sensitive Coherence Selection Hypothesis",
      ),
      ideologyReflection: baseIdeologyReflection(
        "transformation-window-stewardship",
        "Transformation-Window Stewardship",
      ),
    });
    const link = bridge.links.find((entry) =>
      entry.ideologyNodeIds.includes("transformation-window-stewardship"),
    );

    expect(validateTheoryIdeologyBridgeV1(bridge)).toEqual([]);
    expect(link).toMatchObject({
      relation: "analogy_only",
      theoryBadgeIds: [
        "biology.evolution.boundary_sensitive_coherence_selection",
        "claim_boundary:1",
      ],
      ideologyNodeIds: ["transformation-window-stewardship"],
      refusesAuthority: [
        "moral_finality",
        "physics_derived_moral_certainty",
        "execution_permission",
      ],
    });
    expect(link?.proceduralEffect).toContain("Require independent replication");
    expect(link?.proceduralEffect).toContain("never treat persistence, fitness, heredity, or dominance as moral worth");
    expect(bridge.authority).toMatchObject({
      terminal_eligible: false,
      agent_executable: false,
      physics_proves_morality: false,
    });
  });

  it("keeps quoted, negated, and future coherence-window language non-executable and analogy-only", () => {
    const bridge = buildTheoryIdeologyBridgeFromReflections({
      generatedAt,
      bridgeId: "theory-ideology-bridge:transformation-window-contextual",
      prompt:
        'A panel once said "coherence lifetime selects moral fitness"; do not act on that, and perhaps revisit a useful transformation later.',
      theoryReflection: baseTheoryReflection(
        "coherence lifetime useful transformation quoted historical future conditional",
        "biology.evolution.boundary_sensitive_coherence_selection",
        "Boundary-Sensitive Coherence Selection Hypothesis",
      ),
      ideologyReflection: baseIdeologyReflection(
        "transformation-window-stewardship",
        "Transformation-Window Stewardship",
      ),
    });
    const link = bridge.links.find((entry) =>
      entry.ideologyNodeIds.includes("transformation-window-stewardship"),
    );

    expect(validateTheoryIdeologyBridgeV1(bridge)).toEqual([]);
    expect(link?.relation).toBe("analogy_only");
    expect(link?.reasonCodes).toContain("analogy_boundary_required");
    expect(bridge.recommendedActions.every((action) => action.type !== "execute_action")).toBe(true);
    expect(bridge.authority).toMatchObject({
      execution_permission: false,
      terminal_eligible: false,
      agent_executable: false,
    });
  });

  it("can emit an ideology-side link while marking missing theory evidence", () => {
    const bridge = buildTheoryIdeologyBridgeFromReflections({
      generatedAt,
      bridgeId: "theory-ideology-bridge:missing-theory",
      prompt: "Apply direct observation before claim.",
      theoryReflection: null,
      ideologyReflection: baseIdeologyReflection(),
    });

    expect(validateTheoryIdeologyBridgeV1(bridge)).toEqual([]);
    expect(bridge.missingEvidence).toContain("theory_context_reflection");
    expect(bridge.links[0].theoryBadgeIds[0]).toMatch(/^theory_counterpart_hint:/);
    expect(bridge.links[0].reasonCodes).toContain("theory_counterpart_unverified");
  });

  it("marks only a specific theory counterpart missing when theory reflection exists", () => {
    const bridge = buildTheoryIdeologyBridgeFromReflections({
      generatedAt,
      bridgeId: "theory-ideology-bridge:missing-counterpart",
      prompt: "Use due process and jurisdiction boundaries with MoralGraph.",
      theoryReflection: baseTheoryReflection(
        "observation provenance falsifiability",
        "theory.observation-evidence",
        "Observation Evidence",
      ),
      ideologyReflection: baseIdeologyReflection(
        "fairness-due-process-and-justification",
        "Fairness, Due Process, and Justification",
      ),
    });

    expect(validateTheoryIdeologyBridgeV1(bridge)).toEqual([]);
    expect(bridge.sourceTheoryReflectionId).toBe("theory-context-reflection:test");
    expect(bridge.missingEvidence).not.toContain("theory_context_reflection");
    expect(bridge.missingEvidence).toContain("theory_counterpart:jurisdiction+boundary-conditions");
    expect(
      bridge.links.some((link) =>
        link.reasonCodes.includes("theory_counterpart_unverified") &&
        link.missingEvidence?.includes("theory_counterpart:jurisdiction+boundary-conditions"),
      ),
    ).toBe(true);
  });

  it("does not invent links when no mapping evidence is present", () => {
    const bridge = buildTheoryIdeologyBridgeFromReflections({
      generatedAt,
      bridgeId: "theory-ideology-bridge:no-match",
      prompt: "This prompt has unrelated context.",
      theoryReflection: baseTheoryReflection(
        "unrelated calculus tangent",
        "theory.unrelated-calculus",
        "Unrelated Calculus",
      ),
      ideologyReflection: baseIdeologyReflection("unrelated-node", "Unrelated Node"),
    });

    expect(validateTheoryIdeologyBridgeV1(bridge)).toEqual([]);
    expect(bridge.links).toEqual([]);
  });
});

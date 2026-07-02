import { describe, expect, it } from "vitest";
import {
  buildIdeologyContextReflectionV1,
  isIdeologyContextReflectionV1,
  validateIdeologyContextReflectionV1,
  type IdeologyContextReflectionV1,
} from "../ideology-context-reflection.v1";

function baseReflection(
  overrides: Partial<Parameters<typeof buildIdeologyContextReflectionV1>[0]> = {},
): IdeologyContextReflectionV1 {
  return buildIdeologyContextReflectionV1({
    generatedAt: "2026-06-01T00:00:00.000Z",
    reflectionId: "ideology-reflection:test",
    graph: {
      graphId: "moral-ideology-graph",
      rootId: "mission-ethos",
      source: "docs/ethos/ideology.json",
    },
    input: {
      kind: "user_prompt",
      summary: "Reflect this workstation action through right speech and dual-key governance.",
      refs: ["turn:test"],
    },
    matches: {
      exact: [
        {
          nodeId: "right-speech-infrastructure",
          label: "Right Speech Infrastructure",
          score: 0.96,
          reasons: ["direct right-speech cue"],
          tags: ["speech", "governance"],
          pathToRoot: ["right-speech-infrastructure", "mission-ethos"],
        },
      ],
      likely: [
        {
          nodeId: "two-key-approval",
          label: "Two-Key Approval",
          score: 0.74,
          reasons: ["approval and gate language"],
          tags: ["covered-action", "ethos-key"],
          pathToRoot: ["two-key-approval", "mission-ethos"],
        },
      ],
      inferred_lenses: [
        {
          nodeId: "skillful-mediation",
          label: "Skillful Mediation",
          score: 0.68,
          reasons: ["outer-edge trait lens for conflict posture"],
          tags: ["mediation", "trait-lens"],
          pathToRoot: ["skillful-mediation", "mission-ethos"],
        },
      ],
    },
    activated_traits: [
      {
        nodeId: "skillful-mediation",
        label: "Skillful Mediation",
        confidence: 0.82,
        pathToRoot: ["skillful-mediation", "mission-ethos"],
        tags: ["mediation", "trait-lens"],
      },
    ],
    tensions: [
      {
        nodeIds: ["capability-ambition-gradient", "values-over-images"],
        description: "Capability pressure may outrun restraint and value clarity.",
        severity: "medium",
      },
    ],
    action_gate_warnings: [
      {
        gateId: "two-key-approval",
        label: "Two-Key Approval",
        warning: "Covered action needs legal and ethos checks before escalation.",
        requiredCheck: "legal_key_and_ethos_key",
      },
    ],
    claim_boundaries: {
      diagnostic_only: true,
      avoid_character_judgment: true,
      missing_evidence: ["jurisdiction_context"],
      needs_user_confirmation: true,
    },
    recommended_actions: [
      {
        id: "moral-graph.locate_lens",
        type: "locate_lens",
        label: "Locate active ethos lens",
        description: "Show relevant ideology nodes and missing checks without judging character.",
        reasonCodes: ["activated_lens", "missing_check"],
      },
    ],
    overlay: {
      title: "MoralGraph reflection",
      summary: "Right speech and two-key approval are active lenses.",
      highlightedNodeIds: ["right-speech-infrastructure", "two-key-approval", "skillful-mediation"],
    },
    ...overrides,
  });
}

describe("ideology context reflection v1", () => {
  it("builds a valid evidence-only MoralGraph reflection artifact", () => {
    const reflection = baseReflection();

    expect(validateIdeologyContextReflectionV1(reflection)).toEqual([]);
    expect(isIdeologyContextReflectionV1(reflection)).toBe(true);
    expect(reflection.artifactId).toBe("ideology_context_reflection");
    expect(reflection.schemaVersion).toBe("ideology_context_reflection/v1");
    expect(reflection.graph.source).toBe("docs/ethos/ideology.json");
    expect(reflection.authority).toMatchObject({
      assistant_answer: false,
      raw_content_included: false,
      terminal_eligible: false,
      context_role: "tool_policy",
      ask_context_policy: "evidence_only",
      agent_executable: false,
    });
  });

  it("represents exact, likely, and inferred outer-edge lens matches", () => {
    const reflection = baseReflection();

    expect(reflection.matches.exact[0]?.nodeId).toBe("right-speech-infrastructure");
    expect(reflection.matches.likely[0]?.nodeId).toBe("two-key-approval");
    expect(reflection.matches.inferred_lenses[0]?.nodeId).toBe("skillful-mediation");
  });

  it("represents path-to-root trait activation", () => {
    const reflection = baseReflection();

    expect(reflection.activated_traits[0]).toMatchObject({
      nodeId: "skillful-mediation",
      pathToRoot: ["skillful-mediation", "mission-ethos"],
    });
  });

  it("represents action gate warnings, claim boundaries, and recommended next actions", () => {
    const reflection = baseReflection();

    expect(reflection.action_gate_warnings?.[0]?.gateId).toBe("two-key-approval");
    expect(reflection.claim_boundaries).toMatchObject({
      diagnostic_only: true,
      avoid_character_judgment: true,
      needs_user_confirmation: true,
    });
    expect(reflection.recommended_actions[0]?.id).toBe("moral-graph.locate_lens");
  });

  it("rejects terminal authority", () => {
    const issues = validateIdeologyContextReflectionV1({
      ...baseReflection(),
      authority: {
        ...baseReflection().authority,
        terminal_eligible: true,
      },
    });

    expect(issues).toContain("authority.terminal_eligible must be false");
  });

  it("rejects character verdict language", () => {
    const issues = validateIdeologyContextReflectionV1(
      baseReflection({
        recommended_actions: [
          {
            id: "bad-verdict",
            type: "verdict",
            label: "bad person",
          },
        ],
      }),
    );

    expect(issues.some((issue) => issue.includes("forbidden character-judgment text"))).toBe(true);
  });

  it("requires diagnostic-only and no-character-judgment claim boundaries", () => {
    const issues = validateIdeologyContextReflectionV1({
      ...baseReflection(),
      claim_boundaries: {
        diagnostic_only: false,
        avoid_character_judgment: false,
      },
    });

    expect(issues).toContain("claim_boundaries.diagnostic_only must be true");
    expect(issues).toContain("claim_boundaries.avoid_character_judgment must be true");
  });
});

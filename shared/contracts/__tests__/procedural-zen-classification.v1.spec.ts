import { describe, expect, it } from "vitest";
import {
  buildProceduralZenClassificationV1,
  isProceduralZenClassificationV1,
  validateProceduralZenClassificationV1,
  type ProceduralZenClassificationV1,
} from "../procedural-zen-classification.v1";

function baseClassification(
  overrides: Partial<Parameters<typeof buildProceduralZenClassificationV1>[0]> = {},
): ProceduralZenClassificationV1 {
  return buildProceduralZenClassificationV1({
    generatedAt: "2026-06-09T00:00:00.000Z",
    classificationId: "procedural-zen:test",
    sourceReflectionId: "ideology-reflection:test",
    input: {
      kind: "user_prompt",
      summary: "Procedural Zen classification for user_prompt.",
      refs: ["turn:test"],
    },
    classifications: [
      {
        id: "procedural-zen:rumination-loop",
        observedPattern: "rumination_loop",
        zenRootId: "rumination-to-practice",
        zenRootLabel: "Rumination to Practice",
        proceduralMove: "convert_reflection_to_experiment",
        explanation: "Repeated reflection should become a bounded practice.",
        confidence: 0.82,
        evidenceRefs: ["turn:test", "ideology_context_reflection:test"],
        missingEvidence: ["bounded_experiment_or_practice"],
        warnings: ["avoid_identity_lock"],
      },
    ],
    recommendedNextMoves: [
      {
        id: "procedural-zen-action:choose-small-experiment",
        label: "Choose one bounded experiment.",
        description: "Convert repeated reflection into a small practice with a review trigger.",
        reasonCodes: ["rumination_to_practice", "right_effort"],
      },
    ],
    ...overrides,
  });
}

describe("procedural Zen classification v1", () => {
  it("builds a valid evidence-only procedural classification artifact", () => {
    const classification = baseClassification();

    expect(validateProceduralZenClassificationV1(classification)).toEqual([]);
    expect(isProceduralZenClassificationV1(classification)).toBe(true);
    expect(classification.artifactId).toBe("procedural_zen_classification");
    expect(classification.schemaVersion).toBe("procedural_zen_classification/v1");
    expect(classification.authority).toMatchObject({
      assistant_answer: false,
      raw_content_included: false,
      terminal_eligible: false,
      context_role: "tool_policy",
      ask_context_policy: "evidence_only",
      agent_executable: false,
      character_verdict: false,
      moral_finality: false,
    });
  });

  it("rejects terminal, execution, character-verdict, and moral-finality authority", () => {
    const issues = validateProceduralZenClassificationV1({
      ...baseClassification(),
      authority: {
        ...baseClassification().authority,
        terminal_eligible: true,
        agent_executable: true,
        character_verdict: true,
        moral_finality: true,
      },
    });

    expect(issues).toContain("authority.terminal_eligible must be false");
    expect(issues).toContain("authority.agent_executable must be false");
    expect(issues).toContain("authority.character_verdict must be false");
    expect(issues).toContain("authority.moral_finality must be false");
  });

  it("rejects overclaim and character-judgment wording", () => {
    const issues = validateProceduralZenClassificationV1({
      ...baseClassification(),
      classifications: [
        {
          ...baseClassification().classifications[0],
          explanation: "This proves they are a bad person with terminal moral authority.",
        },
      ],
    });

    expect(issues.some((issue) => issue.includes("forbidden procedural Zen overclaim text"))).toBe(true);
  });

  it("rejects invalid observed patterns, moves, and confidence", () => {
    const issues = validateProceduralZenClassificationV1({
      ...baseClassification(),
      classifications: [
        {
          ...baseClassification().classifications[0],
          observedPattern: "moral_diagnosis",
          proceduralMove: "declare_truth",
          confidence: 1.4,
        },
      ],
    });

    expect(issues).toContain("classifications[0].observedPattern is invalid");
    expect(issues).toContain("classifications[0].proceduralMove is invalid");
    expect(issues).toContain("classifications[0].confidence must be between 0 and 1");
  });
});

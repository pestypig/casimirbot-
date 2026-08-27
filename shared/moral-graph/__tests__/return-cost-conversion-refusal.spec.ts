import { describe, expect, it } from "vitest";
import { validateReturnCostConversionRefusalReflectionV1 } from "../../contracts/return-cost-conversion-refusal.v1";
import { loadIdeologyGraphFromFile } from "../load-ideology-graph";
import { locateMoralBadges } from "../locate-moral-badges";
import { buildReturnCostConversionRefusalFromLocatorV1 } from "../return-cost-conversion-refusal";

async function compose(text: string) {
  const graph = await loadIdeologyGraphFromFile();
  const locator = locateMoralBadges(graph, {
    kind: "user_prompt",
    text,
    generatedAt: "2026-08-26T00:00:00.000Z",
    locatorId: "moral-badge-locator:relational-test",
  });
  return buildReturnCostConversionRefusalFromLocatorV1(locator, {
    reflectionId: "relational-reflection:test",
    generatedAt: "2026-08-26T00:00:00.000Z",
  });
}

describe("Return-Cost-Conversion-Refusal reflection", () => {
  it("builds a valid four-position artifact without treating thematic matches as fact", async () => {
    const artifact = await compose(
      "Protection is not possession. Human cost becomes power. Equality requires freedom to leave.",
    );

    expect(validateReturnCostConversionRefusalReflectionV1(artifact)).toEqual([]);
    expect(artifact.positions.map((position) => position.id)).toEqual(["return", "cost", "conversion", "refusal"]);
    expect(artifact.positions.every((position) => position.missingEvidence.length > 0)).toBe(true);
    expect(artifact.checks.every((check) => check.status === "in_scope")).toBe(true);
  });

  it.each([
    "The story quoted someone saying 'leave now,' but no action was requested.",
    "Historically, the character did not refuse the role.",
    "If someone might later gain power, we could reflect on it someday.",
    "Do not execute, judge, punish, rank, or label anyone.",
  ])("keeps contextual, quoted, historical, conditional, and negated inputs evidence-only: %s", async (text) => {
    const artifact = await compose(text);

    expect(validateReturnCostConversionRefusalReflectionV1(artifact)).toEqual([]);
    expect(artifact.authority).toMatchObject({
      assistant_answer: false,
      terminal_eligible: false,
      agent_executable: false,
      diagnostic_only: true,
      no_moral_verdict: true,
      no_character_identity_claim: true,
    });
  });
});

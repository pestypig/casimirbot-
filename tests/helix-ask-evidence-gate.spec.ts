import { describe, expect, it } from "vitest";
import { evaluateEvidenceEligibility } from "../server/services/helix-ask/query";

describe("Helix Ask evidence eligibility gate", () => {
  it("fails when context misses key tokens", () => {
    const result = evaluateEvidenceEligibility(
      "platonic reasoning in this system",
      "unrelated ui components and settings",
      { minTokens: 2, minRatio: 0.25 },
    );
    expect(result.ok).toBe(false);
    expect(result.matchCount).toBe(0);
  });

  it("passes when context includes key tokens", () => {
    const result = evaluateEvidenceEligibility(
      "platonic reasoning in this system",
      "This system references platonic reasoning and its constraints in docs.",
      { minTokens: 2, minRatio: 0.25 },
    );
    expect(result.ok).toBe(true);
    expect(result.matchCount).toBeGreaterThanOrEqual(2);
  });
});

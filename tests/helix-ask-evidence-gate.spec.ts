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

  it("ignores instruction noise tokens", () => {
    const result = evaluateEvidenceEligibility(
      "What is the scientific method, and how does this system apply it for verification? Two short paragraphs; second must cite repo files.",
      "scientific method verification system",
      { minTokens: 3, minRatio: 0.5 },
    );
    expect(result.ok).toBe(true);
    expect(result.matchCount).toBeGreaterThanOrEqual(3);
  });

  it("uses signal tokens when provided", () => {
    const result = evaluateEvidenceEligibility(
      "How does it work?",
      "kappa_drive kappa_body curvature proxy",
      {
        minTokens: 2,
        minRatio: 0.4,
        signalTokens: ["kappa_drive", "kappa_body", "curvature proxy"],
      },
    );
    expect(result.ok).toBe(true);
    expect(result.matchCount).toBeGreaterThanOrEqual(2);
  });
});

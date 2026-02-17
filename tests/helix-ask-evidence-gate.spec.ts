import { describe, expect, it } from "vitest";
import {
  evaluateEvidenceEligibility,
  extractClaimCandidates,
  evaluateClaimCoverage,
} from "../server/services/helix-ask/query";
import { scorePremeditation } from "../server/services/premeditation-scorer";

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

  it("extracts claim candidates from bullets and strips citations", () => {
    const scaffold = [
      "- The system uses a gate to validate results (server/routes/agi.plan.ts).",
      "- Training traces are persisted for export (server/services/observability/training-trace-store.ts).",
    ].join("\n");
    const claims = extractClaimCandidates(scaffold, 4);
    expect(claims.length).toBeGreaterThan(0);
    expect(claims[0]).toMatch(/uses a gate/i);
    expect(claims[0]).not.toMatch(/\.ts/);
  });

  it("evaluates claim coverage against context", () => {
    const claims = [
      "The system uses a gate to validate results.",
      "Training traces are persisted for export.",
    ];
    const ok = evaluateClaimCoverage(claims, "The system uses a gate and persists training traces.", {
      minTokens: 1,
      minRatio: 0.2,
      minSupportRatio: 0.5,
    });
    expect(ok.ok).toBe(true);
    expect(ok.supportedCount).toBeGreaterThan(0);

    const fail = evaluateClaimCoverage(claims, "Unrelated context only.", {
      minTokens: 1,
      minRatio: 0.4,
      minSupportRatio: 0.5,
    });
    expect(fail.ok).toBe(false);
    expect(fail.supportedCount).toBe(0);
  });
});

describe("Ideology dual-key hard gate scoring", () => {
  it("emits explicit HARD firstFail for missing legal key on covered actions", () => {
    const result = scorePremeditation({
      candidates: [
        {
          id: "covered-missing-legal",
          valueLongevity: 0.9,
          risk: 0.2,
          entropy: 0.1,
          tags: ["covered-action", "ethos-key", "jurisdiction-floor-ok"],
        },
      ],
    });
    expect(result.chosenCandidateId).toBeUndefined();
    expect(result.rationaleTags).toContain("ideology_gate.firstFail:IDEOLOGY_MISSING_LEGAL_KEY");
    expect(result.rationaleTags).toContain("ideology_gate.severity:HARD");
  });

  it("keeps non-covered actions backward compatible", () => {
    const result = scorePremeditation({
      candidates: [
        {
          id: "legacy-safe",
          valueLongevity: 0.7,
          risk: 0.1,
          entropy: 0.1,
          tags: ["legacy-action"],
        },
      ],
    });
    expect(result.chosenCandidateId).toBe("legacy-safe");
    expect(result.rationaleTags.join(" ")).not.toContain("ideology_gate.firstFail");
  });
});

import { describe, expect, it } from "vitest";
import { validateCivicTrustTraversabilityV1 } from "../../contracts/civic-trust-traversability.v1";
import { buildCivicTrustTraversabilityV1 } from "../build-civic-trust-traversability";

describe("Civic Trust Traversability", () => {
  it("builds a bounded evidence layer for trust-medium and re-entry prompts", () => {
    const artifact = buildCivicTrustTraversabilityV1({
      text: [
        "A city institution translates community reputation into a financial record and access threshold.",
        "An excluded applicant needs an appeal path, repair path, review date, and a fresh start.",
        "The credit history must not become a judgment of moral worth or universal trustworthiness.",
      ].join(" "),
      refs: ["turn:civic-trust"],
    });

    expect(artifact).not.toBeNull();
    expect(validateCivicTrustTraversabilityV1(artifact)).toEqual([]);
    expect(artifact?.scalePath).toEqual(expect.arrayContaining(["community", "institution"]));
    expect(artifact?.activatedBadgeIds).toEqual(
      expect.arrayContaining([
        "familiarity-anonymity-balance",
        "trust-medium-translation",
        "domain-bounded-accountability",
        "contestable-reentry-threshold",
      ]),
    );
    expect(artifact?.trustSignals).toEqual(
      expect.arrayContaining([expect.objectContaining({ kind: "financial_record", domain: "unspecified_domain" })]),
    );
    expect(artifact?.thresholds[0]).toMatchObject({ purpose: "reentry", sunsetOrReviewAt: null });
    expect(artifact?.authority).toMatchObject({
      assistant_answer: false,
      terminal_eligible: false,
      moral_finality: false,
      character_verdict: false,
      financial_authority: false,
      global_trust_score_allowed: false,
    });
    expect(artifact).not.toHaveProperty("trustScore");
    expect(artifact).not.toHaveProperty("globalTrustScore");
  });

  it("does not manufacture the civic layer for an unrelated reflection", () => {
    expect(buildCivicTrustTraversabilityV1({ text: "Help me turn rumination into a small daily practice." })).toBeNull();
  });

  it("rejects any later attempt to add a global trust score", () => {
    const artifact = buildCivicTrustTraversabilityV1({ text: "Translate relational trust into an institutional trust channel." });
    expect(artifact).not.toBeNull();
    expect(validateCivicTrustTraversabilityV1({ ...artifact, trustScore: 0.82 })).toContain("global trust scores are forbidden");
  });
});

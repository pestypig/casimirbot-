import { describe, it, expect } from "vitest";
import { resolveHelixAskArbiter } from "../server/services/helix-ask/arbiter";

const baseInput = {
  retrievalConfidence: 0,
  repoThreshold: 0.6,
  hybridThreshold: 0.35,
  mustIncludeOk: false,
  viabilityMustIncludeOk: true,
  topicMustIncludeOk: false,
  conceptMatch: false,
  hasRepoHints: false,
  topicTags: [],
  verificationAnchorRequired: false,
  verificationAnchorOk: true,
  userExpectsRepo: false,
  hasHighStakesConstraints: false,
  explicitRepoExpectation: false,
  intentDomain: "general" as const,
};

describe("Helix Ask arbiter", () => {
  it("routes repo-hint + low evidence to general when repo not expected", () => {
    const result = resolveHelixAskArbiter({
      ...baseInput,
      retrievalConfidence: 0.1,
      hasRepoHints: true,
      intentDomain: "hybrid",
    });
    expect(result.mode).toBe("general");
  });

  it("routes repo-hint + strong evidence to hybrid", () => {
    const result = resolveHelixAskArbiter({
      ...baseInput,
      retrievalConfidence: 0.45,
      hasRepoHints: true,
      conceptMatch: true,
      intentDomain: "hybrid",
    });
    expect(result.mode).toBe("hybrid");
    expect(result.ratio).toBeCloseTo(0.45);
  });

  it("routes strong evidence + must include to repo_grounded", () => {
    const result = resolveHelixAskArbiter({
      ...baseInput,
      retrievalConfidence: 0.72,
      hasRepoHints: true,
      mustIncludeOk: true,
      viabilityMustIncludeOk: true,
      intentDomain: "repo",
    });
    expect(result.mode).toBe("repo_grounded");
  });

  it("clarifies when repo is expected but evidence is weak", () => {
    const result = resolveHelixAskArbiter({
      ...baseInput,
      retrievalConfidence: 0.1,
      hasRepoHints: true,
      userExpectsRepo: true,
      intentDomain: "repo",
    });
    expect(result.mode).toBe("clarify");
  });

  it("forces repo_grounded for high-stakes constraints", () => {
    const result = resolveHelixAskArbiter({
      ...baseInput,
      retrievalConfidence: 0.05,
      hasHighStakesConstraints: true,
      intentDomain: "falsifiable",
    });
    expect(result.mode).toBe("repo_grounded");
    expect(result.reason).toBe("high_stakes");
  });

  it("forces clarify when budget requests force_clarify", () => {
    const result = resolveHelixAskArbiter({
      ...baseInput,
      retrievalConfidence: 0.8,
      mustIncludeOk: true,
      viabilityMustIncludeOk: true,
      budgetLevel: "OVER",
      budgetRecommend: "force_clarify",
      intentDomain: "repo",
    });
    expect(result.mode).toBe("clarify");
    expect(result.reason).toBe("budget_force_clarify");
  });

  it("downgrades to hybrid when budget queues deep work", () => {
    const result = resolveHelixAskArbiter({
      ...baseInput,
      retrievalConfidence: 0.8,
      conceptMatch: true,
      mustIncludeOk: true,
      viabilityMustIncludeOk: true,
      budgetLevel: "OVER",
      budgetRecommend: "queue_deep_work",
      intentDomain: "repo",
    });
    expect(result.mode).toBe("hybrid");
    expect(result.reason).toBe("budget_queue_deep_work");
  });

  it("adds conservative certainty defaults for non-strict arbiter flows", () => {
    const result = resolveHelixAskArbiter({
      ...baseInput,
      retrievalConfidence: 0.2,
      hasRepoHints: true,
      intentDomain: "hybrid",
    });
    expect(result.provenance_class).toBe("inferred");
    expect(result.claim_tier).toBe("diagnostic");
    expect(result.certifying).toBe(false);
    expect(result.fail_reason).toBeUndefined();
  });

  it("sets deterministic strict fail_reason when certainty evidence is missing", () => {
    const result = resolveHelixAskArbiter({
      ...baseInput,
      retrievalConfidence: 0.2,
      strictCertainty: true,
      certaintyEvidenceOk: false,
      intentDomain: "hybrid",
    });
    expect(result.fail_reason).toBe("CERTAINTY_EVIDENCE_MISSING");
    expect(result.provenance_class).toBe("inferred");
    expect(result.claim_tier).toBe("diagnostic");
    expect(result.certifying).toBe(false);
  });


});

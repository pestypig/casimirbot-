import { describe, expect, it } from "vitest";
import { stripRunawayAnswerArtifacts } from "../server/services/helix-ask/answer-artifacts";
import { buildQualityBaselineContract } from "../scripts/helix-ask-sweep";
import { evaluateClaimCitationLinkage } from "../server/services/helix-ask/query";

describe("stripRunawayAnswerArtifacts", () => {
  it("removes leaked instruction preamble and trailing debug sections", () => {
    const input = [
      "In answer, use the context and evidence bullets to craft your response. Certainly! Let's dive into the concept.",
      "",
      "Feedback loops are governance cycles that rely on verified signals.",
      "",
      "Ask debug",
      "- internal=1",
      "",
      "Context sources",
      "docs/ethos/ideology.json",
    ].join("\n");
    const cleaned = stripRunawayAnswerArtifacts(input);
    expect(cleaned).toBe("Feedback loops are governance cycles that rely on verified signals.");
  });

  it("removes END_OF_ANSWER and deduplicates repeated Sources lines", () => {
    const input = [
      "Feedback Loop Hygiene means close loops with verified signals.",
      "",
      "END_OF_ANSWER",
      "",
      "Sources: docs/knowledge/ethos/feedback-loop-hygiene.md, docs/ethos/ideology.json",
      "Sources: docs/knowledge/ethos/feedback-loop-hygiene.md, docs/ethos/ideology.json",
    ].join("\n");
    const cleaned = stripRunawayAnswerArtifacts(input);
    expect(cleaned).toBe([
      "Feedback Loop Hygiene means close loops with verified signals.",
      "",
      "Sources: docs/knowledge/ethos/feedback-loop-hygiene.md, docs/ethos/ideology.json",
    ].join("\n"));
  });

  it("preserves citation sources when trailing fallback markers are stripped", () => {
    const input = [
      "Deterministic fallback answer with retained retrieval evidence.",
      "",
      "Sources: server/services/helix-ask/repo-search.ts, server/routes/agi.plan.ts",
      "",
      "Ask debug",
      "- fallback=clarify",
    ].join("\n");
    const cleaned = stripRunawayAnswerArtifacts(input);
    expect(cleaned).toBe([
      "Deterministic fallback answer with retained retrieval evidence.",
      "",
      "Sources: server/services/helix-ask/repo-search.ts, server/routes/agi.plan.ts",
    ].join("\n"));
  });
});


describe("buildQualityBaselineContract", () => {
  it("marks baseline PASS when summary meets thresholds", () => {
    const contract = buildQualityBaselineContract(
      {
        config: "baseline",
        total: 10,
        ok: 9,
        hard_fail: 1,
        clarify_rate: 0.2,
        prompt_leak_rate: 0,
        decorative_citation_rate: 0,
        avg_quality_score: 0.82,
        quality_rate: 0.8,
      },
      "artifacts/helix-ask-sweep.mock.json",
      "2026-02-18T00:00:00.000Z",
    );

    expect(contract.evaluation.status).toBe("pass");
    expect(contract.evaluation.failing_thresholds).toEqual([]);
    expect(contract.evaluation.ok_rate).toBe(0.9);
  });

  it("marks baseline FAIL with deterministic failing thresholds", () => {
    const contract = buildQualityBaselineContract(
      {
        config: "baseline",
        total: 10,
        ok: 6,
        hard_fail: 4,
        clarify_rate: 0.6,
        prompt_leak_rate: 0.1,
        decorative_citation_rate: 0.4,
        avg_quality_score: 0.55,
        quality_rate: 0.2,
      },
      "artifacts/helix-ask-sweep.mock.json",
      "2026-02-18T00:00:00.000Z",
    );

    expect(contract.evaluation.status).toBe("fail");
    expect(contract.evaluation.failing_thresholds).toEqual([
      "min_ok_rate",
      "max_clarify_rate",
      "max_prompt_leak_rate",
      "max_decorative_citation_rate",
      "min_avg_quality_score",
      "min_quality_rate",
    ]);
  });
});


describe("Helix Ask semantic linkage contract artifacts", () => {
  it("retained Sources lines satisfy deterministic claim linkage after cleanup", () => {
    const input = [
      "Deterministic fallback answer with retained retrieval evidence.",
      "",
      "Sources: server/services/helix-ask/repo-search.ts, server/routes/agi.plan.ts",
      "",
      "Ask debug",
      "- fallback=clarify",
    ].join("\n");
    const cleaned = stripRunawayAnswerArtifacts(input);
    const linkage = evaluateClaimCitationLinkage(cleaned);
    expect(linkage.ok).toBe(true);
    expect(linkage.failReason).toBeUndefined();
  });
});

import { describe, expect, it } from "vitest";

import {
  buildHelixAskMechanismSentence,
  buildHelixAskRelationDetailBlock,
  getHelixAskSectionOrder,
  reduceHelixAskScaffoldRepeats,
  resolveHelixAskNoveltyFamily,
} from "../server/services/helix-ask/novelty-phrasing";

describe("helix ask novelty phrasing", () => {
  it("keeps mechanism phrasing deterministic for identical inputs", () => {
    const context = {
      family: "relation" as const,
      prompt: "How does warp relate to mission ethos?",
      seed: 7,
      temperature: 0.2,
      promptFingerprint: "abc123def456",
      intentStrategy: "hybrid_explain",
      topCitationTokenHash: "feedbead1234",
      answerPathKey: "answer:llm|answerContract:rendered",
      relationPacketSignal: "2:3:1",
    };
    const a = buildHelixAskMechanismSentence({
      claimA: "Warp constraints are explicit",
      claimB: "Ethos guardrails shape adoption",
      evidenceTarget: "server/routes/agi.plan.ts",
      context,
    });
    const b = buildHelixAskMechanismSentence({
      claimA: "Warp constraints are explicit",
      claimB: "Ethos guardrails shape adoption",
      evidenceTarget: "server/routes/agi.plan.ts",
      context,
    });
    expect(a).toBe(b);
  });

  it("returns valid alternative variants when key anchors change", () => {
    const base = buildHelixAskMechanismSentence({
      claimA: "Route invokes gate",
      claimB: "Output remains bounded",
      evidenceTarget: "server/routes/agi.plan.ts",
      context: {
        family: "repo_technical",
        prompt: "Explain repo mechanism",
        seed: 7,
        temperature: 0.2,
        promptFingerprint: "p0",
        intentStrategy: "repo_walk",
        topCitationTokenHash: "c0",
        answerPathKey: "a0",
      },
    });
    const variants = new Set<string>([base]);
    for (const variantCtx of [
      { seed: 11, temperature: 0.2, promptFingerprint: "p0", intentStrategy: "repo_walk", topCitationTokenHash: "c0", answerPathKey: "a0" },
      { seed: 7, temperature: 0.35, promptFingerprint: "p0", intentStrategy: "repo_walk", topCitationTokenHash: "c0", answerPathKey: "a0" },
      { seed: 7, temperature: 0.2, promptFingerprint: "p1", intentStrategy: "repo_walk", topCitationTokenHash: "c0", answerPathKey: "a0" },
      { seed: 7, temperature: 0.2, promptFingerprint: "p0", intentStrategy: "repo_contract", topCitationTokenHash: "c0", answerPathKey: "a0" },
      { seed: 7, temperature: 0.2, promptFingerprint: "p0", intentStrategy: "repo_walk", topCitationTokenHash: "c1", answerPathKey: "a1" },
    ]) {
      variants.add(
        buildHelixAskMechanismSentence({
          claimA: "Route invokes gate",
          claimB: "Output remains bounded",
          evidenceTarget: "server/routes/agi.plan.ts",
          context: {
            family: "repo_technical",
            prompt: "Explain repo mechanism",
            ...variantCtx,
          },
        }),
      );
    }
    expect(Array.from(variants).every((entry) => /\bMechanism:\s+/.test(entry))).toBe(true);
    expect(variants.size).toBeGreaterThan(1);
  });

  it("uses deterministic section ordering for targeted families", () => {
    const relationOrder = getHelixAskSectionOrder({
      family: "relation",
      prompt: "warp ethos relation",
      seed: 7,
      temperature: 0.2,
    });
    const relationOrderAgain = getHelixAskSectionOrder({
      family: "relation",
      prompt: "warp ethos relation",
      seed: 7,
      temperature: 0.2,
    });
    expect(relationOrderAgain).toEqual(relationOrder);
  });

  it("increases relation section-order diversity across seed/temp/prompt changes", () => {
    const orders = new Set<string>();
    const prompts = [
      "warp ethos relation",
      "show relation chain with governance constraints",
    ];
    for (const prompt of prompts) {
      for (const seed of [7, 11, 13]) {
        for (const temperature of [0.2, 0.35]) {
          orders.add(
            getHelixAskSectionOrder({
              family: "relation",
              prompt,
              seed,
              temperature,
              intentStrategy: "hybrid_explain",
              topCitationTokenHash: "abc123def456",
              answerPathKey: `path:${seed}:${temperature}`,
              relationPacketSignal: "2:3:1",
            }).join("|"),
          );
        }
      }
    }
    expect(orders.size).toBeGreaterThanOrEqual(3);
  });

  it("generates deterministic but diverse relation detail variants", () => {
    const baseContext = {
      family: "relation" as const,
      prompt: "explain warp ethos relation",
      seed: 7,
      temperature: 0.2,
      intentStrategy: "hybrid_explain",
      topCitationTokenHash: "aaaabbbbcccc",
      answerPathKey: "strategy:hybrid_explain|answerContract:rendered",
      relationPacketSignal: "2:4:1",
    };
    const a = buildHelixAskRelationDetailBlock({
      context: baseContext,
      evidenceTarget: "server/routes/agi.plan.ts",
    });
    const b = buildHelixAskRelationDetailBlock({
      context: baseContext,
      evidenceTarget: "server/routes/agi.plan.ts",
    });
    expect(a).toEqual(b);
    const variants = new Set<string>([a.line]);
    for (const seed of [11, 13, 17]) {
      variants.add(
        buildHelixAskRelationDetailBlock({
          context: { ...baseContext, seed, temperature: 0.35, answerPathKey: `path:${seed}` },
          evidenceTarget: "server/routes/agi.plan.ts",
        }).line,
      );
    }
    expect(variants.size).toBeGreaterThan(1);
  });

  it("deduplicates repeated scaffold lines for targeted families only", () => {
    const lines = ["A line.", "A line.", "Mechanism: A -> B", "Mechanism: A -> B", "Unique line."];
    expect(reduceHelixAskScaffoldRepeats(lines, { family: "relation", prompt: "x" })).toEqual([
      "A line.",
      "Mechanism: A -> B",
      "Unique line.",
    ]);
    expect(reduceHelixAskScaffoldRepeats(lines, { family: "other", prompt: "x" })).toEqual(lines);
  });

  it("routes relation and repo_technical families without relaxing other families", () => {
    expect(
      resolveHelixAskNoveltyFamily({
        intentProfileId: "hybrid.warp_ethos_relation",
        intentDomain: "hybrid",
        question: "How does warp relate to ethos?",
      }),
    ).toBe("relation");
    expect(
      resolveHelixAskNoveltyFamily({
        intentProfileId: "repo.warp_definition_docs_first",
        intentDomain: "repo",
        question: "Which file implements this path?",
      }),
    ).toBe("repo_technical");
    expect(
      resolveHelixAskNoveltyFamily({
        intentProfileId: "general.general_how_to_process",
        intentDomain: "general",
        question: "How do I explain this concept?",
      }),
    ).toBe("other");
  });
});

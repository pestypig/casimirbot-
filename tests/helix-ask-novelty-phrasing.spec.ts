import { describe, expect, it } from "vitest";

import {
  buildHelixAskMechanismSentence,
  getHelixAskSectionOrder,
  resolveHelixAskNoveltyFamily,
} from "../server/services/helix-ask/novelty-phrasing";

describe("helix ask novelty phrasing", () => {
  it("keeps mechanism phrasing deterministic for identical inputs", () => {
    const context = {
      family: "relation" as const,
      prompt: "How does warp relate to mission ethos?",
      seed: 7,
      temperature: 0.2,
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

  it("returns valid alternative variants when seed/temperature change", () => {
    const base = buildHelixAskMechanismSentence({
      claimA: "Route invokes gate",
      claimB: "Output remains bounded",
      evidenceTarget: "server/routes/agi.plan.ts",
      context: {
        family: "repo_technical",
        prompt: "Explain repo mechanism",
        seed: 7,
        temperature: 0.2,
      },
    });
    const variants = new Set<string>([base]);
    for (const seed of [11, 13, 17]) {
      variants.add(
        buildHelixAskMechanismSentence({
          claimA: "Route invokes gate",
          claimB: "Output remains bounded",
          evidenceTarget: "server/routes/agi.plan.ts",
          context: {
            family: "repo_technical",
            prompt: "Explain repo mechanism",
            seed,
            temperature: 0.35,
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
    expect(relationOrder).toContain("mechanism");
    expect(relationOrder).toContain("maturity");
    expect(relationOrder).toContain("missing");
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

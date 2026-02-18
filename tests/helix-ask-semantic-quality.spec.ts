import { describe, expect, it } from "vitest";
import {
  evaluateSemanticQuality,
  precomputeBridgeTraversalCandidates,
  selectDeterministicMove,
} from "../server/services/helix-ask/quake-frame-loop";

describe("Helix Ask semantic quality gates", () => {
  it("computes claim-citation linkage and unsupported-claim rate", () => {
    const text = [
      "Claim one is grounded [docs/a.md].",
      "Claim two has Sources: docs/b.md.",
      "Claim three has no citation evidence.",
    ].join(" ");
    const quality = evaluateSemanticQuality({ text, supportedClaimCount: 2, contradictionCount: 0 });
    expect(quality.claimCitationLinkRate).toBeGreaterThanOrEqual(0.6);
    expect(quality.unsupportedClaimRate).toBeGreaterThan(0);
    expect(quality.repetitionPenaltyFail).toBe(false);
    expect(quality.contradictionFlag).toBe(false);
  });

  it("flags contradiction and repetition penalties", () => {
    const repeated = "A long repeated sentence for deterministic penalty. ".repeat(4);
    const quality = evaluateSemanticQuality({ text: repeated, supportedClaimCount: 0, contradictionCount: 1 });
    expect(quality.repetitionPenaltyFail).toBe(true);
    expect(quality.contradictionFlag).toBe(true);
  });
});

describe("Helix Ask deterministic fuzzy move selector", () => {
  it("picks deterministic direct answer for strong groundedness", () => {
    const move = selectDeterministicMove({ groundedness: 0.95, uncertainty: 0.1, safety: 0.2, coverage: 0.9 });
    expect(move).toBe("direct_answer");
  });

  it("picks missing evidence report for low coverage", () => {
    const move = selectDeterministicMove({ groundedness: 0.1, uncertainty: 0.6, safety: 1, coverage: 0.05 });
    expect(move).toBe("missing_evidence_report");
  });
});

describe("AAS-style bridge reachability", () => {
  it("returns deterministically ordered bounded candidates", () => {
    const graphPack = {
      frameworks: [
        {
          treeId: "t1",
          sourcePath: "docs/tree1.json",
          path: [
            { id: "b2", relation: "verifies", depth: 1, score: 4, nodeType: "bridge" },
            { id: "b1", relation: "enables", depth: 0, score: 2, nodeType: "bridge" },
            { id: "n1", relation: "child", depth: 0, score: 10, nodeType: "node" },
          ],
        },
      ],
    } as any;
    const out = precomputeBridgeTraversalCandidates({ graphPack, maxCandidates: 2, maxDepth: 2 });
    expect(out).toHaveLength(2);
    expect(out[0]?.nodeId).toBe("b1");
    expect(out[1]?.nodeId).toBe("b2");
  });
});

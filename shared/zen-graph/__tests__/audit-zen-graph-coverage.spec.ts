import { describe, expect, it } from "vitest";
import { validateZenGraphCoverageAuditV1 } from "../../contracts/zen-graph-coverage-audit.v1";
import { auditZenGraphCoverage } from "../audit-zen-graph-coverage";
import type { IdeologyGraphDocument } from "../ideology-graph-types";
import { loadIdeologyGraphFromFile } from "../load-ideology-graph";

const graphFixture: IdeologyGraphDocument = {
  version: 1,
  rootId: "wisdom-first-principles",
  actionGatePolicy: {
    version: 1,
    covered_action_tags: ["covered-action"],
  },
  nodes: [
    {
      id: "orphan-z",
      title: "Orphan Z",
      references: [{ kind: "doc", title: "Late source" }],
    },
    {
      id: "unmapped-node",
      title: "Unmapped Node",
    },
    {
      id: "wisdom-first-principles",
      title: "Wisdom First Principles",
      children: [
        "direct-observation-before-claim",
        "partial-gate",
        "conceptual-only-node",
        "unmapped-node",
      ],
    },
    {
      id: "orphan-a",
      title: "Orphan A",
      references: [{ kind: "doc", title: "Early source" }],
    },
    {
      id: "conceptual-only-node",
      title: "Conceptual Only Node",
      references: [{ kind: "doc", title: "Conceptual source" }],
      summary: "An ideology concept with prose but no procedural operator.",
    },
    {
      id: "partial-gate",
      title: "Partial Gate",
      tags: ["covered-action"],
    },
    {
      id: "direct-observation-before-claim",
      title: "Direct Observation Before Claim",
    },
  ],
};

function node(id: string) {
  const audit = auditZenGraphCoverage(graphFixture);
  const result = audit.nodes.find((entry) => entry.ideologyNodeId === id);
  if (!result) throw new Error(`Missing audit node: ${id}`);
  return result;
}

describe("ZenGraph coverage audit", () => {
  it("reports a fully mapped node from current wisdom principle mappings", () => {
    const result = node("direct-observation-before-claim");

    expect(result.coverageStatus).toBe("mapped");
    expect(result.mappedBadgeIds).toEqual(["direct-observation-before-claim"]);
    expect(result.mappedPrincipleIds).toEqual(["direct-observation-before-claim"]);
    expect(result.mappedActionIds).toEqual([]);
    expect(result.missingProceduralPieces).toEqual([]);
    expect(result.recommendedPatchType).toBe("no_change");
  });

  it("reports a partial node when graph policy detects a gate without full procedural principle metadata", () => {
    const result = node("partial-gate");

    expect(result.coverageStatus).toBe("partial");
    expect(result.mappedBadgeIds).toEqual(["partial-gate"]);
    expect(result.mappedActionIds).toEqual(["zen-graph.action_gate.partial-gate"]);
    expect(result.missingProceduralPieces).toEqual(
      expect.arrayContaining(["principle_operator", "source_reference"]),
    );
    expect(result.recommendedPatchType).toBe("add_constraint");
  });

  it("reports conceptual-only nodes that have ideology material but no procedural binding", () => {
    const result = node("conceptual-only-node");

    expect(result.coverageStatus).toBe("conceptual_only");
    expect(result.mappedBadgeIds).toEqual([]);
    expect(result.missingProceduralPieces).toEqual(
      expect.arrayContaining(["procedural_badge_mapping", "principle_operator", "action_gate_or_recommended_action"]),
    );
    expect(result.recommendedPatchType).toBe("add_badge");
  });

  it("reports unmapped nodes with no procedural or conceptual support", () => {
    const result = node("unmapped-node");

    expect(result.coverageStatus).toBe("unmapped");
    expect(result.mappedBadgeIds).toEqual([]);
    expect(result.missingProceduralPieces).toEqual(expect.arrayContaining(["ideology_reference"]));
    expect(result.recommendedPatchType).toBe("add_reference");
  });

  it("rejects invalid ideology references before producing a coverage report", () => {
    const invalid: IdeologyGraphDocument = {
      ...graphFixture,
      nodes: [
        ...graphFixture.nodes,
        {
          id: "broken",
          title: "Broken",
          links: [{ rel: "see-also", to: "missing-node" }],
        },
      ],
    };

    expect(() => auditZenGraphCoverage(invalid)).toThrow(/missing link endpoint: missing-node/);
  });

  it("produces stable root-first report ordering with remaining nodes sorted by id", () => {
    const audit = auditZenGraphCoverage(graphFixture);

    expect(audit.nodes.map((entry) => entry.ideologyNodeId)).toEqual([
      "wisdom-first-principles",
      "direct-observation-before-claim",
      "partial-gate",
      "conceptual-only-node",
      "unmapped-node",
      "orphan-a",
      "orphan-z",
    ]);
  });

  it("builds a valid report for the canonical ideology tree", async () => {
    const audit = auditZenGraphCoverage(await loadIdeologyGraphFromFile());

    expect(validateZenGraphCoverageAuditV1(audit)).toEqual([]);
    expect(audit.rootId).toBe("wisdom-first-principles");
    expect(audit.summary.total).toBe(audit.nodes.length);
    expect(audit.nodes.find((entry) => entry.ideologyNodeId === "direct-observation-before-claim")?.coverageStatus).toBe(
      "mapped",
    );
  });
});

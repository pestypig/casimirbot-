import { describe, expect, it } from "vitest";
import { validateMoralGraphCoverageAuditV1 } from "../../contracts/moral-graph-coverage-audit.v1";
import { auditMoralGraphCoverage } from "../audit-moral-graph-coverage";
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
  const audit = auditMoralGraphCoverage(graphFixture);
  const result = audit.nodes.find((entry) => entry.ideologyNodeId === id);
  if (!result) throw new Error(`Missing audit node: ${id}`);
  return result;
}

describe("MoralGraph coverage audit", () => {
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
    expect(result.mappedActionIds).toEqual(["moral-graph.action_gate.partial-gate"]);
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

    expect(() => auditMoralGraphCoverage(invalid)).toThrow(/missing link endpoint: missing-node/);
  });

  it("produces stable root-first report ordering with remaining nodes sorted by id", () => {
    const audit = auditMoralGraphCoverage(graphFixture);

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
    const audit = auditMoralGraphCoverage(await loadIdeologyGraphFromFile());

    expect(validateMoralGraphCoverageAuditV1(audit)).toEqual([]);
    expect(audit.rootId).toBe("wisdom-first-principles");
    expect(audit.summary.total).toBe(audit.nodes.length);
    expect(audit.summary).toEqual({
      mapped: 26,
      partial: 15,
      conceptual_only: 34,
      unmapped: 0,
      total: 75,
    });
    expect(audit.nodes.find((entry) => entry.ideologyNodeId === "direct-observation-before-claim")?.coverageStatus).toBe(
      "mapped",
    );
  });

  it("shows expanded procedural coverage for concrete ideology nodes without breaking first-principle mappings", async () => {
    const audit = auditMoralGraphCoverage(await loadIdeologyGraphFromFile());
    const byId = new Map(audit.nodes.map((entry) => [entry.ideologyNodeId, entry]));

    for (const id of [
      "mission-ethos",
      "integrity-protocols",
      "provenance-protocol",
      "feedback-loop-hygiene",
      "two-key-approval",
      "training-certification-gate",
      "financial-fog-warning",
      "flattery-laundering-detection",
      "capability-ambition-gradient",
    ]) {
      expect(byId.get(id)).toMatchObject({
        coverageStatus: "mapped",
        mappedBadgeIds: [id],
        mappedPrincipleIds: [id],
        missingProceduralPieces: [],
        recommendedPatchType: "no_change",
      });
    }

    expect(byId.get("direct-observation-before-claim")).toMatchObject({
      coverageStatus: "mapped",
      mappedBadgeIds: ["direct-observation-before-claim"],
      mappedPrincipleIds: ["direct-observation-before-claim"],
      missingProceduralPieces: [],
    });
  });

  it("keeps genuinely broad ideology branches conceptual-only with an explicit rationale", async () => {
    const audit = auditMoralGraphCoverage(await loadIdeologyGraphFromFile());
    const wisdomRoot = audit.nodes.find((entry) => entry.ideologyNodeId === "wisdom-first-principles");
    const bodhisattvaCraft = audit.nodes.find((entry) => entry.ideologyNodeId === "bodhisattva-craft");

    expect(wisdomRoot).toMatchObject({
      coverageStatus: "conceptual_only",
      mappedBadgeIds: [],
      recommendedPatchType: "add_badge",
    });
    expect(wisdomRoot?.notes).toContain(
      "Explicitly left conceptual-only until a concrete procedural rule, evidence need, or action gate is defined.",
    );

    expect(bodhisattvaCraft).toMatchObject({
      coverageStatus: "partial",
      mappedBadgeIds: ["bodhisattva-craft"],
      mappedPrincipleIds: [],
    });
    expect(bodhisattvaCraft?.missingProceduralPieces).toEqual(expect.arrayContaining(["principle_operator"]));
  });
});

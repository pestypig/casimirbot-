import { describe, expect, it } from "vitest";
import type { IdeologyGraphDocument } from "../ideology-graph-types";
import { buildIdeologyGraph, loadIdeologyGraphFromFile } from "../load-ideology-graph";
import { validateIdeologyGraphDocument } from "../validate-ideology-graph";
import {
  findIdeologyActionGates,
  findIdeologyNodesByActionLabel,
  findIdeologyNodesByReference,
  findIdeologyNodesByTag,
  findIdeologyOuterEdgeLenses,
  getIdeologyActionGatePolicy,
  getIdeologyAncestors,
  getIdeologyChildren,
  getIdeologyDescendants,
  getIdeologyNodeById,
  getIdeologyParents,
  getIdeologyPathToRoot,
  getNeighboringSafeguards,
} from "../traverse-ideology-graph";

const validGraph: IdeologyGraphDocument = {
  version: 1,
  rootId: "mission-ethos",
  actionGatePolicy: {
    version: 1,
    covered_action_tags: ["covered-action"],
    legal_key_tags: ["legal-key"],
    ethos_key_tags: ["ethos-key"],
    jurisdiction_floor_ok_tags: ["jurisdiction-floor-ok"],
    hard_fail_ids: {
      missing_legal_key: "IDEOLOGY_MISSING_LEGAL_KEY",
    },
  },
  nodes: [
    {
      id: "mission-ethos",
      title: "Mission Ethos",
      tags: ["root"],
      children: ["right-speech"],
      references: [{ kind: "doc", title: "Mission Ethos Seeds", path: "docs/ethos/why.md" }],
    },
    {
      id: "right-speech",
      title: "Right Speech Infrastructure",
      tags: ["posture"],
      children: ["skillful-mediation"],
      links: [{ rel: "see-also", to: "two-key-approval" }],
      references: [{ kind: "workstation", title: "Voice event scenario", path: "docs/scenarios/voice.md" }],
      actions: [{ label: "Open speech lens", action: { kind: "openPanel" } }],
    },
    {
      id: "skillful-mediation",
      title: "Skillful Mediation",
      tags: ["trait", "outer_edge"],
      references: [{ kind: "scenario", title: "Mediation case", path: "docs/scenarios/mediation.md" }],
    },
    {
      id: "two-key-approval",
      title: "Two-Key Approval",
      tags: ["covered-action", "legal-key"],
      actions: [{ label: "Run gate check", action: { kind: "openPanel" } }],
    },
  ],
};

describe("MoralGraph ideology loader and traversal", () => {
  it("validates and builds a usable ideology graph", () => {
    expect(validateIdeologyGraphDocument(validGraph)).toEqual([]);
    const graph = buildIdeologyGraph(validGraph);

    expect(getIdeologyNodeById(graph, "mission-ethos")?.title).toBe("Mission Ethos");
    expect(getIdeologyChildren(graph, "mission-ethos").map((node) => node.id)).toEqual(["right-speech"]);
    expect(getIdeologyParents(graph, "right-speech").map((node) => node.id)).toEqual(["mission-ethos"]);
    expect(getIdeologyAncestors(graph, "skillful-mediation").map((node) => node.id)).toEqual([
      "right-speech",
      "mission-ethos",
    ]);
    expect(getIdeologyDescendants(graph, "mission-ethos").map((node) => node.id)).toEqual([
      "right-speech",
      "skillful-mediation",
    ]);
  });

  it("loads the canonical docs/ethos/ideology.json seed graph", async () => {
    const graph = await loadIdeologyGraphFromFile();

    expect(graph.rootId).toBe("wisdom-first-principles");
    expect(getIdeologyNodeById(graph, graph.rootId)?.id).toBe("wisdom-first-principles");
    expect(getIdeologyChildren(graph, graph.rootId).map((node) => node.id)).toEqual(
      expect.arrayContaining(["direct-observation-before-claim", "mission-ethos"]),
    );
    expect(getIdeologyPathToRoot(graph, "mission-ethos")).toEqual(["mission-ethos", "wisdom-first-principles"]);
    expect(graph.nodes.length).toBeGreaterThan(0);
    expect(getIdeologyActionGatePolicy(graph)?.hard_fail_ids?.missing_legal_key).toBe("IDEOLOGY_MISSING_LEGAL_KEY");
  });

  it("reports invalid root and invalid link endpoints", () => {
    const invalidRoot = { ...validGraph, rootId: "missing-root" };
    expect(validateIdeologyGraphDocument(invalidRoot)).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "invalid_root", targetId: "missing-root" })]),
    );

    const invalidEndpoint: IdeologyGraphDocument = {
      ...validGraph,
      nodes: [
        ...validGraph.nodes,
        { id: "broken", title: "Broken", children: ["missing-child"], links: [{ rel: "see-also", to: "missing-link" }] },
      ],
    };
    expect(validateIdeologyGraphDocument(invalidEndpoint)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "invalid_child_endpoint", targetId: "missing-child" }),
        expect.objectContaining({ code: "invalid_link_endpoint", targetId: "missing-link" }),
      ]),
    );
  });

  it("finds path to root for a simple trait activation", () => {
    const graph = buildIdeologyGraph(validGraph);

    expect(getIdeologyPathToRoot(graph, "skillful-mediation")).toEqual([
      "skillful-mediation",
      "right-speech",
      "mission-ethos",
    ]);
  });

  it("discovers outer-edge lenses without hardcoded ideology node ids", () => {
    const graph = buildIdeologyGraph(validGraph);

    expect(findIdeologyOuterEdgeLenses(graph).map((node) => node.id)).toEqual(
      expect.arrayContaining(["right-speech", "skillful-mediation", "two-key-approval"]),
    );
    expect(findIdeologyNodesByTag(graph, "trait").map((node) => node.id)).toEqual(["skillful-mediation"]);
    expect(findIdeologyNodesByActionLabel(graph, "speech lens").map((node) => node.id)).toEqual(["right-speech"]);
    expect(findIdeologyNodesByReference(graph, "mediation").map((node) => node.id)).toEqual(["skillful-mediation"]);
  });

  it("looks up action gate policy and neighboring safeguards", () => {
    const graph = buildIdeologyGraph(validGraph);

    expect(getIdeologyActionGatePolicy(graph)?.covered_action_tags).toContain("covered-action");
    expect(findIdeologyActionGates(graph).map((node) => node.id)).toContain("two-key-approval");
    expect(getNeighboringSafeguards(graph, "right-speech").map((node) => node.id)).toEqual(["two-key-approval"]);
  });
});

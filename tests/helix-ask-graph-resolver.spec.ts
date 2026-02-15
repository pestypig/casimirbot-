import { describe, expect, it } from "vitest";
import {
  __testOnlyResolveTreeNeighborIds,
  resolveHelixAskGraphPack,
} from "../server/services/helix-ask/graph-resolver";

const BASE_REGION = {
  B_equals_1: true,
  qi_metric_derived_equals_true: true,
  qi_strict_ok_equals_true: true,
  theta_geom_equals_true: true,
  vdb_two_wall_support_equals_true: false,
  ts_metric_derived_equals_true: false,
  cl3_metric_t00_available_equals_true: false,
  cl3_rho_gate_equals_true: false,
};

describe("helix ask graph resolver congruence overrides", () => {
  it("uses strict theta-geometry default when no congruence override is provided", () => {
    const pack = resolveHelixAskGraphPack({
      question: "simulation api guardrail congruence defaults",
      topicTags: ["physics"],
      lockedTreeIds: ["simulation-systems"],
    });

    const framework = pack?.frameworks.find((entry) => entry.treeId === "simulation-systems");
    expect(framework).toBeTruthy();
    expect(framework?.congruenceDiagnostics?.strictSignals.theta_geom_equals_true).toBe(true);
    expect(framework?.congruenceDiagnostics?.strictSignals.cl3_metric_t00_available_equals_true).toBe(false);
  });

  it("applies runtime B(r)=1 region override and does not reuse stale filtered trees", () => {
    const baseInput = {
      question: "classic alcubierre metric expansion contraction regions",
      topicTags: ["warp"] as const,
      lockedTreeIds: ["warp-mechanics"],
      congruenceWalkOverride: {
        allowedCL: "CL4" as const,
        allowConceptual: false,
        allowProxies: false,
      },
    };

    const withBEqualsOne = resolveHelixAskGraphPack({
      ...baseInput,
      congruenceWalkOverride: {
        ...baseInput.congruenceWalkOverride,
        region: { ...BASE_REGION, B_equals_1: true },
      },
    });
    const withoutBEqualsOne = resolveHelixAskGraphPack({
      ...baseInput,
      congruenceWalkOverride: {
        ...baseInput.congruenceWalkOverride,
        region: { ...BASE_REGION, B_equals_1: false },
      },
    });

    const frameworkWithCondition = withBEqualsOne?.frameworks.find(
      (framework) => framework.treeId === "warp-mechanics",
    );
    const frameworkWithoutCondition = withoutBEqualsOne?.frameworks.find(
      (framework) => framework.treeId === "warp-mechanics",
    );
    const blockedWith = frameworkWithCondition?.congruenceDiagnostics?.blockedByCondition ?? {};
    const blockedWithout = frameworkWithoutCondition?.congruenceDiagnostics?.blockedByCondition ?? {};
    expect(
      frameworkWithCondition?.congruenceDiagnostics?.strictSignals?.B_equals_1,
    ).toBe(true);
    expect(
      frameworkWithoutCondition?.congruenceDiagnostics?.strictSignals?.B_equals_1,
    ).toBe(false);
    expect(frameworkWithCondition?.path).toBeTruthy();
    expect(frameworkWithoutCondition?.path).toBeTruthy();
    expect((blockedWithout as Record<string, number>)["B_equals_1"]).toBeGreaterThanOrEqual(1);
    expect((blockedWith as Record<string, number>)["B_equals_1"]).toBeUndefined();
    expect(
      (frameworkWithCondition?.congruenceDiagnostics?.allowedEdges ?? 0) >
        (frameworkWithoutCondition?.congruenceDiagnostics?.allowedEdges ?? 0),
    ).toBe(true);
    expect((frameworkWithCondition?.path?.length ?? 0) > 0).toBe(true);
    expect((frameworkWithCondition?.congruenceDiagnostics?.inventory.evaluatedEdges ?? 0) > 0).toBe(true);
    expect(frameworkWithCondition?.congruenceDiagnostics?.strictSignals.B_equals_1).toBe(true);
  });

  it("applies runtime QI metric-derived region override and re-filters guardrail edges", () => {
    const baseOverride = {
      allowedCL: "CL4" as const,
      allowConceptual: false,
      allowProxies: false,
    };

    const neighborsWithCondition = __testOnlyResolveTreeNeighborIds({
      treeId: "math-tree-test",
      treePath: "docs/knowledge/physics/math-tree.json",
      nodeId: "ford-roman-qi-guardrail",
      congruenceWalkOverride: {
        ...baseOverride,
        region: { ...BASE_REGION, qi_metric_derived_equals_true: true },
      },
    });
    const neighborsWithoutCondition = __testOnlyResolveTreeNeighborIds({
      treeId: "math-tree-test",
      treePath: "docs/knowledge/physics/math-tree.json",
      nodeId: "ford-roman-qi-guardrail",
      congruenceWalkOverride: {
        ...baseOverride,
        region: { ...BASE_REGION, qi_metric_derived_equals_true: false },
      },
    });

    expect(neighborsWithCondition).toContain("qi-guardrails-stack");
    expect(neighborsWithoutCondition).not.toContain("qi-guardrails-stack");
  });

  it("applies runtime VdB two-wall region override for simulation API guardrail edges", () => {
    const baseOverride = {
      allowedCL: "CL4" as const,
      allowConceptual: false,
      allowProxies: false,
    };

    const neighborsWithCondition = __testOnlyResolveTreeNeighborIds({
      treeId: "condition-fixture",
      treePath: "tests/fixtures/graph-congruence-conditions-tree.json",
      nodeId: "condition-root",
      congruenceWalkOverride: {
        ...baseOverride,
        region: { ...BASE_REGION, vdb_two_wall_support_equals_true: true },
      },
    });
    const neighborsWithoutCondition = __testOnlyResolveTreeNeighborIds({
      treeId: "condition-fixture",
      treePath: "tests/fixtures/graph-congruence-conditions-tree.json",
      nodeId: "condition-root",
      congruenceWalkOverride: {
        ...baseOverride,
        region: { ...BASE_REGION, vdb_two_wall_support_equals_true: false },
      },
    });

    expect(neighborsWithCondition).toContain("vdb-target");
    expect(neighborsWithoutCondition).not.toContain("vdb-target");
  });

  it("applies runtime theta-geometry region override for simulation API guardrail edges", () => {
    const baseOverride = {
      allowedCL: "CL4" as const,
      allowConceptual: false,
      allowProxies: false,
    };

    const neighborsWithCondition = __testOnlyResolveTreeNeighborIds({
      treeId: "condition-fixture",
      treePath: "tests/fixtures/graph-congruence-conditions-tree.json",
      nodeId: "condition-root",
      congruenceWalkOverride: {
        ...baseOverride,
        region: { ...BASE_REGION, theta_geom_equals_true: true },
      },
    });
    const neighborsWithoutCondition = __testOnlyResolveTreeNeighborIds({
      treeId: "condition-fixture",
      treePath: "tests/fixtures/graph-congruence-conditions-tree.json",
      nodeId: "condition-root",
      congruenceWalkOverride: {
        ...baseOverride,
        region: { ...BASE_REGION, theta_geom_equals_true: false },
      },
    });

    expect(neighborsWithCondition).toContain("theta-target");
    expect(neighborsWithoutCondition).not.toContain("theta-target");
  });

  it("applies runtime TS metric-derived region override for uncertainty sampling-window edges", () => {
    const baseOverride = {
      allowedCL: "CL4" as const,
      allowConceptual: false,
      allowProxies: false,
    };

    const neighborsWithCondition = __testOnlyResolveTreeNeighborIds({
      treeId: "condition-fixture",
      treePath: "tests/fixtures/graph-congruence-conditions-tree.json",
      nodeId: "condition-root",
      congruenceWalkOverride: {
        ...baseOverride,
        region: { ...BASE_REGION, ts_metric_derived_equals_true: true },
      },
    });
    const neighborsWithoutCondition = __testOnlyResolveTreeNeighborIds({
      treeId: "condition-fixture",
      treePath: "tests/fixtures/graph-congruence-conditions-tree.json",
      nodeId: "condition-root",
      congruenceWalkOverride: {
        ...baseOverride,
        region: { ...BASE_REGION, ts_metric_derived_equals_true: false },
      },
    });

    expect(neighborsWithCondition).toContain("ts-target");
    expect(neighborsWithoutCondition).not.toContain("ts-target");
  });

  it("applies runtime CL3 metric-source region override for CL3 guardrail edges", () => {
    const baseOverride = {
      allowedCL: "CL4" as const,
      allowConceptual: false,
      allowProxies: false,
    };

    const neighborsWithCondition = __testOnlyResolveTreeNeighborIds({
      treeId: "condition-fixture",
      treePath: "tests/fixtures/graph-congruence-conditions-tree.json",
      nodeId: "condition-root",
      congruenceWalkOverride: {
        ...baseOverride,
        region: { ...BASE_REGION, cl3_metric_t00_available_equals_true: true },
      },
    });
    const neighborsWithoutCondition = __testOnlyResolveTreeNeighborIds({
      treeId: "condition-fixture",
      treePath: "tests/fixtures/graph-congruence-conditions-tree.json",
      nodeId: "condition-root",
      congruenceWalkOverride: {
        ...baseOverride,
        region: { ...BASE_REGION, cl3_metric_t00_available_equals_true: false },
      },
    });

    expect(neighborsWithCondition).toContain("cl3-target");
    expect(neighborsWithoutCondition).not.toContain("cl3-target");
  });

  it("resolves cross-tree strict guardrail targets into traversal diagnostics", () => {
    const pack = resolveHelixAskGraphPack({
      question: "simulation api vdb theta guardrail links",
      topicTags: ["physics"],
      lockedTreeIds: ["simulation-systems"],
      congruenceWalkOverride: {
        allowedCL: "CL4",
        allowConceptual: false,
        allowProxies: false,
        region: {
          ...BASE_REGION,
          vdb_two_wall_support_equals_true: true,
          theta_geom_equals_true: true,
        },
      },
    });

    const framework = pack?.frameworks.find((entry) => entry.treeId === "simulation-systems");
    expect(framework).toBeTruthy();
    expect((framework?.path ?? []).length).toBeGreaterThan(0);
    expect(["root_to_leaf", "root_to_anchor"]).toContain(framework?.pathMode);
    expect((framework?.congruenceDiagnostics?.resolvedCrossTreeEdges ?? 0) > 0).toBe(true);
    expect(framework?.congruenceDiagnostics?.strictSignals.vdb_two_wall_support_equals_true).toBe(true);
    expect(framework?.congruenceDiagnostics?.strictSignals.theta_geom_equals_true).toBe(true);
  });

  it("builds a strict root_to_leaf chain for ideology when requested", () => {
    const pack = resolveHelixAskGraphPack({
      question: "How does Feedback Loop Hygiene affect society?",
      topicTags: ["ideology"],
      lockedTreeIds: ["ideology"],
      pathMode: "root_to_leaf",
    });
    const framework = pack?.frameworks.find((entry) => entry.treeId === "ideology");
    expect(framework).toBeTruthy();
    expect(framework?.pathMode).toBe("root_to_leaf");
    const path = framework?.path ?? [];
    expect(path.length).toBeGreaterThan(0);
    expect(path.length).toBeLessThanOrEqual(8);
    for (let i = 0; i < path.length - 1; i += 1) {
      const from = path[i]?.id;
      const to = path[i + 1]?.id;
      if (!from || !to) continue;
      const neighbors = __testOnlyResolveTreeNeighborIds({
        treeId: "ideology",
        treePath: "docs/ethos/ideology.json",
        nodeId: from,
        congruenceWalkOverride: {
          allowConceptual: true,
          allowProxies: false,
          allowedCL: "CL4",
        },
      });
      expect(neighbors).toContain(to);
    }
  });

  it("uses tree-level root_to_leaf path mode when no per-call override is set", () => {
    const pack = resolveHelixAskGraphPack({
      question: "What is Feedback Loop Hygiene and why does it matter?",
      topicTags: ["ideology"],
      lockedTreeIds: ["ideology"],
    });
    const framework = pack?.frameworks.find((entry) => entry.treeId === "ideology");
    expect(framework?.pathMode).toBe("root_to_leaf");
    expect(framework?.path).toBeTruthy();
  });

  it("applies pack-level root_to_leaf path mode for trees without tree overrides", () => {
    const pack = resolveHelixAskGraphPack({
      question: "How do constraint guards affect warp metrics in simulations?",
      topicTags: ["physics"],
      lockedTreeIds: ["math"],
    });
    const framework = pack?.frameworks.find((entry) => entry.treeId === "math");
    expect(framework?.pathMode).toBe("root_to_leaf");
    expect(framework?.path).toBeTruthy();
  });

  it("respects per-call root_to_leaf override over tree configuration", () => {
    const pack = resolveHelixAskGraphPack({
      question: "What is Feedback Loop Hygiene and why does it matter?",
      topicTags: ["ideology"],
      lockedTreeIds: ["ideology"],
      pathMode: "full",
    });
    const framework = pack?.frameworks.find((entry) => entry.treeId === "ideology");
    expect(framework?.pathMode).toBe("full");
    expect(framework?.path).toBeTruthy();
  });

  it("falls back to root_to_anchor continuity when requested explicitly", () => {
    const pack = resolveHelixAskGraphPack({
      question: "How does Feedback Loop Hygiene affect society?",
      topicTags: ["ideology"],
      pathMode: "root_to_anchor",
      lockedTreeIds: ["ideology"],
    });
    const framework = pack?.frameworks.find((entry) => entry.treeId === "ideology");
    expect(framework?.pathMode).toBe("root_to_anchor");
    const path = framework?.path ?? [];
    expect(path.length).toBeGreaterThan(0);
    if (framework?.rootId) {
      expect(path[0]?.id).toBe(framework.rootId);
    }
  });
});

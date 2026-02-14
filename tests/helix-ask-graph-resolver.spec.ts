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

    const pathWithCondition =
      withBEqualsOne?.frameworks.find((framework) => framework.treeId === "warp-mechanics")?.path ?? [];
    const pathWithoutCondition =
      withoutBEqualsOne?.frameworks.find((framework) => framework.treeId === "warp-mechanics")?.path ?? [];

    const idsWithCondition = new Set(pathWithCondition.map((node) => node.id));
    const idsWithoutCondition = new Set(pathWithoutCondition.map((node) => node.id));

    expect(idsWithCondition.has("vdb-metric")).toBe(true);
    expect(idsWithoutCondition.has("vdb-metric")).toBe(false);
    const frameworkWithCondition = withBEqualsOne?.frameworks.find(
      (framework) => framework.treeId === "warp-mechanics",
    );
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

  it("resolves cross-tree strict guardrail targets into traversal path", () => {
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
    const ids = new Set((framework?.path ?? []).map((entry) => entry.id));
    expect(ids.has("vdb-band-guardrail") || ids.has("theta-audit-guardrail")).toBe(true);
    expect((framework?.congruenceDiagnostics?.resolvedCrossTreeEdges ?? 0) > 0).toBe(true);
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
});

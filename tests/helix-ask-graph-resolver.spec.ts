import { describe, expect, it } from "vitest";
import {
  __testOnlyHasStellarBridgeEvidenceContract,
  __testOnlyNormalizeGraphEvidenceEntry,
  __testOnlyResolveBridgeMissingEvidencePath,
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
    expect(["root_to_leaf", "root_to_anchor"]).toContain(framework?.pathMode ?? "");
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
    expect(["root_to_leaf", "root_to_anchor"]).toContain(framework?.pathMode ?? "");
    expect(framework?.path).toBeTruthy();
  });

  it("applies pack-level root_to_leaf path mode for trees without tree overrides", () => {
    const pack = resolveHelixAskGraphPack({
      question: "How do constraint guards affect warp metrics in simulations?",
      topicTags: ["physics"],
      lockedTreeIds: ["math"],
    });
    const framework = pack?.frameworks.find((entry) => entry.treeId === "math");
    expect(["root_to_leaf", "root_to_anchor"]).toContain(framework?.pathMode ?? "");
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

  it("normalizes bridge evidence contract metadata fields additively", () => {
    const entry = __testOnlyNormalizeGraphEvidenceEntry({
      type: "doc",
      path: "docs/knowledge/physics/einstein-field-equations.md",
      scope: "left",
      provenance_class: "MEASURED",
      claim_tier: "Diagnostic",
      certifying: false,
    });

    expect(entry).toBeTruthy();
    expect(entry?.scope).toBe("left");
    expect(entry?.provenance_class).toBe("measured");
    expect(entry?.claim_tier).toBe("diagnostic");
    expect(entry?.certifying).toBe(false);
  });


  it("enforces deterministic stellar bridge evidence contract fields", () => {
    const validContract = __testOnlyHasStellarBridgeEvidenceContract({
      path: [
        {
          id: "bridge-orch-or-to-stellar-coherence",
          nodeType: "bridge",
          evidence: [
            {
              type: "doc",
              path: "docs/stellar-consciousness-orch-or-review.md",
              scope: "left",
              provenance_class: "inferred",
              claim_tier: "diagnostic",
              certifying: false,
            },
            {
              type: "doc",
              path: "docs/knowledge/physics/no-feasibility-claims.md",
              scope: "right",
              provenance_class: "measured",
              claim_tier: "certified",
              certifying: true,
            },
          ],
        },
      ],
    });
    const invalidContract = __testOnlyHasStellarBridgeEvidenceContract({
      path: [
        {
          id: "bridge-noise-spectrum-to-collapse-proxy",
          nodeType: "bridge",
          evidence: [
            {
              type: "doc",
              path: "docs/knowledge/physics/uncertainty-mechanics.md",
              scope: "left",
              claim_tier: "diagnostic",
              certifying: false,
            },
            {
              type: "doc",
              path: "docs/knowledge/bridges/ideology-physics-bridge-tree.json",
              scope: "sideways",
              provenance_class: "inferred",
              claim_tier: "diagnostic",
              certifying: true,
            },
          ],
        },
      ],
    });

    expect(validContract).toBe(true);
    expect(invalidContract).toBe(false);
  });

  it("registers stellar PS1 bridge tree and preserves deterministic traversal order", () => {
    const question = "Explain consciousness and cosmology bridge constraints for open-world life prompts";
    const first = resolveHelixAskGraphPack({
      question,
      topicTags: ["physics", "star"],
      lockedTreeIds: ["stellar-ps1-bridges"],
      pathMode: "full",
    });
    const second = resolveHelixAskGraphPack({
      question,
      topicTags: ["physics", "star"],
      lockedTreeIds: ["stellar-ps1-bridges"],
      pathMode: "full",
    });

    const firstFramework = first?.frameworks.find((entry) => entry.treeId === "stellar-ps1-bridges");
    const secondFramework = second?.frameworks.find((entry) => entry.treeId === "stellar-ps1-bridges");
    expect(firstFramework).toBeTruthy();
    expect(secondFramework).toBeTruthy();

    const firstPath = (firstFramework?.path ?? []).map((entry) => entry.id);
    const secondPath = (secondFramework?.path ?? []).map((entry) => entry.id);
    expect(firstPath).toEqual(secondPath);
    expect(firstPath).toContain("bridge-orch-or-to-stellar-coherence");
    expect(firstPath).toContain("bridge-noise-spectrum-to-collapse-proxy");
  });

  it("routes 'how does the universe produce life' prompts through deterministic stellar life/cosmology bridge", () => {
    const pack = resolveHelixAskGraphPack({
      question: "How does the universe produce life?",
      topicTags: ["physics", "star"],
      lockedTreeIds: ["stellar-ps1-bridges"],
    });

    const framework = pack?.frameworks.find((entry) => entry.treeId === "stellar-ps1-bridges");
    expect(["root_to_leaf", "root_to_anchor"]).toContain(framework?.pathMode ?? "");
    const candidates = [...(framework?.path ?? []), ...(framework?.anchors ?? [])];
    const bridge = candidates.find((entry) => entry.id === "bridge-orch-or-to-stellar-coherence");
    expect(bridge).toBeTruthy();
    expect(bridge?.evidence).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "docs/knowledge/bridges/life-cosmology-consciousness-bridge.json",
          provenance_class: "measured",
          claim_tier: "reduced-order",
          certifying: false,
        }),
      ]),
    );
  });

  it("emits structured missing-evidence path for life/cosmology/consciousness family when bridge anchors are missing", () => {
    const missing = __testOnlyResolveBridgeMissingEvidencePath({
      question: "How does consciousness relate to cosmology and life emergence in open-world settings?",
      availableNodeIds: ["uncertainty-mechanics"],
      bridgeNodeIds: ["bridge-orch-or-to-stellar-coherence"],
    });

    expect(missing).toBeTruthy();
    expect(missing?.family).toBe("life_cosmology_consciousness");
    expect(missing?.missingAnchors).toEqual(
      expect.arrayContaining([
        "expansion_frontier",
        "no-feasibility-claims",
        "qi-diagnostics-schema",
        "sampling-time-bounds",
        "scaling-laws",
      ]),
    );
  });

  it("emits structured missing-evidence path for AI/financial/defense/security family", () => {
    const missing = __testOnlyResolveBridgeMissingEvidencePath({
      question: "What is the security posture for AI financial defense under adversarial risk?",
      availableNodeIds: ["uncertainty-mechanics", "no-feasibility-claims"],
      bridgeNodeIds: ["bridge-noise-spectrum-to-collapse-proxy"],
    });

    expect(missing).toBeTruthy();
    expect(missing?.family).toBe("ai_financial_defense_security");
    expect(missing?.missingAnchors).toEqual(expect.arrayContaining(["sampling-time-bounds", "verification_hook"]));
    expect(missing?.bridgeNodes).toContain("bridge-noise-spectrum-to-collapse-proxy");
  });

});

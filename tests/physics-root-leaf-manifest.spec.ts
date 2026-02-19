import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { validatePhysicsRootLeafManifest } from "../scripts/validate-physics-root-leaf-manifest";

const tempRoots: string[] = [];

function writeJson(filePath: string, value: unknown) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function makeFixture(mutator?: (manifest: Record<string, unknown>) => void) {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "physics-root-leaf-"));
  tempRoots.push(repoRoot);

  const manifest: Record<string, unknown> = {
    schema_version: "physics_root_leaf_manifest/1",
    manifest_id: "fixture",
    claim_tier_ceiling: "diagnostic",
    roots: [
      {
        id: "physics_spacetime_gr",
        name: "GR",
        tree_lane: "physics_spacetime_gr",
        tree_path: "docs/knowledge/physics/physics-spacetime-gr-tree.json",
      },
      {
        id: "physics_quantum_semiclassical",
        name: "QFT curved spacetime",
        tree_lane: "physics_quantum_semiclassical",
        tree_path: "docs/knowledge/physics/physics-quantum-semiclassical-tree.json",
      },
      { id: "physics_thermodynamics_entropy", name: "Thermodynamics" },
      { id: "physics_information_dynamics", name: "Information dynamics" },
      { id: "physics_prebiotic_chemistry", name: "Prebiotic chemistry" },
      { id: "physics_biology_life", name: "Biology" },
      { id: "physics_runtime_safety_control", name: "Runtime safety" },
    ],
    leaves: [
      {
        id: "leaf_universe_produces_life",
        prompt_family: "how does the universe produce life",
        statement: "life prompt chain",
      },
      {
        id: "leaf_human_ai_financial_safety",
        prompt_family: "human protection from ai financial hack",
        statement: "safety prompt chain",
      },
    ],
    paths: [
      {
        id: "path_entropy_to_life",
        root_id: "physics_thermodynamics_entropy",
        leaf_id: "leaf_universe_produces_life",
        nodes: [
          "physics_thermodynamics_entropy",
          "physics_information_dynamics",
          "physics_biology_life",
          "leaf_universe_produces_life",
        ],
        dag_bridges: ["life-cosmology-consciousness-bridge"],
        falsifier: {
          observable: "citation linkage",
          reject_rule: "link_rate < 0.9",
          uncertainty_model: "GUM_linear",
          test_refs: ["tests/helix-ask-ps2-runtime-report.spec.ts"],
        },
        maturity_gate: {
          max_claim_tier: "diagnostic",
          required_evidence_types: ["measured", "proxy", "inferred"],
          strict_fail_reason: "ROOT_LEAF_FALSIFIER_MISSING",
        },
      },
      {
        id: "path_spacetime_to_life",
        root_id: "physics_spacetime_gr",
        leaf_id: "leaf_universe_produces_life",
        nodes: [
          "physics_spacetime_gr",
          "physics_quantum_semiclassical",
          "physics_thermodynamics_entropy",
          "physics_biology_life",
          "leaf_universe_produces_life",
        ],
        dag_bridges: ["life-cosmology-consciousness-bridge"],
        falsifier: {
          observable: "equation-grounded path completeness",
          reject_rule: "missing canonical equation refs",
          uncertainty_model: "deterministic_threshold_contract_v1",
          test_refs: ["scripts/validate-physics-root-leaf-manifest.ts"],
        },
        maturity_gate: {
          max_claim_tier: "diagnostic",
          required_evidence_types: ["proxy", "inferred"],
          strict_fail_reason: "ROOT_LEAF_PATH_INCOMPLETE",
        },
      },
      {
        id: "path_quantum_to_consciousness",
        root_id: "physics_quantum_semiclassical",
        leaf_id: "leaf_universe_produces_life",
        nodes: [
          "physics_quantum_semiclassical",
          "physics_information_dynamics",
          "physics_thermodynamics_entropy",
          "leaf_universe_produces_life",
        ],
        dag_bridges: ["life-cosmology-consciousness-bridge"],
        falsifier: {
          observable: "bridge provenance determinism",
          reject_rule: "strict bridge gate missing deterministic reason",
          uncertainty_model: "deterministic_contract_gate",
          test_refs: ["tests/helix-ask-bridge.spec.ts"],
        },
        maturity_gate: {
          max_claim_tier: "diagnostic",
          required_evidence_types: ["proxy", "inferred"],
          strict_fail_reason: "ROOT_LEAF_STRICT_BRIDGE_FAIL",
        },
      },
      {
        id: "path_information_to_life",
        root_id: "physics_information_dynamics",
        leaf_id: "leaf_universe_produces_life",
        nodes: [
          "physics_information_dynamics",
          "physics_prebiotic_chemistry",
          "physics_biology_life",
          "leaf_universe_produces_life",
        ],
        dag_bridges: ["life-cosmology-consciousness-bridge"],
        falsifier: {
          observable: "coherence linkage",
          reject_rule: "coherence_link_rate < 0.9",
          uncertainty_model: "GUM_linear",
          test_refs: ["tests/physics-root-leaf-manifest.spec.ts"],
        },
        maturity_gate: {
          max_claim_tier: "diagnostic",
          required_evidence_types: ["proxy", "inferred"],
          strict_fail_reason: "ROOT_LEAF_INFORMATION_DYNAMICS_PATH_MISSING",
        },
      },
      {
        id: "path_prebiotic_to_life",
        root_id: "physics_prebiotic_chemistry",
        leaf_id: "leaf_universe_produces_life",
        nodes: [
          "physics_prebiotic_chemistry",
          "physics_biology_life",
          "leaf_universe_produces_life",
        ],
        dag_bridges: ["life-cosmology-consciousness-bridge"],
        falsifier: {
          observable: "prebiotic alignment",
          reject_rule: "prebiotic_alignment_rate < 0.9",
          uncertainty_model: "GUM_linear",
          test_refs: ["tests/physics-root-leaf-manifest.spec.ts"],
        },
        maturity_gate: {
          max_claim_tier: "diagnostic",
          required_evidence_types: ["measured", "proxy", "inferred"],
          strict_fail_reason: "ROOT_LEAF_PREBIOTIC_PATH_MISSING",
        },
      },
      {
        id: "path_runtime_control_to_safety",
        root_id: "physics_runtime_safety_control",
        leaf_id: "leaf_human_ai_financial_safety",
        nodes: [
          "physics_runtime_safety_control",
          "physics_information_dynamics",
          "leaf_human_ai_financial_safety",
        ],
        dag_bridges: ["life-cosmology-consciousness-bridge"],
        falsifier: {
          observable: "runtime determinism",
          reject_rule: "determinism_rate < 0.98",
          uncertainty_model: "runtime_gate_thresholds",
          test_refs: ["tests/casimir-verify-ps2.spec.ts"],
        },
        maturity_gate: {
          max_claim_tier: "diagnostic",
          required_evidence_types: ["proxy", "inferred"],
          strict_fail_reason: "ROOT_LEAF_RUNTIME_CONTROL_PATH_MISSING",
        },
      },
      {
        id: "path_life_to_safety",
        root_id: "physics_biology_life",
        leaf_id: "leaf_human_ai_financial_safety",
        nodes: [
          "physics_biology_life",
          "physics_runtime_safety_control",
          "leaf_human_ai_financial_safety",
        ],
        dag_bridges: ["life-cosmology-consciousness-bridge"],
        falsifier: {
          observable: "non_200 rate",
          reject_rule: "non_200_rate > 0.02",
          uncertainty_model: "runtime_gate_thresholds",
          test_refs: ["tests/casimir-verify-ps2.spec.ts"],
        },
        maturity_gate: {
          max_claim_tier: "diagnostic",
          required_evidence_types: ["proxy", "inferred"],
          strict_fail_reason: "ROOT_LEAF_RUNTIME_SAFETY_MISSING",
        },
      },
    ],
  };

  mutator?.(manifest);
  writeJson(path.join(repoRoot, "configs", "physics-root-leaf-manifest.v1.json"), manifest);
  return repoRoot;
}

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

describe("validatePhysicsRootLeafManifest", () => {
  it("passes for a complete root-to-leaf manifest", () => {
    const repoRoot = makeFixture();
    const result = validatePhysicsRootLeafManifest({ repoRoot });
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });


  it("fails when dedicated root tree lane metadata is missing", () => {
    const repoRoot = makeFixture((manifest) => {
      const roots = manifest.roots as Array<Record<string, unknown>>;
      delete roots[0].tree_lane;
    });

    const result = validatePhysicsRootLeafManifest({ repoRoot });
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toContain("roots[0].tree_lane must be physics_spacetime_gr");
  });

  it("fails when a required root is missing", () => {
    const repoRoot = makeFixture((manifest) => {
      const roots = manifest.roots as Array<Record<string, unknown>>;
      manifest.roots = roots.filter((entry) => entry.id !== "physics_information_dynamics");
    });

    const result = validatePhysicsRootLeafManifest({ repoRoot });
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toContain(
      "missing required root id: physics_information_dynamics",
    );
  });

  it("fails when root/leaf path endpoints are inconsistent", () => {
    const repoRoot = makeFixture((manifest) => {
      const paths = manifest.paths as Array<Record<string, unknown>>;
      const target = paths[0];
      target.nodes = ["physics_biology_life", "leaf_universe_produces_life"];
    });

    const result = validatePhysicsRootLeafManifest({ repoRoot });
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toContain("paths[0].nodes must start with root_id");
  });

  it("fails when canonical entropy-first life path is missing", () => {
    const repoRoot = makeFixture((manifest) => {
      const paths = manifest.paths as Array<Record<string, unknown>>;
      const target = paths[0];
      target.root_id = "physics_quantum_semiclassical";
      target.nodes = [
        "physics_quantum_semiclassical",
        "physics_information_dynamics",
        "physics_biology_life",
        "leaf_universe_produces_life",
      ];
    });

    const result = validatePhysicsRootLeafManifest({ repoRoot });
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toContain(
      "paths must include at least one canonical entropy-first path ending at leaf_universe_produces_life",
    );
  });

  it("fails when required root-lane entrypoint coverage is missing", () => {
    const repoRoot = makeFixture((manifest) => {
      const paths = manifest.paths as Array<Record<string, unknown>>;
      manifest.paths = paths.filter((entry) => entry.root_id !== "physics_runtime_safety_control");
    });

    const result = validatePhysicsRootLeafManifest({ repoRoot });
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toContain(
      "missing required root-lane entrypoint path for root_id: physics_runtime_safety_control",
    );
  });

  it("fails when falsifier and maturity gate are incomplete", () => {
    const repoRoot = makeFixture((manifest) => {
      const paths = manifest.paths as Array<Record<string, unknown>>;
      const target = paths[0];
      target.falsifier = {
        observable: "",
        reject_rule: "",
        uncertainty_model: "",
        test_refs: [],
      };
      target.maturity_gate = {
        max_claim_tier: "certified",
        required_evidence_types: [],
        strict_fail_reason: "",
      };
    });

    const result = validatePhysicsRootLeafManifest({ repoRoot });
    expect(result.ok).toBe(false);
    const combined = result.errors.join("\n");
    expect(combined).toContain("paths[0].falsifier.observable is required");
    expect(combined).toContain("paths[0].falsifier.test_refs must be non-empty");
    expect(combined).toContain("paths[0].maturity_gate.max_claim_tier cannot exceed claim_tier_ceiling");
    expect(combined).toContain("paths[0].maturity_gate.strict_fail_reason is required");
  });
});

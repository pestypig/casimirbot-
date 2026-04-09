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
      {
        id: "physics_thermodynamics_entropy",
        name: "Thermodynamics",
        tree_lane: "physics_thermodynamics_entropy",
        tree_path: "docs/knowledge/physics/physics-thermodynamics-entropy-tree.json",
      },
      {
        id: "physics_information_dynamics",
        name: "Information dynamics",
        tree_lane: "physics_information_dynamics",
        tree_path: "docs/knowledge/physics/physics-information-dynamics-tree.json",
      },
      { id: "physics_prebiotic_chemistry", name: "Prebiotic chemistry" },
      { id: "physics_biology_life", name: "Biology" },
      { id: "physics_runtime_safety_control", name: "Runtime safety" },
      { id: "physics_casimir_force_measurement", name: "Casimir force measurement" },
      { id: "physics_stress_energy_brick", name: "Stress-energy brick" },
      { id: "physics_gr_diagnostics", name: "GR diagnostics" },
      { id: "physics_curvature_proxy", name: "Curvature proxy" },
      { id: "physics_collapse_benchmark", name: "Collapse benchmark" },
      { id: "physics_solar_coherence_hypothesis", name: "Solar coherence hypothesis" },
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
      {
        id: "leaf_stress_energy_brick",
        prompt_family: "measured casimir force to stress-energy brick",
        statement: "flagship bridge stage 1",
      },
      {
        id: "leaf_gr_diagnostics",
        prompt_family: "stress-energy brick to gr diagnostics",
        statement: "flagship bridge stage 2",
      },
      {
        id: "leaf_curvature_proxy",
        prompt_family: "gr diagnostics to curvature proxy",
        statement: "flagship bridge stage 3",
      },
      {
        id: "leaf_collapse_benchmark",
        prompt_family: "curvature proxy to collapse benchmark",
        statement: "flagship bridge stage 4",
      },
      {
        id: "leaf_solar_collapse_hypothesis",
        prompt_family: "solar coherence to collapse hypothesis",
        statement: "quarantined hypothesis lane",
      },
    ],
    paths: [
      {
        id: "path_entropy_to_life",
        bundle_id: "legacy.root-leaf.audit",
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
          uncertainty_model: "deterministic_threshold_contract_v1(pass_threshold=0.95,fail_threshold=0.90)",
          test_refs: ["tests/helix-ask-ps2-runtime-report.spec.ts", "tests/gr-constraint-network.spec.ts"],
        },
        maturity_gate: {
          max_claim_tier: "diagnostic",
          required_evidence_types: ["measured", "proxy", "inferred"],
          strict_fail_reason: "ROOT_LEAF_FALSIFIER_MISSING",
        },
      },
      {
        id: "path_spacetime_to_life",
        bundle_id: "legacy.root-leaf.audit",
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
          uncertainty_model: "deterministic_threshold_contract_v1(pass_threshold=0.95,fail_threshold=0.90)",
          test_refs: ["scripts/validate-physics-root-leaf-manifest.ts", "tests/gr-constraint-gate.spec.ts"],
        },
        maturity_gate: {
          max_claim_tier: "diagnostic",
          required_evidence_types: ["proxy", "inferred"],
          strict_fail_reason: "ROOT_LEAF_PATH_INCOMPLETE",
        },
      },
      {
        id: "path_quantum_to_consciousness",
        bundle_id: "legacy.root-leaf.audit",
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
          uncertainty_model: "deterministic_contract_gate(decision_mode=strict,strict_reason_required=true)",
          test_refs: ["tests/helix-ask-bridge.spec.ts", "tests/gr-agent-loop.spec.ts"],
        },
        maturity_gate: {
          max_claim_tier: "diagnostic",
          required_evidence_types: ["proxy", "inferred"],
          strict_fail_reason: "ROOT_LEAF_STRICT_BRIDGE_FAIL",
        },
      },
      {
        id: "path_information_to_life",
        bundle_id: "legacy.root-leaf.audit",
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
          uncertainty_model: "deterministic_threshold_contract_v1(pass_threshold=0.95,fail_threshold=0.90)",
          test_refs: ["tests/physics-root-leaf-manifest.spec.ts", "tests/gr-constraint-network.spec.ts"],
        },
        maturity_gate: {
          max_claim_tier: "diagnostic",
          required_evidence_types: ["proxy", "inferred"],
          strict_fail_reason: "ROOT_LEAF_INFORMATION_DYNAMICS_PATH_MISSING",
        },
      },
      {
        id: "path_prebiotic_to_life",
        bundle_id: "legacy.root-leaf.audit",
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
          uncertainty_model: "deterministic_threshold_contract_v1(pass_threshold=0.95,fail_threshold=0.90)",
          test_refs: ["tests/physics-root-leaf-manifest.spec.ts", "tests/gr-constraint-network.spec.ts"],
        },
        maturity_gate: {
          max_claim_tier: "diagnostic",
          required_evidence_types: ["measured", "proxy", "inferred"],
          strict_fail_reason: "ROOT_LEAF_PREBIOTIC_PATH_MISSING",
        },
      },
      {
        id: "path_runtime_control_to_safety",
        bundle_id: "legacy.root-leaf.audit",
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
          uncertainty_model: "runtime_gate_thresholds(determinism_min=0.98,citation_min=0.95,non_200_max=0.02)",
          test_refs: ["tests/casimir-verify-ps2.spec.ts", "tests/gr-constraint-network.spec.ts"],
        },
        maturity_gate: {
          max_claim_tier: "diagnostic",
          required_evidence_types: ["proxy", "inferred"],
          strict_fail_reason: "ROOT_LEAF_RUNTIME_CONTROL_PATH_MISSING",
        },
      },
      {
        id: "path_life_to_safety",
        bundle_id: "legacy.root-leaf.audit",
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
          uncertainty_model: "runtime_gate_thresholds(determinism_min=0.98,citation_min=0.95,non_200_max=0.02)",
          test_refs: ["tests/casimir-verify-ps2.spec.ts", "tests/gr-constraint-network.spec.ts"],
        },
        maturity_gate: {
          max_claim_tier: "diagnostic",
          required_evidence_types: ["proxy", "inferred"],
          strict_fail_reason: "ROOT_LEAF_RUNTIME_SAFETY_MISSING",
        },
      },
      {
        id: "path_casimir_force_to_stress_energy",
        bundle_id: "nhm2.curvature-collapse",
        root_id: "physics_casimir_force_measurement",
        leaf_id: "leaf_stress_energy_brick",
        nodes: [
          "physics_casimir_force_measurement",
          "physics_stress_energy_brick",
          "leaf_stress_energy_brick",
        ],
        dag_bridges: [
          "bridge-casimir-force-to-measured-mass-normalization",
          "bridge-measured-mass-normalization-to-stress-energy-brick",
        ],
        falsifier: {
          observable: "measured force bridge residuals",
          reject_rule: "massFitResidual_rms_rel > 0.1",
          uncertainty_model:
            "deterministic_threshold_contract_v1(pass_threshold=0.95,fail_threshold=0.90)",
          test_refs: ["tests/pipeline-mass-mode.spec.ts", "tests/casimir-inference.spec.ts"],
        },
        maturity_gate: {
          max_claim_tier: "diagnostic",
          required_evidence_types: ["measured", "inferred"],
          strict_fail_reason: "ROOT_LEAF_CASIMIR_STRESS_BRIDGE_FAIL",
        },
      },
      {
        id: "path_stress_energy_to_gr_diagnostics",
        bundle_id: "nhm2.curvature-collapse",
        root_id: "physics_stress_energy_brick",
        leaf_id: "leaf_gr_diagnostics",
        nodes: [
          "physics_stress_energy_brick",
          "physics_spacetime_gr",
          "physics_gr_diagnostics",
          "leaf_gr_diagnostics",
        ],
        dag_bridges: [
          "bridge-stress-energy-brick-to-gr-fieldset",
          "bridge-gr-fieldset-to-diagnostics-ledger",
        ],
        falsifier: {
          observable: "stress-energy to GR diagnostics residual parity",
          reject_rule: "stressEnergyToGRResidual_rms > 0.1",
          uncertainty_model:
            "deterministic_threshold_contract_v1(pass_threshold=0.95,fail_threshold=0.90)",
          test_refs: ["tests/stress-energy-matter.spec.ts", "tests/gr-constraint-gate.spec.ts"],
        },
        maturity_gate: {
          max_claim_tier: "diagnostic",
          required_evidence_types: ["measured", "proxy", "inferred"],
          strict_fail_reason: "ROOT_LEAF_STRESS_GR_BRIDGE_FAIL",
        },
      },
      {
        id: "path_gr_diagnostics_to_curvature_proxy",
        bundle_id: "nhm2.curvature-collapse",
        root_id: "physics_gr_diagnostics",
        leaf_id: "leaf_curvature_proxy",
        nodes: ["physics_gr_diagnostics", "physics_curvature_proxy", "leaf_curvature_proxy"],
        dag_bridges: [
          "bridge-gr-diagnostics-to-kappa-parity",
          "bridge-curvature-ledger-to-kappa-proxy",
        ],
        falsifier: {
          observable: "equation-grounded kappa parity residual evidence",
          reject_rule: "kappaParityResidual_rms > 0.1 OR missing residual evidence",
          uncertainty_model:
            "deterministic_threshold_contract_v1(pass_threshold=0.95,fail_threshold=0.90)",
          test_refs: ["tests/stress-energy-units.spec.ts", "tests/physics-equation-backbone.spec.ts"],
        },
        maturity_gate: {
          max_claim_tier: "diagnostic",
          required_evidence_types: ["measured", "proxy", "inferred"],
          strict_fail_reason: "ROOT_LEAF_GR_CURVATURE_BRIDGE_FAIL",
        },
      },
      {
        id: "path_curvature_proxy_to_collapse_benchmark",
        bundle_id: "nhm2.curvature-collapse",
        root_id: "physics_curvature_proxy",
        leaf_id: "leaf_collapse_benchmark",
        nodes: ["physics_curvature_proxy", "physics_collapse_benchmark", "leaf_collapse_benchmark"],
        dag_bridges: [
          "bridge-kappa-proxy-to-collapse-benchmark",
          "bridge-curvature-ledger-to-tau-rc-benchmark",
        ],
        falsifier: {
          observable: "prediction-registry-backed null model comparison",
          reject_rule: "nullModelComparisonWin != true",
          uncertainty_model:
            "deterministic_threshold_contract_v1(pass_threshold=0.95,fail_threshold=0.90)",
          test_refs: [
            "tests/collapse-benchmark.phase2.routes.spec.ts",
            "tests/collapse-benchmark.phase4.estimator.spec.ts",
          ],
        },
        maturity_gate: {
          max_claim_tier: "diagnostic",
          required_evidence_types: ["measured", "proxy", "inferred"],
          strict_fail_reason: "ROOT_LEAF_CURVATURE_COLLAPSE_BRIDGE_FAIL",
        },
      },
      {
        id: "path_solar_coherence_to_collapse_hypothesis",
        bundle_id: "nhm2.curvature-collapse",
        root_id: "physics_solar_coherence_hypothesis",
        leaf_id: "leaf_solar_collapse_hypothesis",
        nodes: [
          "physics_solar_coherence_hypothesis",
          "physics_information_dynamics",
          "physics_collapse_benchmark",
          "leaf_solar_collapse_hypothesis",
        ],
        dag_bridges: [
          "bridge-solar-coherence-to-collapse-hypothesis",
          "bridge-information-dynamics-to-hypothesis-quarantine",
        ],
        falsifier: {
          observable: "hypothesis quarantine determinism",
          reject_rule: "quarantineStatus != true",
          uncertainty_model:
            "deterministic_contract_gate(decision_mode=strict,strict_reason_required=true)",
          test_refs: ["tests/helix-ask-graph-resolver.spec.ts", "tests/helix-ask-bridge.spec.ts"],
        },
        maturity_gate: {
          max_claim_tier: "diagnostic",
          required_evidence_types: ["proxy", "inferred"],
          strict_fail_reason: "ROOT_LEAF_SOLAR_COLLAPSE_HYPOTHESIS_QUARANTINED",
        },
      },
    ],
    bridge_bundles: [
      {
        id: "legacy.root-leaf.audit",
        summary: "legacy broad root-leaf coverage",
        claim_scope: "runtime_contract",
        max_claim_tier: "diagnostic",
        path_ids: [
          "path_entropy_to_life",
          "path_spacetime_to_life",
          "path_quantum_to_consciousness",
          "path_information_to_life",
          "path_prebiotic_to_life",
          "path_runtime_control_to_safety",
          "path_life_to_safety",
        ],
      },
      {
        id: "nhm2.curvature-collapse",
        summary: "flagship measured Casimir to curvature-collapse bridge family",
        claim_scope: "cross_domain",
        max_claim_tier: "diagnostic",
        path_ids: [
          "path_casimir_force_to_stress_energy",
          "path_stress_energy_to_gr_diagnostics",
          "path_gr_diagnostics_to_curvature_proxy",
          "path_curvature_proxy_to_collapse_benchmark",
          "path_solar_coherence_to_collapse_hypothesis",
        ],
      },
    ],
    maturity_propagation_policy: {
      enabled: true,
      no_over_promotion: true,
      strict_fail_reason: "FAIL_MATURITY_CEILING_VIOLATION",
      default_max_claim_tier: "diagnostic",
      upstream_claim_tier_blocklist_for_certified: ["diagnostic", "reduced-order"],
      upstream_provenance_blocklist_for_certified: ["proxy", "inferred"],
    },
  };

  mutator?.(manifest);
  writeJson(path.join(repoRoot, "configs", "physics-root-leaf-manifest.v1.json"), manifest);
  writeJson(path.join(repoRoot, "configs", "uncertainty-model-registry.v1.json"), {
    schema_version: "uncertainty_model_registry/1",
    registry_id: "fixture-registry",
    models: [
      {
        id: "deterministic_threshold_contract_v1",
        required_parameters: ["pass_threshold", "fail_threshold"],
        optional_parameters: ["window", "aggregation"],
      },
      {
        id: "deterministic_contract_gate",
        required_parameters: ["decision_mode", "strict_reason_required"],
        optional_parameters: ["replay_window"],
      },
      {
        id: "runtime_gate_thresholds",
        required_parameters: ["determinism_min", "citation_min", "non_200_max"],
        optional_parameters: ["latency_p95_max_ms"],
      },
    ],
  });
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

  it("fails when the flagship curvature-collapse bundle is incomplete", () => {
    const repoRoot = makeFixture((manifest) => {
      const bundles = manifest.bridge_bundles as Array<Record<string, unknown>>;
      const flagship = bundles.find((entry) => entry.id === "nhm2.curvature-collapse");
      if (!flagship) {
        throw new Error("missing flagship bundle in fixture");
      }
      flagship.path_ids = ["path_casimir_force_to_stress_energy"];
    });

    const result = validatePhysicsRootLeafManifest({ repoRoot });
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toContain(
      "bridge bundle nhm2.curvature-collapse missing required path_id: path_stress_energy_to_gr_diagnostics",
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

  it("fails deterministically when equation-grounded paths omit residual evidence", () => {
    const repoRoot = makeFixture((manifest) => {
      const paths = manifest.paths as Array<Record<string, unknown>>;
      const target = paths[1];
      target.falsifier = {
        observable: "equation-grounded path completeness",
        reject_rule: "missing canonical equation refs",
        uncertainty_model:
          "deterministic_threshold_contract_v1(pass_threshold=0.95,fail_threshold=0.90)",
        test_refs: ["scripts/validate-physics-root-leaf-manifest.ts"],
      };
    });

    const result = validatePhysicsRootLeafManifest({ repoRoot });
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toContain(
      "paths[1] references equation-grounded claims but does not provide residual evidence",
    );
  });

  it("fails deterministically on unknown uncertainty models", () => {
    const repoRoot = makeFixture((manifest) => {
      const paths = manifest.paths as Array<Record<string, unknown>>;
      const target = paths[0];
      target.falsifier = {
        ...(target.falsifier as Record<string, unknown>),
        uncertainty_model: "unknown_model(pass_threshold=0.95)",
      };
    });

    const result = validatePhysicsRootLeafManifest({ repoRoot });
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toContain(
      "paths[0].falsifier.uncertainty_model references undefined model: unknown_model",
    );
  });

  it("fails deterministically on unparameterized uncertainty models", () => {
    const repoRoot = makeFixture((manifest) => {
      const paths = manifest.paths as Array<Record<string, unknown>>;
      const target = paths[0];
      target.falsifier = {
        ...(target.falsifier as Record<string, unknown>),
        uncertainty_model: "deterministic_threshold_contract_v1",
      };
    });

    const result = validatePhysicsRootLeafManifest({ repoRoot });
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toContain(
      "paths[0].falsifier.uncertainty_model must be parameterized as model_id(param=value,...)",
    );
  });

  it("fails deterministically on tier over-claim patterns", () => {
    const repoRoot = makeFixture((manifest) => {
      const paths = manifest.paths as Array<Record<string, unknown>>;
      const target = paths[0];
      target.falsifier = {
        ...(target.falsifier as Record<string, unknown>),
        observable: "certified physically viable proof",
      };
    });

    const result = validatePhysicsRootLeafManifest({ repoRoot });
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toContain(
      "paths[0] contains tier over-claim language inconsistent with max_claim_tier=diagnostic",
    );
  });

  it("declares deterministic maturity propagation metadata in repo manifest", () => {
    const manifestPath = path.join(process.cwd(), "configs", "physics-root-leaf-manifest.v1.json");
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as {
      maturity_propagation_policy?: Record<string, unknown>;
    };
    const policy = manifest.maturity_propagation_policy ?? {};

    expect(policy.enabled).toBe(true);
    expect(policy.no_over_promotion).toBe(true);
    expect(policy.strict_fail_reason).toBe("FAIL_MATURITY_CEILING_VIOLATION");
    expect(policy.default_max_claim_tier).toBe("diagnostic");
    expect(policy.upstream_claim_tier_blocklist_for_certified).toEqual(["diagnostic", "reduced-order"]);
    expect(policy.upstream_provenance_blocklist_for_certified).toEqual(["proxy", "inferred"]);
  });

  it("declares the stellar radiation null-model lane in the repo manifest", () => {
    const manifestPath = path.join(process.cwd(), "configs", "physics-root-leaf-manifest.v1.json");
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as {
      roots?: Array<{ id: string; tree_lane?: string; tree_path?: string }>;
      leaves?: Array<{ id: string; prompt_family?: string }>;
      paths?: Array<{ id: string; root_id?: string; leaf_id?: string; bundle_id?: string }>;
      bridge_bundles?: Array<{ id: string; path_ids?: string[] }>;
    };

    expect(
      manifest.roots?.find((entry) => entry.id === "physics_stellar_structure_nucleosynthesis"),
    ).toEqual(
      expect.objectContaining({
        id: "physics_stellar_structure_nucleosynthesis",
        tree_lane: "physics_stellar_structure_nucleosynthesis",
        tree_path: "docs/knowledge/physics/physics-stellar-structure-nucleosynthesis-tree.json",
      }),
    );
    expect(
      manifest.leaves?.find((entry) => entry.id === "leaf_stellar_spectral_viability"),
    ).toEqual(
      expect.objectContaining({
        id: "leaf_stellar_spectral_viability",
        prompt_family: "stellar radiation null model viability",
      }),
    );
    expect(
      manifest.paths?.find((entry) => entry.id === "path_stellar_structure_to_spectral_viability"),
    ).toEqual(
      expect.objectContaining({
        root_id: "physics_stellar_structure_nucleosynthesis",
        leaf_id: "leaf_stellar_spectral_viability",
        bundle_id: "stellar.radiation.audit",
      }),
    );
    expect(
      manifest.bridge_bundles?.find((entry) => entry.id === "stellar.radiation.audit")?.path_ids,
    ).toContain("path_stellar_structure_to_spectral_viability");
  });

});

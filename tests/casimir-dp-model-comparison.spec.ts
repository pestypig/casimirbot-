import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  CASIMIR_DP_ORDINARY_BASELINE_COMPONENTS,
  runCasimirDpBlindedModelComparison,
  type CasimirDpBlindedModelComparisonInput,
  type CasimirDpStage3AlternativeModel,
} from "../shared/casimir-dp-model-comparison";
import type {
  CasimirDpManifoldKernelCandidate,
  CasimirDpManifoldKernelRegistryInput,
} from "../shared/casimir-dp-manifold-kernel-registry";

const comparisonFixturePath = path.resolve(
  process.cwd(),
  "configs/research/fixtures/casimir-dp-stage3-model-comparison.synthetic.v1.json",
);
const registryFixturePath = path.resolve(
  process.cwd(),
  "configs/research/fixtures/casimir-dp-stage3-manifold-registry.synthetic.v1.json",
);
const fixture = JSON.parse(
  readFileSync(comparisonFixturePath, "utf8"),
) as CasimirDpBlindedModelComparisonInput;
const registryFixture = JSON.parse(
  readFileSync(registryFixturePath, "utf8"),
) as CasimirDpManifoldKernelRegistryInput;

function cloneFixture(): CasimirDpBlindedModelComparisonInput {
  return structuredClone(fixture);
}

function cloneRegistry(): CasimirDpManifoldKernelRegistryInput {
  return structuredClone(registryFixture);
}

function dpModel(
  input: CasimirDpBlindedModelComparisonInput,
): CasimirDpStage3AlternativeModel {
  const model = input.alternative_models.find(
    (candidate) => candidate.model_kind === "named_dynamical_dp",
  );
  if (model == null) throw new Error("fixture requires a named DP model");
  return model;
}

function resultFor(
  input: CasimirDpBlindedModelComparisonInput,
  modelId: string,
) {
  return runCasimirDpBlindedModelComparison(input).model_results.find(
    (result) => result.model_id === modelId,
  )!;
}

function bridgeModel(args?: {
  registry?: CasimirDpManifoldKernelRegistryInput;
  invalidPredictions?: boolean;
}): CasimirDpStage3AlternativeModel {
  const registry = args?.registry ?? cloneRegistry();
  const entry = registry.entries[0];
  if (entry.entry_kind !== "candidate") {
    throw new Error("fixture requires a candidate bridge");
  }
  entry.companion_observable = {
    observable_id: "dp_heating_rate",
    prediction_contract:
      "Synthetic held-out companion vector for registry-preflight testing.",
  };
  const rows = fixture.observations.filter((row) =>
    fixture.nuisance_fit.heldout_cell_ids.includes(row.cell_id)
  );
  return {
    model_id: "M_bridge_tensor_noise_v1",
    model_kind: "registered_bridge",
    model_version: "1.0.0",
    source_refs: ["https://doi.org/10.1103/PhysRevD.60.084008"],
    equation_ids: ["synthetic-registered-bridge-joint-vector"],
    nested_baseline_id: "M0_ordinary_physics",
    parameter_manifest_sha256: "7".repeat(64),
    frozen_signature_sha256: "8".repeat(64),
    incremental_predictions: args?.invalidPredictions
      ? [
          { row_id: rows[0].row_id, value: 0.1 },
          { row_id: rows[0].row_id, value: 0.2 },
        ]
      : rows.map((row, index) => ({
          row_id: row.row_id,
          value: row.observable_id === "dp_heating_rate"
            ? 0.025 * (index % 2 === 0 ? 1 : -1)
            : 0,
        })),
    companion_observable_ids: ["dp_heating_rate"],
    proper_prior: {
      required: false,
      is_proper: false,
      receipt_sha256: null,
      sensitivity_report_sha256: null,
    },
    falsifier: {
      criterion: "maximum_weighted_residual_chi_square",
      rejection_threshold_chi_square: 20,
    },
    power: {
      minimum_power: 0.8,
      achieved_power: 0.9,
      parameter_region_ids: ["bridge-powered-region"],
      covered_parameter_region_ids: ["bridge-powered-region"],
    },
    maximum_claim:
      "specific_registered_bridge_compatibility_or_exclusion",
    bridge_registry: {
      registry,
      entry_model_id: "M_bridge_tensor_noise_v1",
    },
  };
}

describe("Casimir-DP Stage-3 blinded joint model comparison", () => {
  it("compares a named DP model only as an extension of the complete M0", () => {
    const result = runCasimirDpBlindedModelComparison(fixture);
    const baseline = result.model_results[0];
    const dp = result.model_results[1];

    expect(result.comparison_executed).toBe(true);
    expect(result.composite_baseline).toEqual({
      model_id: "M0_ordinary_physics",
      components: CASIMIR_DP_ORDINARY_BASELINE_COMPONENTS,
    });
    expect(baseline.model_kind).toBe(
      "composite_ordinary_physics_baseline",
    );
    expect(baseline.status).toBe("disfavored");
    expect(dp.nested_baseline_id).toBe("M0_ordinary_physics");
    expect(dp.status).toBe("not_disfavored_within_powered_region");
    expect(dp.maximum_claim).toBe(
      "named_dp_implementation_compatibility_or_exclusion",
    );
    expect(dp.confirmation_claim_allowed).toBe(false);
    expect(result.status_language).toBe(
      "not_disfavored_within_powered_region_is_not_confirmation",
    );
    expect(result.maximum_global_claim).toBe(
      "comparison_among_specified_models_only",
    );
    expect(result.ontology_or_proof_verdict).toBeNull();
    expect(result.measured_evidence_gate).toBe("not_ready");
    expect(result.collapse_identification).toBe("blocked");
    expect(result.manifold_dynamics).toBe("blocked");
  });

  it("fails before scoring when the composite ordinary-physics null is incomplete", () => {
    const input = cloneFixture();
    input.ordinary_baseline_components.pop();

    const result = runCasimirDpBlindedModelComparison(input);
    expect(result.comparison_executed).toBe(false);
    expect(result.first_failure_code).toBe("MC_COMPOSITE_M0_INCOMPLETE");
    for (const model of result.model_results) {
      expect(model.status).toBe("blocked");
      expect(model.heldout_log_score).toBeNull();
      expect(model.weighted_residual_chi_square).toBeNull();
      expect(model.delta_log_score_vs_M0).toBeNull();
      expect(model.bayes_factor_vs_M0).toBeNull();
      expect(model.whitened_signature_norm).toBeNull();
    }
  });

  it("keeps boundary labels sealed and nuisance training out of held-out cells", () => {
    const leaked = cloneFixture();
    leaked.design_cells[0].true_boundary_state = "open";
    leaked.freeze_receipt.model_registry_sha256 = "invalid-too";
    const leakResult = runCasimirDpBlindedModelComparison(leaked);
    expect(leakResult.first_failure_code).toBe("MC_BLIND_LABEL_LEAK");
    expect(leakResult.comparison_executed).toBe(false);

    const overlap = cloneFixture();
    overlap.nuisance_fit.training_cell_ids.push(
      overlap.nuisance_fit.heldout_cell_ids[0],
    );
    const overlapResult = runCasimirDpBlindedModelComparison(overlap);
    expect(overlapResult.first_failure_code).toBe(
      "MC_HELDOUT_NUISANCE_LEAKAGE",
    );
    expect(overlapResult.heldout_row_ids).toEqual([]);

    const sealed = cloneFixture();
    sealed.blinding.state = "sealed";
    sealed.blinding.custodian_receipt_sha256 = null;
    sealed.blinding.unblinded_at = null;
    const sealedResult = runCasimirDpBlindedModelComparison(sealed);
    expect(sealedResult.status).toBe("not_ready");
    expect(sealedResult.first_failure_code).toBe(
      "MC_CUSTODIAN_UNBLINDING_REQUIRED",
    );
  });

  it("requires model and nuisance freezes to precede explicit custodian unblinding", () => {
    const input = cloneFixture();
    input.freeze_receipt.frozen_at = input.blinding.unblinded_at!;

    const result = runCasimirDpBlindedModelComparison(input);
    expect(result.comparison_executed).toBe(false);
    expect(result.first_failure_code).toBe(
      "MC_SIGNATURES_NOT_FROZEN_BEFORE_UNBLINDING",
    );
  });

  it("blocks prior-free Bayes factors and admits them only with proper-prior receipts", () => {
    const blockedInput = cloneFixture();
    blockedInput.inference.scoring_rule = "bayes_factor_point_hypotheses";
    const blocked = runCasimirDpBlindedModelComparison(blockedInput);
    const blockedDp = blocked.model_results[1];

    expect(blocked.bayes_factor_gate).toBe("blocked");
    expect(blockedDp.status).toBe("blocked");
    expect(blockedDp.first_failure_code).toBe(
      "MC_BAYES_FACTOR_PRIOR_BLOCKED",
    );
    expect(blockedDp.bayes_factor_vs_M0).toBeNull();
    expect(blockedDp.whitened_signature_norm).toBeNull();

    const admittedInput = cloneFixture();
    admittedInput.inference.scoring_rule = "bayes_factor_point_hypotheses";
    admittedInput.inference.bayes_factor_proper_prior_receipt_sha256 =
      "9".repeat(64);
    admittedInput.inference.bayes_factor_prior_sensitivity_sha256 =
      "a".repeat(64);
    const model = dpModel(admittedInput);
    model.proper_prior = {
      required: true,
      is_proper: true,
      receipt_sha256: "b".repeat(64),
      sensitivity_report_sha256: "c".repeat(64),
    };
    const admitted = runCasimirDpBlindedModelComparison(admittedInput);
    const admittedDp = admitted.model_results[1];
    expect(admitted.bayes_factor_gate).toBe("pass");
    expect(admittedDp.status).toBe(
      "not_disfavored_within_powered_region",
    );
    expect(admittedDp.bayes_factor_vs_M0).toBeGreaterThan(1);
  });

  it("returns not_identifiable for collinear held-out signatures", () => {
    const input = cloneFixture();
    const duplicate = structuredClone(dpModel(input));
    duplicate.model_id = "M_dp_regularized_collinear_v1";
    duplicate.parameter_manifest_sha256 = "d".repeat(64);
    duplicate.frozen_signature_sha256 = "e".repeat(64);
    input.alternative_models.push(duplicate);

    const result = runCasimirDpBlindedModelComparison(input);
    const alternatives = result.model_results.slice(1);
    expect(alternatives.every(
      (model) => model.status === "not_identifiable",
    )).toBe(true);
    expect(alternatives.every(
      (model) =>
        model.first_failure_code === "MC_SIGNATURES_NOT_IDENTIFIABLE",
    )).toBe(true);
    for (const model of alternatives) {
      expect(model.maximum_abs_signature_cosine).toBeCloseTo(1, 12);
    }
  });

  it("excludes only powered parameter regions and leaves underpowered regions untouched", () => {
    const underpowered = cloneFixture();
    dpModel(underpowered).power.achieved_power = 0.5;
    const notReady = resultFor(
      underpowered,
      "M_dp_regularized_synthetic_v1",
    );
    expect(notReady.status).toBe("not_ready");
    expect(notReady.first_failure_code).toBe(
      "MC_PARAMETER_REGION_POWER_NOT_READY",
    );
    expect(notReady.excluded_parameter_region_ids).toEqual([]);

    const disfavored = cloneFixture();
    for (const row of disfavored.observations) {
      if (disfavored.nuisance_fit.heldout_cell_ids.includes(row.cell_id)) {
        row.value += 1;
      }
    }
    const excluded = resultFor(
      disfavored,
      "M_dp_regularized_synthetic_v1",
    );
    expect(excluded.status).toBe("disfavored");
    expect(excluded.powered_parameter_region_ids).toEqual([
      "regularized-dp-region-covered",
    ]);
    expect(excluded.excluded_parameter_region_ids).toEqual([
      "regularized-dp-region-covered",
    ]);
    expect(excluded.excluded_parameter_region_ids).not.toContain(
      "regularized-dp-region-uncovered",
    );
  });

  it("runs registry preflight before constructing or scoring a bridge prediction", () => {
    const registry = cloneRegistry();
    const entry = registry.entries[0] as CasimirDpManifoldKernelCandidate;
    entry.stress_energy!.source_kind = "scalar_pressure";
    const input = cloneFixture();
    input.alternative_models.push(
      bridgeModel({ registry, invalidPredictions: true }),
    );

    const bridge = resultFor(input, "M_bridge_tensor_noise_v1");
    expect(bridge.status).toBe("blocked");
    expect(bridge.first_failure_code).toBe(
      "MK_SOURCE_MUST_BE_RENORMALIZED_TENSOR",
    );
    expect(bridge.heldout_log_score).toBeNull();
    expect(bridge.weighted_residual_chi_square).toBeNull();
    expect(bridge.delta_log_score_vs_M0).toBeNull();
    expect(bridge.whitened_signature_norm).toBeNull();
    expect(bridge.bridge_registry_preflight?.numerical_bridge_output)
      .toBeNull();
  });

  it("scores only a registered bridge and keeps registration distinct from validation", () => {
    const input = cloneFixture();
    input.alternative_models.push(bridgeModel());

    const bridge = resultFor(input, "M_bridge_tensor_noise_v1");
    expect(bridge.model_kind).toBe("registered_bridge");
    expect(bridge.bridge_registry_preflight?.status).toBe("registered");
    expect(bridge.bridge_registry_preflight?.empirically_validated)
      .toBe(false);
    expect(
      bridge.bridge_registry_preflight?.registration_is_empirical_validation,
    ).toBe(false);
    expect(bridge.heldout_log_score).not.toBeNull();
    expect(bridge.maximum_claim).toBe(
      "specific_registered_bridge_compatibility_or_exclusion",
    );
    expect(bridge.confirmation_claim_allowed).toBe(false);
    expect(bridge.ontology_or_proof_verdict).toBeNull();
  });

  it("rejects generic collapse alternatives and model-kind claim elevation", () => {
    const generic = cloneFixture();
    dpModel(generic).model_id = "generic-collapse";
    const genericResult = runCasimirDpBlindedModelComparison(generic);
    expect(genericResult.first_failure_code).toBe(
      "MC_GENERIC_COLLAPSE_MODEL_FORBIDDEN",
    );

    const elevated = cloneFixture();
    dpModel(elevated).maximum_claim =
      "specific_registered_bridge_compatibility_or_exclusion";
    const model = resultFor(
      elevated,
      "M_dp_regularized_synthetic_v1",
    );
    expect(model.status).toBe("blocked");
    expect(model.first_failure_code).toBe(
      "MC_MODEL_REGISTRATION_INCOMPLETE",
    );
    expect(model.heldout_log_score).toBeNull();
  });
});

import { describe, expect, it } from "vitest";
import {
  evaluateCasimirDpApparatusIdentifiabilityStage4_2B,
  type CasimirDpApparatusIdentifiabilityStage4_2BInput,
} from "../shared/casimir-dp-apparatus-identifiability-stage4-2b";

const hadamard = [
  [1, 1, 1, 1, 1, 1, 1, 1],
  [1, -1, 1, -1, 1, -1, 1, -1],
  [1, 1, -1, -1, 1, 1, -1, -1],
  [1, -1, -1, 1, 1, -1, -1, 1],
  [1, 1, 1, 1, -1, -1, -1, -1],
  [1, -1, 1, -1, -1, 1, -1, 1],
  [1, 1, -1, -1, -1, -1, 1, 1],
];

function input(): CasimirDpApparatusIdentifiabilityStage4_2BInput {
  const lanes = [
    "intercept",
    "thermal",
    "electromagnetic",
    "vibration",
    "gas",
    "readout",
    "dp",
  ] as const;
  return {
    schema_version: "casimir_dp_apparatus_identifiability_stage4_2b/1",
    cell_ids: Array.from({ length: 8 }, (_, index) => `cell-${index}`),
    whitened_signatures_per_sqrt_window: lanes.map((lane, index) => ({
      signature_id: `signature-${lane}`,
      lane,
      values: hadamard[index].map((value) =>
        lane === "dp" ? value * 3e-8 : value
      ),
      source_ref: `synthetic://${lane}/v1`,
    })),
    forecast_covariance: {
      covariance_receipt_sha256: "a".repeat(64),
      whitening_receipt_sha256: "b".repeat(64),
      learned_from: "calibration_or_pilot",
      frozen_before_confirmatory: true,
      constructed_from_full_cross_covariance: true,
      condition_number: 5,
      maximum_condition_number: 100,
    },
    design_contract: {
      design_matrix_sha256: "c".repeat(64),
      cell_order_sha256: "d".repeat(64),
      frozen_before_confirmatory: true,
      preparation_readout_intercept_included: true,
      nuisance_columns_profiled: true,
    },
    bounded_parameter_regions: [{
      region_id: "nominal-r0",
      r0_lower_m: 1e-7,
      r0_upper_m: 1e-7,
      whitened_dp_signature_per_sqrt_window:
        hadamard[6].map((value) => value * 3e-8),
      preregistered: true,
      external_bound_status: "contextual_not_admitted",
      source_ref: "synthetic://nominal-r0/v1",
    }],
    power_coverage: {
      asymptotic_method_valid: true,
      simulation_coverage_validated: false,
      simulation_coverage_probability: 0.95,
      simulation_receipt_sha256: null,
    },
    planned_paired_windows: 1_600,
    thresholds: {
      minimum_signature_rank: 4,
      maximum_abs_whitened_cosine: 0.97,
      minimum_power: 0.8,
      maximum_false_positive_rate: 0.05,
      minimum_companion_snr: 5,
      augmented_design_condition_number_max: 100,
    },
    companion: {
      applicable: true,
      independently_powered: false,
      forecast_snr: 0.01,
    },
    ordinary_physics_forecast_complete: true,
    branch_provenance_complete: false,
    independent_replication_planned: true,
    legacy_rate_power_input: {
      schema_version: "casimir_dp_visibility_power/1",
      baseline_rate_s: 2.15,
      target_additional_rate_s: 7e-7,
      observation_time_s: 0.1,
      type_i_error: 0.05,
      target_power: 0.8,
      technical_variance_inflation: 1,
    },
  };
}

describe("Casimir-DP Stage-4.2B signature identifiability and power", () => {
  it("returns a fail-closed current-apparatus no-go without conflating it with DP exclusion", () => {
    const result =
      evaluateCasimirDpApparatusIdentifiabilityStage4_2B(input());
    expect(result.gate).toBe("pass");
    expect(result.signature_rank).toBe(7);
    expect(result.maximum_abs_whitened_cosine).toBeLessThan(1e-10);
    expect(result.feasibility_verdict).toBe("apparatus_not_powered_for_dp");
    expect(result.required_paired_windows).not.toBeNull();
    expect(result.required_paired_windows!).toBeGreaterThan(1e14);
    expect(result.power_by_parameter_region).toHaveLength(1);
    expect(result.powered_preregistered_region_ids).toEqual([]);
    expect(result.null_exclusion_region_ids_if_measured_null).toEqual([]);
    expect(result.forecast_covariance_gate).toBe("pass");
    expect(result.power_coverage_gate).toBe("pass");
    expect(result.named_dp_support_path).toBe("blocked");
    expect(result.measured_evidence).toBe("not_ready");
    expect(result.physical_viability).toBe("not_evaluated");
  });

  it("fails identifiability when two signatures are collinear", () => {
    const fixture = input();
    fixture.whitened_signatures_per_sqrt_window[5].values =
      [...fixture.whitened_signatures_per_sqrt_window[1].values];
    const result =
      evaluateCasimirDpApparatusIdentifiabilityStage4_2B(fixture);
    expect(result.gate).toBe("blocked");
    expect(result.feasibility_verdict).toBe("signature_not_identifiable");
    expect(result.blockers).toContain("signature_collinearity_above_threshold");
  });

  it("keeps a powered forecast distinct from named-DP support prerequisites", () => {
    const fixture = input();
    fixture.whitened_signatures_per_sqrt_window[6].values =
      hadamard[6].map((value) => value * 0.2);
    fixture.bounded_parameter_regions[0]
      .whitened_dp_signature_per_sqrt_window =
        hadamard[6].map((value) => value * 0.2);
    fixture.planned_paired_windows = 10_000;
    const result =
      evaluateCasimirDpApparatusIdentifiabilityStage4_2B(fixture);
    expect(result.feasibility_verdict).toBe("powered_parameter_region_available");
    expect(result.named_dp_support_path).toBe("blocked");
    expect(result.blockers).toContain("branch_provenance_incomplete");
    expect(result.blockers)
      .toContain("applicable_powered_companion_below_threshold");
    expect(result.powered_preregistered_region_ids).toEqual(["nominal-r0"]);
  });

  it("profiles the DP signature against all nuisance columns", () => {
    const fixture = input();
    fixture.whitened_signatures_per_sqrt_window[6].values =
      fixture.whitened_signatures_per_sqrt_window[1].values.map(
        (value) => value * 1e-8,
      );
    const result =
      evaluateCasimirDpApparatusIdentifiabilityStage4_2B(fixture);
    expect(result.dp_profiled_fisher_information_per_window)
      .toBeLessThan(1e-25);
    expect(result.required_windows_numerically_inaccessible).toBe(true);
    expect(result.feasibility_verdict).toBe("signature_not_identifiable");
  });

  it("requires coverage simulation when the asymptotic power model is invalid", () => {
    const fixture = input();
    fixture.power_coverage.asymptotic_method_valid = false;
    const result =
      evaluateCasimirDpApparatusIdentifiabilityStage4_2B(fixture);
    expect(result.gate).toBe("blocked");
    expect(result.power_coverage_gate).toBe("blocked");
    expect(result.blockers).toContain("power_coverage_not_validated");
  });

  it("never calls an externally disfavored region powered or null-excludable", () => {
    const fixture = input();
    fixture.whitened_signatures_per_sqrt_window[6].values =
      hadamard[6].map((value) => value * 0.2);
    fixture.bounded_parameter_regions[0]
      .whitened_dp_signature_per_sqrt_window =
        hadamard[6].map((value) => value * 0.2);
    fixture.planned_paired_windows = 10_000;
    fixture.bounded_parameter_regions[0].external_bound_status =
      "external_disfavored";
    const result =
      evaluateCasimirDpApparatusIdentifiabilityStage4_2B(fixture);
    expect(result.feasibility_verdict).toBe("apparatus_not_powered_for_dp");
    expect(result.powered_preregistered_region_ids).toEqual([]);
    expect(result.null_exclusion_region_ids_if_measured_null).toEqual([]);
  });

  it("fails dimension mismatches without emitting non-finite report values", () => {
    const fixture = input();
    fixture.whitened_signatures_per_sqrt_window[2].values.pop();
    const result =
      evaluateCasimirDpApparatusIdentifiabilityStage4_2B(fixture);
    expect(result.gate).toBe("blocked");
    expect(result.blockers).toContain("signature_cell_dimension_mismatch");
    expect(JSON.stringify(result)).not.toMatch(/NaN|Infinity/);
  });
});

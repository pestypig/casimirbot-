import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  CASIMIR_DP_STAGE3_NAMED_MANIFEST_SHA256,
  evaluateCasimirDpDpScalingForecastStage4_2B,
} from "@shared/casimir-dp-dp-scaling-forecast-stage4-2b";
import { HBAR } from "@shared/physics-const";

const HASH_A = "a".repeat(64);
const HASH_B = "b".repeat(64);
const receipt = (source = "synthetic://receipt", hash = HASH_A) => ({
  source_ref: source,
  expected_sha256: hash,
  actual_sha256: hash,
  integrity_verified: true,
});

function dpInput(
  dims: number,
  voxelSize: number,
  commonShift = 0,
  identical = false,
) {
  const mass = 1e-17;
  const left = -5e-9 + commonShift;
  const right = identical ? left : 5e-9 + commonShift;
  return {
    schema_version: "dp_collapse/1",
    ell_m: 1e-9,
    grid: {
      dims: [dims, dims, dims],
      voxel_size_m: [voxelSize, voxelSize, voxelSize],
      origin_m: [0, 0, 0],
    },
    method: {
      kernel: "plummer",
      max_voxels: 4096,
    },
    branch_a: {
      kind: "analytic",
      primitives: [{
        kind: "gaussian",
        mass_kg: mass,
        sigma_m: 1.5e-9,
        center_m: [left, 0, 0],
      }],
    },
    branch_b: {
      kind: "analytic",
      primitives: [{
        kind: "gaussian",
        mass_kg: mass,
        sigma_m: 1.5e-9,
        center_m: [right, 0, 0],
      }],
    },
  };
}

function companionFixture() {
  return JSON.parse(readFileSync(
    "configs/research/fixtures/casimir-dp-stage3-dp-companion.synthetic.v1.json",
    "utf8",
  ));
}

function baseInput() {
  const companion = companionFixture();
  return {
    schema_version: "casimir_dp_dp_scaling_forecast_stage4_2b/1",
    evidence_class: "synthetic_fixture",
    applicability_manifest: {
      model_id: "diosi_1989_gaussian_regularized_nondissipative",
      model_version: "1",
      generator: "newtonian_markovian_mass_density_dp",
      temporal_noise: "white_markovian",
      dissipation: "none",
      density_prescription: "single_effective_gaussian_particle",
      parameter_manifest_sha256:
        CASIMIR_DP_STAGE3_NAMED_MANIFEST_SHA256,
      applicability_receipt: receipt("synthetic://applicability"),
      boundary_extension: {
        kind: "unmodified_newtonian_mass_density_dp",
        boundary_variable_in_generator: false,
      },
    },
    freeze: {
      manifest_frozen_before_confirmatory: true,
      parameters_retuned_after_held_out: false,
      r0_retuned_after_held_out: false,
      amplitude_fitted_to_confirmatory: false,
      freeze_receipt: receipt("synthetic://freeze"),
    },
    branch_density_ledger: {
      cell_registry_sha256: HASH_A,
      ledger_receipt: receipt("synthetic://density-ledger"),
      cells: [
        {
          cell_id: "cell-boundary-a",
          blind_boundary_label: "boundary-A",
          boundary_equivalence_group: "fixed-branches",
          object_configuration_id: "object-1",
          mass_kg: 1e-17,
          radius_m: 5e-9,
          branch_separation_m: 1e-8,
          hold_time_s: 0.1,
          delta_rho_receipt_sha256: HASH_A,
          experimental_equivalence: {
            complete_joint_system_checked: true,
            density_trajectories_and_smearing_equivalent: true,
            branch_preparation_fidelity_class: "measured",
            sensitivity_weighted_delta_chi: 1e-5,
            standard_uncertainty_chi: 1e-5,
            systematic_allocation_chi: 1e-3,
            receipt: receipt("synthetic://equivalence-a"),
          },
        },
        {
          cell_id: "cell-boundary-b",
          blind_boundary_label: "boundary-B",
          boundary_equivalence_group: "fixed-branches",
          object_configuration_id: "object-1",
          mass_kg: 1e-17,
          radius_m: 5e-9,
          branch_separation_m: 1e-8,
          hold_time_s: 0.1,
          delta_rho_receipt_sha256: HASH_A,
          experimental_equivalence: {
            complete_joint_system_checked: true,
            density_trajectories_and_smearing_equivalent: true,
            branch_preparation_fidelity_class: "measured",
            sensitivity_weighted_delta_chi: -1e-5,
            standard_uncertainty_chi: 1e-5,
            systematic_allocation_chi: 1e-3,
            receipt: receipt("synthetic://equivalence-b"),
          },
        },
      ],
    },
    numerical_reconciliation: {
      stage2_convention: "plummer_softened_density_diagnostic",
      stage3_convention:
        "gaussian_regularized_nondissipative_named_dp",
      dp_collapse_role:
        "legacy_plummer_density_and_convergence_diagnostic_only",
      named_prediction_role:
        "stage3_gaussian_analytic_with_fourier_crosscheck",
      kernels_vote_counted_as_independent_confirmation: false,
      common_recovery_fixture_passed: true,
      source_backed_selection_reason:
        "The Stage-3 Gaussian manifest supplies the frozen named dynamics; Plummer replay is retained only as a density/convergence diagnostic.",
      reconciliation_receipt: receipt("synthetic://reconciliation"),
    },
    numerical_contract: {
      minimum_resolutions: 3,
      convergence_relative_tolerance: 0.75,
      convergence_absolute_tolerance_J: 1e-44,
      identical_branch_absolute_tolerance_J: 1e-50,
      branch_symmetry_relative_tolerance: 1e-10,
      branch_symmetry_absolute_tolerance_J: 1e-50,
      maximum_mass_relative_error: 0.75,
      maximum_boundary_shell_mass_fraction: 0.15,
      maximum_subvoxel_relative_sensitivity: 0.75,
      maximum_subvoxel_absolute_sensitivity_J: 1e-44,
      boundary_null_relative_tolerance: 1e-12,
      boundary_null_absolute_tolerance_s: 1e-30,
    },
    identity_recovery_input: dpInput(9, 3e-9, 0, true),
    numerical_cases: [{
      case_id: "plummer-density-replay",
      cell_id: "cell-boundary-a",
      resolution_runs: [
        {
          resolution_id: "coarse",
          nominal_resolution_m: 4e-9,
          input_receipt: receipt("synthetic://coarse"),
          dp_input: dpInput(7, 4e-9),
        },
        {
          resolution_id: "medium",
          nominal_resolution_m: 3e-9,
          input_receipt: receipt("synthetic://medium"),
          dp_input: dpInput(9, 3e-9),
        },
        {
          resolution_id: "fine",
          nominal_resolution_m: 2e-9,
          input_receipt: receipt("synthetic://fine"),
          dp_input: dpInput(13, 2e-9),
        },
      ],
      subvoxel_shift_probe: {
        displacement_fraction_of_finest_voxel: 0.05,
        input_receipt: receipt("synthetic://subvoxel"),
        dp_input: dpInput(13, 2e-9, 0.1e-9),
      },
    }],
    companion_input: companion,
    external_bound_ledger: [{
      bound_id: "xenonnt_2026_markovian_dp_radiation",
      source_ref: "doi:10.1103/2jm3-4976",
      confidence_level: 0.9,
      local_significance_sigma: 0.2,
      external_R0_lower_bound_m: 4.9e-10,
      parameter_map: {
        relation: "stage_r0_m=factor_times_external_R0_m",
        factor: 1,
        kernel_shape_match: true,
        width_convention_match: true,
        normalization_match: true,
        constituent_prescription_match: true,
        temporal_noise_convention_match: true,
        radiation_kernel_match: true,
        master_equation_version_match: true,
        receipt: receipt("synthetic://xenon-map"),
      },
    }],
    companion_measurement_forecast: {
      observable: "heating_W",
      one_shot_standard_uncertainty: 1e-43,
      planned_independent_samples: 100,
      applicable_to_named_model: true,
      statistically_independent_of_coherence_channel: true,
      independence_receipt: receipt("synthetic://companion-independence"),
      minimum_support_snr: 5,
    },
  };
}

describe("Casimir-DP Stage-4.2B Runtime D", () => {
  it("builds a frozen named-DP forecast while keeping Plummer diagnostics separate", () => {
    const result = evaluateCasimirDpDpScalingForecastStage4_2B(
      baseInput() as never,
    );

    expect(result.gate).toBe("pass");
    expect(result.parameter_manifest_sha256).toBe(
      CASIMIR_DP_STAGE3_NAMED_MANIFEST_SHA256,
    );
    expect(result.named_dp_prediction.gate).toBe("pass");
    expect(result.named_dp_prediction.rows.length).toBeGreaterThan(0);
    expect(result.named_dp_prediction.rows.every(
      (row) => row.Gamma_DP_s === row.E_G_J / HBAR,
    )).toBe(true);
    expect(result.numerical_density_diagnostic.gate).toBe("pass");
    expect(
      result.numerical_density_diagnostic.cases[0].numerical_role,
    ).toBe("legacy_plummer_density_and_convergence_diagnostic_only");
    expect(result.conditional_boundary_null.analytic_identity.status).toBe(
      "applies_to_registered_generator",
    );
    expect(result.conditional_boundary_null.numerical_recovery.gate).toBe(
      "pass",
    );
    expect(
      result.conditional_boundary_null.experimental_branch_equivalence.gate,
    ).toBe("pass");
    expect(
      result.conditional_boundary_null.boundary_null_claim_allowed,
    ).toBe(true);
    expect(result.companion_forecast.independently_powered).toBe(true);
    expect(result.measured_evidence).toBe("not_ready");
    expect(result.collapse_identification).toBe("blocked");
  }, 30_000);

  it("evaluates branch-ledger campaign coordinates beyond the frozen scan grid", () => {
    const input = baseInput();
    for (const cell of input.branch_density_ledger.cells) {
      cell.mass_kg = 3.8877e-18;
      cell.radius_m = 75e-9;
      cell.branch_separation_m = 2e-8;
    }

    const result = evaluateCasimirDpDpScalingForecastStage4_2B(
      input as never,
    );

    expect(result.gate).toBe("pass");
    expect(result.named_dp_prediction.rows).not.toHaveLength(0);
    expect(result.named_dp_prediction.rows.every(
      (row) =>
        row.mass_kg === 3.8877e-18 &&
        row.branch_separation_m === 2e-8 &&
        row.evaluation_scope === "registered_generator_campaign_point" &&
        row.cell_registry_sha256 === HASH_A,
    )).toBe(true);
    expect(result.named_dp_prediction.cell_registry_sha256).toBe(HASH_A);
    expect(result.parameter_manifest_sha256).toBe(
      CASIMIR_DP_STAGE3_NAMED_MANIFEST_SHA256,
    );
  }, 30_000);

  it("blocks post-hoc cutoff or amplitude retuning", () => {
    const input = baseInput();
    input.freeze.r0_retuned_after_held_out = true;
    input.freeze.amplitude_fitted_to_confirmatory = true;

    const result =
      evaluateCasimirDpDpScalingForecastStage4_2B(input as never);

    expect(result.gate).toBe("blocked");
    expect(result.failures.map((row) => row.code)).toContain(
      "post_hoc_dp_parameter_retuning",
    );
  }, 30_000);

  it("keeps experimental equivalence uncertainty separate from the analytic identity", () => {
    const input = baseInput();
    input.branch_density_ledger.cells[1].experimental_equivalence
      .sensitivity_weighted_delta_chi = 0.01;

    const result =
      evaluateCasimirDpDpScalingForecastStage4_2B(input as never);

    expect(result.gate).toBe("pass");
    expect(result.conditional_boundary_null.analytic_identity.status).toBe(
      "applies_to_registered_generator",
    );
    expect(result.conditional_boundary_null.numerical_recovery.gate).toBe(
      "pass",
    );
    expect(
      result.conditional_boundary_null.experimental_branch_equivalence.gate,
    ).toBe("not_ready");
    expect(
      result.conditional_boundary_null.boundary_null_claim_allowed,
    ).toBe(false);
  }, 30_000);

  it("does not apply the numerical boundary null when delta-rho receipts differ", () => {
    const input = baseInput();
    input.branch_density_ledger.cells[1].delta_rho_receipt_sha256 = HASH_B;
    input.companion_input.fixed_branch_boundary_cells[1]
      .delta_rho_receipt_sha256 = HASH_B;

    const result =
      evaluateCasimirDpDpScalingForecastStage4_2B(input as never);

    expect(result.conditional_boundary_null.analytic_identity.status).toBe(
      "applies_to_registered_generator",
    );
    expect(
      result.conditional_boundary_null.numerical_recovery.rows[0].gate,
    ).toBe("not_applicable");
    expect(
      result.conditional_boundary_null.boundary_null_claim_allowed,
    ).toBe(false);
  }, 30_000);

  it("does not promote assumed or simulated preparation to experimental equivalence", () => {
    const input = baseInput();
    input.branch_density_ledger.cells[1].experimental_equivalence
      .branch_preparation_fidelity_class = "assumed";

    const result =
      evaluateCasimirDpDpScalingForecastStage4_2B(input as never);

    expect(
      result.conditional_boundary_null.experimental_branch_equivalence.gate,
    ).toBe("not_ready");
    expect(
      result.conditional_boundary_null.boundary_null_claim_allowed,
    ).toBe(false);
  }, 30_000);

  it("keeps an incompletely mapped external bound contextual", () => {
    const input = baseInput();
    input.external_bound_ledger[0].parameter_map.radiation_kernel_match =
      false;

    const result =
      evaluateCasimirDpDpScalingForecastStage4_2B(input as never);

    expect(
      result.external_bound_mapping.rows[0].parameter_map_gate,
    ).toBe("contextual_only");
    expect(
      result.external_bound_mapping.rows[0]
        .mapped_stage_r0_lower_bound_m,
    ).toBeNull();
    expect(result.external_bound_mapping.parameter_region_status).toBe(
      "contextual_only",
    );
  }, 30_000);

  it("limits an unpowered companion to compatibility or exclusion", () => {
    const input = baseInput();
    input.companion_measurement_forecast.one_shot_standard_uncertainty = 1;

    const result =
      evaluateCasimirDpDpScalingForecastStage4_2B(input as never);

    expect(result.gate).toBe("pass");
    expect(result.companion_forecast.independently_powered).toBe(false);
    expect(result.companion_forecast.named_dp_support_role).toBe(
      "compatibility_or_exclusion_only",
    );
    expect(result.named_dp_support_path).toBe(
      "compatibility_or_exclusion_only",
    );
  }, 30_000);
});

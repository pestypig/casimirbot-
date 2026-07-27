import { describe, expect, it } from "vitest";
import {
  evaluateCasimirDpApparatusCoherenceResidualStage4_2B,
  type CasimirDpApparatusCoherenceResidualStage4_2BInput,
} from "../shared/casimir-dp-apparatus-coherence-residual-stage4-2b";

function input(): CasimirDpApparatusCoherenceResidualStage4_2BInput {
  const rows = [
    ["pair-a", "on", 0, 0.92, 0, 0],
    ["pair-a", "off", 0, 0.92, 0, 0],
    ["pair-b", "on", 0.05, 0.88, 0.04, 0.002],
    ["pair-b", "off", 0.05, 0.881, 0.04, 0.002],
    ["pair-c", "on", 0.1, 0.79, 0.08, 0.004],
    ["pair-c", "off", 0.1, 0.791, 0.08, 0.004],
    ["pair-d", "on", 0.2, 0.66, 0.16, 0.008],
    ["pair-d", "off", 0.2, 0.661, 0.16, 0.008],
  ] as const;
  return {
    schema_version:
      "casimir_dp_apparatus_coherence_residual_stage4_2b/1",
    evidence_class: "synthetic_fixture",
    observations: [
      ...rows.map((
      [pairId, boundary, time, visibility, ordinary, dp],
      index,
    ) => {
      const phase = 0.01 * (index + 1);
      return {
      cell_id: `cell-${index}`,
      pair_id: pairId,
      joint_state_receipt_sha256:
        `${Math.floor(index / 2) + 1}`.repeat(64),
      analysis_role: "held_out",
      boundary_state: boundary,
      hold_time_s: time,
      visibility,
      reference_visibility: 0.92,
      phase_rad: phase,
      real_coherence: visibility * Math.cos(phase),
      imaginary_coherence: visibility * Math.sin(phase),
      ordinary_chi: ordinary,
      ordinary_phase_rad: phase,
      dp_chi: dp,
      bridge_chi: null,
      complete_joint_system_equivalence: true,
    };
      }),
      {
        cell_id: "pilot-cell",
        pair_id: "pilot-pair",
        joint_state_receipt_sha256: "9".repeat(64),
        analysis_role: "pilot",
        boundary_state: "off",
        hold_time_s: 0.1,
        visibility: 0.9,
        reference_visibility: 0.92,
        phase_rad: 0,
        real_coherence: 0.9,
        imaginary_coherence: 0,
        ordinary_chi: 0.02,
        ordinary_phase_rad: 0,
        dp_chi: 0.004,
        bridge_chi: null,
        complete_joint_system_equivalence: false,
      },
    ],
    residual_covariance: [
      [0.01, 0.001, 0, 0, 0, 0, 0, 0],
      [0.001, 0.01, 0, 0, 0, 0, 0, 0],
      [0, 0, 0.01, 0.001, 0, 0, 0, 0],
      [0, 0, 0.001, 0.01, 0, 0, 0, 0],
      [0, 0, 0, 0, 0.015, 0.001, 0, 0],
      [0, 0, 0, 0, 0.001, 0.015, 0, 0],
      [0, 0, 0, 0, 0, 0, 0.02, 0.002],
      [0, 0, 0, 0, 0, 0, 0.002, 0.02],
    ],
    complex_covariance: null,
    covariance_receipt: {
      row_ids: Array.from({ length: 8 }, (_, index) => `cell-${index}`),
      complex_row_ids: null,
      row_order_sha256: "d".repeat(64),
      constructed_from_full_cross_covariance: true,
      jacobian_receipt_sha256: "e".repeat(64),
      cross_covariance_receipt_sha256: "f".repeat(64),
      condition_number_max: 100,
      shrinkage_or_jitter_frozen_from_pilot: true,
    },
    likelihood: {
      mode: "gaussian_log_visibility",
      gaussian_coverage_validated: true,
      minimum_covered_visibility: 0.5,
      coverage_probability: 0.95,
      coherence_consistency_tolerance: 1e-8,
    },
    design_grid: {
      minimum_distinct_hold_times: 4,
      minimum_positive_hold_time_span_ratio: 4,
      zero_time_intercept_required: true,
    },
    replication_partition: {
      partition_id: "confirmatory-replication",
      replication_id: "independent-replication-1",
      independently_operated: true,
      planned: true,
      measured_evidence: "not_ready",
      scored_with_primary_confirmatory: false,
      nuisance_refit_allowed: false,
      receipt_sha256: "9".repeat(64),
    },
    freeze: {
      pilot_fit_completed_at: "2026-07-01T00:00:00.000Z",
      analysis_frozen_at: "2026-07-02T00:00:00.000Z",
      confirmatory_acquired_at: "2026-07-03T00:00:00.000Z",
      nuisance_parameters_frozen: true,
      sensor_model_frozen: true,
      covariance_frozen: true,
      exclusions_frozen: true,
      predictions_frozen: true,
      cell_order_frozen: true,
      scoring_code_sha256: "a".repeat(64),
      prediction_vector_sha256: "b".repeat(64),
      automatic_unblinding_allowed: false,
      synthetic_contract_only: true,
    },
    dp_predictor: {
      manifest_sha256:
        "4868b598b05e76f43f9814858f81c27cf8d8a783d360deb56e26793aad7047c6",
      generator: "nonrelativistic_markovian_mass_density_dp",
      boundary_variable_in_unmodified_generator: false,
      fitted_amplitude_allowed: false,
      fitted_amplitude: 1,
      r0_retuned_after_freeze: false,
      branch_provenance_complete: false,
      boundary_identity_absolute_tolerance: 1e-15,
    },
    bridge: {
      role: "none",
      admitted: false,
      kernel_sha256: null,
    },
  };
}

describe("Casimir-DP Stage-4.2B complex residual comparator", () => {
  it("scores frozen ordinary and DP predictions in one full-covariance space", () => {
    const result =
      evaluateCasimirDpApparatusCoherenceResidualStage4_2B(input());
    expect(result.gate).toBe("pass");
    expect(result.covariance_gate).toBe("positive_definite");
    expect(result.pilot_partition_gate).toBe("pass");
    expect(result.model_scores.map((row) => row.model_id)).toEqual([
      "M0",
      "M0_plus_DP",
    ]);
    expect(result.model_scores.every(
      (row) => row.confirmatory_amplitude_fitted === false,
    )).toBe(true);
    expect(result.boundary_contrasts).toHaveLength(4);
    expect(result.boundary_contrasts.every(
      (row) => row.registered_dp_conditional_null_applicable,
    )).toBe(true);
    expect(result.measured_evidence).toBe("not_ready");
    expect(result.collapse_identification).toBe("blocked");
    expect(result.manifold_dynamics).toBe("blocked");
    expect(result.unblinded).toBe(false);
  });

  it("fails closed on confirmatory-data leakage", () => {
    const fixture = input();
    fixture.freeze.confirmatory_acquired_at = "2026-07-01T12:00:00.000Z";
    const result =
      evaluateCasimirDpApparatusCoherenceResidualStage4_2B(fixture);
    expect(result.gate).toBe("blocked");
    expect(result.first_failure?.code).toBe("confirmatory_data_leakage");
    expect(result.model_scores).toEqual([]);
    expect(result.strict_dp_score).toBeNull();
  });

  it("requires an explicit pilot partition before held-out scoring", () => {
    const fixture = input();
    fixture.observations = fixture.observations.filter(
      (row) => row.analysis_role !== "pilot",
    );
    const result =
      evaluateCasimirDpApparatusCoherenceResidualStage4_2B(fixture);
    expect(result.gate).toBe("blocked");
    expect(result.pilot_partition_gate).toBe("blocked");
    expect(result.first_failure?.code).toBe("pilot_partition_missing");
  });

  it("returns not_identifiable for singular covariance", () => {
    const fixture = input();
    fixture.residual_covariance = [
      [1, 1, 0, 0, 0, 0, 0, 0],
      [1, 1, 0, 0, 0, 0, 0, 0],
      [0, 0, 1, 0, 0, 0, 0, 0],
      [0, 0, 0, 1, 0, 0, 0, 0],
      [0, 0, 0, 0, 1, 0, 0, 0],
      [0, 0, 0, 0, 0, 1, 0, 0],
      [0, 0, 0, 0, 0, 0, 1, 0],
      [0, 0, 0, 0, 0, 0, 0, 1],
    ];
    const result =
      evaluateCasimirDpApparatusCoherenceResidualStage4_2B(fixture);
    expect(result.gate).toBe("blocked");
    expect(result.covariance_gate).toBe("not_identifiable");
    expect(result.first_failure?.code)
      .toBe("residual_covariance_not_positive_definite");
    expect(result.model_scores).toEqual([]);
  });

  it("blocks an uncovered low-visibility Gaussian score", () => {
    const fixture = input();
    fixture.observations[7].visibility = 0.1;
    const phase = fixture.observations[7].phase_rad;
    fixture.observations[7].real_coherence = 0.1 * Math.cos(phase);
    fixture.observations[7].imaginary_coherence = 0.1 * Math.sin(phase);
    const result =
      evaluateCasimirDpApparatusCoherenceResidualStage4_2B(fixture);
    expect(result.likelihood_gate).toBe("blocked");
    expect(result.failures.map((row) => row.code))
      .toContain("log_visibility_likelihood_coverage_failure");
  });

  it("enforces the registered conditional DP boundary identity", () => {
    const fixture = input();
    fixture.observations[1].dp_chi = 1e-4;
    const result =
      evaluateCasimirDpApparatusCoherenceResidualStage4_2B(fixture);
    expect(result.gate).toBe("blocked");
    expect(result.failures.map((row) => row.code))
      .toContain("conditional_dp_boundary_identity_failure");
  });

  it("uses an actual raw-complex likelihood when selected", () => {
    const fixture = input();
    fixture.likelihood.mode = "raw_complex";
    fixture.covariance_receipt.complex_row_ids = Array.from(
      { length: 8 },
      (_, index) => [`cell-${index}:re`, `cell-${index}:im`],
    ).flat();
    fixture.complex_covariance = Array.from({ length: 16 }, (_, row) =>
      Array.from({ length: 16 }, (_, column) => row === column ? 0.01 : 0)
    );
    const result =
      evaluateCasimirDpApparatusCoherenceResidualStage4_2B(fixture);
    expect(result.gate).toBe("pass");
    expect(result.model_scores.every(
      (row) => row.likelihood_space === "raw_complex",
    )).toBe(true);
    expect(result.whitened_residual).toHaveLength(16);
  });

  it("keeps scale-relative covariance checks valid for very small variances", () => {
    const fixture = input();
    fixture.residual_covariance = fixture.residual_covariance.map(
      (row) => row.map((value) => value * 1e-20),
    );
    const result =
      evaluateCasimirDpApparatusCoherenceResidualStage4_2B(fixture);
    expect(result.covariance_gate).toBe("positive_definite");
    expect(result.gate).toBe("pass");
  });

  it("rejects boundary rows that do not share the same frozen state receipt", () => {
    const fixture = input();
    fixture.observations[1].joint_state_receipt_sha256 = "9".repeat(64);
    const result =
      evaluateCasimirDpApparatusCoherenceResidualStage4_2B(fixture);
    expect(result.failures.map((row) => row.code))
      .toContain("boundary_pair_axis_or_receipt_mismatch");
  });
});

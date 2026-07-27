import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  CASIMIR_DP_APPARATUS_COHERENCE_RESIDUAL_STAGE4_2B_RUN_ORDER,
  CASIMIR_DP_STAGE4_2B_CELL_AXIS_ORDER,
  CASIMIR_DP_STAGE4_2B_REQUIRED_CELL_RECORD_FIELDS,
  CASIMIR_DP_STAGE4_2B_REQUIRED_FIXTURE_CASE_IDS,
  CASIMIR_DP_STAGE4_2B_REQUIRED_NUISANCE_CONTROL_AXES,
  CasimirDpApparatusCoherenceResidualStage4_2BConfig,
} from "../shared/contracts/casimir-dp-apparatus-coherence-residual-stage4-2b.v1";

function config() {
  return JSON.parse(readFileSync(
    "configs/research/casimir-dp-apparatus-coherence-residual-stage4-2b.v1.json",
    "utf8",
  ));
}

describe("Casimir-DP Stage-4.2B strict campaign contract", () => {
  it("parses the frozen config with exact order and synthetic claim ceilings", () => {
    const parsed =
      CasimirDpApparatusCoherenceResidualStage4_2BConfig.parse(config());

    expect(parsed.run_order).toEqual(
      CASIMIR_DP_APPARATUS_COHERENCE_RESIDUAL_STAGE4_2B_RUN_ORDER,
    );
    expect(parsed.runtime_fixture.required_case_ids).toEqual(
      CASIMIR_DP_STAGE4_2B_REQUIRED_FIXTURE_CASE_IDS,
    );
    expect(parsed.evidence_policy.conditional_boundary_null_scope).toBe(
      "registered_nonrelativistic_markovian_mass_density_dp_with_complete_joint_system_equivalence_only",
    );
    expect(parsed.dp_applicability_manifest).toMatchObject({
      generator: "nonrelativistic_markovian_mass_density_dp",
      density_prescription: "single_effective_gaussian_particle",
      r0_frozen_before_held_out: true,
      fitted_amplitude_allowed: false,
      boundary_variable_in_unmodified_generator: false,
      xenon_r0_parameter_map_status: "contextual_not_admitted",
      xenon_bound_used_to_truncate_parameter_space: false,
    });
    expect(parsed.final_status_policy).toMatchObject({
      measured_evidence: "not_ready",
      collapse_identification: "blocked",
      manifold_dynamics: "blocked",
      physical_viability: "not_evaluated",
    });
    expect(parsed.apparatus_density_transport).toEqual({
      transport_prescription:
        "continuum_uniform_sphere_bulk_mass_geometry_transport_only",
      transport_role:
        "apparatus_scale_and_complete_branch_density_design_input",
      dp_dynamics_implication:
        "none_stage3_single_effective_gaussian_particle_remains_named_dp_model",
      model_limitation:
        "uniform_sphere_transport_is_not_uniform_sphere_dp_dynamics",
      evidence_class: "design_assumption",
      measured_density_receipts: "not_ready",
    });
  });

  it("freezes the complete non-promotable Section-9 confirmatory design grid", () => {
    const parsed =
      CasimirDpApparatusCoherenceResidualStage4_2BConfig.parse(config());
    const grid = parsed.confirmatory_design_grid;
    const positiveHoldTimes = grid.hold_times
      .map((holdTime) => holdTime.hold_time_s)
      .filter((holdTime) => holdTime > 0);

    expect(grid).toMatchObject({
      schema_version: "casimir_dp_stage4_2b_confirmatory_design_grid/1",
      evidence_class: "design_assumption",
      forecast_evidence_class: "synthetic_fixture",
      measured_evidence: "not_ready",
      claim_ceiling: "confirmatory_design_grid_contract_only",
      promotion_allowed: false,
    });
    expect(grid.object_configurations).toHaveLength(3);
    expect(new Set(grid.object_configurations.map(
      (object) => object.independent_metrology_plan_id,
    )).size).toBe(3);
    expect(grid.object_configurations.every(
      (object) =>
        object.independent_metrology_required &&
        object.metrology_receipt_status === "not_ready",
    )).toBe(true);
    expect(grid.branch_separations.length).toBeGreaterThanOrEqual(2);
    expect(grid.hold_times).toHaveLength(4);
    expect(grid.hold_times[0]?.hold_time_s).toBe(0);
    expect(
      Math.max(...positiveHoldTimes) / Math.min(...positiveHoldTimes),
    ).toBeGreaterThanOrEqual(4);
    expect(grid.sequence_kinds).toEqual(["ramsey", "path_swap", "echo"]);
    expect(grid.boundary_pair).toMatchObject({
      paired_within_window: true,
      randomized_order: true,
      blinded_to_analysis: true,
      automatic_unblinding_allowed: false,
    });
    expect(grid.boundary_controls).toMatchObject({
      sham_switch: {
        required: true,
        switching_waveform_matched: true,
        matched_heating_required: true,
      },
      detuned_boundary: {
        required: true,
        detuned_from_casimir_sensitive_configuration: true,
      },
    });
    expect(grid.nuisance_control_axes.map((axis) => axis.axis_id)).toEqual(
      CASIMIR_DP_STAGE4_2B_REQUIRED_NUISANCE_CONTROL_AXES,
    );
    expect(grid.nuisance_control_axes.every(
      (axis) =>
        axis.minimum_levels >= 2 &&
        axis.varied_independently_of_boundary_state &&
        axis.other_nuisance_axes_held_nominal,
    )).toBe(true);
    expect(grid.partitions.map((partition) => partition.role)).toEqual([
      "pilot_training",
      "confirmatory_primary",
      "confirmatory_replication",
    ]);
    expect(grid.partitions[0]).toMatchObject({
      confirmatory_scoring_allowed: false,
      nuisance_fit_allowed: true,
    });
    expect(grid.partitions[2]).toMatchObject({
      independent_replication: true,
      shares_experimental_units_with_primary: false,
      independent_apparatus_run_and_operators_required: true,
      scored_separately: true,
    });
    expect(grid.cell_generation.axis_order).toEqual(
      CASIMIR_DP_STAGE4_2B_CELL_AXIS_ORDER,
    );
    expect(grid.cell_generation.required_cell_record_fields).toEqual(
      CASIMIR_DP_STAGE4_2B_REQUIRED_CELL_RECORD_FIELDS,
    );
    expect(grid.cell_generation).toMatchObject({
      numeric_values_resolved_from_frozen_axis_ids: true,
      duplicate_cell_ids_allowed: false,
      order: "lexicographic_declared_axis_order",
    });
  });

  it("rejects a reordered campaign even when all stage names remain present", () => {
    const candidate = config();
    [candidate.run_order[0], candidate.run_order[1]] =
      [candidate.run_order[1], candidate.run_order[0]];

    expect(() =>
      CasimirDpApparatusCoherenceResidualStage4_2BConfig.parse(candidate)
    ).toThrow("frozen 22-stage order");
  });

  it("rejects a reordered fixture matrix and a broadened boundary-null scope", () => {
    const reordered = config();
    [
      reordered.runtime_fixture.required_case_ids[0],
      reordered.runtime_fixture.required_case_ids[1],
    ] = [
      reordered.runtime_fixture.required_case_ids[1],
      reordered.runtime_fixture.required_case_ids[0],
    ];
    expect(() =>
      CasimirDpApparatusCoherenceResidualStage4_2BConfig.parse(reordered)
    ).toThrow("exactly match the 19-case matrix");

    const broadened = config();
    broadened.evidence_policy.conditional_boundary_null_scope =
      "all_objective_collapse_models";
    expect(() =>
      CasimirDpApparatusCoherenceResidualStage4_2BConfig.parse(broadened)
    ).toThrow();
  });

  it("fails closed on underspecified object, separation, or hold-time grids", () => {
    const tooFewObjects = config();
    tooFewObjects.confirmatory_design_grid.object_configurations.pop();
    expect(() =>
      CasimirDpApparatusCoherenceResidualStage4_2BConfig.parse(tooFewObjects)
    ).toThrow();

    const duplicateMetrology = config();
    duplicateMetrology.confirmatory_design_grid.object_configurations[1]
      .independent_metrology_plan_id =
        duplicateMetrology.confirmatory_design_grid.object_configurations[0]
          .independent_metrology_plan_id;
    expect(() =>
      CasimirDpApparatusCoherenceResidualStage4_2BConfig.parse(
        duplicateMetrology,
      )
    ).toThrow("unique independent metrology plans");

    const oneSeparation = config();
    oneSeparation.confirmatory_design_grid.branch_separations =
      oneSeparation.confirmatory_design_grid.branch_separations.slice(0, 1);
    expect(() =>
      CasimirDpApparatusCoherenceResidualStage4_2BConfig.parse(oneSeparation)
    ).toThrow();

    const missingZero = config();
    missingZero.confirmatory_design_grid.hold_times[0].hold_time_s = 0.01;
    expect(() =>
      CasimirDpApparatusCoherenceResidualStage4_2BConfig.parse(missingZero)
    ).toThrow("zero-time intercept");

    const insufficientSpan = config();
    insufficientSpan.confirmatory_design_grid.hold_times[1].hold_time_s = 0.04;
    expect(() =>
      CasimirDpApparatusCoherenceResidualStage4_2BConfig.parse(
        insufficientSpan,
      )
    ).toThrow("span >= 4");
  });

  it("fails closed on missing blind, control, partition, or replication safeguards", () => {
    const missingPathSwap = config();
    missingPathSwap.confirmatory_design_grid.sequence_kinds[1] = "ramsey";
    expect(() =>
      CasimirDpApparatusCoherenceResidualStage4_2BConfig.parse(missingPathSwap)
    ).toThrow();

    const unrandomized = config();
    unrandomized.confirmatory_design_grid.boundary_pair.randomized_order =
      false;
    expect(() =>
      CasimirDpApparatusCoherenceResidualStage4_2BConfig.parse(unrandomized)
    ).toThrow();

    const missingSham = config();
    missingSham.confirmatory_design_grid.boundary_controls.sham_switch.required =
      false;
    expect(() =>
      CasimirDpApparatusCoherenceResidualStage4_2BConfig.parse(missingSham)
    ).toThrow();

    const duplicateNuisance = config();
    duplicateNuisance.confirmatory_design_grid.nuisance_control_axes[1]
      .axis_id =
        duplicateNuisance.confirmatory_design_grid.nuisance_control_axes[0]
          .axis_id;
    expect(() =>
      CasimirDpApparatusCoherenceResidualStage4_2BConfig.parse(
        duplicateNuisance,
      )
    ).toThrow("frozen independent-axis order");

    const pilotLeakage = config();
    pilotLeakage.confirmatory_design_grid.partitions[0]
      .confirmatory_scoring_allowed = true;
    expect(() =>
      CasimirDpApparatusCoherenceResidualStage4_2BConfig.parse(pilotLeakage)
    ).toThrow();

    const dependentReplication = config();
    dependentReplication.confirmatory_design_grid.partitions[2]
      .shares_experimental_units_with_primary = true;
    expect(() =>
      CasimirDpApparatusCoherenceResidualStage4_2BConfig.parse(
        dependentReplication,
      )
    ).toThrow();
  });

  it("rejects DP-model drift while preserving a separate apparatus-density transport", () => {
    const modelDrift = config();
    modelDrift.dp_applicability_manifest.density_prescription =
      "continuum_uniform_sphere_design_class_with_gaussian_smearing";
    expect(() =>
      CasimirDpApparatusCoherenceResidualStage4_2BConfig.parse(modelDrift)
    ).toThrow();

    const dynamicsConflation = config();
    dynamicsConflation.apparatus_density_transport.dp_dynamics_implication =
      "uniform_sphere_dp_dynamics";
    expect(() =>
      CasimirDpApparatusCoherenceResidualStage4_2BConfig.parse(
        dynamicsConflation,
      )
    ).toThrow();
  });
});

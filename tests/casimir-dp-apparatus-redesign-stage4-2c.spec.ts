import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  CasimirDpIdentifiabilityRedesignStage4_2CConfig,
} from "../shared/contracts/casimir-dp-identifiability-redesign-stage4-2c.v1";
import {
  compileCasimirDpControlResponseStage4_2C,
} from "../shared/casimir-dp-control-response-stage4-2c";
import {
  evaluateCasimirDpApparatusRedesignStage4_2C,
  selectCasimirDpApparatusRedesignStage4_2C,
} from "../shared/casimir-dp-apparatus-redesign-stage4-2c";

const stage4_2BReportPath =
  "artifacts/research/casimir-dp-apparatus-coherence-residual-stage4-2b/casimir-dp-apparatus-coherence-residual-stage4-2b-v1-20260726T123523358Z/apparatus-coherence-residual-stage4-2b-report.json";

function campaignInputs(leakage = 0) {
  const config =
    CasimirDpIdentifiabilityRedesignStage4_2CConfig.parse(
      JSON.parse(
        readFileSync(
          "configs/research/casimir-dp-identifiability-redesign-stage4-2c.v1.json",
          "utf8",
        ),
      ),
    );
  const stage4_2B = JSON.parse(
    readFileSync(stage4_2BReportPath, "utf8"),
  );
  const results = config.apparatus_search.candidates.map((candidate) => {
    const control = compileCasimirDpControlResponseStage4_2C({
      schema_version:
        "casimir_dp_control_response_stage4_2c/1",
      evidence_class: "synthetic_fixture",
      control_cells:
        stage4_2B.coupling_adapters.design_registry.control_cells,
      control_axes:
        config.control_response_authority.control_axes,
      sham_switch:
        config.control_response_authority.sham_switch,
      detuned_boundary:
        config.control_response_authority.detuned_boundary,
      sensor_self_noise:
        config.control_response_authority.sensor_self_noise,
      response_gain: candidate.control_response_gain,
      cross_axis_leakage_fraction: leakage,
      covariance_jitter: 1e-24,
    });
    return evaluateCasimirDpApparatusRedesignStage4_2C({
      schema_version:
        "casimir_dp_apparatus_redesign_stage4_2c/1",
      evidence_class: "synthetic_fixture",
      candidate,
      search_bounds: {
        maximum_mass_scale:
          config.apparatus_search.maximum_mass_scale,
        maximum_branch_separation_scale:
          config.apparatus_search.maximum_branch_separation_scale,
        maximum_hold_time_scale:
          config.apparatus_search.maximum_hold_time_scale,
      },
      thresholds: config.thresholds,
      baseline_identifiability_input:
        stage4_2B.runtime_inputs.FInput,
      baseline_dp_rows:
        stage4_2B.runtime_outputs.D.named_dp_prediction.rows,
      parameter_manifest:
        stage4_2B.runtime_inputs.DInput.companion_input
          .parameter_manifest,
      parameter_manifest_sha256:
        stage4_2B.runtime_inputs.DInput.companion_input
          .parameter_manifest_sha256,
      control_component_ids: control.component_ids,
      whitened_control_signatures:
        control.whitened_signatures,
      control_covariance_receipt: control.covariance_receipt,
      control_response_receipt: control.response_receipt,
      stage4_2b_report_sha256:
        config.immutable_stage4_2b.campaign_report_sha256,
    });
  });
  return { config, stage4_2B, results };
}

describe("Casimir-DP Stage-4.2C bounded apparatus redesign", () => {
  it("selects the sole bounded powered synthetic region", () => {
    const { results } = campaignInputs();
    const selection =
      selectCasimirDpApparatusRedesignStage4_2C(results);
    expect(selection.verdict).toBe(
      "bounded_powered_region_available",
    );
    expect(selection.selected_candidate_id).toBe(
      "silica_high_mass_identifiable",
    );
    expect(selection.required_paired_windows).toBe(542);
    expect(selection.eligible_candidate_ids).toEqual([
      "silica_high_mass_identifiable",
    ]);
  });

  it("passes every preregistered numerical gate for the selected region", () => {
    const { config, results } = campaignInputs();
    const result = results.find(
      (row) =>
        row.candidate_id === "silica_high_mass_identifiable",
    )!;
    expect(result.gate).toBe("pass");
    expect(result.identifiability.maximum_abs_whitened_cosine)
      .toBeLessThan(
        config.thresholds
          .maximum_abs_whitened_signature_cosine,
      );
    expect(result.identifiability.normalized_gram_condition_number!)
      .toBeLessThanOrEqual(
        config.thresholds
          .augmented_design_condition_number_max,
      );
    expect(result.identifiability.achieved_dp_power).toBeGreaterThanOrEqual(
      config.thresholds.minimum_power,
    );
    expect(result.hard_gates.companion).toBe("pass");
    expect(result.dp_transport.fitted_amplitude_used).toBe(false);
    expect(result.dp_transport.confirmatory_data_used).toBe(false);
  });

  it("does not confuse identifiability with DP power", () => {
    const { results } = campaignInputs();
    const result = results.find(
      (row) => row.candidate_id === "silica_control_only",
    )!;
    expect(
      result.identifiability.maximum_abs_whitened_cosine,
    ).toBeLessThan(0.97);
    expect(result.candidate_status).toBe(
      "apparatus_not_powered_for_dp",
    );
    expect(result.hard_gates.power).toBe("blocked");
    expect(result.selection_eligible).toBe(false);
  });

  it("rejects a more powerful candidate outside the frozen bounds", () => {
    const { results } = campaignInputs();
    const result = results.find(
      (row) =>
        row.candidate_id ===
          "silica_very_high_mass_out_of_bounds",
    )!;
    expect(result.identifiability.achieved_dp_power).toBe(1);
    expect(result.candidate_status).toBe(
      "candidate_outside_registered_bounds",
    );
    expect(result.selection_eligible).toBe(false);
  });

  it("rejects missing material-response authority", () => {
    const { results } = campaignInputs();
    const result = results.find(
      (row) => row.candidate_id === "diamond_contextual_only",
    )!;
    expect(result.candidate_status).toBe(
      "material_response_authority_not_admitted",
    );
    expect(result.selection_eligible).toBe(false);
  });

  it("fails closed under severe cross-axis leakage", () => {
    const { results } = campaignInputs(0.99);
    const result = results.find(
      (row) =>
        row.candidate_id === "silica_high_mass_identifiable",
    )!;
    expect(result.gate).toBe("blocked");
    expect(result.candidate_status).toBe(
      "signature_not_identifiable",
    );
  });

  it("never promotes synthetic preparation or physical viability", () => {
    const { results } = campaignInputs();
    const result = results.find(
      (row) =>
        row.candidate_id === "silica_high_mass_identifiable",
    )!;
    expect(result.state_preparation.evidence_class).toBe(
      "design_assumption",
    );
    expect(result.state_preparation.authentic_receipt_available).toBe(
      false,
    );
    expect(result.physical_pilot_readiness).toBe("not_ready");
    expect(result.measured_evidence).toBe("not_ready");
    expect(result.collapse_identification).toBe("blocked");
    expect(result.manifold_dynamics).toBe("blocked");
    expect(result.physical_viability).toBe("not_evaluated");
  });
});

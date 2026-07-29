import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  CasimirDpIdentifiabilityRedesignStage4_2CConfig,
} from "../shared/contracts/casimir-dp-identifiability-redesign-stage4-2c.v1";
import {
  compileCasimirDpControlResponseStage4_2C,
} from "../shared/casimir-dp-control-response-stage4-2c";

const stage4_2BReportPath =
  "artifacts/research/casimir-dp-apparatus-coherence-residual-stage4-2b/casimir-dp-apparatus-coherence-residual-stage4-2b-v1-20260726T123523358Z/apparatus-coherence-residual-stage4-2b-report.json";

function inputs(responseGain = 3, crossAxisLeakageFraction = 0) {
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
  return {
    schema_version:
      "casimir_dp_control_response_stage4_2c/1" as const,
    evidence_class: "synthetic_fixture" as const,
    control_cells:
      stage4_2B.coupling_adapters.design_registry.control_cells,
    control_axes:
      config.control_response_authority.control_axes,
    sham_switch: config.control_response_authority.sham_switch,
    detuned_boundary:
      config.control_response_authority.detuned_boundary,
    sensor_self_noise:
      config.control_response_authority.sensor_self_noise,
    response_gain: responseGain,
    cross_axis_leakage_fraction: crossAxisLeakageFraction,
    covariance_jitter: 1e-24,
  };
}

describe("Casimir-DP Stage-4.2C control response compiler", () => {
  it("constructs and reversibly whitens all 30 complex controls", () => {
    const result = compileCasimirDpControlResponseStage4_2C(inputs());
    expect(result.gate).toBe("pass");
    expect(result.component_ids).toHaveLength(60);
    expect(result.raw_signatures).toHaveLength(7);
    expect(result.whitened_signatures).toHaveLength(7);
    expect(
      result.response_receipt.maximum_round_trip_error,
    ).toBeLessThanOrEqual(1e-12);
    expect(
      result.covariance_receipt.covariance_positive_definite,
    ).toBe(true);
  });

  it("represents shared calibration covariance off diagonal", () => {
    const result = compileCasimirDpControlResponseStage4_2C(inputs());
    expect(
      result.covariance_receipt
        .shared_calibration_covariance_present,
    ).toBe(true);
    expect(
      result.covariance_receipt.covariance_condition_upper_bound,
    ).toBeLessThan(100);
  });

  it("keeps sensor self-noise out of the physical signature lanes", () => {
    const result = compileCasimirDpControlResponseStage4_2C(inputs());
    expect(
      result.covariance_receipt.sensor_self_noise_in_covariance,
    ).toBe(true);
    expect(
      result.covariance_receipt
        .sensor_self_noise_in_physical_signature,
    ).toBe(false);
    expect(
      result.sensor_self_noise_ledger
        .admitted_as_physical_decoherence_lane,
    ).toBe(false);
  });

  it("records severe cross-axis response leakage without hiding it", () => {
    const result = compileCasimirDpControlResponseStage4_2C(
      inputs(3, 0.99),
    );
    expect(result.gate).toBe("pass");
    expect(
      result.response_receipt.cross_axis_leakage_fraction,
    ).toBe(0.99);
    expect(result.response_receipt.response_authority).toBe(
      "design_assumption_not_measured",
    );
  });
});

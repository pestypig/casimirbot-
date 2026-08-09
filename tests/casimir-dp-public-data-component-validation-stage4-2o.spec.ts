import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { evaluateCasimirDpPublicDataComponentValidationStage4_2O } from "../shared/casimir-dp-public-data-component-validation-stage4-2o";
import {
  CasimirDpPublicDataComponentFixtureStage4_2O,
  CasimirDpPublicDataComponentValidationStage4_2OConfig,
} from "../shared/contracts/casimir-dp-public-data-component-validation-stage4-2o.v1";

const config = CasimirDpPublicDataComponentValidationStage4_2OConfig.parse(JSON.parse(
  readFileSync("configs/research/casimir-dp-public-data-component-validation-stage4-2o.v1.json", "utf8"),
));
const fixture = CasimirDpPublicDataComponentFixtureStage4_2O.parse(JSON.parse(
  readFileSync(config.fixture_path, "utf8"),
));

describe("Casimir-DP Stage-4.2O public-data component validation", () => {
  it("recovers all four independent public-data capabilities", () => {
    const result = evaluateCasimirDpPublicDataComponentValidationStage4_2O(config, fixture);
    expect(result.readiness.component_replay).toBe("pass");
    expect(result.provenance.gate).toBe("pass");
    expect(result.component_replays.sodium_complex_fringe.gate).toBe("pass");
    expect(result.component_replays.measured_boundary_response.gate).toBe("pass");
    expect(result.component_replays.multichannel_covariance.gate).toBe("pass");
    expect(result.component_replays.external_dp_bound.gate).toBe("pass");
  });

  it("reconstructs a measured complex fringe coefficient without renaming it as sphere coherence", () => {
    const result = evaluateCasimirDpPublicDataComponentValidationStage4_2O(config, fixture);
    expect(result.component_replays.sodium_complex_fringe.scan_count).toBe(95);
    expect(result.component_replays.sodium_complex_fringe.split_mean_mahalanobis2).toBeLessThan(0.02);
    expect(result.component_replays.sodium_complex_fringe.claim_boundary).toContain("not the density-matrix element");
  });

  it("keeps the measured boundary replay and classical covariance replay in their own apparatus lanes", () => {
    const result = evaluateCasimirDpPublicDataComponentValidationStage4_2O(config, fixture);
    expect(result.component_replays.measured_boundary_response.trace_count).toBe(108);
    expect(result.component_replays.measured_boundary_response.rms_up_down_centroid_shift_Hz).toBeGreaterThan(7_000);
    expect(result.component_replays.multichannel_covariance.channel_count).toBe(16);
    expect(result.component_replays.multichannel_covariance.holdout_to_train_rmse_ratio).toBeLessThan(1.1);
    expect(result.isolation.cross_apparatus_covariance_fusion).toBe(false);
    expect(result.isolation.shared_likelihood_constructed).toBe(false);
  });

  it("authenticates the external bound but does not silently transfer it to R0=100 nm", () => {
    const result = evaluateCasimirDpPublicDataComponentValidationStage4_2O(config, fixture);
    expect(result.component_replays.external_dp_bound.fig3_bin_count).toBe(4_000);
    expect(result.component_replays.external_dp_bound.fig4_bin_count).toBe(140);
    expect(result.component_replays.external_dp_bound.registered_model_adjudication).toBe("not_adjudicated");
  });

  it("preserves the leading design and fail-closed scientific standing", () => {
    const result = evaluateCasimirDpPublicDataComponentValidationStage4_2O(config, fixture);
    expect(result.upstream_binding.leading_design_unchanged).toBe(true);
    expect(result.upstream_binding.leading_design.material_id).toBe("diamond");
    expect(result.readiness.measured_evidence).toBe("not_ready");
    expect(result.readiness.joint_protocol_validation).toBe("not_ready");
    expect(result.readiness.collapse_identification).toBe("blocked");
    expect(result.readiness.manifold_dynamics).toBe("blocked");
    expect(result.graph_policy.observable_bridge_edges_added).toBe(0);
    expect(result.graph_policy.theory_badge_promotable).toBe(false);
  });

  it("rejects any attempt to enable cross-apparatus covariance fusion", () => {
    const unsafe = structuredClone(config) as unknown as Record<string, unknown>;
    unsafe.cross_apparatus_covariance_fusion_allowed = true;
    expect(() => CasimirDpPublicDataComponentValidationStage4_2OConfig.parse(unsafe)).toThrow();
  });

  it("fails the component replay without promoting any scientific standing when a gate is tightened", () => {
    const tightened = structuredClone(config);
    tightened.gates.maximum_lisa_relative_covariance_drift = 0.01;
    const result = evaluateCasimirDpPublicDataComponentValidationStage4_2O(tightened, fixture);
    expect(result.component_replays.multichannel_covariance.gate).toBe("not_ready");
    expect(result.readiness.component_replay).toBe("not_ready");
    expect(result.readiness.measured_evidence).toBe("not_ready");
    expect(result.readiness.collapse_identification).toBe("blocked");
  });
});

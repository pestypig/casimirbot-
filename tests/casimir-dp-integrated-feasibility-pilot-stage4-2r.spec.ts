import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { evaluateCasimirDpIntegratedFeasibilityPilotStage4_2R } from "../shared/casimir-dp-integrated-feasibility-pilot-stage4-2r";
import { CasimirDpIntegratedFeasibilityPilotStage4_2RConfig } from "../shared/contracts/casimir-dp-integrated-feasibility-pilot-stage4-2r.v1";

const config = CasimirDpIntegratedFeasibilityPilotStage4_2RConfig.parse(JSON.parse(
  readFileSync("configs/research/casimir-dp-integrated-feasibility-pilot-stage4-2r.v1.json", "utf8"),
));

describe("Casimir-DP Stage-4.2R integrated feasibility-pilot readiness", () => {
  it("freezes a quantitative primary-Diosi precision target", () => {
    const result = evaluateCasimirDpIntegratedFeasibilityPilotStage4_2R(config);
    expect(result.primary_diosi_estimand.predicted_visibility).toBeCloseTo(
      Math.exp(-config.frozen_diosi.gaussian_exponent_at_hold), 14,
    );
    expect(result.primary_diosi_estimand.maximum_one_sigma_magnitude_uncertainty).toBeCloseTo(
      result.primary_diosi_estimand.predicted_visibility_loss / 5, 14,
    );
    expect(result.graph_policy.frozen_diosi_law_modified).toBe(false);
  });

  it("keeps the four-cell boundary interaction separate from the primary collapse estimator", () => {
    const result = evaluateCasimirDpIntegratedFeasibilityPilotStage4_2R(config);
    expect(result.boundary_interaction_estimand.standard_diosi_ratio_factor).toBe(1);
    expect(result.boundary_interaction_estimand.standard_diosi_cancellation_error).toBe(0);
    expect(result.graph_policy.casimir_to_collapse_kernel_registered).toBe(false);
    expect(result.graph_policy.collapse_bridge_edges_added).toBe(0);
  });

  it("returns an explicit no-go while same-apparatus authority packets are absent", () => {
    const result = evaluateCasimirDpIntegratedFeasibilityPilotStage4_2R(config);
    expect(result.decision.packet_contract).toBe("pass");
    expect(result.authority_audit.ready_count).toBe(0);
    expect(result.authority_audit.missing_count).toBe(8);
    expect(result.authority_audit.empirical_input_readiness).toBe("no_go");
    expect(result.decision.empirical_feasibility_pilot).toBe("not_authorized");
    expect(result.standing.measured_evidence).toBe("not_ready");
    expect(result.standing.collapse_identification).toBe("blocked");
  });

  it("does not accept a nominally measured packet without custody and content addressing", () => {
    const altered = structuredClone(config);
    altered.authority_packets[0].status = "measured";
    altered.authority_packets[0].measured_on_leading_apparatus = true;
    const result = evaluateCasimirDpIntegratedFeasibilityPilotStage4_2R(altered);
    expect(result.authority_audit.rows[0].ready).toBe(false);
    expect(result.authority_audit.missing_authorities).toContain("state_preparation_recombination");
  });

  it("fails the packet contract if cross-apparatus covariance fusion is enabled", () => {
    const altered = structuredClone(config) as unknown as Record<string, any>;
    altered.pilot_design.require_zero_cross_apparatus_covariance_fusion = false;
    expect(() => CasimirDpIntegratedFeasibilityPilotStage4_2RConfig.parse(altered)).toThrow();
  });
});


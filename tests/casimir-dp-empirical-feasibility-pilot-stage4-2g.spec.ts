import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  CasimirDpEmpiricalFeasibilityPilotStage4_2GConfig,
  CasimirDpEmpiricalPilotPacketStage4_2G,
} from "../shared/contracts/casimir-dp-empirical-feasibility-pilot-stage4-2g.v1";
import {
  evaluateCasimirDpEmpiricalFeasibilityPilotStage4_2G,
} from "../shared/casimir-dp-empirical-feasibility-pilot-stage4-2g";

function readJson(relativePath: string) {
  return JSON.parse(
    readFileSync(path.resolve(process.cwd(), relativePath), "utf8"),
  );
}

const config =
  CasimirDpEmpiricalFeasibilityPilotStage4_2GConfig.parse(
    readJson(
      "configs/research/casimir-dp-empirical-feasibility-pilot-stage4-2g.v1.json",
    ),
  );
const unacquired = CasimirDpEmpiricalPilotPacketStage4_2G.parse(
  readJson(config.packets.unacquired_template_path),
);
const synthetic = CasimirDpEmpiricalPilotPacketStage4_2G.parse(
  readJson(config.packets.synthetic_validation_path),
);

describe("Casimir-DP Stage-4.2G empirical-feasibility pilot", () => {
  it("freezes one internally consistent apparatus identity", () => {
    const result =
      evaluateCasimirDpEmpiricalFeasibilityPilotStage4_2G({
        config,
        packet: unacquired,
        artifactIntegrityPass: false,
      });
    expect(result.apparatus_design_identity.gate).toBe("pass");
    expect(result.apparatus_design_identity.identity).toMatchObject({
      material_id: "silica",
      radius_m: 2.76302362398029e-7,
      mass_kg: 1.94385e-16,
      branch_separation_m: 1.6e-7,
      hold_time_s: 0.25,
    });
  });

  it("regenerates coherence and heating from that same identity", () => {
    const result =
      evaluateCasimirDpEmpiricalFeasibilityPilotStage4_2G({
        config,
        packet: unacquired,
        artifactIntegrityPass: false,
      });
    expect(result.named_dp_prediction.gate).toBe("pass");
    expect(result.named_dp_prediction.Gamma_DP_s).toBeCloseTo(
      0.02400420398374263,
      14,
    );
    expect(result.named_dp_prediction.visibility_ratio).toBeCloseTo(
      Math.exp(-0.02400420398374263 * 0.25),
      14,
    );
    expect(result.named_dp_prediction.heating_W).toBeCloseTo(
      1.9297884642410306e-40,
      14,
    );
    expect(
      result.companion_detection_requirement
        .maximum_one_shot_standard_uncertainty_for_target_snr_W,
    ).toBeCloseTo(3.859576928482061e-40, 14);
    expect(
      result.named_dp_prediction.cavity_or_maxwell_variable_enters_generator,
    ).toBe(false);
  });

  it("recomputes the synthetic whitened-space gates without promoting evidence", () => {
    const result =
      evaluateCasimirDpEmpiricalFeasibilityPilotStage4_2G({
        config,
        packet: synthetic,
        artifactIntegrityPass: false,
      });
    expect(result.packet_audit.identifiability_gate).toBe("pass");
    expect(
      result.packet_audit.identifiability?.maximum_abs_whitened_cosine,
    ).toBeLessThan(0.97);
    expect(
      result.packet_audit.identifiability
        ?.normalized_gram_condition_number,
    ).toBeLessThanOrEqual(100);
    expect(result.packet_audit.identifiability?.achieved_dp_power)
      .toBeGreaterThanOrEqual(0.8);
    expect(result.readiness.empirical_pilot_readiness).toBe("not_ready");
    expect(result.bounded_status.measured_evidence).toBe("not_ready");
    expect(result.bounded_status.collapse_identification).toBe("blocked");
  });

  it("keeps the unacquired template fail closed", () => {
    const result =
      evaluateCasimirDpEmpiricalFeasibilityPilotStage4_2G({
        config,
        packet: unacquired,
        artifactIntegrityPass: false,
      });
    expect(result.packet_audit.identifiability_gate).toBe("not_evaluated");
    expect(result.packet_audit.measured_product_ids).toEqual([]);
    expect(result.readiness).toMatchObject({
      physical_apparatus_identity: "not_ready",
      finite_geometry_maxwell_and_material: "not_ready",
      state_preparation: "not_ready",
      branch_hold_metrology: "not_ready",
      quasistatic_modulation: "not_ready",
      measured_background_covariance: "not_ready",
      companion_detector: "not_ready",
      empirical_pilot_readiness: "not_ready",
      complete_apparatus_stress_energy: "not_ready",
    });
  });

  it("rejects a measured label on synthetic artifact references", () => {
    const invalid = structuredClone(synthetic);
    invalid.evidence_class = "measured_empirical_packet";
    invalid.products[0].authority_class = "measured_empirical";
    expect(
      CasimirDpEmpiricalPilotPacketStage4_2G.safeParse(invalid).success,
    ).toBe(false);
  });

  it("keeps the manifold gate separate from the narrower core pilot", () => {
    const result =
      evaluateCasimirDpEmpiricalFeasibilityPilotStage4_2G({
        config,
        packet: unacquired,
        artifactIntegrityPass: false,
      });
    expect(
      result.hypothesis_separation
        .complete_stress_energy_required_for_manifold_claim,
    ).toBe(true);
    expect(
      result.hypothesis_separation
        .complete_stress_energy_required_for_core_pilot,
    ).toBe(false);
    expect(result.hypothesis_separation.observable_bridge_edges_added).toBe(0);
  });
});

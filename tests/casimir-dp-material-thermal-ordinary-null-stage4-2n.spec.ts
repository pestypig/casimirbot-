import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { evaluateCasimirDpMaterialThermalOrdinaryNullStage4_2N } from "../shared/casimir-dp-material-thermal-ordinary-null-stage4-2n";
import {
  CasimirDpMaterialThermalOrdinaryNullFixtureStage4_2N,
  CasimirDpMaterialThermalOrdinaryNullStage4_2NConfig,
} from "../shared/contracts/casimir-dp-material-thermal-ordinary-null-stage4-2n.v1";

const config = CasimirDpMaterialThermalOrdinaryNullStage4_2NConfig.parse(JSON.parse(
  readFileSync("configs/research/casimir-dp-material-thermal-ordinary-null-stage4-2n.v1.json", "utf8"),
));
const fixture = CasimirDpMaterialThermalOrdinaryNullFixtureStage4_2N.parse(JSON.parse(
  readFileSync(config.fixture_path, "utf8"),
));

describe("Casimir-DP Stage-4.2N material/thermal ordinary-null campaign", () => {
  it("recovers the finite-geometry Green/FDT software pipeline and standard limits", () => {
    const result = evaluateCasimirDpMaterialThermalOrdinaryNullStage4_2N(config, fixture);
    expect(result.readiness.software_pipeline).toBe("pass");
    expect(result.standard_limits.zero_coupling.gate).toBe("pass");
    expect(result.standard_limits.infinite_distance.gate).toBe("pass");
    expect(result.thermal_recovery.planck_stefan_boltzmann.gate).toBe("pass");
    expect(result.calibration_recovery.gate).toBe("pass");
  });

  it("builds complex coherence while single-counting the Green/FDT thermal channel", () => {
    const result = evaluateCasimirDpMaterialThermalOrdinaryNullStage4_2N(config, fixture);
    expect(result.ordinary_qed.mean_interaction.phase_rad).toBeCloseTo(0.02, 10);
    expect(result.ordinary_qed.decoherence.echo_chi).toBeGreaterThan(0);
    expect(result.ordinary_complex_coherence_null.cross_ratio[0]).toBeLessThan(1);
    expect(result.thermal_recovery.added_to_qed_chi).toBe(false);
    expect(result.frozen_dp_comparator.combined_with_ordinary_null).toBe(false);
  });

  it("preserves the zero-bridge and fail-closed empirical standing", () => {
    const result = evaluateCasimirDpMaterialThermalOrdinaryNullStage4_2N(config, fixture);
    expect(result.graph_policy.observable_bridge_edges_added).toBe(0);
    expect(result.graph_policy.theory_badge_promotable).toBe(false);
    expect(result.readiness.measured_evidence).toBe("not_ready");
    expect(result.readiness.ordinary_null_authority).toBe("not_ready");
    expect(result.readiness.residual_attribution).toBe("blocked");
    expect(result.readiness.collapse_identification).toBe("blocked");
    expect(result.readiness.manifold_dynamics).toBe("blocked");
    expect(result.readiness.physical_pilot_authorized).toBe(false);
  });

  it("fails closed when the synthetic phase uncertainty exceeds its registered gate", () => {
    const tightened = structuredClone(config);
    tightened.gates.maximum_phase_sigma_rad = 1e-9;
    const result = evaluateCasimirDpMaterialThermalOrdinaryNullStage4_2N(tightened, fixture);
    expect(result.readiness.software_pipeline).toBe("not_ready");
    expect(result.readiness.measured_evidence).toBe("not_ready");
  });
});

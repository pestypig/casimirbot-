import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { evaluateCasimirDpMicroscopicEmClosureStage4_2K } from "../shared/casimir-dp-microscopic-em-closure-stage4-2k";
import { CasimirDpMicroscopicEmClosureFixtureStage4_2K, CasimirDpMicroscopicEmClosureStage4_2KConfig } from "../shared/contracts/casimir-dp-microscopic-em-closure-stage4-2k.v1";

const config = CasimirDpMicroscopicEmClosureStage4_2KConfig.parse(JSON.parse(readFileSync("configs/research/casimir-dp-microscopic-em-closure-stage4-2k.v1.json", "utf8")));
const fixture = CasimirDpMicroscopicEmClosureFixtureStage4_2K.parse(JSON.parse(readFileSync(config.fixture.path, "utf8")));
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

describe("Casimir-DP Stage-4.2K microscopic electromagnetic closure", () => {
  it("recovers the analytic imaginary-axis response and ground-state chain", () => {
    const result = evaluateCasimirDpMicroscopicEmClosureStage4_2K({ config, fixture });
    expect(result.material_ground_state_chain.analytic_recovery_gate).toBe("pass");
    expect(result.material_ground_state_chain.epsilon_static).toBeCloseTo(3.8, 12);
    expect(result.material_ground_state_chain.sphere_polarizability_static_SI).toBeGreaterThan(0);
    expect(result.material_ground_state_chain.atomic_ground_state_polarizability_static_SI).toBeGreaterThan(0);
  });

  it("makes branch orientation an explicit order-of-magnitude gate", () => {
    const result = evaluateCasimirDpMicroscopicEmClosureStage4_2K({ config, fixture });
    expect(Math.abs(result.ideal_planar_orientation_screen.normal.phase_rad)).toBeGreaterThan(1e9);
    expect(result.ideal_planar_orientation_screen.tangential.phase_rad).toBe(0);
    expect(result.ideal_planar_orientation_screen.orientation_authority).toBe("not_ready");
    expect(result.outcome.finite_geometry_em_closure).toBe("blocked");
  });

  it("turns phase jitter into an explicit coherence-loss tolerance", () => {
    const result = evaluateCasimirDpMicroscopicEmClosureStage4_2K({ config, fixture });
    expect(result.phase_to_coherence_budget.maximum_phase_jitter_rad_for_registered_fraction_of_dp_loss).toBeCloseTo(Math.sqrt(0.0012002101991871317), 12);
    expect(result.phase_to_coherence_budget.required_normal_fractional_stability).toBeLessThan(1e-11);
  });

  it("recovers zero corrected four-cell interaction without adding a bridge", () => {
    const result = evaluateCasimirDpMicroscopicEmClosureStage4_2K({ config, fixture });
    expect(result.four_cell_residual_attribution.synthetic_recovery_gate).toBe("pass");
    expect(result.four_cell_residual_attribution.corrected_interaction.log_amplitude).toBe(0);
    expect(result.four_cell_residual_attribution.corrected_interaction.phase_rad).toBe(0);
    expect(result.hypothesis_separation.observable_bridge_edges_added).toBe(0);
  });

  it("recovers an injected interaction only after ordinary subtraction", () => {
    const changed = clone(fixture);
    changed.interaction_fixture.injected_bridge_log_amplitude = 0.003;
    changed.interaction_fixture.injected_bridge_phase_rad = 0.25;
    const result = evaluateCasimirDpMicroscopicEmClosureStage4_2K({ config, fixture: changed });
    expect(result.four_cell_residual_attribution.corrected_interaction.log_amplitude).toBeCloseTo(0.003, 12);
    expect(result.four_cell_residual_attribution.corrected_interaction.phase_rad).toBeCloseTo(0.25, 8);
  });

  it("fails closed on missing QLBE and empirical covariance inputs", () => {
    const result = evaluateCasimirDpMicroscopicEmClosureStage4_2K({ config, fixture });
    expect(result.qlbe_readiness.gate).toBe("blocked");
    expect(result.outcome.residual_attribution).toBe("blocked");
    expect(result.outcome.confirmatory_campaign_authorized).toBe(false);
  });
});

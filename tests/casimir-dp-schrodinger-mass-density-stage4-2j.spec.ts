import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  evaluateCasimirDpSchrodingerMassDensityStage4_2J,
} from "../shared/casimir-dp-schrodinger-mass-density-stage4-2j";
import {
  CasimirDpSchrodingerMassDensityFixtureStage4_2J,
  CasimirDpSchrodingerMassDensityStage4_2JConfig,
} from "../shared/contracts/casimir-dp-schrodinger-mass-density-stage4-2j.v1";

const config = CasimirDpSchrodingerMassDensityStage4_2JConfig.parse(
  JSON.parse(
    readFileSync(
      "configs/research/casimir-dp-schrodinger-mass-density-stage4-2j.v1.json",
      "utf8",
    ),
  ),
);
const fixture = CasimirDpSchrodingerMassDensityFixtureStage4_2J.parse(
  JSON.parse(readFileSync(config.fixture.path, "utf8")),
);

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

describe("Casimir-DP Stage-4.2J Schrödinger and mass-density robustness", () => {
  it("recovers the registered Gaussian point and separates phase from loss", () => {
    const result = evaluateCasimirDpSchrodingerMassDensityStage4_2J({
      config,
      fixture,
    });
    expect(result.registered_gaussian_recovery.gate).toBe("pass");
    expect(result.schrodinger_open_system_separation.gate).toBe("pass");
    expect(result.residual_inverse_mapping.gate).toBe("pass");
    expect(result.registered_gaussian_recovery.Gamma_DP_s).toBeCloseTo(
      0.02400420398374263,
      12,
    );
    expect(result.registered_gaussian_recovery.loss_fraction).toBeCloseTo(
      0.005983080654355932,
      12,
    );
    expect(result.schrodinger_open_system_separation.dp_phase_change_rad).toBe(0);
  });

  it("computes a converged homogeneous sphere with the same Gaussian regulator", () => {
    const result = evaluateCasimirDpSchrodingerMassDensityStage4_2J({
      config,
      fixture,
    });
    expect(
      result.mass_density_robustness.homogeneous_convergence_gate,
    ).toBe("pass");
    const homogeneous = result.mass_density_robustness.representations.find(
      (row) =>
        row.representation_id ===
          "homogeneous_sphere_gaussian_convolved",
    );
    expect(homogeneous?.E_G_J).toBeCloseTo(6.3258955283132e-37, 12);
    expect(homogeneous?.loss_fraction).toBeCloseTo(
      0.0014985121274317,
      12,
    );
    expect(
      result.mass_density_robustness.envelope
        .homogeneous_to_effective_gaussian_ratio,
    ).toBeGreaterThan(0.24);
    expect(
      result.mass_density_robustness.envelope
        .homogeneous_to_effective_gaussian_ratio,
    ).toBeLessThan(0.26);
    expect(result.outcome.complete_representation_robustness).toBe("blocked");
  });

  it("keeps hydrogen dimensional calibration outside the collapse mechanism", () => {
    const result = evaluateCasimirDpSchrodingerMassDensityStage4_2J({
      config,
      fixture,
    });
    expect(result.hydrogen_qed_nonbridge.transfer_kernel_registered).toBe(false);
    expect(result.hydrogen_qed_nonbridge.dp_to_rydberg_energy_ratio).toBeCloseTo(
      1.161267855e-18,
      9,
    );
    expect(result.hypothesis_separation.observable_bridge_edges_added).toBe(0);
  });

  it("returns a no-go for the declared equilibrium residual-gas screen", () => {
    const result = evaluateCasimirDpSchrodingerMassDensityStage4_2J({
      config,
      fixture,
    });
    expect(result.residual_gas_screen.candidate_gate).toBe("no_go");
    expect(
      result.residual_gas_screen.rows.every(
        (row) => row.gas_to_dp_rate_ratio > 100,
      ),
    ).toBe(true);
    expect(result.bounded_status.physical_viability).toBe("not_evaluated");
  });

  it("allows ordinary branch energy to rotate phase without changing the DP contraction", () => {
    const shifted = clone(fixture);
    shifted.schrodinger_baseline.branch_energy_difference_J = 1e-34;
    const result = evaluateCasimirDpSchrodingerMassDensityStage4_2J({
      config,
      fixture: shifted,
    });
    expect(result.schrodinger_open_system_separation.hamiltonian_phase_rad).not.toBe(0);
    expect(result.schrodinger_open_system_separation.dp_phase_change_rad).toBeCloseTo(0, 12);
    expect(result.registered_gaussian_recovery.loss_fraction).toBeCloseTo(
      0.005983080654355932,
      12,
    );
  });

  it("blocks registered-point recovery when the frozen reference is altered", () => {
    const changed = clone(fixture);
    changed.registered_dp_reference.E_G_J *= 2;
    const result = evaluateCasimirDpSchrodingerMassDensityStage4_2J({
      config,
      fixture: changed,
    });
    expect(result.registered_gaussian_recovery.gate).toBe("blocked");
    expect(result.outcome.diagnostic_gate).toBe("blocked");
  });

  it("rejects reordered representation contracts", () => {
    const reordered = clone(fixture);
    [reordered.mass_representations[0], reordered.mass_representations[1]] = [
      reordered.mass_representations[1],
      reordered.mass_representations[0],
    ];
    expect(() =>
      CasimirDpSchrodingerMassDensityFixtureStage4_2J.parse(reordered)
    ).toThrow();
  });
});

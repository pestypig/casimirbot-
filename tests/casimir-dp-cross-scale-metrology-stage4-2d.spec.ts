import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  CasimirDpCrossScaleMetrologyStage4_2DConfig,
} from "../shared/contracts/casimir-dp-cross-scale-metrology-stage4-2d.v1";
import {
  evaluateCasimirDpCrossScaleMetrologyStage4_2D,
} from "../shared/casimir-dp-cross-scale-metrology-stage4-2d";

const root = process.cwd();
const config = CasimirDpCrossScaleMetrologyStage4_2DConfig.parse(
  JSON.parse(
    readFileSync(
      path.resolve(
        root,
        "configs/research/casimir-dp-cross-scale-metrology-stage4-2d.v1.json",
      ),
      "utf8",
    ),
  ),
);

describe("Casimir-DP Stage-4.2D cross-scale metrology", () => {
  it("recovers spectroscopic response and covariance without measured promotion", () => {
    const result =
      evaluateCasimirDpCrossScaleMetrologyStage4_2D(config);
    expect(result.spectroscopic_metrology.gate).toBe("pass");
    expect(result.spectroscopic_metrology.zeeman.shift_Hz).toBeGreaterThan(0);
    expect(result.spectroscopic_metrology.stark.shift_Hz).toBe(-1);
    expect(
      result.spectroscopic_metrology.response_to_complex_coherence_transfer,
    ).toBe("not_ready");
    expect(result.final_gates.spectroscopic_response_authority).toBe(
      "not_ready",
    );
  });

  it("recovers compactness, potato, and Jeans scales as noncollapse checks", () => {
    const result =
      evaluateCasimirDpCrossScaleMetrologyStage4_2D(config);
    expect(result.gravitational_recovery.gate).toBe("pass");
    expect(
      result.gravitational_recovery.potato_crossover.radius_km,
    ).toBeGreaterThan(200);
    expect(
      result.gravitational_recovery.potato_crossover.radius_km,
    ).toBeLessThan(300);
    expect(
      result.gravitational_recovery.jeans_crossover.jeans_length_pc,
    ).toBeCloseTo(0.067524, 5);
    expect(
      result.gravitational_recovery.compactness[1]?.compactness,
    ).toBeLessThan(2e-36);
  });

  it("admits only the frozen mass-density branch as a DP-rate input", () => {
    const result =
      evaluateCasimirDpCrossScaleMetrologyStage4_2D(config);
    const admitted = result.equation_congruence.matrix.filter(
      (row) => row.admitted_to_dp_rate,
    );
    expect(admitted).toHaveLength(1);
    expect(admitted[0]?.relation_id).toBe(
      "branch_density_difference_to_dp_rate",
    );
    expect(result.equation_congruence.observable_bridge_edges_added).toBe(0);
    expect(result.spinor_semantic_gate).toMatchObject({
      gate: "pass",
      mass_is_a_spinor: false,
      maxwell_spinor_is_collapse_generator: false,
      penrose_1960_quantizes_gravity: false,
    });
  });
});


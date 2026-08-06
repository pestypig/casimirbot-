import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  evaluateCasimirDpBoundaryBranchInteractionStage4_2I,
} from "../shared/casimir-dp-boundary-branch-interaction-stage4-2i";
import {
  CasimirDpBoundaryBranchFixtureStage4_2I,
  CasimirDpBoundaryBranchInteractionStage4_2IConfig,
} from "../shared/contracts/casimir-dp-boundary-branch-interaction-stage4-2i.v1";

const config = CasimirDpBoundaryBranchInteractionStage4_2IConfig.parse(
  JSON.parse(
    readFileSync(
      "configs/research/casimir-dp-boundary-branch-interaction-stage4-2i.v1.json",
      "utf8",
    ),
  ),
);
const fixture = CasimirDpBoundaryBranchFixtureStage4_2I.parse(
  JSON.parse(readFileSync(config.fixture.path, "utf8")),
);

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function factor(value: { re: number; im: number }, loss: number, phi: number) {
  const amplitude = Math.exp(-loss);
  const re = amplitude * Math.cos(phi);
  const im = amplitude * Math.sin(phi);
  return {
    re: value.re * re - value.im * im,
    im: value.re * im + value.im * re,
  };
}

describe("Casimir-DP Stage-4.2I boundary-branch interaction", () => {
  it("recovers the boundary-independent DP factorial null", () => {
    const result = evaluateCasimirDpBoundaryBranchInteractionStage4_2I({
      config,
      fixture,
    });
    expect(result.standard_dp_boundary_null.gate).toBe("pass");
    expect(result.outcome.diagnostic_gate).toBe("pass");
    expect(result.outcome.interaction_resolved_in_synthetic_case).toBe(false);
    expect(
      Math.abs(
        result.cross_ratio_interaction
          .corrected_log_visibility_interaction ?? 1,
      ),
    ).toBeLessThan(1e-12);
    expect(result.hypothesis_separation.observable_bridge_edges_added).toBe(0);
  });

  it("recovers an injected amplitude and phase interaction", () => {
    const injected = clone(fixture);
    injected.expected_case = "injected_boundary_branch_interaction";
    injected.observed_cells[3].coherence_t = factor(
      injected.observed_cells[3].coherence_t,
      0.002,
      0.004,
    );
    const result = evaluateCasimirDpBoundaryBranchInteractionStage4_2I({
      config,
      fixture: injected,
    });
    expect(
      result.cross_ratio_interaction.corrected_log_visibility_interaction,
    ).toBeCloseTo(0.002, 12);
    expect(
      result.cross_ratio_interaction.corrected_phase_interaction_rad,
    ).toBeCloseTo(0.004, 12);
    expect(result.outcome.interaction_resolved_in_synthetic_case).toBe(true);
    expect(result.outcome.collapse_attribution_allowed).toBe(false);
  });

  it("falls back to raw complex coherence outside log coverage", () => {
    const low = clone(fixture);
    low.expected_case = "coverage_failure_raw_complex_only";
    low.observed_cells[3].coherence_t = { re: 1e-4, im: 0 };
    const result = evaluateCasimirDpBoundaryBranchInteractionStage4_2I({
      config,
      fixture: low,
    });
    expect(result.cross_ratio_interaction.coverage_gate).toBe(
      "raw_complex_only",
    );
    expect(result.cross_ratio_interaction.corrected_ratio).toBeNull();
    expect(
      result.raw_complex_interaction.available_when_log_coverage_fails,
    ).toBe(true);
  });

  it("blocks a boundary-dependent wave-packet displacement", () => {
    const mismatched = clone(fixture);
    mismatched.wavepacket_states[3].center_b_m[0] += 1e-8;
    const result = evaluateCasimirDpBoundaryBranchInteractionStage4_2I({
      config,
      fixture: mismatched,
    });
    expect(result.wavepacket_custody.gate).toBe("blocked");
    expect(result.outcome.diagnostic_gate).toBe("blocked");
  });

  it("blocks non-positive joint covariance", () => {
    const invalid = clone(fixture);
    invalid.joint_observed_ordinary_covariance[0][0] = -1e-8;
    const result = evaluateCasimirDpBoundaryBranchInteractionStage4_2I({
      config,
      fixture: invalid,
    });
    expect(result.covariance_gate.gate).toBe("blocked");
    expect(result.outcome.diagnostic_gate).toBe("blocked");
  });

  it("blocks an unregistered boundary dependence inserted into standard DP", () => {
    const invalid = clone(fixture);
    invalid.dp_loss_exponent_by_boundary.active += 1e-4;
    const result = evaluateCasimirDpBoundaryBranchInteractionStage4_2I({
      config,
      fixture: invalid,
    });
    expect(result.standard_dp_boundary_null.gate).toBe("blocked");
    expect(result.outcome.diagnostic_gate).toBe("blocked");
  });

  it("keeps sphere radius, R0, and center-of-mass width semantically separate", () => {
    const result = evaluateCasimirDpBoundaryBranchInteractionStage4_2I({
      config,
      fixture,
    });
    expect(result.wavepacket_custody.semantic_scales.rule).toBe(
      "R_sphere_R0_and_sigma_cm_are_distinct_model_objects",
    );
    expect(result.wavepacket_custody.semantic_scales.sphere_radius_m).toBe(
      2.76302362398029e-7,
    );
    expect(
      result.wavepacket_custody.semantic_scales.dp_regularization_length_m,
    ).toBe(1e-7);
    expect(
      result.wavepacket_custody.semantic_scales
        .center_of_mass_packet_widths_m[0],
    ).toBe(1e-8);
  });

  it("rejects reordered factorial cells", () => {
    const reordered = clone(fixture);
    [reordered.observed_cells[0], reordered.observed_cells[1]] = [
      reordered.observed_cells[1],
      reordered.observed_cells[0],
    ];
    expect(() =>
      CasimirDpBoundaryBranchFixtureStage4_2I.parse(reordered)
    ).toThrow();
  });
});

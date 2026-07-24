import { describe, expect, it } from "vitest";
import {
  ambientGravityPhaseControl,
  coherenceRateFromVisibility,
  coherenceVisibilityFromRate,
  computeCasimirDpBoundaryPhase,
  computeCasimirDpInterference,
  staticForceProjectionPhase,
} from "../shared/casimir-dp-phase-coherence";
import { HBAR, PI } from "../shared/physics-const";

function phaseInput(args: {
  onA: number[];
  onB: number[];
  offA?: number[];
  offB?: number[];
  times?: number[];
}) {
  const times = args.times ?? [0, 0.1];
  return {
    schema_version: "casimir_dp_boundary_phase/1" as const,
    sign_convention: "phase_a_minus_b" as const,
    boundary_contrast: "on_minus_off" as const,
    uncertainty_model: "not_registered" as const,
    uncertainty_model_ref: null,
    uncertainty_artifact_sha256: null,
    on_state_id: "on",
    off_state_id: "off",
    states: [
      {
        state_id: "on",
        time_s: times,
        branch_a_energy_J: args.onA,
        branch_b_energy_J: args.onB,
        branch_a_standard_uncertainty_J: null,
        branch_b_standard_uncertainty_J: null,
        energy_model_class: "qed_casimir_polder" as const,
        evidence_class: "synthetic_validation" as const,
        source_ref: "test-fixture",
        raw_artifact_sha256: null,
      },
      {
        state_id: "off",
        time_s: times,
        branch_a_energy_J: args.offA ?? times.map(() => 0),
        branch_b_energy_J: args.offB ?? times.map(() => 0),
        branch_a_standard_uncertainty_J: null,
        branch_b_standard_uncertainty_J: null,
        energy_model_class: "qed_casimir_polder" as const,
        evidence_class: "synthetic_validation" as const,
        source_ref: "test-fixture",
        raw_artifact_sha256: null,
      },
    ],
  };
}

describe("Casimir-DP phase and coherence diagnostics", () => {
  it("integrates a constant branch-energy difference with the registered sign", () => {
    const energyDifference = 2e-32;
    const result = computeCasimirDpBoundaryPhase(
      phaseInput({
        onA: [energyDifference, energyDifference],
        onB: [0, 0],
      }),
    );
    expect(result.boundary_phase_contrast_rad).toBeCloseTo(
      -energyDifference * 0.1 / HBAR,
      10,
    );
    expect(result.measured_evidence_gate).toBe("not_ready");
    expect(result.collapse_identification).toBe("blocked");
  });

  it("cancels common-mode branch energy and exactly integrates a linear ramp", () => {
    const common = 9e-28;
    const slopeEndpoint = 4e-32;
    const commonMode = computeCasimirDpBoundaryPhase(
      phaseInput({
        onA: [common, common],
        onB: [common, common],
      }),
    );
    expect(commonMode.boundary_phase_contrast_rad).toBe(0);

    const ramp = computeCasimirDpBoundaryPhase(
      phaseInput({
        onA: [0, slopeEndpoint],
        onB: [0, 0],
      }),
    );
    expect(ramp.boundary_phase_contrast_rad).toBeCloseTo(
      -(0.5 * slopeEndpoint * 0.1) / HBAR,
      10,
    );
  });

  it("requires an uncertainty receipt before measured phase evidence can pass", () => {
    const unregistered = phaseInput({
      onA: [1e-32, 1e-32],
      onB: [0, 0],
    });
    const rawHash = "a".repeat(64);
    const uncertaintyHash = "b".repeat(64);
    const measuredWithoutUncertainty = {
      ...unregistered,
      states: unregistered.states.map((state) => ({
        ...state,
        evidence_class: "measured" as const,
        raw_artifact_sha256: rawHash,
      })),
    };
    expect(
      computeCasimirDpBoundaryPhase(measuredWithoutUncertainty)
        .measured_evidence_gate,
    ).toBe("not_ready");

    const registered = {
      ...measuredWithoutUncertainty,
      uncertainty_model: "independent_samples_and_states" as const,
      uncertainty_model_ref: "registered-covariance-sidecar",
      uncertainty_artifact_sha256: uncertaintyHash,
      states: measuredWithoutUncertainty.states.map((state) => ({
        ...state,
        branch_a_standard_uncertainty_J: [1e-34, 1e-34],
        branch_b_standard_uncertainty_J: [1e-34, 1e-34],
      })),
    };
    expect(computeCasimirDpBoundaryPhase(registered).measured_evidence_gate)
      .toBe("pass");
  });

  it("makes constructive, destructive, and zero-visibility readout operational", () => {
    const constructive = computeCasimirDpInterference({
      schema_version: "casimir_dp_interference/1",
      visibility: 1,
      phase_rad: 0,
    });
    expect(constructive.probabilities[0].p_plus).toBe(1);
    expect(constructive.reconstructed_visibility).toBeCloseTo(1, 14);
    expect(constructive.reconstructed_phase_rad).toBeCloseTo(0, 14);

    const destructive = computeCasimirDpInterference({
      schema_version: "casimir_dp_interference/1",
      visibility: 1,
      phase_rad: PI,
    });
    expect(destructive.probabilities[0].p_plus).toBeCloseTo(0, 14);

    const incoherent = computeCasimirDpInterference({
      schema_version: "casimir_dp_interference/1",
      visibility: 0,
      phase_rad: 0.73,
    });
    expect(incoherent.probabilities.every((record) =>
      Math.abs(record.p_plus - 0.5) < 1e-14
    )).toBe(true);
  });

  it("reconstructs injected phase and visibility from four quadratures", () => {
    const result = computeCasimirDpInterference({
      schema_version: "casimir_dp_interference/1",
      visibility: 0.73,
      phase_rad: 0.41,
    });
    expect(result.reconstructed_visibility).toBeCloseTo(0.73, 14);
    expect(result.reconstructed_phase_rad).toBeCloseTo(0.41, 14);
  });

  it("round-trips exponential coherence visibility and rate", () => {
    const finalVisibility = coherenceVisibilityFromRate({
      initial_visibility: 0.94,
      rate_s: 2.15,
      observation_time_s: 0.1,
    });
    expect(coherenceRateFromVisibility({
      initial_visibility: 0.94,
      final_visibility: finalVisibility,
      observation_time_s: 0.1,
    })).toBeCloseTo(2.15, 14);
  });

  it("computes projected-force and ambient-gravity phase controls without calling either collapse", () => {
    const forcePhase = staticForceProjectionPhase({
      projected_differential_force_N: HBAR * 0.1 / (2e-8 * 0.1),
      branch_separation_m: 2e-8,
      observation_time_s: 0.1,
    });
    expect(forcePhase).toBeCloseTo(0.1, 14);

    const gravity = ambientGravityPhaseControl({
      mass_kg: 3.8877e-18,
      gravitational_acceleration_m_s2: 9.80665,
      branch_separation_m: 2e-8,
      observation_time_s: 0.1,
      maximum_boundary_correlated_phase_rad: 0.1,
    });
    expect(gravity.fully_vertical_phase_rad).toBeGreaterThan(7.2e8);
    expect(gravity.fully_vertical_phase_rad).toBeLessThan(7.3e8);
    expect(gravity.maximum_boundary_correlated_vertical_projection_m).toBeGreaterThan(2.7e-18);
    expect(gravity.maximum_boundary_correlated_vertical_projection_m).toBeLessThan(2.8e-18);
    expect(gravity.interpretation).toContain("not an OR collapse rate");
  });
});

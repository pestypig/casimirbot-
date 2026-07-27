import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  CASIMIR_DP_GRAVITY_REQUIRED_COMPONENTS,
  evaluateCasimirDpGravityUpperBound,
  sha256CasimirDpGravityLedger,
  type CasimirDpGravityUpperBoundInput,
} from "../shared/casimir-dp-gravity-upper-bound";
import { C2, G, HBAR } from "../shared/physics-const";

const fixturePath = path.resolve(
  process.cwd(),
  "configs/research/fixtures/casimir-dp-stage3-gravity-upper-bound.synthetic.v1.json",
);
const fixture = JSON.parse(
  readFileSync(fixturePath, "utf8"),
) as CasimirDpGravityUpperBoundInput;

const cloneFixture = (): CasimirDpGravityUpperBoundInput =>
  JSON.parse(JSON.stringify(fixture)) as CasimirDpGravityUpperBoundInput;

function removeComponent(
  input: CasimirDpGravityUpperBoundInput,
  stateIndex: number,
  componentIndex: number,
): void {
  input.states[stateIndex].components.splice(componentIndex, 1);
  input.states[stateIndex].covariance_J2.splice(componentIndex, 1);
  for (const row of input.states[stateIndex].covariance_J2) {
    row.splice(componentIndex, 1);
  }
}

describe("Casimir-DP Stage-3 complete-apparatus gravity upper bound", () => {
  it("preserves signed energy, mass, and weight while reporting magnitudes", () => {
    const result = evaluateCasimirDpGravityUpperBound(fixture);
    const scalar = result.scalar_upper_bound;

    expect(result.status).toBe("diagnostic");
    expect(result.maximum_claim).toBe("scalar_upper_bound");
    expect(scalar.signed_Delta_E_app_J).toBeCloseTo(-8e-13, 14);
    expect(scalar.magnitude_Delta_E_app_J).toBeCloseTo(8e-13, 14);
    expect(scalar.signed_Delta_m_app_kg).toBeCloseTo(
      scalar.signed_Delta_E_app_J / C2,
      14,
    );
    expect(scalar.signed_Delta_F_weight_N).toBeCloseTo(
      fixture.local_gravitational_acceleration_m_s2 *
        scalar.signed_Delta_m_app_kg,
      14,
    );
    expect(scalar.magnitude_Delta_m_app_kg)
      .toBe(Math.abs(scalar.signed_Delta_m_app_kg));
    expect(scalar.magnitude_Delta_F_weight_N)
      .toBe(Math.abs(scalar.signed_Delta_F_weight_N));
    expect(scalar.pressure_or_plate_force_used_as_weight).toBe(false);
    expect(scalar.nhm2_amplification_used).toBe(false);
    expect(result.ledger_sha256).toBe(
      sha256CasimirDpGravityLedger(fixture),
    );
  });

  it("requires supports and boundary terms and audits closed internal transfers", () => {
    const result = evaluateCasimirDpGravityUpperBound(fixture);
    for (const state of result.signed_component_ledger.states) {
      expect(state.component_coverage.missing).toEqual([]);
      expect(state.component_coverage.present).toEqual(
        [...CASIMIR_DP_GRAVITY_REQUIRED_COMPONENTS].sort(),
      );
    }
    const on = result.signed_component_ledger.states.find(
      (state) => state.state_id === "boundary-on",
    )!;
    expect(on.internal_transfer_audit.gate).toBe("pass");
    expect(on.internal_transfer_audit.rows).toEqual([
      {
        internal_transfer_id: "closed-transfer-1",
        signed_net_J: 0,
        gate: "pass",
      },
    ]);

    const missingSupport = cloneFixture();
    const supportIndex = missingSupport.states[0].components.findIndex(
      (component) => component.category === "supports_and_stresses",
    );
    removeComponent(missingSupport, 0, supportIndex);
    const incomplete = evaluateCasimirDpGravityUpperBound(missingSupport);
    expect(incomplete.status).toBe("not_ready");
    expect(incomplete.maximum_claim).toBe("incomplete_ledger_no_upper_bound");
    expect(
      incomplete.signed_component_ledger.states[0]
        .component_coverage.missing,
    ).toContain("supports_and_stresses");
  });

  it("fails the ledger when an internal transfer does not cancel", () => {
    const unbalanced = cloneFixture();
    const actuator = unbalanced.states[0].components.find(
      (component) => component.category === "actuators_and_modulation_work",
    )!;
    actuator.signed_energy_J = -4e-13;

    const result = evaluateCasimirDpGravityUpperBound(unbalanced);
    expect(result.status).toBe("not_ready");
    expect(
      result.signed_component_ledger.states[0].internal_transfer_audit.gate,
    ).toBe("not_ready");
    expect(result.maximum_claim).toBe("incomplete_ledger_no_upper_bound");
  });

  it("rejects pressure or force substitution at the strict input boundary", () => {
    const pressureInput = {
      ...cloneFixture(),
      plate_pressure_Pa: 1e9,
    };
    expect(() => evaluateCasimirDpGravityUpperBound(pressureInput as never))
      .toThrow(/Unrecognized key/);

    const forceInput = cloneFixture() as unknown as Record<string, unknown>;
    forceInput.casimir_plate_force_N = 100;
    expect(() => evaluateCasimirDpGravityUpperBound(forceInput as never))
      .toThrow(/Unrecognized key/);
  });

  it("has an exact zero state-difference limit", () => {
    const zero = cloneFixture();
    for (const component of zero.states[0].components) {
      component.signed_energy_J = 0;
    }
    const result = evaluateCasimirDpGravityUpperBound(zero);

    expect(result.scalar_upper_bound.signed_Delta_E_app_J).toBe(0);
    expect(result.scalar_upper_bound.signed_Delta_m_app_kg).toBe(0);
    expect(result.scalar_upper_bound.signed_Delta_F_weight_N).toBe(0);
    expect(result.far_field_sensitivity_triage.signed_Delta_h00).toBe(0);
  });

  it("preserves the inverse-distance far-field sensitivity scaling", () => {
    const near = evaluateCasimirDpGravityUpperBound(fixture);
    const farInput = cloneFixture();
    farInput.far_field_detector_distance_m *= 2;
    const far = evaluateCasimirDpGravityUpperBound(farInput);

    expect(
      near.far_field_sensitivity_triage.signed_Delta_h00 /
        far.far_field_sensitivity_triage.signed_Delta_h00,
    ).toBeCloseTo(2, 14);
    expect(
      near.far_field_sensitivity_triage.signed_Delta_h00,
    ).toBeCloseTo(
      2 * G * near.scalar_upper_bound.signed_Delta_E_app_J /
        (fixture.far_field_detector_distance_m * C2 ** 2),
      14,
    );
    expect(near.far_field_sensitivity_triage.measured_curvature_result)
      .toBe(false);
  });

  it("keeps the tensor and ordinary-phase lane blocked without a conserved source", () => {
    const result = evaluateCasimirDpGravityUpperBound(fixture);
    expect(result.tensor_source_gate.status).toBe("blocked");
    expect(result.tensor_source_gate.first_failure)
      .toBe("complete_delta_T_munu");
    expect(result.tensor_source_gate.complete_conserved_tensor_admitted)
      .toBe(false);
    expect(result.ordinary_gravitational_phase.status).toBe("blocked");
    expect(result.ordinary_gravitational_phase.phase_rad).toBeNull();
    expect(result.maximum_claim).toBe("scalar_upper_bound");
  });

  it("admits only a complete conserved tensor receipt to the phase diagnostic", () => {
    const admitted = cloneFixture();
    admitted.tensor_source = {
      status: "provided",
      complete_delta_T_munu: true,
      delta_T_munu_receipt_sha256:
        "5151515151515151515151515151515151515151515151515151515151515151",
      solver_receipt_sha256:
        "5252525252525252525252525252525252525252525252525252525252525252",
      covered_component_categories: [
        ...CASIMIR_DP_GRAVITY_REQUIRED_COMPONENTS,
      ],
      basis_frame: "laboratory orthonormal weak-field frame",
      coordinate_gauge: "registered harmonic-gauge solver",
      boundary_and_surface_terms_included: true,
      conservation_residual: 1e-12,
      conservation_tolerance: 1e-10,
      weak_field_solution: {
        potential_at_probe_branch_a_m2_s2: 1e-30,
        potential_at_probe_branch_b_m2_s2: 0,
        approximation: "synthetic conserved weak-field solver fixture",
      },
    };
    const result = evaluateCasimirDpGravityUpperBound(admitted);
    const expectedPhase =
      -admitted.probe.mass_kg * 1e-30 *
      admitted.probe.coherent_hold_time_s / HBAR;

    expect(result.tensor_source_gate.status).toBe("pass");
    expect(result.maximum_claim).toBe("tensor_diagnostic");
    expect(result.ordinary_gravitational_phase.status).toBe("diagnostic");
    expect(result.ordinary_gravitational_phase.phase_rad)
      .toBeCloseTo(expectedPhase, 14);
    expect(
      result.ordinary_gravitational_phase.ambient_earth_tilt_phase_included,
    ).toBe(false);
    expect(result.ordinary_gravitational_phase.unitary_phase_not_collapse_rate)
      .toBe(true);

    admitted.tensor_source.conservation_residual = 1e-6;
    const failed = evaluateCasimirDpGravityUpperBound(admitted);
    expect(failed.tensor_source_gate.status).toBe("blocked");
    expect(failed.tensor_source_gate.missing_or_invalid_fields)
      .toContain("tensor_conservation");
    expect(failed.ordinary_gravitational_phase.phase_rad).toBeNull();
    expect(failed.maximum_claim).toBe("scalar_upper_bound");
  });

  it("reverses signed quantities under contrast reversal without changing magnitudes", () => {
    const forward = evaluateCasimirDpGravityUpperBound(fixture);
    const reverseInput = cloneFixture();
    reverseInput.contrast.state_a_id = "boundary-off";
    reverseInput.contrast.state_b_id = "boundary-on";
    const reverse = evaluateCasimirDpGravityUpperBound(reverseInput);

    expect(reverse.scalar_upper_bound.signed_Delta_E_app_J)
      .toBe(-forward.scalar_upper_bound.signed_Delta_E_app_J);
    expect(reverse.scalar_upper_bound.signed_Delta_m_app_kg)
      .toBe(-forward.scalar_upper_bound.signed_Delta_m_app_kg);
    expect(reverse.scalar_upper_bound.signed_Delta_F_weight_N)
      .toBe(-forward.scalar_upper_bound.signed_Delta_F_weight_N);
    expect(reverse.scalar_upper_bound.magnitude_Delta_E_app_J)
      .toBe(forward.scalar_upper_bound.magnitude_Delta_E_app_J);
  });

  it("never promotes the synthetic ledger to measured gravity or collapse", () => {
    const result = evaluateCasimirDpGravityUpperBound(fixture);
    expect(result.measured_gravitational_response.status).toBe("not_ready");
    expect(result.collapse_identification).toBe("blocked");
    expect(result.manifold_dynamics).toBe("blocked");
    expect(result.claim_boundaries.join(" ")).toContain(
      "No NHM2 amplification factor",
    );
  });

  it("rejects covariance defects relative to the physical covariance scale", () => {
    const asymmetric = cloneFixture();
    asymmetric.states[0].covariance_J2[0][1] = 1e-31;
    expect(() => evaluateCasimirDpGravityUpperBound(asymmetric))
      .toThrow(/must be symmetric/);

    const indefinite = cloneFixture();
    indefinite.states[0].covariance_J2[0][0] = -1e-30;
    expect(() => evaluateCasimirDpGravityUpperBound(indefinite))
      .toThrow(/positive semidefinite/);
  });

  it("rejects non-finite scalar and tensor inputs before bookkeeping", () => {
    const invalidDistance = cloneFixture();
    invalidDistance.far_field_detector_distance_m =
      Number.POSITIVE_INFINITY;
    expect(() => evaluateCasimirDpGravityUpperBound(invalidDistance))
      .toThrow(/finite/i);

    const invalidTensor = cloneFixture();
    invalidTensor.tensor_source = {
      status: "provided",
      complete_delta_T_munu: true,
      delta_T_munu_receipt_sha256:
        "5151515151515151515151515151515151515151515151515151515151515151",
      solver_receipt_sha256:
        "5252525252525252525252525252525252525252525252525252525252525252",
      covered_component_categories: [
        ...CASIMIR_DP_GRAVITY_REQUIRED_COMPONENTS,
      ],
      basis_frame: "laboratory orthonormal weak-field frame",
      coordinate_gauge: "registered harmonic-gauge solver",
      boundary_and_surface_terms_included: true,
      conservation_residual: Number.POSITIVE_INFINITY,
      conservation_tolerance: 1e-10,
      weak_field_solution: {
        potential_at_probe_branch_a_m2_s2: 0,
        potential_at_probe_branch_b_m2_s2: 0,
        approximation: "invalid non-finite conservation fixture",
      },
    };
    expect(() => evaluateCasimirDpGravityUpperBound(invalidTensor))
      .toThrow(/finite/i);
  });
});

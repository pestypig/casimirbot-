import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  CasimirDpPolarizationQedControlInput,
  evaluateCasimirDpPolarizationQedControl,
} from "../shared/casimir-dp-polarization-qed-control";

const fixturePath = path.resolve(
  process.cwd(),
  "configs/research/fixtures/casimir-dp-stage4-polarization.synthetic.v1.json",
);
const fixture = CasimirDpPolarizationQedControlInput.parse(
  JSON.parse(readFileSync(fixturePath, "utf8")),
);

type Input = typeof fixture;

function clone(): Input {
  return structuredClone(fixture);
}

function cell(input: Input, cellId: string) {
  return input.cells.find((candidate) => candidate.cell_id === cellId)!;
}

function response(input: Input, responseId: string) {
  return input.responses.find(
    (candidate) => candidate.response_id === responseId,
  )!;
}

function predicted(result: ReturnType<
  typeof evaluateCasimirDpPolarizationQedControl
>, cellId: string) {
  return result.cells.find((candidate) => candidate.cell_id === cellId)!;
}

describe("Casimir-DP Stage-4 polarization-resolved QED control", () => {
  it("fixes the circular-polarization convention and is invariant under TE/TM-circular basis changes", () => {
    const result = evaluateCasimirDpPolarizationQedControl(fixture);
    expect(result.polarization_convention.phasor_convention)
      .toBe("Re[E exp(-i omega t)]");
    expect(result.polarization_convention.rcp_definition)
      .toBe("(TE-i*TM)/sqrt(2)");
    expect(result.polarization_convention.stokes_s3_definition)
      .toBe("I_RCP-I_LCP=2*Im(C_TE,TM)");
    expect(result.polarization_convention.frame_gate).toBe("pass");
    expect(result.basis_invariance.gate).toBe("pass");
    expect(result.basis_invariance.maximum_relative_error).toBeLessThan(1e-12);
  });

  it("treats equivalent Jones, coherency, and Stokes descriptions as the same physical state", () => {
    const baseline = evaluateCasimirDpPolarizationQedControl(fixture);
    const withJones = clone();
    cell(withJones, "achiral-lcp").polarization_state = {
      kind: "jones_vector",
      basis: "circular_rcp_lcp",
      amplitudes: [
        { re: 0, im: 0 },
        { re: 1, im: 0 },
      ],
    };
    const result = evaluateCasimirDpPolarizationQedControl(withJones);
    const baselineLcp = predicted(baseline, "achiral-lcp");
    const jonesLcp = predicted(result, "achiral-lcp");
    expect(jonesLcp.input_helicity).toBeCloseTo(-1, 12);
    expect(jonesLcp.phase_rad).toBeCloseTo(baselineLcp.phase_rad, 12);
    expect(jonesLcp.ramsey_chi).toBeCloseTo(baselineLcp.ramsey_chi, 12);
    expect(result.state_physicality.gate).toBe("pass");
  });

  it("fails physicality for an over-polarized Stokes vector or a non-Hermitian coherency matrix", () => {
    const invalidStokes = clone();
    const rcp = cell(invalidStokes, "achiral-rcp");
    rcp.polarization_state = {
      kind: "stokes",
      basis: "te_tm",
      stokes: [1, 0, 0, 1.1],
    };
    const stokesResult =
      evaluateCasimirDpPolarizationQedControl(invalidStokes);
    expect(stokesResult.state_physicality.rows.find(
      (row) => row.cell_id === "achiral-rcp",
    )?.gate).toBe("not_ready");
    expect(stokesResult.readiness.measured_polarization_qed_lane)
      .toBe("not_ready");

    const nonHermitian = clone();
    const lcp = cell(nonHermitian, "achiral-lcp");
    if (lcp.polarization_state.kind !== "coherency_matrix") {
      throw new Error("fixture_state_kind_changed");
    }
    lcp.polarization_state.matrix[0][1] = { re: 0, im: 0.2 };
    const coherencyResult =
      evaluateCasimirDpPolarizationQedControl(nonHermitian);
    expect(coherencyResult.state_physicality.rows.find(
      (row) => row.cell_id === "achiral-lcp",
    )?.gate).toBe("not_ready");
  });

  it("checks reciprocal-achiral invariance and registered chiral mirror reversal", () => {
    const baseline = evaluateCasimirDpPolarizationQedControl(fixture);
    expect(baseline.response_diagnostics.gate).toBe("pass");
    expect(baseline.response_diagnostics.mirror_reversal[0].gate).toBe("pass");
    expect(baseline.response_diagnostics.rows.find(
      (row) => row.response_id === "reciprocal-achiral",
    )?.achiral_reciprocity_gate).toBe("pass");

    const brokenAchiral = clone();
    response(
      brokenAchiral,
      "reciprocal-achiral",
    ).reflection_jones[1][1].re = 0.9;
    expect(
      evaluateCasimirDpPolarizationQedControl(brokenAchiral)
        .response_diagnostics.gate,
    ).toBe("not_ready");

    const brokenMirror = clone();
    response(
      brokenMirror,
      "reciprocal-chiral-minus",
    ).reflection_jones[0][0].im *= -1;
    expect(
      evaluateCasimirDpPolarizationQedControl(brokenMirror)
        .response_diagnostics.mirror_reversal[0].gate,
    ).toBe("not_ready");
  });

  it("requires matched power, absorption, heating, force, torque magnitude, trap, and branch state", () => {
    const baseline = evaluateCasimirDpPolarizationQedControl(fixture);
    expect(baseline.matched_controls.gate).toBe("pass");
    expect(Object.values(baseline.matched_controls.rows[0].gates))
      .toEqual([
        "pass",
        "pass",
        "pass",
        "pass",
        "pass",
        "pass",
        "pass",
        "pass",
      ]);

    const mismatched = clone();
    const lcp = cell(mismatched, "chiral-plus-lcp");
    lcp.incident_power_W *= 1.2;
    lcp.controls.branch_state_sha256 = "9".repeat(64);
    const result = evaluateCasimirDpPolarizationQedControl(mismatched);
    const row = result.matched_controls.rows.find(
      (candidate) => candidate.pair_id === "chiral-plus-rcp-lcp",
    )!;
    expect(row.gates.power).toBe("not_ready");
    expect(row.gates.branch_state).toBe("not_ready");
    expect(row.gate).toBe("not_ready");
  });

  it("forms mirror-odd double contrasts for phase, chi, rate, force, and heating", () => {
    const result = evaluateCasimirDpPolarizationQedControl(fixture);
    const contrast = result.double_contrasts.rows[0];
    expect(contrast.mirror_registration_gate).toBe("pass");
    expect(contrast.phase_rad).toBeCloseTo(0.15098869140424648, 12);
    expect(contrast.ramsey_chi).toBeCloseTo(0, 15);
    expect(contrast.coherence_decay_rate_s).toBeCloseTo(0, 15);
    expect(contrast.axial_force_N).toBeCloseTo(0, 30);
    expect(contrast.heating_W).toBeCloseTo(0, 30);
    expect(result.double_contrasts.interpretation)
      .toContain("ordinary-QED controls");
  });

  it("binds every source receipt and runtime component to one model hash", () => {
    const badReceipt = clone();
    badReceipt.receipts[0].actual_sha256 = "9".repeat(64);
    expect(
      evaluateCasimirDpPolarizationQedControl(badReceipt)
        .provenance.receipt_integrity_gate,
    ).toBe("not_ready");

    const badBinding = clone();
    badBinding.cells[0].model_binding_sha256 = "a".repeat(64);
    expect(
      evaluateCasimirDpPolarizationQedControl(badBinding)
        .provenance.shared_model_binding_gate,
    ).toBe("not_ready");
  });

  it("responds to Green, polarizability, and reflection-response changes", () => {
    const baseline = evaluateCasimirDpPolarizationQedControl(fixture);
    expect(baseline.sensitivity.gate).toBe("pass");
    expect(baseline.sensitivity.rows.map((row) => row.parameter)).toEqual([
      "green_projection",
      "polarizability_projection",
      "reflection_response",
    ]);
    expect(baseline.sensitivity.rows.every(
      (row) => row.changed_observable_count > 0 && row.gate === "pass",
    )).toBe(true);

    const lowerGreen = clone();
    cell(lowerGreen, "chiral-plus-rcp").green_projection_m_inv *= 0.5;
    const greenResult = evaluateCasimirDpPolarizationQedControl(lowerGreen);
    expect(predicted(greenResult, "chiral-plus-rcp").phase_rad)
      .toBeCloseTo(
        0.5 * predicted(baseline, "chiral-plus-rcp").phase_rad,
        12,
      );

    const lowerAlpha = clone();
    cell(lowerAlpha, "chiral-plus-rcp").polarizability_projection_SI *= 0.5;
    const alphaResult = evaluateCasimirDpPolarizationQedControl(lowerAlpha);
    expect(predicted(alphaResult, "chiral-plus-rcp").ramsey_chi)
      .toBeCloseTo(
        0.25 * predicted(baseline, "chiral-plus-rcp").ramsey_chi,
        12,
      );

    const changedResponse = clone();
    response(
      changedResponse,
      "reciprocal-chiral-plus",
    ).reflection_jones[0][0].im *= 0.5;
    const responseResult =
      evaluateCasimirDpPolarizationQedControl(changedResponse);
    expect(predicted(responseResult, "chiral-plus-rcp").phase_rad)
      .not.toBeCloseTo(predicted(baseline, "chiral-plus-rcp").phase_rad, 12);
  });

  it("recovers both zero-coupling and no-boundary interaction limits", () => {
    const result = evaluateCasimirDpPolarizationQedControl(fixture);
    expect(result.limits.gate).toBe("pass");
    expect(result.limits.rows.map((row) => row.limit_kind).sort()).toEqual([
      "no_boundary",
      "zero_coupling",
    ]);
    for (const cellId of ["zero-coupling-rcp", "no-boundary-rcp"]) {
      const row = predicted(result, cellId);
      expect(row.phase_rad).toBe(0);
      expect(row.ramsey_chi).toBe(0);
      expect(row.coherence_decay_rate_s).toBe(0);
      expect(row.axial_force_N).toBe(0);
      expect(row.heating_W).toBe(0);
      expect(row.axial_torque_N_m).toBe(0);
      expect(row.trap_shift_rad_s).toBe(0);
    }
  });

  it("rejects an active reflection response outside the passive bound", () => {
    const active = clone();
    response(active, "reciprocal-achiral").reflection_jones[0][0].re = 1.2;
    response(active, "reciprocal-achiral").reflection_jones[1][1].re = 1.2;
    const result = evaluateCasimirDpPolarizationQedControl(active);
    expect(result.response_diagnostics.rows.find(
      (row) => row.response_id === "reciprocal-achiral",
    )?.passivity_gate).toBe("not_ready");
    expect(result.response_diagnostics.gate).toBe("not_ready");
  });

  it("caps its synthetic output and always blocks collapse and manifold claims", () => {
    const result = evaluateCasimirDpPolarizationQedControl(fixture);
    expect(result.readiness.evidence_class).toBe("synthetic_fixture");
    expect(result.readiness.maximum_claim)
      .toBe("synthetic_pipeline_validation");
    expect(result.readiness.measured_polarization_qed_lane).toBe("not_ready");
    expect(result.promotion_allowed).toBe(false);
    expect(result.collapse_identification).toBe("blocked");
    expect(result.manifold_dynamics).toBe("blocked");

    const mislabeledMeasured = clone();
    mislabeledMeasured.evidence_class = "measured";
    const measuredResult =
      evaluateCasimirDpPolarizationQedControl(mislabeledMeasured);
    expect(measuredResult.readiness.measured_polarization_qed_lane)
      .toBe("not_ready");
    expect(measuredResult.promotion_allowed).toBe(false);
  });
});

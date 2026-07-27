import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  CASIMIR_DP_QED_SCALE_HIERARCHY_FAILURE_ORDER,
  CasimirDpQedScaleHierarchyCalibrationInput,
  evaluateCasimirDpQedScaleHierarchyCalibration,
} from "../shared/casimir-dp-qed-scale-hierarchy-calibration";

const fixturePath = path.resolve(
  process.cwd(),
  "configs/research/fixtures/casimir-dp-qed-scale-hierarchy.codata2022.v1.json",
);
const fixture = CasimirDpQedScaleHierarchyCalibrationInput.parse(
  JSON.parse(readFileSync(fixturePath, "utf8")),
);

type Input = typeof fixture;

function clone(): Input {
  return structuredClone(fixture);
}

function asRecord(input: Input): Record<string, unknown> {
  return input as unknown as Record<string, unknown>;
}

describe("Casimir-DP QED scale-hierarchy calibration", () => {
  it("closes the source-backed Compton, atomic, and reduced-mass identities without promoting evidence", () => {
    const result =
      evaluateCasimirDpQedScaleHierarchyCalibration(fixture);
    const scales = result.electron_scales;

    expect(result.status).toBe("pass");
    expect(result.first_failure_code).toBeNull();
    expect(result.failures).toEqual([]);
    expect(result.authority.gate).toBe("pass");
    expect(result.conventions.gate).toBe("pass");
    expect(result.algebraic_closure.gate).toBe("pass");
    expect(result.hierarchy.gate).toBe("pass");
    expect(result.codata_reference_agreement.gate).toBe("pass");
    expect(result.reduced_mass.gate).toBe("pass");
    expect(
      result.codata_reference_agreement.rows.every(
        (row) =>
          row.gate === "pass" &&
          row.significance === null &&
          row.significance_status ===
            "not_computable_without_cross_covariance",
      ),
    ).toBe(true);

    expect(
      fixture.constants_set.h_J_s.value *
        scales.compton_frequency_Hz,
    ).toBeCloseTo(scales.rest_energy_J, 14);
    expect(
      result.conventions.hbar_J_s *
        scales.compton_angular_frequency_rad_s,
    ).toBeCloseTo(scales.rest_energy_J, 14);
    expect(
      scales.compton_angular_frequency_rad_s /
        scales.compton_frequency_Hz,
    ).toBeCloseTo(2 * Math.PI, 14);
    expect(
      scales.electron_compton_wavelength_m /
        scales.electron_reduced_compton_wavelength_m,
    ).toBeCloseTo(2 * Math.PI, 14);
    expect(
      scales.bohr_radius_m /
        scales.electron_reduced_compton_wavelength_m,
    ).toBeCloseTo(
      1 / fixture.constants_set.fine_structure_alpha.value,
      10,
    );
    expect(
      scales.rydberg_frequency_Hz /
        scales.compton_frequency_Hz,
    ).toBeCloseTo(
      fixture.constants_set.fine_structure_alpha.value ** 2 / 2,
      14,
    );
    expect(
      Math.abs(
        result.reduced_mass.leading_transition_frequency_Hz /
          2.4660384237e15 -
          1,
      ),
    ).toBeLessThan(1e-10);

    expect(result.evidence_class).toBe(
      "source_backed_calculation",
    );
    expect(result.promotion_allowed).toBe(false);
    expect(result.final_gates).toMatchObject({
      software_identity_calibration: "pass",
      source_authority_integrity: "pass",
      algebraic_identity_closure: "pass",
      codata_tabulation_consistency: "pass",
      covariance_semantics: "pass",
      leading_reduced_mass_closure: "pass",
      measured_evidence: "not_ready",
      apparatus_material_response: "not_ready",
      precision_spectroscopy: "not_ready",
      independent_empirical_validation: "not_evaluated",
      polarization_or_helicity_model: "not_evaluated",
      casimir_to_atomic_transfer: "blocked",
      atomic_to_dp_transfer: "blocked",
      compton_to_collapse_clock: "blocked",
      collapse_identification: "blocked",
      manifold_dynamics: "blocked",
      physical_viability: "not_evaluated",
      publication_claim:
        "diagnostic_constants_calibration_only",
    });
  });

  it("keeps alpha namespaced and preserves the Stage-4 frequency non-bridge", () => {
    const result =
      evaluateCasimirDpQedScaleHierarchyCalibration(fixture);

    expect(result.symbol_registry).toMatchObject({
      fine_structure_constant: "alpha_fs",
      electric_polarizability_tensor: "alpha_pol_ij",
      statistical_significance: "alpha_stat",
      branch_amplitudes: ["c_A", "c_B"],
      bare_alpha_allowed: false,
      gate: "pass",
    });
    expect(result.semantic_non_bridge).toEqual({
      relationship:
        "algebraic_identity_within_explicit_coulomb_dirac_qed_scale_family",
      modifies_stage4_frequency_non_bridge: false,
      sourced_casimir_dp_transfer_kernel_present: false,
      stage4_frequency_status: "same_dimension_not_connected",
      maximum_claim: "same_identity_family_not_collapse_bridge",
    });
  });

  it("rejects ambiguous symbols and every excluded physics-domain input", () => {
    for (const key of [
      "alpha",
      "lambda_C",
      "polarization",
      "helicity",
      "cavity",
      "casimir",
      "dp",
      "collapse",
      "manifold",
      "resonance",
      "transfer_kernel",
    ]) {
      const candidate = clone();
      asRecord(candidate)[key] = 1;
      expect(
        CasimirDpQedScaleHierarchyCalibrationInput.safeParse(
          candidate,
        ).success,
        key,
      ).toBe(false);
    }

    const bareAlpha = clone();
    (
      bareAlpha.symbol_registry as unknown as Record<string, unknown>
    ).bare_alpha_allowed = true;
    expect(() =>
      CasimirDpQedScaleHierarchyCalibrationInput.parse(bareAlpha)
    ).toThrow();
  });

  it("distinguishes cyclic/angular frequency and ordinary/reduced wavelength conventions", () => {
    const baseline =
      evaluateCasimirDpQedScaleHierarchyCalibration(fixture);
    expect(
      baseline.electron_scales.compton_angular_frequency_rad_s,
    ).not.toBe(
      baseline.electron_scales.compton_frequency_Hz,
    );
    expect(
      baseline.electron_scales.electron_compton_wavelength_m,
    ).not.toBe(
      baseline.electron_scales
        .electron_reduced_compton_wavelength_m,
    );

    const swappedConvention = clone();
    (
      swappedConvention.conventions as unknown as Record<
        string,
        unknown
      >
    ).cyclic_compton_frequency =
      "omega_C=m_e*c^2/hbar=2*pi*nu_C";
    expect(() =>
      CasimirDpQedScaleHierarchyCalibrationInput.parse(
        swappedConvention,
      )
    ).toThrow();

    const swappedReferences = clone();
    const ordinary =
      swappedReferences.constants_set.references
        .electron_compton_wavelength_m;
    swappedReferences.constants_set.references
      .electron_compton_wavelength_m =
        swappedReferences.constants_set.references
          .electron_reduced_compton_wavelength_m;
    swappedReferences.constants_set.references
      .electron_reduced_compton_wavelength_m = ordinary;
    const result =
      evaluateCasimirDpQedScaleHierarchyCalibration(
        swappedReferences,
      );
    expect(result.algebraic_closure.gate).toBe("pass");
    expect(result.codata_reference_agreement.gate).toBe("blocked");
    expect(result.first_failure_code).toBe(
      "QSH_CODATA_REFERENCE_OUTSIDE_ENVELOPE",
    );
  });

  it("allows internal algebra to follow a perturbed alpha_fs but blocks the unsourced CODATA substitution", () => {
    const candidate = clone();
    const alpha = candidate.constants_set.fine_structure_alpha;
    alpha.value *= 1.01;
    alpha.literal_text = alpha.value.toString();
    alpha.relative_uncertainty =
      alpha.standard_uncertainty / alpha.value;

    const result =
      evaluateCasimirDpQedScaleHierarchyCalibration(candidate);
    expect(result.algebraic_closure.gate).toBe("pass");
    expect(result.hierarchy.gate).toBe("pass");
    expect(result.codata_reference_agreement.gate).toBe("blocked");
    expect(result.status).toBe("blocked");
    expect(result.first_failure_code).toBe(
      "QSH_CODATA_REFERENCE_OUTSIDE_ENVELOPE",
    );
  });

  it("fails malformed uncertainty metadata and supplied covariance deterministically", () => {
    const uncertaintyMismatch = clone();
    uncertaintyMismatch.constants_set.fine_structure_alpha
      .relative_uncertainty *= 2;
    const uncertaintyResult =
      evaluateCasimirDpQedScaleHierarchyCalibration(
        uncertaintyMismatch,
      );
    expect(uncertaintyResult.first_failure_code).toBe(
      "QSH_UNCERTAINTY_METADATA_INVALID",
    );
    expect(uncertaintyResult.final_gates.software_identity_calibration)
      .toBe("blocked");

    const asymmetric = clone();
    asymmetric.uncertainty_model = {
      status: "supplied",
      quantity_order: [
        "fine_structure_alpha",
        "electron_rest_mass_kg",
        "nucleus_to_electron_mass_ratio",
      ],
      relative_covariance: [
        [1e-20, 1e-12, 0],
        [0, 1e-20, 0],
        [0, 0, 1e-20],
      ],
      derived_reference_cross_covariance: "not_supplied",
      significance_policy:
        "not_computable_without_cross_covariance",
      fallback_uncertainty_policy:
        "conservative_l1_relative_uncertainty_bound",
    };
    const asymmetricResult =
      evaluateCasimirDpQedScaleHierarchyCalibration(asymmetric);
    expect(asymmetricResult.uncertainty).toMatchObject({
      base_relative_covariance_status: "supplied",
      covariance_symmetric: false,
      covariance_positive_semidefinite: false,
      covariance_gate: "blocked",
      reference_significance:
        "not_computable_without_cross_covariance",
    });
    expect(asymmetricResult.first_failure_code).toBe(
      "QSH_UNCERTAINTY_COVARIANCE_INVALID",
    );

    const nonPsd = clone();
    nonPsd.uncertainty_model = {
      ...asymmetric.uncertainty_model,
      relative_covariance: [
        [-1e-20, 0, 0],
        [0, 1e-20, 0],
        [0, 0, 1e-20],
      ],
    };
    const nonPsdResult =
      evaluateCasimirDpQedScaleHierarchyCalibration(nonPsd);
    expect(nonPsdResult.uncertainty.covariance_symmetric).toBe(
      true,
    );
    expect(
      nonPsdResult.uncertainty.covariance_positive_semidefinite,
    ).toBe(false);
    expect(nonPsdResult.first_failure_code).toBe(
      "QSH_UNCERTAINTY_COVARIANCE_INVALID",
    );
  });

  it("accepts a declared diagonal covariance and propagates p-transpose-C-p", () => {
    const candidate = clone();
    const alphaRelative =
      candidate.constants_set.fine_structure_alpha
        .standard_uncertainty /
      candidate.constants_set.fine_structure_alpha.value;
    const massRelative =
      candidate.constants_set.electron_rest_mass_kg
        .standard_uncertainty /
      candidate.constants_set.electron_rest_mass_kg.value;
    const ratioRelative =
      candidate.reduced_mass_case.ratio_standard_uncertainty /
      candidate.reduced_mass_case.nucleus_to_electron_mass_ratio;
    candidate.uncertainty_model = {
      status: "supplied",
      quantity_order: [
        "fine_structure_alpha",
        "electron_rest_mass_kg",
        "nucleus_to_electron_mass_ratio",
      ],
      relative_covariance: [
        [alphaRelative ** 2, 0, 0],
        [0, massRelative ** 2, 0],
        [0, 0, ratioRelative ** 2],
      ],
      derived_reference_cross_covariance: "not_supplied",
      significance_policy:
        "not_computable_without_cross_covariance",
      fallback_uncertainty_policy:
        "conservative_l1_relative_uncertainty_bound",
    };

    const result =
      evaluateCasimirDpQedScaleHierarchyCalibration(candidate);
    expect(result.status).toBe("pass");
    expect(result.uncertainty).toMatchObject({
      base_relative_covariance_status: "supplied",
      covariance_symmetric: true,
      covariance_diagonal_matches_declared_uncertainties: true,
      covariance_correlations_within_bounds: true,
      covariance_positive_semidefinite: true,
      covariance_gate: "pass",
    });
    const rydberg = result.codata_reference_agreement.rows.find(
      (row) => row.quantity_id === "rydberg_constant_m_inv",
    )!;
    const expectedRelative = Math.sqrt(
      4 * alphaRelative ** 2 + massRelative ** 2,
    );
    expect(rydberg.uncertainty_propagation_method).toBe(
      "supplied_relative_covariance",
    );
    expect(
      Math.abs(
        rydberg.computed_relative_standard_uncertainty /
          expectedRelative -
          1,
      ),
    ).toBeLessThan(1e-14);
  });

  it("rejects the wrong nuclear-mass semantics and precision promotion at schema admission", () => {
    const wrongMassSemantics = clone();
    (
      wrongMassSemantics.reduced_mass_case as unknown as Record<
        string,
        unknown
      >
    ).mass_semantics = "neutral_atom_over_electron";
    expect(() =>
      CasimirDpQedScaleHierarchyCalibrationInput.parse(
        wrongMassSemantics,
      )
    ).toThrow();

    const precisionOverclaim = clone();
    (
      precisionOverclaim.precision_scope as unknown as Record<
        string,
        unknown
      >
    ).precision_spectroscopy_claimed = true;
    expect(() =>
      CasimirDpQedScaleHierarchyCalibrationInput.parse(
        precisionOverclaim,
      )
    ).toThrow();

    const measuredRelabel = clone();
    asRecord(measuredRelabel).evidence_class = "measured";
    expect(() =>
      CasimirDpQedScaleHierarchyCalibrationInput.parse(
        measuredRelabel,
      )
    ).toThrow();
  });

  it("reports multiple failures in the frozen deterministic order", () => {
    const candidate = clone();
    candidate.authority_receipt.integrity_verified = false;
    candidate.authority_receipt.actual_sha256 = "f".repeat(64);
    candidate.constants_set.h_J_s.value *= 1.01;
    candidate.constants_set.h_J_s.literal_text =
      candidate.constants_set.h_J_s.value.toString();
    candidate.constants_set.fine_structure_alpha
      .relative_uncertainty *= 2;

    const result =
      evaluateCasimirDpQedScaleHierarchyCalibration(candidate);
    expect(result.first_failure_code).toBe(
      "QSH_SOURCE_INTEGRITY_FAILED",
    );
    expect(result.failures.map((failure) => failure.code).slice(0, 3))
      .toEqual([
        "QSH_SOURCE_INTEGRITY_FAILED",
        "QSH_SI_EXACT_CONSTANT_MISMATCH",
        "QSH_UNCERTAINTY_METADATA_INVALID",
      ]);
    const frozenOrder = new Map(
      CASIMIR_DP_QED_SCALE_HIERARCHY_FAILURE_ORDER.map(
        (code, index) => [code, index],
      ),
    );
    const observedOrder = result.failures.map(
      (failure) => frozenOrder.get(failure.code)!,
    );
    expect(observedOrder).toEqual(
      [...observedOrder].sort((left, right) => left - right),
    );
  });
});

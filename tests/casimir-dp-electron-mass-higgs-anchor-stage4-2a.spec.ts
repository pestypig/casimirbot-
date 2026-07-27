import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  CASIMIR_DP_ELECTRON_MASS_HIGGS_ANCHOR_STAGE4_2A_FAILURE_ORDER,
  CASIMIR_DP_ELECTRON_MASS_HIGGS_ANCHOR_STAGE4_2A_INPUT_VERSION,
  CASIMIR_DP_ELECTRON_MASS_HIGGS_ANCHOR_STAGE4_2A_RESULT_VERSION,
  CasimirDpElectronMassHiggsAnchorStage4_2AInput,
  evaluateCasimirDpElectronMassHiggsAnchorStage4_2A,
} from "../shared/casimir-dp-electron-mass-higgs-anchor-stage4-2a";

const fixturePath = path.resolve(
  process.cwd(),
  "configs/research/fixtures/casimir-dp-electron-mass-higgs-anchor.source-backed.v1.json",
);

async function loadRawFixture(): Promise<Record<string, unknown>> {
  return JSON.parse(
    await readFile(fixturePath, "utf8"),
  ) as Record<string, unknown>;
}

function relativeDifference(left: number, right: number): number {
  if (left === right) return 0;
  return Math.abs(left - right) /
    Math.max(Math.abs(left), Math.abs(right), Number.MIN_VALUE);
}

describe("Casimir-DP electron-mass/Higgs anchor Stage-4.2A", () => {
  it("replays the corrected Penning result with its explicit observational equation", async () => {
    const input = CasimirDpElectronMassHiggsAnchorStage4_2AInput.parse(
      await loadRawFixture(),
    );
    const result =
      evaluateCasimirDpElectronMassHiggsAnchorStage4_2A(input);

    expect(input.schema_version).toBe(
      CASIMIR_DP_ELECTRON_MASS_HIGGS_ANCHOR_STAGE4_2A_INPUT_VERSION,
    );
    expect(result.schema_version).toBe(
      CASIMIR_DP_ELECTRON_MASS_HIGGS_ANCHOR_STAGE4_2A_RESULT_VERSION,
    );
    expect(result.status).toBe("pass");
    expect(result.failures).toEqual([]);
    expect(result.first_failure_code).toBeNull();
    expect(result.promotion_allowed).toBe(false);
    expect(result.observable_bridge_edges_added).toBe(0);

    expect(result.correction_ledger.row_count).toBe(13);
    expect(result.correction_ledger.relative_shift_sum_ppt).toBeCloseTo(
      -283.282,
      9,
    );
    expect(
      Math.abs(
        result.frequency_ratio_replay.row_replay_residual_ppt,
      ),
    ).toBeLessThanOrEqual(0.1);
    expect(
      Math.abs(
        result.frequency_ratio_replay
          .published_total_replay_residual_ppt,
      ),
    ).toBeLessThanOrEqual(0.1);
    expect(result.electron_mass_metrology_replay.observational_equation)
      .toBe(
        "m_e=(|g_b|/2)(|e|/|q|)(omega_c/omega_L)m_ion",
      );
    expect(
      result.electron_mass_metrology_replay.A_r_e
        .direct_vs_self_relative_residual,
    ).toBeLessThan(1e-12);
    expect(
      result.electron_mass_metrology_replay.A_r_e
        .self_vs_published_absolute_difference,
    ).toBeLessThan(1e-15);
    expect(
      result.electron_mass_metrology_replay.ion_relative_mass
        .absolute_difference_u,
    ).toBeLessThan(3 * 1.8e-12);
    expect(
      result.electron_mass_metrology_replay.uncertainty_replay
        .reconstructed,
    ).toMatchObject({
      statistical: expect.closeTo(1.28e-14, 16),
      systematic: expect.closeTo(8.6e-15, 16),
      theory: expect.closeTo(1.3e-15, 16),
    });
    expect(
      result.electron_mass_metrology_replay
        .theory_assisted_frequency_ratio_inference,
    ).toBe(true);
    expect(
      result.electron_mass_metrology_replay.static_weighing,
    ).toBe(false);
  });

  it("keeps the CODATA unit views correlated and the Higgs map tree-level only", async () => {
    const result =
      evaluateCasimirDpElectronMassHiggsAnchorStage4_2A(
        await loadRawFixture(),
      );
    const converted = result.correlated_codata_conversions;

    expect(converted.conversion_semantics).toBe(
      "deterministic_fully_correlated_views",
    );
    expect(converted.source_overlap_class).toBe(
      "shared_adjustment_ancestor_not_independent",
    );
    expect(converted.cross_covariance_status).toBe("not_supplied");
    expect(converted.independent_pull).toBeNull();
    expect(converted.comparisons).toHaveLength(4);
    expect(converted.comparisons.every(
      (row) =>
        row.gate === "pass" &&
        row.independent_confirmation === false &&
        row.significance === null &&
        row.significance_status ===
          "not_computable_without_cross_covariance",
    )).toBe(true);
    expect(
      relativeDifference(
        converted.A_r_e,
        0.0005485799090694,
      ),
    ).toBeLessThan(1e-12);
    expect(
      relativeDifference(
        converted.m_e_OS_kg,
        9.109383714344e-31,
      ),
    ).toBeLessThan(1e-12);
    expect(
      relativeDifference(
        converted.E_e_OS_J,
        8.187105788368e-14,
      ),
    ).toBeLessThan(1e-12);
    expect(
      relativeDifference(
        converted.E_e_OS_MeV,
        0.5109989507167,
      ),
    ).toBeLessThan(1e-12);

    const tree = result.standard_model_tree_mapping;
    expect(tree.v_F_tree_GeV).toBeCloseTo(246.219650794, 8);
    expect(tree.y_e_lagrangian_tree).toBeCloseTo(
      2.9350283137e-6,
      15,
    );
    expect(tree.g_h_e_e_tree).toBeCloseTo(
      2.0753784236e-6,
      15,
    );
    expect(tree.v_F_tree_standard_uncertainty_GeV).toBeGreaterThan(0);
    expect(
      tree.y_e_lagrangian_tree_standard_uncertainty,
    ).toBeGreaterThan(0);
    expect(
      tree.g_h_e_e_tree_standard_uncertainty,
    ).toBeGreaterThan(0);
    expect(
      tree.y_e_lagrangian_tree_standard_uncertainty /
        tree.y_e_lagrangian_tree,
    ).toBeCloseTo(
      tree.g_h_e_e_tree_standard_uncertainty /
        tree.g_h_e_e_tree,
      15,
    );
    expect(tree.uncertainty_scope).toBe(
      "tree_anchor_with_source_mass_and_G_F_only",
    );
    expect(tree.uncertainty_method).toBe(
      "conservative_l1_mass_and_G_F_unknown_cross_covariance",
    );
    expect(tree.sqrt2_ratio).toBeCloseTo(Math.SQRT2, 14);
    expect(Object.values(tree.residuals).every(
      (residual) => residual <= 1e-12,
    )).toBe(true);
    expect(tree.inferred_from_mass_not_directly_observed).toBe(true);
    expect(tree.identity_replay.interpretation).toBe(
      "shared_algebra_not_independent_evidence",
    );
    expect(tree.precision_matching).toEqual({
      status: "blocked",
      reason:
        "scale_scheme_tadpole_matching_and_order_not_supplied",
      y_e_MSbar_at_mu: null,
      gate: "pass",
    });
  });

  it("keeps CMS upper-bound-only and exits the theory domain at formal zero v_F", async () => {
    const result =
      evaluateCasimirDpElectronMassHiggsAnchorStage4_2A(
        await loadRawFixture(),
      );

    expect(result.collider_upper_bound_lane).toMatchObject({
      branching_fraction_upper_limit: 3e-4,
      confidence_level: 0.95,
      electron_yukawa_collider_status: "upper_bound_only",
      direct_electron_yukawa_observed: false,
      kappa_e_collider_bound: null,
      naive_reconstruction_performed: false,
      tree_anchor_interpretation:
        "not_excluded_no_direct_electron_yukawa_observation",
      gate: "pass",
    });
    expect(result.formal_zero_v_domain_exit).toMatchObject({
      formal_limit_only: true,
      at_limit: {
        v_F_tree_GeV: 0,
        electron_rest_energy_GeV: 0,
        compton_frequency_Hz: 0,
        rydberg_leading_energy_GeV: 0,
        ordinary_compton_wavelength: "diverges_to_infinity",
        reduced_compton_wavelength: "diverges_to_infinity",
        bohr_radius: "diverges_to_infinity",
      },
      experimental_switch: false,
      domain_status:
        "outside_broken_electroweak_and_low_energy_atomic_domain",
      unchanged_apparatus_extrapolation_allowed: false,
      gate: "pass",
    });
  });

  it("passes diagnostic closures while leaving scientific identification unpromoted", async () => {
    const result =
      evaluateCasimirDpElectronMassHiggsAnchorStage4_2A(
        await loadRawFixture(),
      );

    expect(result.final_gates).toMatchObject({
      primary_source_integrity: "pass",
      penning_correction_ledger: "pass",
      penning_observational_replay: "pass",
      codata_correlated_reproduction: "pass",
      unit_dimension_closure: "pass",
      conditional_sm_tree_mapping: "pass",
      collider_upper_bound_semantics: "pass",
      formal_zero_v_domain_exit: "pass",
      semantic_nonbridge: "pass",
      independent_electron_mass_validation: "not_ready",
      running_yukawa_at_higgs_scale: "blocked",
      direct_electron_yukawa_observation: "not_ready",
      electron_mass_from_higgs_identification: "blocked",
      higgs_origin_identification: "blocked",
      measured_casimir_coherence_evidence: "not_ready",
      casimir_higgs_dp_transfer: "blocked",
      compton_to_collapse_clock: "blocked",
      collapse_identification: "blocked",
      manifold_dynamics: "blocked",
      physical_viability: "not_evaluated",
      publication_claim:
        "electron_mass_replay_and_conditional_tree_anchor_only",
    });
  });

  it("fails in a stable order when multiple source-backed semantics are altered", async () => {
    const raw = await loadRawFixture();
    const penning = raw.penning_replay as {
      corrections: Array<{
        correction_id: string;
        relative_shift_ppt: number;
      }>;
    };
    const imageCharge = penning.corrections.find(
      (row) => row.correction_id === "image_charge",
    );
    if (imageCharge === undefined) {
      throw new Error("test fixture lacks image-charge row");
    }
    imageCharge.relative_shift_ppt += 1;
    (raw.collider_lane as {
      result_kind: string;
      direct_observation_claimed: boolean;
    }).result_kind = "observation";
    (raw.collider_lane as {
      result_kind: string;
      direct_observation_claimed: boolean;
    }).direct_observation_claimed = true;
    (raw.formal_zero_v_limit as {
      experimental_switch: boolean;
    }).experimental_switch = true;

    const result =
      evaluateCasimirDpElectronMassHiggsAnchorStage4_2A(raw);
    expect(result.status).toBe("not_ready");
    expect(result.first_failure_code).toBe(
      "EMH_CORRECTION_LEDGER_INVALID",
    );
    expect(result.failures.map((failure) => failure.code)).toEqual([
      "EMH_CORRECTION_LEDGER_INVALID",
      "EMH_GAMMA_CORRECTION_REPLAY_FAILED",
      "EMH_COLLIDER_BOUNDARY_FAILED",
      "EMH_ZERO_V_DOMAIN_EXIT_FAILED",
    ]);
    const failureOrder = new Map(
      CASIMIR_DP_ELECTRON_MASS_HIGGS_ANCHOR_STAGE4_2A_FAILURE_ORDER
        .map((code, index) => [code, index]),
    );
    expect(result.failures.every((failure, index, failures) =>
      index === 0 ||
      (failureOrder.get(failures[index - 1].code) ?? -1) <=
        (failureOrder.get(failure.code) ?? -1)
    )).toBe(true);
  });

  it("blocks a running Yukawa claim when precision matching is incomplete", async () => {
    const raw = await loadRawFixture();
    const precision = (
      raw.electroweak_tree_mapping as {
        precision_matching: {
          status: string;
          running_value_claimed: boolean;
        };
      }
    ).precision_matching;
    precision.status = "supplied";
    precision.running_value_claimed = true;

    const result =
      evaluateCasimirDpElectronMassHiggsAnchorStage4_2A(raw);
    expect(result.status).toBe("not_ready");
    expect(result.first_failure_code).toBe(
      "EMH_PRECISION_MATCHING_OVERCLAIM",
    );
    expect(result.standard_model_tree_mapping.precision_matching)
      .toMatchObject({
        status: "blocked",
        y_e_MSbar_at_mu: null,
        gate: "blocked",
      });
    expect(result.final_gates.running_yukawa_at_higgs_scale).toBe(
      "blocked",
    );
  });

  it.each([
    "casimir_gap_m",
    "dp_rate_s",
    "manifold_metric",
    "collapse_clock_s",
    "transfer_kernel_id",
    "polarization_state",
    "resonance_frequency_Hz",
  ])("rejects forbidden cross-mechanism input key %s before parsing", async (key) => {
    const raw = await loadRawFixture();
    raw[key] = 1;

    expect(() =>
      evaluateCasimirDpElectronMassHiggsAnchorStage4_2A(raw)
    ).toThrow(`EMH_FORBIDDEN_BRIDGE_FIELD:${key}`);
  });

  it("uses a strict schema for nonregistered fields as well", async () => {
    const raw = await loadRawFixture();
    raw.unregistered_shortcut = true;

    expect(() =>
      evaluateCasimirDpElectronMassHiggsAnchorStage4_2A(raw)
    ).toThrow();
  });
});

#!/usr/bin/env python3
"""Relic-budget and coannihilator-population preflight for a two-component IDM.

This calculates the target IDM abundance and Maxwell-Boltzmann equilibrium
weights of the compressed IDM states. It does not calculate annihilation
cross sections, the effective freeze-out rate, a relic density, or the LZ fit.
"""

from __future__ import annotations

import json
import math
from pathlib import Path


M_H_GEV = 1080.0
DELTA_AH_GEV = 369.0e-6
DELTA_CHARGED_BESTFIT_GEV = 8.17
DELTA_CHARGED_SCAN_GEV = (0.5, 10.0)
OMEGA_H_PROFILE = 0.12014
OMEGA_DM = 0.1198
OMEGA_DM_SIGMA = 0.0012
F_PHI_GRID = (0.0, 0.007178631051753035, 0.01, 0.10, 0.25)
X_FREEZEOUT_GRID = (20.0, 25.0, 30.0)


def equilibrium_weights(delta_charged_gev: float, x_freezeout: float) -> dict[str, float]:
    """Nonrelativistic Maxwell-Boltzmann weights with scalar degeneracies.

    The H and A neutral states each have one real degree of freedom. The
    charged H+ and H- states together have two degrees of freedom.
    """
    q_a = (1.0 + DELTA_AH_GEV / M_H_GEV) ** 1.5 * math.exp(
        -x_freezeout * DELTA_AH_GEV / M_H_GEV
    )
    q_charged = (1.0 + delta_charged_gev / M_H_GEV) ** 1.5 * math.exp(
        -x_freezeout * delta_charged_gev / M_H_GEV
    )
    weight_h = 1.0
    weight_a = q_a
    weight_charged = 2.0 * q_charged
    total = weight_h + weight_a + weight_charged
    f_h = weight_h / total
    f_a = weight_a / total
    f_charged = weight_charged / total
    return {
        "weight_H": weight_h / total,
        "weight_A": weight_a / total,
        "weight_charged_total": f_charged,
        "weight_neutral_total": f_h + f_a,
        "ordered_pair_population_fraction_charged_charged": f_charged**2,
        "ordered_pair_population_fraction_neutral_charged": 2.0 * f_charged * (f_h + f_a),
        "ordered_pair_population_fraction_neutral_neutral": (f_h + f_a) ** 2,
    }


def build() -> dict[str, object]:
    abundance_rows = []
    for f_phi in F_PHI_GRID:
        f_h = 1.0 - f_phi
        omega_h_target = f_h * OMEGA_DM
        sigma_ratio = OMEGA_H_PROFILE / omega_h_target if omega_h_target else None
        fixed_total = OMEGA_H_PROFILE + f_phi * OMEGA_DM
        abundance_rows.append({
            "f_phi": f_phi,
            "required_f_H": f_h,
            "required_Omega_H_h2": omega_h_target,
            "target_over_published_IDM_relic": omega_h_target / OMEGA_H_PROFILE,
            "fixed_profile_plus_phi_total_Omega_h2": fixed_total,
            "fixed_profile_plus_phi_planck_central_sigma": (fixed_total - OMEGA_DM) / OMEGA_DM_SIGMA,
            "approx_sigma_eff_multiplier_inverse_Omega_only": sigma_ratio,
        })

    coann_rows = []
    for x in X_FREEZEOUT_GRID:
        baseline = equilibrium_weights(DELTA_CHARGED_BESTFIT_GEV, x)
        for delta in (DELTA_CHARGED_SCAN_GEV[0], DELTA_CHARGED_BESTFIT_GEV, DELTA_CHARGED_SCAN_GEV[1]):
            weights = equilibrium_weights(delta, x)
            coann_rows.append({
                "x_freezeout_m_over_T": x,
                "delta_charged_GeV": delta,
                **weights,
                "charged_fraction_ratio_to_8p17_GeV": (
                    weights["weight_charged_total"] / baseline["weight_charged_total"]
                ),
                "charged_charged_pair_weight_ratio_to_8p17_GeV": (
                    weights["ordered_pair_population_fraction_charged_charged"]
                    / baseline["ordered_pair_population_fraction_charged_charged"]
                ),
                "neutral_charged_pair_weight_ratio_to_8p17_GeV": (
                    weights["ordered_pair_population_fraction_neutral_charged"]
                    / baseline["ordered_pair_population_fraction_neutral_charged"]
                ),
                "neutral_neutral_pair_weight_ratio_to_8p17_GeV": (
                    weights["ordered_pair_population_fraction_neutral_neutral"]
                    / baseline["ordered_pair_population_fraction_neutral_neutral"]
                ),
            })

    return {
        "classification": "IDM_subdominant_relic_and_coannihilator_weight_preflight_not_relic_solution",
        "inputs": {
            "m_H_GeV": M_H_GEV,
            "m_A_minus_m_H_GeV": DELTA_AH_GEV,
            "profile_bestfit_m_Hplus_minus_m_H_GeV": DELTA_CHARGED_BESTFIT_GEV,
            "paper_scanned_m_Hplus_minus_m_H_GeV": list(DELTA_CHARGED_SCAN_GEV),
            "paper_profile_Omega_H_h2": OMEGA_H_PROFILE,
            "adopted_Omega_DM_h2": OMEGA_DM,
            "adopted_Omega_DM_sigma": OMEGA_DM_SIGMA,
            "freezeout_x_values_for_diagnostic_only": list(X_FREEZEOUT_GRID),
        },
        "abundance_targets": abundance_rows,
        "coannihilator_equilibrium_weights": coann_rows,
        "interpretation": [
            "At f_phi=0.10, the target IDM abundance is 0.10782, 0.89745 of the published 0.12014 point; inverse-Omega scaling alone suggests a 1.1143 effective freezeout-rate multiplier.",
            "The profile paper treats charged splitting as a profiled parameter and scans 0.5-10 GeV; moving below its 8.17 GeV best-fit value raises the charged equilibrium weight.",
            "At x=25, the charged-charged population pair weight rises 19.1% from DeltaM_charged=8.17 to 0.5 GeV, while the neutral-neutral weight falls 14.7%; mixed initial-state weight changes by less than 1%. The effective rate is their weighted sum with different channel cross sections, which this preflight does not calculate.",
            "The neutral mass splitting of 369 keV is negligible compared with the freezeout temperature in this diagnostic, but it remains essential for the present-day xenon kinematics.",
        ],
        "required_next_calculation": "Re-run the exact IDM model in micrOMEGAs at fixed m_H and delta, scan DeltaM_charged, lambda_L, and lambda_2 under vacuum, unitarity, oblique, collider, and indirect constraints; then response-profile LZ with rho_H/rho_DM=Omega_H/Omega_DM and verify whether Omega_H h^2<=0.10782 remains allowed.",
        "limits": [
            "Equilibrium weights use nonrelativistic Maxwell-Boltzmann statistics and an illustrative x_f grid; they are not a freezeout integration.",
            "All channel cross sections, thresholds, Sommerfeld effects, thermal corrections, and changing x_f are omitted.",
            "No micrOMEGAs executable or model source is present in the inspected repository/environment; do not promote this preflight to an IDM point selection.",
            "The LZ paper states that its full profile likelihood requires additional detector-level information not currently public.",
        ],
    }


def main() -> None:
    result = build()
    targets = result["abundance_targets"]
    assert isinstance(targets, list)
    f10 = next(row for row in targets if row["f_phi"] == 0.10)
    assert abs(f10["required_Omega_H_h2"] - 0.10782) < 1e-12
    assert abs(f10["approx_sigma_eff_multiplier_inverse_Omega_only"] - 1.1142645149322945) < 1e-12
    coann = result["coannihilator_equilibrium_weights"]
    assert isinstance(coann, list)
    baseline = next(row for row in coann if row["x_freezeout_m_over_T"] == 25.0 and row["delta_charged_GeV"] == 8.17)
    compressed = next(row for row in coann if row["x_freezeout_m_over_T"] == 25.0 and row["delta_charged_GeV"] == 0.5)
    assert abs(baseline["weight_charged_total"] + baseline["weight_neutral_total"] - 1.0) < 1e-12
    assert compressed["weight_charged_total"] > baseline["weight_charged_total"]
    assert compressed["charged_charged_pair_weight_ratio_to_8p17_GeV"] > 1.15
    Path(__file__).with_suffix(".json").write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()

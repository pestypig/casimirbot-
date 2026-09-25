#!/usr/bin/env python3
"""Conditional CMB isocurvature screen for the existing ultralight misalignment budget.

This deliberately uses the prior 3H=m abundance amplitude as a proxy for the
pre-oscillation homogeneous field value. A full Klein-Gordon transfer calculation
and charged-field perturbation treatment are separate required steps.
"""
from __future__ import annotations

import json
import math
from pathlib import Path
import runpy
from scipy.integrate import solve_ivp


# Planck 2018 CDI case: n_II=1, uncorrelated with adiabatic perturbations.
BETA_ISO_MAX = 0.038
# Planck 2018 scalar amplitude at k*=0.05 Mpc^-1; rounded central value.
A_S = 2.1e-9
INFLATION_HUBBLE_SCALES_GEV = (1e9, 1e10, 1e11, 1e12, 1e13)
FRACTIONS = (0.001, 0.01, 0.1, 0.5, 1.0)


def radiation_era_misalignment_transfer() -> dict[str, float]:
    """Map the 3H=m onset convention to the frozen radiation-era field value."""
    def rhs(x: float, state: tuple[float, float]) -> tuple[float, float]:
        y, dy = state
        return dy, -1.5 * dy / x - y

    x_initial = 1e-6
    x_late = 1000.0
    # Regular small-x expansion of y''+3 y'/(2x)+y=0 for y(0)=1.
    y_initial = 1.0 - x_initial**2 / 5.0
    dy_initial = -2.0 * x_initial / 5.0
    solution = solve_ivp(
        rhs,
        (x_initial, x_late),
        (y_initial, dy_initial),
        method="DOP853",
        rtol=1e-10,
        atol=1e-12,
    )
    if not solution.success:
        raise RuntimeError(f"Radiation-era transfer integration failed: {solution.message}")
    y_late, dy_late = solution.y[:, -1]
    energy_factor = y_late**2 + dy_late**2
    # At x_late, a/a_osc=sqrt(2x/3) for H=1/(2t), with x_osc=3/2.
    scale_factor_ratio = math.sqrt(2.0 * x_late / 3.0)
    # Match the late comoving energy to rho_osc*a_osc^3 in the old 3H=m
    # normalization. This gives phi_frozen/A_osc=sqrt[(a_osc/a)^3/E].
    transfer = math.sqrt(scale_factor_ratio**-3 / energy_factor)
    return {
        "dimensionless_late_time_x": x_late,
        "late_energy_factor_y2_plus_dy2": energy_factor,
        "scale_factor_ratio_from_3H_equals_m": scale_factor_ratio,
        "frozen_field_value_over_3H_equals_m_amplitude": transfer,
        "solver_relative_tolerance": 1e-10,
    }


def screen() -> dict[str, object]:
    abundance_path = Path(__file__).with_name(
        "casimir-dp-ultralight-condensate-abundance-screen-2026-09-24.py"
    )
    abundance = runpy.run_path(str(abundance_path))["screen"]()
    amp_full = abundance["derived"]["canonical_real_amplitude_for_full_DM_GeV"]
    transfer = radiation_era_misalignment_transfer()
    rows = []
    for f_phi in FRACTIONS:
        phi_proxy = amp_full * math.sqrt(f_phi) * transfer["frozen_field_value_over_3H_equals_m_amplitude"]
        # For quadratic misalignment, S_phi ~= f_phi * 2 delta(phi)/phi,
        # delta(phi)=H_inf/(2 pi), hence P_S=(f_phi H_inf/(pi phi))^2.
        h_max = (math.pi * phi_proxy / f_phi) * math.sqrt(
            (BETA_ISO_MAX / (1.0 - BETA_ISO_MAX)) * A_S
        )
        benchmarks = []
        for h_inf in INFLATION_HUBBLE_SCALES_GEV:
            p_s = (f_phi * h_inf / (math.pi * phi_proxy)) ** 2
            beta = p_s / (A_S + p_s)
            benchmarks.append({
                "H_inf_GeV": h_inf,
                "predicted_beta_iso_if_uncorrelated": beta,
                "passes_adopted_Planck_bound": beta < BETA_ISO_MAX,
            })
        rows.append({
            "global_phi_fraction": f_phi,
            "radiation_era_frozen_field_value_GeV": phi_proxy,
            "conditional_H_inf_upper_bound_GeV": h_max,
            "benchmark_inflation_scales": benchmarks,
        })
    return {
        "classification": "conditional single-radial-mode, uncorrelated scale-invariant CDM-isocurvature screening estimate; not a full cosmological fit",
        "assumptions": [
            "A light spectator field is present during inflation and its inflationary fluctuation is delta_phi=H_inf/(2 pi).",
            "The field later behaves as a quadratic, coherently oscillating component with no significant late dilution or conversion.",
            "The field is a fraction f_phi of total CDM, so its total-CDM isocurvature amplitude is diluted by f_phi.",
            "The mode is uncorrelated with adiabatic curvature and has the scale-invariant CDI spectrum used for the adopted Planck limit.",
            "The mapping from the existing 3H=m abundance normalization to the pre-oscillation field value uses a numerical homogeneous Klein-Gordon solution in a radiation background with fixed relativistic degrees of freedom.",
        ],
        "inputs": {
            "m_phi_eV": abundance["inputs"]["m_phi_eV"],
            "omega_dm_h2": abundance["inputs"]["omega_dm_h2"],
            "beta_iso_95pct_upper_limit": BETA_ISO_MAX,
            "A_s_at_k_0p05_Mpc_inverse": A_S,
            "phi_fraction_grid": list(FRACTIONS),
            "inflation_Hubble_scale_grid_GeV": list(INFLATION_HUBBLE_SCALES_GEV),
            "field_amplitude_source": "casimir-dp-ultralight-condensate-abundance-screen-2026-09-24.py; 3H=m normalization",
        },
        "formula": {
            "component_isocurvature_power": "P_S=(f_phi*H_inf/(pi*phi_i))^2",
            "beta_iso": "P_S/(A_s+P_S)",
            "H_inf_upper_bound": "pi*phi_i/f_phi * sqrt([beta_max/(1-beta_max)]*A_s)",
        },
        "background_transfer": transfer,
        "fractions": rows,
        "limitations": [
            "Planck's limit is model-specific; correlated, blue, post-inflationary, or otherwise modified perturbations need their own likelihood treatment.",
            "For f_phi<1 this constrains only the phi component; the remaining dark matter is assumed adiabatic.",
            "A charged complex condensate has two field components, phase/charge perturbations, and possible correlated modes; this radial single-mode estimate does not validate that case.",
            "The background transfer solves only the homogeneous real field in a fixed-g radiation era; temperature-dependent degrees of freedom, non-quadratic potentials, reheating, and perturbation transfer remain outside this screen.",
            "Passing the isocurvature screen does not demonstrate fragmentation or boson-star formation.",
        ],
        "source_references": {
            "Planck_CDI_bound": "https://arxiv.org/abs/1807.06211",
            "Planck_scalar_amplitude": "https://arxiv.org/abs/1807.06209",
        },
    }


def main() -> None:
    result = screen()
    # Sanity checks: f_phi scaling implies H_max proportional to f_phi^-1/2.
    rows = result["fractions"]
    assert all(row["conditional_H_inf_upper_bound_GeV"] > 0 for row in rows)
    for low, high in zip(rows, rows[1:]):
        assert low["global_phi_fraction"] < high["global_phi_fraction"]
        assert low["conditional_H_inf_upper_bound_GeV"] > high["conditional_H_inf_upper_bound_GeV"]
    assert all(len(row["benchmark_inflation_scales"]) == len(INFLATION_HUBBLE_SCALES_GEV) for row in rows)
    Path(__file__).with_suffix(".json").write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()

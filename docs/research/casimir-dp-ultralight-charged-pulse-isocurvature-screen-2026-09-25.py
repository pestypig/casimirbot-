#!/usr/bin/env python3
"""Two-component inflationary isocurvature response for the frozen charge pulse toy."""
from __future__ import annotations

import json
import math
from pathlib import Path
import runpy

import numpy as np


ROOT = Path(__file__).parent
PULSE_PATH = ROOT / "casimir-dp-ultralight-charge-pulse-evolution-2026-09-25.py"
ABUNDANCE_PATH = ROOT / "casimir-dp-ultralight-condensate-abundance-screen-2026-09-24.py"
TRANSFER_PATH = ROOT / "casimir-dp-ultralight-misalignment-isocurvature-screen-2026-09-25.py"
BETA_ISO_MAX = 0.038
A_S = 2.1e-9
FRACTIONS = (0.01, 0.1, 0.5, 1.0)
H_INF_GRID_GEV = (1e9, 1e10, 1e11, 1e12, 1e13)
PULSE_SIGMA = 0.2
PULSE_TARGET_EPSILON = 0.5


def screen() -> dict[str, object]:
    pulse_module = runpy.run_path(str(PULSE_PATH))
    integrate = pulse_module["integrate"]
    pulse_json = json.loads(PULSE_PATH.with_suffix(".json").read_text(encoding="utf-8"))
    fit = next(
        row
        for profile in pulse_json["profiles"]
        if profile["sigma_in_u_units"] == PULSE_SIGMA
        for row in profile["target_fits"]
        if row.get("target_epsilon_absolute") == PULSE_TARGET_EPSILON
    )
    g0 = fit["g0_peak"]
    background_fit = integrate(g0, PULSE_SIGMA)

    # Since the toy equations are linear in (x,y), the final comoving energy
    # action is a quadratic form in the initial field components.
    def energy(x0: float, y0: float) -> float:
        result = integrate(g0, PULSE_SIGMA, initial_state=(x0, y0, 0.0, 0.0))
        return float(result["comoving_energy_action_for_initial_x0_1"])

    k_xx = energy(1.0, 0.0)
    k_yy = energy(0.0, 1.0)
    k_xy = 0.5 * (energy(1.0, 1.0) - k_xx - k_yy)
    k_matrix = np.array(((k_xx, k_xy), (k_xy, k_yy)), dtype=float)
    eigenvalues = np.linalg.eigvalsh(k_matrix)
    mixed_direct = energy(0.37, -0.62)
    mixed_quadratic = float(np.array((0.37, -0.62)) @ k_matrix @ np.array((0.37, -0.62)))
    mixed_relative_error = abs(mixed_direct - mixed_quadratic) / mixed_direct
    no_pulse = float(integrate(0.0, PULSE_SIGMA)["comoving_energy_action_for_initial_x0_1"])
    energy_ratio = k_xx / no_pulse
    abundance = runpy.run_path(str(ABUNDANCE_PATH))["screen"]()
    transfer = runpy.run_path(str(TRANSFER_PATH))["radiation_era_misalignment_transfer"]()
    amp_full_3h = abundance["derived"]["canonical_real_amplitude_for_full_DM_GeV"]
    real_field_initial_full_dm = amp_full_3h * transfer["frozen_field_value_over_3H_equals_m_amplitude"]

    # For a background (X,0), rho_phi \propto X^2*K_xx and
    # grad ln rho = (2/X, 2*K_xy/(X*K_xx)). Independent canonical x,y
    # fluctuations each have power (H_inf/2pi)^2 while light in inflation.
    orientation_response_sq = 1.0 + (k_xy / k_xx) ** 2
    rows = []
    for f_phi in FRACTIONS:
        initial_x = real_field_initial_full_dm * math.sqrt(f_phi / energy_ratio)
        grad_norm = 2.0 / initial_x * math.sqrt(orientation_response_sq)
        bounds = []
        h_max = 2.0 * math.pi / (f_phi * grad_norm) * math.sqrt(
            BETA_ISO_MAX / (1.0 - BETA_ISO_MAX) * A_S
        )
        for h_inf in H_INF_GRID_GEV:
            p_s = (f_phi * h_inf * grad_norm / (2.0 * math.pi)) ** 2
            beta = p_s / (A_S + p_s)
            bounds.append({
                "H_inf_GeV": h_inf,
                "predicted_beta_iso_if_uncorrelated": beta,
                "passes_adopted_Planck_bound": beta < BETA_ISO_MAX,
            })
        rows.append({
            "global_phi_fraction": f_phi,
            "required_initial_radial_field_value_GeV_for_fixed_final_abundance": initial_x,
            "conditional_H_inf_upper_bound_GeV": h_max,
            "benchmark_inflation_scales": bounds,
        })

    return {
        "classification": "linear two-component separate-universe perturbation response of one prescribed homogeneous charge-generation pulse; conditional isocurvature screen only",
        "pulse_model": {
            "source_artifact": PULSE_PATH.name,
            "sigma_in_m_phi_t_units": PULSE_SIGMA,
            "target_late_charge_asymmetry": PULSE_TARGET_EPSILON,
            "fitted_g0": g0,
            "positive_definite_mass_matrix_minimum_eigenvalue_over_m2": 1.0 - abs(g0),
            "reproduced_late_charge_asymmetry": background_fit["epsilon_signed_late_time"],
            "target_charge_asymmetry_relative_error": abs(
                abs(background_fit["epsilon_signed_late_time"]) - PULSE_TARGET_EPSILON
            ) / PULSE_TARGET_EPSILON,
        },
        "inputs": {
            "beta_iso_95pct_upper_limit": BETA_ISO_MAX,
            "A_s_at_k_0p05_Mpc_inverse": A_S,
            "phi_fraction_grid": list(FRACTIONS),
            "inflation_Hubble_scale_grid_GeV": list(H_INF_GRID_GEV),
            "initial_field_inflation_fluctuations": "independent canonical real components; delta_x=delta_y=H_inf/(2pi)",
            "perturbation_limit": "superhorizon separate-universe (k/a neglected) in the same fixed radiation background as the homogeneous pulse",
        },
        "quadratic_energy_response": {
            "matrix_for_initial_vector_(x0,y0)": k_matrix.tolist(),
            "eigenvalues": eigenvalues.tolist(),
            "positive_definite": bool(eigenvalues[0] > 0),
            "mixed_initial_state_quadratic_form_relative_error": mixed_relative_error,
            "unbroken_energy_action_for_unit_x": no_pulse,
            "pulse_to_unbroken_energy_action_ratio_for_background_(1,0)": energy_ratio,
            "initial_y_response_ratio_kxy_over_kxx": k_xy / k_xx,
            "isocurvature_gradient_norm_squared_times_X_squared_over_four": orientation_response_sq,
        },
        "equations": {
            "late_comoving_energy_action": "E_c=(x0,y0) K (x0,y0)^T",
            "component_density_isocurvature_power": "P_S=(f_phi*H_inf/(2pi))^2*|grad_(x0,y0) ln(E_c)|^2",
            "for_background_(X,0)": "|grad ln(E_c)|^2=4/X^2*[1+(K_xy/K_xx)^2]",
            "beta_iso": "P_S/(A_s+P_S)",
        },
        "fractions": rows,
        "validity_limits": [
            "The charge-generation pulse is an externally prescribed time-dependent quadratic mixing, not a UV theory; its source energy and perturbations are absent.",
            "This propagates k=0 background perturbations only. It does not calculate finite-wavelength transfer, metric perturbations, or correlated curvature-isocurvature modes.",
            "The inflationary fluctuations assume both canonical components are light, independent, and unsuppressed during inflation.",
            "The density response is evaluated about the chosen radial background; perturbations of conserved charge and their later effect on star formation are not evolved.",
            "The Planck limit is applied as the uncorrelated scale-invariant CDI limit, which may not match the actual pulse-generated spectrum.",
            "No fragmentation, boson-star population, gamma-ray, xenon, or Casimir-DP signal is predicted by this calculation.",
        ],
        "next_tests": [
            "Derive the temporary U(1)-breaking source and its perturbations from a dynamical sector, then include the coupled metric and field perturbations.",
            "Evolve the joint density and charge perturbations into the nonlinear fragmentation regime and calculate the resulting star mass-charge distribution.",
        ],
        "source_references": {
            "Planck_CDI_bound": "https://arxiv.org/abs/1807.06211",
            "Planck_scalar_amplitude": "https://arxiv.org/abs/1807.06209",
        },
    }


def main() -> None:
    result = screen()
    matrix = result["quadratic_energy_response"]
    assert matrix["positive_definite"]
    assert matrix["mixed_initial_state_quadratic_form_relative_error"] < 1e-8
    assert result["pulse_model"]["target_charge_asymmetry_relative_error"] < 1e-5
    assert matrix["pulse_to_unbroken_energy_action_ratio_for_background_(1,0)"] > 0
    rows = result["fractions"]
    for left, right in zip(rows, rows[1:]):
        assert left["global_phi_fraction"] < right["global_phi_fraction"]
        assert left["conditional_H_inf_upper_bound_GeV"] > right["conditional_H_inf_upper_bound_GeV"]
    output = Path(__file__).with_suffix(".json")
    output.write_text(json.dumps(result, indent=2, allow_nan=False) + "\n", encoding="utf-8")
    print(json.dumps({"pulse": result["pulse_model"], "response": matrix, "fractions": rows}, indent=2))


if __name__ == "__main__":
    main()

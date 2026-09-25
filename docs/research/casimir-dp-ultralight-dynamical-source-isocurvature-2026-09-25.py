#!/usr/bin/env python3
"""Inflationary three-field density-isocurvature screen for the r=1 source toy."""
from __future__ import annotations

import json
import math
from pathlib import Path
import runpy

import numpy as np


ROOT = Path(__file__).parent
SOURCE_MODEL_PATH = ROOT / "casimir-dp-ultralight-dynamical-source-multicomponent-screen-2026-09-25.py"
ABUNDANCE_PATH = ROOT / "casimir-dp-ultralight-condensate-abundance-screen-2026-09-24.py"
TRANSFER_PATH = ROOT / "casimir-dp-ultralight-misalignment-isocurvature-screen-2026-09-25.py"
MASS_RATIO = 1.0
PHI_FRACTION = 0.10
BETA_ISO_MAX = 0.038
A_S = 2.1e-9
H_INF_GRID_GEV = (1e9, 1e10, 1e11, 1e12, 1e13)
FINITE_DIFFERENCE_STEPS = (1e-3, 5e-4)


def screen() -> dict[str, object]:
    module = runpy.run_path(str(SOURCE_MODEL_PATH))
    run_source = module["run_source_model"]
    baseline = run_source(MASS_RATIO)
    initial = np.asarray(baseline["dimensionless_initial_state_X_Y_Z_dX_dY_dZ"][:3], dtype=float)

    def total_action(initial_xyz: np.ndarray) -> float:
        initial_state = (
            float(initial_xyz[0]), float(initial_xyz[1]), float(initial_xyz[2]),
            0.0, 0.0, 0.0,
        )
        value = run_source(MASS_RATIO, initial_state=initial_state)
        return float(value["late_total_phi_plus_source_action_over_unbroken_reference"])

    base_action = total_action(initial)
    gradient_sets = []
    for step in FINITE_DIFFERENCE_STEPS:
        gradient = []
        for index in range(3):
            plus = initial.copy()
            minus = initial.copy()
            plus[index] += step
            minus[index] -= step
            gradient.append((total_action(plus)-total_action(minus))/(2.0*step*base_action))
        gradient_sets.append(np.asarray(gradient, dtype=float))
    gradient = gradient_sets[-1]
    step_convergence = float(
        np.linalg.norm(gradient_sets[-1]-gradient_sets[-2])/
        max(np.linalg.norm(gradient_sets[-1]), 1e-300)
    )

    abundance = runpy.run_path(str(ABUNDANCE_PATH))["screen"]()
    transfer = runpy.run_path(str(TRANSFER_PATH))["radiation_era_misalignment_transfer"]()
    full_field = abundance["derived"]["canonical_real_amplitude_for_full_DM_GeV"] * transfer[
        "frozen_field_value_over_3H_equals_m_amplitude"
    ]
    phi_to_source = baseline["late_source_to_phi_action_ratio"]
    bosonic_total_fraction = PHI_FRACTION*(1.0+phi_to_source)
    phi_action_ratio = baseline["late_phi_action_over_unbroken_reference"]
    physical_scale = full_field*math.sqrt(PHI_FRACTION/phi_action_ratio)
    grad_norm = float(np.linalg.norm(gradient))
    h_max = (2.0*math.pi*physical_scale/(bosonic_total_fraction*grad_norm))*math.sqrt(
        BETA_ISO_MAX/(1.0-BETA_ISO_MAX)*A_S
    )
    benchmark_rows = []
    for h_inf in H_INF_GRID_GEV:
        p_s = (h_inf/(2.0*math.pi*physical_scale))**2 * (
            bosonic_total_fraction*grad_norm
        )**2
        beta = p_s/(A_S+p_s)
        benchmark_rows.append({
            "H_inf_GeV": h_inf,
            "predicted_beta_iso_if_uncorrelated": beta,
            "passes_adopted_Planck_limit": beta < BETA_ISO_MAX,
        })

    return {
        "classification": "conditional k=0 separate-universe inflationary density-isocurvature estimate for the coupled x,y,S homogeneous toy",
        "background": {
            "source_mass_ratio_M_over_m": MASS_RATIO,
            "phi_fraction_of_total_DM": PHI_FRACTION,
            "source_fraction_of_total_DM": PHI_FRACTION*phi_to_source,
            "heavy_remainder_fraction_assumed_adiabatic": 1.0-bosonic_total_fraction,
            "initial_dimensionless_X_Y_Z": initial.tolist(),
            "dimensionless_total_comoving_action": base_action,
            "physical_field_scale_F_GeV": physical_scale,
            "Planck_beta_iso_limit": BETA_ISO_MAX,
            "Planck_A_s": A_S,
        },
        "perturbation_method": {
            "initial_canonical_inflation_fluctuations": "independent delta_x=delta_y=delta_S=H_inf/(2 pi); equal power because all three fields are assumed light during inflation",
            "mode_treatment": "superhorizon k=0 separate-universe; evolve finite differences through the full nonlinear homogeneous equations",
            "density_power": "P_S=(H_inf/(2pi F))^2*(f_phi+f_S)^2*|grad_(X,Y,Z) ln(E_total)|^2",
            "finite_difference_steps": list(FINITE_DIFFERENCE_STEPS),
            "dimensionless_log_density_gradient": gradient.tolist(),
            "gradient_norm": grad_norm,
            "step_convergence_relative_change": step_convergence,
        },
        "conditional_95pct_H_inf_upper_bound_GeV": h_max,
        "inflationary_Hubble_scale_benchmarks": benchmark_rows,
        "validity_limits": [
            "The source initial displacement is still an assigned misalignment initial condition; the inflation/reheating mechanism that selects it is not modeled.",
            "This is a separate-universe k=0 calculation in a fixed radiation background, without metric perturbations, finite-k transfer, reheating, or temperature-dependent relativistic degrees of freedom.",
            "It assumes three independent, unsuppressed canonical field fluctuations during inflation and an uncorrelated, scale-invariant total-CDM isocurvature mode.",
            "The heavy component is assumed adiabatic and the two scalar components are stable; entropy transfer and source decay are excluded.",
            "Density perturbations are propagated; the perturbation in conserved U(1) charge and its nonlinear fragmentation response are not included.",
            "This is not a CMB likelihood fit and does not predict stars, gamma rays, xenon recoils, or Casimir-DP decoherence.",
        ],
        "source_references": {
            "Planck_CDI_limit": "https://arxiv.org/abs/1807.06211",
            "Planck_scalar_amplitude": "https://arxiv.org/abs/1807.06209",
        },
    }


def main() -> None:
    result = screen()
    assert result["perturbation_method"]["step_convergence_relative_change"] < 0.01
    assert result["perturbation_method"]["gradient_norm"] > 0
    output = Path(__file__).with_suffix(".json")
    output.write_text(json.dumps(result, indent=2, allow_nan=False)+"\n", encoding="utf-8")
    print(json.dumps({
        "background": result["background"],
        "perturbation_method": result["perturbation_method"],
        "conditional_95pct_H_inf_upper_bound_GeV": result["conditional_95pct_H_inf_upper_bound_GeV"],
        "benchmarks": result["inflationary_Hubble_scale_benchmarks"],
    }, indent=2))


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Preflight screen for a pNGB boson-star field plus radial-mediator portal.

This combines the dilute pNGB-star mass scaling with a linear-sigma-model
matching estimate for the shift-symmetric derivative portal. It is a
conditional naturalness/scale screen, not a numerical boson-star or Boltzmann
solution.
"""

from __future__ import annotations

import json
import math
from pathlib import Path


M_PHI_EV = 1.0e-17
M_STAR_SOLAR = 4.02e6
M_H_GEV = 1080.0
M_SUN_COEFFICIENT = 5.97e-12
MASS_REFERENCE_EV = 1.0e-5
F_REFERENCE_GEV = 1.0e12
LAMBDA_EFT_GEV = 3379.977126775077  # Gamma/H=20 point from the derivative-portal screen.
LOOP_FACTOR = 16.0 * math.pi**2


def calculate() -> dict[str, float | str | dict[str, float]]:
    f_required_gev = (
        M_STAR_SOLAR / M_SUN_COEFFICIENT
        * (M_PHI_EV / MASS_REFERENCE_EV)
        * F_REFERENCE_GEV
    )
    c_required = 1.0 / LAMBDA_EFT_GEV**2

    # Be maximally favorable to the EFT: take the radial mediator only just
    # above pair-production threshold, even though this is not a good contact
    # limit. The actual perturbative UV model should use a heavier mediator.
    m_s_min_gev = 2.0 * M_H_GEV
    kappa_required = 0.5 * c_required * m_s_min_gev**2
    lambda_tree = m_s_min_gev**2 / (2.0 * f_required_gev**2)
    delta_lambda_loop = kappa_required**2 / LOOP_FACTOR
    tuning_ratio = delta_lambda_loop / lambda_tree

    # The symmetry-invariant portal also gives a vev threshold to the IDM
    # scalar mass: delta m_H^2 ~= kappa_2 f^2/2 in this normalization.
    kappa_mass_natural_max = 2.0 * M_H_GEV**2 / f_required_gev**2
    c_from_mass_natural_max = 2.0 * kappa_mass_natural_max / m_s_min_gev**2

    # Requiring lambda_X >= delta(lambda_X) and m_s >= 2 m_H maximizes the
    # naturally sized derivative coefficient at the smallest allowed m_s.
    kappa_natural_at_threshold = m_s_min_gev * math.sqrt(8.0 * math.pi**2) / f_required_gev
    c_natural_max = 2.0 * kappa_natural_at_threshold / m_s_min_gev**2
    gap_to_required = c_required / c_natural_max

    # If the target C is imposed while saturating the loop-sized lambda_X,
    # infer the radial mass and check whether integrating it out is possible.
    kappa_saturated = LOOP_FACTOR / (c_required * f_required_gev**2)
    lambda_saturated = kappa_saturated**2 / LOOP_FACTOR
    m_s_saturated_gev = math.sqrt(2.0 * lambda_saturated) * f_required_gev

    return {
        "classification": "pNGB_star_and_radial_mediator_conditional_compatibility_screen",
        "inputs": {
            "m_phi_eV": M_PHI_EV,
            "target_star_mass_solar": M_STAR_SOLAR,
            "m_H_GeV": M_H_GEV,
            "axion_like_dilute_star_scaling": "Mmax=5.97e-12 Msun*(m_phi/1e-5 eV)^-1*(f/1e12 GeV), kappa_axion=1",
            "freezeout_contact_scale_GeV": LAMBDA_EFT_GEV,
            "matching": "C_derivative=2*kappa_X/m_s^2; m_s^2=2*lambda_X*f^2",
            "radial_quartic_naturalness": "delta_lambda_X~kappa_X^2/(16*pi^2)",
        },
        "outputs": {
            "f_required_GeV_for_target_star_mass": f_required_gev,
            "f_over_reduced_Planck_2p435e18_GeV": f_required_gev / 2.435e18,
            "C_required_GeV_minus2": c_required,
            "optimistic_min_radial_mass_GeV": m_s_min_gev,
            "kappa_required_at_min_radial_mass": kappa_required,
            "lambda_X_tree_at_min_radial_mass": lambda_tree,
            "delta_lambda_X_loop": delta_lambda_loop,
            "loop_correction_over_tree_lambda": tuning_ratio,
            "kappa_2_max_from_no_cancellation_in_mH2": kappa_mass_natural_max,
            "kappa_required_over_mH2_natural_max": kappa_required / kappa_mass_natural_max,
            "maximum_C_from_mH2_naturalness_at_mediator_threshold_GeV_minus2": c_from_mass_natural_max,
            "required_over_max_C_from_mH2_naturalness": c_required / c_from_mass_natural_max,
            "maximum_natural_C_for_mediator_at_least_2mH_GeV_minus2": c_natural_max,
            "required_over_max_natural_C": gap_to_required,
            "radial_mass_if_target_C_and_loop_naturalness_GeV": m_s_saturated_gev,
            "radial_mass_if_target_C_and_loop_naturalness_eV": m_s_saturated_gev * 1.0e9,
        },
        "interpretation": (
            "For the standard attractive pNGB dilute-star scaling, the Sgr A*-scale "
            "target asks for f near the reduced Planck scale. In the minimal weakly "
            "coupled linear-sigma completion, a radial mediator heavy enough for "
            "freezeout scattering cannot naturally generate the required derivative "
            "portal: the invariant portal itself induces a heavy-doublet mass threshold "
            "that requires about 10^28 cancellation, while even the radial-quartic "
            "naturalness bound leaves the coefficient more than 10^12 too small. "
            "Matching the target coefficient with loop-sized radial quartic instead "
            "makes the radial mode sub-eV, invalidating the contact EFT."
        ),
        "limits": [
            "The dilute-star mass formula is for a standard attractive axion-like potential; the exact O(3)/O(2) soft-breaking potential needs its own Einstein-Klein-Gordon solutions.",
            "The radial matching and loop estimate are leading-order linear-sigma-model power counting; multiplicities and UV structure can change order-one factors.",
            "The mediator threshold m_s=2m_H is intentionally optimistic and not a controlled contact limit.",
            "A tuned, strongly coupled, multi-field, or different UV model is not excluded; it must be analyzed as a distinct candidate.",
        ],
    }


def main() -> None:
    result = calculate()
    outputs = result["outputs"]
    assert isinstance(outputs, dict)
    assert outputs["f_required_GeV_for_target_star_mass"] > 1.0e17
    assert outputs["required_over_max_natural_C"] > 1.0e12
    assert outputs["kappa_required_over_mH2_natural_max"] > 1.0e28
    assert outputs["required_over_max_C_from_mH2_naturalness"] > 1.0e28
    assert outputs["radial_mass_if_target_C_and_loop_naturalness_eV"] < 1.0
    Path(__file__).with_suffix(".json").write_text(
        json.dumps(result, indent=2) + "\n", encoding="utf-8"
    )
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Autonomous real-source + charged ultralight field toy and abundance closure screen.

The source is a real massive scalar initially displaced, with a trilinear
S*x*y coupling. A stabilizing phi quartic is fixed just above the analytic
bounded-from-below threshold. This is an explicit toy multicomponent model,
not a UV completion or boson-star solution.
"""
from __future__ import annotations

import json
import math
from pathlib import Path
import runpy

import numpy as np
from scipy.integrate import solve_ivp


M_PHI_EV = 1e-17
M_PHI_GEV = M_PHI_EV * 1e-9
G_TARGET = 0.615  # inherited target scale from the prior |epsilon|=0.5 pulse fit
SOURCE_MASS_RATIOS = (0.5, 1.0, 2.0, 5.0)
PHI_FRACTIONS = (0.01, 0.1, 0.5, 1.0)
U_INITIAL = 1e-3
U_FINAL = 1000.0
LONG_RUN_FINAL = 3000.0
QUARTIC_MARGIN = 1.01
OMEGA_DM_H2 = 0.1198
OMEGA_H_PROFILE_H2 = 0.12014


def run_source_model(
    ratio: float,
    u_final: float = U_FINAL,
    initial_state: tuple[float, float, float, float, float, float] | None = None,
) -> dict[str, object]:
    # Equalize the two unavoidable source scales R_S and B at their minimax
    # value sqrt(g), using the previously derived R_S*B=g identity.
    source_amplitude = G_TARGET**0.25 / ratio
    trilinear = G_TARGET / source_amplitude
    quartic_phi_hat = QUARTIC_MARGIN * trilinear**2 / (2.0 * ratio**2)
    if initial_state is None:
        initial_state = (1.0, 0.0, source_amplitude, 0.0, 0.0, 0.0)

    def rhs(u: float, state: np.ndarray) -> tuple[float, ...]:
        x, y, z, dx, dy, dz = state
        friction = 1.5 / u
        radius_sq = x*x + y*y
        return (
            dx,
            dy,
            dz,
            -friction*dx - x - trilinear*z*y - quartic_phi_hat*radius_sq*x,
            -friction*dy - y - trilinear*z*x - quartic_phi_hat*radius_sq*y,
            -friction*dz - ratio**2*z - trilinear*x*y,
        )

    solution = solve_ivp(
        rhs,
        (U_INITIAL, u_final),
        initial_state,
        method="DOP853",
        rtol=2e-9,
        atol=2e-11,
        max_step=min(0.12, 0.12/ratio),
        dense_output=True,
    )
    if not solution.success or solution.sol is None:
        raise RuntimeError(f"source model failed for M_S/m={ratio}: {solution.message}")

    averaging_window = 8.0 * math.pi / min(1.0, ratio)  # four periods of the slower mode
    u = np.linspace(u_final-averaging_window, u_final, 2001)
    x, y, z, dx, dy, dz = solution.sol(u)
    radius_sq = x*x + y*y
    rho_phi = 0.5*(dx*dx + dy*dy + radius_sq) + 0.25*quartic_phi_hat*radius_sq**2
    rho_source = 0.5*(dz*dz + ratio**2*z*z)
    rho_cross = trilinear*z*x*y
    scale_weight = u**1.5
    phi_action = float(np.mean(scale_weight*rho_phi))
    source_action = float(np.mean(scale_weight*rho_source))
    cross_action = float(np.mean(scale_weight*rho_cross))
    charge = scale_weight*(x*dy-y*dx)
    epsilon = float(np.mean(charge)/phi_action)
    charge_spread = float(np.ptp(charge)/max(np.mean(np.abs(charge)), 1e-300))
    history_u = np.linspace(U_INITIAL, u_final, 20001)
    history_z = solution.sol(history_u)[2]
    mixing = trilinear*history_z
    min_mass_eigenvalue_ratio = float(np.min(1.0-np.abs(mixing)))
    no_source = runpy.run_path(str(
        Path(__file__).with_name("casimir-dp-ultralight-charge-pulse-evolution-2026-09-25.py")
    ))["integrate"](0.0, 0.2)
    reference_action = float(no_source["comoving_energy_action_for_initial_x0_1"])
    return {
        "source_mass_ratio_M_over_m": ratio,
        "integrated_final_time_u": u_final,
        "dimensionless_initial_state_X_Y_Z_dX_dY_dZ": list(initial_state),
        "initial_source_to_phi_amplitude_ratio": source_amplitude,
        "dimensionless_trilinear_mu_F_over_m2": trilinear,
        "dimensionless_stabilizing_phi_quartic_lambda_F2_over_m2": quartic_phi_hat,
        "quartic_boundedness_threshold_lambda_hat": trilinear**2/(2.0*ratio**2),
        "initial_source_energy_fraction_relative_to_phi": ratio**2*source_amplitude**2,
        "source_backreaction_scale": trilinear/(ratio**2*source_amplitude),
        "min_mass_eigenvalue_over_m2_on_sampled_history": min_mass_eigenvalue_ratio,
        "late_phi_charge_to_energy_ratio_signed": epsilon,
        "late_phi_U1_current_exactly_conserved": False,
        "late_window_phi_charge_fractional_span": charge_spread,
        "late_window_phi_charge_span_below_one_percent": charge_spread < 0.01,
        "late_phi_action_over_unbroken_reference": phi_action/reference_action,
        "late_source_action_over_unbroken_reference": source_action/reference_action,
        "late_source_to_phi_action_ratio": source_action/phi_action,
        "late_interaction_action_over_phi_action": cross_action/phi_action,
        "late_total_phi_plus_source_action_over_unbroken_reference": (
            phi_action+source_action+cross_action
        )/reference_action,
        "averaging_window_u": averaging_window,
        "solver_function_evaluations": solution.nfev,
    }


def screen() -> dict[str, object]:
    abundance = runpy.run_path(str(Path(__file__).with_name(
        "casimir-dp-ultralight-condensate-abundance-screen-2026-09-24.py"
    )))["screen"]()
    transfer = runpy.run_path(str(Path(__file__).with_name(
        "casimir-dp-ultralight-misalignment-isocurvature-screen-2026-09-25.py"
    )))["radiation_era_misalignment_transfer"]()
    isocurvature_field_full = abundance["derived"]["canonical_real_amplitude_for_full_DM_GeV"] * transfer[
        "frozen_field_value_over_3H_equals_m_amplitude"
    ]
    # This is the standard radiation-era pre-oscillation real-field scale used
    # to convert dimensionless source-model amplitudes into physical couplings.
    source_rows = [run_source_model(ratio) for ratio in SOURCE_MASS_RATIOS]
    targeted_long_run_checks = []
    for ratio in SOURCE_MASS_RATIOS:
        base = next(row for row in source_rows if row["source_mass_ratio_M_over_m"] == ratio)
        later = run_source_model(ratio, LONG_RUN_FINAL)
        later["late_phi_charge_to_energy_ratio_relative_change_from_u1000"] = abs(
            later["late_phi_charge_to_energy_ratio_signed"]-
            base["late_phi_charge_to_energy_ratio_signed"]
        )/max(abs(base["late_phi_charge_to_energy_ratio_signed"]), 1e-300)
        later["source_to_phi_action_relative_change_from_u1000"] = abs(
            later["late_source_to_phi_action_ratio"]-base["late_source_to_phi_action_ratio"]
        )/max(abs(base["late_source_to_phi_action_ratio"]), 1e-300)
        targeted_long_run_checks.append(later)
    rows = []
    for source_row in source_rows:
        ratio_phi = source_row["late_phi_action_over_unbroken_reference"]
        ratio_source = source_row["late_source_action_over_unbroken_reference"]
        source_to_phi = ratio_source/ratio_phi
        for f_phi in PHI_FRACTIONS:
            f_source = f_phi*source_to_phi
            f_heavy = 1.0-f_phi-f_source
            field_scale = isocurvature_field_full*math.sqrt(f_phi/ratio_phi)
            physical_rows = {
                "f_phi": f_phi,
                "f_source": f_source,
                "f_heavy_remainder": f_heavy,
                "conditional_co_tracing_observable_scalings": None,
            }
            if f_heavy >= 0:
                sigma_ann_factor_to_reproduce_relic_fraction = OMEGA_H_PROFILE_H2/(f_heavy*OMEGA_DM_H2)
                physical_rows["conditional_co_tracing_observable_scalings"] = {
                    "xenon_recoil_rate_ratio_at_fixed_direct_detection_cross_section": f_heavy,
                    "gamma_annihilation_flux_ratio_at_fixed_annihilation_cross_section": f_heavy**2,
                    "gamma_annihilation_cross_section_multiplier_to_restore_reference_flux": 1.0/(f_heavy**2),
                    "thermal_annihilation_cross_section_multiplier_to_set_H_relic_fraction": sigma_ann_factor_to_reproduce_relic_fraction,
                    "gamma_flux_ratio_if_annihilation_cross_section_tracks_thermal_relic": f_heavy**2*sigma_ann_factor_to_reproduce_relic_fraction,
                    "Casimir_DP_H_scattering_rate_ratio_at_fixed_microphysics": f_heavy,
                }
                physical_rows["physical_normalization_at_m_phi_1e-17_eV"] = {
                    "field_amplitude_scale_GeV": field_scale,
                    "source_initial_displacement_GeV": source_row["initial_source_to_phi_amplitude_ratio"]*field_scale,
                    "source_mass_eV": source_row["source_mass_ratio_M_over_m"]*M_PHI_EV,
                    "trilinear_mu_GeV": source_row["dimensionless_trilinear_mu_F_over_m2"]*M_PHI_GEV**2/field_scale,
                    "phi_quartic_lambda_dimensionless": source_row["dimensionless_stabilizing_phi_quartic_lambda_F2_over_m2"]*M_PHI_GEV**2/field_scale**2,
                }
            rows.append({
                "source_mass_ratio_M_over_m": source_row["source_mass_ratio_M_over_m"],
                "late_window_phi_charge_span_below_one_percent": source_row[
                    "late_window_phi_charge_span_below_one_percent"
                ],
                "late_window_phi_charge_fractional_span": source_row[
                    "late_window_phi_charge_fractional_span"
                ],
                "phi_fraction": physical_rows,
            })

    return {
        "classification": "autonomous coupled homogeneous two-scalar toy with explicit trilinear U(1)-breaking source and stabilizing quartic; conditional multicomponent abundance screen",
        "potential_and_dynamics": {
            "dimensionless_fields": "X=x/F, Y=y/F, Z=S/F; u=m_phi*t; H/m_phi=1/(2u)",
            "potential": "V=0.5*m^2*(x^2+y^2)+0.5*M^2*S^2+mu*S*x*y+lambda_phi*(x^2+y^2)^2/4",
            "dimensionless_potential": "V/(m^2 F^2)=0.5*(X^2+Y^2)+0.5*r^2*Z^2+beta*Z*X*Y+lambda_hat*(X^2+Y^2)^2/4",
            "coupled_equations": "X''+3H/m X'+X+beta*Z*Y+lambda_hat*(X^2+Y^2)X=0; Y analogous; Z''+3H/m Z'+r^2*Z+beta*X*Y=0",
            "initial_conditions": "X=1,Y=0,Z=g_target^(1/4)/r and all dimensionless velocities zero at u=0.001",
            "parameter_selection": "g_target=0.615 from prior epsilon=0.5 pulse fit; choose source energy fraction R_S and backreaction B equally at sqrt(g_target); lambda_hat=1.01*beta^2/(2r^2), just above the boundedness threshold",
            "fitted_or_retuned_after_integration": False,
        },
        "fixed_inputs": {
            "m_phi_eV": M_PHI_EV,
            "g_target": G_TARGET,
            "source_mass_ratios_M_over_m": list(SOURCE_MASS_RATIOS),
            "phi_fraction_grid": list(PHI_FRACTIONS),
            "quartic_margin_over_boundedness_threshold": QUARTIC_MARGIN,
            "initial_time_u": U_INITIAL,
            "final_time_u": U_FINAL,
            "targeted_long_run_final_time_u": LONG_RUN_FINAL,
            "Planck_Omega_DM_h2_normalization": OMEGA_DM_H2,
            "IDM_profile_Omega_H_h2": OMEGA_H_PROFILE_H2,
        },
        "source_mass_ratio_screens": source_rows,
        "targeted_long_run_checks_for_slow_or_unsettled_ratios": targeted_long_run_checks,
        "multicomponent_cosmology_and_observable_scalings": rows,
        "falsification_and_validity": [
            "Reject any mass ratio whose sampled mass matrix becomes non-positive. The real S*x*y term explicitly breaks the phi U(1), so its late charge-to-energy ratio is not an exact conserved Noether charge; compare multiple u_final values and report source-driven drift.",
            "The within-window span of the comoving phi charge is only a local drift diagnostic and is not proof of asymptotic conservation.",
            "The source is stable in this model. Its residual oscillation is an additional cold component, not an energy sink; include it in closure rather than renormalizing it away.",
            "The phi quartic is near the boundedness threshold and its dimensionless strength at the cosmological field amplitude is substantial; it invalidates importing the free-field boson-star mass-radius curve without solving the coupled star equations.",
            "The initial source displacement is unexplained; no thermal phase transition, inflationary initial-condition model, decay, or production mechanism is specified.",
            "The model is homogeneous. It does not establish charge-seeded fragmentation, a stable two-field boson star, a local Galactic decomposition, or a gamma/xenon/Casimir-DP detection prediction.",
            "Observable scaling assumes phi and source are absent from the xenon H-scattering channel, the heavy component co-traces locally, and detector/annihilation spectra retain their reference shapes.",
            "All effects of changing the IDM relic fraction on coupled microscopic parameters are omitted; the thermal cross-section scaling is a first-order inverse-abundance estimate only.",
        ],
        "next_tests": [
            "Check late-time phi charge-to-energy ratio and component-action stabilization with increasing u_final for each mass ratio, and scan initial source phase/displacement without retuning to the target ratio.",
            "Derive the source displacement from a concrete thermal or inflationary mechanism and include the source's own perturbations.",
            "Solve the coupled two-field boson-star equilibrium and stability problem using this same potential before using any imaging or population limits.",
        ],
    }


def main() -> None:
    result = screen()
    rows = result["source_mass_ratio_screens"]
    for row in rows:
        assert row["initial_source_energy_fraction_relative_to_phi"] > 0
        assert row["source_backreaction_scale"] > 0
        assert row["min_mass_eigenvalue_over_m2_on_sampled_history"] > 0
    output = Path(__file__).with_suffix(".json")
    output.write_text(json.dumps(result, indent=2, allow_nan=False) + "\n", encoding="utf-8")
    print(json.dumps({
        "source_mass_ratio_screens": rows,
        "targeted_long_run_checks": result["targeted_long_run_checks_for_slow_or_unsettled_ratios"],
    }, indent=2))


if __name__ == "__main__":
    main()

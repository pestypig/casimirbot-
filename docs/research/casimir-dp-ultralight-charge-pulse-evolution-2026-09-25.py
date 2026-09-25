"""Finite symmetry-breaking pulse evolution in a radiation-dominated universe.

Toy model: a homogeneous complex scalar receives a Gaussian, temporary
real-imaginary mass mixing near 3H=m_phi. U(1) is restored after the pulse.
This is not a UV completion, perturbation calculation, or star-formation model.
Requires NumPy and SciPy.
"""
from __future__ import annotations

import json
import math
from pathlib import Path

import numpy as np
from scipy.integrate import solve_ivp
from scipy.optimize import brentq

M_PHI_EV = 1.0e-17
HBAR_EV_S = 6.582119569e-16
U_INITIAL = 1.0e-3
U_PULSE_CENTER = 1.5  # 3H/m=1 when H/m=1/(2u)
U_FINAL = 30.0
SIGMA_GRID = (0.1, 0.2, 0.3)
TARGET_EPSILON_GRID = (0.1, 0.5, 0.9)
G_MAX = 0.999  # positive-definite mass matrix: |g|<1


def integrate(
    g0: float,
    sigma: float,
    sample: bool = False,
    initial_state: tuple[float, float, float, float] = (1.0, 0.0, 0.0, 0.0),
) -> dict[str, object]:
    """Evolve dimensionless x,y and derivatives with u=m_phi*t."""
    def rhs(u: float, state: np.ndarray) -> tuple[float, float, float, float]:
        x, y, dx, dy = state
        g = g0 * math.exp(-0.5 * ((u - U_PULSE_CENTER) / sigma) ** 2)
        friction = 1.5 / u  # 3H/m for radiation domination H=1/(2t)
        return dx, dy, -friction * dx - x - g * y, -friction * dy - y - g * x

    result = solve_ivp(
        rhs,
        (U_INITIAL, U_FINAL),
        initial_state,
        method="DOP853",
        rtol=2.0e-9,
        atol=2.0e-11,
        max_step=0.12,
        dense_output=True,
    )
    if not result.success or result.sol is None:
        raise RuntimeError(f"integration failed: {result.message}")

    # Average a^3*rho over the final oscillation; a^3 is proportional to u^(3/2).
    u_window = np.linspace(U_FINAL - 2.0 * math.pi, U_FINAL, 801)
    x, y, dx, dy = result.sol(u_window)
    energy_density = 0.5 * (x*x + y*y + dx*dx + dy*dy)
    comoving_energy = u_window**1.5 * energy_density
    energy_action = float(np.mean(comoving_energy))
    energy_window_cv = float(np.std(comoving_energy) / energy_action)

    # U(1) charge per unit m is x*dy-y*dx; a^3 times this is conserved
    # once g has returned to zero. Sample well outside the pulse.
    u_check = np.array((6.0, 12.0, 20.0, U_FINAL))
    xq, yq, dxq, dyq = result.sol(u_check)
    q_comoving = u_check**1.5 * (xq * dyq - yq * dxq)
    q_mean = float(np.mean(q_comoving))
    q_spread = float((np.max(q_comoving) - np.min(q_comoving)) / max(abs(q_mean), 1e-300))
    signed_epsilon = q_mean / energy_action

    out: dict[str, object] = {
        "g0_peak": g0,
        "sigma_in_u_units": sigma,
        "pulse_fwhm_in_u_units": 2.0 * math.sqrt(2.0 * math.log(2.0)) * sigma,
        "mass_matrix_min_eigenvalue_over_m2": 1.0 - abs(g0),
        "epsilon_signed_late_time": signed_epsilon,
        "epsilon_absolute_late_time": abs(signed_epsilon),
        "comoving_energy_action_for_initial_x0_1": energy_action,
        "energy_window_coefficient_of_variation": energy_window_cv,
        "post_pulse_comoving_charge_relative_spread": q_spread,
    }
    if sample:
        out["solver_function_evaluations"] = result.nfev
    return out


def main() -> None:
    reference = integrate(0.0, SIGMA_GRID[0])
    reference_energy = float(reference["comoving_energy_action_for_initial_x0_1"])
    reference["unbroken_reference_energy_action_for_initial_x0_1"] = reference_energy

    profiles = []
    for sigma in SIGMA_GRID:
        max_case = integrate(G_MAX, sigma)
        max_epsilon = float(max_case["epsilon_absolute_late_time"])
        targets = []
        for target in TARGET_EPSILON_GRID:
            if max_epsilon < target:
                targets.append({
                    "target_epsilon_absolute": target,
                    "reachable_with_positive_definite_g0_lt_1": False,
                    "max_epsilon_at_g0_0p999": max_epsilon,
                })
                continue
            g0 = brentq(
                lambda value: float(integrate(value, sigma)["epsilon_absolute_late_time"]) - target,
                0.0,
                G_MAX,
                xtol=1.0e-7,
                rtol=1.0e-9,
            )
            diag = integrate(g0, sigma, sample=True)
            e_rel = float(diag["comoving_energy_action_for_initial_x0_1"]) / reference_energy
            diag["target_epsilon_absolute"] = target
            diag["reachable_with_positive_definite_g0_lt_1"] = True
            diag["unbroken_reference_energy_action_for_initial_x0_1"] = reference_energy
            diag["energy_action_ratio_to_no_pulse"] = e_rel
            diag["initial_x_amplitude_factor_to_restore_same_final_phi_abundance"] = 1.0 / math.sqrt(e_rel)
            # For a real source S with delta_V=mu*S*x*y, g0=mu*S0/m_phi^2.
            # At characteristic envelopes F_phi and S0, the quadratic source
            # energy fraction R_S and source backreaction scale B obey R_S*B=g0.
            g0 = float(diag["g0_peak"])
            diag["source_embedding_tradeoff_for_deltaV_muSxy"] = {
                "product_source_energy_fraction_times_backreaction_scale": g0,
                "minimum_possible_max_of_these_two_scales": math.sqrt(g0),
                "backreaction_scale_if_source_energy_fraction_is_0p01": g0 / 0.01,
                "source_energy_fraction_if_backreaction_scale_is_0p1": g0 / 0.1,
                "definitions": {
                    "source_energy_fraction": "R_S=M_S^2*S0^2/(m_phi^2*F_phi^2)",
                    "backreaction_scale": "B=abs(mu)*F_phi^2/(M_S^2*abs(S0))",
                    "pulse_amplitude": "g0=abs(mu)*abs(S0)/m_phi^2",
                },
            }
            diag["pulse_fwhm_seconds_at_m_phi_1e-17_eV"] = (
                float(diag["pulse_fwhm_in_u_units"]) * HBAR_EV_S / M_PHI_EV
            )
            targets.append(diag)
        profiles.append({
            "sigma_in_u_units": sigma,
            "pulse_fwhm_seconds_at_m_phi_1e-17_eV": (
                2.0 * math.sqrt(2.0 * math.log(2.0)) * sigma * HBAR_EV_S / M_PHI_EV
            ),
            "max_epsilon_at_g0_0p999": max_epsilon,
            "mass_matrix_min_eigenvalue_over_m2_at_g0_0p999": 1.0 - G_MAX,
            "target_fits": targets,
        })

    payload = {
        "classification": "numerical homogeneous-field toy in radiation domination with one Gaussian temporary quadratic U(1)-breaking pulse; not a UV completion or population model",
        "equations": {
            "dimensionless_time": "u=m_phi*t, natural units",
            "background": "H/m_phi=1/(2u); pulse centered at u=1.5 where 3H=m_phi",
            "field": "phi=(x+i*y)/sqrt(2)",
            "potential": "V=m_phi^2*(x^2+y^2)/2 + g(u)*m_phi^2*x*y",
            "pulse_profile": "g(u)=g0*exp(-(u-1.5)^2/(2*sigma^2)); g=0 after pulse",
            "equations_of_motion": "x''+(3H/m)x'+x+g*y=0; y''+(3H/m)y'+y+g*x=0",
            "initial_state": "x=1,y=0,x'=y'=0 at u=0.001; amplitude scale cancels from epsilon",
            "late_epsilon": "|a^3*(x*y'-y*x')| / <a^3*rho>/m_phi, averaged over the final oscillation",
            "mass_stability": "the instantaneous eigenvalues are m_phi^2*(1+/-g); require |g0|<1",
            "possible_source_embedding_for_budget_only": "a real field S with delta_V=mu*S*x*y; its own dynamics do not generate the prescribed Gaussian",
            "source_tradeoff": "for quadratic S and phi energy scales, R_S*B=|mu*S0|/m_phi^2=g0, where B is the characteristic S backreaction scale",
        },
        "inputs": {
            "m_phi_eV": M_PHI_EV,
            "hbar_eV_seconds": HBAR_EV_S,
            "u_initial": U_INITIAL,
            "u_pulse_center": U_PULSE_CENTER,
            "u_final": U_FINAL,
            "sigma_grid": list(SIGMA_GRID),
            "target_epsilon_grid": list(TARGET_EPSILON_GRID),
            "g0_stability_ceiling_used": G_MAX,
            "integrator": "SciPy solve_ivp DOP853; rtol=2e-9, atol=2e-11, max_step=0.12",
        },
        "unbroken_reference_energy_action_for_initial_x0_1": reference_energy,
        "profiles": profiles,
        "validity_limits": [
            "This is a toy time-dependent U(1)-breaking mass mixing with a prescribed Gaussian profile; no field in a UV theory generates the pulse.",
            "Radiation domination and H=1/(2t) are assumed; changes in relativistic degrees of freedom and the detailed thermal history are not modeled.",
            "The calculation is homogeneous and linear; it omits perturbations, nonlinear fragmentation, self-interaction, and star formation.",
            "The S-source energy/backreaction relation is an envelope-level algebraic diagnostic. The source field is not dynamically evolved, and quartics needed to stabilize a complete trilinear potential are not modeled.",
            "The late comoving energy is an oscillation-window average; its window variation is reported. Charge conservation is checked after the pulse by comoving-charge spread.",
            "Matching the final phi abundance is an amplitude rescaling, not a coupled H/phi relic calculation. No xenon, gamma-ray, or Casimir-DP observable is calculated.",
        ],
        "falsification_tests": [
            "Reject a fitted pulse if |g0|>=1 under the positive-definite mass-matrix assumption.",
            "Do not approximate a dynamical S source as prescribed if both its energy fraction and the defined backreaction scale are claimed negligible while their product must equal the fitted g0.",
            "Reject a claimed post-pulse conserved-charge solution if the reported comoving charge spread fails numerical convergence checks.",
            "Do not accept a full dark-sector model until it derives this time profile and passes perturbation, fragmentation, star-stability, local-population, and detector calculations.",
        ],
    }
    output = Path(__file__).with_suffix(".json")
    output.write_text(json.dumps(payload, indent=2, allow_nan=False) + "\n", encoding="utf-8")
    print(json.dumps({
        "reference_energy_action": reference_energy,
        "profiles": profiles,
    }, indent=2))

    # Representative numerical/invariant checks for this frozen toy setup.
    by_sigma = {profile["sigma_in_u_units"]: profile for profile in profiles}
    assert by_sigma[0.1]["max_epsilon_at_g0_0p999"] < 0.5
    assert by_sigma[0.2]["max_epsilon_at_g0_0p999"] > 0.5
    assert by_sigma[0.3]["max_epsilon_at_g0_0p999"] > 0.9
    for profile in profiles:
        for fit in profile["target_fits"]:
            if fit["reachable_with_positive_definite_g0_lt_1"]:
                assert fit["mass_matrix_min_eigenvalue_over_m2"] > 0.0
                assert fit["post_pulse_comoving_charge_relative_spread"] < 1e-7
                assert fit["energy_window_coefficient_of_variation"] < 0.08


if __name__ == "__main__":
    main()

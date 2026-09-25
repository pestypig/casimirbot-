"""Impulse-limit screen for a temporary U(1)-breaking complex-scalar mass mixing.

This is a deliberately narrow toy mechanism, not a UV completion or a
cosmological production model. It asks how much charge a stable, short
quadratic mixing pulse can create from a real homogeneous field at rest.
"""
from __future__ import annotations

import json
import math
from pathlib import Path

M_PHI_EV = 1.0e-17
TAU_GRID = (0.001, 0.01, 0.03, 0.1)
TARGET_EPSILONS = (0.01, 0.1, 0.5, 0.9, 1.0)


def small_branch_r(epsilon: float) -> float:
    """Solve epsilon=2r/(1+r^2), choosing 0<=r<=1 stably."""
    if not 0.0 <= epsilon <= 1.0:
        raise ValueError("epsilon must lie in [0,1]")
    if epsilon == 0.0:
        return 0.0
    if epsilon == 1.0:
        return 1.0
    return epsilon / (1.0 + math.sqrt(1.0 - epsilon * epsilon))


def main() -> None:
    # V = (m^2/2)(x^2+y^2) + mu_xy^2*x*y has eigenvalues
    # m^2 +/- |mu_xy^2|, so positive definiteness bounds |mu_xy^2| < m^2.
    rows = []
    for tau in TAU_GRID:
        r_max = tau  # impulse limit: |delta ydot|/(m|x|) <= m*Delta_t = tau
        epsilon_supremum = 2.0 * r_max / (1.0 + r_max * r_max)
        rows.append({
            "pulse_duration_tau_m_Delta_t": tau,
            "max_velocity_ratio_r_in_impulse_limit": r_max,
            "epsilon_supremum_from_stable_mass_mixing": epsilon_supremum,
            "strictly_below_supremum_for_positive_definite_pulse": True,
            "expansion_fraction_H_Delta_t_at_3H_eq_m": tau / 3.0,
            "oscillator_phase_m_Delta_t": tau,
        })

    targets = []
    for epsilon in TARGET_EPSILONS:
        r = small_branch_r(epsilon)
        targets.append({
            "target_net_charge_asymmetry": epsilon,
            "minimum_r_on_small_branch": r,
            "tau_required_if_impulse_relation_extrapolated": r,
            "within_declared_impulse_domain_tau_le_0p1": r <= 0.1,
            "initial_real_amplitude_over_final_energy_equivalent_amplitude":
                1.0 / math.sqrt(1.0 + r*r),
            "fraction_of_final_energy_injected_as_y_kinetic_energy":
                r*r / (1.0 + r*r),
        })

    result = {
        "classification": "conditional impulse-limit screen for one temporary off-diagonal mass-mixing toy; not a general charge-generation bound",
        "model": {
            "base_potential": "V0 = m_phi^2*(x^2+y^2)/2",
            "temporary_breaking_term": "delta_V = mu_xy^2(t)*x*y",
            "field_definition": "phi=(x+i*y)/sqrt(2)",
            "initial_state": "homogeneous real-field turning point x=X, y=0, xdot=ydot=0",
            "pulse": "duration Delta_t with m_phi*Delta_t=tau << 1, then exact U(1)_phi restored",
            "mass_matrix_eigenvalues_during_pulse": "m_phi^2 +/- abs(mu_xy^2); positive definiteness requires abs(mu_xy^2)<m_phi^2",
            "impulse_limit": "r=abs(delta_ydot)/(m_phi*abs(X)) <= tau; epsilon=2r/(1+r^2)",
        },
        "inputs": {
            "m_phi_eV": M_PHI_EV,
            "short_pulse_tau_grid": list(TAU_GRID),
            "target_epsilon_grid": list(TARGET_EPSILONS),
            "declared_impulse_domain_tau_max": 0.1,
        },
        "rows": rows,
        "target_requirements": targets,
        "validity_limits": [
            "The impulse result neglects x evolution during the pulse; it is controlled only for tau much less than one and H*Delta_t much less than one.",
            "At radiation-era onset 3H=m_phi, H*Delta_t=tau/3; tau=0.1 is a conservative short-pulse boundary, not a universal error guarantee.",
            "For tau approaching unity, the impulse estimate cannot establish the actual generated epsilon; solve the coupled expanding-background equations with the explicit time profile.",
            "This toy does not specify what UV dynamics generates mu_xy^2(t), whether the pulse occurs at the assumed epoch, the primordial perturbations, or nonlinear fragmentation.",
            "The stable-mass-mixing bound applies only to equal diagonal masses with this off-diagonal quadratic pulse. Tachyonic intervals, unequal masses, higher-dimensional torques, or other mechanisms require a separate analysis.",
            "Generating net charge is not equivalent to forming stable boson stars; the stable charge-mass curve and Galactic mass function remain required.",
        ],
        "falsification_tests": [
            "Reject a claim that this stable short pulse produces epsilon>=0.5 within tau<=0.1; its impulse-limit supremum is below 0.198.",
            "For any target outside the impulse domain, integrate the stated field equations through the full pulse and verify post-pulse energy and comoving charge conservation before inferring epsilon.",
            "Reject the mechanism as a shared-model bridge if its full production and fragmentation history cannot reach the required cold fraction and charge while respecting the common cosmology.",
        ],
    }
    out = Path(__file__).with_suffix(".json")
    out.write_text(json.dumps(result, indent=2, allow_nan=False) + "\n", encoding="utf-8")
    print(json.dumps({
        "short_pulse_epsilon_suprema": [
            [row["pulse_duration_tau_m_Delta_t"], row["epsilon_supremum_from_stable_mass_mixing"]]
            for row in rows
        ],
        "target_requirements": targets,
    }, indent=2))

    assert all(row["epsilon_supremum_from_stable_mass_mixing"] < 0.2 for row in rows)
    assert targets[2]["within_declared_impulse_domain_tau_le_0p1"] is False
    assert abs(targets[1]["minimum_r_on_small_branch"] - 0.0501256289) < 1e-9


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Joint charge-budget and localization screen for a charged mediator star.

This is an analytic asymptotic screen, not a cosmological evolution or a
coupled Einstein-Klein-Gordon solution. It assumes two complex scalar fields
with q_S=-2 q_phi, a phase-locked interaction S Phi^2 + h.c., a weakly bound
phi mode omega_phi/m_phi=q, and nonrelativistic charge carriers outside the
strong-field core.
"""

from __future__ import annotations

import json
import math
from pathlib import Path


Q_VALUES = (0.90, 0.99, 0.999)
MASS_RATIOS = (0.5, 1.0, 1.5, 2.0, 2.1, 3.0, 5.0)


def branch_row(r: float, q: float) -> dict[str, float | bool | str | None]:
    threshold = 2.0 * q
    localized = r > threshold
    if localized:
        kappa_over_m_phi = math.sqrt(r * r - threshold * threshold)
        decay_length_over_compton = 1.0 / kappa_over_m_phi
    else:
        kappa_over_m_phi = 0.0
        decay_length_over_compton = None

    # For a zero-total-charge configuration, q_S=-2 q_phi requires half as
    # many S quanta as phi quanta. In the free, nonrelativistic limit their
    # minimum energy ratio is therefore M_S/(2 m_phi).
    return {
        "M_S_over_m_phi": r,
        "omega_phi_over_m_phi": q,
        "localization_threshold_M_S_over_m_phi": threshold,
        "localized_asymptotic_mode": localized,
        "threshold_fractional_margin": r / threshold - 1.0,
        "mediator_inverse_decay_length_over_m_phi": kappa_over_m_phi,
        "mediator_decay_length_over_phi_compton_length": decay_length_over_compton,
        "free_rest_mass_rho_S_over_rho_phi_reference_for_zero_total_charge": r / 2.0,
    }


def calculate() -> dict[str, object]:
    rows = [branch_row(r, q) for r in MASS_RATIOS for q in Q_VALUES]
    return {
        "classification": "charged_mediator_boson_star_charge_budget_and_localization_preflight",
        "model": {
            "fields": "complex Phi and complex S",
            "charges": "q_S=-2*q_phi",
            "interaction": "mu*(S*Phi^2 + conjugate)",
            "stationary_phase_lock": "omega_S + 2*omega_phi = 0 (signed frequencies)",
            "localization_condition": "M_S > 2*abs(omega_phi) in the asymptotically flat linear tail",
        },
        "assumptions": [
            "weak binding, with q=abs(omega_phi)/m_phi supplied as a scan parameter",
            "zero total U(1) charge for the freely propagating, nonrelativistic population budget",
            "free nonrelativistic energy per particle, E_phi/Q_phi ~= m_phi and E_S/abs(Q_S) ~= M_S/2",
            "flat-space asymptotic mediator equation; gravitational redshift and nonlinear core effects omitted",
        ],
        "derived_relations": {
            "zero_charge_number_balance": "N_S=N_phi/2",
            "free_population_rest_mass_reference": "rho_S/rho_phi = M_S/(2*m_phi) = r/2 if the compensating charge is stored in free nonrelativistic S quanta",
            "asymptotic_inverse_length": "kappa_S=sqrt(M_S^2-4*omega_phi^2)",
            "important_interpretation": "this is not a lower bound on the mediator stress-energy fraction inside a bound star; its charge and energy partition must be computed from the coupled solution",
        },
        "scan": rows,
        "limits": [
            "This is not a solution of the coupled Einstein-Klein-Gordon equations and does not establish existence or stability of a star.",
            "At r close to 2q, the mediator tail becomes extended; a compact one-field profile is not a controlled approximation.",
            "The charge-energy floor ignores binding, interactions, and spatially separated charge reservoirs; it is an asymptotic bookkeeping test only.",
            "The early-universe total charge, production mechanism, and charge partition must be specified independently.",
            "The two-field boson-star literature establishes precedent for interacting complex fields in other potentials, not for this specific S*Phi^2 interaction.",
        ],
    }


def main() -> None:
    result = calculate()
    scan = result["scan"]
    assert isinstance(scan, list)
    by_point = {(row["M_S_over_m_phi"], row["omega_phi_over_m_phi"]): row for row in scan}
    assert not by_point[(1.0, 0.99)]["localized_asymptotic_mode"]
    assert by_point[(2.0, 0.99)]["localized_asymptotic_mode"]
    assert by_point[(2.0, 0.99)]["free_rest_mass_rho_S_over_rho_phi_reference_for_zero_total_charge"] == 1.0
    assert by_point[(2.0, 0.999)]["mediator_decay_length_over_phi_compton_length"] > 10.0
    assert by_point[(5.0, 0.99)]["free_rest_mass_rho_S_over_rho_phi_reference_for_zero_total_charge"] == 2.5
    Path(__file__).with_suffix(".json").write_text(json.dumps(result, indent=2, allow_nan=False) + "\n", encoding="utf-8")
    print(json.dumps(result, indent=2, allow_nan=False))


if __name__ == "__main__":
    main()

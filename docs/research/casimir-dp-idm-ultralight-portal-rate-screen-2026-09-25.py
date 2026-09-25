#!/usr/bin/env python3
"""Conditional rate screen for the IDM--ultralight portal population bridge.

This is a one-point perturbative estimate, not a coupled Boltzmann solver.
It tests whether the naturalness-sized quartic portal can maintain even
chemical contact near the IDM freeze-out scale.
"""

from __future__ import annotations

import json
import math
from pathlib import Path


M_H_GEV = 1080.0
M_PHI_EV = 1.0e-17
GSTAR = 106.75
MPL_GEV = 1.2209e19
FREEZEOUT_X = 20.0
KAPPA_NATURALNESS = 1.4e-56


def calculate() -> dict[str, float | str]:
    temperature_gev = M_H_GEV / FREEZEOUT_X
    # Maxwell-Boltzmann equilibrium density for one real scalar degree of freedom.
    n_eq_gev3 = (M_H_GEV * temperature_gev / (2.0 * math.pi)) ** 1.5 * math.exp(
        -M_H_GEV / temperature_gev
    )
    hubble_gev = 1.66 * math.sqrt(GSTAR) * temperature_gev**2 / MPL_GEV

    # Conservative contact estimate, sigma v = kappa^2/(64 pi m_H^2).
    # Exact channel multiplicities and inert-doublet components can change O(1)
    # factors; they cannot affect the many-orders-of-magnitude conclusion.
    sigma_v_gev2 = KAPPA_NATURALNESS**2 / (64.0 * math.pi * M_H_GEV**2)
    gamma_over_hubble = n_eq_gev3 * sigma_v_gev2 / hubble_gev
    kappa_for_gamma_eq_hubble = math.sqrt(
        hubble_gev * 64.0 * math.pi * M_H_GEV**2 / n_eq_gev3
    )

    m_phi_gev = M_PHI_EV * 1.0e-9
    delta_mphi2_gev2 = (
        KAPPA_NATURALNESS * M_H_GEV**2 / (16.0 * math.pi**2)
    )
    delta_mphi2_over_mphi2 = delta_mphi2_gev2 / m_phi_gev**2
    portal_kappa_for_contact = kappa_for_gamma_eq_hubble
    contact_portal_mass_shift_ratio = (
        portal_kappa_for_contact * M_H_GEV**2
        / (16.0 * math.pi**2 * m_phi_gev**2)
    )

    result: dict[str, float | str] = {
        "screen": "equilibrium_contact_rate_at_x20",
        "M_H_GeV": M_H_GEV,
        "m_phi_eV": M_PHI_EV,
        "freezeout_x": FREEZEOUT_X,
        "T_freezeout_GeV": temperature_gev,
        "g_star": GSTAR,
        "n_H_equilibrium_GeV3": n_eq_gev3,
        "H_radiation_GeV": hubble_gev,
        "kappa_naturalness_ceiling": KAPPA_NATURALNESS,
        "sigma_v_at_kappa_ceiling_GeV_minus2": sigma_v_gev2,
        "Gamma_over_H_at_kappa_ceiling": gamma_over_hubble,
        "kappa_for_Gamma_over_H_equal_one": kappa_for_gamma_eq_hubble,
        "kappa_ceiling_over_kappa_contact": KAPPA_NATURALNESS
        / kappa_for_gamma_eq_hubble,
        "radiative_delta_mphi2_GeV2_at_kappa_ceiling": delta_mphi2_gev2,
        "radiative_delta_mphi2_over_mphi2_at_kappa_ceiling": delta_mphi2_over_mphi2,
        "radiative_delta_mphi2_over_mphi2_at_contact_kappa": contact_portal_mass_shift_ratio,
        "interpretation": (
            "Under the stated no-cancellation threshold-naturalness estimate, "
            "the renormalizable portal is far too weak for freeze-out-era chemical "
            "contact. Raising it to Gamma/H~1 needs a separate mass-protection "
            "completion; thermal daughters are relativistic and do not seed the "
            "cold ultralight boson-star component."
        ),
    }

    assert gamma_over_hubble < 1.0e-100
    assert kappa_for_gamma_eq_hubble < 1.0
    assert delta_mphi2_over_mphi2 < 1.1
    assert contact_portal_mass_shift_ratio > 1.0e40
    return result


def main() -> None:
    result = calculate()
    out = Path(__file__).with_suffix(".json")
    out.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()

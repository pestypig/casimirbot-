#!/usr/bin/env python3
"""Misalignment abundance scale for an ultralight quadratic scalar field."""

import json
import math
from pathlib import Path


M_PHI_EV = 1e-17
OMEGA_DM_H2 = 0.1198
RHO_CRIT_OVER_H2_GEV_CM3 = 1.05375e-5
T_CMB0_EV = 2.348e-4
MPL_REDUCED_GEV = 2.435e18
GSTAR_RHO_OSC = 3.36
GSTAR_S_OSC = 3.91
GSTAR_S_TODAY = 3.91
CM_IN_GEV_INVERSE = 5.067730716e13
FRACTIONS = (0.001, 0.01, 0.1, 0.5, 1.0)


def screen() -> dict[str, object]:
    m_phi_gev = M_PHI_EV * 1e-9
    t_cmb0_gev = T_CMB0_EV * 1e-9
    h_over_t2 = math.pi * math.sqrt(GSTAR_RHO_OSC / 90.0) / MPL_REDUCED_GEV
    # Conventional onset estimate 3H(T_osc) = m_phi.
    t_osc_gev = math.sqrt((m_phi_gev / 3.0) / h_over_t2)
    a_osc = (t_cmb0_gev / t_osc_gev) * (GSTAR_S_TODAY / GSTAR_S_OSC) ** (1.0 / 3.0)
    gev4_per_gev_cm3 = (1.0 / CM_IN_GEV_INVERSE) ** 3
    rho_dm0_gev4 = OMEGA_DM_H2 * RHO_CRIT_OVER_H2_GEV_CM3 * gev4_per_gev_cm3
    rho_phi0_full_gev4 = rho_dm0_gev4
    rho_phi_osc_full_gev4 = rho_phi0_full_gev4 / a_osc**3
    phi_osc_full_gev = math.sqrt(2.0 * rho_phi_osc_full_gev4 / m_phi_gev**2)
    fractions = []
    for f_phi in FRACTIONS:
        fractions.append({
            "global_phi_fraction": f_phi,
            "global_heavy_fraction_if_two_components_only": 1.0 - f_phi,
            "phi_initial_canonical_real_amplitude_GeV": phi_osc_full_gev * math.sqrt(f_phi),
            "naive_LZ_rate_scaling_if_local_heavy_fraction_tracks_global": 1.0 - f_phi,
        })
    return {
        "model": "quadratic, canonical, homogeneous real-component misalignment; no self-interaction or star-formation calculation",
        "inputs": {
            "m_phi_eV": M_PHI_EV,
            "omega_dm_h2": OMEGA_DM_H2,
            "reduced_planck_mass_GeV": MPL_REDUCED_GEV,
            "T_CMB0_eV": T_CMB0_EV,
            "gstar_rho_at_oscillation": GSTAR_RHO_OSC,
            "gstar_s_at_oscillation": GSTAR_S_OSC,
            "gstar_s_today": GSTAR_S_TODAY,
            "oscillation_condition": "3 H(T_osc) = m_phi",
        },
        "derived": {
            "T_osc_keV": t_osc_gev * 1e6,
            "a_osc_over_a_today": a_osc,
            "canonical_real_amplitude_for_full_DM_GeV": phi_osc_full_gev,
            "amplitude_over_reduced_planck_mass": phi_osc_full_gev / MPL_REDUCED_GEV,
        },
        "fractions": fractions,
        "limitations": [
            "The amplitude matches a homogeneous harmonic-field abundance only; it does not establish gravitational condensation into boson stars.",
            "A charged complex boson-star solution requires a specified U(1) charge/asymmetry; this zero-charge real-component estimate does not supply one.",
            "Local heavy-particle fraction need not equal global fraction if the fields cluster differently.",
            "Portal conversion products are treated separately in the IDM thermal momentum screen.",
        ],
    }


def main() -> None:
    result = screen()
    out = Path(__file__).with_suffix(".json")
    out.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()

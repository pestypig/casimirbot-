"""Charge and object-number budget for a two-component ultralight+IDM scenario.

The field calculation is a homogeneous, quadratic complex scalar at 3H=m.
The object-count arithmetic is an explicitly illustrative Milky Way mass
budget. Neither calculates fragmentation, a boson-star mass function, or a
local Galactic decomposition.
"""
from __future__ import annotations

import json
import math
from pathlib import Path


M_PHI_EV = 1.0e-17
OMEGA_DM_H2 = 0.1198
OMEGA_DM_H2_SIGMA = 0.0012
RHO_CRIT_OVER_H2_GEV_CM3 = 1.05375e-5
T_CMB0_EV = 2.348e-4
MPL_REDUCED_GEV = 2.435e18
GSTAR_RHO_OSC = 3.36
GSTAR_S_OSC = 3.91
GSTAR_S_TODAY = 3.91
S0_CM3 = 2891.2  # present entropy density in units with k_B=1; PDG value
CM_IN_GEV_INVERSE = 5.067730716e13
MSUN_GEV = 1.115449865e57
MHALO_MW_MSUN = 1.0e12  # normalization scenario, not a posterior measurement
M_SGRA_REFERENCE_MSUN = 4.02e6  # imaging-paper source scale, not a star identification
M_KAUP_MAX_MSUN = 8.458760485e6  # prior free-field scaling screen at this m_phi
PHI_FRACTIONS = (0.01, 0.10, 0.50, 1.0)
CHARGE_ASYMMETRIES = (-1.0, -0.5, 0.0, 0.5, 1.0)


def background() -> dict[str, float]:
    m_gev = M_PHI_EV * 1e-9
    t0_gev = T_CMB0_EV * 1e-9
    h_over_t2 = math.pi * math.sqrt(GSTAR_RHO_OSC / 90.0) / MPL_REDUCED_GEV
    t_osc_gev = math.sqrt((m_gev / 3.0) / h_over_t2)
    a_osc = (t0_gev / t_osc_gev) * (GSTAR_S_TODAY / GSTAR_S_OSC) ** (1.0 / 3.0)
    rho_dm0_gev_cm3 = OMEGA_DM_H2 * RHO_CRIT_OVER_H2_GEV_CM3
    rho_osc_gev4 = rho_dm0_gev_cm3 * (1.0 / CM_IN_GEV_INVERSE) ** 3 / a_osc**3
    phi_real_amplitude_full_gev = math.sqrt(2.0 * rho_osc_gev4 / m_gev**2)
    return {
        "m_phi_GeV": m_gev,
        "T_osc_keV": t_osc_gev * 1e6,
        "a_osc": a_osc,
        "rho_DM0_GeV_cm3": rho_dm0_gev_cm3,
        "real_oscillation_amplitude_for_all_DM_GeV": phi_real_amplitude_full_gev,
    }


def complex_ellipse(amplitude_sum_sq: float, asymmetry: float) -> tuple[float, float]:
    """Semiaxes for Phi=(A cos(mt)+i B sin(mt))/sqrt(2).

    The canonical real-component amplitudes A,B obey epsilon=2AB/(A^2+B^2).
    The sign of epsilon is represented by the sign of B.
    """
    discriminant = math.sqrt(max(0.0, 1.0 - asymmetry * asymmetry))
    a = math.sqrt(amplitude_sum_sq * (1.0 + discriminant) / 2.0)
    b = math.copysign(math.sqrt(amplitude_sum_sq * (1.0 - discriminant) / 2.0), asymmetry)
    return a, b


def main() -> None:
    bg = background()
    m_phi_gev = bg["m_phi_GeV"]
    rho_dm0 = bg["rho_DM0_GeV_cm3"]
    amplitude_full = bg["real_oscillation_amplitude_for_all_DM_GeV"]
    halo_gev = MHALO_MW_MSUN * MSUN_GEV
    star_reference_gev = M_SGRA_REFERENCE_MSUN * MSUN_GEV
    kaup_max_gev = M_KAUP_MAX_MSUN * MSUN_GEV
    rows = []
    for f_phi in PHI_FRACTIONS:
        amp_sum_sq = (amplitude_full * math.sqrt(f_phi)) ** 2
        asymmetry_rows = []
        for epsilon in CHARGE_ASYMMETRIES:
            a, b = complex_ellipse(amp_sum_sq, epsilon)
            # Oscillation-averaged energy density: 1/2 m^2 (A^2+B^2).
            rho_osc_reconstructed = 0.5 * m_phi_gev**2 * (a*a + b*b)
            rho_osc_expected = (rho_dm0 * f_phi) * (1.0 / CM_IN_GEV_INVERSE)**3 / bg["a_osc"]**3
            actual_asymmetry = 2.0 * a * b / (a*a + b*b) if a*a + b*b else 0.0
            rho_phi0 = rho_dm0 * f_phi
            nq_cm3 = epsilon * rho_phi0 / m_phi_gev
            asymmetry_rows.append({
                "epsilon_net_U1_charge_to_energy": epsilon,
                "real_component_amplitude_A_GeV": a,
                "real_component_amplitude_B_GeV": b,
                "reconstructed_epsilon": actual_asymmetry,
                "net_U1_charge_density_today_per_cm3": nq_cm3,
                "net_U1_charge_yield_nQ_over_s0": nq_cm3 / S0_CM3,
                "net_charge_in_1e12_Msun_halo_in_units_of_reference_star_charge":
                    epsilon * f_phi * halo_gev / star_reference_gev,
                "energy_normalization_relative_error": (rho_osc_reconstructed-rho_osc_expected)/rho_osc_expected,
            })
        number_if_all_in_sgra_mass_stars = f_phi * MHALO_MW_MSUN / M_SGRA_REFERENCE_MSUN
        number_if_all_in_kaup_max_stars = f_phi * MHALO_MW_MSUN / M_KAUP_MAX_MSUN
        rows.append({
            "global_phi_fraction": f_phi,
            "global_H_fraction_if_only_two_components": 1.0 - f_phi,
            "required_Omega_H_h2_for_Planck_central": (1.0-f_phi)*OMEGA_DM_H2,
            "required_H_abundance_ratio_to_published_IDM_profile_for_Planck_1sigma": {
                label: (1.0-f_phi)*omega/0.12014
                for label, omega in (("minus_1sigma", OMEGA_DM_H2-OMEGA_DM_H2_SIGMA),
                                     ("central", OMEGA_DM_H2),
                                     ("plus_1sigma", OMEGA_DM_H2+OMEGA_DM_H2_SIGMA))
            },
            "conditional_LZ_rate_ratio_if_local_components_co_trace": 1.0-f_phi,
            "milky_way_mass_budget_normalized_to_Mhalo_1e12_Msun": {
                "one_SgrA_reference_star_fraction_of_total_halo": M_SGRA_REFERENCE_MSUN/MHALO_MW_MSUN,
                "one_SgrA_reference_star_fraction_of_phi_budget": M_SGRA_REFERENCE_MSUN/(f_phi*MHALO_MW_MSUN),
                "number_if_all_phi_mass_in_4p02e6_Msun_stars": number_if_all_in_sgra_mass_stars,
                "minimum_count_if_all_phi_mass_in_free_field_stars_no_heavier_than_Kaup_limit": number_if_all_in_kaup_max_stars,
            },
            "complex_condensate_charge_scenarios": asymmetry_rows,
        })

    result = {
        "classification": "conditional homogeneous-field charge budget and illustrative object mass budget; not a cosmological formation or Galactic population model",
        "source_references": {
            "IDM_profile_and_relic": "https://arxiv.org/abs/2609.06571",
            "boson_star_charge_and_SgrA_scale": "https://arxiv.org/abs/1809.08682",
            "complex_scalar_U1_charge_review": "https://arxiv.org/abs/1202.5809",
            "present_entropy_density": "https://pdg.lbl.gov/2017/download/rpp-2016-booklet.pdf",
        },
        "inputs": {
            "m_phi_eV": M_PHI_EV,
            "Omega_DM_h2": OMEGA_DM_H2,
            "Omega_DM_h2_sigma": OMEGA_DM_H2_SIGMA,
            "present_entropy_density_cm-3": S0_CM3,
            "IDM_profile_Omega_H_h2": 0.12014,
            "M_MW_halo_normalization_Msun": MHALO_MW_MSUN,
            "M_SgrA_imaging_reference_Msun": M_SGRA_REFERENCE_MSUN,
            "free_field_Kaup_max_at_m_phi_Msun": M_KAUP_MAX_MSUN,
            "phi_fraction_grid": list(PHI_FRACTIONS),
            "net_charge_asymmetry_grid": list(CHARGE_ASYMMETRIES),
            "oscillation_condition": "3 H(T_osc)=m_phi; standard radiation-era harmonic approximation",
        },
        "derived_background": bg,
        "rows": rows,
        "validity_limits": [
            "The homogeneous-field calculation assumes a canonical complex scalar with quadratic potential and negligible self-interaction at oscillation onset. A charged initial orbit is an explicit initial condition, not predicted by the IDM portal.",
            "epsilon is the net conserved U(1) charge divided by the maximum charge compatible with the same nonrelativistic energy density; epsilon=0 is a real-line oscillation and epsilon=+/-1 is circular motion in field space.",
            "A nonzero homogeneous charge is necessary input for a net-charged boson-star population in this scenario, but does not prove fragmentation, capture, stability, or an object mass function.",
            "The Milky Way halo mass is a round normalization scenario. Counts assume all phi mass is in equal-mass stars; the minimum count assumes every star is at the free-field Kaup upper mass. These are mass-budget diagnostics, not predicted populations or observational exclusions.",
            "Cosmic H fraction is not asserted to equal local H fraction. The conditional LZ scaling holds only at fixed local total density, velocity distribution, detector response, and cross section if the components co-trace.",
            "Quartic/self-interacting star solutions can change the Kaup mass cap and must replace this screen with a model-specific stable mass-charge curve.",
        ],
        "falsification_tests": [
            "Any formation model must supply the chosen epsilon and reproduce the required Omega_phi while satisfying the star's charge and mass-radius stability curve.",
            "Reject an all-in-SgrA-mass-star interpretation of an appreciable phi halo fraction if its required object count violates lensing, dynamics, or structure-formation limits once the actual selection functions are applied.",
            "A joint detector prediction must use a predicted local unbound-H fraction, not substitute 1-f_phi from cosmology without a co-clustering calculation.",
        ],
    }
    output = Path(__file__).with_suffix(".json")
    output.write_text(json.dumps(result, indent=2, allow_nan=False) + "\n", encoding="utf-8")
    ten_percent = next(row for row in rows if row["global_phi_fraction"] == 0.1)
    print(json.dumps({
        "T_osc_keV": bg["T_osc_keV"],
        "real_amplitude_full_DM_GeV": bg["real_oscillation_amplitude_for_all_DM_GeV"],
        "ten_percent_phi_star_count_at_sgra_reference_mass": ten_percent["milky_way_mass_budget_normalized_to_Mhalo_1e12_Msun"]["number_if_all_phi_mass_in_4p02e6_Msun_stars"],
        "ten_percent_phi_minimum_count_at_Kaup_max": ten_percent["milky_way_mass_budget_normalized_to_Mhalo_1e12_Msun"]["minimum_count_if_all_phi_mass_in_free_field_stars_no_heavier_than_Kaup_limit"],
        "ten_percent_asymmetries": ten_percent["complex_condensate_charge_scenarios"],
    }, indent=2))


if __name__ == "__main__":
    main()

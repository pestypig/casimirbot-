#!/usr/bin/env python3
"""Conditional observable scaling for separate cold-phi and thermal-IDM production.

This propagates a chosen cosmic phi fraction through simple co-tracing scalings.
It is not a Galactic population model, detector likelihood, gamma-ray fit, or
coupled cosmological solution.
"""

from __future__ import annotations

import json
from pathlib import Path


OMEGA_DM_H2 = 0.1198
OMEGA_DM_H2_SIGMA = 0.0012
OMEGA_H_IDM_BENCHMARK = 0.12014
M_PHI_EV = 1.0e-17
RHO_CRIT_OVER_H2_GEV_CM3 = 1.05375e-5
S0_CM3 = 2891.2
F_PHI_GRID = (0.0, 0.01, 0.05, 0.10, 0.25, 0.50)
MILKY_WAY_DM_MASS_MSUN = 1.0e12
REFERENCE_STAR_MASS_MSUN = 4.02e6
DP_PURE_H_CONDITIONAL_CEILING = 7.0e-19
P10_STAR_ENCOUNTER_AT_FOBJ_0P1 = 3.961288e-18


def make_row(f_phi: float) -> dict[str, object]:
    f_h_cosmic = 1.0 - f_phi
    abundance_ratio = f_h_cosmic * OMEGA_DM_H2 / OMEGA_H_IDM_BENCHMARK
    star_count = f_phi * MILKY_WAY_DM_MASS_MSUN / REFERENCE_STAR_MASS_MSUN
    yq_per_epsilon = (
        f_phi * OMEGA_DM_H2 * RHO_CRIT_OVER_H2_GEV_CM3
        / (M_PHI_EV * 1.0e-9 * S0_CM3)
    )
    return {
        "f_phi_cosmic": f_phi,
        "f_H_cosmic": f_h_cosmic,
        "required_Omega_H_h2_central": f_h_cosmic * OMEGA_DM_H2,
        "required_Omega_H_h2_minus_1sigma": f_h_cosmic * (OMEGA_DM_H2 - OMEGA_DM_H2_SIGMA),
        "required_Omega_H_h2_plus_1sigma": f_h_cosmic * (OMEGA_DM_H2 + OMEGA_DM_H2_SIGMA),
        "required_net_U1_charge_yield_YQ_per_epsilon": yq_per_epsilon,
        "H_abundance_ratio_to_IDM_profile_central": abundance_ratio,
        "conditional_LZ_rate_ratio_if_local_co_tracing_and_fixed_velocity_response": f_h_cosmic,
        "conditional_H_annihilation_flux_ratio_if_J_profile_co_scales": f_h_cosmic**2,
        "H_sigma_v_multiplier_to_hold_same_annihilation_flux_if_J_co_scales": (
            1.0 / f_h_cosmic**2 if f_h_cosmic > 0.0 else None
        ),
        "conditional_Casimir_DP_exponent_ceiling_if_same_H_channel": (
            DP_PURE_H_CONDITIONAL_CEILING * f_h_cosmic
        ),
        "illustrative_identical_4p02e6_Msun_phi_star_count_in_1e12_Msun_halo_if_all_phi_is_compact": star_count,
        "conditional_10y_phi_star_encounter_probability_if_stars_trace_halo": (
            P10_STAR_ENCOUNTER_AT_FOBJ_0P1 * f_phi / 0.10
        ),
    }


def main() -> None:
    rows = [make_row(f_phi) for f_phi in F_PHI_GRID]
    result = {
        "classification": "separate_production_conditional_observable_scaling",
        "model_skeleton": {
            "phi": "cold complex ultralight field, separately produced; may populate boson stars",
            "H": "thermal inert-doublet state with IDM inelastic Xe interaction and number-changing channels",
            "only_shared_constraint": "Omega_phi + Omega_H = Omega_DM; no dynamical conversion assumed",
        },
        "inputs": {
            "Omega_DM_h2_central": OMEGA_DM_H2,
            "Omega_DM_h2_sigma": OMEGA_DM_H2_SIGMA,
            "published_IDM_profile_Omega_H_h2": OMEGA_H_IDM_BENCHMARK,
            "m_phi_eV": M_PHI_EV,
            "present_entropy_density_s0_cm3": S0_CM3,
            "f_phi_grid": list(F_PHI_GRID),
            "illustrative_Milky_Way_DM_mass_Msun": MILKY_WAY_DM_MASS_MSUN,
            "reference_compact_phi_star_mass_Msun": REFERENCE_STAR_MASS_MSUN,
            "pure_H_Casimir_DP_conditional_exponent_ceiling": DP_PURE_H_CONDITIONAL_CEILING,
            "10y_encounter_probability_at_local_compact_fraction_0p1": P10_STAR_ENCOUNTER_AT_FOBJ_0P1,
        },
        "outputs": rows,
        "factorized_forward_model": {
            "LZ_rate_ratio": "f_H_local * eta_H/eta_IDM * detector_response_ratio",
            "annihilation_gamma_flux_ratio": "(rho_H_GC/rho_IDM_GC)^2 * sigma_v_ratio * yield_ratio",
            "Casimir_DP_exponent_ratio": "f_H_local * material_kernel_ratio",
            "boson_star_count": "f_phi_compact * M_MW_DM / mean_star_mass",
        },
        "key_limits": [
            "The table sets local H and Galactic-center H density fractions equal to the cosmic H fraction only for its illustrative co-tracing rows; the physically relevant local and GC fractions are independent model outputs.",
            "The LZ scaling holds the extreme-tail velocity integral and detector response fixed, despite prior evidence that the 248 keV IDM point is strongly halo-tail and response sensitive.",
            "The annihilation scaling holds morphology, particle mass, final-state yield, and cross section fixed. It does not fit the 0.5-0.8 TeV b-bbar excess, the 43.2 GeV cluster line, or the Galactic Center source-count analysis.",
            "The Casimir-DP value is a conditional ceiling from the screened IDM Higgs-elastic channel; the inelastic Z channel is closed on the frozen carbon target. Scaling it cannot make it measurable.",
            "The compact-star count assumes all phi mass is in identical 4.02e6 Msun stars in a 1e12 Msun Milky Way halo. It is not a formation prediction or measured mass function.",
            "The encounter probability reuses the fixed-speed local screen and assumes compact stars trace local total DM; it is not a full velocity-distribution fold.",
        ],
        "required_next_evidence": [
            "A cold complex-phi production and charge-asymmetry model, plus fragmentation and stable-star mass function.",
            "A common Galactic calculation of local unbound H, diffuse phi, compact-star fraction, and Galactic-center density profile.",
            "An integrated H relic calculation with any annihilation into phi radiation and the resulting dark-radiation constraints.",
            "A response-folded LZ likelihood and a material-response calculation for the exact Casimir-DP target.",
        ],
    }
    assert abs(rows[3]["conditional_H_annihilation_flux_ratio_if_J_profile_co_scales"] - 0.81) < 1e-12
    assert abs(rows[3]["conditional_LZ_rate_ratio_if_local_co_tracing_and_fixed_velocity_response"] - 0.90) < 1e-12
    assert abs(rows[3]["required_net_U1_charge_yield_YQ_per_epsilon"] - 4.36632713060321e15) / 4.36632713060321e15 < 1e-12
    assert rows[-1]["conditional_Casimir_DP_exponent_ceiling_if_same_H_channel"] < DP_PURE_H_CONDITIONAL_CEILING
    Path(__file__).with_suffix(".json").write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()

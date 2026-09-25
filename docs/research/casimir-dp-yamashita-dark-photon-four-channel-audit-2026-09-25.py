"""Kinematic and scale audit of the LZ+gamma dark-photon benchmark."""
from __future__ import annotations

import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT = Path(__file__).with_suffix(".json")

M_X_GEV = 420.0
DELTA_KEV = 316.0
M_PHI_GEV = 0.4
M_PHI_PRIME_GEV = 0.4
M_C12_GEV = 12.0 * 0.93149410242
M_XE136_GEV = 136.0 * 0.93149410242
V_ESC_KM_S = 544.0
V_EARTH_KM_S = 220.0
C_KM_S = 299_792.458
M_PLANCK_GEV = 1.22089e19
GEV_C2_TO_KG = 1.782661921e-27
KG_PER_SOLAR_MASS = 1.98847e30
M_SGR_A_REF_SOLAR = 4.02e6


def reduced_mass(m1: float, m2: float) -> float:
    return m1 * m2 / (m1 + m2)


def inelastic_threshold_km_s(m1_gev: float, m2_gev: float, delta_kev: float) -> float:
    mu_gev = reduced_mass(m1_gev, m2_gev)
    return (2.0 * delta_kev * 1.0e-6 / mu_gev) ** 0.5 * C_KM_S


def gap_ceiling_kev(m1_gev: float, m2_gev: float, vmax_km_s: float) -> float:
    mu_gev = reduced_mass(m1_gev, m2_gev)
    return 0.5 * mu_gev * (vmax_km_s / C_KM_S) ** 2 * 1.0e6


def proca_free_max_mass_kg(m_vector_gev: float) -> float:
    # Published maximum for a minimally coupled complex Proca field; this is a
    # scale comparator, not a solution for Yamashita's real dark photon.
    return 1.058 * M_PLANCK_GEV**2 / m_vector_gev * GEV_C2_TO_KG


def main() -> None:
    vmax = V_ESC_KM_S + V_EARTH_KM_S
    xe_thr = inelastic_threshold_km_s(M_X_GEV, M_XE136_GEV, DELTA_KEV)
    carbon_thr = inelastic_threshold_km_s(M_X_GEV, M_C12_GEV, DELTA_KEV)
    vector_mass = proca_free_max_mass_kg(M_X_GEV)
    sgr_mass_kg = M_SGR_A_REF_SOLAR * KG_PER_SOLAR_MASS
    halo_sv = 2.7e-24
    dwarf_sv = 6.5e-26
    freezeout_sv = 1.9e-26
    totani_sv = (5.0e-25, 8.0e-25)

    payload = {
        "classification": "conditional_dark_photon_LZ_gamma_candidate_scale_screen_not_profile_fit",
        "paper": "Yamashita, arXiv:2609.02868v2 (2026-09-03)",
        "inputs": {
            "m_X_GeV": M_X_GEV,
            "delta_keV": DELTA_KEV,
            "m_phi_GeV": M_PHI_GEV,
            "m_phi_prime_GeV": M_PHI_PRIME_GEV,
            "v_esc_km_s": V_ESC_KM_S,
            "v_earth_km_s": V_EARTH_KM_S,
            "sigma_v_halo_cm3_s": halo_sv,
            "sigma_v_dwarf_cm3_s": dwarf_sv,
            "sigma_v_freezeout_cm3_s": freezeout_sv,
            "Totani_bbar_sigma_v_cm3_s_range": list(totani_sv),
        },
        "derived": {
            "vmax_km_s": vmax,
            "Xe136_threshold_km_s": xe_thr,
            "Xe136_delta_ceiling_keV": gap_ceiling_kev(M_X_GEV, M_XE136_GEV, vmax),
            "C12_threshold_km_s": carbon_thr,
            "C12_delta_ceiling_keV": gap_ceiling_kev(M_X_GEV, M_C12_GEV, vmax),
            "carbon_threshold_over_vmax": carbon_thr / vmax,
            "complex_Proca_free_max_mass_kg_scale_only": vector_mass,
            "complex_Proca_free_max_mass_solar_scale_only": vector_mass / KG_PER_SOLAR_MASS,
            "SgrA_reference_over_complex_Proca_scale": sgr_mass_kg / vector_mass,
            "halo_over_dwarf_sigma_v": halo_sv / dwarf_sv,
            "halo_over_freezeout_sigma_v": halo_sv / freezeout_sv,
            "halo_over_Totani_bbar_rate_range": [halo_sv / totani_sv[1], halo_sv / totani_sv[0]],
            "V_lifetime_s": 3.0e-6,
            "universe_age_over_V_lifetime": 4.35e17 / 3.0e-6,
        },
        "source_findings": {
            "LZ_normalization": "about one event in 225-271 keV, normalized phenomenologically; no full local/global profile likelihood",
            "gamma_channel": "420 GeV X X -> W+W- with p-wave freeze-out and Sommerfeld enhancement",
            "extra_symmetry": "paper says a further discrete symmetry is still needed to isolate diagonal and off-diagonal scalar couplings; construction left for future work",
            "V_today": "unstable; paper gives a 3 microsecond lifetime via V -> X gamma",
        },
        "checks": {
            "xenon_threshold_within_paper_vmax": xe_thr <= vmax,
            "carbon_upscatter_closed": carbon_thr > vmax,
            "complex_Proca_scale_far_below_SgrA": sgr_mass_kg / vector_mass > 1.0e20,
            "V_not_surviving_to_present": 4.35e17 / 3.0e-6 > 1.0e20,
            "paper_gamma_rate_exceeds_user_Totani_range": halo_sv > totani_sv[1],
        },
        "limits": [
            "The Proca mass scaling assumes a free, minimally coupled complex vector with conserved charge; it is only a comparator for the paper's parity-stabilized dark photon X.",
            "The LZ rate is a one-event normalization, not an independent collaboration profile-likelihood fit or evidence of detection.",
            "No Casimir-DP material response is calculated; carbon is kinematically closed for the paper's specified X-to-V transition under its own halo support.",
            "No complete field-theory symmetry construction, stellar solution, or local population model is provided by this screen.",
        ],
    }
    assert payload["checks"]["xenon_threshold_within_paper_vmax"]
    assert payload["checks"]["carbon_upscatter_closed"]
    assert payload["checks"]["complex_Proca_scale_far_below_SgrA"]
    assert payload["checks"]["V_not_surviving_to_present"]
    assert payload["checks"]["paper_gamma_rate_exceeds_user_Totani_range"]
    OUT.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(payload, indent=2))


if __name__ == "__main__":
    main()

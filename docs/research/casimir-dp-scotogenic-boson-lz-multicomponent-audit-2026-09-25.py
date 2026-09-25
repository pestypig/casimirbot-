#!/usr/bin/env python3
"""Shared-abundance screen for the published scotogenic scalar LZ benchmark."""
import json
import math
from pathlib import Path

OUT = Path(__file__).with_suffix(".json")
OMEGA_DM = 0.1198
OMEGA_DM_SIGMA = 0.0012
F_PHI_TARGET = 0.10
OMEGA_H_BENCH = 0.11919
M_H_GEV = 1080.0
DELTA_KEV = 369.0
N_WS_BENCH = 2.323
R_OMEGA_BENCH = 2.296
X_F = 25.0
M_PLANCK_GEV = 1.22089e19
GEV_TO_KG = 1.7826619216278976e-27
M_SUN_KG = 1.98847e30
M_C12_GEV = 12.0 * 0.93149410242
C_KM_S = 299_792.458
V_CAP_KM_S = 798.0


def main():
    omega_phi = F_PHI_TARGET * OMEGA_DM
    omega_h_target = OMEGA_DM - omega_phi
    total_fixed_benchmark = OMEGA_H_BENCH + omega_phi
    sigma_units = (total_fixed_benchmark - OMEGA_DM) / OMEGA_DM_SIGMA
    fphi_max_1sigma = (OMEGA_DM + OMEGA_DM_SIGMA - OMEGA_H_BENCH) / OMEGA_DM
    fphi_max_2sigma = (OMEGA_DM + 2.0 * OMEGA_DM_SIGMA - OMEGA_H_BENCH) / OMEGA_DM
    omega_idm_proxy = OMEGA_H_BENCH / R_OMEGA_BENCH
    target_r_omega = omega_h_target / omega_idm_proxy
    n_eff = 2.0 * (math.sqrt(target_r_omega) - 1.0)
    bolltzmann = max(min(n_eff, 1.0), 0.0)
    def gap_for_weight(x_freezeout):
        if not 0 < bolltzmann < 1:
            return 0.0
        # Invert the paper's Maxwell-Boltzmann factor including its
        # (1 + Delta)^(3/2) phase-space term, not just exp(-x Delta).
        lo, hi = 0.0, 1.0
        for _ in range(100):
            delta = (lo + hi) / 2.0
            weight = (1.0 + delta) ** 1.5 * math.exp(-x_freezeout * delta)
            if weight > bolltzmann:
                lo = delta
            else:
                hi = delta
        return (lo + hi) / 2.0 * M_H_GEV

    dm_gap_gev = gap_for_weight(X_F)
    mu_c = M_H_GEV * M_C12_GEV / (M_H_GEV + M_C12_GEV)
    delta_gev = DELTA_KEV * 1e-6
    vthr_c = math.sqrt(2.0 * delta_gev / mu_c) * C_KM_S
    m_kaup_kg = 0.633 * M_PLANCK_GEV**2 / M_H_GEV * GEV_TO_KG
    result = {
        "classification": "published heavy bosonic LZ benchmark overlay; conditional abundance bridge only, not a common four-observable model",
        "source": "https://arxiv.org/html/2609.13038v1",
        "inputs": {
            "Omega_DM_h2": OMEGA_DM,
            "Omega_DM_1sigma": OMEGA_DM_SIGMA,
            "f_phi_target": F_PHI_TARGET,
            "A0866_Omega_etaR_h2": OMEGA_H_BENCH,
            "A0866_m_etaR_GeV": M_H_GEV,
            "A0866_delta_keV": DELTA_KEV,
            "A0866_charged_gap_GeV": 13.96,
            "A0866_n_coannihilating_Majorana_states": 1,
            "A0866_relic_enhancement_over_same_scalar_IDM": R_OMEGA_BENCH,
            "A0866_LZ_working_search_yield_at_vlab_254_km_s": N_WS_BENCH,
            "x_freezeout_for_coannihilator_weight_diagnostic": X_F,
            "carbon_mass_GeV": M_C12_GEV,
            "carbon_speed_cap_km_s": V_CAP_KM_S,
        },
        "toolchain_preflight": {
            "micromegas_version_used_by_paper": "7.1.4",
            "official_source_url": "https://micromegasdm.github.io/downloadarea/v7.1/micromegas_7.1.4.tgz",
            "downloaded_archive_bytes": 22605847,
            "downloaded_archive_sha256_snapshot": "c8cf207b17541a5b7d7e7ff157f1c1eb36e1dd3f7547e7745559b195c2a34264",
            "archive_inspection": "includes IDM and standard models, no Scotogenic model directory; source was inspected, not executed",
            "official_install_page_tested_platforms": ["Linux", "Darwin"],
            "local_build_state_at_audit": "Python 3.13 and CMake present; GCC, GFortran, MSVC, and make absent; Docker client times out waiting for its server; WSL lists only stopped docker-desktop",
            "candidate_model_definition": "https://github.com/restrepo/Scotogenic (SARAH model definition; not the A0866 parameter card or an already generated micrOMEGAs model)",
            "reconstruction_status": "official package is obtainable, but a compatible build runtime and the complete A0866 model inputs are still missing",
        },
        "derived": {
            "Omega_phi_h2_for_10_percent": omega_phi,
            "Omega_etaR_h2_target_for_10_percent": omega_h_target,
            "fixed_A0866_plus_phi_total_Omega_h2": total_fixed_benchmark,
            "fixed_total_excess_in_sigma_units": sigma_units,
            "fixed_A0866_max_fphi_at_1sigma_total_upper_edge": fphi_max_1sigma,
            "fixed_A0866_max_fphi_at_2sigma_total_upper_edge": fphi_max_2sigma,
            "etaR_abundance_reduction_factor_from_A0866_to_target": omega_h_target / OMEGA_H_BENCH,
            "approx_freezeout_rate_multiplier_if_inverse_Omega": OMEGA_H_BENCH / omega_h_target,
            "pure_IDM_abundance_inferred_from_published_rOmega_h2": omega_idm_proxy,
            "target_rOmega_over_pure_IDM": target_r_omega,
            "effective_one_N_Boltzmann_weight_in_degeneracy_toy": bolltzmann,
            "illustrative_N_minus_etaR_gap_GeV_at_x25_with_phase_space": dm_gap_gev,
            "illustrative_N_minus_etaR_gap_GeV_sensitivity_x20_x30": {
                "x20": gap_for_weight(20.0),
                "x25": gap_for_weight(25.0),
                "x30": gap_for_weight(30.0),
            },
            "A0866_LZ_yield_scaled_by_0p9_local_etaR_fraction": N_WS_BENCH * 0.9,
            "fixed_shape_gamma_intensity_ratio_if_gc_fraction_is_0p9": 0.9**2,
            "C12_endothermic_threshold_km_s": vthr_c,
            "free_complex_scalar_Kaup_mass_kg": m_kaup_kg,
            "free_complex_scalar_Kaup_mass_solar": m_kaup_kg / M_SUN_KG,
        },
        "interpretation": [
            "A0866 matches the published IDM high-recoil point in m_etaR and delta but is a scotogenic benchmark, not the IDM profile-likelihood best fit.",
            "Adding a 10% ultralight component to its published thermal abundance overcloses the central standard-cosmology budget by about 9.5 sigma.",
            "The published coannihilation lever spans a factor 2.296 over the corresponding IDM abundance; a single-state degeneracy toy suggests a 4.74-7.31 GeV N-eta gap for x_f=20-30 (5.75 GeV at 25), but this is not a relic calculation.",
            "The arXiv v1 source archive was inspected and contains only main.tex, ref.bib, and two figures; it publishes no benchmark input card, scan samples, or numerical output. Exact A0866 reproduction cannot be reconstructed from the released source alone.",
            "The exact micrOMEGAs 7.1.4 source package used by the paper is publicly downloadable and was inspected; it ships IDM but no Scotogenic model. A public SARAH Scotogenic model definition exists, but is not a numerical parameter card and requires model-generation/build tooling.",
            "The LZ event yield scales linearly with local etaR density only under fixed halo and detector assumptions; 0.9 scaling is not a reprofiled LZ likelihood.",
            "The tree-level inelastic transition is closed on independent C12 at the adopted 798 km/s support. The paper's tiny elastic loop estimate is not a Casimir-DP material response calculation.",
            "The TeV scalar's free Kaup mass is asteroid scale, not Sgr A* scale; a separate ultralight star field is required for that role.",
            "The paper discusses gamma-ray limits but does not supply a benchmark-specific present-day spectrum in its tabulated A0866 row; do not identify it with the supplied 0.5-0.8 TeV b-bbar excess or 43 GeV line.",
            "No common microscopic connector to the ultralight star field or measurable Casimir-DP signal is established.",
        ],
        "limits": [
            "Coannihilator gap estimate uses the paper's approximate Maxwell-Boltzmann population weight with x_f varied from 20 to 30; annihilation/conversion channel rates, flavor Yukawas, exact mass gap, and the micrOMEGAs input card are missing, so the range is only a toy scan target.",
            "The hidden U(1)_X extension's detailed scalar-sector and collider/fixed-target constraints require a complete benchmark beyond the paper's schematic realization.",
            "No compatible compiler/runtime is presently available in this Windows workspace; the installed Docker client did not reach its server, and the only WSL distribution is the stopped docker-desktop system distribution.",
            "Halo-tail and LZ detector-response systematics remain large; the paper reports 55-585 yield suppression for v_lab=239 km/s relative to 254 km/s.",
            "No neutrino-mass fit, flavor constraints, exact gamma likelihood, local component ratio, star solution, or material-response calculation is repeated here.",
        ],
    }
    OUT.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()

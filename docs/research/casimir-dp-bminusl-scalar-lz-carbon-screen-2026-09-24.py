"""Kinematic and free-field structure screen for the B-L split-scalar LZ model.

This is a candidate-neutral, one-vertex target screen. It does not reproduce
the LZ likelihood, solve the scalar potential, or calculate nonperturbative
solid-state response. Standard-library only.
"""

from __future__ import annotations

import json
import hashlib
import math
from pathlib import Path


M_U_GEV = 0.93149410242
M_PLANCK_GEV = 1.22089e19
GEV_C2_KG = 1.7826619216278976e-27
M_SUN_KG = 1.98847e30
KAUP_COEFFICIENT = 0.633
V_CAP_KM_S = 798.0
C_KM_S = 299_792.458
RHO_DM_GEV_CM3 = 0.3
M_XE131_GEV = 131.0 * M_U_GEV
M_C12_GEV = 12.0 * M_U_GEV
M_P_GEV = 0.93827208816
E_XE_KEV = 248.0
SIGMA_P_CM2_BENCHMARK = 1.0e-45
CARBON_ATOMIC_MASS_KG = 12.0 * 1.66053906660e-27
CONFIG_RELATIVE_PATH = Path("configs/research/casimir-dp-integrated-feasibility-pilot-stage4-2r.v1.json")
CONFIG_SHA256 = "5a7c4f26968c5ed800e4b1ef7428aabc94a5bcf14e64599b9779d6f940cd8d11"
M_DM_GEV_GRID = (1_000.0, 2_000.0, 3_000.0, 5_000.0)
SPLITTING_KEV_DIAGNOSTICS = (100.0, 200.0, 300.0)
M_ULTRALIGHT_PHI_GEV = 1.0e-26  # 1e-17 eV


def reduced_mass(m1: float, m2: float) -> float:
    return m1 * m2 / (m1 + m2)


def vmax_xe_splitting(mchi: float) -> float:
    """Largest positive splitting that permits the central Xe recoil at vmax."""
    mu = reduced_mass(mchi, M_XE131_GEV)
    recoil = E_XE_KEV * 1.0e-6
    vmax = V_CAP_KM_S / C_KM_S
    return vmax * math.sqrt(2.0 * M_XE131_GEV * recoil) - M_XE131_GEV * recoil / mu


def vmin_endothermic_km_s(mchi: float, target: float, recoil_kev: float, delta_kev: float) -> float:
    mu = reduced_mass(mchi, target)
    recoil = recoil_kev * 1.0e-6
    delta = delta_kev * 1.0e-6
    vmin = (target * recoil / mu + delta) / math.sqrt(2.0 * target * recoil)
    return vmin * C_KM_S


def kaup_mass_kg(mchi_gev: float) -> float:
    return KAUP_COEFFICIENT * M_PLANCK_GEV**2 / mchi_gev * GEV_C2_KG


def exothermic_carbon_decoherence_upper(
    mchi: float, delta_kev: float, design: dict[str, float]
) -> dict[str, float]:
    """Assume the full local population is excited; independent C, F_C=1, D<=2N."""
    m_c = M_C12_GEV
    mu_c = reduced_mass(mchi, m_c)
    mu_p = reduced_mass(mchi, M_P_GEV)
    sigma_c = SIGMA_P_CM2_BENCHMARK * 12.0**2 * (mu_c / mu_p) ** 2
    vin = V_CAP_KM_S / C_KM_S
    release = delta_kev * 1e-6
    vout = math.sqrt(vin**2 + 2.0 * release / mu_c)
    n_chi = RHO_DM_GEV_CM3 / mchi
    n_c = design["mass_kg"] / CARBON_ATOMIC_MASS_KG
    # Collision rate is set by incident flux. The outgoing speed controls the
    # recoil peak, not how often halo particles enter the target.
    collisions = n_chi * sigma_c * vin * C_KM_S * 1e5 * n_c * design["hold_time_s"]
    d_upper = 2.0 * collisions
    return {
        "m_S_GeV": mchi,
        "delta_keV_release": delta_kev,
        "sigma_p_fP_cm2_assumed_max": SIGMA_P_CM2_BENCHMARK,
        "f_P_local_assumed": 1.0,
        "carbon_peak_keV": (mu_c / m_c) * delta_kev,
        "expected_C_collisions_per_hold": collisions,
        "D_upper": d_upper,
        "fraction_of_registered_one_sigma_D": d_upper / 0.005816,
    }


def portal_naturalness_diagnostic(mheavy: float) -> dict[str, float]:
    """No-cancellation quartic portal scale and indicative freezeout rate ratio."""
    kappa = 16.0 * math.pi**2 * M_ULTRALIGHT_PHI_GEV**2 / mheavy**2
    temperature = mheavy / 20.0
    gstar = 106.75
    # Maxwell-Boltzmann equilibrium density for one real heavy degree of freedom.
    neq = (mheavy * temperature / (2.0 * math.pi)) ** 1.5 * math.exp(-mheavy / temperature)
    sigma_v = kappa**2 / (64.0 * math.pi * mheavy**2)
    hubble = 1.66 * math.sqrt(gstar) * temperature**2 / M_PLANCK_GEV
    gamma_over_h = neq * sigma_v / hubble
    return {
        "m_S_GeV": mheavy,
        "m_phi_GeV": M_ULTRALIGHT_PHI_GEV,
        "kappa_no_cancellation_estimate": kappa,
        "freezeout_temperature_GeV": temperature,
        "portal_sigma_v_order_of_magnitude_GeV_minus2": sigma_v,
        "Gamma_over_H_at_T_equals_m_over_20_order_of_magnitude": gamma_over_h,
    }


def main() -> None:
    repo_root = Path(__file__).resolve().parents[2]
    config_bytes = (repo_root / CONFIG_RELATIVE_PATH).read_bytes()
    config_sha256 = hashlib.sha256(config_bytes).hexdigest()
    assert config_sha256 == CONFIG_SHA256, "Frozen Stage-4.2R configuration changed; stop and re-audit."
    design = json.loads(config_bytes)["leading_design"]
    vcap = V_CAP_KM_S / C_KM_S
    rows = []
    for mchi in M_DM_GEV_GRID:
        mu_c = reduced_mass(mchi, M_C12_GEV)
        delta_c_max_gev = 0.5 * mu_c * vcap**2
        delta_xe_max_gev = vmax_xe_splitting(mchi)
        vmin_c = {
            str(delta): math.sqrt(2.0 * delta * 1e-6 / mu_c) * C_KM_S
            for delta in SPLITTING_KEV_DIAGNOSTICS
        }
        vmin_xe = {
            str(delta): vmin_endothermic_km_s(mchi, M_XE131_GEV, E_XE_KEV, delta)
            for delta in SPLITTING_KEV_DIAGNOSTICS
        }
        rows.append({
            "m_S_GeV": mchi,
            "m_Zprime_resonance_GeV_if_mZprime_approx_2mS": 2.0 * mchi,
            "B_L_split_to_reach_Xe131_248keV_at_vcap_max_keV": delta_xe_max_gev * 1e6,
            "maximum_endothermic_C12_splitting_at_vcap_keV": delta_c_max_gev * 1e6,
            "C12_minimum_speed_km_s_by_diagnostic_splitting_keV": vmin_c,
            "Xe131_minimum_speed_for_248keV_by_diagnostic_splitting_km_s": vmin_xe,
            "free_field_Kaup_star_max_mass_kg": kaup_mass_kg(mchi),
            "free_field_Kaup_star_max_mass_solar": kaup_mass_kg(mchi) / M_SUN_KG,
            "carbon_channel_open_for_all_delta_ge_100keV": 100.0 < delta_c_max_gev * 1e6,
        })
        assert delta_c_max_gev * 1e6 < 100.0
        assert 100.0 < delta_xe_max_gev * 1e6
        assert vmin_c["100.0"] > V_CAP_KM_S
        assert vmin_xe["100.0"] < V_CAP_KM_S
        assert vmin_xe["200.0"] < V_CAP_KM_S
    exothermic_rows = [
        exothermic_carbon_decoherence_upper(mchi, delta, design)
        for mchi in M_DM_GEV_GRID
        for delta in SPLITTING_KEV_DIAGNOSTICS
    ]
    assert max(row["fraction_of_registered_one_sigma_D"] for row in exothermic_rows) < 1e-20
    portal_rows = [portal_naturalness_diagnostic(mchi) for mchi in M_DM_GEV_GRID]
    assert max(row["Gamma_over_H_at_T_equals_m_over_20_order_of_magnitude"] for row in portal_rows) < 1e-90
    out = {
        "classification": "reproducible kinematic / free-field structure screen of a published bosonic B-L model; no joint prediction",
        "source": "https://arxiv.org/html/2609.06909v1",
        "inputs": {
            "source_model": "real split components S (light) and P (heavy) of complex B-L scalar phi_1; off-diagonal Zprime derivative current",
            "source_reported_DM_mass_regime": "few TeV, resonant mS approximately mZprime/2, gBL about 0.5",
            "source_reported_splitting_scale": "O(100 keV), not a precise benchmark in the text extraction",
            "source_reported_nucleon_cross_section_cm2": "order 1e-45",
            "recoil_target_Xe131_GeV": M_XE131_GEV,
            "recoil_energy_keV": E_XE_KEV,
            "carbon_target_C12_GeV": M_C12_GEV,
            "speed_cap_km_s": V_CAP_KM_S,
            "free_field_Kaup_coefficient": KAUP_COEFFICIENT,
            "frozen_configuration_path": CONFIG_RELATIVE_PATH.as_posix(),
            "frozen_configuration_sha256": config_sha256,
            "frozen_C_sphere_mass_kg": design["mass_kg"],
            "frozen_hold_s": design["hold_time_s"],
            "registered_one_sigma_D": 0.005816,
            "exothermic_upscatter_normalization_sigma_p_times_fP_cm2": SIGMA_P_CM2_BENCHMARK,
            "exothermic_ceiling_assumes_fP_local": 1.0,
        },
        "outputs": rows,
        "exothermic_excited_population_carbon_ceiling": exothermic_rows,
        "ultralight_star_component_portal_diagnostic": portal_rows,
        "interpretation_limits": [
            "The B-L preprint proposes endothermic upscattering of S to P. The tree-level Zprime transition cannot upscatter an isolated C12 nucleus when delta exceeds its maximum halo kinetic energy transfer.",
            "The preprint's O(100 keV) splitting is not a precisely tabulated LZ best-fit interval in the extracted text. The computed C12 threshold is below 40 keV over this heavy-mass grid, so the stated scale lies above it.",
            "The present-day P fraction is not inferred here. If P survives, the inverse transition is exothermic and carbon is open; the separate table deliberately assumes all local dark matter is P to bound this possibility.",
            "The exothermic carbon ceiling transfers the paper's order-1e-45 cm2 nucleon normalization as sigma_p*fP, assumes F_C^2=1, maximum supported incident speed, and D per event <=2. It is a conditional upper screen, not a joint fit.",
            "This does not bound collective solid excitations, virtual two-vertex elastic amplitudes, loops, or other apparatus couplings; each requires a separately derived response.",
            "The free-field Kaup mass applies to a minimally coupled scalar without self-interactions. It is a structural scale comparator, not a star stability or formation solution for the B-L scalar potential.",
            "No LZ likelihood, collider recast, gamma-ray yield, relic-density integration, or Casimir-DP response is recomputed. The paper's own thermal-rel relic and LZ statements remain model-dependent preprint results.",
        ],
    }
    Path(__file__).with_suffix(".json").write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(out, indent=2))


if __name__ == "__main__":
    main()

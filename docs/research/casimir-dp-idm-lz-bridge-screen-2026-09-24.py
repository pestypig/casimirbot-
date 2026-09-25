#!/usr/bin/env python3
"""Reproduce IDM Xe/C-12 thresholds and a conditional Higgs-elastic ceiling.

This is a reduced-order screen for arXiv:2609.06571v1, not an LZ likelihood,
full material-response calculation, or physical pilot prediction.
"""

import json
import hashlib
import math
from pathlib import Path


M_H_GEV = 1080.0
DELTA_KEV = 369.0
V_HIGGS_GEV = 246.22
V_MAX_KM_S = 798.0
U_GEV = 0.93149410242
C_KM_S = 299792.458
LAMBDA_L = -1.92e-4
M_HIGGS_GEV = 125.1
M_NUCLEON_GEV = 0.93956542052
F_N_VALUES = (0.26, 0.30, 0.33)
M_PHI_EV = 1e-17
M_HPLUS_MINUS_MH_GEV = 8.17
T_CMB0_EV = 2.348e-4
GSTAR_S0 = 3.91
GSTAR_S_PRODUCTION = 106.75
RHO_GEV_CM3 = 0.3
ATOMIC_MASS_UNIT_KG = 1.66053906892e-27
GEV_C2_KG = 1.782661921e-27
CM2_PER_GEV2 = 0.3893793721e-27


def target_result(label: str, mass_number: int) -> dict[str, float | str | bool]:
    m_target = mass_number * U_GEV
    mu = M_H_GEV * m_target / (M_H_GEV + m_target)
    delta_gev = DELTA_KEV * 1e-6
    v_threshold = math.sqrt(2.0 * delta_gev / mu) * C_KM_S
    recoil_at_threshold_kev = mu / m_target * DELTA_KEV
    q_threshold_mev = math.sqrt(2.0 * mu * delta_gev) * 1000.0
    return {
        "target": label,
        "target_mass_GeV": m_target,
        "reduced_mass_GeV": mu,
        "threshold_speed_km_s": v_threshold,
        "threshold_speed_over_adopted_cap": v_threshold / V_MAX_KM_S,
        "kinematically_open_below_cap": v_threshold <= V_MAX_KM_S,
        "recoil_at_threshold_keV": recoil_at_threshold_kev,
        "momentum_transfer_at_threshold_MeV": q_threshold_mev,
    }


def minimum_speed_at_recoil(target_mass_gev: float, recoil_kev: float) -> float:
    mu = M_H_GEV * target_mass_gev / (M_H_GEV + target_mass_gev)
    recoil_gev = recoil_kev * 1e-6
    delta_gev = DELTA_KEV * 1e-6
    v_min = (target_mass_gev * recoil_gev / mu + delta_gev) / math.sqrt(
        2.0 * target_mass_gev * recoil_gev
    )
    return v_min * C_KM_S


def higgs_elastic_screen() -> dict[str, object]:
    repo_root = Path(__file__).resolve().parents[2]
    config_path = repo_root / "configs/research/casimir-dp-integrated-feasibility-pilot-stage4-2r.v1.json"
    config_bytes = config_path.read_bytes()
    config = json.loads(config_bytes)
    design = config["leading_design"]
    precision_target = (1.0 - math.exp(-config["frozen_diosi"]["gaussian_exponent_at_hold"])) / config["pilot_design"]["minimum_primary_signal_snr"]
    object_nucleons = design["mass_kg"] / ATOMIC_MASS_UNIT_KG
    object_mass_gev = design["mass_kg"] / GEV_C2_KG
    mu_n = M_H_GEV * M_NUCLEON_GEV / (M_H_GEV + M_NUCLEON_GEV)
    mu_object = M_H_GEV * object_mass_gev / (M_H_GEV + object_mass_gev)
    flux_cm2_s = RHO_GEV_CM3 / M_H_GEV * V_MAX_KM_S * 1e5
    rows = []
    for f_n in F_N_VALUES:
        # IDM convention: h H H vertex = 2 lambda_L v; nucleon Higgs
        # matrix element is f_N m_N / v. Heavy-DM SI limit follows at q << m_h.
        sigma_n_gev2 = LAMBDA_L**2 * f_n**2 * M_NUCLEON_GEV**4 / (
            math.pi * M_H_GEV**2 * M_HIGGS_GEV**4
        )
        sigma_n_cm2 = sigma_n_gev2 * CM2_PER_GEV2
        # Born, elastic, contact, fully coherent triangle envelope. The amplitude
        # on the object is at most A_obj times the one-nucleon amplitude.
        sigma_object_upper_cm2 = sigma_n_cm2 * object_nucleons**2 * (mu_object / mu_n) ** 2
        decoherence_exponent_upper = 2.0 * flux_cm2_s * design["hold_time_s"] * sigma_object_upper_cm2
        rows.append({
            "f_N": f_n,
            "sigma_nucleon_cm2": sigma_n_cm2,
            "fully_coherent_object_cross_section_upper_cm2": sigma_object_upper_cm2,
            "single_hold_decoherence_exponent_upper": decoherence_exponent_upper,
            "fraction_of_registered_one_sigma_precision": decoherence_exponent_upper / precision_target,
        })
    return {
        "model_inputs": {
            "lambda_L": LAMBDA_L,
            "m_H_GeV": M_H_GEV,
            "m_h_GeV": M_HIGGS_GEV,
            "f_N_scan": list(F_N_VALUES),
            "local_density_GeV_cm3": RHO_GEV_CM3,
            "speed_km_s": V_MAX_KM_S,
            "speed_interpreted_as_support_cap": True,
        },
        "frozen_design": {
            "config_path": "configs/research/casimir-dp-integrated-feasibility-pilot-stage4-2r.v1.json",
            "config_sha256": hashlib.sha256(config_bytes).hexdigest(),
            "radius_m": design["radius_m"],
            "mass_kg": design["mass_kg"],
            "hold_time_s": design["hold_time_s"],
            "branch_separation_m": design["branch_separation_m"],
            "object_nucleons_approx": object_nucleons,
            "diosi_only_exponent_at_hold": config["frozen_diosi"]["gaussian_exponent_at_hold"],
            "minimum_primary_signal_snr": config["pilot_design"]["minimum_primary_signal_snr"],
            "registered_one_sigma_magnitude_precision": precision_target,
        },
        "rows": rows,
        "assumptions": [
            "Zero-momentum Higgs exchange with an isoscalar nucleon matrix element f_N.",
            "Born, elastic, short-range contact scattering with nucleon amplitudes summed coherently.",
            "The object bound uses |sum_j exp(i q.r_j)| <= A_obj at every transfer; it is deliberately generous.",
            "The visibility factor is bounded by 2, so D <= 2 times the total single-hold collision probability.",
            "This bound excludes internal excitations, absorption, multiple scattering, and non-Higgs IDM loops.",
            "The Stage-4.2R 0.005816 magnitude-uncertainty requirement is a design benchmark, not measured performance.",
        ],
    }


def multicomponent_naturalness_screen() -> dict[str, float | str]:
    m_a = M_H_GEV + DELTA_KEV * 1e-6
    m_charged = M_H_GEV + M_HPLUS_MINUS_MH_GEV
    lambda5 = -(m_a**2 - M_H_GEV**2) / V_HIGGS_GEV**2
    lambda4 = 2.0 * (m_a**2 - m_charged**2) / V_HIGGS_GEV**2 + lambda5
    lambda3 = 2.0 * LAMBDA_L - lambda4 - lambda5
    m_phi_gev = M_PHI_EV * 1e-9
    phi_higgs_portal_no_cancellation = 2.0 * m_phi_gev**2 / V_HIGGS_GEV**2
    portal_threshold_naturalness_scale = (
        16.0 * math.pi**2 * m_phi_gev**2 / M_H_GEV**2
    )
    loop_induced_mixed_quartic_scale = abs(lambda3) / (16.0 * math.pi**2)
    return {
        "m_phi_eV": M_PHI_EV,
        "idm_lambda3_reconstructed": lambda3,
        "idm_lambda4_reconstructed": lambda4,
        "idm_lambda5_reconstructed": lambda5,
        "lambda_phi_H1_no_cancellation_scale": phi_higgs_portal_no_cancellation,
        "kappa_threshold_naturalness_scale_at_mH": portal_threshold_naturalness_scale,
        "delta_lambda_phi_H1_over_kappa_one_loop_scale": loop_induced_mixed_quartic_scale,
        "scope": "Naturalness diagnostics only; not mathematical exclusions or bounds if mass counterterms are fine-tuned.",
    }


def thermal_conversion_momentum_screen() -> dict[str, float | str | bool]:
    # Illustrative nonrelativistic H-H conversion near WIMP freeze-out, T ~ m_H/20.
    t_production_gev = M_H_GEV / 20.0
    p_production_ev = M_H_GEV * 1e9
    p_today_ev = p_production_ev * (T_CMB0_EV / (t_production_gev * 1e9)) * (
        GSTAR_S0 / GSTAR_S_PRODUCTION
    ) ** (1.0 / 3.0)
    ratio = p_today_ev / M_PHI_EV
    return {
        "production_process": "H H -> phi phi* near nonrelativistic freeze-out",
        "freezeout_temperature_GeV": t_production_gev,
        "typical_phi_momentum_at_production_GeV": M_H_GEV,
        "phi_mass_eV": M_PHI_EV,
        "cmb_temperature_today_eV": T_CMB0_EV,
        "entropy_dof_today": GSTAR_S0,
        "entropy_dof_at_production_assumption": GSTAR_S_PRODUCTION,
        "typical_phi_momentum_today_eV": p_today_ev,
        "momentum_over_phi_mass_today": ratio,
        "nonrelativistic_today": ratio < 1.0,
        "scope": "Free-streaming redshift estimate with adiabatic SM entropy evolution; not a Boltzmann abundance or structure-formation calculation.",
    }


def main() -> None:
    delta_gev = DELTA_KEV * 1e-6
    lambda5_abs = DELTA_KEV * 1e-6 * (2.0 * M_H_GEV + delta_gev) / V_HIGGS_GEV**2
    result = {
        "source_benchmark": {
            "arxiv": "2609.06571v1",
            "m_H_GeV": M_H_GEV,
            "delta_keV": DELTA_KEV,
            "adopted_lab_speed_cap_km_s": V_MAX_KM_S,
        },
        "idm_splitting_coupling": {
            "absolute_lambda5": lambda5_abs,
            "relation": "m_H^2 = m_A^2 + lambda5*v^2; lambda5 < 0 for m_A > m_H",
        },
        "targets": [target_result("Xe-131 (representative isotope)", 131), target_result("C-12", 12)],
        "lz_candidate_recoil": {
            "recoil_energy_keV": 248.0,
            "xe131_minimum_speed_km_s": minimum_speed_at_recoil(131 * U_GEV, 248.0),
        },
        "higgs_elastic_conditional_screen": higgs_elastic_screen(),
        "two_component_naturalness_screen": multicomponent_naturalness_screen(),
        "thermal_conversion_momentum_screen": thermal_conversion_momentum_screen(),
        "scope": [
            "Thresholds use v_thr = sqrt(2 delta / reduced_mass), minimized over recoil energy.",
            "The speed cap is the benchmark 544 + 254 = 798 km/s used by the source paper.",
            "C-12 independent-nucleus ground-state upscattering is kinematically closed under this cap.",
            "This does not exclude a separately calculated collective, electronic, or inelastic material channel.",
            "No LZ likelihood, detector response, exact material channel, or boson-star population is computed.",
        ],
    }
    out = Path(__file__).with_suffix(".json")
    out.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()

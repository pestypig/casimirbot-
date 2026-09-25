#!/usr/bin/env python3
"""Reproducible units/kinematics screen for the B-L splitting notation ambiguity."""
import json
import hashlib
from pathlib import Path

OUT = Path(__file__).with_suffix(".json")
BASELINE_CARBON_JSON = OUT.with_name("casimir-dp-bminusl-scalar-lz-carbon-screen-2026-09-24.json")
U_TO_EV = 931.49410242e6
C_KM_S = 299_792.458
V_CAP = 798.0
M_XE = 131.293 * U_TO_EV
M_C = 12.0 * U_TO_EV
ER_XE = 248e3
Q_KEV = (100.0, 200.0, 300.0)
M_TEV = (1.0, 2.0, 3.0, 5.0)
RHO_DM_GEV_CM3 = 0.3
SIGMA_P_CM2 = 1e-45
CARBON_ATOMIC_MASS_KG = 12.0 * 1.66053906660e-27
SPHERE_MASS_KG = 3.0925052683774525e-16
HOLD_S = 0.25
REGISTERED_SIGMA_D = 0.005816


def reduced_mass(a, b):
    return a * b / (a + b)


def vmin_km_s(target_mass, dark_mass, recoil_ev, delta_ev):
    mu = reduced_mass(target_mass, dark_mass)
    v_over_c = (target_mass * recoil_ev / mu + delta_ev) / (2 * target_mass * recoil_ev) ** 0.5
    return v_over_c * C_KM_S


def carbon_upscatter_ceiling(mchi_gev, delta_ev):
    """Independent-carbon, all-DM S-state, max-speed collision ceiling."""
    mchi = mchi_gev
    mcarbon = 12.0 * 0.93149410242
    mp = 0.93827208816
    mu_c = reduced_mass(mchi, mcarbon)
    mu_p = reduced_mass(mchi, mp)
    vmax_threshold = (2.0 * delta_ev * 1e-9 / mu_c) ** 0.5 * C_KM_S
    sigma_c = SIGMA_P_CM2 * 12.0**2 * (mu_c / mu_p) ** 2
    nchi = RHO_DM_GEV_CM3 / mchi
    ncarbon = SPHERE_MASS_KG / CARBON_ATOMIC_MASS_KG
    collisions = nchi * sigma_c * (V_CAP * 1e5) * ncarbon * HOLD_S
    d_upper = 2.0 * collisions
    return {
        "endothermic_carbon_threshold_speed_km_s": vmax_threshold,
        "endothermic_carbon_open_at_speed_cap": vmax_threshold <= V_CAP,
        "sigma_C12_cm2_from_transferred_sigma_p": sigma_c,
        "expected_C_collisions_per_hold_if_open": collisions if vmax_threshold <= V_CAP else 0.0,
        "D_upper_if_open": d_upper if vmax_threshold <= V_CAP else 0.0,
        "fraction_of_registered_one_sigma_D_if_open": d_upper / REGISTERED_SIGMA_D if vmax_threshold <= V_CAP else 0.0,
        "assumptions": "all local DM in S; sigma_p=1e-45 cm2; F_C^2=1; incident speed at 798 km/s; independent C12 nuclei; D per collision <=2",
    }


def main():
    baseline = json.loads(BASELINE_CARBON_JSON.read_text(encoding="utf-8"))
    config_sha = baseline["inputs"]["frozen_configuration_sha256"]
    config_path = Path(baseline["inputs"]["frozen_configuration_path"])
    actual_config_sha = hashlib.sha256(config_path.read_bytes()).hexdigest()
    assert actual_config_sha == config_sha
    config_mass = baseline["inputs"]["frozen_C_sphere_mass_kg"]
    config_hold = baseline["inputs"]["frozen_hold_s"]
    assert abs(config_mass / SPHERE_MASS_KG - 1.0) < 1e-12
    assert abs(config_hold / HOLD_S - 1.0) < 1e-12
    rows = []
    for mass_tev in M_TEV:
        ms = mass_tev * 1e12
        xe_mu = reduced_mass(M_XE, ms)
        c_mu = reduced_mass(M_C, ms)
        carbon_max = 0.5 * c_mu * (V_CAP / C_KM_S) ** 2
        physical_optimum = M_XE * ER_XE / xe_mu
        q_for_optimum = (physical_optimum * (2 * ms + physical_optimum)) ** 0.5
        literal_cases = []
        physical_cases = []
        for q_kev in Q_KEV:
            q = q_kev * 1e3
            mp = (ms * ms + q * q) ** 0.5
            literal_delta = mp - ms
            carbon_ceiling = carbon_upscatter_ceiling(mass_tev * 1e3, literal_delta)
            literal_cases.append({
                "quoted_sqrt_mass_squared_difference_keV": q_kev,
                "physical_gap_eV": literal_delta,
                "xe_vmin_km_s": vmin_km_s(M_XE, ms, ER_XE, literal_delta),
                "carbon_endothermic_open_at_vcap": literal_delta <= carbon_max,
                "independent_carbon_decoherence_upper": carbon_ceiling,
            })
            physical_cases.append({
                "physical_gap_keV": q_kev,
                "xe_vmin_km_s": vmin_km_s(M_XE, ms, ER_XE, q_kev * 1e3),
                "carbon_endothermic_open_at_vcap": q_kev * 1e3 <= carbon_max,
            })
        rows.append({
            "mS_TeV": mass_tev,
            "xe_reduced_mass_GeV": xe_mu / 1e9,
            "carbon_endothermic_max_gap_keV_at_vcap": carbon_max / 1e3,
            "physical_gap_minimizing_248keV_xe_vmin_keV": physical_optimum / 1e3,
            "sqrt_mass_squared_difference_for_optimal_gap_GeV": q_for_optimum / 1e9,
            "literal_sqrt_difference_reading": literal_cases,
            "physical_mass_gap_reading": physical_cases,
        })
    result = {
        "purpose": "Notation ambiguity screen only; no detector likelihood or predicted event rate.",
        "inputs": {
            "dark_matter_masses_TeV": list(M_TEV),
            "quoted_sqrt_mass_squared_difference_keV": list(Q_KEV),
            "xe_isotope_mass_u": 131.293,
            "carbon_isotope_mass_u": 12.0,
            "xenon_recoil_keV": 248.0,
            "speed_cap_km_s": V_CAP,
            "speed_of_light_km_s": C_KM_S,
            "mass_energy_conversion_eV_per_u": U_TO_EV,
            "carbon_target_nucleon_cross_section_cm2": SIGMA_P_CM2,
            "carbon_target_sphere_mass_kg": config_mass,
            "frozen_hold_s": config_hold,
            "frozen_configuration_sha256": config_sha,
            "frozen_configuration_sha256_recomputed": actual_config_sha,
            "registered_one_sigma_D": REGISTERED_SIGMA_D,
        },
        "definitions": {
            "literal_reading": "q=sqrt(mP^2-mS^2); delta=mP-mS=sqrt(mS^2+q^2)-mS",
            "physical_gap_reading": "delta=mP-mS=q",
            "vmin": "(mT*ER/mu + delta)/sqrt(2*mT*ER), with all energies in the same units",
            "carbon_threshold": "delta_max=mu_C*v_cap^2/2",
            "physical_gap_optimum": "delta*=mXe*ER/mu_Xe minimizes vmin at fixed recoil",
        },
        "rows": rows,
        "limitations": [
            "Uses nuclear masses approximated by isotope mass numbers/masses; kinematic diagnostic only.",
            "Does not infer the intended notation from the authors or reproduce the LZ analysis.",
            "Does not calculate the actual carbon decoherence functional or recoil spectrum.",
            "The attached carbon D is only an extreme upper envelope transferred from the paper's approximate cross-section scale; it assumes maximal which-path separation per collision and is not a material-response prediction.",
        ],
    }
    OUT.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()

"""Common-parameter B-L xenon/carbon closure screen using published formulas."""
from __future__ import annotations

import json
import math
from pathlib import Path

M_N = 0.93827208816  # GeV
G_BL = 0.5
CONVERSION_GEV2_TO_CM2 = 0.3893793721e-27
V0, VE, VESC = 220.0, 232.0, 544.0
V_CAP = 798.0
C_KM_S = 299_792.458
M_C12 = 12.0 * 0.93149410242
OUT = Path(__file__).with_suffix(".json")


def sigma_si_nucleon_cm2(m_s_gev: float, g_bl: float = G_BL) -> float:
    """Paper Eq. 15 with mZ'=2mS, in natural units then cm^2."""
    m_zp = 2.0 * m_s_gev
    mu = M_N * m_s_gev / (M_N + m_s_gev)
    sigma_gev2 = mu**2 * g_bl**4 / (16.0 * math.pi * m_zp**4)
    return sigma_gev2 * CONVERSION_GEV2_TO_CM2


def mass_for_sigma(target_cm2: float) -> float:
    lo, hi = 100.0, 100_000.0
    for _ in range(200):
        mid = 0.5 * (lo + hi)
        if sigma_si_nucleon_cm2(mid) > target_cm2:
            lo = mid
        else:
            hi = mid
    return 0.5 * (lo + hi)


def delta_carbon_max_kev(m_s_gev: float, vmax_km_s: float) -> float:
    mu = m_s_gev * M_C12 / (m_s_gev + M_C12)
    return 0.5 * mu * (vmax_km_s / C_KM_S) ** 2 * 1e6


def main() -> None:
    masses = (1000.0, 2000.0, 2300.0, 3000.0, 4000.0, 5000.0)
    mass_rows = []
    for m_s in masses:
        mass_rows.append({
            "mS_GeV": m_s,
            "mZprime_GeV_assuming_resonance": 2.0 * m_s,
            "gBL": G_BL,
            "sigma_SI_nucleon_cm2_from_eq15": sigma_si_nucleon_cm2(m_s),
            "sigma_over_1e_minus45": sigma_si_nucleon_cm2(m_s) / 1e-45,
            "delta_C_max_with_frozen_798_km_s_keV": delta_carbon_max_kev(m_s, V_CAP),
            "delta_C_max_with_selected_SHM_support_776_km_s_keV": delta_carbon_max_kev(m_s, VESC + VE),
        })

    # Table S8 of the LZ paper: O1^s local significance, at masses matching
    # the available 1 TeV and 4 TeV rows. This is evidence about event shape,
    # not a B-L-specific likelihood or a global significance.
    lz_grid = [
        {"mchi_GeV": 1000, "delta_keV": 0, "local_significance_sigma": 0.0},
        {"mchi_GeV": 1000, "delta_keV": 50, "local_significance_sigma": 0.0},
        {"mchi_GeV": 1000, "delta_keV": 100, "local_significance_sigma": 0.8},
        {"mchi_GeV": 1000, "delta_keV": 150, "local_significance_sigma": 2.2},
        {"mchi_GeV": 1000, "delta_keV": 200, "local_significance_sigma": 2.7},
        {"mchi_GeV": 1000, "delta_keV": 250, "local_significance_sigma": 2.9},
        {"mchi_GeV": 1000, "delta_keV": 300, "local_significance_sigma": 3.0},
        {"mchi_GeV": 1000, "delta_keV": 350, "local_significance_sigma": 3.3},
        {"mchi_GeV": 4000, "delta_keV": 0, "local_significance_sigma": 0.0},
        {"mchi_GeV": 4000, "delta_keV": 50, "local_significance_sigma": 0.0},
        {"mchi_GeV": 4000, "delta_keV": 100, "local_significance_sigma": 1.0},
        {"mchi_GeV": 4000, "delta_keV": 150, "local_significance_sigma": 2.3},
        {"mchi_GeV": 4000, "delta_keV": 200, "local_significance_sigma": 2.7},
        {"mchi_GeV": 4000, "delta_keV": 250, "local_significance_sigma": 2.9},
        {"mchi_GeV": 4000, "delta_keV": 300, "local_significance_sigma": 3.0},
        {"mchi_GeV": 4000, "delta_keV": 350, "local_significance_sigma": 3.3},
    ]
    mass_at_1e45 = mass_for_sigma(1e-45)
    threshold = delta_carbon_max_kev(mass_at_1e45, VESC + VE)
    assert 2_000 < mass_at_1e45 < 3_000
    assert 36.0 < threshold < 38.0
    assert mass_rows[0]["sigma_SI_nucleon_cm2_from_eq15"] > mass_rows[-1]["sigma_SI_nucleon_cm2_from_eq15"]
    assert lz_grid[4]["local_significance_sigma"] == 2.7
    assert lz_grid[12]["local_significance_sigma"] == 2.7

    result = {
        "classification": "common-parameter coupling and kinematic compatibility screen; not a B-L likelihood fit",
        "model_source": "https://arxiv.org/html/2609.06909v1",
        "LZ_comparator_source": "https://arxiv.org/html/2609.02823v1#A1.SS10",
        "model_equation": "sigma_SI = mu_n^2 * gBL^4 / (16*pi*mZprime^4), using B-L paper Eq. 15 and mZprime=2*mS",
        "inputs": {
            "gBL": G_BL,
            "mZprime_over_mS": 2.0,
            "SHM_v0_km_s": V0,
            "SHM_vEarth_km_s": VE,
            "SHM_vesc_km_s": VESC,
            "SHM_max_lab_speed_km_s": VESC + VE,
            "separate_frozen_outer_cap_km_s": V_CAP,
            "nucleon_mass_GeV": M_N,
            "conversion_GeV_minus2_to_cm2": CONVERSION_GEV2_TO_CM2,
        },
        "mass_sweep": mass_rows,
        "mass_GeV_for_sigma_n_1e_minus45": mass_at_1e45,
        "carbon_ceiling_keV_at_that_mass_with_SHM_support": threshold,
        "LZ_O1s_local_significance_grid": lz_grid,
        "interpretation": [
            "For the paper's gBL=0.5 and mZprime=2*mS branch, Eq. 15 places sigma_n near 1e-45 cm^2 around mS=2.3 TeV; the value scales approximately as mS^-4.",
            "The B-L model's contact current maps most closely to LZ's isoscalar O1 inelastic SI comparator. LZ Table S8 has zero local significance at 0 and 50 keV for both 1 and 4 TeV; the carbon-open gap region lies below about 37 keV in the selected SHM support.",
            "The LZ O1s local significance grows at 200-350 keV, where the independent carbon upscatter is closed. This supports a xenon-shape/carbon-bridge tradeoff, not a statistical exclusion of the B-L model.",
            "No exact LZ coupling interval is quoted: the HEPData numeric payload is not accessible in this environment, and the available O1s significance grid is a comparator, not a B-L profile likelihood.",
            "No Casimir-DP material response, lifetime, astrophysical population, boson-star solution, or gamma yield is changed by this single-nucleon cross-section calculation.",
        ],
    }
    OUT.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"mS_for_1e-45_cm2": mass_at_1e45, "rows": mass_rows, "lz_grid": lz_grid}, indent=2))


if __name__ == "__main__":
    main()

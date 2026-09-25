"""Kinematic stress test of the IDM LZ point against Gaia escape-speed fits.

This compares a source-paper truncated-SHM prescription with published stellar
escape-speed tail fits. It is not a dark-matter phase-space posterior or an LZ
likelihood calculation; boundary conventions and stellar/DM distribution
differences must be resolved before using it as a constraint.
"""

from __future__ import annotations

import json
import math
from pathlib import Path


M_H_GEV = 1080.0
DELTA_KEV = 369.0
E_R_KEV = 248.0
M_XE131_GEV = 131.0 * 0.93149410242
V_LAB_KM_S = 254.0
V0_KM_S = 238.0
C_KM_S = 299_792.458

# Roche et al. (arXiv:2402.00108v2), 8-9 kpc bin. Values are their 68% ranges.
VESC_MODELS = (
    {"model": "Gaia DR3 SEPL", "central_km_s": 486.0, "lower_km_s": 481.0, "upper_km_s": 496.0},
    {"model": "Gaia DR3 2-component power law", "central_km_s": 539.0, "lower_km_s": 505.0, "upper_km_s": 608.0},
    {"model": "IDM paper SHM assumption", "central_km_s": 544.0, "lower_km_s": 544.0, "upper_km_s": 544.0},
)


def reduced_mass(m1: float, m2: float) -> float:
    return m1 * m2 / (m1 + m2)


def vmin_km_s() -> float:
    mu = reduced_mass(M_H_GEV, M_XE131_GEV)
    recoil = E_R_KEV * 1e-6
    splitting = DELTA_KEV * 1e-6
    vmin = (M_XE131_GEV * recoil / mu + splitting) / math.sqrt(
        2.0 * M_XE131_GEV * recoil
    )
    return vmin * C_KM_S


def max_splitting_at_recoil_kev(vmax_lab_km_s: float) -> float:
    mu = reduced_mass(M_H_GEV, M_XE131_GEV)
    recoil = E_R_KEV * 1e-6
    vmax = vmax_lab_km_s / C_KM_S
    delta_gev = vmax * math.sqrt(2.0 * M_XE131_GEV * recoil) - M_XE131_GEV * recoil / mu
    return delta_gev * 1e6


def mean_inverse_speed_eta(vmin: float, vesc: float) -> float:
    """Shifted, truncated Maxwellian mean inverse speed in (km/s)^-1."""
    z = vesc / V0_KM_S
    x = vmin / V0_KM_S
    y = V_LAB_KM_S / V0_KM_S
    norm = math.erf(z) - 2.0 / math.sqrt(math.pi) * z * math.exp(-z * z)
    if vmin >= vesc + V_LAB_KM_S:
        return 0.0
    if vmin < vesc - V_LAB_KM_S:
        numerator = math.erf(x + y) - math.erf(x - y) - (
            4.0 / math.sqrt(math.pi) * y * math.exp(-z * z)
        )
    else:
        numerator = math.erf(z) - math.erf(x - y) - (
            2.0 / math.sqrt(math.pi) * (z - x + y) * math.exp(-z * z)
        )
    return numerator / (2.0 * norm * V_LAB_KM_S)


def main() -> None:
    vmin = vmin_km_s()
    eta_reference = mean_inverse_speed_eta(vmin, 544.0)
    assert eta_reference > 0.0
    assert mean_inverse_speed_eta(vmin, 486.0) == 0.0
    assert abs(mean_inverse_speed_eta(vmin, 539.0) / eta_reference - 0.3601455232) < 1e-9
    rows = []
    for entry in VESC_MODELS:
        cases = {}
        for key in ("lower_km_s", "central_km_s", "upper_km_s"):
            vesc = entry[key]
            vmax_lab = vesc + V_LAB_KM_S
            eta = mean_inverse_speed_eta(vmin, vesc)
            cases[key.removesuffix("_km_s")] = {
                "v_escape_km_s": vesc,
                "v0_km_s_fixed_to_IDM_SHM": V0_KM_S,
                "v_lab_fixed_km_s": V_LAB_KM_S,
                "truncated_SHM_lab_speed_cap_km_s": vmax_lab,
                "vmin_for_248keV_recoil_km_s": vmin,
                "speed_headroom_km_s": vmax_lab - vmin,
                "benchmark_recoil_kinematically_open": vmax_lab >= vmin,
                "conditional_SHM_mean_inverse_speed_per_km_s": eta,
                "conditional_SHM_differential_rate_ratio_to_IDM_paper": eta / eta_reference if eta_reference else None,
                "largest_splitting_for_248keV_recoil_keV": max_splitting_at_recoil_kev(vmax_lab),
            }
        rows.append({"escape_speed_fit": entry["model"], "cases": cases})

    result = {
        "classification": "kinematic halo-tail sensitivity screen; no velocity posterior and no LZ likelihood",
        "sources": {
            "IDM_benchmark": "https://arxiv.org/html/2609.06571",
            "Gaia_DR3_escape_speed": "https://arxiv.org/html/2402.00108",
        },
        "inputs": {
            "m_H_GeV": M_H_GEV,
            "delta_keV": DELTA_KEV,
            "Xe131_recoil_keV": E_R_KEV,
            "Xe131_mass_GeV": M_XE131_GEV,
            "lab_speed_km_s_held_fixed": V_LAB_KM_S,
            "v0_km_s_held_fixed": V0_KM_S,
            "Gaia_radial_bin": "8-9 kpc, includes but is not identical to the solar position",
            "Gaia_SEPL_reported_escape_speed_km_s": "486 +10/-5 (68% interval)",
            "Gaia_2PL_reported_escape_speed_km_s": "539 +69/-34 (68% interval)",
            "IDM_source_SHM_escape_speed_km_s": 544.0,
        },
        "vmin_for_benchmark_recoil_km_s": vmin,
        "reference_eta_at_IDM_paper_v_esc_544_per_km_s": eta_reference,
        "outputs": rows,
        "interpretation_limits": [
            "The cap v_lab,max = v_esc + v_lab is the truncated Standard Halo Model construction used here to stress-test the IDM benchmark.",
            "Gaia measures a stellar escape-speed profile, not the local dark-matter speed distribution. Its SEPL and 2PL fits differ substantially and encode tail-model uncertainty.",
            "The Gaia analysis defines escape relative to 2 R_200c; direct-detection SHM conventions and adopted outer boundary must be matched before interpreting closure as a physical exclusion.",
            "A non-Maxwellian dark-matter stream or substructure can change the local high-speed support; no such component is assumed or fitted here.",
            "A closed kinematic point for the adopted truncated SHM has zero rate, but an open point's event rate still requires the full velocity integral, isotope response, detector efficiency, backgrounds, and LZ likelihood.",
        ],
        "falsification_test": "The IDM LZ benchmark is not robust to plausible local-tail prescriptions unless a common-convention Galactic model supplies sufficient DM support above 786 km/s in the lab frame.",
    }
    Path(__file__).with_suffix(".json").write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()

"""Local encounter-rate screen for Sgr A*-mass mini-boson-star objects.

Uses an illustrative local co-tracing population and a Schwarzschild geodesic
focusing proxy at the 99%-mass radius. It is not a Galactic population fit.
"""
from __future__ import annotations

import json
import math
from pathlib import Path

C_LIGHT = 299_792_458.0
G_NEWTON = 6.67430e-11
MSUN_KG = 1.98847e30
PC_M = 3.085677581491367e16
AU_M = 149_597_870_700.0
GEV_J = 1.602176634e-10
SECONDS_PER_YEAR = 31_557_600.0
M_PHI_EV = 1.0e-17
M_STAR_MSUN = 4.02e6
COMPACTNESS_C99 = 0.075
M99_OVER_M = 0.99
LOCAL_RHO_GEV_CM3 = (0.3, 0.4, 0.6)
OBJECT_FRACTIONS = (0.01, 0.10, 1.0)
RELATIVE_SPEED_KMS = (150.0, 220.0, 300.0)
ILLUSTRATIVE_EXPOSURE_YEARS = 10.0


def local_density_msun_pc3(rho_gev_cm3: float) -> float:
    j_per_m3 = rho_gev_cm3 * GEV_J * 1.0e6
    kg_per_m3 = j_per_m3 / C_LIGHT**2
    return kg_per_m3 * PC_M**3 / MSUN_KG


def schwarzschild_grazing_impact_parameter(radius_m: float, mass_kg: float,
                                           speed_kms: float) -> float:
    """Impact parameter at infinity for a Schwarzschild test-particle periapsis R."""
    beta = speed_kms * 1000.0 / C_LIGHT
    gamma = 1.0 / math.sqrt(1.0 - beta*beta)
    rs = 2.0 * G_NEWTON * mass_kg / C_LIGHT**2
    compactness2 = rs / radius_m
    if compactness2 >= 1.0:
        raise ValueError("grazing radius must lie outside the Schwarzschild radius")
    b2_over_r2 = (gamma*gamma / (1.0 - compactness2) - 1.0) / (gamma*gamma - 1.0)
    return radius_m * math.sqrt(b2_over_r2)


def main() -> None:
    mass_kg = M_STAR_MSUN * MSUN_KG
    gravitational_radius = G_NEWTON * mass_kg / C_LIGHT**2
    r99_m = M99_OVER_M * gravitational_radius / COMPACTNESS_C99
    v_rows = []
    for v_kms in RELATIVE_SPEED_KMS:
        b_m = schwarzschild_grazing_impact_parameter(r99_m, mass_kg, v_kms)
        v_pc_yr = v_kms * 1000.0 * SECONDS_PER_YEAR / PC_M
        v_rows.append({
            "relative_speed_km_s": v_kms,
            "R99_AU": r99_m / AU_M,
            "grazing_impact_parameter_AU_Schwarzschild_proxy": b_m / AU_M,
            "impact_parameter_to_R99_ratio": b_m / r99_m,
            "v_pc_per_year": v_pc_yr,
        })

    cases = []
    for rho in LOCAL_RHO_GEV_CM3:
        rho_msun_pc3 = local_density_msun_pc3(rho)
        for f_obj in OBJECT_FRACTIONS:
            n_pc3 = f_obj * rho_msun_pc3 / M_STAR_MSUN
            for vrow in v_rows:
                b_pc = vrow["grazing_impact_parameter_AU_Schwarzschild_proxy"] * AU_M / PC_M
                geometric_b_pc = r99_m / PC_M
                sigma_focus_pc2 = math.pi * b_pc*b_pc
                sigma_geo_pc2 = math.pi * geometric_b_pc*geometric_b_pc
                rate_focus_y = n_pc3 * sigma_focus_pc2 * vrow["v_pc_per_year"]
                rate_geo_y = n_pc3 * sigma_geo_pc2 * vrow["v_pc_per_year"]
                cases.append({
                    "local_rho_total_GeV_cm3": rho,
                    "local_compact_object_fraction_assumed": f_obj,
                    "local_rho_objects_Msun_pc3": f_obj * rho_msun_pc3,
                    "object_number_density_pc-3": n_pc3,
                    "mean_spacing_pc": n_pc3**(-1.0/3.0),
                    "relative_speed_km_s": vrow["relative_speed_km_s"],
                    "grazing_impact_parameter_AU_Schwarzschild_proxy":
                        vrow["grazing_impact_parameter_AU_Schwarzschild_proxy"],
                    "geometric_R99_cross_section_pc2": sigma_geo_pc2,
                    "focused_grazing_cross_section_pc2": sigma_focus_pc2,
                    "geometric_rate_per_year": rate_geo_y,
                    "focused_grazing_rate_per_year": rate_focus_y,
                    "focused_mean_interval_years": 1.0/rate_focus_y,
                    "geometric_mean_interval_years": 1.0/rate_geo_y,
                    "focused_encounter_probability_in_10_years": -math.expm1(
                        -rate_focus_y * ILLUSTRATIVE_EXPOSURE_YEARS
                    ),
                })

    payload = {
        "classification": "conditional local encounter-rate screen for equal-mass compact objects; no inferred Galactic population",
        "source_references": {
            "stable_mini_boson_star_model": "https://arxiv.org/abs/1809.08682",
            "local_dark_matter_density_review": "https://arxiv.org/abs/2012.11477",
        },
        "inputs": {
            "boson_mass_eV": M_PHI_EV,
            "stable_model_B_reference_mass_Msun": M_STAR_MSUN,
            "stable_model_B_C99_M99_over_R99": COMPACTNESS_C99,
            "mass_fraction_inside_R99": M99_OVER_M,
            "local_total_density_scan_GeV_cm3": list(LOCAL_RHO_GEV_CM3),
            "local_compact_object_fraction_scan": list(OBJECT_FRACTIONS),
            "relative_speed_scan_km_s": list(RELATIVE_SPEED_KMS),
            "illustrative_detector_exposure_years": ILLUSTRATIVE_EXPOSURE_YEARS,
        },
        "derived_star_scale": {
            "gravitational_radius_GM_over_c2_AU": gravitational_radius / AU_M,
            "R99_AU": r99_m / AU_M,
            "R99_over_Schwarzschild_radius": r99_m / (2.0*gravitational_radius),
        },
        "speed_geometry": v_rows,
        "cases": cases,
        "validity_limits": [
            "The reference is the stable Model B mini-boson-star mass/compactness scale in arXiv:1809.08682, not a claim that Sgr A* is a boson star or that such objects populate the solar neighborhood.",
            "The local density interval is taken from the de Salas-Widmark review; it is total dark matter density, not a measured compact-object density. The compact-object fraction and local co-tracing are explicit scenario assumptions.",
            "The focused grazing cross-section treats the mass exterior to R99 as a Schwarzschild point mass and R99 as an encounter threshold. A boson star has no hard surface, and 1% of its mass lies outside R99, so this is a scale estimate rather than an exact interior geodesic calculation.",
            "A passage within R99 or its focused impact parameter is not a detector interaction. No particle escape, annihilation, xenon recoil, interferometer coupling, or observable threshold is modeled.",
            "Velocity scans are fixed-speed diagnostics, not a halo velocity-distribution fold. Clustering, anisotropy, and spatial variation of compact objects are not modeled.",
        ],
        "falsification_tests": [
            "Do not identify a compact-object encounter rate with continuous local particle flux; any such bridge needs a separate release/decay model.",
            "Reject an assumed local compact fraction that is inconsistent with a population model or astronomical limits once its mass function and selection functions are applied.",
            "If the predicted encounter rate is negligible, compact objects cannot be the recurring laboratory exposure; retain only the diffuse component or a separately derived emitted-particle component for xenon forecasts.",
        ],
    }
    out = Path(__file__).with_suffix(".json")
    out.write_text(json.dumps(payload, indent=2, allow_nan=False) + "\n", encoding="utf-8")
    central = next(c for c in cases if c["local_rho_total_GeV_cm3"] == 0.4
                   and c["local_compact_object_fraction_assumed"] == 0.1
                   and c["relative_speed_km_s"] == 220.0)
    print(json.dumps({
        "R99_AU": r99_m / AU_M,
        "central_case": central,
        "focused_intervals_for_10pct_at_220_km_s_years": [
            next(c["focused_mean_interval_years"] for c in cases
                 if c["local_rho_total_GeV_cm3"] == rho
                 and c["local_compact_object_fraction_assumed"] == 0.1
                 and c["relative_speed_km_s"] == 220.0)
            for rho in LOCAL_RHO_GEV_CM3
        ],
    }, indent=2))
    assert 0.52 < r99_m/AU_M < 0.54
    assert all(c["focused_mean_interval_years"] > 1e15 for c in cases)
    assert all(c["focused_grazing_rate_per_year"] > c["geometric_rate_per_year"] for c in cases)


if __name__ == "__main__":
    main()

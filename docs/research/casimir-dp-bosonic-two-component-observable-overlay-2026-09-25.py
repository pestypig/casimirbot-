#!/usr/bin/env python3
"""Overlay one shared component fraction on existing bosonic DM screens.

Reads the frozen Folsom/TNG50 rho*eta recoil factors and combines them with
the separate-production phi + IDM abundance scalings. All outputs remain
conditional: cosmic fractions are assumed to co-trace locally and at the
Galactic Center, and this is not an LZ likelihood or gamma-ray fit.
"""

from __future__ import annotations

import json
import hashlib
from pathlib import Path


ROOT = Path(__file__).resolve().parent
FOLSOM_PATH = ROOT / "casimir-dp-idm-folsom-tng50-recoil-spectrum-2026-09-25.json"
FOLSOM_JSON_SHA256 = "d99157a7f5d00017bb936a16ebf31afb1c84d9b16c39cee076da4985aa0ae8ef"
M_PHI_GRID = (0.0, 0.01, 0.10, 0.25, 0.50)
OMEGA_DM_H2 = 0.1198
OMEGA_DM_H2_SIGMA = 0.0012
OMEGA_H_IDM_PROFILE = 0.12014
DP_PURE_H_CEILING = 7.0e-19
STAR_ENCOUNTER_P10_AT_FOBJ_0P1 = 3.961288e-18
MW_DM_MASS_MSUN = 1.0e12
PHI_STAR_MASS_MSUN = 4.02e6


def percentile_triplet(row: dict[str, object], key: str) -> list[float]:
    values = row[key]
    if not isinstance(values, list) or len(values) != 5:
        raise ValueError(f"Expected five percentile values in {key}")
    if any(value is None for value in values):
        raise ValueError(f"Undefined percentile data in {key}")
    return [float(values[i]) for i in (1, 2, 3)]


def load_lz_halo_factors() -> dict[str, list[float]]:
    digest = hashlib.sha256(FOLSOM_PATH.read_bytes()).hexdigest()
    if digest != FOLSOM_JSON_SHA256:
        raise ValueError("The frozen recoil-fold JSON has changed; review its provenance before use")
    data = json.loads(FOLSOM_PATH.read_text(encoding="utf-8"))
    if data["benchmark"]["mH_GeV"] != 1080.0 or data["benchmark"]["delta_keV"] != 369.0:
        raise ValueError("The Folsom overlay is not the frozen IDM profile point")
    if data["data_grid"]["geocentric_epoch"] != "2000-03-09":
        raise ValueError("Unexpected geocentric epoch in frozen halo fold")

    scaled = data["results_by_phase_space_and_isotope"]["scaled"]["131"]
    unscaled = data["results_by_phase_space_and_isotope"]["unscaled"]["131"]
    row_scaled = next(row for row in scaled if row["recoil_keV"] == 248.0)
    row_unscaled = next(row for row in unscaled if row["recoil_keV"] == 248.0)
    return {
        "scaled_all_98": percentile_triplet(row_scaled, "rate_ratio_percentiles_0_16_50_84_100"),
        "scaled_MW_like_7": percentile_triplet(row_scaled, "near_unity_scaling_rate_ratio_percentiles_0_16_50_84_100"),
        "unscaled_all_98": percentile_triplet(row_unscaled, "rate_ratio_percentiles_0_16_50_84_100"),
        "unscaled_MW_like_7": percentile_triplet(row_unscaled, "near_unity_scaling_rate_ratio_percentiles_0_16_50_84_100"),
    }


def build_rows(halo_factors: dict[str, list[float]]) -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []
    for f_phi in M_PHI_GRID:
        f_h = 1.0 - f_phi
        required_omega_h = f_h * OMEGA_DM_H2
        inverse_abundance_multiplier = (
            OMEGA_H_IDM_PROFILE / required_omega_h if required_omega_h > 0.0 else None
        )
        row: dict[str, object] = {
            "f_phi_cosmic_assumed": f_phi,
            "f_H_cosmic_and_local_if_co_tracing": f_h,
            "required_Omega_H_h2": required_omega_h,
            "H_relic_fraction_of_published_IDM_profile": required_omega_h / OMEGA_H_IDM_PROFILE,
            "Omega_total_h2_if_published_IDM_profile_is_left_unchanged_and_phi_is_added": OMEGA_H_IDM_PROFILE + f_phi * OMEGA_DM_H2,
            "Planck_sigma_deviation_if_published_IDM_profile_is_left_unchanged_and_phi_is_added": (
                OMEGA_H_IDM_PROFILE + f_phi * OMEGA_DM_H2 - OMEGA_DM_H2
            ) / OMEGA_DM_H2_SIGMA,
            "approx_freezeout_sigma_eff_multiplier_for_required_underabundance_inverse_Omega_scaling_only": inverse_abundance_multiplier,
            "H_annihilation_flux_density_squared_factor_if_GC_co_traces": f_h**2,
            "H_cross_section_multiplier_to_preserve_same_gamma_flux_if_profile_and_yield_fixed": 1.0 / f_h**2 if f_h else None,
            "Casimir_DP_exponent_ceiling_if_same_H_kernel": f_h * DP_PURE_H_CEILING,
            "all_phi_in_identical_reference_stars_count_in_1e12_Msun_halo": f_phi * MW_DM_MASS_MSUN / PHI_STAR_MASS_MSUN,
            "10y_star_encounter_probability_if_all_phi_compact_and_co_tracing": STAR_ENCOUNTER_P10_AT_FOBJ_0P1 * f_phi / 0.10,
            "conditional_LZ_rate_ratio_to_IDM_SHM_profile_by_halo_sample": {
                name: [f_h * value for value in values]
                for name, values in halo_factors.items()
            },
        }
        rows.append(row)
    return rows


def main() -> None:
    halo_factors = load_lz_halo_factors()
    rows = build_rows(halo_factors)
    f10 = next(row for row in rows if row["f_phi_cosmic_assumed"] == 0.10)
    lz10 = f10["conditional_LZ_rate_ratio_to_IDM_SHM_profile_by_halo_sample"]
    assert isinstance(lz10, dict)
    assert all(abs(a - b * 0.9) < 1e-12 for a, b in zip(lz10["scaled_MW_like_7"], halo_factors["scaled_MW_like_7"]))
    assert abs(f10["H_annihilation_flux_density_squared_factor_if_GC_co_traces"] - 0.81) < 1e-12
    assert abs(f10["Casimir_DP_exponent_ceiling_if_same_H_kernel"] - 6.3e-19) < 1e-30
    assert abs(f10["10y_star_encounter_probability_if_all_phi_compact_and_co_tracing"] - STAR_ENCOUNTER_P10_AT_FOBJ_0P1) < 1e-30
    assert abs(f10["Omega_total_h2_if_published_IDM_profile_is_left_unchanged_and_phi_is_added"] - 0.13212) < 1e-12
    assert abs(f10["approx_freezeout_sigma_eff_multiplier_for_required_underabundance_inverse_Omega_scaling_only"] - 1.11427) < 2e-5
    f_phi_max_1sigma = max(0.0, (OMEGA_DM_H2 + OMEGA_DM_H2_SIGMA - OMEGA_H_IDM_PROFILE) / OMEGA_DM_H2)
    f_phi_max_2sigma = max(0.0, (OMEGA_DM_H2 + 2.0 * OMEGA_DM_H2_SIGMA - OMEGA_H_IDM_PROFILE) / OMEGA_DM_H2)
    assert abs(f_phi_max_1sigma - 0.007178631051753035) < 1e-12
    assert abs(f_phi_max_2sigma - 0.017195325542571003) < 1e-12

    result = {
        "classification": "conditional_two_component_four_observable_overlay_not_joint_likelihood",
        "model": {
            "phi": "ultralight complex field; only a chosen compact fraction is assigned to reference boson stars",
            "H": "1080 GeV inert-doublet inelastic xenon benchmark with 369 keV splitting",
            "only_shared_abundance_parameter": "f_phi; f_H=1-f_phi",
            "no_dynamical_conversion": True,
        },
        "frozen_LZ_halo_input": {
            "file": FOLSOM_PATH.name,
            "sha256": FOLSOM_JSON_SHA256,
            "isotope_A": 131,
            "recoil_keV": 248.0,
            "epoch": "2000-03-09",
            "percentile_order": ["16th", "median", "84th"],
            "rho_eta_over_IDM_SHM": halo_factors,
        },
        "fixed_published_IDM_profile_relic_budget": {
            "published_Omega_H_h2": OMEGA_H_IDM_PROFILE,
            "adopted_total_Omega_DM_h2": OMEGA_DM_H2,
            "adopted_total_sigma": OMEGA_DM_H2_SIGMA,
            "largest_f_phi_if_fixed_H_point_plus_phi_must_stay_below_Planck_plus_1sigma": (
                max(0.0, (OMEGA_DM_H2 + OMEGA_DM_H2_SIGMA - OMEGA_H_IDM_PROFILE) / OMEGA_DM_H2)
            ),
            "largest_f_phi_if_fixed_H_point_plus_phi_must_stay_below_Planck_plus_2sigma": (
                max(0.0, (OMEGA_DM_H2 + 2.0 * OMEGA_DM_H2_SIGMA - OMEGA_H_IDM_PROFILE) / OMEGA_DM_H2)
            ),
            "interpretation": "the fixed published thermal relic point leaves room for less than a percent-level phi component at 1 sigma; larger f_phi requires a new underabundant IDM relic calculation or nonstandard cosmology",
        },
        "assumptions": [
            "H follows the cosmic heavy-component fraction in the local halo and Galactic Center",
            "the Folsom paired rho*eta halo factors and their selected validation subsets are applied unchanged to H",
            "gamma scaling assumes the same H final-state yield, J-profile shape, and cross section",
            "the entire phi fraction is assigned to identical 4.02e6 solar-mass reference stars for the count/rate column",
            "Casimir-DP uses the previously screened conditional H-kernel ceiling, not an independently qualified instrument response",
        ],
        "outputs_by_f_phi": rows,
        "reading_guide": {
            "LZ": "multiply each halo percentile by f_H; the resulting factor is relative to the published IDM SHM profile at the same isotope and recoil bin",
            "gamma": "density-squared factor only; not a fit to the 43 GeV line, 0.5-0.8 TeV continuum interpretation, or Galactic Center excess",
            "Casimir_DP": "the ceiling remains far below a measurable exponent in the screened channel",
            "boson_stars": "the close-passage probability is negligible and the reference mass function is assumed, not predicted",
        },
        "limits": [
            "TNG50 percentiles are simulation-ensemble diagnostics, not a Milky Way posterior; the seven-halo subset is only a Milky-Way-like validation subset.",
            "The LZ output is a differential rate factor at one isotope and energy, not an absolute event rate or likelihood; detector response, isotope weak-response weights, backgrounds, and annual modulation are absent.",
            "A thermal IDM relic at the published profile point nearly saturates the adopted total dark-matter density; the required reduced abundance needs a consistent freeze-out calculation and cannot be assumed from this overlay.",
            "The inverse-Omega freeze-out multiplier is only a first-order target; compressed IDM coannihilation makes the actual abundance response parameter-dependent, and the present-day annihilation rate need not scale with it.",
            "The ultralight star population, compact fraction, mass function, and local phase-space distribution are not derived.",
            "No interaction connects the phi and H sectors here beyond a common cosmological abundance budget and gravity; this does not establish a shared microscopic explanation.",
        ],
    }
    out = Path(__file__).with_suffix(".json")
    out.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Point-nucleus upper bound on elastic gravitational Xe recoil events.

Uses Newtonian Rutherford scattering, the IDM LZ benchmark mass, and an
optimally chosen monoenergetic stream. It intentionally maximizes the rate by
using all local DM density, unit detector efficiency, and no nuclear form
factor suppression. It is a diagnostic upper bound, not an LZ prediction.
"""

from __future__ import annotations

import json
import math
from pathlib import Path


G_NEWTON_GEV_MINUS2 = 6.70883e-39
GEV_MINUS2_TO_CM2 = 0.389379e-27
C_KM_S = 299_792.458
M_H_GEV = 1080.0
XE131_MASS_GEV = 131.0 * 0.93149410242
RECOIL_THRESHOLD_KEV = 248.0
LOCAL_DM_DENSITY_GEV_CM3 = 0.4
SPEED_CUTOFF_KM_S = 798.0
EXPOSURE_TONNE_YEAR = 2.84
SECONDS_PER_YEAR = 365.25 * 24.0 * 3600.0
AVOGADRO = 6.02214076e23


def calculate() -> dict[str, float | str]:
    reduced_mass = M_H_GEV * XE131_MASS_GEV / (M_H_GEV + XE131_MASS_GEV)
    recoil_min_gev = RECOIL_THRESHOLD_KEV * 1.0e-6
    v_min = math.sqrt(XE131_MASS_GEV * recoil_min_gev / (2.0 * reduced_mass**2))
    v_cut = SPEED_CUTOFF_KM_S / C_KM_S

    # For an incoming mono-stream at speed v, the rate kernel per unit density
    # above E_min is proportional to (1/v)*(1/E_min - 1/E_max(v)). Its maximum
    # is at E_max=3 E_min, provided that speed lies below the halo cutoff.
    v_opt_unclipped = math.sqrt(3.0) * v_min
    v_opt = min(v_opt_unclipped, v_cut)
    e_max_gev = 2.0 * reduced_mass**2 * v_opt**2 / XE131_MASS_GEV

    # Rutherford d sigma/dE_R = 2 pi (G m_chi m_A)^2 /
    # (m_A v^2 E_R^2). Integrate from threshold to kinematic endpoint.
    sigma_gev_minus2 = (
        2.0 * math.pi * G_NEWTON_GEV_MINUS2**2 * M_H_GEV**2
        * XE131_MASS_GEV / (v_opt**2)
        * (1.0 / recoil_min_gev - 1.0 / e_max_gev)
    )
    sigma_cm2 = sigma_gev_minus2 * GEV_MINUS2_TO_CM2
    number_density_cm3 = LOCAL_DM_DENSITY_GEV_CM3 / M_H_GEV
    flux_cm2_s = number_density_cm3 * v_opt * C_KM_S * 1.0e5
    rate_per_nucleus_s = flux_cm2_s * sigma_cm2
    nuclei_per_tonne = 1.0e6 / 131.0 * AVOGADRO
    expected_events = (
        nuclei_per_tonne * EXPOSURE_TONNE_YEAR * rate_per_nucleus_s
        * SECONDS_PER_YEAR
    )

    result: dict[str, float | str] = {
        "classification": "gravity_only_point_nucleus_rate_upper_bound",
        "inputs": {
            "DM_mass_GeV": M_H_GEV,
            "target": "pure_Xe131_point_nucleus",
            "recoil_threshold_keV": RECOIL_THRESHOLD_KEV,
            "local_density_GeV_cm3": LOCAL_DM_DENSITY_GEV_CM3,
            "speed_support_max_km_s": SPEED_CUTOFF_KM_S,
            "exposure_tonne_year": EXPOSURE_TONNE_YEAR,
            "efficiency": 1.0,
            "nuclear_mass_form_factor": 1.0,
        },
        "outputs": {
            "Xe131_mass_GeV": XE131_MASS_GEV,
            "reduced_mass_GeV": reduced_mass,
            "minimum_speed_km_s": v_min * C_KM_S,
            "rate_maximizing_stream_speed_km_s": v_opt * C_KM_S,
            "maximum_recoil_keV_at_stream_speed": e_max_gev * 1.0e6,
            "integrated_cross_section_above_threshold_cm2": sigma_cm2,
            "predicted_events_in_exposure": expected_events,
        },
        "assumptions_and_limits": [
            "Newtonian point-mass gravitational Rutherford scattering; halo speeds are nonrelativistic.",
            "All local DM is placed in the single speed stream maximizing the rate kernel under the 798 km/s cutoff; this is more favorable than a realistic halo distribution.",
            "Every target nucleus is treated as Xe-131 and pointlike, with unit efficiency; finite nuclear mass form factor and detector cuts can only reduce the high-q rate.",
            "This is ordinary gravity-mediated nuclear recoil, not a coherent force-array search for ultraheavy passing objects.",
            "The calculation does not model the ultralight boson-star component, gamma rays, or Casimir-DP apparatus response.",
        ],
    }
    assert v_min < v_opt < v_cut
    assert expected_events < 1.0e-40
    return result


def main() -> None:
    result = calculate()
    Path(__file__).with_suffix(".json").write_text(
        json.dumps(result, indent=2) + "\n", encoding="utf-8"
    )
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()

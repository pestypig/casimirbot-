"""Screen how directly the published H.E.S.S. IDM limits apply to the LZ fit.

This is an applicability and normalization check, not an indirect-detection
likelihood or an annihilation calculation. Values are transcribed from the
source papers listed in the adjacent Markdown packet.
"""

from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parent

LZ_BENCHMARK = {
    "m_H_GeV": 1080.0,
    "delta_AH_keV": 369.0,
    "delta_charged_GeV": 8.17,
    "source": "https://arxiv.org/html/2609.06571",
}

HESS_SCAN = {
    "m_H_min_GeV": 300.0,
    "m_H_max_GeV": 30000.0,
    "delta_neutral_min_GeV": 0.5,
    "delta_neutral_max_GeV": 10.0,
    "delta_charged_min_GeV": 0.5,
    "delta_charged_max_GeV": 10.0,
    "reported_excluded_mass_min_GeV": 1000.0,
    "reported_excluded_mass_max_GeV": 8000.0,
    "halo_profile": "Einasto",
    "source": "https://arxiv.org/html/2411.05909",
}


def main() -> None:
    delta_lz_gev = LZ_BENCHMARK["delta_AH_keV"] * 1e-6
    gap_factor = HESS_SCAN["delta_neutral_min_GeV"] / delta_lz_gev
    f_phi = 0.10
    f_h = 1.0 - f_phi
    result = {
        "status": "conditional applicability screen; no likelihood recast",
        "lz_benchmark": LZ_BENCHMARK,
        "hess_scan": HESS_SCAN,
        "comparison": {
            "lz_mass_inside_hess_mass_scan": (
                HESS_SCAN["m_H_min_GeV"]
                <= LZ_BENCHMARK["m_H_GeV"]
                <= HESS_SCAN["m_H_max_GeV"]
            ),
            "lz_charged_gap_inside_hess_scan": (
                HESS_SCAN["delta_charged_min_GeV"]
                <= LZ_BENCHMARK["delta_charged_GeV"]
                <= HESS_SCAN["delta_charged_max_GeV"]
            ),
            "lz_neutral_gap_inside_hess_scan": (
                HESS_SCAN["delta_neutral_min_GeV"]
                <= delta_lz_gev
                <= HESS_SCAN["delta_neutral_max_GeV"]
            ),
            "hess_neutral_gap_floor_over_lz_gap": gap_factor,
            "co_traced_h_fraction_assumption": f_h,
            "annihilation_flux_ratio_at_fixed_cross_section_if_co_traced": f_h**2,
        },
        "limitations": [
            "H.E.S.S. paper assumes a benchmark cuspy Einasto Galactic profile; a core can weaken the limits substantially.",
            "The LZ-fit neutral splitting lies below the H.E.S.S. scan floor, so the reported mass exclusion cannot be assigned directly to this point.",
            "The LZ paper's best-fit relic saturates the cosmic dark-matter abundance; a 10% second component requires a new relic calculation.",
            "The 0.81 flux ratio assumes the local heavy-component fraction equals its cosmic fraction and holds the present-day annihilation cross section fixed.",
            "No mapping from the freeze-out rate change to the present-day annihilation rate is made.",
        ],
    }
    assert result["comparison"]["lz_mass_inside_hess_mass_scan"]
    assert result["comparison"]["lz_charged_gap_inside_hess_scan"]
    assert not result["comparison"]["lz_neutral_gap_inside_hess_scan"]
    assert abs(gap_factor - 1355.0135501355014) < 1e-9
    assert abs(result["comparison"]["annihilation_flux_ratio_at_fixed_cross_section_if_co_traced"] - 0.81) < 1e-12
    (ROOT / "casimir-dp-idm-hess-applicability-screen-2026-09-25.json").write_text(
        json.dumps(result, indent=2) + "\n", encoding="utf-8"
    )
    print(json.dumps(result["comparison"], indent=2))


if __name__ == "__main__":
    main()

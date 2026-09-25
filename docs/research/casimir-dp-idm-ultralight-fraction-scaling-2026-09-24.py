"""Conditional abundance-budget and LZ-rate scaling for IDM + ultralight phi.

This is arithmetic on the published IDM profile point, not a coupled Boltzmann
solution, local-halo model, or LZ likelihood reconstruction.
"""

from __future__ import annotations

import json
from pathlib import Path


OMEGA_DM_H2_CENTRAL = 0.1198
OMEGA_DM_H2_SIGMA = 0.0012
OMEGA_H_IDM_BENCHMARK = 0.12014
PHI_FRACTIONS = (0.0, 0.01, 0.05, 0.10, 0.25, 0.50)


def required_h_fraction(phi_fraction: float, omega_dm_h2: float) -> float:
    """Required cosmic H fraction of the total, relative to the IDM benchmark."""
    omega_h_required = (1.0 - phi_fraction) * omega_dm_h2
    return omega_h_required / OMEGA_H_IDM_BENCHMARK


def main() -> None:
    omega_bounds = {
        "minus_1sigma": OMEGA_DM_H2_CENTRAL - OMEGA_DM_H2_SIGMA,
        "central": OMEGA_DM_H2_CENTRAL,
        "plus_1sigma": OMEGA_DM_H2_CENTRAL + OMEGA_DM_H2_SIGMA,
    }
    rows = []
    for f_phi in PHI_FRACTIONS:
        rows.append({
            "phi_fraction_of_total_DM": f_phi,
            "required_omega_H_h2_by_planck_case": {
                name: (1.0 - f_phi) * omega for name, omega in omega_bounds.items()
            },
            "H_abundance_ratio_to_published_IDM_benchmark_by_planck_case": {
                name: required_h_fraction(f_phi, omega)
                for name, omega in omega_bounds.items()
            },
            "conditional_LZ_rate_ratio_if_local_fraction_tracks_cosmic_fraction": {
                name: required_h_fraction(f_phi, omega)
                for name, omega in omega_bounds.items()
            },
        })

    result = {
        "classification": "conditional abundance-budget and linear local-density scaling; not a joint model fit",
        "source": "https://arxiv.org/abs/2609.06571",
        "inputs": {
            "published_IDM_profile_benchmark_omega_H_h2": OMEGA_H_IDM_BENCHMARK,
            "adopted_total_DM_omega_h2_central": OMEGA_DM_H2_CENTRAL,
            "adopted_total_DM_omega_h2_sigma": OMEGA_DM_H2_SIGMA,
            "phi_fraction_grid": list(PHI_FRACTIONS),
        },
        "outputs": rows,
        "interpretation_limits": [
            "The paper's IDM benchmark already supplies essentially all adopted total dark matter; any phi fraction requires a new H abundance calculation.",
            "The conditional LZ rate ratio follows linear scaling with local free-H density at fixed Z-mediated cross section, velocity distribution, detector response, and total local density.",
            "The rate ratio equals the cosmological H fraction only under the explicit co-tracing assumption. Boson stars, diffuse phi, and free H may cluster differently, so local fraction is an independent prediction of structure formation.",
            "The source paper states that a full LZ likelihood reconstruction needs detector-level information that is not public. These rate ratios are not likelihood contours, event-count predictions, or evidence that a reduced fraction is acceptable.",
            "The Planck plus/minus one-sigma cases are a simple uncertainty bracket, not a joint posterior or model-selection calculation.",
        ],
        "next_required_evidence": [
            "A coupled cosmological abundance history yielding Omega_H and Omega_phi without retuning to the LZ event.",
            "A local Galactic decomposition predicting the unbound H density and velocity distribution after phi structure formation.",
            "Public detector-level response or collaboration likelihood inputs to test the rescaled xenon spectrum.",
        ],
    }
    Path(__file__).with_suffix(".json").write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()

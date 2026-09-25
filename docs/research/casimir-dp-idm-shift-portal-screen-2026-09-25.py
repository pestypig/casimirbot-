#!/usr/bin/env python3
"""Freeze-out scale screen for a shift-symmetric IDM--ultralight derivative portal.

Operator: (c/Lambda^2) (d_mu phi* d^mu phi) (H2^dagger H2).
The dimensional estimate tests thermal H H -> phi phi* conversion only; it is
not an integrated relic-density or cold-field formation calculation.
"""

from __future__ import annotations

import json
import math
from pathlib import Path


M_H_GEV = 1080.0
X_FREEZEOUT = 20.0
G_STAR = 106.75
M_PL_GEV = 1.2209e19
WILSON_C = 1.0
TARGET_GAMMA_OVER_H = (1.0, 20.0, 100.0)


def calculate() -> dict[str, object]:
    temperature = M_H_GEV / X_FREEZEOUT
    n_eq = (M_H_GEV * temperature / (2.0 * math.pi)) ** 1.5 * math.exp(-X_FREEZEOUT)
    hubble = 1.66 * math.sqrt(G_STAR) * temperature**2 / M_PL_GEV

    rows = []
    for target in TARGET_GAMMA_OVER_H:
        sigma_v = target * hubble / n_eq
        # sigma v ~ c^2 m_H^2/(64 pi Lambda^4), with O(1) convention
        # uncertainty from the exact IDM component and vertex normalization.
        cutoff = (
            WILSON_C**2 * M_H_GEV**2 / (64.0 * math.pi * sigma_v)
        ) ** 0.25
        expansion = WILSON_C * M_H_GEV**2 / cutoff**2
        rows.append({
            "target_Gamma_over_H": target,
            "sigma_v_GeV_minus2": sigma_v,
            "Lambda_GeV_for_c1": cutoff,
            "Lambda_over_mH": cutoff / M_H_GEV,
            "dimensionless_amplitude_estimate_c_mH2_over_Lambda2": expansion,
            "eft_energy_expansion_mH_over_Lambda": M_H_GEV / cutoff,
        })

    result: dict[str, object] = {
        "classification": "shift_symmetric_derivative_portal_freezeout_scale_diagnostic",
        "operator": "(c/Lambda^2)*(dphi_dagger dphi)*(H2_dagger H2)",
        "inputs": {
            "m_H_GeV": M_H_GEV,
            "x_freezeout": X_FREEZEOUT,
            "T_GeV": temperature,
            "g_star": G_STAR,
            "M_Pl_GeV": M_PL_GEV,
            "Wilson_c": WILSON_C,
            "n_H_equilibrium_GeV3_one_real_degree_MB": n_eq,
            "H_radiation_GeV": hubble,
            "assumed_sigma_v": "c^2*m_H^2/(64*pi*Lambda^4)",
        },
        "outputs": rows,
        "interpretation_limits": [
            "This operator preserves a constant shift symmetry of phi in the zero-mass limit, so it avoids the direct nonderivative portal threshold used in the prior naturalness screen; a UV completion and matching are still required.",
            "Gamma/H=1 is only a contact scale. Gamma/H~x is an order-of-magnitude freeze-out relevance criterion, not a relic-density solution.",
            "HH annihilation produces relativistic phi phi-dagger quanta. It does not produce the cold coherent charged field or boson-star seeds.",
            "At the potentially relevant scale the EFT cutoff is only a few times m_H; resolved-mediator kinematics may be necessary.",
            "The calculation says nothing about a xenon response, gamma-ray spectrum, local halo fraction, or Casimir-DP decoherence rate.",
        ],
    }
    assert rows[0]["Lambda_over_mH"] > rows[1]["Lambda_over_mH"] > rows[2]["Lambda_over_mH"]
    assert 2.0 < rows[1]["Lambda_over_mH"] < 5.0
    return result


def main() -> None:
    result = calculate()
    Path(__file__).with_suffix(".json").write_text(
        json.dumps(result, indent=2) + "\n", encoding="utf-8"
    )
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()

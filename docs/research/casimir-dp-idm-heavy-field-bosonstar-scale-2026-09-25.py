#!/usr/bin/env python3
"""Scale screen: could the LZ inert-doublet scalar itself be a massive boson star?

This is a scaling comparison, not an Einstein-Klein-Gordon solution. It applies
the repulsive quartic, strong-self-interaction complex-scalar maximum-mass
formula to the canonical real-H component using lambda_eff=lambda_2. The IDM
neutral splitting and electroweak/gauge fields mean that this proxy does not
establish a stable IDM soliton.
"""
from __future__ import annotations

import json
import math
from pathlib import Path

M_H_GEV = 1080.0
DELTA_AH_GEV = 369.0e-6
LAMBDA_2 = 4.06
V_HIGGS_GEV = 246.0
M_PLANCK_GEV = 1.22089e19  # unreduced Planck mass, G^{-1/2}
GEV_TO_KG = 1.782661921e-27
M_SUN_KG = 1.98847e30
REFERENCE_CENTRAL_OBJECT_M_SUN = 4.0e6

# IDM convention: m_A^2 - m_H^2 = -lambda_5 v^2.
lambda_5 = (M_H_GEV**2 - (M_H_GEV + DELTA_AH_GEV) ** 2) / V_HIGGS_GEV**2

# Colpi-Shapiro-Wasserman strong quartic limit:
# Mmax ~= 0.22 sqrt(Lambda) Mpl^2/m,
# Lambda=lambda Mpl^2/(4 pi m^2).
Lambda = LAMBDA_2 * M_PLANCK_GEV**2 / (4.0 * math.pi * M_H_GEV**2)
M_MAX_GEV = 0.22 * math.sqrt(Lambda) * M_PLANCK_GEV**2 / M_H_GEV
M_MAX_KG = M_MAX_GEV * GEV_TO_KG
M_MAX_MSUN = M_MAX_KG / M_SUN_KG
CENTRAL_RATIO = REFERENCE_CENTRAL_OBJECT_M_SUN / M_MAX_MSUN

result = {
    "status": "exploratory scale screen; not a field-equation solution",
    "inputs": {
        "m_H_GeV": M_H_GEV,
        "delta_AH_GeV": DELTA_AH_GEV,
        "lambda_2": LAMBDA_2,
        "lambda_5_derived": lambda_5,
        "lambda5_convention": "m_A^2 - m_H^2 = -lambda_5 v^2",
        "lambda_effective_assumption": "lambda_eff=lambda_2 for the H^4/4 term",
        "M_planck_GeV_unreduced": M_PLANCK_GEV,
        "reference_central_object_Msun": REFERENCE_CENTRAL_OBJECT_M_SUN,
    },
    "outputs": {
        "strong_coupling_parameter_Lambda": Lambda,
        "quartic_complex_scalar_Mmax_GeV": M_MAX_GEV,
        "quartic_complex_scalar_Mmax_kg": M_MAX_KG,
        "quartic_complex_scalar_Mmax_Msun": M_MAX_MSUN,
        "reference_object_over_proxy_Mmax": CENTRAL_RATIO,
        "delta_over_m": DELTA_AH_GEV / M_H_GEV,
    },
    "limits": [
        "The mass formula is for a complex scalar with a conserved charge and repulsive quartic self-interaction in the strong-coupling regime.",
        "The IDM H field is real and protected by Z2, not a continuous U(1); lambda_5 splits H and A. Real-field oscillatons and the full electroweak multiplet require their own solutions.",
        "The comparison is a structural scale test only; it does not rule out small IDM condensates or identify the local dark matter population.",
        "Order-one potential-normalization changes affect Mmax by a square-root factor, not the many-orders-of-magnitude gap to a 4e6-solar-mass object.",
    ],
}

out = Path(__file__).with_suffix(".json")
out.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
print(json.dumps(result, indent=2))

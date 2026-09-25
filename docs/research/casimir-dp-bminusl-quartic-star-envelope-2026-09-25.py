#!/usr/bin/env python3
"""Optimistic repulsive-quartic boson-star mass envelope for the B-L scalar mass grid."""
import json
from pathlib import Path

OUT = Path(__file__).with_suffix(".json")
MPL_GEV = 1.22089e19  # non-reduced Planck mass, GeV
GEV_TO_KG = 1.78266192e-27
M_SUN_KG = 1.98847e30
COEFF = 0.062  # strong-repulsion scaling coefficient, convention dependent at O(1)
LAMBDA_EFF_PERT = 4.0 * 3.141592653589793
M_SGR_A = 4.02e6 * M_SUN_KG
M_TEV_GRID = (1.0, 2.0, 3.0, 5.0)


def mass_kaup_kg(mass_gev):
    return 0.633 * MPL_GEV**2 / mass_gev * GEV_TO_KG


def mass_quartic_kg(mass_gev, lambda_eff):
    return COEFF * lambda_eff**0.5 * MPL_GEV**3 / mass_gev**2 * GEV_TO_KG


def lambda_for_target(mass_gev, target_kg):
    return (target_kg / (COEFF * MPL_GEV**3 / mass_gev**2 * GEV_TO_KG)) ** 2


def main():
    rows = []
    for mass_tev in M_TEV_GRID:
        mass_gev = 1e3 * mass_tev
        free = mass_kaup_kg(mass_gev)
        repulsive = mass_quartic_kg(mass_gev, LAMBDA_EFF_PERT)
        rows.append({
            "mS_TeV": mass_tev,
            "free_kaup_max_kg": free,
            "free_kaup_max_solar_masses": free / M_SUN_KG,
            "quartic_upper_envelope_lambda_eff_4pi_kg": repulsive,
            "quartic_upper_envelope_lambda_eff_4pi_solar_masses": repulsive / M_SUN_KG,
            "quartic_fraction_of_SgrA_reference": repulsive / M_SGR_A,
            "lambda_eff_required_for_SgrA_reference": lambda_for_target(mass_gev, M_SGR_A),
        })
    result = {
        "purpose": "Optimistic scale envelope only; not a solution of the gauged, split B-L field equations.",
        "inputs": {
            "mS_TeV": list(M_TEV_GRID),
            "SgrA_reference_mass_solar_masses": 4.02e6,
            "non_reduced_Planck_mass_GeV": MPL_GEV,
            "GeV_to_kg": GEV_TO_KG,
            "solar_mass_kg": M_SUN_KG,
            "strong_quartic_scaling_coefficient": COEFF,
            "chosen_perturbative_comparison_lambda_eff": LAMBDA_EFF_PERT,
            "quartic_convention": "V_quartic=lambda_eff*|phi1|^4/4; the 2026 paper writes lambda1*|phi1|^4/2, hence lambda_eff=2*lambda1.",
        },
        "definitions": {
            "free_complex_scalar_Kaup_scale": "Mmax=0.633*Mpl^2/m",
            "repulsive_quartic_strong_coupling_scale": "Mmax approximately 0.062*sqrt(lambda_eff)*Mpl^3/m^2",
            "required_coupling": "lambda_eff=(Mtarget*m^2/(0.062*Mpl^3))^2",
        },
        "rows": rows,
        "limitations": [
            "The quartic formula assumes a complex scalar with a conserved global charge and minimally coupled Einstein gravity.",
            "The B-L candidate is gauge charged before symmetry breaking; the gauge field and symmetry-breaking sector alter the star equations.",
            "The S/P mass splitting and model interactions can invalidate a stationary single-complex-field ansatz.",
            "lambda_eff=4*pi is a chosen perturbativity comparison, not a universal sharp unitarity bound.",
            "Couplings inferred far above this range are outside the controlled perturbative theory; they are not predictions.",
        ],
    }
    OUT.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()

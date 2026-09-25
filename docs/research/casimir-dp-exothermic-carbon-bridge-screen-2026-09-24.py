"""Conditional exothermic LZ-to-carbon/Casimir-DP rate ceiling.

The LZ normalization is imported from a fermionic phenomenological fit only
as a recoil-level SI contact target. This is not a bosonic UV-complete model,
an LZ likelihood, or a full solid-state response. See the companion note.
Uses only the Python standard library.
"""

from __future__ import annotations

import json
import hashlib
import math
from pathlib import Path


# Natural units: masses/energies in GeV; speeds converted to c where used.
SIGMA_P_FSTAR_CM2 = (0.5e-45, 3.0e-45)
M_X_GEV = (40.0, 60.0, 90.0)
E_XE_KEV = 248.0
A_C = 12.0
M_U_GEV = 0.93149410242
M_P_GEV = 0.93827208816
RHO_DM_GEV_CM3 = 0.3
V_CAP_KM_S = 798.0
C_KM_S = 299_792.458
CARBON_ATOMIC_MASS_KG = 12.0 * 1.66053906660e-27
REGISTERED_ONE_SIGMA_D = 0.005816
CONFIG_RELATIVE_PATH = Path("configs/research/casimir-dp-integrated-feasibility-pilot-stage4-2r.v1.json")
CONFIG_SHA256 = "5a7c4f26968c5ed800e4b1ef7428aabc94a5bcf14e64599b9779d6f940cd8d11"


def reduced_mass(a: float, b: float) -> float:
    return a * b / (a + b)


def evaluate(mchi: float, sigma_p_fstar: float, design: dict[str, float]) -> dict[str, float]:
    m_xe = 131.0 * M_U_GEV
    mu_xe = reduced_mass(mchi, m_xe)
    recoil_gev = E_XE_KEV * 1e-6
    # Exothermic peak E0 = mu_N |delta| / m_N.
    delta_gev = recoil_gev * m_xe / mu_xe

    m_c = A_C * M_U_GEV
    mu_c = reduced_mass(mchi, m_c)
    carbon_peak_kev = (mu_c / m_c) * delta_gev * 1e6
    q_c_gev = math.sqrt(2.0 * m_c * (carbon_peak_kev * 1e-6))

    # Isoscalar, coherent SI contact scaling. Carbon form factor is set to one,
    # which intentionally maximizes the rate at this momentum transfer.
    sigma_c_cm2 = sigma_p_fstar * A_C**2 * (mu_c / M_P_GEV) ** 2
    v_in = V_CAP_KM_S / C_KM_S
    v_out = math.sqrt(v_in * v_in + 2.0 * delta_gev / mu_c)
    v_out_km_s = v_out * C_KM_S

    n_x = RHO_DM_GEV_CM3 / mchi
    n_c = design["mass_kg"] / CARBON_ATOMIC_MASS_KG
    rate_per_carbon_s = n_x * sigma_c_cm2 * (v_out * C_KM_S * 1e5)
    expected_collisions = rate_per_carbon_s * n_c * design["hold_time_s"]
    d_upper = 2.0 * expected_collisions
    return {
        "m_X_GeV": mchi,
        "delta_keV": delta_gev * 1e6,
        "carbon_peak_keV": carbon_peak_kev,
        "carbon_momentum_transfer_GeV": q_c_gev,
        "carbon_qR_for_frozen_sphere": q_c_gev * design["radius_m"] * 1e15 / 0.1973269804,
        "sigma_p_times_fstar_cm2": sigma_p_fstar,
        "sigma_C_times_fstar_cm2_F2eq1": sigma_c_cm2,
        "maximum_exothermic_outgoing_speed_km_s": v_out_km_s,
        "expected_C_collisions_in_frozen_hold": expected_collisions,
        "D_upper_two_perfectly_distinguishable_branches": d_upper,
        "fraction_of_registered_one_sigma_precision": d_upper / REGISTERED_ONE_SIGMA_D,
    }


def main() -> None:
    repo_root = Path(__file__).resolve().parents[2]
    config_path = repo_root / CONFIG_RELATIVE_PATH
    config_bytes = config_path.read_bytes()
    config_sha256 = hashlib.sha256(config_bytes).hexdigest()
    assert config_sha256 == CONFIG_SHA256, "Frozen Stage-4.2R configuration changed; stop and re-audit."
    design = json.loads(config_bytes)["leading_design"]
    rows = [
        evaluate(mchi, sigma, design)
        for mchi in M_X_GEV
        for sigma in SIGMA_P_FSTAR_CM2
    ]
    for mchi in M_X_GEV:
        by_mass = [row for row in rows if row["m_X_GeV"] == mchi]
        assert all(0.0 < row["carbon_peak_keV"] < 2_500.0 for row in by_mass)
        assert by_mass[0]["expected_C_collisions_in_frozen_hold"] < by_mass[1]["expected_C_collisions_in_frozen_hold"]
        assert by_mass[1]["fraction_of_registered_one_sigma_precision"] < 1e-20
    out = {
        "classification": "conditional transfer of phenomenological SI recoil normalization; not a bosonic fit or full material prediction",
        "source": "https://arxiv.org/html/2609.04673v1",
        "inputs": {
            "sigma_p_times_fstar_cm2": list(SIGMA_P_FSTAR_CM2),
            "m_X_GeV": list(M_X_GEV),
            "LZ_recoil_peak_keV": E_XE_KEV,
            "local_total_DM_density_GeV_cm3": RHO_DM_GEV_CM3,
            "speed_support_cap_km_s": V_CAP_KM_S,
            "frozen_configuration_path": CONFIG_RELATIVE_PATH.as_posix(),
            "frozen_configuration_sha256": config_sha256,
            "frozen_C_sphere_mass_kg": design["mass_kg"],
            "frozen_sphere_radius_m": design["radius_m"],
            "frozen_branch_separation_m": design["branch_separation_m"],
            "frozen_hold_s": design["hold_time_s"],
            "registered_one_sigma_D_precision": REGISTERED_ONE_SIGMA_D,
            "carbon_nuclear_form_factor_squared": 1.0,
        },
        "outputs": rows,
        "calculation": {
            "peak_relation": "E0 = mu_XN * abs(delta) / m_N",
            "carbon_cross_section": "sigma_p*fstar * A_C^2 * (mu_XC/mu_Xp)^2 * F_C(q)^2",
            "flux_rate": "(rho_X/m_X) * sigma_C*fstar * sqrt(v_cap^2 + 2*abs(delta)/mu_XC)",
            "D_bound": "2 * expected independent carbon collisions; ignores branch-phase suppression",
        },
        "interpretation_limits": [
            "The source paper fits a pseudo-Dirac fermion. Its sigma_p*fstar is transferred only as a conditional SI recoil-level normalization; no scalar amplitude matching has been derived.",
            "The source sideband inference assumes the published NR efficiency plateaus into a high-energy region beyond the calibrated WIMP ROI. It is not an official detector-level exclusion.",
            "Local excited-state density is represented by the fitted product rho*fstar*sigma_p with total rho_DM=0.3 GeV/cm^3; no bosonic relic or excited-fraction history is calculated.",
            "Carbon F_C^2=1 and D per collision=2 are deliberately generous independent-nucleus ceilings. Screening, material structure, finite form factors, and actual branch-phase kernels can only change this benchmark and need dedicated response work.",
            "This is not a Casimir apparatus prediction, DP collapse calculation, or evidence that the LZ event is dark matter.",
        ],
    }
    Path(__file__).with_suffix(".json").write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(out, indent=2))


if __name__ == "__main__":
    main()

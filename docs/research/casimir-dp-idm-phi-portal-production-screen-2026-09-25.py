"""Test whether freeze-out IDM annihilation can populate cold ultralight phi."""
from __future__ import annotations

import hashlib
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
INPUT = HERE / "casimir-dp-idm-phi-four-observable-gate-2026-09-25.json"
OUT = Path(__file__).with_suffix(".json")

# Frozen benchmark values from the upstream four-observable packet.
M_H_GEV = 1080.0
M_PHI_EV = 1.0e-17
X_F_RANGE = (20.0, 30.0)
GSTAR_S_RANGE = (86.25, 106.75)
GSTAR_S_0 = 3.91
T_CMB_0_EV = 2.348e-4
Z_EQ = 3402.0
M_PLANCK_GEV = 1.22089e19


def redshift_momentum(p_prod_ev: float, t_prod_ev: float, gstar_s_prod: float) -> float:
    """Adiabatic entropy-conserving redshift of physical momentum."""
    return p_prod_ev * T_CMB_0_EV / t_prod_ev * (GSTAR_S_0 / gstar_s_prod) ** (1.0 / 3.0)


def required_production_temperature_ev(
    p_prod_ev: float, target_p_ev: float, gstar_s_prod: float
) -> float:
    """T_prod needed to redshift p_prod below target_p by today."""
    return p_prod_ev * T_CMB_0_EV / target_p_ev * (GSTAR_S_0 / gstar_s_prod) ** (1.0 / 3.0)


def main() -> None:
    upstream_bytes = INPUT.read_bytes()
    upstream = json.loads(upstream_bytes)
    assert upstream["gates"]["xenon_recoil"]["m_H_GeV"] == M_H_GEV
    assert upstream["gates"]["star_structure_and_population"]["phi_mass_eV"] == M_PHI_EV
    assert upstream["gates"]["abundance_and_local_population"]["required_H_relic_reduction_fraction"] > 0.10

    rows = []
    # H H* -> phi phi* at nonrelativistic freeze-out: each outgoing phi has
    # energy and momentum approximately m_H. The x_f and g*s ranges are
    # sensitivity brackets, not a dedicated IDM Boltzmann solution.
    for x_f in X_F_RANGE:
        t_freezeout_gev = M_H_GEV / x_f
        for gstar_s in GSTAR_S_RANGE:
            p0 = redshift_momentum(
                M_H_GEV * 1.0e9,
                t_freezeout_gev * 1.0e9,
                gstar_s,
            )
            p_eq = p0 * (1.0 + Z_EQ)
            rows.append({
                "x_freezeout": x_f,
                "gstar_s_freezeout": gstar_s,
                "T_freezeout_GeV": t_freezeout_gev,
                "p_phi_today_eV": p0,
                "p_phi_today_over_mphi": p0 / M_PHI_EV,
                "p_phi_equality_eV": p_eq,
                "p_phi_equality_over_mphi": p_eq / M_PHI_EV,
            })

    # At the most favorable standard freeze-out corner, test whether a product
    # can even be nonrelativistic by matter-radiation equality.
    t_req_cold_today = required_production_temperature_ev(
        M_H_GEV * 1.0e9, M_PHI_EV, sum(GSTAR_S_RANGE) / 2.0
    )
    t_req_cold_equality = required_production_temperature_ev(
        M_H_GEV * 1.0e9,
        M_PHI_EV / (1.0 + Z_EQ),
        sum(GSTAR_S_RANGE) / 2.0,
    )
    payload = {
        "classification": "conditional_minimal_portal_kinematic_screen",
        "minimal_connector": "lambda_phiH |phi|^2 H^dagger H",
        "reaction_tested": "H Hbar -> phi phi-star after nonrelativistic chemical freeze-out",
        "inputs": {
            "upstream_four_observable_packet_sha256": hashlib.sha256(upstream_bytes).hexdigest(),
            "m_H_GeV": M_H_GEV,
            "m_phi_eV": M_PHI_EV,
            "x_freezeout_bracket": list(X_F_RANGE),
            "gstar_s_freezeout_bracket": list(GSTAR_S_RANGE),
            "gstar_s_today": GSTAR_S_0,
            "T_CMB_today_eV": T_CMB_0_EV,
            "z_equality": Z_EQ,
        },
        "rows": rows,
        "required_production_temperature_GeV": {
            "to_be_nonrelativistic_today": t_req_cold_today / 1.0e9,
            "to_be_nonrelativistic_by_equality": t_req_cold_equality / 1.0e9,
            "Planck_mass_GeV": M_PLANCK_GEV,
        },
        "checks": {
            "all_freezeout_products_relativistic_today": all(r["p_phi_today_over_mphi"] > 1.0e10 for r in rows),
            "all_freezeout_products_relativistic_at_equality": all(r["p_phi_equality_over_mphi"] > 1.0e10 for r in rows),
            "equality_cold_threshold_above_planck_mass": t_req_cold_equality / 1.0e9 > M_PLANCK_GEV,
            "upstream_relic_overlays_need_fresh_calculation": True,
        },
        "limits": [
            "This is a redshift/kinematics screen, not a portal cross-section or coupled Boltzmann calculation.",
            "It tests freeze-out annihilation products only; earlier production, late decays, coherent conversion, and separate misalignment are different histories.",
            "The freeze-out brackets are illustrative; the IDM point includes coannihilation and needs a model-specific thermal history.",
            "The result does not calculate dark-radiation constraints, the phi condensate, star formation, gamma spectra, xenon likelihood, or Casimir-DP response.",
        ],
    }
    assert all(payload["checks"].values())
    OUT.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(payload, indent=2))


if __name__ == "__main__":
    main()

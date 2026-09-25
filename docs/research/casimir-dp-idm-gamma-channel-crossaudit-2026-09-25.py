"""Cross-check IDM LZ benchmark against supplied gamma-ray mass/channel claims."""
from __future__ import annotations

import hashlib
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
GATE = HERE / "casimir-dp-idm-phi-four-observable-gate-2026-09-25.json"
GAMMA_INTAKE = HERE / "casimir-dp-dark-matter-annihilation-paper-intake-2026-09-24.md"
OUT = Path(__file__).with_suffix(".json")
M_H_GEV = 1080.0
Z_MASS_GEV = 91.1876
MW_CONTINUUM_GEV = (500.0, 800.0)
CLUSTER_LINE_GEV = 43.2
F_H = 0.9


def main() -> None:
    gate_bytes = GATE.read_bytes()
    gamma_bytes = GAMMA_INTAKE.read_bytes()
    gate = json.loads(gate_bytes)
    assert gate["gates"]["xenon_recoil"]["m_H_GeV"] == M_H_GEV
    assert gate["gates"]["abundance_and_local_population"]["local_H_fraction_if_cosmically_co_traced"] == F_H

    continuum_ratio = [M_H_GEV / MW_CONTINUUM_GEV[1], M_H_GEV / MW_CONTINUUM_GEV[0]]
    line_ann_gg = M_H_GEV
    line_ann_gz = M_H_GEV * (1.0 - Z_MASS_GEV**2 / (4.0 * M_H_GEV**2))
    two_photon_decay_energy = M_H_GEV / 2.0
    payload = {
        "classification": "source_audited_gamma_compatibility_crosscheck_not_flux_fit",
        "inputs": {
            "idm_gate_json_sha256": hashlib.sha256(gate_bytes).hexdigest(),
            "user_gamma_intake_sha256": hashlib.sha256(gamma_bytes).hexdigest(),
            "m_H_GeV": M_H_GEV,
            "user_MW_bbar_mass_range_GeV": list(MW_CONTINUUM_GEV),
            "cluster_line_energy_GeV": CLUSTER_LINE_GEV,
            "co_traced_heavy_fraction_illustration": F_H,
        },
        "derived": {
            "m_H_over_continuum_mass_range": continuum_ratio,
            "idm_gamma_gamma_annihilation_line_GeV": line_ann_gg,
            "idm_gamma_Z_annihilation_line_GeV": line_ann_gz,
            "two_photon_decay_line_energy_GeV": two_photon_decay_energy,
            "annihilation_J_factor_ratio_if_H_co_traces_with_constant_fraction": F_H**2,
        },
        "source_findings": {
            "idm_paper_uses_micromegas_and_combined_dwarf_constraints": True,
            "idm_paper_reports_a_complete_1080_GeV_channel_spectrum_or_numeric_sigma_v": False,
            "idm_lz_profile_bestfit_mH_GeV": 1080.0,
            "idm_lz_profile_bestfit_delta_keV": 369.0,
            "direct_gamma_line_compatibility": "not_supported by standard direct line kinematics at this mass",
            "MW_bbar_excess_compatibility": "not established; mass interval differs and the IDM point's channel-resolved present-day spectrum is not supplied",
        },
        "limits": [
            "Line energies are kinematic comparators only; no branching fractions or loop line rates are calculated.",
            "The constant local fraction f_H scaling is illustrative; actual annihilation prediction requires rho_H(r) squared along each line of sight.",
            "The IDM paper's scan applies combined dwarf-spheroidal constraints and uses micrOMEGAs, but does not supply a reusable channel-resolved spectrum or numeric present-day cross section for the profile point in its text/tables.",
            "The supplied gamma papers report separate, model-dependent signals and do not establish a common halo or particle model.",
        ],
    }
    assert M_H_GEV > MW_CONTINUUM_GEV[1]
    assert line_ann_gz > 1000.0 and two_photon_decay_energy > 500.0
    assert abs(payload["derived"]["annihilation_J_factor_ratio_if_H_co_traces_with_constant_fraction"] - 0.81) < 1e-12
    OUT.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(payload, indent=2))


if __name__ == "__main__":
    main()

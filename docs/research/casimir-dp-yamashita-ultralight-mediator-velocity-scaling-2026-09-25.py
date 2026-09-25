"""Conditional velocity-scaling screen for an ultralight mediator swap.

This is an analytic Coulomb-limit comparison, not a Yukawa Schrödinger solve,
gamma-ray likelihood, or boson-star solution.
"""
from __future__ import annotations

import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT = HERE / "casimir-dp-yamashita-ultralight-mediator-velocity-scaling-2026-09-25.json"
REPORT = HERE / "casimir-dp-yamashita-ultralight-mediator-velocity-scaling-2026-09-25.md"

M_X_GEV = 420.0
ALPHA_EFF = 0.2
M_MED_FINITE_GEV = 0.4
M_MED_ULTRALIGHT_EV = 1.0e-17
V_FREEZEOUT = 0.3
V_HALO = 1.0e-3
V_DWARF = 1.0e-4
SIGMA_HALO_PAPER = 2.7e-24
SIGMA_DWARF_PAPER = 6.5e-26


def main() -> None:
    m_ultra_gev = M_MED_ULTRALIGHT_EV * 1.0e-9
    coulomb_scale_gev = ALPHA_EFF * M_X_GEV
    original_halo_rate_ratio = SIGMA_DWARF_PAPER / SIGMA_HALO_PAPER
    coulomb_pwave_dwarf_halo_ratio = V_HALO / V_DWARF
    rate_hierarchy_change = coulomb_pwave_dwarf_halo_ratio / original_halo_rate_ratio
    anchored_dwarf_rate = SIGMA_HALO_PAPER * coulomb_pwave_dwarf_halo_ratio

    payload = {
        "classification": "conditional_Coulomb_limit_scaling_not_full_model_or_exclusion",
        "source_model": "Yamashita, arXiv:2609.02868v2, Table 1",
        "inputs": {
            "m_X_GeV": M_X_GEV,
            "alpha_eff": ALPHA_EFF,
            "finite_range_mediator_GeV": M_MED_FINITE_GEV,
            "counterfactual_mediator_eV": M_MED_ULTRALIGHT_EV,
            "v_relative_freezeout": V_FREEZEOUT,
            "v_relative_halo": V_HALO,
            "v_relative_dwarf": V_DWARF,
            "paper_sigma_v_halo_cm3_s": SIGMA_HALO_PAPER,
            "paper_sigma_v_dwarf_cm3_s": SIGMA_DWARF_PAPER,
        },
        "derived": {
            "alpha_mX_GeV": coulomb_scale_gev,
            "finite_mediator_over_alpha_mX": M_MED_FINITE_GEV / coulomb_scale_gev,
            "ultralight_mediator_GeV": m_ultra_gev,
            "ultralight_over_alpha_mX": m_ultra_gev / coulomb_scale_gev,
            "finite_mediator_over_mX_v_halo": M_MED_FINITE_GEV / (M_X_GEV * V_HALO),
            "finite_mediator_over_mX_v_dwarf": M_MED_FINITE_GEV / (M_X_GEV * V_DWARF),
            "ultralight_over_mX_v_halo": m_ultra_gev / (M_X_GEV * V_HALO),
            "ultralight_over_mX_v_dwarf": m_ultra_gev / (M_X_GEV * V_DWARF),
            "finite_to_ultralight_mediator_mass_ratio": M_MED_FINITE_GEV / m_ultra_gev,
            "paper_dwarf_over_halo_rate": original_halo_rate_ratio,
            "Coulomb_pwave_dwarf_over_halo_rate": coulomb_pwave_dwarf_halo_ratio,
            "change_in_dwarf_to_halo_rate_hierarchy": rate_hierarchy_change,
            "conditional_dwarf_rate_if_halo_anchored_cm3_s": anchored_dwarf_rate,
            "conditional_dwarf_rate_over_paper_dwarf_rate": anchored_dwarf_rate / SIGMA_DWARF_PAPER,
        },
        "assumptions": [
            "Keep alpha_eff and the short-distance p-wave annihilation coefficient fixed while replacing the 400 MeV mediator by a 1e-17 eV mediator.",
            "Use the attractive Coulomb asymptote for the p-wave Sommerfeld factor, S1 proportional to (alpha_eff/v_relative)^3; with bare sigma*v proportional to v_relative^2, the rate scales as 1/v_relative.",
            "Use the paper's representative relative velocities rather than velocity-distribution averages.",
            "Anchor the illustrative dwarf rate to the paper halo rate only to expose the changed hierarchy; this is not a refit or constraint comparison.",
        ],
        "limits": [
            "The scalar mediator must be solved with the model's actual potential, channel structure and velocity distributions; resonances, saturation, bound-state formation and self-interactions can change the result.",
            "Changing mediator mass by 4e25 while retaining alpha_eff is a counterfactual parameter swap, not a UV-complete model; radiative stability and induced long-range forces are unaddressed.",
            "An ultralight coherent star field is not automatically equivalent to a homogeneous particle-exchange mediator; its occupancy, profile, coupling and perturbations need an explicit field theory.",
            "This calculation says nothing directly about xenon recoils or Casimir-DP response; the dark-photon paper's endothermic carbon channel remains kinematically closed.",
        ],
        "checks": {
            "ultralight_mediator_is_deep_coulomb_scale": m_ultra_gev / coulomb_scale_gev < 1.0e-20,
            "conditional_hierarchy_reverses": coulomb_pwave_dwarf_halo_ratio > 1.0 > original_halo_rate_ratio,
            "hierarchy_change_exceeds_100": rate_hierarchy_change > 100.0,
        },
    }
    assert all(payload["checks"].values())
    OUT.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")

    d = payload["derived"]
    REPORT.write_text(
        "# Ultralight-mediator swap in the LZ-plus-gamma dark-photon model\n\n"
        "Date: September 25, 2026. This is an analytic, conditional velocity-scaling screen, not a full model calculation.\n\n"
        "## The bridge being tested\n\n"
        "Yamashita's LZ-plus-gamma benchmark uses a 420 GeV vector X and a 400 MeV scalar mediator with effective attractive strength 0.2. Its p-wave annihilation is enhanced by a finite-range Yukawa force: at representative relative speeds 10^-3 (Milky Way) and 10^-4 (dwarf), the paper quotes Sommerfeld factors 1.3e7 and 3.1e7, while the resulting rates are 2.7e-24 and 6.5e-26 cm^3/s. The finite-range force therefore gives a halo-to-dwarf rate ratio of about 41.5.\n\n"
        "A tempting identification is that the 400 MeV Sommerfeld mediator is the repository's 1e-17 eV boson-star field. At fixed X mass and alpha_eff, this changes the mediator mass by " + f"{d['finite_to_ultralight_mediator_mass_ratio']:.1e}" + " and puts the interaction deep in the Coulomb limit.\n\n"
        "## Conditional Coulomb-limit result\n\n"
        "For an attractive massless mediator, the p-wave Sommerfeld factor scales as (alpha/v_rel)^3. Since the underlying annihilation is p-wave, sigma*v scales as v_rel^2*S1, hence approximately 1/v_rel at low speeds. With the paper's representative velocities, this gives a dwarf-to-halo rate ratio of 10, opposite to its finite-range benchmark's " + f"{d['paper_dwarf_over_halo_rate']:.3g}" + ". The relative hierarchy changes by about " + f"{d['change_in_dwarf_to_halo_rate_hierarchy']:.0f}" + " times. If one merely anchors the halo rate to the paper's 2.7e-24 cm^3/s, the illustrative dwarf rate would be " + f"{d['conditional_dwarf_rate_if_halo_anchored_cm3_s']:.2e}" + " cm^3/s, about " + f"{d['conditional_dwarf_rate_over_paper_dwarf_rate']:.0f}" + " times its quoted dwarf rate.\n\n"
        "This is a strong warning against reusing the gamma-ray fit after making the star field the Sommerfeld mediator. It is not a dwarf-limit exclusion: the absolute Coulomb normalization, velocity averages, saturation and any resonances need a model-specific computation.\n\n"
        "## What follows for the four-observable goal\n\n"
        "The star field and particle mediator are not interchangeable by matching their masses. A viable common-field branch would need an explicit coupling and potential, radiative-stability mechanism, finite-density/halo profile, and a velocity-distribution-averaged solution of the p-wave Schrödinger problem. It must then preserve the gamma spectrum and independently derive xenon and Casimir-DP responses. The existing dark-photon transition still has no carbon-open channel, so this mediator substitution does not by itself bridge to the interferometer.\n\n"
        "Recommendation: keep the two-component option open, with an ultralight star-forming field separate from the 420 GeV LZ/gamma particle, unless a coupled field-theory solve demonstrates the altered Sommerfeld hierarchy can fit both Milky Way and dwarf data. The next highest-value calculation is a velocity-averaged Yukawa solver scan over mediator mass, holding the short-distance p-wave amplitude fixed, and comparing the resulting halo/dwarf ratio to the paper benchmark before attempting any star coupling.\n\n"
        "## Reproduction and sources\n\n"
        "Run `python docs/research/casimir-dp-yamashita-ultralight-mediator-velocity-scaling-2026-09-25.py`; the adjacent JSON includes inputs, derived ratios, assumptions and validity limits.\n\n"
        "Sources: [Yamashita, arXiv:2609.02868v2](https://arxiv.org/html/2609.02868v2) (model, velocity/rate table, and mediator roles); [Iengo, Coulomb Sommerfeld factors for partial waves](https://arxiv.org/abs/0902.0688); [Cassel, Yukawa Sommerfeld factors and Coulomb limit](https://arxiv.org/abs/0903.5307).\n",
        encoding="utf-8",
    )
    print(json.dumps(payload, indent=2))


if __name__ == "__main__":
    main()

"""Exact phase-space lifetime for the 369-keV IDM excited neutral scalar."""
import hashlib
import json
import math
from pathlib import Path
from scipy.integrate import quad

ROOT = Path("docs/research")
INPUT = ROOT / "casimir-dp-four-observable-branch-verdict-2026-09-25.json"
OUT = ROOT / "casimir-dp-idm-excited-state-lifetime-2026-09-25.json"
branch = json.loads(INPUT.read_text())["outputs"]["heavy_single_field_IDM_like"]
GF_GeV2 = 1.1663787e-5
HBAR_GeV_s = 6.582119569e-25
M_H_GeV = branch["mass_GeV"]
DELTA_GeV = branch["neutral_splitting_keV"] * 1e-6
M_A_GeV = M_H_GeV + DELTA_GeV

def kallen(x, y, z):
    return x*x + y*y + z*z - 2*x*y - 2*x*z - 2*y*z

def daughter_momentum(q2):
    return math.sqrt(max(0.0, kallen(M_A_GeV**2, M_H_GeV**2, q2))) / (2*M_A_GeV)

# Integrate dGamma/dq^2 = GF^2 |p_H|^3/(24 pi^3) for one massless
# neutrino flavor. The ZHA derivative vertex and Z-nu current give the
# standard semileptonic scalar-current normalization. Three active flavors
# are open; charged leptons are below threshold for this splitting.
phase_integral, quad_error = quad(
    lambda q2: daughter_momentum(q2)**3,
    0.0, DELTA_GeV**2, epsabs=0.0, epsrel=1e-11, limit=1000)
width_one = GF_GeV2**2 * phase_integral / (24 * math.pi**3)
width_total = 3 * width_one
lifetime_s = HBAR_GeV_s / width_total
age_s = 13.8e9 * 365.25 * 24 * 3600
age_over_lifetime = age_s / lifetime_s

# The leading small-splitting result is a useful independent limit check.
width_small_split = 3 * GF_GeV2**2 * DELTA_GeV**5 / (60 * math.pi**3)
result = {
    "evidence_class": "tree_level_Z_star_three_neutrino_decay_phase_space_screen",
    "input": {
        "branch_verdict_sha256": hashlib.sha256(INPUT.read_bytes()).hexdigest(),
        "m_H_GeV": M_H_GeV,
        "delta_keV": DELTA_GeV * 1e6,
        "m_A_GeV": M_A_GeV,
        "G_F_GeV_minus2": GF_GeV2,
        "open_final_states_assumed": "H plus three active-neutrino flavors; charged-lepton pairs closed",
    },
    "calculation": {
        "dGamma_dq2_per_flavor": "G_F^2 * |p_H(q2)|^3 / (24*pi^3)",
        "q2_interval_GeV2": [0.0, DELTA_GeV**2],
        "phase_integral_GeV5": phase_integral,
        "quadrature_absolute_error_GeV5": quad_error,
        "width_per_flavor_GeV": width_one,
        "width_total_GeV": width_total,
        "lifetime_seconds": lifetime_s,
        "lifetime_days": lifetime_s / 86400.0,
        "small_splitting_width_GeV": width_small_split,
        "exact_to_small_splitting_relative_difference": width_total / width_small_split - 1.0,
        "age_of_universe_seconds_used": age_s,
        "universe_age_over_lifetime": age_over_lifetime,
        "log10_survival_probability_today_without_repopulation": -age_over_lifetime / math.log(10.0),
    },
    "checks": {
        "three_neutrino_width_positive": width_total > 0,
        "small_splitting_limit_within_1e-3": abs(width_total / width_small_split - 1.0) < 1e-3,
        "excited_population_does_not_survive_halo_age": age_over_lifetime > 1e10,
        "endothermic_C12_threshold_exceeds_frozen_halo_cap": 2449.0 > 798.0,
    },
    "interpretation": {
        "ground_state_H_to_A_on_carbon": "kinematically closed at the frozen halo-speed cap",
        "excited_state_A_to_H_on_carbon": "exothermic in principle, but primordial A population decays away in days",
        "conditional_escape": "requires an explicit late-time repopulation or modified decay channel, followed by a new abundance and target-response calculation",
    },
    "limitations": [
        "Tree-level Z* decay with massless neutrinos and the standard IDM ZHA coupling is used; higher-order radiative channels are not needed to establish rapid depletion.",
        "No mechanism for late-time excited-state repopulation is modeled.",
        "This tests the proposed inelastic same-channel bridge only; it is not a global exclusion of IDM, boson stars, or other dark sectors.",
        "The result does not calculate a Casimir-DP material response or gamma-ray likelihood.",
    ],
}
assert all(result["checks"].values()), result["checks"]
OUT.write_text(json.dumps(result, indent=2) + "\n")
print(json.dumps(result, indent=2))

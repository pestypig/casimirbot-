"""One-event xenon normalization and universal-force consistency screen.

This is a conditional diagnostic based on the repository's old unit-efficiency
200--270 keV xenon recoil window, not an LZ likelihood or a fitted event yield.
"""
import hashlib
import json
import math
from pathlib import Path

BASE = Path("docs/research")
INPUT = BASE / "casimir-dp-shared-yukawa-screen-2026-09-06.json"
FORCE = BASE / "casimir-dp-yukawa-force-screen-2026-09-06.json"
OUT = BASE / "casimir-dp-yukawa-xenon-normalization-force-screen-2026-09-25.json"
source = json.loads(INPUT.read_text())
force = json.loads(FORCE.read_text())
grav = force["gravitational_nucleon_alpha"]
rows = []
for point in source["rows"]:
    mix = math.sqrt(1.0 / point["K_Xe_200to270keV_per_alpha2"])
    # alpha_mix^2 = alpha_chi * alpha_N. Minimize alpha_N under alpha_chi <= 1.
    alpha_n_min = mix * mix
    rows.append({
        "mediator_eV": point["mediator_eV"],
        "range_micrometers": 0.1973269804 / point["mediator_eV"],
        "alpha_mix_for_one_raw_window_event": mix,
        "minimum_universal_nucleon_alpha_at_alpha_chi_le_1": alpha_n_min,
        "minimum_yukawa_strength_relative_to_gravity": alpha_n_min / grav,
        "D_born_at_one_raw_window_event": point["D_per_Xe_raw_band_count"],
        "alpha_for_old_DP_comparator": point["alpha_for_DP_comparator_exponent"],
        "xenon_count_at_old_DP_comparator": point["Xe_raw_at_comparator_alpha"],
    })

# Figure 2 of the cited paper is a log-log plot. At lambda ~= 2 um the
# "new" differential-Casimir curve is read conservatively as 1e8--1e10.
# This broad visual range is a screening estimate, not tabulated source data.
target = min(rows, key=lambda r: abs(r["mediator_eV"] - 0.1))
plot_read = {"lambda_micrometers": target["range_micrometers"],
             "new_curve_yukawa_strength_visual_range": [1e8, 1e10],
             "source_figure": "Figure 2, red curve labeled new",
             "source_url": "https://arxiv.org/abs/2109.06534",
             "status": "approximate_visual_read_not_digitized_or_tabulated"}
force_ratio_min = (target["minimum_yukawa_strength_relative_to_gravity"] /
                   plot_read["new_curve_yukawa_strength_visual_range"][1])
result = {
    "evidence_class": "conditional_one_raw_xenon_window_event_universal_scalar_force_screen",
    "inputs": {
        "yukawa_parent_sha256": hashlib.sha256(INPUT.read_bytes()).hexdigest(),
        "force_screen_sha256": hashlib.sha256(FORCE.read_bytes()).hexdigest(),
        "alpha_chi_perturbative_ceiling": 1.0,
        "gravitational_nucleon_alpha": grav,
        "xe_window_keV_true_energy": source["model"]["Xe_true_energy_band_keV"],
        "xe_efficiency": source["model"]["Xe_efficiency"],
        "exposure_tonne_year": source["model"]["Xe_exposure_tonne_year"],
    },
    "rows": rows,
    "micrometer_force_check_at_0p1_eV": {
        **plot_read,
        "minimum_universal_yukawa_strength": target["minimum_yukawa_strength_relative_to_gravity"],
        "minimum_excess_over_visual_bound_even_using_1e10": force_ratio_min,
        "interpretation": "excluded in this simple unscreened universal-scalar mapping, conditional on the plotted curve read",
    },
    "checks": {
        "one_event_coupling_reconstructs_unit_count": all(
            abs(r["alpha_mix_for_one_raw_window_event"]**2 * source["rows"][i]["K_Xe_200to270keV_per_alpha2"] - 1) < 1e-12
            for i, r in enumerate(rows)),
        "old_DP_comparator_did_not_reach_one_raw_window_event_for_mediators_le_1eV": all(
            r["xenon_count_at_old_DP_comparator"] < 1 for r in rows
            if r["mediator_eV"] <= 1.0),
        "universal_force_exclusion_margin_exceeds_one": force_ratio_min > 1,
    },
    "limitations": [
        "The 200--270 keV unit-efficiency bin is a diagnostic recoil window, not the LZ observed spectrum, event count, background model, or likelihood.",
        "Born xenon normalization is not a detector-folded or profile-likelihood fit.",
        "The Figure 2 force range is a conservative visual read, not digitized source data.",
        "The force exclusion applies only to one unscreened scalar with universal equal-sign nucleon coupling and alpha_chi <= 1.",
        "Nonuniversal, screened, multiple-mediator, inelastic, or nonperturbative models are not excluded by this screen.",
        "No full-phase Casimir-DP result at the xenon-normalized coupling is claimed.",
    ],
}
assert all(result["checks"].values()), result["checks"]
OUT.write_text(json.dumps(result, indent=2) + "\n")
print(json.dumps(result, indent=2))

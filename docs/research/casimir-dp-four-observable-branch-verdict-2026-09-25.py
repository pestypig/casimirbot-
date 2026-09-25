#!/usr/bin/env python3
"""Synthesize existing reproducible bosonic branch screens without refitting them."""
import json
import math
from pathlib import Path

ROOT = Path(__file__).parent
OUT = Path(__file__).with_suffix(".json")


def read_json(name):
    return json.loads((ROOT / name).read_text(encoding="utf-8"))


def main():
    free = read_json("casimir-dp-bosonic-free-field-scaling-2026-09-24.json")
    grav = read_json("casimir-dp-idm-gravity-only-xenon-screen-2026-09-25.json")
    heavy = read_json("casimir-dp-idm-heavy-field-bosonstar-scale-2026-09-25.json")
    overlay = read_json("casimir-dp-bosonic-two-component-observable-overlay-2026-09-25.json")
    encounters = read_json("casimir-dp-boson-star-local-encounter-screen-2026-09-25.json")

    light_benchmark = free["benchmarks"][0]
    light_star = free["ultralight_SgrA_benchmark"]
    heavy_star = heavy["outputs"]
    f10 = next(row for row in overlay["outputs_by_f_phi"] if row["f_phi_cosmic_assumed"] == 0.1)
    f0 = next(row for row in overlay["outputs_by_f_phi"] if row["f_phi_cosmic_assumed"] == 0.0)
    mw_7 = f10["conditional_LZ_rate_ratio_to_IDM_SHM_profile_by_halo_sample"]["scaled_MW_like_7"]
    encounter_case = next(
        row for row in encounters["cases"]
        if row["local_rho_total_GeV_cm3"] == 0.4
        and row["local_compact_object_fraction_assumed"] == 0.1
        and row["relative_speed_km_s"] == 220.0
    )

    dp_sigma = 0.005816050749546031
    dp_snr5_visibility = 0.029080253747730156
    d_multi = f10["Casimir_DP_exponent_ceiling_if_same_H_kernel"]
    d_heavy = f0["Casimir_DP_exponent_ceiling_if_same_H_kernel"]
    outputs = {
        "ultralight_single_field": {
            "mass_eV": light_star["field_mass_eV"],
            "free_field_max_star_mass_Msun": light_star["free_field_max_star_mass_solar"],
            "reference_SgrA_mass_Msun": light_star["SgrA_mass_solar"],
            "star_scale_ratio": light_star["max_mass_to_SgrA_ratio"],
            "maximum_elastic_Xe_recoil_keV_at_assumed_speed_cap": light_benchmark["elastic_Xe129_max_recoil_keV_at_798_km_s"],
            "43_GeV_photon_annihilation_channel": "kinematically unavailable for this constituent mass",
            "star_population": "free-field maximum is an order-of-magnitude mass-scale match only; no Milky Way object abundance or local encounter history is inferred",
            "Casimir_DP": "no matter-coupling or coherent-field phase/noise response follows from the free-star mass match",
            "verdict": "passes only the illustrative galactic-star mass-scale gate; fails ordinary xenon nuclear-recoil kinematics and cannot explain the tens-of-GeV gamma features through standard pair annihilation",
        },
        "heavy_single_field_IDM_like": {
            "mass_GeV": heavy["inputs"]["m_H_GeV"],
            "neutral_splitting_keV": heavy["inputs"]["delta_AH_GeV"] * 1e6,
            "gamma_channel_status": "the LZ benchmark does not provide a joint fit to the supplied 43 GeV line or 0.5-0.8 TeV b-bbar continuum interpretations",
            "quartic_star_proxy_max_Msun": heavy_star["quartic_complex_scalar_Mmax_Msun"],
            "reference_SgrA_over_proxy": heavy_star["reference_object_over_proxy_Mmax"],
            "gravity_only_LZ_events_upper_bound_in_exposure": grav["outputs"]["predicted_events_in_exposure"],
            "Casimir_DP_exponent_ceiling_if_same_H_kernel": d_heavy,
            "verdict": "the specified inelastic electroweak channel can address LZ recoil kinematics; gravity alone gives negligible events, the tested quartic star proxy misses SgrA by 13.36 orders, and the same-scattering Casimir signal is far below precision",
        },
        "two_component_phi_plus_heavy_H": {
            "m_phi_eV": overlay["model"]["phi_mass_eV"] if "phi_mass_eV" in overlay["model"] else 1e-17,
            "m_H_GeV": overlay["model"]["H_mass_GeV"] if "H_mass_GeV" in overlay["model"] else 1080.0,
            "f_phi_cosmic_assumed": f10["f_phi_cosmic_assumed"],
            "f_H_cosmic_local_if_co_tracing": f10["f_H_cosmic_and_local_if_co_tracing"],
            "required_Omega_H_h2": f10["required_Omega_H_h2"],
            "unchanged_published_H_point_total_overclosure_sigma": f10["Planck_sigma_deviation_if_published_IDM_profile_is_left_unchanged_and_phi_is_added"],
            "conditional_LZ_rate_ratio_to_IDM_SHM_profile_scaled_MW_like_7_quantiles": mw_7,
            "conditional_H_annihilation_flux_ratio_if_GC_co_traces": f10["H_annihilation_flux_density_squared_factor_if_GC_co_traces"],
            "gamma_channel_status": "0.81 is only fixed-shape density-squared bookkeeping; the benchmark-specific spectrum and likelihood are absent",
            "Casimir_DP_exponent_ceiling_if_same_H_kernel": d_multi,
            "10y_compact_phi_encounter_probability_at_rho0p4_v220": encounter_case["focused_encounter_probability_in_10_years"],
            "verdict": "strongest tested architecture for assigning star formation and xenon/gamma signatures to different components, but no dynamical connection or measurable common Casimir-DP response is established; relic, local fractions, halo-tail fold, gamma spectrum, and detector likelihood remain conditional",
        },
    }
    result = {
        "classification": "evidence-synthesis branch verdict; not a common likelihood, new physical solve, or universal no-go theorem",
        "source_packets": [
            "casimir-dp-bosonic-free-field-scaling-2026-09-24.json",
            "casimir-dp-idm-gravity-only-xenon-screen-2026-09-25.json",
            "casimir-dp-idm-heavy-field-bosonstar-scale-2026-09-25.json",
            "casimir-dp-bosonic-two-component-observable-overlay-2026-09-25.json",
            "casimir-dp-boson-star-local-encounter-screen-2026-09-25.json",
        ],
        "inputs": {
            "registered_Casimir_DP_one_sigma_magnitude_precision": dp_sigma,
            "registered_Casimir_DP_SNR5_visibility_loss": dp_snr5_visibility,
            "apparatus_values_are_design_forecasts_not_measured_performance": True,
        },
        "outputs": outputs,
        "derived": {
            "heavy_same_kernel_visibility_scale_to_one_sigma_precision": dp_sigma / d_heavy,
            "heavy_same_kernel_visibility_scale_to_SNR5_design_target": dp_snr5_visibility / d_heavy,
            "two_component_same_kernel_visibility_scale_to_one_sigma_precision": dp_sigma / d_multi,
            "two_component_same_kernel_visibility_scale_to_SNR5_design_target": dp_snr5_visibility / d_multi,
            "no_tested_branch_passes_all_four_observable_gates": True,
            "best_architecture_for_next_model_construction_step": "explicit two-component ultralight star-forming field plus heavy recoil component",
            "selected_four_observable_prediction_model": None,
        },
        "decision": {
            "selected_status": "No model selected. The two-component sector is retained as the leading conditional architecture, not as a common-cause prediction.",
            "scope_of_negative_result": "The tested free/repulsive-quartic star scalings, ordinary single-particle recoil, gravity-only LZ scattering, and screened IDM Casimir-DP kernel fail at least one gate. This is not an exclusion of every possible interaction or UV completion.",
            "next_gate": "Identify one explicit symmetry-consistent cross-sector/operator kernel that can raise the predicted interferometer signal to the registered design sensitivity while reproducing the xenon spectrum and respecting stellar stability, shared abundance, gamma/dwarf, direct-detection, and apparatus constraints. If the required response enhancement cannot be generated without violating those bounds, close the measurable-overlap branch and retain a null Casimir prediction.",
        },
        "limits": [
            "The branches use different published benchmark analyses and are compared by compatibility gates, not combined likelihoods.",
            "The two-component LZ halo quantiles are a seven-simulation diagnostic subset, not a Milky Way posterior or detector-level fit.",
            "Gamma-ray observables lack a common channel-specific prediction for the 1.08 TeV heavy component.",
            "Boson-star quartic results are scaling proxies, not coupled Einstein-matter solutions; the IDM neutral field is not a conserved-charge complex scalar.",
            "Casimir-DP sensitivity is a registered forecast; no measured local residual is assumed.",
        ],
    }
    assert light_benchmark["benchmark"] == "EHT Sgr A* illustrative field"
    assert math.isclose(outputs["heavy_single_field_IDM_like"]["gravity_only_LZ_events_upper_bound_in_exposure"], 9.918020965428376e-47, rel_tol=1e-10)
    assert math.isclose(d_multi, 6.3e-19, rel_tol=1e-12)
    assert math.isclose(d_multi, 0.9 * d_heavy, rel_tol=1e-12)
    assert outputs["ultralight_single_field"]["maximum_elastic_Xe_recoil_keV_at_assumed_speed_cap"] < 1e-50
    assert result["derived"]["two_component_same_kernel_visibility_scale_to_SNR5_design_target"] > 1e16
    OUT.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()

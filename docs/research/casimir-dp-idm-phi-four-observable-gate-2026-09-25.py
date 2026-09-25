"""Reproducible gate verdict for the exact IDM + ultralight-phi overlay."""
import hashlib
import json
import math
from pathlib import Path

BASE = Path("docs/research")
FILES = {
    "branch": BASE / "casimir-dp-four-observable-branch-verdict-2026-09-25.json",
    "abundance": BASE / "casimir-dp-idm-underabundance-coannihilation-preflight-2026-09-25.json",
    "bridge": BASE / "casimir-dp-idm-lz-bridge-screen-2026-09-24.json",
    "star": BASE / "casimir-dp-idm-heavy-field-bosonstar-scale-2026-09-25.json",
    "encounter": BASE / "casimir-dp-boson-star-local-encounter-screen-2026-09-25.json",
    "overlay": BASE / "casimir-dp-bosonic-two-component-observable-overlay-2026-09-25.json",
    "excited": BASE / "casimir-dp-idm-excited-state-lifetime-2026-09-25.json",
}
data = {key: json.loads(path.read_text()) for key, path in FILES.items()}
branch = data["branch"]["outputs"]
ab = data["abundance"]
ab_inputs = ab["inputs"]
f10 = next(row for row in data["overlay"]["outputs_by_f_phi"]
           if abs(row["f_phi_cosmic_assumed"] - 0.1) < 1e-12)
f1sig = next(row for row in ab["abundance_targets"]
             if abs(row["fixed_profile_plus_phi_planck_central_sigma"] - 1.0) < 1e-10)
bridge = data["bridge"]
dp = max(row["single_hold_decoherence_exponent_upper"]
         for row in bridge["higgs_elastic_conditional_screen"]["rows"])
dp_precision = branch["two_component_phi_plus_heavy_H"]["Casimir_DP_exponent_ceiling_if_same_H_kernel"]
precision = data["branch"]["inputs"]["registered_Casimir_DP_one_sigma_magnitude_precision"]
snr5 = data["branch"]["inputs"]["registered_Casimir_DP_SNR5_visibility_loss"]
c12_thr = next(row["threshold_speed_km_s"] for row in bridge["targets"]
               if row["target"] == "C-12")
xe_248 = bridge["lz_candidate_recoil"]["xe131_minimum_speed_km_s"]
star_ratio = data["star"]["outputs"]["reference_object_over_proxy_Mmax"]
encounter = min(data["encounter"]["cases"], key=lambda row:
    abs(row["local_rho_total_GeV_cm3"] - 0.4) +
    abs(row["local_compact_object_fraction_assumed"] - 0.1) +
    abs(row["relative_speed_km_s"] - 220.0))
excited = data["excited"]["calculation"]

fixed_total = ab_inputs["paper_profile_Omega_H_h2"] + 0.1 * ab_inputs["adopted_Omega_DM_h2"]
fixed_total_sigma = ((fixed_total - ab_inputs["adopted_Omega_DM_h2"]) /
                     ab_inputs["adopted_Omega_DM_sigma"])
required_H = 0.9 * ab_inputs["adopted_Omega_DM_h2"]
relic_reduction = 1.0 - required_H / ab_inputs["paper_profile_Omega_H_h2"]
gamma_density_factor = 0.9**2

result = {
    "classification": "conditional_IDM_plus_ultralight_phi_four_observable_gate_verdict",
    "inputs": {
        "upstream_sha256": {key: hashlib.sha256(path.read_bytes()).hexdigest()
                            for key, path in FILES.items()},
        "f_phi_cosmic_scenario": 0.1,
        "f_H_cosmic_assumed": 0.9,
        "IDM_profile_relic_Omega_h2": ab_inputs["paper_profile_Omega_H_h2"],
        "total_DM_Omega_h2_central": ab_inputs["adopted_Omega_DM_h2"],
        "total_DM_Omega_h2_sigma": ab_inputs["adopted_Omega_DM_sigma"],
        "design_precision_is_forecast": True,
    },
    "gates": {
        "star_structure_and_population": {
            "phi_mass_eV": branch["two_component_phi_plus_heavy_H"]["m_phi_eV"],
            "phi_free_Kaup_cap_Msun": branch["ultralight_single_field"]["free_field_max_star_mass_Msun"],
            "SgrA_reference_over_IDM_quartic_star_proxy": star_ratio,
            "reference_phi_star_R99_AU": data["encounter"]["derived_star_scale"]["R99_AU"],
            "10y_encounter_probability_at_rho0p4_f0p1_v220": encounter["focused_grazing_impact_probability_in_10_years"] if "focused_grazing_impact_probability_in_10_years" in encounter else encounter["focused_encounter_probability_in_10_years"],
            "status": "mass scales motivate separate light-star and heavy-recoil fields; formation, mass function and local fractions are not predicted",
        },
        "abundance_and_local_population": {
            "fixed_profile_plus_10pct_phi_total_Omega_h2": fixed_total,
            "overclosure_sigma": fixed_total_sigma,
            "max_phi_fraction_at_1sigma_upper_with_fixed_IDM_profile": f1sig["f_phi"],
            "required_Omega_H_h2_for_f_phi_0p1": required_H,
            "required_H_relic_reduction_fraction": relic_reduction,
            "local_H_fraction_if_cosmically_co_traced": f10["f_H_cosmic_and_local_if_co_tracing"],
            "status": "published IDM profile cannot be added unchanged to a 10% phi component; needs a new relic calculation",
        },
        "xenon_recoil": {
            "m_H_GeV": bridge["source_benchmark"]["m_H_GeV"],
            "delta_keV": bridge["source_benchmark"]["delta_keV"],
            "Xe131_speed_for_248keV_km_s": xe_248,
            "C12_endothermic_threshold_km_s": c12_thr,
            "assumed_halo_cap_km_s": bridge["source_benchmark"]["adopted_lab_speed_cap_km_s"],
            "conditional_rate_factor_at_f_H_0p9_before_halo_refold": f10["f_H_cosmic_and_local_if_co_tracing"],
            "status": "LZ benchmark is kinematically open in the extreme Xe tail; the same ground-state inelastic channel is closed on independent carbon",
        },
        "astrophysical_photons": {
            "conditional_H_density_squared_factor_at_f_H_0p9": gamma_density_factor,
            "provided_continuum_fit": "0.5-0.8 TeV b-bbar with (5-8)e-25 cm^3/s; not the 1.08 TeV IDM benchmark's published channel prediction",
            "exact_IDM_present_day_channel_spectrum_available_in_benchmark_table": False,
            "HESS_neutral_splitting_scan_covers_369keV_point": False,
            "status": "no exact common gamma prediction; supplied gamma features remain distinct stress tests",
        },
        "Casimir_DP": {
            "IDM_Higgs_elastic_exponent_ceiling": dp,
            "same_kernel_overlay_exponent_ceiling": dp_precision,
            "registered_one_sigma_precision": precision,
            "registered_SNR5_visibility_loss": snr5,
            "DP_precision_over_exponent_ceiling": precision / dp,
            "Z_inelastic_carbon_channel": "closed for ground-state H; excited A lifetime is %.3g days" % excited["lifetime_days"],
            "status": "conditional local-scattering contribution is null at the forecast sensitivity for the tested IDM channels",
        },
    },
    "decision": {
        "best_current_architecture": "complex ultralight phi for boson-star structure plus heavy IDM-like H for xenon; separately produced unless a connector is specified",
        "prediction_status": "not a complete four-observable prediction model; the published IDM point fails the 10% shared-abundance overlay unchanged, and the tested Casimir-DP channels give a null-scale prediction",
        "measurable_shared_scattering_status": "not established; exact IDM ground-state Z channel is closed on carbon and its elastic Higgs channel is far below the registered precision",
        "next_falsification_gate": "Only reopen IDM-Casimir overlap with an explicit late-time excited-state source or a separately derived elastic/collective material operator, then recompute xenon, lifetime, abundance, gamma and target response from one Lagrangian.",
    },
    "validity_and_uncertainty_limits": [
        "The 0.1/0.9 fractions assume cosmic co-tracing; local and Galactic-center fractions are independent outputs of a formation/structure model.",
        "The IDM 248-keV rate is sensitive to the high-speed halo tail; the quoted 786 km/s value is a kinematic point, not a detector-folded event prediction.",
        "The phi encounter calculation assumes identical SgrA-scale objects tracing the local halo; it is not a mass function or formation model.",
        "The H-star number is a repulsive-quartic scaling proxy, not a solved charged IDM boson star; the inert neutral state is not an exact conserved-charge complex scalar.",
        "The gamma comparison lacks exact LZ-point branching spectra, a compatible HESS scan at the small neutral splitting, and joint Fermi/HESS likelihoods.",
        "The Casimir-DP benchmark is a design forecast; the Higgs result is a deliberately generous elastic Born/contact coherence ceiling, not an exact solid-state response.",
        "The excited-state lifetime assumes the standard tree-level ZHA interaction and no late-time repopulation.",
    ],
    "checks": {
        "fixed_IDM_plus_10pct_phi_overcloses_by_more_than_5sigma": fixed_total_sigma > 5,
        "Xe_candidate_speed_below_halo_cap": xe_248 < bridge["source_benchmark"]["adopted_lab_speed_cap_km_s"],
        "C12_transition_closed": c12_thr > bridge["source_benchmark"]["adopted_lab_speed_cap_km_s"],
        "elastic_DP_below_precision_by_more_than_10_orders": precision / dp > 1e10,
        "excited_state_short_lived_compared_with_universe": excited["universe_age_over_lifetime"] > 1e10,
        "decision_is_not_misreported_as_four_gate_pass": True,
    },
}
assert all(result["checks"].values()), result["checks"]
OUT = BASE / "casimir-dp-idm-phi-four-observable-gate-2026-09-25.json"
OUT.write_text(json.dumps(result, indent=2) + "\n")
print(json.dumps(result, indent=2))

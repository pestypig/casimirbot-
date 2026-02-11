# Proof Pack Contract

The proof pack is the single source of truth for pipeline-derived proof metrics.
Panels must consume this payload instead of recomputing locally, and they must
respect the proxy flags and math-stage gating before making non-proxy claims.

## Endpoint
- `GET /api/helix/pipeline/proofs`

## Response shape (v1)
```
{
  "kind": "proof-pack",
  "version": 1,
  "generatedAt": "2026-01-16T00:00:00.000Z",
  "pipeline": { "seq": 123, "ts": 1700000000000, "mode": "hover" },
  "values": {
    "power_avg_W": { "value": 8.33e7, "unit": "W", "source": "pipeline.P_avg_W" },
    "duty_effective": { "value": 2.5e-5, "unit": "1", "source": "pipeline.dutyEffectiveFR" },
    "hull_area_m2": { "value": 1234, "unit": "m^2", "source": "pipeline.hullArea_m2" },
    "kappa_drive": { "value": 1.2e-12, "unit": "1/m^2", "source": "derived:kappa_drive_from_power", "proxy": true }
  },
  "equations": { "theta_expected": "...", "U_static": "..." },
  "sources": { "gammaGeo": "server.result.gammaGeo (design)" },
  "notes": ["missing_values=..."]
}
```

## ProofValue fields
- `value`: number | boolean | string | null.
- `unit`: unit string for numeric values (e.g., `W`, `m^2`, `1/m^2`).
- `source`: path or derivation label used to compute the value.
- `proxy`: true when the value is a proxy, fallback, or derived from weaker evidence.
- `basis`: optional unit-conversion metadata (from unit, scale).
- `note`: optional short explanation.

## Contract rules
- Every proof number in UI must be sourced from `values` or a documented
  pipeline field; if not, it must be labeled as a proxy.
- Proxy fields stay proxy even if numeric; stage gating can force additional
  proxy labels when required modules are below the minimum stage.
- Conversions (MW -> W, cm^2 -> m^2, nm -> m) are recorded via `basis` or `note`.
- Do not emit full pipeline state here; only derived proof metrics belong in
  the pack.

## Required keys (v1)
Proof panels rely on the following keys at minimum:
- power/duty: `power_avg_W`, `power_avg_MW`, `duty_effective`, `duty_burst`
- geometry: `hull_Lx_m`, `hull_Ly_m`, `hull_Lz_m`, `hull_area_m2`
- tiles: `tile_area_cm2`, `tile_area_m2`, `tile_count`, `packing`, `radial_layers`
- cavity: `gap_m`, `gap_guard_m`, `cavity_volume_m3`, `rho_tile_J_m3`,
  `mechanical_casimir_pressure_Pa`, `mechanical_electrostatic_pressure_Pa`,
  `mechanical_restoring_pressure_Pa`, `mechanical_margin_Pa`,
  `mechanical_max_stroke_pm`
- energies: `U_static_J`, `U_geo_J`, `U_Q_J`, `U_cycle_J`, `U_static_total_J`
- masses: `M_exotic_kg`, `M_exotic_raw_kg`, `mass_calibration`
- bubble: `bubble_R_m`, `bubble_sigma`, `bubble_beta`, `coverage`,
  `theta_raw`, `theta_cal`, `theta_audit`, `theta_geom`, `theta_proxy`,
  `theta_metric_derived`, `theta_metric_source`, `theta_metric_reason`,
  `theta_strict_mode`, `theta_strict_ok`, `theta_strict_reason`
- guards: `vdb_limit`, `vdb_pocket_radius_m`, `vdb_pocket_thickness_m`,
  `vdb_planck_margin`, `vdb_admissible`
- curvature proxy: `kappa_drive`, `kappa_drive_gain`
- checks: `zeta`, `ts_ratio`, `ford_roman_ok`, `natario_ok`
- strict QI source: `qi_rho_source`, `qi_strict_mode`, `qi_strict_ok`,
  `qi_strict_reason`, `qi_metric_derived`, `qi_metric_source`,
  `qi_metric_reason`
- strict TS source: `ts_metric_derived`, `ts_metric_source`,
  `ts_metric_reason`

Note: `theta_raw`, `theta_cal`, and `theta_proxy` are metric-derived overrides
in the proof pack when adapter diagnostics are present. Pipeline telemetry for
theta lives under `theta_pipeline_*` and remains proxy-only.

## Optional keys (CL1–CL2 metric adapter)
When available, CL1–CL2 metadata is surfaced for chart/ADM auditing:
- `metric_adapter_family`, `metric_chart_label`, `metric_dt_gamma_policy`
- `metric_chart_contract_status`, `metric_chart_contract_reason`
- `metric_requested_field`
- `metric_chart_notes`, `metric_coordinate_map`
- `metric_alpha`, `metric_gamma_xx`, `metric_gamma_yy`, `metric_gamma_zz`
- `metric_beta_method`, `metric_beta_theta_max`, `metric_beta_theta_rms`
- `metric_beta_curl_max`, `metric_beta_curl_rms`
- `metric_beta_theta_conformal_max`, `metric_beta_theta_conformal_rms`
- `metric_beta_bprime_over_b_max`, `metric_beta_bdouble_over_b_max`
- `metric_beta_sample_count`, `metric_beta_step_m`, `metric_beta_note`
- `theta_strict_mode`, `theta_strict_ok`, `theta_strict_reason`

## Telemetry-only keys (proxy)
These keys are pipeline telemetry only and remain proxy:
- `theta_pipeline_raw`, `theta_pipeline_cal`, `theta_pipeline_proxy`
- `gr_cl3_rho_delta_pipeline_mean_telemetry`

`theta_strict_*` reports strict congruence behavior for ThetaAudit:
- strict mode source (`WARP_STRICT_CONGRUENCE`)
- whether geometry theta was usable
- reason when strict mode blocks proxy fallback

`theta_metric_*` reports direct ThetaAudit provenance:
- whether the active theta guard path is geometry-derived
- source lineage for the active theta path
- reason for geometry/proxy classification

`qi_strict_*` reports strict congruence behavior for Ford-Roman/QI:
- strict mode source (`WARP_STRICT_CONGRUENCE`)
- whether QI used a metric-derived rho source
- reason when strict mode blocks proxy/non-metric rho source

`qi_metric_*` reports direct QI metric-path provenance from guard evaluation:
- whether the active QI guard input path is geometry-derived
- lineage/source of the metric/proxy decision
- reason for metric/proxy classification

`ts_metric_*` reports strict congruence behavior for TS-ratio timing:
- whether TS timing is metric-derived
- source lineage for the TS timing path
- reason when the strict path falls back to proxy/hardware timing

## Optional keys (VdB region II diagnostics)
When VdB region II profiling is enabled, proof packs may include:
- `vdb_region_ii_alpha`, `vdb_region_ii_n`
- `vdb_region_ii_r_tilde_m`, `vdb_region_ii_delta_tilde_m`
- `vdb_region_ii_bprime_max_abs`, `vdb_region_ii_bdouble_max_abs`
- `vdb_region_ii_t00_min`, `vdb_region_ii_t00_max`, `vdb_region_ii_t00_mean`
- `vdb_region_ii_sample_count`, `vdb_region_ii_support`, `vdb_region_ii_note`
- `vdb_region_ii_derivative_support`

These values summarize the B(r) transition band (region II) and are intended to
support CL2/CL3 checks that depend on B' and B''.

## Optional keys (VdB region IV diagnostics)
When VdB region IV profiling is enabled, proof packs may include:
- `vdb_region_iv_R_m`, `vdb_region_iv_sigma`
- `vdb_region_iv_dfdr_max_abs`, `vdb_region_iv_dfdr_rms`
- `vdb_region_iv_sample_count`, `vdb_region_iv_support`, `vdb_region_iv_note`
- `vdb_region_iv_derivative_support`

These values summarize the f-wall transition band (region IV) and are intended to
complete the two-wall signature check.

## Optional keys (VdB two-wall signature)
When both VdB region diagnostics are available, proof packs may include:
- `vdb_two_wall_support`
- `vdb_two_wall_note`
- `vdb_two_wall_derivative_support`

These values indicate whether both region II and region IV support are detected.

## Optional keys (GR invariants / CL0 helpers)
When GR bricks are enabled (`grEnabled=true`), proof packs may include:
- `gr_kretschmann_*` and `gr_ricci4_*` where `*` expands to:
  - `min`, `max`, `mean`, `p98`
  - `sample_count`, `abs`
  - `wall_fraction`, `band_fraction`, `threshold`, `band_min`, `band_max`

These values are provided in the GR brick unit system and intended as CL0
scalar-invariant helpers.

If a baseline invariant set is present (`pipeline.grBaseline.invariants`), proof
packs may also include relative delta diagnostics:
- `gr_cl0_kretschmann_delta_mean`, `gr_cl0_kretschmann_delta_p98`
- `gr_cl0_ricci4_delta_mean`, `gr_cl0_ricci4_delta_p98`
- `gr_cl0_delta_max`
- `gr_cl0_baseline_source`, `gr_cl0_baseline_age_s`

## Optional keys (CL3 constraint-first checks)
When GR constraint-derived energy density is computed, proof packs may include:
- `gr_rho_constraint_mean`, `gr_rho_constraint_rms`, `gr_rho_constraint_max_abs`
- `gr_matter_t00_mean`
- `gr_metric_t00_geom_mean`
- `metric_t00_sample_count`, `metric_t00_rho_geom_mean`, `metric_t00_rho_si_mean`
- `metric_k_trace_mean`, `metric_k_sq_mean`
- `metric_t00_step_m`, `metric_t00_scale_m`
- `metric_t00_observer`, `metric_t00_normalization`, `metric_t00_unit_system`
- `metric_t00_contract_status`, `metric_t00_contract_reason`, `metric_t00_contract_ok`
- `metric_t00_chart`, `metric_t00_family`
- `gr_pipeline_t00_geom_mean` (pipeline reference, proxy)
- `metric_t00_sample_count`, `metric_t00_rho_geom_mean`, `metric_t00_rho_si_mean`
- `metric_t00_step_m`, `metric_t00_scale_m`
- `gr_pipeline_t00_geom_mean`
- `gr_cl3_rho_delta_mean`
- `gr_cl3_rho_delta_metric_mean`
- `gr_cl3_rho_delta_pipeline_mean`
- `gr_cl3_rho_threshold`
- `gr_cl3_rho_gate`
- `gr_cl3_rho_gate_source`
- `gr_cl3_rho_gate_reason`
- `gr_cl3_rho_missing_parts`
- `congruence_missing_parts`
- `congruence_missing_count`
- `congruence_missing_reason`

## Optional keys (Canonical contract markers)
When a canonical geometry contract is defined, proof packs may include:
- `warp_canonical_family`
- `warp_canonical_chart`
- `warp_canonical_observer`
- `warp_canonical_normalization`
- `warp_canonical_unit_system`
- `warp_canonical_match`

## Optional keys (Warp stress-energy, SI)
When the warp module emits stress-energy components, proof packs may include:
- `warp_t00_avg`, `warp_t11_avg`, `warp_t22_avg`, `warp_t33_avg`

These values are provided in SI units (`J/m³`) and reflect the pipeline warp
stress-energy tensor (Natário or Alcubierre). Use them for telemetry and
cross-checking; CL3 comparisons still use the GR brick unit system.

These values are provided in the GR brick unit system (`unitSystem=gr`). The
CL3 deltas compare constraint-derived `rho` against the **metric-derived**
warp `T00` when available; the pipeline `rho_avg` delta is tracked separately
as a diagnostic. The gate compares the metric delta to `gr_cl3_rho_threshold`
and reports the data source used for the gate (metric-only).
If strict inputs are missing, `gr_cl3_rho_gate_source` uses
`metric-missing`/`constraint-missing`, and `gr_cl3_rho_gate_reason`
captures `metric_source_missing`, `constraint_rho_missing`, or
`missing_inputs`.

## Optional keys (Curvature/stress congruence meta)
When curvature and stress telemetry provenance is available, proof packs may include:
- `curvature_meta_source`, `curvature_meta_congruence`, `curvature_meta_proxy`
- `stress_meta_source`, `stress_meta_congruence`, `stress_meta_proxy`

These values mirror the curvature/stress brick metadata: `source` is `metric`,
`pipeline`, or `unknown`, `congruence` is `conditional` or `proxy-only`, and
`*_proxy` is `true` when the telemetry is not geometry-derived.

Update this list if proof panels are expanded.

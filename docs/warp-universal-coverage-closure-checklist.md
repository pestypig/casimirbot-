# Warp Universal Coverage Closure Checklist

This checklist defines what is still required before claiming full universal congruence coverage across all active warp families, charts, and UI proof surfaces. It is based on the current live proof-pack snapshot and the CL0-CL4 contract.

## Evidence Artifacts

The live proof-pack snapshot and derived proxy/missing lists used for this checklist:

- `docs/warp-canonical-runtime-overview.md`
- `reports/warp-coverage-live-proof-pack.json`
- `reports/warp-coverage-live-proof-pack-proxy.txt`
- `reports/warp-coverage-live-proof-pack-missing.txt`
- `reports/warp-universal-coverage-audit-live.json`
- `reports/warp-universal-coverage-audit-live.md`
- `reports/warp-universal-coverage-matrix-live.json`
- `reports/warp-universal-coverage-matrix-live.md`

## Matrix Results (Live Families)

The live matrix audit across `natario`, `natario_sdf`, `irrotational`, and `alcubierre` reports:

- `missing_count=0` for each active family
- `metric_t00_contract_ok=true` for each active family
- VdB derivative support flags `true` in all runs (since `gammaVdB > 1`)

This confirms **universal coverage across the current active warp families**, pending any additional charts or surfaces not represented in the runtime matrix.

## Live Snapshot (Natario Canonical Path)

These are confirmed **metric-derived** in the live proof pack:

- `warp_canonical_*` contract fields all present and `warp_canonical_match=true`
- `metric_t00_contract_ok=true` with `family=natario`, `chart=comoving_cartesian`, `observer=eulerian_n`, `normalization=si_stress`, `unitSystem=SI`
- `theta_metric_derived=true` and `theta_strict_ok=true`
- `qi_metric_derived=true` and `qi_strict_ok=true`
- `ts_metric_derived=true`
- `gr_cl3_rho_gate=true` with `gr_cl3_rho_gate_source=warp.metric.T00.natario.shift`

This means the **Natario canonical path is congruent for CL3/CL4 guardrails** in the current runtime state.

## Proxy or Missing Fields (Live Snapshot)

These are still **proxy** in the proof pack (telemetry-only by design):

- `gr_cl3_rho_delta_pipeline_mean_telemetry`
- `theta_pipeline_raw`, `theta_pipeline_cal`, `theta_pipeline_proxy`
- `mechanical_safety_min`, `mechanical_note`

These should no longer be proxy once the metric adapter defaults are active; if they remain proxy, verify chart contract wiring and restart the server:

- `metric_chart_contract_reason`
- `metric_chart_notes`
- `metric_coordinate_map`

These are **missing** (null) in the proof pack:

- `metric_chart_contract_reason`
- `metric_chart_notes`
- `mechanical_note`

These are not blockers for the Natario path if strict congruence is enforced, but they **are blockers for universal coverage** if they remain proxy for other families/charts.

## Universal Coverage Gaps (Cross-Family)

The VdB derivative diagnostics are present in the current snapshot, so there are no known cross-family gaps in the live proof-pack output. Keep this section as a placeholder for any future chart-family combinations that omit required fields.

If VdB or other non-Natario families are active, these must be present and metric-derived to claim universal coverage.

## Closure Actions (Required for Universal Coverage)

1. **Per-family metric adapter contract**
   - For each active family and chart, ensure `metric_t00_contract_ok=true` and `metric_t00_*` fields are non-proxy.
   - Require `metric_chart_contract_reason` and `metric_chart_notes` to be populated when contract is `ok`.

2. **VdB derivative coverage**
   - Ensure VdB Region II and IV diagnostics emit `*_has_derivatives=true` and `*_metric=true`.
   - Ensure proof pack includes `vdb_region_ii_*` and `vdb_region_iv_*` fields whenever those families are active.

3. **CL3 constraint closure across families**
   - `gr_cl3_rho_gate` must be true for all active families using metric-derived T00, not pipeline proxies.
   - For each family, confirm `gr_cl3_rho_gate_source` references the family’s metric T00 source.

4. **Remove proxy dependency for proof panels**
   - All proof panels should consume **proof-pack** fields only, and respect proxy flags in strict mode.
   - Any panel or badge that still consumes pipeline-only `theta_*` or `T00_avg` must be migrated to proof-pack fields or explicitly labeled proxy-only.

5. **Universal coverage audit**
   - Run the coverage audit against all active family/chart combinations and produce a “missing parts” report.
   - Confirm missing_count is zero for each combination.

## When You Can Claim Universal Coverage

You can claim universal coverage once **all active families/charts** satisfy:

- `metric_t00_contract_ok=true`
- `theta_metric_derived=true`, `qi_metric_derived=true`, `ts_metric_derived=true`
- VdB Region II/IV diagnostics present when VdB is active
- `gr_cl3_rho_gate=true` with metric-derived sources
- No proxy-only proof-pack fields used by panels that represent proof surfaces

Until then, the system is **canonical-congruent** for Natario, but **not universally congruent** across all possible runtime paths.

# Warp Geometry CL4 Guardrail Map (M3)

Status: complete (P1-P7 + C1-C10 strict-runtime closure synced)  
Owner: dan  
Scope: Guardrail inputs and congruence status

## Purpose
Label guardrail inputs as geometry-derived or proxy-only, and document what must change to achieve CL4 congruence.

## CL4 Equation Contract (Geometry-Derived Requirement)
To mark a guardrail as geometry-derived at CL4, its input must be traceable through a complete equation chain back to (alpha, beta, gamma_ij) in a declared chart. The minimum chain is:

1. ADM kinematics: express the 4-metric in ADM form and relate d_t gamma_ij to K_ij using the chart-declared meaning of d/dt. Baumgarte-Shapiro give the ADM line element and the evolution derivative (d/dt = partial_t - L_beta) tied to K_ij. [1]
2. Constraints and matter projections: use the Hamiltonian and momentum constraints to link (gamma_ij, K_ij) to matter projections, with explicit rho, S_i, S_ij definitions. Baumgarte-Shapiro supply the constraint equations and matter projection definitions. [1] Gourgoulhon provides a second primary anchor for the same constraints. [3]
3. Warp-paper specializations: use the paper-level definitions for theta, K_ij, or rho_E (Alcubierre, Natario, VdB) to close the chain in the declared chart. [4][5][6]

If a guardrail input does not follow one of these complete chains, it must be labeled proxy-only at CL4.

## Observer and Normalization Contract (CL4)
Guardrail inputs that depend on T_ab must specify the observer and normalization conventions.

Observer contract: specify u^a for any T00 quantity (Eulerian n^a for constraint-based rho is the default). Alcubierre and Natario use Eulerian observers; VdB uses an orthonormal frame in region II. [4][5][6]
Normalization contract: track whether rho, S_i, S_ij include 8 pi factors (Baumgarte-Shapiro absorb 8 pi into the matter projections; Natario uses explicit 1/(16 pi)). [1][5]

## Proof Pack Pipeline (UI-Facing Proofs)
The UI proof panels consume a single proof pack payload built server-side and exposed via `/api/helix/pipeline/proofs`.

Key references:
- `server/helix-proof-pack.ts` builds the proof pack from the pipeline state.
- `docs/proof-pack.md` defines the contract and proxy rules.
- `client/src/hooks/useProofPack.ts` fetches the pack for UI panels.
- `client/src/lib/proof-pack.ts` maps proof values back into a pipeline-shaped object for rendering.

Proof pack values carry a `proxy` flag and must be treated as proxy-only unless the guardrail trace proves a geometry-derived chain.

## Guardrail Map (Summary)

| Guardrail | Proof Pack Keys (UI) | Pipeline Sources | Current Type | CL4 Status | Notes |
| --- | --- | --- | --- | --- | --- |
| warp.metric.T00 | `gr_metric_t00_geom_mean` (via CL3 gate inputs) | `modules/warp/natario-warp.ts`, `modules/warp/warp-module.ts`, `server/energy-pipeline.ts` | geometry-derived | PARTIAL | Metric-derived T00 is computed for Alcubierre + Natario/Natario-SDF/irrotational paths (finite-diff K_ij on flat slices) and labeled with `metricT00Ref` (`warp.metric.T00.alcubierre.analytic`, `warp.metric.T00.natario.shift`, `warp.metric.T00.natario_sdf.shift`, `warp.metric.T00.irrotational.shift`). For non-Alcubierre fallback, pipeline promotes VdB Region II derivatives into canonical `warp.metricT00` with `metricT00Ref=warp.metric.T00.vdb.regionII` (geometric units) and upgrades unknown/unspecified metric adapters to charted `vdb` adapters. T11/T22/T33 remain approximate placeholders. |
| FordRomanQI | `zeta`, `ford_roman_ok`, `qi_rho_source`, `qi_metric_derived`, `qi_metric_source`, `qi_metric_reason`, `qi_strict_mode`, `qi_strict_ok`, `qi_strict_reason` | `server/energy-pipeline.ts`, `server/qi/*` | conditional (strict-metric by default) | PARTIAL | Uses `warp.metricT00` (metric-derived) or `gr.rho_constraint.mean` when present; strict mode blocks non-metric sources by default and reports cause via `qi_strict_*`. `qi_metric_*` exposes direct metric/proxy provenance for UI and proof consumers. Curvature-window check is used when GR invariants are available. |
| ThetaAudit | `theta_geom`, `theta_proxy`, `theta_raw`, `theta_cal` (metric-derived overrides) + telemetry keys `theta_pipeline_*` | `modules/warp/warp-metric-adapter.ts`, `server/energy-pipeline.ts`, `tools/warpViability.ts` | geometry-derived (when metric adapter present) | PARTIAL | Uses D_i beta^i from metric adapter diagnostics when available; VdB region-II metric fallback now refreshes `theta_geom` from a charted adapter. Telemetry fallbacks now live under `theta_pipeline_raw/cal/proxy` only. |
| CL3_RhoDelta | `gr_cl3_rho_delta_mean`, `gr_cl3_rho_delta_metric_mean`, `gr_cl3_rho_delta_pipeline_mean`, `gr_cl3_rho_gate`, `gr_cl3_rho_gate_source`, `gr_cl3_rho_threshold` | `tools/warpViability.ts`, `server/helix-proof-pack.ts`, `server/gr/constraint-evaluator.ts` | mixed | PARTIAL | Constraint side is geometry-derived; gate is **metric-only**. Pipeline delta is diagnostic/proxy-only. Runtime viability snapshot now includes metric provenance tags (`rho_delta_metric_source`, `rho_delta_metric_chart`, `rho_delta_metric_family`). |
| TS_ratio_min | `ts_ratio`, `ts_metric_derived`, `ts_metric_source`, `ts_metric_reason` | `server/energy-pipeline.ts`, `tools/warpViability.ts` | operational metric-proxy | PARTIAL | Strict mode requires `ts_metric_derived=true`; non-metric timing sources are rejected as `proxy_input`. |
| VdB_band | `vdb_limit`, `vdb_pocket_radius_m`, `vdb_pocket_thickness_m`, `vdb_region_ii_*`, `vdb_region_iv_*`, `vdb_region_ii_derivative_support`, `vdb_region_iv_derivative_support`, `vdb_two_wall_support`, `vdb_two_wall_derivative_support` | `server/energy-pipeline.ts`, `tools/warpViability.ts` | conditional (derivative-gated) | PARTIAL | For `gamma_VdB > 1`, pass now requires two-wall derivative evidence: Region II `B'`/`B''` + finite `t00_mean` + sample count and Region IV `df/dr` support. Near-unity `gamma_VdB` remains band-only. |
| GR constraint gate | (not surfaced in proof pack) | `server/gr/constraint-evaluator.ts`, `server/gr/gr-constraint-policy.ts` | geometry-derived (if sourced correctly) | PARTIAL | CL4 depends on whether inputs are fed from adapters or proxies. |

## Needle Hull Runtime Snapshot
Needle Hull solve runtime authority follows this CL4-aligned pattern:
- Strict hard-decision stress source: `warp.metricT00` with canonical refs:
  - `warp.metric.T00.alcubierre.analytic`
  - `warp.metric.T00.natario.shift`
  - `warp.metric.T00.natario_sdf.shift`
  - `warp.metric.T00.irrotational.shift`
  - fallback `warp.metric.T00.vdb.regionII` when derivative evidence is present
- Required contract metadata for strict authority:
  - `metricT00Observer`
  - `metricT00Normalization`
  - `metricT00UnitSystem`
  - `metricT00ContractStatus`
  - `metricT00ContractReason`
- Theta hard checks:
  - authoritative path: `theta_geom` from metric adapter diagnostics
  - fallback path: `theta_pipeline_proxy` / `theta_pipeline_cal` (explicit proxy-only telemetry)
- VdB strict rule:
  - when `gammaVdB > 1`, derivative evidence (`B'`, `B''`, two-wall support) is required

Needle Hull signal classification:
| Signal | Classification | CL status | Notes |
| --- | --- | --- | --- |
| `warp.metricT00` | geometry-derived (conditional by path) | CL3/CL4 candidate | Canonical strict stress source on active family paths. |
| `metricT00Contract*` | geometry contract metadata | CL4 contract | Required for strict hard-decision authority. |
| `theta_geom` | geometry-derived (conditional by adapter) | CL2/CL4 candidate | Derived from adapter diagnostics with chart contract gating. |
| `metric_k_trace_mean` | geometry-derived diagnostics | CL2/CL3 audit | Mean trace of extrinsic curvature from metric T00 diagnostics. |
| `metric_k_sq_mean` | geometry-derived diagnostics | CL2/CL3 audit | Mean K_ij K^ij from metric T00 diagnostics. |
| `theta_pipeline_proxy` / `theta_pipeline_cal` | proxy-only | CL4 excluded | Telemetry fallback only, not strict hard authority. |
| `T00_avg` (pipeline map) | proxy-only | CL3 excluded | Pipeline stress map, not constraint-closed by itself. |
| VdB derivative evidence (`vdb_region_ii_derivative_support`, `vdb_region_iv_derivative_support`, `vdb_two_wall_derivative_support`) | geometry-derived diagnostics | CL2/CL3 partial | Required for strict VdB path; universal chart/surface closure remains open. |

Needle Hull citation binding template:
| Runtime item | Required source binding | Status |
| --- | --- | --- |
| `warp.metric.T00.*` refs | Equation chain from metric/ADM fields to rho_E or equivalent stress projection | provided_unverified |
| `metricT00ContractObserver` | Observer definition in source (Eulerian/comoving/orthonormal) | provided_unverified |
| `metricT00ContractNormalization` | 8*pi normalization convention and unit-system mapping | provided_unverified |
| `theta_geom` | Expansion definition and sign convention mapping | provided_unverified |
| `theta_pipeline_proxy` / `theta_pipeline_cal` | Explicit heuristic citation or proxy-only non-congruent label | provided_unverified |

Needle Hull citation trace file:
- `docs/needle-hull-citation-trace.md` (normalized table; unverified)
- `docs/needle-hull-citation-trace.json` (machine-readable export; unverified)

## CL4 Source -> Guardrail Trace Map (Primary Sources)
This table links each guardrail to its primary-source equation anchors and records whether the current pipeline is geometry-derived or proxy-only.

| Guardrail ID | Inputs (repo-stated) | Code pointers (repo-stated) | Source equation anchors | Geometry chain back to (alpha, beta, gamma_ij) | CL4 status now | Congruence gaps + falsifiers |
| --- | --- | --- | --- | --- | --- | --- |
| warp.metric.T00 | shift field beta^i(x) -> finite-diff K_ij -> rho_E | `modules/warp/natario-warp.ts`, `modules/warp/warp-module.ts` | Natario Thm. 1.7 rho_E identity for flat slices. [5] Alcubierre theta/Tr(K) definitions. [4] ADM kinematics (B&S). [1] | Geometry chain: (alpha=1, gamma_ij=delta_ij) and beta^i(x) -> K_ij via spatial derivatives -> rho_E = (K^2 - K_ij K^ij)/16 pi. | Geometry-derived (flat-slice approximation) | Gap: finite-difference estimate; does not include B(r) (VdB). Falsifier: analytic Alcubierre profile should reproduce negative wall-localized rho_E sign structure. |
| ThetaAudit | D_i beta^i from metric adapter (thetaMax/thetaRms); proxy telemetry under theta_pipeline_* | `modules/warp/warp-metric-adapter.ts`, `server/energy-pipeline.ts`, `tools/warpViability.ts` | Alcubierre expansion definition theta = -alpha Tr(K) (eq. 11) and explicit theta (eq. 12). [4] Natario theta = div X (Cor. 1.5). [5] ADM kinematics and K_ij relation (Baumgarte-Shapiro). [1] | Geometry chain: (alpha, beta, gamma_ij) -> K_ij via ADM kinematics -> theta via Tr(K) (Alcubierre) or div X with beta = -X (Natario). | Geometry-derived when metric adapter is present; proxy telemetry otherwise | Gap: finite-difference diagnostics remain sparse and still do not include full B(r)-coupled VdB divergence terms across all charts/surfaces. Falsifier: vary B(r) transition thickness at fixed f-wall and verify theta responds through B'/B terms, not only shift-wall gradients. |
| CL3_RhoDelta | rho_constraint.mean, metric T00 -> delta; pipeline rho_avg tracked separately | `tools/warpViability.ts`, `server/helix-proof-pack.ts`, `server/gr/constraint-evaluator.ts` | ADM constraints and matter projections (B&S eqs. 4-5). [1] Gourgoulhon constraint summary. [3] Natario rho_E identity for flat slices (Thm. 1.7). [5] | Geometry chain: (alpha, beta, gamma_ij) -> K_ij -> rho_constraint via Hamiltonian constraint. Compare to **metric T00 only** with explicit observer and normalization tags. Pipeline rho_avg delta is diagnostic only. | Mixed (constraint-derived vs proxy reference) | Gap: if metric T00 reference is injected, delta is not geometry-congruent. Falsifier: enforce a known analytic metric; rho_constraint should converge and delta should track the analytic T00 in the same chart. |
| FordRomanQI | metric T00 (preferred), duty/sampling window, zeta, `qi_rho_source`, `qi_metric_*`, `qi_strict_*` | `server/qi/qi-bounds.ts`, `server/qi/qi-monitor.ts`, `server/energy-pipeline.ts` | Ford-Roman QI bound for Lorentzian sampling (eq. 65). [7] Pfenning-Ford warp application with small sampling time. [8] ADM constraints and matter projections linking geometry to rho. [1][3] | Geometry-derived chain: (alpha, beta, gamma_ij) -> K_ij -> rho_E via Hamiltonian constraint -> sampled rho(tau) for a declared observer -> QI bound, plus curvature-window check (tau << curvature radius). | Conditional (strict-metric by default) | Gap: strict mode blocks non-metric sources (`qi_strict_ok=false`), but proxy fallback still exists if strict congruence is disabled; curvature window remains unknown if invariants are missing. `qi_metric_*` now carries explicit path/source/reason classification for CL4 audits. Falsifier: compute Hamiltonian residual; if nonzero, T00 is not tied to the claimed geometry. |
| VdB_band | gammaVdB band + B(r) derivative diagnostics (region II/IV) | `server/energy-pipeline.ts`, `tools/warpViability.ts` | VdB metric and B(r) piecewise profile (eqs. 4-5). [6] Region II energy density depends on B' and B'' (eq. 12). [6] | Geometry-derived chain requires B(r) as a function, with derivatives, and region-II evaluation. | Conditional (derivative-gated) | Gap: full CL3 closure still needs complete B(r)-coupled ADM/K_ij + observer-consistent stress tensor; current runtime enforces derivative evidence but remains partial. Falsifier: vary tildeDelta with fixed B_max; two-wall support should change if derivatives are tracked. |
| TS_ratio_min | hull size, modulation period, light-crossing proxy | `server/energy-pipeline.ts`, `tools/warpViability.ts` | No direct anchor in Alcubierre/Natario/VdB. ADM metric provides proper distances. [1] | If computed using proper distances from gamma_ij, it is geometry-aware but operational. | Conditional (strict-metric source by default) | Gap: operational metric-proxy quantity. Strict mode requires `tsMetricDerived=true` and flags non-metric timing as `proxy_input`. Falsifier: in VdB, proper distances scale with B; if TS_ratio ignores B, it is not slice-metric aware. |
| GR constraint gate | metric fields, stress-energy fields, residual thresholds | `server/gr/constraint-evaluator.ts`, `server/gr/gr-constraint-policy.ts` | ADM constraints (B&S eqs. 4-5) and matter projections (eq. 8). [1] | Geometry-derived if inputs come from metric adapters with declared chart and matter projections derived consistently. | Conditionally geometry-derived | Gap: if T_ab is injected independently, constraints do not close. Falsifier: run a known analytic metric; residuals should converge to zero with resolution. |
| Natario_OK mapping | T00_avg from pipeline, curvature proxy | `modules/dynamic/natario-metric.ts` | Natario Thm. 1.7 forward identity for rho_E in flat slices. [5] | Geometry-derived chain: choose X (beta = -X) -> K_ij, theta -> rho_E via Thm. 1.7. | Proxy-only until forward chain used | Gap: inverse mapping (pipeline energy -> T00) is not Natario. Falsifier: compute rho_E from a concrete X and compare; if mismatch, mapping is not Natario-aligned. |

## Machine-Readable Snapshot (JSON)
The current guardrail trace map is mirrored in `docs/warp-geometry-cl4-guardrail-map.json` for tooling.

## UI Surfaces (Proof Pack Consumers)
- `client/src/components/FrontProofsLedger.tsx`
- `client/src/components/PipelineProofPanel.tsx`
- `client/src/components/WarpProofPanel.tsx`
- `client/src/components/DriveGuardsPanel.tsx`
- `client/src/components/NeedleCavityBubblePanel.tsx`
- `client/src/components/CardProofOverlay.tsx`
- `client/src/components/visual-proof-charts.tsx`
- `client/src/components/QiWidget.tsx` (shows `rhoSource`, `metric path`, and curvature-window status)
- `client/src/components/QiAutoTunerPanel.tsx` (shows `rhoSource`, `metric path`, and curvature-window status)
- `client/src/components/TimeDilationLatticePanel.tsx` (debug overlay exposes QI source/curvature status)

Metric K invariants (`metric_k_trace_mean`, `metric_k_sq_mean`) are now surfaced in
FrontProofsLedger, WarpProofPanel, DriveGuardsPanel (Natario audit), NeedleCavityBubblePanel,
CardProofOverlay, VisualProofCharts, and the TimeDilationLatticePanel debug overlay. Proof pack
remains the canonical export for these values.

## Delta log
- 2026-02-10: Added `metric_k_trace_mean` and `metric_k_sq_mean` to proof-pack UI surfaces and
  CL2/CL3 signal classification. VisualProofCharts now renders metric K diagnostics.
- 2026-02-10: Added explicit VdB derivative support signals (`vdb_region_ii_derivative_support`,
  `vdb_region_iv_derivative_support`, `vdb_two_wall_derivative_support`) to the CL4 map and UI
  debug surfaces.

## CL4 Upgrade Requirements
- For each guardrail, define geometry-derived inputs (ADM fields, K_ij, rho_E).
- Replace or rename proxy scalars to avoid implying geometric congruence.
- Produce a CL4 audit table that reports pass/fail with evidence links.

## Kickoff Checklist
- Enumerate guardrails from `WARP_AGENTS.md` and their current inputs.
- Mark each input as geometry-derived or proxy-only.
- Verify ThetaAudit labels (theta_geom vs theta_pipeline_proxy) remain explicit in UI and proof pack.
- Draft the CL4 audit table schema.

## Artifacts
- This guardrail map is referenced by Phase M3 in `docs/warp-tree-dag-task.md`.

## References
[1] https://arxiv.org/pdf/gr-qc/9810065  
[2] https://arxiv.org/pdf/gr-qc/9810051  
[3] https://people-lux.obspm.fr/gourgoulhon/pdf/form3p1.pdf  
[4] https://arxiv.org/pdf/gr-qc/0009013  
[5] https://arxiv.org/pdf/gr-qc/0110086  
[6] https://arxiv.org/pdf/gr-qc/9905084  
[7] https://arxiv.org/pdf/gr-qc/9410043  
[8] https://arxiv.org/pdf/gr-qc/9702026  

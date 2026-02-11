# Warp Panel Congruence Audit

Status: in progress
Owner: dan
Date: 2026-02-10
Scope: UI panels and proof surfaces that demonstrate the warp bubble solve and guardrails.

## Purpose
Provide a per-panel audit of where the UI demonstrates geometry-derived vs proxy-only telemetry, and what remains to reach CL4-congruent proof surfaces everywhere. This audit does not retune the pipeline; it documents sources and congruence labels only.

See `docs/warp-congruence-figure-review.md` for the notation-aligned figure provenance map.

## Legend
- Source: where the panel data comes from (proof pack vs pipeline snapshot vs brick).
- Congruence: whether the displayed values are geometry-derived, conditional, or proxy-only.
- Conditional: metric-derived only when metric adapters and constraint sources are present.

## Tier A: Guardrail and Proof Surfaces (Proof Pack)
These panels consume `/api/helix/pipeline/proofs` and surface proxy flags and source metadata. They are CL4-safe surfaces because they show explicit `source` and `proxy` tags, but their values remain conditional if metric-derived inputs are missing.

| Panel | Source | Key Signals (non-exhaustive) | Congruence Status | Notes / Gaps |
| --- | --- | --- | --- | --- |
| `FrontProofsLedger` | proof pack | `metric_t00_*`, `metric_k_*`, `gr_rho_constraint_*`, `qi_*`, `theta_*` | Conditional | Shows metric diagnostics and CL3 provenance. Still conditional when metric-derived inputs are missing. |
| `WarpProofPanel` | proof pack | `gr_rho_constraint_*`, `metric_t00_*`, `metric_k_*`, `stress_meta_*`, `curvature_meta_*` | Conditional | Explicit source/proxy tags and CL3/CL4 badges. |
| `DriveGuardsPanel` | proof pack + pipeline | Guardrails (ThetaAudit, FordRomanQI, VdB band, CL3 delta), `gr_rho_constraint_*` | Conditional | CL3 gate and delta telemetry are now visible; strict guardrails apply when metric sources exist. |
| `NeedleCavityBubblePanel` | proof pack | Stress/constraint diagnostics, proof badges | Conditional | Uses proof pack and proxy flags; depends on metric-derived availability. |
| `CardProofOverlay` | proof pack | Proof badges and stage-proxy hints | Conditional | Lightweight badge surface; relies on proof pack proxy flags. |
| `visual-proof-charts` | proof pack | Time series of proof values, proxy flags | Conditional | Shows proof pack values; remains conditional on metric-derived sources. |
| `PipelineProofPanel` | proof pack | Proof pack diagnostics and source tags | Conditional | Source/proxy labels are present; depends on metric path. |
| `QiWidget` | proof pack + pipeline | `qi_*`, `gr_rho_constraint_*`, `metric_t00_*` | Conditional | Uses metric-derived QI path when available; strict mode blocks proxy-only. |
| `QiAutoTunerPanel` | proof pack + pipeline | `qi_*`, metric source tags | Conditional | Same as above; strict mode blocks proxy-only. |
| `TimeDilationLatticePanel` (debug overlay) | proof pack | `qi_*`, `metric_k_*`, `gr_rho_constraint_*` | Conditional | Debug overlay includes QI source + curvature window status. |

## Tier B: Pipeline Telemetry Panels (useEnergyPipeline)
These panels show calibrated pipeline telemetry. They are valid operational dashboards but should not be interpreted as CL4-congruent proofs unless the panel explicitly shows `stressMeta`/`curvatureMeta` or proof pack sources.

| Panel | Source | Congruence Status | Notes / Gaps |
| --- | --- | --- | --- |
| `EnergyFluxPanel` | pipeline snapshot | Conditional | Shows `stressMeta` and source/congruence badges; still conditional on metric-derived availability. |
| `CurvatureSlicePanel` | pipeline snapshot | Conditional | Displays `curvatureMeta` badges; underlying data may still be proxy-only. |
| `CurvatureLedgerPanel` | pipeline snapshot | Conditional | Source/congruence tags available but not a proof surface. |
| `CurvaturePhysicsPanel` | pipeline snapshot | Proxy-only | Telemetry only unless metric-derived curvature is surfaced. |
| `CurvatureTensorPanel` | pipeline snapshot | Proxy-only | Telemetry only; no proof pack source tags. |
| `AmplificationPanel` | pipeline snapshot | Proxy-only | Shows calibrated gains; not geometry-derived. |
| `BubbleFieldPanel` | pipeline snapshot | Proxy-only | Uses pipeline telemetry, not constraint-closed geometry. |
| `CavityMechanismPanel` | pipeline snapshot | Proxy-only | Displays pipeline/gains. |
| `ShiftVectorPanel` | pipeline snapshot | Proxy-only | Pipeline view of shift-like telemetry; not metric-derived unless explicitly tagged. |
| `WarpBubbleLivePanel` | pipeline snapshot | Proxy-only | Operational telemetry view. |
| `WarpEngineContainer` | pipeline snapshot | Proxy-only | Aggregates pipeline telemetry. |
| `WarpExperimentLadderPanel` | pipeline snapshot | Proxy-only | Not a proof surface. |
| `SpeedCapabilityPanel` | pipeline snapshot | Proxy-only | Shows operational outputs. |
| `VacuumGapSweepHUD` | pipeline snapshot | Proxy-only | Sweep UI, not proof. |
| `QiGuardBadge` | pipeline snapshot | Conditional | Uses QI flags but still conditional; not a full proof pack surface. |

## Tier C: Brick / Lattice Surfaces
These are downstream renderers for curvature or stress bricks. They are not proof sources, but they must not imply CL4 congruence.

| Panel | Source | Congruence Status | Notes / Gaps |
| --- | --- | --- | --- |
| `CurvatureSlicePanel` | curvature brick + pipeline meta | Conditional | Curvature meta tags exist; ensure proxy labeling stays visible. |
| `CurvatureLedgerPanel` | curvature brick + pipeline meta | Conditional | Same as above. |
| `TimeDilationLatticePanel` (visual) | lattice probes + pipeline meta | Conditional | Debug overlay shows QI source; the field remains conditional. |

Note: curvature bricks now use metric K scale when metric diagnostics are present, but voxel fields remain synthetic envelopes, so CL4 is still conditional.

## What Remains to Do (for full CL4 UI coverage)
1. Add explicit `source`/`congruence`/`proxy` labels to pipeline-only panels that currently expose raw telemetry without context.
2. For panels that are used as proofs, prefer proof pack values over pipeline snapshot values.
3. Maintain a strict separation between proxy telemetry and metric-derived truth in UI copy and badges.

## Closure Checklist (post-viability)
Use this checklist after running `docs/warp-definitive-viability-task.md` to close remaining UI congruence gaps.

1. Confirm the definitive viability run output and link it.
   Evidence: `reports/warp-viability-run-final.json` (current status: INADMISSIBLE).
2. For any panel used as a proof surface, ensure it consumes proof pack values (not raw pipeline fields).
3. For pipeline-only panels, add `stressMeta`/`curvatureMeta` badges or explicit "proxy-only" labels.
4. For any panel that shows QI or TS guardrail results, display `rhoSource`, `metricDerived`, and `qi_strict_*` fields.
5. Surface `congruence_missing_parts` in at least one guardrail panel so missing CL4 inputs are explicit.
6. Re-run the panel audit after changes and update this file with a new "post-closure" table.

## Telemetry Congruence Coverage (Universal)
This section summarizes which pipeline signals are eligible for universal CL4 coverage. The calibrated pipeline remains the operational baseline; metric-derived telemetry is an overlay used for strict congruence and proof surfaces.

| Signal | Source | Geometry-Derived Status | Proof Surfaces | Gaps |
| --- | --- | --- | --- | --- |
| `warp.metricT00` | metric adapters + GR diagnostics | Conditional | proof pack, QI panels, strict guardrails | Missing on any chart/surface without a declared adapter; VdB B(r) derivatives not universal. |
| `rho_constraint` | GR constraint evaluator | Conditional | proof pack, CL3 delta | Requires consistent matter projections and metric-derived inputs. |
| `theta_geom` | metric adapter diagnostics | Conditional | proof pack, ThetaAudit | Missing when adapter diagnostics are absent; VdB full B(r) coupling incomplete. |
| `theta_pipeline_proxy` / `theta_pipeline_cal` | pipeline telemetry | Proxy-only | pipeline panels only | Must never be treated as CL4 evidence. |
| `T00_avg` | pipeline telemetry | Proxy-only | pipeline panels only | Not constraint-closed; excluded from strict guardrails. |
| `qi_*` | QI guardrail path | Conditional | proof pack, QI panels | Strict mode blocks proxy-only sources; curvature-window is undefined if invariants are missing. |
| `vdb_region_*` diagnostics | VdB derivative checks | Conditional | proof pack, DriveGuards, NeedleCavity, Lattice debug | Surfaced on panels; still conditional where derivatives are not computed on a chart/surface. |
| `ts_ratio` | timing guardrail | Conditional | proof pack, strict guardrails | Must be metric-derived from proper distances; proxy timing must be rejected in strict mode. |
| `stressMeta` / `curvatureMeta` | pipeline metadata | Conditional | pipeline panels | Must clearly label provenance; does not itself make signals geometry-derived. |

## Actionable Audit Deltas (Telemetry to Universal Coverage)
1. Enumerate all active charts/surfaces and mark where `warp.metricT00`, `theta_geom`, and `rho_constraint` are missing.
2. Ensure VdB region-II derivatives (`B'`, `B''`) are computed anywhere `gammaVdB > 1` is active.
3. Enforce strict-mode rejection for proxy-only `theta` and `T00_avg` on proof surfaces.
4. Require proof pack surfaces to display source labels for all guardrail-relevant signals.

## Related References
- `docs/warp-geometry-cl4-guardrail-map.md`
- `docs/warp-congruence-audit.md`
- `docs/warp-congruence-universal-coverage-task.md`
- `docs/warp-definitive-viability-task.md`

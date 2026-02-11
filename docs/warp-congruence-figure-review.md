# Warp Congruence Figure Review

Status: draft
Owner: dan
Date: 2026-02-11
Scope: map every proof-facing figure/panel to proof-pack telemetry and canonical GR notation, and document where values are constraint-closed vs proxy-only.

## Purpose
This document gives a figure-by-figure provenance map so the UI can be compared to Alcubierre, Natario, and Van Den Broeck notation without ambiguity. It also records where the current solution is metric-derived and where it remains proxy-only.

## Sources
- `docs/warp-panel-congruence-audit.md`
- `docs/warp-geometry-congruence-report.md`
- `docs/warp-geometry-congruence-state-of-the-art.md`
- `docs/warp-universal-coverage-closure-checklist.md`
- `reports/warp-universal-coverage-audit-live.md`
- `reports/warp-universal-coverage-matrix-live.md`

## Figure Provenance Tables

### Tier A: Proof Surfaces (Proof Pack)
Panels in this tier are CL4-safe when they show proof-pack `source` and `proxy` tags.

| Panel | Data Source | Key Signals | Canonical Notation | Congruence Status |
| --- | --- | --- | --- | --- |
| `WarpProofPanel` | proof pack | `metric_t00_*`, `gr_rho_constraint_*`, `metric_k_*`, `theta_*`, `qi_*`, `ts_*` | `rho_E = T_ab n^a n^b`, `K`, `Tr K`, `theta`, QI bounds | Conditional, metric-derived when contract is ok |
| `DriveGuardsPanel` | proof pack + pipeline | `gr_cl3_rho_gate`, `theta_*`, `qi_*`, `vdb_region_*` | CL3 delta, expansion scalar, QI bound, VdB derivative diagnostics | Conditional, strict mode blocks proxy-only |
| `FrontProofsLedger` | proof pack | `metric_t00_*`, `metric_k_*`, `gr_rho_constraint_*`, `qi_*` | Same as above | Conditional |
| `PipelineProofPanel` | proof pack | proof-pack diagnostics and provenance | Same as above | Conditional |
| `NeedleCavityBubblePanel` | proof pack | stress/constraint badges, metric vs proxy tags | `rho_E`, constraint rho | Conditional |
| `CardProofOverlay` | proof pack | badges only | summary provenance | Conditional |
| `visual-proof-charts` | proof pack | time series of `theta`, `qi`, `rho` | time series of derived scalars | Conditional |
| `QiWidget` / `QiAutoTunerPanel` | proof pack + pipeline | `qi_*`, `metric_t00_*`, `gr_rho_constraint_*` | Ford-Roman QI with metric-derived rho | Conditional, strict mode enforces metric sources |
| `TimeDilationLatticePanel` (debug overlay) | proof pack | `qi_*`, `metric_k_*`, `gr_rho_constraint_*` | curvature + QI overlays | Conditional |

### Tier B: Operational Telemetry (Pipeline)
These panels show calibrated pipeline telemetry. They are not CL4 proof surfaces unless they explicitly show provenance badges.

| Panel | Data Source | Key Signals | Canonical Notation | Congruence Status |
| --- | --- | --- | --- | --- |
| `EnergyFluxPanel` | pipeline snapshot | `stressMeta`, `T00_avg` | proxy stress energy | Proxy-only unless `stressMeta` indicates metric |
| `CurvatureSlicePanel` | pipeline snapshot + curvature brick | `curvatureMeta`, kappa proxies | proxy curvature | Conditional |
| `CurvatureLedgerPanel` | pipeline snapshot | curvature metadata | proxy curvature | Conditional |
| `CurvaturePhysicsPanel` | pipeline snapshot | curvature proxy fields | proxy | Proxy-only |
| `CurvatureTensorPanel` | pipeline snapshot | tensor diagnostics | proxy | Proxy-only |
| `AmplificationPanel` | pipeline snapshot | `gammaGeo`, `gammaVdB`, `q*` | pipeline gains | Proxy-only |
| `BubbleFieldPanel` | pipeline snapshot | field telemetry | proxy | Proxy-only |
| `CavityMechanismPanel` | pipeline snapshot | hardware-side telemetry | proxy | Proxy-only |
| `ShiftVectorPanel` | pipeline snapshot | shift telemetry | proxy unless adapter-derived | Proxy-only |
| `WarpBubbleLivePanel` | pipeline snapshot | operational outputs | proxy | Proxy-only |
| `WarpEngineContainer` | pipeline snapshot | aggregated telemetry | proxy | Proxy-only |
| `WarpExperimentLadderPanel` | pipeline snapshot | calibration ladder | proxy | Proxy-only |
| `SpeedCapabilityPanel` | pipeline snapshot | kinematic telemetry | proxy | Proxy-only |
| `VacuumGapSweepHUD` | pipeline snapshot | sweep telemetry | proxy | Proxy-only |

### Tier C: Brick/Lattice Surfaces
Bricks are downstream renderers. They must not imply CL4 validity without proof-pack provenance.

| Panel | Data Source | Key Signals | Canonical Notation | Congruence Status |
| --- | --- | --- | --- | --- |
| `CurvatureSlicePanel` | curvature brick | kappa proxies | proxy curvature | Conditional |
| `CurvatureLedgerPanel` | curvature brick | kappa proxies | proxy curvature | Conditional |
| `TimeDilationLatticePanel` (visual) | lattice probes | field visualization | proxy unless metric-derived | Conditional |

## Notation Alignment Appendix

This maps repo signals to standard GR notation.

| Repo Signal | Paper Notation | Meaning |
| --- | --- | --- |
| `metric_t00_*` | `rho_E = T_ab n^a n^b` | Eulerian energy density used in Alcubierre/Natario/VdB |
| `gr_rho_constraint_*` | Hamiltonian constraint | `R + K^2 - K_ij K^ij = 16p rho_E` |
| `metric_k_trace_mean` | `Tr K` | trace of extrinsic curvature |
| `metric_k_sq_mean` | `K_ij K^ij` | curvature invariant used in CL3 |
| `theta_metric_*` | `theta` | expansion scalar (`-Tr K` or `div X` with sign conventions) |
| `vdb_region_ii_*` | `B'(r), B''(r)` | VdB region-II derivative diagnostics |
| `vdb_region_iv_*` | `f'(r)` | Alcubierre wall derivative diagnostics |
| `qi_*` | Ford-Roman QI | time-averaged inequality bounds |
| `ts_*` | sampling ratio | time-scale ratio for averaging validity |
| `T00_avg` | pipeline proxy | non-constraint-closed stress-energy proxy |
| `theta_pipeline_cal`, `theta_pipeline_raw` | pipeline proxy | calibration-derived scalar, not geometric |

## Strengths and Shortcomings (Current State)

### Strengths
- Natario canonical path is **constraint-closed** and metric-derived in the proof pack.
- CL3 delta uses constraint rho vs metric T00 (not pipeline proxy).
- VdB region II and IV derivative diagnostics are present when `gammaVdB > 1`.

### Shortcomings
- Several pipeline-only panels remain proxy-only with no proof-pack provenance.
- Universal coverage is only proven for the **active families and chart**; new charts require re-audit.
- Proxy signals (`theta_pipeline_cal`, `T00_avg`) remain in the UI and must never be treated as CL4 evidence.

## Literature Gap Analysis
See `docs/warp-literature-runtime-gap-analysis.md` for the equation-aligned mapping of runtime signals, primary-source anchors, and prioritized gap closures.

## Canonical Runtime Overview
See `docs/warp-canonical-runtime-overview.md` for the live canonical metric/constraint/guardrail snapshot that can be refreshed from the proof pack.

## Action Items

1. Ensure proof-pack surfaces remain the sole CL4 proof surfaces.
2. Maintain strict-mode rejection for proxy-only fields.
3. Re-run the matrix audit whenever a new family or chart is introduced.
4. Update this review after any new panels or proof-pack fields are added.

# Warp Literature vs Runtime Gap Analysis

Status: draft
Owner: dan
Date: 2026-02-11
Scope: canonical Natario-based runtime signals vs primary literature equations (Alcubierre, Natario, Van Den Broeck, ADM/3+1 references).

## Purpose
Provide a literature-aligned gap analysis for runtime signals and UI proof surfaces. This document treats repo docs as the authoritative definition of runtime meanings, and the papers as the authority for equation alignment.

## Legend (Alignment Status)
- `EXACT`: same quantity as a cited equation/definition if computed as stated.
- `DERIVED (convention-sensitive)`: derivable from cited equations but depends on sign, observer, chart, or unit normalization.
- `PROXY_ONLY`: telemetry/budget proxy with no direct GR equation.
- `NO_DIRECT_SOURCE`: metadata or UI bookkeeping, not a GR quantity.

## Mapping Table (Runtime Signal -> Literature)

| Runtime Signal | Closest Literature Equation(s) | Alignment Status | Required Match (chart/observer/units) | Gap / Closure Requirement | Falsifier |
| --- | --- | --- | --- | --- | --- |
| `metric_t00_*` | Eulerian density projection `rho = T_ab n^a n^b` (B&S Eq. 8); Alcubierre Eq. 19; Natario Thm 1.7 identity; VdB Eq. 11 | DERIVED (convention-sensitive) | Must declare Eulerian observer, chart, and normalization; SI/geom conversion explicit | VdB requires orthonormal frame or explicit ADM equivalence | If `metric_t00_*` does not reproduce Alcubierre Eq. 19 in the Alcubierre special case, it is not aligned |
| `gr_rho_constraint_*` | Hamiltonian constraint (B&S Eq. 4); Natario Thm 1.7 identity | EXACT (definition) | 3+1 conventions and factor normalization must be consistent | None if explicitly defined as constraint-derived | If constraint residual is not ~0 on known data, the signal is not constraint-derived |
| `metric_k_trace_mean` (`Tr K`) | B&S Eq. 2 and Eq. 3 (d/dt = partial_t - L_beta); Alcubierre Eq. 9-10; Natario Prop 1.4 | DERIVED (convention-sensitive) | Depends on chart and d/dt definition | Must declare chart contract and use same ADM fields used by adapter | If Alcubierre relation `theta = -alpha TrK` fails, sign or chart mismatch exists |
| `metric_k_sq_mean` (`K_ij K^ij`) | Natario Thm 1.7 identity; B&S Eq. 4 | DERIVED (mildly convention-sensitive) | Indices raised with adapter gamma_ij (notably VdB has B^2 delta_ij) | Must show gamma_ij used in raising indices | If sign of K^2 changes under convention switches, computation is wrong |
| `theta_metric_*` / `theta_geom` | Alcubierre Eq. 11-12; Natario Cor 1.5 | DERIVED (convention-sensitive) | Natario uses div X; repo often uses div beta with beta = -X | Must expose both theta_author and theta_beta if comparing across authors | If Natario zero-expansion family yields nonzero theta beyond noise, not aligned |
| `theta_pipeline_cal`, `theta_pipeline_raw`, `theta_pipeline_proxy` | No GR equation | PROXY_ONLY | N/A | Replace or supplement with geometry-derived theta | If these vary with gains but are insensitive to spatial derivatives, not GR theta |
| `T00_avg` | No GR equation | PROXY_ONLY | N/A | Replace or supplement with constraint-derived rho | If used as GR rho, constraint residuals fail |
| `qi_*` / `FordRomanQI` | Ford-Roman QI; VdB Eq. 17 and Eq. 21 (tau0 vs curvature radius) | DERIVED (assumption-sensitive) | Requires defined observer worldline and tau0 in proper time | Bind tau0 to curvature radius condition (tau0 << r_c) | If tau0 is not small vs r_c, VdB applicability condition fails |
| `ts_*` / `TS_ratio_min` | VdB Eq. 21 and curvature radius definitions | DERIVED (assumption-sensitive) | Must explicitly encode tau0 vs r_c condition | If TS is operational only, label as proxy | If tau0 is not small vs r_c while TS passes, mapping invalid |
| `vdb_region_ii_*` | VdB Eq. 4-5 and Eq. 11 (B', B'') | EXACT (if derivatives computed) | Must be same B(r) and derivative definitions | Must enforce derivative evidence for region-II claims | If B varies but region-II diagnostics show no support, not aligned |
| `vdb_region_iv_*` | Alcubierre Eq. 6, 12, 19; Natario Example 1.8; VdB Eq. 5 (qualitative f) | DERIVED (model-choice sensitive) | Exact for Alcubierre tanh f; VdB f is not fixed | If using Alcubierre f in VdB, must declare as modeling choice | Claiming "paper-faithful" without declaring modeling choice is invalid |
| `gammaVdB` / `VdB_band` | No direct equation as a single scalar | PROXY_ONLY | N/A | Must implement full B(r) + derivatives for alignment | If region-II stress is unchanged when B' or B'' changes, proxy |
| Contract metadata (observer, normalization, unit system, chart) | No direct equation; required for interpretability | NO_DIRECT_SOURCE | Must match observer and normalization used in equation references | Populate `metric_chart_notes` and coordinate map | If different observers are used without declaration, CL4 comparability fails |

## Recommended Gap-Closure Citations (Primary Sources)

1. Baumgarte & Shapiro (1998) - ADM split, constraints, and matter projections (Eqs. 1-5, 8).
2. Alcubierre (1994) - ADM fields (Eqs. 2-6), K_ij (Eqs. 9-10), expansion (Eqs. 11-12), Eulerian density (Eqs. 18-19).
3. Natario (2002) - Def 1.1, Prop 1.4, Cor 1.5, Thm 1.7, Example 1.8.
4. Van Den Broeck (1999) - metric and region structure (Eqs. 4-5), orthonormal frame (Eq. 10), region-II density (Eq. 11), QI condition (Eq. 17, 21).
5. Pfenning & Ford (1997) - sigma-to-wall thickness mapping (Eq. 5).

## Prioritized Gap List (Comparability Wins)

1. Enforce explicit "metric-derived vs proxy" labeling on every proof surface and export.
2. Make chart/slicing explicit as runtime signal (`metric_coordinate_map`, `metric_chart_notes`) to lock K_ij and theta definitions.
3. Require VdB derivative evidence for any region-II alignment claims across all active surfaces.
4. Bind QI signals to observer worldline and tau0 definition with curvature radius applicability.
5. Promote constraint-derived rho as the primary CL3 comparator (pipeline T00_avg remains diagnostic only).

## Related Documents
- `docs/warp-congruence-figure-review.md`
- `docs/warp-geometry-congruence-report.md`
- `docs/warp-geometry-congruence-state-of-the-art.md`
- `docs/warp-geometry-cl4-guardrail-map.md`

# Warp Geometry Congruence Report (Expanded)

Status: draft
Owner: dan
Scope: Alcubierre (1994), Natario (2002), Van Den Broeck (1999), Needle Hull Mk1 citations (repo)

## Purpose
Produce a falsifiable, equation-first congruence analysis of canonical warp metrics and map them to repo geometry and constraint functions without hand-tuned scaling. Casimir/cavity pipeline is assumed solved; focus here is GR geometry alignment, divergences, and where guardrail constraints are judged.

Canonical runtime contract (2026-02-11):
- Baseline family: `natario` (comoving_cartesian chart, Eulerian observer, SI stress normalization).
- Secondary family: `alcubierre` (supported for audits and alternate runs, not the baseline reference).

Primary equations and citations are mirrored from `docs/warp-geometry-comparison.md` so this report is a 1:1 representation with added congruence reasoning and guardrail mapping.

## Inputs
- Needle Hull Mk1 citation trace provided in `docs/needle-hull-citation-trace.md` (status: provided_unverified; provenance only).
- Needle Hull runtime solve evidence from repo pipelines, guardrails, and proof-pack contracts.
- Primary sources only (journal PDFs, arXiv, book chapters).
- Use arXiv PDFs plus arXiv metadata pages for DOI/journal refs.

## Deliverables
1. Source list with citations (author, year, title, URL/DOI/arXiv).
2. Equation sheet with numbered equations and definitions.
3. Comparison matrix (Natario vs Alcubierre vs Van Den Broeck).
4. Falsifiable checks list (what would disprove alignment).
5. Mapping notes to implementation parameters (R, sigma, beta/shift, etc.).
6. Congruence notes that state where the metrics match or diverge in ADM form.
7. Constraint-function map that shows where repo guardrails judge geometry-derived quantities.
8. Figure provenance review that maps UI panels to proof-pack sources and canonical notation.
9. Literature vs runtime gap analysis for equation alignment and proxy-only signals.
10. Canonical runtime overview snapshot (metric/constraint/guardrail values).

## Figure Provenance Review
See `docs/warp-congruence-figure-review.md` for the full panel-to-proof-pack mapping and notation alignment appendix. This is the canonical crosswalk for comparing UI figures to Alcubierre/Natario/VdB notation.

## Literature Gap Analysis
See `docs/warp-literature-runtime-gap-analysis.md` for the equation-aligned mapping of runtime signals, primary-source anchors, and prioritized gap closures.

## Canonical Runtime Overview
See `docs/warp-canonical-runtime-overview.md` for the live canonical metric/constraint/guardrail snapshot that can be refreshed from the proof pack.

## Primary Source List

### Alcubierre (1994)
- Miguel Alcubierre (1994, arXiv upload 2000), "The warp drive: hyper-fast travel within general relativity"
- arXiv: gr-qc/0009013
- Journal: Class. Quant. Grav. 11 L73-L77 (1994)
- DOI: 10.1088/0264-9381/11/5/001
- PDF: https://arxiv.org/pdf/gr-qc/0009013
- arXiv: https://arxiv.org/abs/gr-qc/0009013

### Natario (2002)
- Jose Natario (2002), "Warp Drive With Zero Expansion"
- arXiv: gr-qc/0110086
- Journal: Class. Quant. Grav. 19 (2002) 1157-1166
- DOI: 10.1088/0264-9381/19/6/308
- PDF: https://arxiv.org/pdf/gr-qc/0110086
- arXiv: https://arxiv.org/abs/gr-qc/0110086

### Van Den Broeck (1999)
- Chris Van Den Broeck (1999), "A warp drive with more reasonable total energy requirements"
- arXiv: gr-qc/9905084
- Journal: Class. Quant. Grav. 16 (1999) 3973-3979
- DOI: 10.1088/0264-9381/16/12/314
- PDF: https://arxiv.org/pdf/gr-qc/9905084
- arXiv: https://arxiv.org/abs/gr-qc/9905084

### Needle Hull Mk1 citations (provided, unverified)
- Citation trace: `docs/needle-hull-citation-trace.md` (provided_unverified).
- Runtime solve status is documented below and can be audited independently from external citation mapping.

Copyable URLs (kept in code as requested):

```text
Alcubierre PDF: https://arxiv.org/pdf/gr-qc/0009013
Natario PDF:    https://arxiv.org/pdf/gr-qc/0110086
VdB PDF:        https://arxiv.org/pdf/gr-qc/9905084

Alcubierre abs: https://arxiv.org/abs/gr-qc/0009013
Natario abs:    https://arxiv.org/abs/gr-qc/0110086
VdB abs:        https://arxiv.org/abs/gr-qc/9905084
```

## Needle Hull Mk1 - Pipeline Numeric Trace (Calibrated Mode)
This section now includes two views:
- Submitted baseline: the user-provided narrative, preserved as the comparison framework.
- Repo-calculated trace: the authoritative numbers produced by the current code defaults.

### A) Submitted baseline (user-provided, unverified)
The following is preserved verbatim as the framework the congruence report must compare against. It is not assumed to be code-accurate.

```text
Here?s a full numeric trace using the current default pipeline values and the exact formulas in the code. I?m using the default ?calibrated? model mode and the default mechanical feasibility clamp, so the Casimir gap is bumped from 1 nm to 96 nm before any energy math. #alcubierre #casimireffect

Step 0 ? Defaults resolved (from code)
Default modulation freq: 15 GHz from energy-pipeline.ts.
Default gap request: 1.0 nm, but mechanical feasibility clamps to 96 nm in calibrated mode (roughness + stiffness margin) via mechanicalFeasibility in energy-pipeline.ts.
Tile area: 25 cm? = 0.0025 m? in energy-pipeline.ts.
Gains: gammaGeo = 26, gammaVdB = 1e11, qCavity = 1e9, qMechanical = 1, qSpoilingFactor = 1 from energy-pipeline.ts.
Duty effective (FR): dutyLocal 0.14 and S_live/S_total = 1/400 ? d_eff = 0.14 * 0.0025 = 3.5e-4 from the duty logic in energy-pipeline.ts.
Natario homogenization uses tauLC = 1e-7 s when not provided (default in natario-metric.ts).

Step 1 ? modulationFreq_GHz ? omega
f = 15e9 Hz
omega = 2? f = 9.4247779608e10 rad/s
Source: energy-pipeline.ts (omega calculation).

Step 2 ? Static Casimir energy per tile (U_static)
gap = 96 nm = 9.6e-8 m
area = 0.0025 m?
U_static = - (??/720) * (?c) * A / a? / 2
U_static = -6.1229459656e-10 J
Source: static-casimir.ts, physics-constants.ts.

Step 3 ? Geometry amplification (U_geo, U_Q)
gammaGeo^3 = 26^3 = 17576
U_geo = U_static * gammaGeo^3 = -1.0761689829e-5 J
U_Q = U_geo * qMechanical = -1.0761689829e-5 J
Source: energy-pipeline.ts.

Step 4 ? omega ? P_loss
P_loss_raw = |U_Q| * omega / Q
P_loss_raw = 1.014265371e-3 W per tile
Source: energy-pipeline.ts.

Step 5 ? U_static ? T00_avg
V_tile = area * gap = 0.0025 * 9.6e-8 = 2.4e-10 m?
rho_flat = U_static / V_tile = -2.5512274857 J/m?
rho_inst = rho_flat * gammaGeo^3 * gammaVdB * sqrt(qCavity/1e9) * qSpoil
rho_inst = -4.4840374288e15 J/m?
T00_avg = rho_inst * d_eff = -1.5694131001e12 J/m?
Source: natario-metric.ts (stress-energy mapping).

Step 6 ? Homogenization ratio
f = 6.6667e-11 s
 tauLC = 6.6667e-4
Source: natario-metric.ts.

Step 7 ? Curvature proxy
K = (8?G/c^4) * |T00_avg| * exp(-ratio)
K = 3.2569456800e-31 1/m?
Source: natario-metric.ts.
```

### B) Repo-calculated default trace (authoritative)
This trace follows the current default pipeline values and the exact formulas in code. Numbers were obtained by running `initializePipelineState()` + `calculateEnergyPipeline()` and then `natarioFromPipeline()` with default env settings.

Step 0 - Defaults resolved (from code)
- Model mode: calibrated (default `MODEL_MODE` in `server/energy-pipeline.ts`).
- Modulation frequency: 15 GHz (`DEFAULT_MODULATION_FREQ_GHZ`).
- Requested gap: 1.0 nm; mechanical feasibility recommends 96 nm; calibrated mode uses the constrained gap for Casimir (`mechanicalFeasibility()` + `calculateEnergyPipeline()`).
- Tile area: 25 cm^2 = 0.0025 m^2 (`initializePipelineState()`).
- Gains (seeds): gammaGeo = 26, gammaVdB seed = 1e11, qCavity = 1e9, qMechanical = 1, qSpoilingFactor = 1 (`PAPER_*` constants + defaults).
- gammaVdB clamp: guardGammaVdB limits gammaVdB to minRadius / pocketFloor = 86.5 / (0.01 * wallThickness).
- With wallThickness = C / (15e9) = 0.0199861639 m, the limit is gammaVdB_cal = 432799.41351960227 (this is the value used in the pipeline).
- Duty effective (FR): dutyLocal = 0.14 and S_live/S_total = 1/400, so d_eff = 0.14 * (1/400) = 3.5e-4 (`calculateEnergyPipeline()`).
- Natario homogenization uses tauLC = 1e-7 s when not provided (`computeHomogenization()` in `modules/dynamic/natario-metric.ts`).

Step 1 - modulationFreq_GHz -> omega
- f = 15e9 Hz
- omega = 2*pi*f = 9.424777960769379e10 rad/s
- Source: `calculateEnergyPipeline()` in `server/energy-pipeline.ts`.

Step 2 - Static Casimir energy per tile (U_static)
- gap = 96 nm = 9.6e-8 m
- area = 0.0025 m^2
- For parallel plates, `calculateCasimirEnergy()` computes:
- U_static = - (pi^2/720) * (hbar*c) * A / a^3 / 2
- U_static = -6.122945965634405e-10 J
- Source: `modules/sim_core/static-casimir.ts` and `modules/core/physics-constants.ts`.

Step 3 - Geometry amplification (U_geo, U_Q)
- gammaGeo^3 = 26^3 = 17576
- U_geo = U_static * gammaGeo^3 = -1.076168982919903e-5 J
- U_Q = U_geo * qMechanical = -1.076168982919903e-5 J
- Source: `calculateEnergyPipeline()` in `server/energy-pipeline.ts`.

Step 4 - omega -> P_loss_raw (per tile)
- P_loss_raw = |U_Q| * omega / Q
- P_loss_raw = 1.01426537122871e-3 W
- Source: `calculateEnergyPipeline()` in `server/energy-pipeline.ts`.

Step 5 - U_static -> T00_inst and T00_avg (stress-energy mapping)
- V_tile = area * gap = 0.0025 * 9.6e-8 = 2.4e-10 m^3
- rho_flat = U_static / V_tile = -2.551227485681002 J/m^3
- Qgain = sqrt(qCavity / 1e9) = 1
- rho_inst = rho_flat * gammaGeo^3 * gammaVdB_cal * Qgain * qSpoil
- rho_inst = -1.9406887693988365e10 J/m^3
- T00_avg = rho_inst * d_eff
- T00_avg = -6.792410692895928e6 J/m^3
- Source: `computeStressEnergyFromPipeline()` in `modules/dynamic/natario-metric.ts` using pipeline fields from `server/energy-pipeline.ts`.

Step 6 - Homogenization ratio
- Pulse period: Tp = 1 / (15e9) = 6.666666666666667e-11 s
- tauLC default: 1e-7 s
- ratio = Tp / tauLC = 6.666666666666668e-4
- Source: `computeHomogenization()` in `modules/dynamic/natario-metric.ts`.

Step 7 - Curvature proxy
- K = (8*pi*G/c^4) * |T00_avg| * exp(-ratio)
- K = 1.409604180180402e-36 1/m^2
- Source: `computeCurvatureProxy()` in `modules/dynamic/natario-metric.ts`.

### C) Needle Hull runtime congruence status (current build)
Needle Hull runtime decisioning is no longer represented only by pipeline proxies. The strict
path now relies on metric/contract authority where available.

Strict runtime authority path:
1. Canonical metric stress source is `warp.metricT00` with explicit refs:
   - `warp.metric.T00.alcubierre.analytic`
   - `warp.metric.T00.natario.shift`
   - `warp.metric.T00.natario_sdf.shift`
   - `warp.metric.T00.irrotational.shift`
2. Non-Alcubierre fallback may promote VdB Region II derivative evidence into canonical
   `warp.metricT00` with `metricT00Ref = warp.metric.T00.vdb.regionII`.
3. Contract metadata is emitted and checked for hard guardrails:
   - `metricT00Observer`
   - `metricT00Normalization`
   - `metricT00UnitSystem`
   - `metricT00ContractStatus`
   - `metricT00ContractReason`
4. Theta hard guardrails consume `theta_geom` from metric adapter diagnostics when available.
   VdB conformal adapter methods include `finite-diff+conformal` and `hodge-grid+conformal`.
5. Strict mode blocks missing authority contracts (`contract_missing`,
   `chart_contract_missing`) rather than accepting proxy-only hard paths.

Needle Hull runtime signal classification:
| Signal | CL status | Classification | Notes |
| --- | --- | --- | --- |
| `warp.metricT00` | CL3/CL4 candidate | geometry-derived (conditional by path) | Canonical strict stress source on active family paths. |
| `metricT00Contract*` | CL4 contract | geometry contract metadata | Required for strict hard-decision authority. |
| `theta_geom` | CL2/CL4 candidate | geometry-derived (conditional by adapter) | Derived from adapter divergence diagnostics, with chart contract checks. |
| `theta_pipeline_proxy` / `theta_pipeline_cal` | CL4 excluded | proxy-only | Retained as telemetry fallback, not strict hard authority. |
| `T00_avg` (pipeline map) | CL3 excluded | proxy-only | Pipeline stress map, not equivalent to constraint-closed metric stress by itself. |
| VdB derivative evidence (`B'`, `B''`, two-wall support) | CL2/CL3 partial | geometry-derived diagnostics | Required in strict VdB path when `gammaVdB > 1`; universal chart/surface coverage remains open. |

Mismatch-only paper vs runtime audit:
- `docs/needle-hull-mismatch-audit.md`

Boundary note:
- External Needle Hull citation-to-equation mapping is provided in `docs/needle-hull-citation-trace.md` and remains unverified.
- Runtime congruence claims in this section are repo-evidence claims and should be treated as
  implementation-level until bindings are verified and promoted to a runtime authority.

## Equation Sheet With Numbered Equations and Definitions

### 2.1 Common 3+1 decomposition used for congruence checks

(C1) ADM line element
```
ds^2 = -(alpha^2 - beta_i beta^i) dt^2 + 2 beta_i dx^i dt + gamma_ij dx^i dx^j
```
This is exactly the form Alcubierre writes (his eq. (1)).

(C2) Extrinsic curvature (Alcubierre definition)
```
K_ij = (1 / (2 alpha)) (D_i beta_j + D_j beta_i - d_t gamma_ij)
```
Alcubierre gives this as eq. (9).

(C3) If d_t gamma_ij = 0
```
K_ij = (1 / (2 alpha)) (D_i beta_j + D_j beta_i)
```
Alcubierre explicitly notes the reduction for his (alpha, gamma_ij) choice (eq. (10)).

(C4) Eulerian observers (unit normal) used for energy density
Alcubierre gives:
```
n^a = (1/alpha) (1, -beta^i)
```
```
n_a = -(alpha, 0)
```
He uses alpha^2 T^{00} = T^{ab} n_a n_b.

(C5) Expansion scalar conventions
Alcubierre defines expansion of Eulerian volume elements as
```
theta = -alpha Tr(K)
```
Natario defines expansion as theta = div X for his vector field X.

For implementation congruence, track two objects explicitly:
- theta_beta = D_i beta^i (divergence of the shift)
- theta_author (their printed theta, which may be -Tr(K) or div X)

Congruence criterion: two metrics are congruent in this report if they share the same ADM fields (alpha, beta^i, gamma_ij) up to a coordinate change explicitly provided by the authors. Differences in sign conventions for theta or K_ij are tracked explicitly but are not treated as metric mismatches.

---

### 2.2 Alcubierre (1994): exact metric, ADM fields, and quoted stress-energy

Coordinate conventions and assumptions (in-source)
- Coordinates: (t,x,y,z), ship/bubble moves along x.
- Units: G = c = 1.
- Bubble center trajectory x_s(t), velocity v_s(t) = dx_s/dt.
- Bubble radius coordinate r_s(t) = sqrt((x - x_s(t))^2 + y^2 + z^2).

Metric and ADM fields (in-source)

(A1) ADM fields (Alcubierre eqs. (2)-(5))
```
alpha = 1
beta^x = -v_s(t) f(r_s)
beta^y = beta^z = 0
gamma_ij = delta_ij
```

(A2) Shape function (f(r_s)) (Alcubierre eq. (6))
```
f(r_s) = [tanh(sigma (r_s + R)) - tanh(sigma (r_s - R))] / [2 tanh(sigma R)]
```
with parameters R > 0, sigma > 0.

(A3) Top-hat limit (Alcubierre eq. (7))
As sigma -> infinity, f tends to a step-like profile.

(A4) Line element (Alcubierre eq. (8))
```
ds^2 = -dt^2 + (dx - v_s f(r_s) dt)^2 + dy^2 + dz^2
```

Expansion and extrinsic curvature (partly in-source, partly derived from in-source equations)

(A5) Extrinsic curvature definition and reduction
Given by eq. (9) and reduces to eq. (10) for Alcubierre's (alpha, gamma_ij).

(A6) Expansion of Eulerian volume elements (Alcubierre eqs. (11)-(12))
```
theta = -alpha Tr(K)
```
and Alcubierre gives an explicit expression (eq. (12)).

Using f = f(r_s) and r_s definition, the implementation-friendly form is:
```
theta = v_s (x - x_s) / r_s * df/dr_s
```

(A7) Shift-divergence vs Alcubierre's theta (derived)
With alpha = 1, gamma_ij = delta_ij, beta^i = (-v_s f,0,0):
```
theta_beta = d_i beta^i = d_x beta^x
           = -v_s (x - x_s) / r_s * f'(r_s)
```
So:
```
theta_beta = -theta
```
This is a sign/convention check, not a metric mismatch.

Eulerian energy density and energy-condition notes (in-source)

(A8) Eulerian energy density (Alcubierre eqs. (18)-(19))
```
T^{ab} n_a n_b = alpha^2 T^{00}
= -(1 / (8 pi)) * (v_s^2 * rho^2 / (4 r_s^2)) * (df/dr_s)^2
```
with rho^2 = y^2 + z^2.

(A9) Energy conditions
He states the metric violates weak, dominant, and strong energy conditions, tied to the negative energy density result.

Congruence notes
- Alcubierre is in exact ADM form with flat spatial slices and a single nonzero shift component.
- Any implementation that changes gamma_ij away from delta_ij is no longer congruent to Alcubierre.

---

### 2.3 Natario (2002): general class, Alcubierre special case, and zero-expansion family

Coordinate conventions and assumptions (in-source)
- Definition 1.1: M = R^4 with standard Cartesian coordinates (t,x,y,z).
- The defining data are three bounded smooth functions X^i = (X,Y,Z).
- Natario explicitly says he follows sign conventions of Wald (except index usage) in a footnote.

Metric and ADM fields (in-source + explicit mapping)

(N1) Natario line element (Definition 1.1)
```
ds^2 = -dt^2 + sum_i (dx^i - X^i dt)^2
```

(N2) ADM identification (directly from Definition 1.1)
```
alpha = 1
gamma_ij = delta_ij
beta^i = -X^i
```

Extrinsic curvature and expansion (in-source)

(N3) Extrinsic curvature (Prop 1.4)
```
K_ij = (1/2) (d_i X_j + d_j X_i)
```

Important congruence sign note: since beta^i = -X^i, the ADM formula K_ij = 1/2 (d_i beta_j + d_j beta_i) with d_t gamma = 0 equals minus Natario's K_ij if you compute with beta = -X. This is not speculative; it is the consequence of beta = -X plus linearity.

(N4) Expansion (Cor 1.5)
```
theta = div X
```
Thus:
```
theta_beta = D_i beta^i = -div X = -theta
```

Energy density and energy-condition statement (in-source)

(N5) Eulerian energy density identity (Thm 1.7 proof)
```
rho = T_ab n^a n^b
= (1 / (16 pi)) [ (3)R + (K^i_i)^2 - K_ij K^ij ]
= (1 / (16 pi)) (theta^2 - K_ij K^ij)
```
using (3)R = 0 for the flat Cauchy slices.

(N6) Energy condition claim (Thm 1.7)
Non-flat warp drive spacetimes violate either the weak or the strong energy condition.

Alcubierre as a Natario special case (in-source)

(N7) Example 1.8 choice
```
X = v_s f(r_s), Y = Z = 0
```
with r_s = sqrt((x - x_s)^2 + y^2 + z^2).

Natario then explicitly computes:
- Expansion
```
theta = d_x X = v_s f'(r_s) (x - x_s) / r_s
```
- Energy density
```
rho = -(1 / (32 pi)) v_s^2 [f'(r_s)]^2 (y^2 + z^2) / r_s^2
```
These are algebraically the same wall-localized negativity structure as Alcubierre's eq. (19), up to notational choices like rho^2 = y^2 + z^2.

(N8) Coordinate change to comoving xi
Natario recommends xi = x - x_s(t), which makes r_s = sqrt(xi^2 + y^2 + z^2) independent of t for constant-velocity motion. This is a key "do not accidentally introduce d_t gamma" step for congruence testing.

Zero-expansion construction (in-source, but profile not fixed)

(N9) Divergence-free warp field (Section 2 displayed equation)
He sets X so that div X = 0 by construction; the paper gives an explicit expression and states the required boundary behavior:
- f(r) = 0 for small r
- f(r) = 1/2 for large r

Critical no-inference note: Natario does not specify a closed-form f(r). Only boundary behavior is required in the paper.

(N10) Zero-expansion extrinsic curvature components (Section 2)
Natario lists components such as:
```
K_rr = -2 v_s f' cos(theta)
K_thetatheta = v_s f' cos(theta)
K_phiphi = v_s f' cos(theta)
K_rtheta = v_s sin(theta) (f' + (r/2) f'')
```
with some off-diagonals vanishing.

(N11) Zero-expansion energy density (Section 2)
```
rho = -(1 / (16 pi)) K_ij K^ij
    = -(v_s^2 / (8 pi)) [3 (f')^2 cos^2(theta) + (f' + (r/2) f'')^2 sin^2(theta)]
```
He explicitly checks:
```
theta = K_rr + K_thetatheta + K_phiphi = 0
```

Congruence notes
- Natario shares the same ADM structure as Alcubierre when X is chosen to match v_s f(r_s).
- Zero-expansion Natario is not congruent to Alcubierre because div X = 0 everywhere, while Alcubierre has nonzero shift divergence on the bubble wall.
- Sign conventions for K_ij and theta are flipped relative to ADM when mapping beta = -X. This must be respected in code to avoid false congruence.

---

### 2.4 Van Den Broeck (1999): modified spatial geometry via B(r_s)

Coordinate conventions and assumptions (in-source)
- Units: c = G = hbar = 1 (except when restoring units later).
- For simplicity, velocity v_s is taken constant.
- Geometry is described in regions I-IV with two distinct transition structures: where B varies (region II) and where f varies (region IV). Figure caption explains this partition.

Metric and ADM fields (in-source)

(V1) Modified metric (Van Den Broeck eq. (4))
```
ds^2 = -dt^2 + B^2(r_s) [ (dx - v_s f(r_s) dt)^2 + dy^2 + dz^2 ]
```

(V2) B(r_s) piecewise conditions (eq. (5))
- B(r_s) = 1 + alpha for r_s < R_tilde
- 1 < B(r_s) <= 1 + alpha for R_tilde <= r_s < R_tilde + Delta_tilde
- B(r_s) = 1 for r_s >= R_tilde + Delta_tilde

(V3) f(r_s) conditions (same block as eq. (5))
- f(r_s) = 1 for r_s < R
- 0 < f(r_s) <= 1 for R <= r_s < R + Delta
- f(r_s) = 0 for r_s >= R + Delta
and he requires R > R_tilde + Delta_tilde.

Critical no-inference note: Van Den Broeck does not give a closed-form f(r_s) like Alcubierre's tanh profile. Only these properties are stated.

(V4) ADM lapse and shift (explicitly stated)
He states the metric can be written in 3+1 with lapse = 1 and shift N^i = (-v_s f(r_s),0,0).

From the line element, the spatial 3-metric on t = const slices is:
```
gamma_ij = B^2(r_s) delta_ij
```

Eulerian energy density and energy-condition notes (in-source)

(V5) Orthonormal frame (eq. (10))
```
e0 = d/dt + v_s d/dx
ei = (1/B) d/dx^i
```

(V6) Region-II energy density (eq. (11))
```
T^(hat 0 hat 0) = (1 / (8 pi)) [ (1 / B^4) (d_r B)^2 - (2 / B^3) d_r d_r B - (4 / B^3) (1/r) d_r B ]
```

(V7) B(w) choice (eqs. (12)-(13))
```
B = alpha [ -(n - 1) w^n + n w^(n - 1) ] + 1
w = (R_tilde + Delta_tilde - r) / Delta_tilde
```
He explicitly notes T^(hat0 hat0) becomes negative over much of the transition, with a strong negative peak (eq. (14)).

Expansion and K_ij for Van Den Broeck (not given explicitly; derived)

Van Den Broeck does not print a closed-form theta or an explicit ADM K_ij for the full B^2 delta_ij 3-metric. So:
- Missing in-source: explicit theta = D_i beta^i formula and explicit K_ij in ADM coordinates.
- Allowed here: derive them from V1 + V4 + C2.

If you adopt the comoving coordinate choice consistent with his later local transform (x' = x - v_s t) used to simplify the metric in region II, then r_s = r is time-independent in that chart and d_t gamma_ij = 0 is consistent with using C3.

(V8) Derived shift divergence for gamma_ij = B^2 delta_ij
```
theta_beta = (1 / sqrt(gamma)) d_i (sqrt(gamma) beta^i), sqrt(gamma) = B^3
```
With beta^i = (-v_s f, 0, 0):
```
theta_beta = (1 / B^3) d_x (B^3 (-v_s f))
           = -v_s (d_x f + 3 f d_x ln B)
```
Support prediction: theta_beta is nonzero not only where f varies (region IV), but also where B varies (region II), even if f is constant there. This is the two-wall signature.

(V9) Derived ADM extrinsic curvature structure in comoving chart
With alpha = 1 and d_t gamma_ij = 0:
```
K_ij = (1/2) (D_i beta_j + D_j beta_i)
```
with beta_j = gamma_jk beta^k and gamma_ij = B^2 delta_ij. This yields additional nonzero components compared to Alcubierre because D_i contains Christoffels from B(r). Van Den Broeck does not list these components; you must compute them when implementing his geometry.

Congruence notes
- Van Den Broeck matches Alcubierre only in regions where B(r_s) = 1 (region IV outward). In those regions, gamma_ij reduces to delta_ij and the metric is congruent.
- In the pocket and transition regions where B != 1, the spatial metric is conformally scaled, and K_ij includes a d_t gamma_ij term unless comoving coordinates are used. This is a true geometric divergence.

---

## 3) Comparison Matrix

### 3.1 ADM fields and shape functions (source-exact)
| Item | Alcubierre (1994) | Natario (2002) | Van Den Broeck (1999) |
| --- | --- | --- | --- |
| Coordinates used for definition | Cartesian (t,x,y,z), motion along x | Cartesian (t,x,y,z) in Def. 1.1; spherical (r,theta,phi) for zero-expansion construction | Cartesian, region decomposition I-IV; uses local transform (x' = x - v_s t) later |
| Lapse (alpha) | alpha = 1 (eq. (2)) | alpha = 1 (Def. 1.1 implies) | lapse = 1 (explicit) |
| Shift (beta^i) | beta^x = -v_s f(r_s), others 0 (eqs. (3)-(4)) | beta^i = -X^i (Def. 1.1 matching) | N^i = (-v_s f(r_s),0,0) (explicit) |
| Spatial metric (gamma_ij) | delta_ij (eq. (5)) | delta_ij (Def. 1.1 implies flat induced metric) | B^2(r_s) delta_ij (from eq. (4)) |
| Shape function / profile | Explicit tanh f(r_s) with (R,sigma) (eq. (6)) | General vector field X^i; Example 1.8 uses smooth step f(r_s); Section 2 uses f(r) with boundary behavior only | f(r_s) properties only (no closed form), plus explicit B(r_s) structure and optional polynomial choice |

### 3.2 Geometry outputs: what is given vs what must be computed
| Quantity | Alcubierre | Natario | Van Den Broeck |
| --- | --- | --- | --- |
| Expansion definition | theta = -alpha Tr(K) (eq. (11)) | theta = div X (Cor. 1.5) | Not given as div beta or -Tr(K); must compute |
| Expansion explicit | Given (eq. (12)) | Given for Example 1.8 and for zero-expansion construction (theta = 0) | Not given; derived (theta_beta = (1/B^3) d_x (B^3 beta^x)) |
| K_ij | Definition (eq. (9)) and reduction (eq. (10)); components implied by beta | Prop. 1.4 gives K_ij; zero-expansion components listed | Not listed for full geometry; must compute with D_i of B^2 delta_ij and possibly d_t gamma |
| Eulerian energy density | Given as alpha^2 T^{00} = T^{ab} n_a n_b (eqs. (18)-(19)) | Given in Thm 1.7 proof and explicit examples | Region II: T^(hat0 hat0) given (eq. (11)); sign behavior discussed |
| Energy conditions | Violates WEC/DEC/SEC (text near eq. (19)) | Thm 1.7: non-flat warp drives violate WEC or SEC | Motivates via WEC violation + quantum inequality; region-II energy density can be negative |

---

## 4) Falsifiable comparison table (shared knobs R, sigma, v)

Shared-parameter interpretation rules (so this stays falsifiable)
- Alcubierre: R, sigma are explicit in eq. (6).
- Natario: Example 1.8 accepts a generic smooth step-like f(r_s) but does not define sigma. To compare numerically at fixed (R,sigma), you must choose a profile; the only source-pure option is to reuse Alcubierre's f(r_s) as an input profile. That is an extra modeling choice, not stated by Natario.
- Van Den Broeck: f has only property constraints; B introduces new scales (R_tilde, Delta_tilde, alpha). If you plug Alcubierre's tanh f into VdB, that is again an extra modeling choice (permitted for implementation, but not in paper).

With that understood, here is the falsifiable lights on/off matrix:

| Observable (compute on t = const slice) | Alcubierre warp (tanh f) | Natario Alcubierre special case | Natario zero-expansion family | Van Den Broeck (full B + f) |
| --- | --- | --- | --- | --- |
| theta_beta = D_i beta^i | Nonzero on outer wall where f'(r_s) != 0; ~0 inside/outside | Nonzero similarly (sign depends on div X vs div beta) | Near zero everywhere (analytic theta = 0) | Nonzero in two places: region IV (f varies) and region II (B varies) |
| Tr(K) | Nonzero on wall; sign ties to Alcubierre theta = -alpha Tr(K) | Same, but note Natario theta is div X | Exactly zero (explicitly summed components) | Must compute; generally nonzero where B' != 0 and/or f' != 0 |
| K_ij K^ij | Nonzero on wall where gradients exist | Nonzero on wall; Natario gives explicit rho in Example 1.8 | Nonzero (even though trace is zero) | Nonzero in region II and IV (two-wall) |
| Eulerian energy density rho_E | <= 0 wherever f' != 0 and (y,z) != 0 (eq. (19)) | Explicitly negative on wall | Explicitly negative where K_ij != 0 | Region II density depends on B', B'' (eq. (11)), can be negative with chosen B |
| Flatness inside/outside | Flat inside (f = 1 const) and outside (f = 0 const); curvature on wall | Same logic: flat when X is constant (Cor. 1.6) | Same: interior/exterior flat; wall carries shear with zero expansion | Flat except in region II (B varies) and region IV (f varies) |

Hard falsifier examples
- If your Natario zero-expansion run yields |theta| significantly nonzero away from numerical truncation, it is not that geometry.
- If your Van Den Broeck implementation shows curvature/negative energy only on the outer f-wall and not in the B-transition region, you have not implemented the defining modification.

---

## 5) Falsifiable checks list (disproof-oriented)

### 5.1 ADM-field identity checks (fast, binary)
1. Alcubierre congruence check: confirm gamma_ij = delta_ij exactly and beta^x = -v_s f(r_s) with f exactly as eq. (6). Any deviation means not Alcubierre (1994).
2. Natario class check: confirm the line element matches Def. 1.1 exactly; equivalently alpha = 1, gamma_ij = delta_ij, beta = -X. If your code treats X as shift instead of minus shift, you will flip signs in K_ij and theta.
3. Van Den Broeck class check: confirm the 3-metric is B^2 delta_ij with B piecewise as eq. (5) and shift N^i = (-v_s f,0,0). If you keep gamma_ij = delta_ij, you are in Alcubierre land, not VdB.

### 5.2 Expansion and trace checks (signature tests)
4. Natario zero-expansion: verify theta = 0 as in the paper's explicit check theta = K_rr + K_thetatheta + K_phiphi = 0.
5. Alcubierre wall signature: verify theta changes sign front/back in the bubble (discussion around eq. (12)).
6. Van Den Broeck two-wall signature: verify nontrivial geometric quantities appear in both region II (B varies) and region IV (f varies). The paper says spacetime is flat except in the shaded regions (II and IV).

### 5.3 Energy density falsifiers (negative-energy must show here)
7. Alcubierre energy density negativity: if the expression corresponding to eq. (19) is not non-positive on the wall (away from the symmetry axis where y = z = 0), the implementation is wrong.
8. Natario Thm 1.7 constraint: if you claim non-flat but satisfies both WEC and SEC, you contradict Thm 1.7.
9. Van Den Broeck region II energy density: if your region-II Eulerian energy density does not depend on B' and B'' (as in eq. (11)), your stress-energy extraction is not matching the paper's definition.

### 5.4 Coordinate-time dependence falsifier (quiet source of bugs)
10. Comoving sanity: if you compute K_ij assuming d_t gamma_ij = 0 but also keep r_s(t) = sqrt((x - x_s(t))^2 + ...) with x_s(t) = v_s t, you have an inconsistent coordinate choice. Natario explicitly recommends xi = x - x_s(t) to remove that dependence; Van Den Broeck later uses x' = x - v_s t locally.

---

## 6) Congruence notes (ADM-form matching vs true geometric divergence)

### 6.1 Alcubierre <-> Natario (general class): congruent under beta = -X
Natario's Def. 1.1 metric is literally
```
ds^2 = -dt^2 + sum_i (dx^i - X^i dt)^2
```
If you set X^x = v_s f(r_s) and X^y = X^z = 0, you reproduce Alcubierre's ds^2 = -dt^2 + (dx - v_s f dt)^2 + dy^2 + dz^2.

Where congruence breaks: Natario's zero-expansion family imposes div X = 0 everywhere, so it is not congruent to Alcubierre's expansion/contraction on the wall picture.

### 6.2 Van Den Broeck vs Alcubierre: same shift/lapse, different 3-geometry
Van Den Broeck keeps lapse = 1 and shift N^i = (-v_s f,0,0), but changes the spatial metric to B^2 delta_ij and introduces a second transition region (where B varies).

Congruence statement:
- Congruent to Alcubierre only where B = 1 (region IV outward), because gamma_ij -> delta_ij and the line element reduces to Alcubierre form.
- Not congruent in region II because B(r) changes spatial distances and contributes to curvature and energy density via derivatives of B (eq. (11)).

---

## 7) Mapping notes to implementation parameters (R, sigma, v, beta/shift), no hand scaling

### 7.1 Wall thickness from sigma (Alcubierre tanh profile)
Alcubierre defines f with sigma but does not define wall thickness as a separate quantity.

Two reproducible, falsifiable definitions (pick one and lock it):

Option A: thickness from level-set width of f
- Define Delta_p as the radial distance between f = 1 - p and f = p across the outer wall.
- For large sigma R, the outer wall behaves like a single tanh step, giving:
```
Delta_p approx (2 / sigma) * artanh(1 - 2p)
```
- Example: p = 0.1 -> Delta_0.1 approx 2.197 / sigma.

Option B: thickness from FWHM of |f'(r)|
- For a tanh step, |f'| is proportional to sech^2(sigma (r - R)). The FWHM is:
```
Delta_FWHM approx (2 * arcosh(sqrt(2))) / sigma approx 1.763 / sigma
```

Implementation rule of thumb (deterministic)
- Choose a target physical wall thickness Delta (meters).
- Set sigma = 1.763/Delta if using FWHM, or sigma = 2.197/Delta if using the 10-90 percent definition.

### 7.2 What is sigma for Natario and Van Den Broeck?
- Natario does not define sigma; his f(r) is constrained only by boundary behavior in the zero-expansion construction.
- Van Den Broeck does not define sigma; he uses explicit thickness parameters Delta (for f) and Delta_tilde (for B).

If your repo uses a single sigma knob globally, you need an explicit mapping layer:
- Delta <-> sigma via one of the operational definitions above.
- Delta_tilde remains independent unless you deliberately tie it to Delta (not required by VdB).

### 7.3 Bubble radius R mapped to hull geometry without manual scaling
Define a metric-native hull radius on the slice:
```
R_hull = max_{p in hull} d_gamma(p, center)
```
where d_gamma is proper distance computed from gamma_ij.

Alcubierre and Natario (gamma_ij = delta_ij)
- Proper distance equals Euclidean distance.
- Set R = R_hull + clearance in meters.

Van Den Broeck (gamma_ij = B^2 delta_ij)
- Proper length along a radial curve is:
```
d_gamma(r) = integral_0^r B(s) ds
```
- In pocket region I, B = 1 + alpha is constant, so:
```
d_gamma(r) = (1 + alpha) r
R_tilde = R_hull / (1 + alpha)
```
This avoids hand-tuned scaling and matches the logic of the paper's pocket construction.

---

## 8) Constraint-function map (geometry-derived quantities vs pipeline proxies)

### 8.1 Geometry-derived primitives (compute per metric)
For every metric, the congruence-relevant computed fields are:
- ADM fields: alpha, beta^i, gamma_ij.
- Derived geometry: K_ij, Tr(K), K_ij K^ij, theta_beta = D_i beta^i.
- Eulerian energy density rho_E = T_ab n^a n^b.

### 8.2 Guardrail congruence principle (falsifiable)
A repo guardrail is geometry-congruent to a given paper's warp metric only if the guardrail inputs are computed from the same (alpha, beta, gamma) and the same observer choice used in that paper.

If a guardrail uses a scalar labeled theta but it is not numerically close to D_i beta^i (or div X with the correct sign), congruence is disproven.

### 8.3 Where the guardrails are judged in the repo
| Constraint id | Implemented in | Key inputs | Geometry hook for congruence checks |
| --- | --- | --- | --- |
| FordRomanQI | `tools/warpViability.ts` (constraint assembly), `server/qi/qi-bounds.ts` + `server/qi/qi-monitor.ts` (bound), `server/energy-pipeline.ts` (fordRomanCompliance, zeta) | metric T00 (preferred), duty window, sampling window | Uses metric-derived warp.metricT00 (or GR constraint rho) when available; otherwise falls back to telemetry/pipeline proxies. Congruence only when T00 is derived from the same metric assumptions. |
| ThetaAudit | `modules/warp/warp-metric-adapter.ts` (betaDiagnostics), `tools/warpViability.ts` (threshold check), proxy fallback in `server/energy-pipeline.ts` | theta_geom = D_i beta^i from metric adapter (thetaMax/thetaRms); theta_pipeline_proxy = gammaGeo^3 * qSpoilingFactor * gammaVdB * d_eff | Uses geometry-derived divergence when metric adapter is present; telemetry fallback now lives under `theta_pipeline_*` (proxy-only). `theta_raw`/`theta_cal`/`theta_proxy` are metric-derived overrides in the proof pack. |
| CL3_RhoDelta | `tools/warpViability.ts` (delta check), `server/gr/constraint-evaluator.ts` (rho_constraint), `server/helix-proof-pack.ts` (UI surface) | rho_constraint.mean, matter avgT00 or pipeline rho_avg | Constraint side is geometry-derived; reference T00 is proxy unless derived from the same metric in the declared chart. |
| TS_ratio_min | `server/energy-pipeline.ts` (TS_long, TS_ratio), `tools/warpViability.ts` (threshold check) | hull size, modulation frequency, light-crossing time | Depends on hull geometry and modulation period, independent of the Alcubierre/Natario shift choice. |
| VdB_band | `server/energy-pipeline.ts` (guardGammaVdB clamp + B(r) diagnostics), `tools/warpViability.ts` (band + two-wall support check) | hull radii, wall thickness, gammaVdB, B'(r), B''(r) | Congruence requires the same B(r_s) band and derivative diagnostics used in code; guardrail now checks two-wall support when available. |
| GR constraint gate | `server/gr/constraint-evaluator.ts` (H/M residuals), `server/gr/gr-constraint-policy.ts` (thresholds), `modules/gr/bssn-evolve.ts` (constraint fields) | metric fields, stress-energy fields | Congruence requires that the ADM fields (alpha, beta, gamma_ij) supplied to the GR solver match the intended metric form for each author. |

## 9) Implementation path (where the numbers flow)
1. `server/energy-pipeline.ts` computes Casimir energy, amplification, duty, TS_ratio, and pipeline thetaCal (proxy).
2. `modules/warp/warp-metric-adapter.ts` computes D_i beta^i diagnostics (geometry theta) when a shift field is available.
3. `modules/dynamic/natario-metric.ts` maps pipeline values into stress-energy and curvature proxies.
4. `tools/warpViability.ts` applies WARP_AGENTS constraints (FordRomanQI, ThetaAudit, TS_ratio_min, VdB_band), preferring geometry theta when available.
5. `server/gr/constraint-evaluator.ts` applies the GR constraint gate using thresholds from `server/gr/gr-constraint-policy.ts` and `WARP_AGENTS.md`.

## 9A) Needle Hull citation-ingestion template (provided mapping)
Use this table when you paste Needle Hull citations so runtime signals are bound to explicit equations.

| Runtime signal | Current class | Required citation binding | Equation id(s) | Status |
| --- | --- | --- | --- | --- |
| `warp.metricT00` (`warp.metric.T00.*`) | geometry-derived (conditional) | Show equation chain from metric/ADM fields to Eulerian rho_E or equivalent T00 for each cited Needle Hull branch | TBD | provided_unverified |
| `metricT00ContractObserver` | contract metadata | Identify observer definition used in cited source (Eulerian/comoving/orthonormal) | TBD | provided_unverified |
| `metricT00ContractNormalization` | contract metadata | Map 8*pi normalization convention and unit system in cited source | TBD | provided_unverified |
| `theta_geom` | geometry-derived (conditional) | Bind to expansion definition in cited source (`D_i beta^i`, `-Tr(K)`, or equivalent) | TBD | provided_unverified |
| `theta_pipeline_proxy` / `theta_pipeline_cal` | proxy-only | Either cite as explicit engineering heuristic or mark non-congruent proxy | TBD | provided_unverified |
| `warp.metric.T00.vdb.regionII` fallback | geometry-derived diagnostics (partial) | Bind VdB-like region-II derivative dependence (`B'`, `B''`) to cited Needle Hull method if present | TBD | provided_unverified |
| `FordRomanQI` source path | conditional geometry-derived | Bind sampled-energy inequality assumptions (observer, sampling window, curvature window) | TBD | provided_unverified |
| `CL3_RhoDelta` reference path | mixed | Bind both sides of delta to same chart/observer conventions in source equations | TBD | provided_unverified |

Needle Hull citation trace (provided mapping):
- `docs/needle-hull-citation-trace.md` (normalized table)
- `docs/needle-hull-citation-trace.json` (machine-readable export)

## 10) What I cannot complete yet (per no-inference rule)
- Needle Hull Mk1 citation trace is provided in `docs/needle-hull-citation-trace.md` and is not a runtime authority. Use it for provenance only unless explicitly promoted.

## 11) Maturity and claim boundary
This document is a congruence and traceability report. It does not assert physical feasibility. Viability in this repo means constraint gates pass and a certificate is admissible, per `WARP_AGENTS.md` and `MATH_STATUS.md`.

## Reference Links
[1]: https://arxiv.org/abs/gr-qc/0009013 "https://arxiv.org/abs/gr-qc/0009013"
[2]: https://arxiv.org/pdf/gr-qc/0009013 "arXiv:gr-qc/0009013v1 5 Sep 2000"
[3]: https://arxiv.org/abs/gr-qc/0110086 "https://arxiv.org/abs/gr-qc/0110086"
[4]: https://arxiv.org/pdf/gr-qc/0110086 "arXiv:gr-qc/0110086v3 13 Mar 2002"
[5]: https://arxiv.org/abs/gr-qc/9905084 "https://arxiv.org/abs/gr-qc/9905084"
[6]: https://arxiv.org/pdf/gr-qc/9905084 "arXiv:gr-qc/9905084v5 21 Sep 1999"

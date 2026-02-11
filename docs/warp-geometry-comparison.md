# Warp Geometry Comparison Log

Status: draft
Owner: dan
Scope: Alcubierre (1994), Natario (2002), Van den Broeck (1999), Needle Hull Mk1 citations (repo)

## Purpose
Track a falsifiable, equation-first comparison of canonical warp metrics and map them to
repo geometry parameters without hand-tuned scaling. Casimir/cavity pipeline is assumed
solved; focus here is GR geometry.

## Inputs
- Needle Hull Mk1 citation trace provided in `docs/needle-hull-citation-trace.md` (unverified; provenance only).
- Primary sources only (journal PDFs, arXiv, book chapters).
- Use arXiv PDFs plus arXiv metadata pages for DOI/journal refs.

## Deliverables
1. Source list with citations (author, year, title, URL/DOI/arXiv).
2. Equation sheet with numbered equations and definitions.
3. Comparison matrix (Natario vs Alcubierre vs Van den Broeck).
4. Falsifiable checks list (what would disprove alignment).
5. Mapping notes to implementation parameters (R, sigma, beta/shift, etc.).

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
- Runtime Needle Hull solve behavior is already tracked below from repo evidence so CL3/CL4 status can be audited now.

## Needle Hull Mk1 — Default Pipeline Numeric Trace (Calibrated Mode)
This trace follows the current default pipeline values and the exact formulas in code.
Numbers were obtained by running `initializePipelineState()` + `calculateEnergyPipeline()`
and then `natarioFromPipeline()` with default env settings.

Step 0 — Defaults resolved (from code)
- Model mode: calibrated (default `MODEL_MODE` in `server/energy-pipeline.ts`).
- Modulation frequency: 15 GHz (`DEFAULT_MODULATION_FREQ_GHZ`).
- Requested gap: 1.0 nm; mechanical feasibility recommends 96 nm; calibrated mode uses the
  constrained gap for Casimir (`mechanicalFeasibility()` + `calculateEnergyPipeline()`).
- Tile area: 25 cm^2 = 0.0025 m^2 (`initializePipelineState()`).
- Gains (seeds): gammaGeo = 26, gammaVdB seed = 1e11, qCavity = 1e9, qMechanical = 1,
  qSpoilingFactor = 1 (`PAPER_*` constants + defaults).
- gammaVdB clamp: guardGammaVdB limits gammaVdB to
  minRadius / pocketFloor = 86.5 / (0.01 * wallThickness).
  With wallThickness = C / (15e9) = 0.0199861639 m, the limit is:
  gammaVdB_cal = 432799.41351960227 (this is the value used in the pipeline).
- Duty effective (FR): dutyLocal = 0.14 and S_live/S_total = 1/400, so
  d_eff = 0.14 * (1/400) = 3.5e-4 (`calculateEnergyPipeline()`).
- Natario homogenization uses tauLC = 1e-7 s when not provided
  (`computeHomogenization()` in `modules/dynamic/natario-metric.ts`).

Step 1 — modulationFreq_GHz -> omega
- f = 15e9 Hz
- omega = 2*pi*f = 9.424777960769379e10 rad/s
Source: `calculateEnergyPipeline()` in `server/energy-pipeline.ts`.

Step 2 — Static Casimir energy per tile (U_static)
- gap = 96 nm = 9.6e-8 m
- area = 0.0025 m^2
- For parallel plates, `calculateCasimirEnergy()` computes:
  U_static = - (pi^2/720) * (hbar*c) * A / a^3 / 2
  U_static = -6.122945965634405e-10 J
Source: `modules/sim_core/static-casimir.ts` and `modules/core/physics-constants.ts`.

Step 3 — Geometry amplification (U_geo, U_Q)
- gammaGeo^3 = 26^3 = 17576
- U_geo = U_static * gammaGeo^3 = -1.076168982919903e-5 J
- U_Q = U_geo * qMechanical = -1.076168982919903e-5 J
Source: `calculateEnergyPipeline()` in `server/energy-pipeline.ts`.

Step 4 — omega -> P_loss_raw (per tile)
- P_loss_raw = |U_Q| * omega / Q
- P_loss_raw = 1.01426537122871e-3 W
Source: `calculateEnergyPipeline()` in `server/energy-pipeline.ts`.

Step 5 — U_static -> T00_inst and T00_avg (stress-energy mapping)
- V_tile = area * gap = 0.0025 * 9.6e-8 = 2.4e-10 m^3
- rho_flat = U_static / V_tile = -2.551227485681002 J/m^3
- Qgain = sqrt(qCavity / 1e9) = 1
- rho_inst = rho_flat * gammaGeo^3 * gammaVdB_cal * Qgain * qSpoil
  rho_inst = -1.9406887693988365e10 J/m^3
- T00_avg = rho_inst * d_eff
  T00_avg = -6.792410692895928e6 J/m^3
Source: `computeStressEnergyFromPipeline()` in `modules/dynamic/natario-metric.ts`
using pipeline fields from `server/energy-pipeline.ts`.

Step 6 — Homogenization ratio
- Pulse period: Tp = 1 / (15e9) = 6.666666666666667e-11 s
- tauLC default: 1e-7 s
- ratio = Tp / tauLC = 6.666666666666668e-4
Source: `computeHomogenization()` in `modules/dynamic/natario-metric.ts`.

Step 7 — Curvature proxy
- K = (8*pi*G/c^4) * |T00_avg| * exp(-ratio)
- K = 1.409604180180402e-36 1/m^2
Source: `computeCurvatureProxy()` in `modules/dynamic/natario-metric.ts`.

Step 8 â€” Runtime guardrail authority (strict path)
- Canonical strict runtime stress source is `warp.metricT00` with family refs:
  - `warp.metric.T00.alcubierre.analytic`
  - `warp.metric.T00.natario.shift`
  - `warp.metric.T00.natario_sdf.shift`
  - `warp.metric.T00.irrotational.shift`
- Non-Alcubierre fallback can promote VdB Region II derivative evidence into canonical
  `warp.metricT00` with `metricT00Ref = warp.metric.T00.vdb.regionII`.
- Contract metadata emitted with metric stress source:
  - `metricT00Observer`
  - `metricT00Normalization`
  - `metricT00UnitSystem`
  - `metricT00ContractStatus`
  - `metricT00ContractReason`
- Theta hard guardrail input uses `theta_geom` (metric divergence diagnostics) when available.
  VdB conformal adapter methods include `finite-diff+conformal` and `hodge-grid+conformal`.
- Strict mode rejects missing authority contracts for hard decisions
  (`contract_missing`, `chart_contract_missing`) instead of silently passing proxy paths.

### Needle Hull solve congruence classification (current runtime)
| Runtime quantity | Classification | Notes |
| --- | --- | --- |
| `warp.metricT00` | geometry-derived (conditional by path) | Canonical metric source for strict CL3/CL4 decisions on active warp-family paths. |
| `metricT00Contract*` | geometry contract metadata | Observer, normalization, unit system, and status/reason are surfaced for strict gating and proofs. |
| `theta_geom` | geometry-derived (conditional by adapter) | Derived from metric-adapter divergence diagnostics; strict mode rejects missing chart contract. |
| `theta_pipeline_proxy` / `theta_pipeline_cal` | proxy-only | Retained for telemetry and diagnostics; non-authoritative in strict hard-decision flow. |
| `T00_avg` (pipeline stress map) | proxy-only | Useful for trend diagnostics; not constraint-closed geometry stress by itself. |
| VdB derivative evidence (`B'`, `B''`, two-wall support) | geometry-derived diagnostics (partial CL2/CL3) | Required for strict VdB path when `gammaVdB > 1`; still not universal on every chart/surface. |

## Equation Sheet With Numbered Equations and Definitions

### Common 3+1 (ADM-style) decomposition (for comparison)

(C1) 3+1 line element:
```
ds^2 = -(alpha^2 - beta_i beta^i) dt^2 + 2 beta_i dx^i dt + gamma_ij dx^i dx^j
```
- alpha: lapse
- beta^i: shift (contravariant), beta_i = gamma_ij beta^j
- gamma_ij: spatial metric on t = const slices

(C2) Extrinsic curvature (ADM definition):
```
K_ij = (1 / (2 alpha)) (D_i beta_j + D_j beta_i - d_t gamma_ij)
```
(C3) If d_t gamma_ij = 0:
```
K_ij = (1 / (2 alpha)) (D_i beta_j + D_j beta_i)
```

(C4) Eulerian observer 4-velocity:
```
n^a = (1/alpha) (1, -beta^i)
```
```
n_a = -(alpha, 0)
```
Eulerian energy density:
```
rho_E = T_ab n^a n^b
```

(C5) Expansion scalar used for implementation comparisons:
```
theta_beta = D_i beta^i
```
Note: authors may define a different sign for theta via Tr(K).

---

### A) Alcubierre (1994)

A1) Units: G = c = 1.

A2) Shift/lapse/metric choice:
```
alpha = 1
beta^x = -v_s(t) f(r_s)
beta^y = beta^z = 0
gamma_ij = delta_ij
```

A3) Definitions:
```
v_s(t) = dx_s/dt
r_s(t) = sqrt((x - x_s(t))^2 + y^2 + z^2)
```

A4) Shape function (tanh profile):
```
f(r_s) = [tanh(sigma (r_s + R)) - tanh(sigma (r_s - R))] / [2 tanh(sigma R)]
```
Note: f approaches a top-hat profile as sigma -> infinity (Alcubierre eq. (7)).

A5) Line element:
```
ds^2 = -dt^2 + (dx - v_s f(r_s) dt)^2 + dy^2 + dz^2
```

A6) Expansion scalar (using theta_beta = D_i beta^i, gamma_ij = delta_ij):
```
theta_beta = d_x beta^x = -v_s f'(r_s) (x - x_s) / r_s
```
Alcubierre defines theta_Alc = -alpha Tr(K), giving:
```
theta_Alc = +v_s f'(r_s) (x - x_s) / r_s
```
So:
```
theta_beta = -theta_Alc
```

A7) Extrinsic curvature components (from C3 and beta^x only):
```
K_xx = d_x beta_x = -v_s f'(r_s) (x - x_s) / r_s
K_xy = K_yx = (1/2) d_y beta_x = -(v_s/2) f'(r_s) y / r_s
K_xz = K_zx = (1/2) d_z beta_x = -(v_s/2) f'(r_s) z / r_s
```
All others zero. Tr(K) = K_xx = theta_beta.

A8) Eulerian energy density (non-positive in wall regions):
```
rho_E = -(1 / (8 pi)) * (v_s^2 * rho^2 / (4 r_s^2)) * (f'(r_s))^2
rho = sqrt(y^2 + z^2)
```
Negative wherever f'(r_s) != 0 and rho != 0.

---

### B) Natario (2002)

N1) Line element (Definition 1.1, not equation-numbered in paper):
```
ds^2 = -dt^2 + sum_i (dx^i - X^i dt)^2
```

N2) Vector field:
```
X = X^i d/dx^i = X d/dx + Y d/dy + Z d/dz
```

N3) Normal covector and normal vector:
```
n_a = -dt
n^a = d/dt + X
```

N4) ADM mapping (compare N1 to C1):
```
alpha = 1
gamma_ij = delta_ij
beta^i = -X^i
```

N5) Extrinsic curvature (Natario convention, Prop 1.4):
```
K_ij^(Nat) = (1/2) (d_i X_j + d_j X_i)
```
Mapping to ADM K_ij (C2) with beta = -X and d_t gamma = 0:
```
K_ij^(ADM) = -K_ij^(Nat)
```

N6) Expansion scalar (Cor 1.5):
```
theta_Nat = div X
```
So:
```
theta_beta = D_i beta^i = -div X = -theta_Nat
```

N7) Energy density (Thm 1.7), with flat 3-metric (3)R = 0:
```
rho_E = (1 / (16 pi)) (theta^2 - K_ij K^ij)
```
If theta = 0 then rho_E <= 0, with rho_E = 0 iff K_ij = 0.

N8) Alcubierre as a choice of X (Example 1.8):
```
X = v_s f(r_s), Y = Z = 0
```
Expansion:
```
theta_Nat = d_x X = v_s f'(r_s) (x - x_s) / r_s
```
Energy density:
```
rho_E = -(1 / (32 pi)) v_s^2 [f'(r_s)]^2 (y^2 + z^2) / r_s^2
```
Natario then introduces xi = x - x_s(t), effectively shifting X -> X - v_s so the bubble
interior is stationary while the exterior flows. This matters for parameter alignment
with Alcubierre-style coordinates.

N9) Zero-expansion construction (Section 2, spherical coords, x is polar axis):
Key property is div X = 0. One explicit construction (paper uses a compact notation):
Boundary behavior: f(r) = 0 for small r and f(r) = 1/2 for large r, guaranteeing div X = 0.
```
X_r = -2 v_s f(r) cos(theta)
X_theta = v_s (2 f + r f') sin(theta)
X_phi = 0
```
Selected K_ij components (paper lists full block):
```
K_rr = d_r X_r = -2 v_s f' cos(theta)
K_thetatheta = (1/r) d_theta X_theta + X_r / r = v_s f' cos(theta)
K_phiphi = (1/(r sin(theta))) d_phi X_phi + X_r / r + X_theta cot(theta) / r = v_s f' cos(theta)
K_rtheta = (1/2)[ r d_r (X_theta / r) + (1/r) d_theta X_r ]
         = v_s sin(theta) (f' + (r/2) f'')
```
Energy density:
```
rho_E = -(1 / (16 pi)) K_ij K^ij
      = -(v_s^2 / (8 pi)) [3 (f')^2 cos^2(theta) + (f' + (r/2) f'')^2 sin^2(theta)]
```
Zero-expansion check:
```
K_rr + K_thetatheta + K_phiphi = 0
```

---

### C) Van Den Broeck (1999)

V1) Original Alcubierre metric restated:
```
ds^2 = -dt^2 + (dx - v_s f(r_s) dt)^2 + dy^2 + dz^2
```

V2) Radius definition:
```
r_s(t, x, y, z) = sqrt((x - x_s(t))^2 + y^2 + z^2)
```

V3) Units: c = G = hbar = 1.

V4) Modified metric (conformal factor B):
```
ds^2 = -dt^2 + B^2(r_s) [ (dx - v_s f(r_s) dt)^2 + dy^2 + dz^2 ]
```

V5) B(r_s) piecewise:
```
B(r_s) = 1 + alpha                 for r_s < R_tilde
1 < B(r_s) <= 1 + alpha            for R_tilde <= r_s < R_tilde + Delta_tilde
B(r_s) = 1                         for r_s >= R_tilde + Delta_tilde
```

V6) f(r_s) properties (no closed form in paper):
```
f(r_s) = 1 for r_s < R
0 < f(r_s) <= 1 for R <= r_s < R + Delta
f(r_s) = 0 for r_s >= R + Delta
```
R > R_tilde + Delta_tilde.

V7) 3+1 fields:
```
alpha = 1
beta^x = -v_s f(r_s), beta^y = beta^z = 0
gamma_ij = B^2(r_s) delta_ij
beta_x = gamma_xx beta^x = B^2 (-v_s f)
```

V8) Expansion scalar via divergence in curved 3-metric:
```
theta_beta = (1 / sqrt(gamma)) d_i (sqrt(gamma) beta^i)
```
For gamma_ij = B^2 delta_ij, sqrt(gamma) = B^3 and only beta^x is nonzero:
```
theta_beta = (1 / B^3) d_x (B^3 (-v_s f))
          = -v_s (d_x f + 3 f d_x ln B)
```
With d_x f = f'(r_s) (x - x_s) / r_s and d_x ln B = (B'/B) (x - x_s) / r_s:
```
theta_beta = -v_s (x - x_s)/r_s [ f'(r_s) + 3 f(r_s) B'(r_s)/B(r_s) ]
```
This predicts nonzero theta_beta even when f is constant, if B' != 0.

V9) Extrinsic curvature (not given explicitly in paper):
```
K_ij = (1/2) (D_i beta_j + D_j beta_i - d_t gamma_ij)
```
Note: because r_s depends on t in the original coordinates, gamma_ij = B^2(r_s) delta_ij can be time-dependent unless you move to comoving coordinates.

V10) Eulerian energy density in region II (orthonormal frame, paper eq. (11)):
```
rho_E = T^(hat 0 hat 0)
      = (1 / (8 pi)) [ (1 / B^4) (d_r B)^2 - (2 / B^3) d_r d_r B - (4 / B^3) (1/r) d_r B ]
```
He then selects a high-order polynomial for B (eq. (12)-(13)):
```
B = alpha [ -(n - 1) w^n + n w^(n - 1) ] + 1
w = (R_tilde + Delta_tilde - r) / Delta_tilde
```

---

## Comparison Matrix

### 3+1 fields and shape functions
| Item | Alcubierre (1994) | Natario (2002) | Van Den Broeck (1999) |
| --- | --- | --- | --- |
| Coordinates | Cartesian (t, x, y, z); bubble along x; r_s = sqrt((x - x_s)^2 + y^2 + z^2) | Cartesian for general class; spherical (r, theta, phi) used for zero-expansion construction | Uses Alcubierre r_s(t, x, y, z) |
| Lapse (alpha) | alpha = 1 | alpha = 1 | alpha = 1 |
| Shift (beta^i) | beta^x = -v_s f(r_s); others 0 | beta^i = -X^i | beta^x = -v_s f(r_s); others 0 |
| Spatial metric (gamma_ij) | gamma_ij = delta_ij | gamma_ij = delta_ij | gamma_ij = B^2(r_s) delta_ij |
| Shape function(s) | f(r_s) explicit tanh profile with R, sigma | General bounded smooth X^i; zero-expansion uses f(r) with boundary conditions | f(r_s) properties only (no closed form) and B(r_s) piecewise + optional polynomial |

### Geometry outputs available vs missing
| Quantity | Alcubierre | Natario | Van Den Broeck |
| --- | --- | --- | --- |
| Expansion | theta_Alc = -alpha Tr(K) (explicit); theta_beta = -theta_Alc | theta_Nat = div X; zero-expansion requires theta_Nat = 0 | theta not given; must compute from beta and B |
| K_ij | Defined by ADM equations; components implied by beta | K_ij formula given; explicit spherical components in zero-expansion example | Not given; must compute from alpha, beta, gamma (and possible d_t gamma) |
| rho_E | Explicitly negative in wall regions | General formula rho_E = (1/16 pi)(theta^2 - K_ij K^ij); explicit examples | Explicit rho_E in region II (orthonormal frame); region IV same as Alcubierre |

---

## Falsifiable Checks (Alignment Disproofs)
1. Natario zero-expansion: if D_i beta^i is nonzero (beyond numerical error) anywhere in the zero-expansion construction, it is not Natario-aligned.
2. Alcubierre wall signature: if rho_E >= 0 everywhere for the explicit tanh f(r_s), the implementation is wrong (Alcubierre eq. (19) is non-positive).
3. Van Den Broeck two-wall structure: if curvature support appears only where f varies and not where B varies, the geometry is incomplete (region II must contribute).
4. Spatial metric check:
   - Alcubierre + Natario require gamma_ij = delta_ij.
   - Van Den Broeck requires gamma_ij = B^2(r_s) delta_ij.
5. Sign convention check: track theta_beta vs author-defined theta; sign mistakes can produce false matches.

---

## Mapping Notes (Implementation-Level, No Needle Hull Params)

### A) From sigma to wall thickness for Alcubierre f(r_s)
Alcubierre does not give a direct wall-thickness formula. Define a reproducible operational thickness using levels p in (0, 1/2):
- Let Delta_p be the radial interval where f transitions from 1 - p to p.
For large sigma R, near the outer wall:
```
f(r_s) approx (1 - tanh(sigma (r_s - R))) / 2
```
Solve for p and 1 - p to estimate:
```
Delta_p approx (2 / sigma) * artanh(1 - 2p)
```
Example p = 0.1 gives:
```
Delta_0.1 approx 2.197 / sigma
```
This is a falsifiable numerical check (compare with direct sampling of f).

### B) Mapping bubble radius R to hull geometry (no manual scaling)
Define hull radius as the maximum proper distance from bubble center in the slice metric:
```
R_hull = max_{p in hull} d_gamma(p, center)
```
Choose:
```
R = R_hull + clearance
```
Metric-specific simplifications:
- Alcubierre/Natario: gamma_ij = delta_ij, so d_gamma is Euclidean norm.
- Van Den Broeck: gamma_ij = B^2 delta_ij, so proper lengths scale by B. In region I where B = 1 + alpha is constant:
```
R_tilde = R_internal / (1 + alpha)
```

### C) Parameter mapping summary (R, sigma, v)
- Alcubierre: R and sigma are explicit in f(r_s); beta^x = -v f(r_s).
- Natario (zero-expansion): v_s is prefactor in X; f(r) is chosen by boundary conditions; no explicit sigma given in paper.
- Van Den Broeck: v_s constant; R and Delta define f(r_s) regions; B(r_s) defines pocket compression; no explicit sigma unless you substitute Alcubierre f.

---

## Open Questions
- Which Needle Hull Mk1 citations are authoritative for each metric?
- What is the canonical sigma-to-wall-thickness mapping used in each paper?
- Are there coordinate convention mismatches (signs, units, axes)?

### Needle Hull citation-ingestion checklist
When the Needle Hull citation trace is verified, map each runtime signal to citations:
- `warp.metricT00` (`warp.metric.T00.*`) -> equation chain from metric/ADM fields to rho_E or equivalent.
- `metricT00Contract*` -> observer + normalization + unit conventions used in source.
- `theta_geom` -> expansion definition used in source (`D_i beta^i` or `-Tr(K)` mapping).
- `theta_pipeline_proxy` / `theta_pipeline_cal` -> explicit proxy-only label unless a cited heuristic is provided.
- VdB region-II fallback (`warp.metric.T00.vdb.regionII`) -> derivative-based support (`B'`, `B''`) if present in source.

## GPT Pro Research Prompt (draft)
You are a research assistant. Goal: build a falsifiable, equation-level comparison of
Alcubierre (1994), Natario (2002), and Van den Broeck (1999) warp metrics, plus the
Needle Hull Mk1 citation trace I provide. The Casimir/cavity pipeline is treated as
already solved; focus only on GR geometry.

Requirements:
- Use primary sources only (journal PDFs, arXiv, book chapters). No blogs.
- Extract the exact metric forms, coordinate conventions, and assumptions.
- For each author: list the shift vector beta, lapse alpha, spatial metric gamma_ij,
  and the shape function f(r_s) (or equivalent) with equation numbers and units.
- Explicitly derive or quote expressions for: expansion scalar theta = div beta,
  extrinsic curvature K_ij, energy density T00 (Eulerian), and energy-condition notes.
- Include a falsifiable comparison table: for a shared set of parameters (R, sigma, v)
  state which quantities should be near-zero vs. non-zero (e.g., Natario theta approx 0).
- Provide guidance on how to compute wall thickness from sigma (or equivalent) and how
  to map bubble radius to hull geometry without manual scaling.
- If any equation is missing in sources, say so rather than infer.

Input I will provide:
- Needle Hull Mk1 citation trace (from repo docs).

Deliverables:
1) Source list with citations (author, year, title, URL/DOI/arXiv).
2) Equation sheet with numbered equations and definitions.
3) Comparison matrix (Natario vs Alcubierre vs Van den Broeck).
4) Falsifiable checks list (what would disprove alignment).
5) Mapping notes to implementation parameters (R, sigma, beta/shift, etc.).

## Reference Links
[1]: https://arxiv.org/abs/gr-qc/0009013 "gr-qc/0009013 The warp drive: hyper-fast travel within general relativity"
[2]: https://arxiv.org/abs/gr-qc/0110086 "gr-qc/0110086 Warp Drive With Zero Expansion"
[3]: https://arxiv.org/abs/gr-qc/9905084 "gr-qc/9905084 A warp drive with more reasonable total energy requirements"
[4]: https://arxiv.org/pdf/gr-qc/0009013 "arXiv:gr-qc/0009013v1 5 Sep 2000"

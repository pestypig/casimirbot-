# NHM2 Shift-Plus-Lapse Generalization Memo

Date: 2026-04-01

## Purpose
This memo records the current repo-level conclusion about adding a real cabin-gravity dial to NHM2 while remaining congruent with the current 3+1 proof surfaces.

The core question is whether NHM2 can be generalized from a unit-lapse, shift-driven Natario-like family into a broader ADM family with:

- a mild interior lapse gradient for Eulerian rest-frame gravity,
- an optional centerline lapse suppression dial for route-time slowdown,
- unchanged discipline about Lane A remaining the authoritative proof surface.

## External Mathematical Basis

### 1. Eulerian acceleration is set by the lapse gradient
In standard 3+1 form, the Eulerian observer acceleration is the spatial gradient of the logarithm of the lapse:

\[
a = D \ln N
\]

Gourgoulhon gives this directly and emphasizes that the acceleration of the Eulerian observer is determined by the lapse, not the shift.[1]

### 2. The shift controls slice-sliding, not Eulerian gravity by itself
In adapted 3+1 coordinates:

\[
\partial_t = N n + \beta
\]

with \(\beta\) tangent to the spatial slice. Gourgoulhon describes the lapse as governing how far the next slice sits "above" the current one and the shift as governing how the spatial coordinates are propagated along the foliation.[1]

### 3. Natario's canonical family is unit-lapse and shift-defined
Natario's construction is built from a vector field on Euclidean 3-space. In the canonical slicing, the geometry is carried by the shift-like field \(X\), and the Eulerian observers are free-fall observers.[2]

This matters because a pure shift tweak preserves the "sliding spacetime" picture, but it does not by itself create a true Eulerian rest-frame gravity field.

### 4. Zero expansion and nontrivial lapse are mathematically compatible
In standard ADM form,

\[
K_{ij} = \frac{1}{2N}\left(D_i \beta_j + D_j \beta_i - \partial_t \gamma_{ij}\right)
\]

so with static \(\gamma_{ij}\) and a divergence-controlled shift, zero-expansion or low-expansion constructions remain compatible with a nontrivial lapse profile. That means "sliding transport" and a mild cabin gravity dial are not mathematically exclusive.[1][2]

### 5. Horizon/blueshift safety becomes a combined shift-lapse question
Natario's horizon discussion is built from the wavefront speed \(1\) plus the drift field \(X\), yielding the familiar horizon geometry and infinite-blueshift discussion in the wall region.[2]

In a generalized ADM family, the relevant local light-cone speed is controlled by \(N\), so the horizon safety question should be treated as a combined shift-lapse diagnostic rather than separate `betaMaxAbs` and `lapseMin` checks. This repo memo treats that as an inference from the ADM metric plus Natario's horizon construction, not as a direct quoted theorem.[1][2]

## Current Repo State

### What the current NHM2/Natario path actually does
The current Natario path is still a unit-lapse, shift-driven family:

- `modules/warp/natario-warp.ts:450`
- `modules/warp/natario-warp.ts:453`
- `modules/warp/natario-warp.ts:482`
- `modules/warp/natario-warp.ts:777`
- `modules/warp/natario-warp.ts:785`
- `modules/warp/natario-warp.ts:1025`

Observed behavior:

- `epsilonTilt` is added directly to the shift field inside the bubble.
- the exported metric adapter snapshot is still hard-coded with `alpha: 1`.

Conclusion:
- the current "gentle interior tilt" is a shift/shear proxy,
- it is not a true Eulerian cabin-gravity field.

### What the repo already has that is reusable

#### GR brick already differentiates `alpha`
- `server/gr/evolution/brick.ts:595`
- `server/gr/evolution/brick.ts:601`

The brick already computes first and second derivatives of `state.alpha`. That means the repo already contains most of the numerical plumbing needed for:

- `alpha_grad_x/y/z`
- `eulerian_accel_x/y/z = (partial_i alpha)/alpha`
- `eulerian_accel_mag`

#### GR brick already exports time-related scalar channels
- `server/gr/evolution/brick.ts:264`
- `server/gr/evolution/brick.ts:319`
- `server/gr/evolution/brick.ts:325`
- `server/gr/evolution/brick.ts:1206`

The brick already exports:

- `g_tt`
- `clockRate_static`
- `theta`
- `det_gamma`

#### Lapse companion already emits `phi`, `g_tt`, and `alpha`
- `server/lapse-brick.ts:219`
- `server/lapse-brick.ts:234`
- `server/lapse-brick.ts:235`
- `server/lapse-brick.ts:279`

This is useful as a reduced-order lapse diagnostic companion, but it is not yet the generalized NHM2 solve family.

#### Time-dilation diagnostics already use ADM variables
- `shared/time-dilation-diagnostics.ts:313`
- `shared/time-dilation-diagnostics.ts:321`
- `shared/time-dilation-diagnostics.ts:351`
- `shared/time-dilation-diagnostics.ts:1221`

The repo already computes ship-comoving:

\[
\frac{d\tau}{dt} = \sqrt{\alpha^2 - \gamma_{ij}(dx^i/dt + \beta^i)(dx^j/dt + \beta^j)}
\]

So the worldline time-dilation layer is already ADM-aware.

### What is missing

#### 1. No exported cabin-gravity diagnostics
The internal alpha derivatives are not currently exported as first-class brick channels. There is no repo-native surface yet for:

- `alpha_grad_x/y/z`
- `eulerian_accel_x/y/z`
- `eulerian_accel_mag`
- `centerline_alpha`
- `cabin_clock_split`

#### 2. No combined ADM horizon-safety diagnostic
Current GR guardrails only expose separate lapse and shift thresholds:

- `tools/warpViability.ts:77`
- `tools/warpViability.ts:78`
- `tools/warpViability.ts:628`
- `tools/warpViability.ts:657`
- `tools/warpViability.ts:664`

Today the viability layer tracks:

- `lapseMin`
- `betaMaxAbs`

but not a combined wall-region ratio such as:

- `beta_over_alpha_mag`
- `beta_outward_over_alpha`

#### 3. No diagnostic lane for lapse-gradient semantics
The current diagnostic contract has:

- Lane A: authoritative Eulerian `theta=-trK`
- Lane B: reference-only shift-drift proxy `theta=-trK+div(beta/alpha)`

Repo anchors:

- `configs/york-diagnostic-contract.v1.json:4`
- `configs/york-diagnostic-contract.v1.json:13`
- `configs/york-diagnostic-contract.v1.json:72`
- `configs/york-diagnostic-contract.v1.json:104`

Lane B is already explicitly a non-normalized observer proxy, so it is the wrong place to smuggle in cabin-gravity semantics.

#### 4. Full-solve metric provenance still assumes the current family
The G4/full-solve path expects metric-derived sources beginning with `warp.metric`:

- `scripts/warp-full-solve-calculator.ts:125`
- `tools/warpViability.ts:69`

Current Natario default source:

- `tools/warpViability.ts:265`

is still:

- `warp.metric.T00.natario.shift`

So a generalized branch should enter as a new metric/source family, not as an unlabeled tweak.

## Repo-Level Conclusion

The user's idea is mathematically aligned with the repo's Natario framing, but the current implementation uses the wrong knob for real cabin gravity.

### Strong conclusion
If the target is:

- genuine Eulerian rest-frame "floor-down, ceiling-up" gravity,
- while preserving a Natario-like low-expansion transport interpretation,

then the correct dial is:

- **lapse gradient**, not more `epsilonTilt`.

### Equally important conclusion
If the target is:

- transcript-style route-time compression,

then the correct dial is:

- **centerline lapse suppression** \(N_c(t) \ll 1\),

and that is a larger generalization than a cabin-gravity patch. It should be treated as a new solve family, not a local retune.

## Recommended Next Patch

### Patch objective
Introduce a generalized NHM2 shift-plus-lapse path without corrupting the current unit-lapse Natario proof basis.

### Step 1. Add a new metric/source family
Introduce a new branch such as:

- `warp.metric.T00.nhm2.shift_lapse`

Keep existing:

- `warp.metric.T00.natario.shift`

unchanged and canonical for the current unit-lapse family.

After the current scaffolding pass, this generalized branch should be treated as a distinct full-solve family and a candidate authoritative solve family in provenance/model-selection language, while proof-bearing bounded transport publication remains conditional on the explicit authoritative shift-lapse transport-promotion gate rather than implied by family identity alone.

### Reproducible selected-family bounded transport publication

The repo now has an operator-facing command for live selected-family bounded transport publication without replacing the canonical baseline latest aliases:

- `npm run warp:full-solve:nhm2-shift-lapse:publish-selected-transport`

This command writes the selected-family bundle under:

- `artifacts/research/full-solve/selected-family/nhm2-shift-lapse/`
- `docs/audits/research/selected-family/nhm2-shift-lapse/`

It does not overwrite the canonical baseline latest aliases, which remain on:

- `warp.metric.T00.natario_sdf.shift`

The single summary surface for the current live selected-family result is:

- `artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-shift-lapse-transport-result-latest.json`
- `docs/audits/research/selected-family/nhm2-shift-lapse/warp-nhm2-shift-lapse-transport-result-latest.md`

Current live selected-family result at bounded-contract maturity:

- authoritative low-expansion gate: `pass`
- wall-safety status: `pass`
- `centerline_dtau_dt = 1`
- mission-time interpretation: `no_certified_relativistic_differential_detected`
- bounded timing differential detected: `false`

This means the current live `nhm2_shift_lapse` selected-family solve is gate-admitted into the bounded transport bundle, but it remains timing-flat in the current measured publication state. That is a bounded contract result only; it does not imply speed, ETA, or broader viability claims.

### Step 2. Preserve current semantics for `epsilonTilt`
Document and keep:

- `epsilonTilt` = shift/shear proxy only

Do not reinterpret it as cabin gravity.

### Step 3. Export new lapse diagnostics from the GR brick
Add first-class channels for:

- `alpha_grad_x`
- `alpha_grad_y`
- `alpha_grad_z`
- `eulerian_accel_x`
- `eulerian_accel_y`
- `eulerian_accel_z`
- `eulerian_accel_mag`

Derived from:

\[
a_i = D_i \ln \alpha = \frac{\partial_i \alpha}{\alpha}
\]

### Step 4. Add cabin and centerline observables
Add solve-backed diagnostics for:

- `centerline_alpha`
- `centerline_dtau_dt`
- `cabin_clock_split`
- `cabin_gravity_gradient`

This should remain distinct from route/worldline redshift diagnostics.

### Step 5. Extend the gauge/horizon guardrail
Add combined ADM safety diagnostics, for example:

- `beta_over_alpha_mag`
- `beta_outward_over_alpha`
- wall-region maxima / percentile summaries

This is the right place to ask whether stronger lapse suppression is making the horizon/blueshift condition worse.

### Step 6. Add a new diagnostic lane rather than overloading Lane A or Lane B
Keep:

- Lane A authoritative
- Lane B reference-only

Add a new lane for generalized ADM cabin-gravity semantics if and only if the semantics are fully declared and non-proxy.

### Step 7. Phase implementation

#### Phase A: mild cabin gravity
Goal:
- small \(\nabla \alpha\) across the cabin,
- no attempt at strong route-time compression,
- diagnostics-first integration

#### Phase B: centerline lapse suppression
Goal:
- investigate \(N_c(t) \ll 1\),
- only after combined `|beta|/alpha` safety and diagnostic surfaces exist

## Claim Discipline

### Safe claims now
- current NHM2 is still a unit-lapse, shift-first Natario-like family
- real Eulerian cabin gravity requires lapse gradients
- the repo already has enough alpha plumbing to support a new diagnostics pass
- `warp.metric.T00.nhm2.shift_lapse` can be carried as a distinct candidate authoritative solve family in provenance/model-selection without widening bounded transport claims

### Unsafe claims now
- that current `epsilonTilt` already implements real cabin gravity
- that mild cabin gravity and strong route-time compression are the same dial
- that horizon safety under strong centerline lapse suppression is already characterized by the repo
- that `warp.metric.T00.nhm2.shift_lapse` is already a proof-promoted bounded transport family

## Suggested Artifact Names For The Implementation Pass

- `warp.metric.T00.nhm2.shift_lapse`
- `docs/research/nhm2-shift-plus-lapse-implementation-brief-2026-04-01.md`
- `artifacts/research/full-solve/nhm2-shift-plus-lapse-diagnostics-latest.json`

Suggested exported fields:

- `alpha_grad_x/y/z`
- `eulerian_accel_x/y/z`
- `eulerian_accel_mag`
- `centerline_alpha`
- `cabin_clock_split`
- `beta_over_alpha_mag`
- `beta_outward_over_alpha`

## Sources

### External
1. Eric Gourgoulhon, *3+1 Formalism and Bases of Numerical Relativity*.
   - Eulerian acceleration from lapse gradient: https://people-lux.obspm.fr/gourgoulhon/pdf/form3p1.pdf
   - Relevant passages browsed:
     - `turn1view1`
     - `turn1view2`

2. José Natário, *Warp Drive With Zero Expansion*.
   - arXiv landing page: https://arxiv.org/abs/gr-qc/0110086
   - readable HTML mirror used for inspection: https://ar5iv.labs.arxiv.org/html/gr-qc/0110086
   - Relevant passages browsed:
     - `turn2view0`

### Repo anchors
- `modules/warp/natario-warp.ts`
- `modules/warp/warp-metric-adapter.ts`
- `server/gr/evolution/brick.ts`
- `server/lapse-brick.ts`
- `shared/time-dilation-diagnostics.ts`
- `tools/warpViability.ts`
- `scripts/warp-full-solve-calculator.ts`
- `configs/york-diagnostic-contract.v1.json`
- `shared/york-diagnostic-lanes.ts`
- `docs/research/york-time-lobes-in-natario-zero-expansion-warp-drive-and-effective-3p1-visualizations-2026-03-31.md`

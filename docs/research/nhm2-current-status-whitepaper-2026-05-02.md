# NHM2 as a 3+1 Same-Chart Lapse-Shift Warp Metric Evaluation Framework

## Abstract

This whitepaper presents NHM2 as a same-chart 3+1 lapse-shift metric-evaluation framework for studying bounded warp-like geometries in a fixed comoving Cartesian chart. The construction separates four layers: a mechanism-side Casimir-tile source model, a solve-backed shift-lapse geometry, a geometry-first Einstein-tensor stress-energy evaluator, and observer-facing energy-condition and timing diagnostics. The central mathematical move is to express the observer problem in the ADM/Gourgoulhon projection grammar: Eulerian energy density `E`, momentum density `J_i`, and spatial stress `S_ij` are defined on one foliation, reconstructed into `T_mu_nu` when needed, and tested against weak, null, strong, and dominant energy-condition surfaces. The current selected NHM2 clocking-law anchor uses a centerline lapse `alpha = 0.995`, giving the target relation `tau = alpha T` under a frozen coordinate mission and shift schedule. Lower-alpha profiles remain expected targets until their own repository-measured full-loop artifacts pass.

The May 2026 red-team update narrows the paper's status claim further. NHM2 is now treated as a lapse-extended Natario-style diagnostic / reduced-order candidate lane with bounded solve-backed outputs under review. The validation-hardening branch defines the current divergence surface: the metric-required same-chart tensor route is relatively well-formed, while the tile-effective source mechanism has not yet supplied an authoritative same-basis regional counterpart tensor, observer artifacts still require single-run reconciliation, and QEI / convergence / independent reproduction evidence remains promotion-blocking. The paper therefore claims a bounded, artifact-limited mathematical framework and a well-defined blocker map, not physical viability or experimental validation.

## Executive scientific claim boundary

NHM2 is treated here as a repository-measured 3+1 same-chart metric-evaluation framework. The paper does not claim physical viability, experimental validation, max speed, route ETA, black-hole operation, arbitrary external-field operation, strong-field survivability, or lower-alpha profile promotion. Repository artifacts define which NHM2 rows are pass-level under a named contract, review-level, diagnostic, runtime-blocked, or unsupported.

The literature roles are intentionally narrow. Gourgoulhon / ADM provide formalism context, not NHM2 validation. Alcubierre / Natario provide warp-metric context, not NHM2 validation. Pfenning-Ford / Fewster-Roman / Santiago-Schuster-Visser provide limitation and energy-condition context, not NHM2 validation. Maldacena / holography / entanglement-wedge / traversable-wormhole sources provide external context only; they do not validate NHM2 source closure, observer closure, or transport. Repository artifacts define NHM2 row status.

The selected-profile clocking-law anchor is not a blanket full-loop certified pass. `0p7000` is runtime-blocked, not physics-failed. `0p5000` is exploratory, not promoted. Source closure is globally diagonal-tight but review-level because regional comparison is diagnostic-only, the expected `tile_effective_counterpart` surface is missing, and assumption drift remains recorded. The Casimir source model is mechanism-side and not an experimentally grounded macroscopic stress-energy realization. Sector strobing modulates duty-averaged source strength; it is not a certified thrust law. `g` targets are local proper-acceleration targets in Earth-gravity units, not Lorentz gamma.

The red-team baseline changes the practical scientific question. The immediate question is no longer "can the dashboard be made green?" It is: can one frozen NHM2 reference run make the bridge from metric-required stress-energy to tile-effective stress-energy impossible to misread, region by region, observer by observer, with QEI/QFT and reproducibility evidence attached?

## 1. Motivation and problem statement

The scientific problem addressed here is narrower than a flight-ready warp-drive claim. NHM2 asks whether a bounded lapse-shift profile can be represented, evaluated, and audited in one declared chart with enough mathematical discipline that observer quantities, energy-condition surfaces, and centerline proper-time targets are not confused with coordinate artifacts or mechanism-side assumptions.

That problem has three recurring failure modes. First, a shift vector can be misread as an ordinary ship speed. Second, a diagonal stress-energy proxy can be mistaken for a full observer tensor. Third, an expected clocking law such as `tau = alpha T` can be mistaken for a promoted route result. The whitepaper is structured to prevent those errors: accepted equations first, NHM2 instantiation second, computation/evidence surfaces third, and artifact status last.

The red-team branch adds a fourth failure mode: a summary artifact can be mistaken for a validation surface when its inputs are not frozen to one run. The new reference-run harness therefore treats `latest` aliases, profile mismatch, observer summary/detail disagreement, missing regional source counterparts, diagonal-proxy authority, missing QEI dossier, null reproducibility fields, and certificate-overrides-review behavior as first-class blockers.

The implementation records calculations through repository artifacts. Those artifacts are not the theory itself; they are the evidence surfaces used to determine which NHM2 rows are admitted, review-level, diagnostic, runtime-blocked, or unsupported.

## 2. Accepted mathematical background

### 2.1 ADM / 3+1 foliation

The ADM / 3+1 split writes the metric in terms of lapse `alpha`, shift `beta^i`, spatial metric `gamma_ij`, and coordinate time `t`:

\[
ds^2 = -\alpha^2 dt^2 + \gamma_{ij}(dx^i+\beta^i dt)(dx^j+\beta^j dt).
\]

The lapse controls normal separation between neighboring slices, the shift describes how spatial coordinates slide from one slice to the next, and `gamma_ij` is the spatial metric intrinsic to a slice. NHM2 uses this grammar because it lets timing, transport descriptors, and observer projections be stated in one chart instead of mixing coordinate component claims across incompatible frames.

### 2.2 Eulerian observers and proper time

For a timelike worldline, proper time satisfies:

\[
d\tau^2=-ds^2.
\]

Define the coordinate velocity:

\[
v^i=\frac{dx^i}{dt}.
\]

Substitute `dx^i=v^i dt` into the 3+1 line element:

\[
ds^2 = -\alpha^2 dt^2 + \gamma_{ij}(v^i dt+\beta^i dt)(v^j dt+\beta^j dt).
\]

Factor out `dt^2`:

\[
ds^2 = \left[-\alpha^2 + \gamma_{ij}(v^i+\beta^i)(v^j+\beta^j)\right]dt^2.
\]

Since `d tau^2 = -ds^2`, divide by `dt^2`:

\[
\frac{d\tau^2}{dt^2}=\alpha^2-\gamma_{ij}(v^i+\beta^i)(v^j+\beta^j).
\]

Therefore:

\[
\left(\frac{d\tau}{dt}\right)^2=\alpha^2-\gamma_{ij}(v^i+\beta^i)(v^j+\beta^j).
\]

This equation is the timing gate for the centerline-lapse discussion below. It also explains why a shift descriptor is not automatically a speed: `beta^i` appears inside the proper-time normalization in a chart-dependent way and must be interpreted with the declared observer semantics.

### 2.3 Stress-energy projections: E, J_i, S_ij

The Eulerian observer normal to the spatial slice is:

\[
n_\mu=(-\alpha,0,0,0),
\qquad
n^\mu=(1/\alpha,-\beta^i/\alpha).
\]

The spatial projector associated with the same foliation is:

\[
\gamma^\mu{}_{\nu}=\delta^\mu{}_{\nu}+n^\mu n_\nu.
\]

The observer-facing matter variables are:

\[
E=T_{\mu\nu}n^\mu n^\nu,
\]

\[
J_i=-T_{\mu\nu}n^\mu\gamma^\nu{}_i,
\]

\[
S_{ij}=T_{\mu\nu}\gamma^\mu{}_i\gamma^\nu{}_j.
\]

`E` is Eulerian energy density, `J_i` is momentum density, and `S_ij` is spatial stress. The importance for NHM2 is direct: an observer audit cannot be reduced to a diagonal `T00` sample if the metric-required claim depends on momentum density and off-diagonal stress.

Gourgoulhon's 3+1 formalism sits at the hinge between geometric relativity and executable numerical relativity. Its importance for NHM2 is not rhetorical; it supplies the observer discipline, foliation language, and projection machinery needed to distinguish partial coordinate-component bookkeeping from a legitimate same-chart stress-energy tensor. In the NHM2 development record, this formalism became the mathematical compass for moving from ambiguous diagonal-only stress-energy assumptions toward an explicit geometry-first route: lapse, shift, spatial metric, Eulerian normal, projected matter variables `E`, `J_i`, `S_ij`, reconstruction of `T_mu_nu`, and observer energy-condition checks all live in one declared chart. This does not make NHM2 experimentally validated, and it does not make lower-alpha rows pass by citation. It makes the calculation auditable.

### 2.4 Einstein tensor route to metric-required stress-energy

Einstein's equation in geometric units is:

\[
G_{\mu\nu}=8\pi T_{\mu\nu}.
\]

A geometry-first same-chart evaluator can therefore compute:

\[
T_{\mu\nu}^{\rm geom}=\frac{1}{8\pi}G_{\mu\nu}.
\]

Then the tensor can be projected into the observer variables:

\[
T_{\mu\nu}^{\rm geom}\rightarrow(E,J_i,S_{ij})\rightarrow{\rm observer\ energy\ conditions}.
\]

This is the selected mathematical route used in the current observer-closure narrative. It is repo-internal same-chart metric evaluation, not experimental validation and not a theorem that arbitrary NHM2 profiles pass.

### 2.5 Energy-condition tests

The weak energy condition is:

\[
{\rm WEC:}\quad T_{\mu\nu}u^\mu u^\nu\ge0
\]

for all timelike `u^mu`. The null energy condition is:

\[
{\rm NEC:}\quad T_{\mu\nu}k^\mu k^\nu\ge0
\]

for all null `k^mu`. The strong energy condition is:

\[
{\rm SEC:}\quad\left(T_{\mu\nu}-\frac12Tg_{\mu\nu}\right)u^\mu u^\nu\ge0.
\]

The dominant energy condition requires the measured energy flux vector to be causal and future-directed for every future-directed timelike observer.

NHM2's observer audit is therefore not merely asking whether a single coordinate `T00` entry has a desired sign. It asks whether the stress-energy tensor, read by admissible observer families, satisfies energy-condition surfaces under the selected same-chart route.

### 2.6 Warp-drive context and known limitations

Alcubierre and Natario provide warp-metric context. Natario's zero-expansion framing is especially relevant because it separates low-expansion morphology from stronger optical or global-causal safety statements. Pfenning-Ford, Fewster-Roman, and Santiago-Schuster-Visser provide the cautionary context: warp-like geometries and negative-energy constructions are constrained by energy-condition and quantum-inequality issues. Those papers are not evidence that NHM2 works; they define why NHM2 must be conservative about what is tested and what is not.

## 3. NHM2 construction

### 3.1 Fixed hull geometry and chart

NHM2 is represented as a fixed-chart construction in a declared comoving Cartesian frame. The hull and sampling families are treated as deterministic contract geometry, not as free narrative objects. This matters because the observer quantities and transport descriptors are chart-declared: the same numerical vector can carry different interpretive weight if moved between charts without an admission route.

### 3.2 Shift-lapse profile family

The profile family is expressed in 3+1 language. Lapse controls clocking relative to the foliation, shift supplies a local transport descriptor, and `gamma_ij` supplies the spatial metric. The NHM2 shift-lapse family is not introduced as a direct scalar velocity law. The body of the calculation asks whether a bounded lapse-shift geometry can be sampled, audited, and constrained without translating the shift into an unsupported speed claim.

### 3.3 Centerline lapse dial

The centerline-lapse sweep varies one dial:

```text
centerlineAlpha = centerlineDtauDt = alpha.
```

The coordinate mission, target-coupled schedule, shift transport framing, and spatial/worldline setup are held fixed. This isolates clocking from velocity: lowering `alpha` is not converted into `beta = sqrt(1-alpha^2)`, and no Lorentz-gamma speed interpretation is introduced.

### 3.4 Local transport descriptor, not speed

The local descriptor `beta_eff` is a bounded fixed-chart transport descriptor. It is not a scalar speed, not a maximum speed, and not a route-map ETA. In the bounded regime, this distinction is not cosmetic: the published descriptor support is very small, while the coordinate velocity of the comoving centerline is fixed by chart choice. Treating `||beta_eff||` as ship speed would violate the contract semantics.

### 3.5 Cabin-frame acceleration and lapse-side timing split

Eulerian cabin acceleration is a local observer quantity. For Eulerian observers, the lapse-gradient acceleration has the form:

\[
a_i=\frac{\partial_i\alpha}{\alpha}.
\]

Conversion to SI acceleration uses `c^2` when the geometric quantity is converted into `m/s^2`. This is an experienced proper-acceleration diagnostic for a declared observer family, not curvature gravity and not comfort/safety certification. The centerline-lapse clocking branch is a separate lapse-side timing calculation; it does not imply a cabin thrust law.

## 4. Source-side mechanism model

### 4.1 Casimir tile baseline

The mechanism layer begins with the idealized parallel-plate Casimir energy per area:

\[
\frac{E}{A}=-\frac{\pi^2\hbar c}{720a^3}.
\]

For a tile with plate area `A`, the static idealized energy is:

\[
E_{\rm tile}= -\frac{\pi^2\hbar c}{720a^3}A.
\]

This is a source-model baseline, not a GR-coupled proof of macroscopic stress-energy realization. Material corrections, finite geometry, drive response, and dynamic effects are mechanism-side model choices unless and until they are admitted into a solver-authoritative stress-energy route.

### 4.2 Hull-wide tile inventory and sectorization

A hull-wide model aggregates many tiles. If `N` tiles are modeled with comparable static budget, a simple static aggregate has the schematic form:

\[
U_{\rm static}\sim N E_{\rm tile}.
\]

Sectorization partitions this inventory into staged groups so that not all tiles are necessarily active at the same time. This is useful for duty averaging, but it is still source-side bookkeeping unless coupled to an admitted metric source route.

### 4.3 Duty averaging and sector strobing

A typical duty-averaging scalar used in the source narrative is:

\[
d_{\rm eff}=d_{\rm burst}d_{\rm cycle}\left(\frac{N_{\rm concurrent}}{N_{\rm sector}}\right).
\]

The mechanism-side effective budget can then be described schematically as:

\[
U_{\rm eff}=|U_{\rm static}|\,\gamma_{\rm geo}^{3}\,Q_{\rm burst}\,\gamma_{\rm VdB}\,d_{\rm eff}.
\]

and a mass proxy can be written as:

\[
M_{\rm proxy}=\frac{U_{\rm eff}}{c^2}.
\]

Sector strobing modulates duty-averaged source strength; it is not a certified thrust law. `g` targets in this context are local proper-acceleration targets in Earth-gravity units, not Lorentz gamma.

### 4.4 Why the source model remains mechanism-side

The Casimir source model is mechanism-side and not an experimentally grounded macroscopic stress-energy realization. Even measured-force-inferred normalization can improve provenance of a mechanism parameter without proving that the aggregate source closes as the stress-energy tensor required by a GR metric. NHM2 therefore separates source narration from metric evaluation.

### 4.5 Source closure: global diagonal tightness and regional diagnostic limits

Source closure is numerically tight on the global diagonal comparison in the current evidence stack, including a reported `relLInf = 4.6143808140791624e-10`. That number should not be promoted by itself. Source closure remains review-level because regional direct `T00` comparison is diagnostic-only, the metric side expects a `tile_effective_counterpart`, and the tile side currently resolves through a `gr_matter_channel_observation` path rather than an authoritative same-basis counterpart. The current regional residuals are also not small under that diagnostic comparison: hull is about `0.977`, wall is about `14.95`, and exterior shell is about `2.02`. The safe conclusion is: global diagonal agreement is tight under the current comparison, while regional direct source closure is not yet an authoritative physical source proof.

### 4.6 Divergence surface: where new physics or a source-model correction must enter

The red-team baseline localizes the central divergence. The metric-required lane can compute a same-chart stress-energy demand from the selected geometry:

\[
T_{\mu\nu}^{\rm required}[g_{\rm NHM2}]=\frac{1}{8\pi}G_{\mu\nu}[g_{\rm NHM2}].
\]

The source-mechanism lane must then supply an independently meaningful tile-effective counterpart:

\[
T_{\mu\nu}^{\rm tile\ effective}
\]

on the same chart, tensor basis, profile, run, units, masks, and regional aggregation rules. The hard comparison is not merely global and not merely diagonal:

\[
\Delta T_{\mu\nu}^{(R)}
=T_{\mu\nu}^{\rm required}(R)-T_{\mu\nu}^{\rm tile\ effective}(R),
\qquad
R\in\{{\rm global,hull,wall,exterior\ shell}\}.
\]

This equation defines where future novelty could live. If a future source model supplies a conserved, observer-auditable, QEI-bounded, same-basis tile-effective tensor whose regional residuals close against the metric-required tensor, then NHM2 would have a novel reduced-order source-to-geometry result to report. If that tensor cannot be supplied, then NHM2 remains a geometry-first diagnostic lane whose metric can be evaluated but whose proposed Casimir/tile source mechanism is not physically closed.

The term "new physics" should therefore be used carefully. The current paper does not claim that new physics has been found. It identifies the exact bridge any new physics, material mechanism, renormalized stress-tensor model, boundary-state construction, or source-coupling correction would have to cross.

## 5. Full-tensor observer closure

### 5.1 Why diagonal-only was insufficient

A diagonal-only stress-energy proxy can provide energy-density-like and pressure-like bookkeeping, but it cannot by declaration supply the observer momentum density `J_i` or off-diagonal spatial stresses `S_ij`. The ADM constraints show why:

\[
{}^{(3)}R+K^2-K_{ij}K^{ij}=16\pi E,
\]

\[
D_jK^j{}_i-D_iK=8\pi J_i.
\]

The Hamiltonian constraint can ground `E` when geometric and convention details are admitted. The momentum constraint ties `J_i` to derivatives of `K_ij`. Off-diagonal `S_ij` generally requires evolution information or an equivalent full Einstein-tensor evaluation. Therefore, NHM2 cannot promote missing `T0i` and off-diagonal `Tij` from a diagonal producer by assertion.

### 5.2 Same-chart projection grammar

The same-chart grammar is:

\[
E=T_{\mu\nu}n^\mu n^\nu,
\qquad
J_i=-T_{\mu\nu}n^\mu\gamma^\nu{}_i,
\qquad
S_{ij}=T_{\mu\nu}\gamma^\mu{}_i\gamma^\nu{}_j.
\]

All three quantities must be defined on the same foliation and chart. Mixed-chart inference is not an observer-closure route.

### 5.3 Reconstruction of T_mu_nu

Start from the standard decomposition:

\[
T_{\mu\nu}=E n_\mu n_\nu+n_\mu J_\nu+n_\nu J_\mu+S_{\mu\nu}.
\]

For spatial components, the normal has `n_i=0`, so:

\[
T_{ij}=S_{ij}.
\]

For the mixed time-space component:

\[
T_{0i}=E n_0n_i+n_0J_i+n_iJ_0+S_{0i}.
\]

Since `n_i=0`, this reduces to:

\[
T_{0i}=n_0J_i+S_{0i}.
\]

Using `n_0=-alpha` and `S_{0i}=beta^jS_{ij}` gives:

\[
T_{0i}=-\alpha J_i+\beta^jS_{ij}.
\]

For the time-time component:

\[
T_{00}=E n_0n_0+2n_0J_0+S_{00}.
\]

With:

\[
n_0=-\alpha,
\qquad
J_0=\beta^iJ_i,
\qquad
S_{00}=\beta^i\beta^jS_{ij},
\]

obtain:

\[
T_{00}=\alpha^2E-2\alpha\beta^iJ_i+\beta^i\beta^jS_{ij}.
\]

This reconstruction is admissible only if `E`, `J_i`, and `S_ij` come from the same underlying same-chart tensor or an equivalent same-chart route.

### 5.4 Einstein-tensor geometry-first route

The selected route is:

\[
G_{\mu\nu}=8\pi T_{\mu\nu},
\qquad
T_{\mu\nu}^{\rm geom}=\frac{1}{8\pi}G_{\mu\nu}.
\]

The route then projects the computed same-chart tensor into `E`, `J_i`, and `S_ij`, and evaluates observer energy-condition gates. In current artifact language, this selected metric observer path is identified by `einstein_tensor_geometry_fd4_v1` and same-chart derivability for `T0i` and off-diagonal `Tij`. Nevertheless, the overall full-loop state remains review-level because provenance and policy gates block blanket promotion.

### 5.5 Observer energy-condition gates

The observer audit checks energy-condition surfaces from the full tensor, not from a lone coordinate entry. A clean observer pass would mean the selected route satisfied the implemented observer-surface checks under the declared artifact semantics. It would not mean physical viability, experimental validation, or robustness for arbitrary external fields.

The present red-team status is stricter than the older summary wording. A full-loop observer section that reports `pass` cannot override a detailed observer artifact from a nearby run that reports `status = fail`, `observer_condition_failed`, `surrogate_model_limited`, or robust DEC failure. In the current evidence stack, the dated observer artifact reports robust DEC failure with a worst value on the order of `-5.8267450e7` on both metric and tile surfaces. That does not by itself refute the geometry-first tensor route; it means observer closure must be regenerated from one frozen run and reconciled before any clean observer-pass language is allowed.

### 5.6 What this closure does and does not prove

This closure demonstrates an auditable same-chart tensor evaluation path inside the repository evidence stack. The red-team baseline now treats it as an admitted metric-required diagnostic route, not as a completed observer-safe physical mechanism. It does not prove the physical source is realizable, that a lower-alpha profile passes, that a route ETA exists, or that any strong-field environment is safe.

## 6. Centerline-lapse clocking calculation

### 6.1 General 3+1 normalization

From Section 2.2:

\[
\left(\frac{d\tau}{dt}\right)^2=\alpha^2-\gamma_{ij}(v^i+\beta^i)(v^j+\beta^j).
\]

This is the general 3+1 proper-time relation for the declared chart and observer semantics.

### 6.2 Frozen centerline schedule

For the NHM2 centerline-lapse sweep, the coordinate mission, target-coupled schedule, and shift transport framing are frozen. Under the declared centerline semantics, the target relation is:

\[
\frac{d\tau}{dt}=\alpha_{\rm centerline}.
\]

This is not a general worldline theorem. It is the frozen-schedule centerline lapse target law for this experiment.

### 6.3 Constant-alpha solution

The expected proper time is:

\[
\tau(\alpha)=\int_0^T\alpha_{\rm centerline}\,dt.
\]

For constant `alpha`:

\[
\tau(\alpha)=\alpha T.
\]

The proper-time difference from coordinate time is:

\[
\Delta\tau=\tau-T=(\alpha-1)T.
\]

The saved days and subjective efficiency are:

\[
{\rm savedDays}(\alpha)=\frac{(1-\alpha)T}{86400},
\qquad
{\rm subjectiveEfficiency}=\frac{1}{\alpha}.
\]

### 6.4 Worked 0p995 calculation

The selected-profile clocking-law anchor uses:

\[
T=137755965.9171795\ {\rm s},
\qquad
\alpha=0.995.
\]

Substitute into `tau = alpha T`:

\[
\tau=0.995\times137755965.9171795=137067186.0875936\ {\rm s}.
\]

Then:

\[
\Delta\tau=(0.995-1)\times137755965.9171795=-688779.8295859\ {\rm s}.
\]

Convert saved seconds to days:

\[
\frac{688779.8295859}{86400}\approx7.972\ {\rm days}.
\]

This is a target-law calculation for the selected-profile centerline lapse schedule. It is not a general route-dynamics theorem, and it does not validate lower-alpha rows without their own fresh artifacts.

### 6.5 Expected lower-alpha ladder calculations

The same expected target calculation gives:

| profileTag | alpha | tau = alpha T (s) | Delta tau = (alpha - 1)T (s) | savedDays | subjectiveEfficiency | validation meaning |
|---|---:|---:|---:|---:|---:|---|
| 0p995 | 0.995 | 137067186.087594 | -688779.829586 | 7.971989 | 1.005025126 | selected clocking-law anchor, not blanket full-loop certified pass |
| 0p9000 | 0.900 | 123980369.325462 | -13775596.591718 | 159.439775 | 1.111111111 | expected target unless fresh row artifacts pass |
| 0p8000 | 0.800 | 110204772.733744 | -27551193.183436 | 318.879551 | 1.250000000 | expected target unless fresh row artifacts pass |
| 0p7300 | 0.730 | 100561855.119541 | -37194110.797638 | 430.487393 | 1.369863014 | near-frontier target / revalidation rung |
| 0p7000 | 0.700 | 96429176.142026 | -41326789.775154 | 478.319326 | 1.428571429 | runtime-blocked, not physics-failed |
| 0p5000 | 0.500 | 68877982.958590 | -68877982.958590 | 797.198877 | 2.000000000 | deep exploratory, not promoted |

For `0p7000`, the calculation is:

\[
\tau=0.7000\times137755965.9171795=96429176.1420256\ {\rm s},
\]

\[
\Delta\tau=-41326789.7751539\ {\rm s},
\qquad
{\rm savedDays}=478.319326.
\]

For `0p5000`, the calculation is:

\[
\tau=0.5000\times137755965.9171795=68877982.9585898\ {\rm s},
\]

\[
\Delta\tau=-68877982.9585898\ {\rm s},
\qquad
{\rm savedDays}=797.198877.
\]

### 6.6 Why lower-alpha rows are targets, not promoted outcomes

Expected clocking math says what a row should produce if the same schedule remains frozen and the centerline worldline remains flat at `d tau / dt = alpha`. Validation requires fresh artifacts: selected transport completion, profile coherence, mission coordinate invariance, proper/coordinate ratio closure, decomposition residual closure, lapse-tracked fraction, horizon margin, beta-over-alpha sanity, observer gates, source/provenance gates, and full-loop audit state.

## 7. Stability, perturbation, and frontier search

### 7.1 Gate-admitted selected-profile behavior

The current evidence stack admits selected same-chart observer routes and a selected-profile clocking-law anchor. This is enough to define the calculation and its artifact boundary, not enough to claim broad viability or a fully promoted ladder.

### 7.2 Perturbation and reproducibility limits

Reproducibility depends on artifact freshness, deterministic output paths, source manifests, and fail-closed gates. A row that lacks a fresh full-loop artifact is not silently promoted by expected math. A row blocked by selected transport is not a physics failure until the runtime layer completes and the physics gates are reached.

The red-team reference-run contract strengthens this requirement: validation claims cannot depend on `latest` aliases, mismatched profile IDs, null convergence fields, null boundary or smoothing sensitivity, missing independent reproduction, or artifact hash mismatch. These fields may remain null for diagnostic research, but they must be explicit blockers for any future validation or certified-language update.

### 7.3 0p7000 runtime frontier

`stage1_centerline_alpha_0p7000_v1` is the current operational frontier target. Its expected subjective efficiency is `1.428571429x`, but its current state is runtime-blocked at selected transport. The correct interpretation is operational: recover selected-transport completion before interpreting physics gates.

### 7.4 Frontier bisection strategy

If `0p7300` is confirmed and `0p7000` remains blocked or failing after runtime hardening, the rational search is bisection:

```text
0p7250 -> 0p7200 -> 0p7150 -> 0p7100 -> 0p7050 -> 0p7000
```

This distinguishes an operational failure from a numerical or physical frontier and prevents jumping from the anchor directly to deep exploratory profiles.

## 8. Scientific interpretation

### 8.1 What NHM2 currently demonstrates

The NHM2 calculation does not solve an experimentally realized Casimir material system into a flight-ready warp drive. What it solves, within the current repository evidence stack, is narrower: a same-chart metric-evaluation and observer-audit problem for a selected lapse-shift profile. The mechanism side supplies a modeled source narrative; the geometry side evaluates a lapse-shift profile; the Einstein-tensor route supplies a metric-required stress-energy tensor; observer projections evaluate energy-condition surfaces; and the centerline-lapse law computes expected proper-time reduction for frozen coordinate schedules. The current result is therefore a bounded mathematical and computational closure surface, not physical viability.

### 8.2 What remains open

The following remain outside the current claim:

- physical source realization of the required stress-energy tensor
- same-basis regional `T_ab_tile_effective_counterpart` closure against `T_ab_metric_required`
- single-frozen-run observer audit reconciliation
- QEI/QFT dossier with state assumptions, sampling worldlines, renormalization convention, and light-crossing / duty-cycle consistency
- convergence, boundary-condition sensitivity, smoothing-kernel sensitivity, and independent reproduction evidence
- experimental validation of Casimir-tile amplification as a macroscopic GR source
- arbitrary route dynamics
- max speed
- black-hole or strong external-field operation
- arbitrary ambient curvature envelope
- multi-mode cabin-gravity certification unless a future mode-axis artifact is published
- lower-alpha profile validation before fresh artifacts pass
- route ETA or speed-based SR/NR comparison
- theorem-level no-horizon or no-infinite-blueshift closure

### 8.3 Why literature context is not validation

The cited GR and warp-drive literature defines the mathematical language and the known cautionary terrain. Holography and wormhole literature provide additional external context about geometry, observers, negative energy, and causality. They do not certify this repository's numeric artifacts. In this whitepaper, papers provide formalism and context; repository artifacts define NHM2 row status.

### 8.4 What a future novel claim could be

The current novel contribution is not a claim of physical transport. It is the explicit localization of the source-to-geometry divergence under a same-chart red-team harness. The future publishable claim, if earned, would be narrower and stronger:

```text
NHM2 Reference Solve v1 supplies a frozen reduced-order same-chart source-to-geometry closure result: regional metric-required tensors and independently defined tile-effective counterpart tensors close within declared tolerance, observer artifacts agree from one run, QEI/QFT bounds are explicit, and convergence/reproduction evidence is emitted.
```

That would still not automatically imply experimental propulsion, ambient causality violation, or full quantum-gravity validation. It would be a defensible reduced-order GR result with a specific source-mechanism dossier. The reason to update this whitepaper now is to define the exact evidence bridge before trying to cross it.

## Appendix A. Repository artifact status and claim-tier table

The detailed implementation state belongs in an appendix because it is evidence metadata, not the scientific argument itself.

| item | current status / value | interpretation boundary |
|---|---|---|
| current commit referenced by May 2 addendum | `3ed3408c36ae43367ea60204622e34751a523059` | current status reference used by the May 2 whitepaper addendum |
| historical baseline commit | `53fb0a498b38892df11cfa2831d95c2007c3c64a` | April 3 bounded-stack historical baseline |
| selectedProfileId | `stage1_centerline_alpha_0p995_v1` | selected-profile clocking-law anchor, not blanket full-loop certified pass |
| full-loop latest overallState | `review` | top-level state remains review-level |
| currentClaimTier | `diagnostic` | not promoted to reduced-order / physical-viability claim |
| highestPassingClaimTier | `null` | no blanket top-level promotion |
| representative blocking reasons | `insufficient_provenance`, `policy_review_required` | provenance/policy gates still constrain claims |
| reference-run validation mode | `red_team_hardening` | validation claim remains false until hard gates pass |
| source_closure | globally diagonal-tight, review-level | regional comparison is diagnostic-only; expected `tile_effective_counterpart` is missing |
| regional residuals | hull about `0.977`, wall about `14.95`, exterior shell about `2.02` | diagnostic comparison does not regionally close |
| observer_audit | inconsistent summary/detail evidence | full-loop pass language must be reconciled against detailed fail artifacts from one frozen run |
| QEI/QFT dossier | missing / not promotion-safe | physical-mechanism language remains blocked |
| reproducibility fields | incomplete / null in current full-loop evidence | convergence, boundary, smoothing, independent reproduction, and hash consistency block validation language |
| certificate_policy_result | `pass` in current artifact stack | policy sub-surface pass does not override top-level review state |
| 0p7000 | `runtime_blocked` due to `selected_transport_timeout` | runtime-blocked, not physics-failed |
| 0p5000 | exploratory expected target | not promoted |

## Appendix B. Current generated artifact reproducibility boundary

The latest alpha-sweep summary and frontier-distance ledger available in this workspace were generated on `2026-05-02T17:16:42.266Z`. In this local workspace they are present under:

```text
artifacts/research/full-solve/selected-family/nhm2-shift-lapse/alpha-sweep/nhm2-lapse-alpha-sweep-latest.json
artifacts/research/full-solve/selected-family/nhm2-shift-lapse/alpha-sweep/nhm2-frontier-distance-latest.json
```

Unless those generated JSONs are separately committed and published, community-facing review should treat this markdown paper as documenting the local/generated artifact state rather than assuming every underlying JSON surface is publicly fetchable from GitHub.

The May 2026 red-team harness adds two explicit commands for freezing and validating a reference run:

```text
npm run nhm2:freeze-reference-run
npm run nhm2:validate-reference-run
```

The freeze step is allowed to produce an audit-only blocker ledger while `latest` aliases remain in the current artifact graph. A validation-ready reference run must have one commit, one selected profile, one run ID, one artifact set, no `latest` aliases, and no profile mismatches.

## Appendix C. Equation-to-artifact and equation-to-claim map

| Equation / construct | Scientific role | NHM2 use | Claim boundary |
|---|---|---|---|
| `ds^2=-alpha^2dt^2+gamma_ij(dx^i+beta^idt)(dx^j+beta^jdt)` | 3+1 metric split | defines lapse/shift/spatial metric language | formalism only |
| `(d tau / dt)^2 = alpha^2 - gamma_ij(v^i+beta^i)(v^j+beta^j)` | proper-time normalization | centerline timing and worldline audit grammar | chart/observer dependent |
| `E,J_i,S_ij` projections | observer stress-energy grammar | same-chart full-tensor observer closure | requires admitted route |
| `T_ij`, `T_0i`, `T_00` reconstruction | reconstruct coordinate tensor components | prevents diagonal-only proxy promotion | valid only from same-chart projected quantities |
| `G_mu_nu=8piT_mu_nu` | Einstein tensor route | geometry-first stress-energy evaluation | repo-internal evaluator, not experimental validation |
| `Delta T_mu_nu^(R)=T_required^(R)-T_tile_effective^(R)` | red-team divergence surface | identifies where source-to-geometry closure must be proven | requires same-basis regional counterpart tensor |
| WEC/NEC/SEC/DEC | energy-condition tests | observer audit | passing audit is not physical viability |
| `tau=alpha T` | frozen centerline clocking target | lapse sweep expectation | lower-alpha rows remain targets until artifacts pass |
| `E/A=-pi^2 hbar c/(720a^3)` | mechanism-side source model | tile energy baseline | not GR-coupled physical source proof |
| `d_eff=d_burst d_cycle (N_concurrent/N_sector)` | duty averaging | sector strobing source strength | not a certified thrust law |
| `a_i=partial_i alpha / alpha` | Eulerian proper acceleration | cabin-frame acceleration diagnostic | not curvature gravity or comfort/safety certification |

## Appendix D. Source list and citation roles

| source | role in this paper | boundary |
|---|---|---|
| ADM, The Dynamics of General Relativity: https://arxiv.org/abs/gr-qc/0405109 | 3+1 Hamiltonian formalism context | does not validate NHM2 |
| Gourgoulhon, 3+1 Formalism and Bases of Numerical Relativity: https://arxiv.org/abs/gr-qc/0703035 | foliation, lapse, shift, normal, projection, constraints | does not validate NHM2 |
| Alcubierre, The warp drive: https://arxiv.org/abs/gr-qc/0009013 | warp-metric context | does not validate NHM2 |
| Natario, Warp Drive With Zero Expansion: https://arxiv.org/abs/gr-qc/0110086 | low-expansion / warp context | does not validate NHM2 |
| Pfenning and Ford, The unphysical nature of Warp Drive: https://arxiv.org/abs/gr-qc/9702026 | negative-energy and warp limitation context | does not validate NHM2 |
| Fewster and Roman, Null energy conditions in quantum field theory: https://arxiv.org/abs/gr-qc/0209036 | energy-condition and quantum-field-theory caution context | does not validate NHM2 |
| Santiago, Schuster, Visser, Generic warp drives violate the null energy condition: https://arxiv.org/abs/2105.03079 | generic warp-drive NEC caution context | does not validate NHM2 |
| Maldacena, The Large N Limit of Superconformal Field Theories and Supergravity: https://arxiv.org/abs/hep-th/9711200 | controlled holographic context | does not validate NHM2 source closure or transport |
| Ryu and Takayanagi, Holographic Derivation of Entanglement Entropy from AdS/CFT: https://arxiv.org/abs/hep-th/0603001 | holographic geometry / entropy context | does not validate a local Casimir-tile source |
| Penington, Entanglement Wedge Reconstruction and the Information Paradox: https://arxiv.org/abs/1905.08255 | entanglement-wedge / Page-time context | does not validate NHM2 |
| Almheiri, Engelhardt, Marolf, Maxfield, The entropy of bulk quantum fields and the entanglement wedge of an evaporating black hole: https://arxiv.org/abs/1905.08762 | black-hole information and wedge context | does not validate NHM2 |
| Maldacena, Real observers solving imaginary problems: https://arxiv.org/abs/2412.14014 | observer-inclusion caution; v3 leaves an overall minus-sign caveat | does not validate the NHM2 observer audit |
| Maldacena, Milekhin, Popov, Traversable wormholes in four dimensions: https://arxiv.org/abs/1807.04726 | negative Casimir-like energy and ambient-causality context | does not validate warp drive or NHM2 tile source |
| Guevara, Lupsasca, Skinner, Strominger, Weil, Single-minus gluon tree amplitudes are nonzero: https://arxiv.org/abs/2602.12176 | unrelated scattering-amplitudes context | does not support NHM2 source closure |
| CasimirBot repository artifacts | implementation/evidence state | only source for NHM2 row status |

## Final conclusion

NHM2 is best described as a bounded, same-chart, artifact-limited mathematical and computational framework for evaluating a selected lapse-shift profile, its observer stress-energy route, and its centerline clocking targets. The scientific value of the current framework is that it makes the calculation auditable: accepted 3+1 formalism defines the variables, NHM2 instantiates them in one chart, the Einstein-tensor route supplies a metric-required tensor, observer projections define energy-condition gates, and the centerline-lapse law computes expected timing targets.

The red-team update sharpens the next scientific target. The current evidence does not support physical viability, max speed, route ETA, black-hole operation, arbitrary external-field operation, or promoted deep-clock rows. It does, however, define the divergence surface well enough to guide the next solve cycle: freeze one reference run, remove `latest` alias drift, reconcile observer artifacts, publish regional same-basis tile-effective counterpart tensors, attach a QEI/QFT dossier, emit convergence/reproduction evidence, and only then consider stronger source-to-geometry claims. Any future novel claim should be made at that bridge, after the bridge passes, not before.

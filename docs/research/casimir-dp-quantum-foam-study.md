# Boundary-Condition Casimir Observables and Diósi–Penrose Collapse

## A separated-lane quantum-foam study protocol

**Study id:** `casimir-dp-quantum-foam-study`  
**Short id:** `CDP-QF-1`  
**Status:** proposal package complete; commissioning conditional; measured evidence not ready  
**Current / maximum claim tier:** diagnostic / diagnostic  
**Manifold-response math maturity:** Stage 0 exploratory / noncomputable  
**Evidence cutoff:** 2026-07-21  
**Run config:** `configs/research/casimir-dp-quantum-foam-study.v1.json`  
**Runner:** `scripts/research/run-casimir-dp-quantum-foam-study.ts`  
**Experiment-design config:** `configs/research/casimir-dp-experiment-design.v1.json`  
**Experiment-design runner:** `scripts/research/run-casimir-dp-experiment-design.ts`  
**Maintained design report:** `docs/research/casimir-dp-experiment-design-report.md`  
**Gated-computations config:** `configs/research/casimir-dp-next-computations.v1.json`  
**Gated-computations runner:** `scripts/research/run-casimir-dp-next-computations.ts`  
**Gated-computations report:** `docs/research/casimir-dp-next-computations-report.md`  
**Data-readiness config:** `configs/research/casimir-dp-data-readiness.v1.json`  
**Data-readiness runner:** `scripts/research/run-casimir-dp-data-readiness.ts`  
**Data-readiness report:** `docs/research/casimir-dp-data-readiness-report.md`  
**Proposal-closure config:** `configs/research/casimir-dp-proposal-closure.v1.json`  
**Proposal-closure runner:** `scripts/research/run-casimir-dp-proposal-closure.ts`  
**Experiment proposal:** `docs/research/casimir-dp-experiment-proposal.md`  
**Proposal-closure report:** `docs/research/casimir-dp-proposal-closure-report.md`  
**Equation-action sidecar:** `docs/research/casimir-dp-quantum-foam-study.equation-actions.json`  
**Equation-action source:** `docs/research/casimir-dp-quantum-foam-study.equation-actions.source.json`  
**Theory-badge graph:** `shared/theory/casimir-dp-study-theory-badges.ts`

## Abstract

This study asks whether changing a Casimir boundary condition can produce a
pre-registered residual in either a force observable or a coherence-decay
observable while remaining consistent with Diósi–Penrose (DP) collapse
phenomenology and modern experimental bounds. It deliberately separates
standard Casimir theory and measurement, ordinary open-system decoherence, DP
mass-density-branch diagnostics, semiclassical or stochastic metric response,
and candidate quantum-foam models. The study does not assume that measured
Casimir force is DP gravitational self-energy, that a negative renormalized
energy density is a scalar "negative curvature," or that vacuum-induced
decoherence is objective collapse. The initial runnable scaffold therefore
produces independent Casimir and DP diagnostic outputs plus blocked
manifold-response and observable bridges. Promotion requires
material/metrology receipts, a controlled coherence experiment, measured
mass-density branch evidence, quantitative response dynamics, sensitivity and
negative-control campaigns, and comparison with independent collapse bounds.

## 1. Why this is separate from NHM2

NHM2 uses Casimir-related quantities inside a broader source-budget and
geometry pipeline. This paper asks a different question about Casimir
phenomenology and objective-collapse constraints. It may reuse repository
calculators, material receipts, provenance conventions, and run-order lessons,
but it does not inherit NHM2 source closure, transport, viability, certificate,
or force-to-stress assumptions.

The shared study method is procedural:

- freeze claims before running;
- separate observables from interpretations;
- run prerequisites before dependent stages;
- keep scalar calculator rows distinct from field or receipt authority;
- hash outputs and preserve contradictory statuses;
- promote no conclusion beyond the weakest required evidence lane.

The reusable protocol is in
`docs/research/study-full-solve-template.md`.

## 2. Research question and hypotheses

### 2.1 Research question

Can a registered quantum-foam response model produce a gap-, geometry-,
material-, temperature-, or modulation-dependent Casimir residual that is
distinguishable from standard electromagnetic, thermal, material, patch-force,
roughness, and apparatus systematics, while its implied gravitational-collapse
parameters remain compatible with independent DP bounds?

### 2.2 Hypotheses

- `H0 — standard Casimir`: Lifshitz/QED boundary-response theory plus known
  apparatus and material corrections accounts for the data.
- `H1 — quantum-foam residual`: a future, explicitly parameterized
  quantum-spacetime response model predicts an additional observable residual.
- `H2 — nuisance residual`: electrostatic patches, geometry, calibration,
  roughness, drift, thermal response, or model misspecification produces the
  residual.
- `H3 — DP consistency only`: DP supplies a separate collapse-timescale and
  bound-comparison lane for stated mass-density branches; it is not the source
  of a Casimir residual unless a registered theory supplies that bridge.
- `H4 — ordinary boundary-conditioned decoherence`: changing the cavity
  boundary changes electromagnetic, thermal, mechanical, or measurement
  backaction and therefore changes visibility without objective collapse.
- `H5 — manifold-response residual`: after the `H4` budget is frozen and
  subtracted, a registered semiclassical, stochastic-gravity, or new
  quantum-spacetime model predicts a nonzero boundary-conditioned coherence
  residual with a pre-registered scale law.

At scaffold time, `H1` and `H5` are not executable because no quantitative
response model or registered observable bridge has been admitted.

### 2.3 Prompt-derived manifold-response hypothesis

The motivating hypothesis is retained in this narrower form:

> Boundary conditions alter the renormalized quantum-field stress tensor. If a
> source-backed extension of semiclassical or stochastic gravity maps that
> alteration to branch-dependent metric fluctuations, those fluctuations may
> contribute a distinguishable residual to the coherence decay of a separately
> prepared material superposition.

This is a Stage 0 exploratory hypothesis. It is not presently a Penrose or DP
prediction. Its value is that every link can be tested or blocked separately:

1. establish the boundary-conditioned stress-tensor difference;
2. establish the ordinary environmental decoherence budget;
3. hold the material mass-density branches fixed;
4. register a tensor-to-metric and metric-to-coherence response model;
5. test a blinded boundary-conditioned coherence differential;
6. compare any surviving parameter region with independent collapse bounds.

## 3. Lane A — Casimir reference and observation

For ideal, perfectly conducting parallel plates at zero temperature, the
reference energy per unit area is:

<!-- helix-doc-equation-action/v1 id=cdp-casimir-energy-per-area -->
\[
\frac{E_C}{A}=-\frac{\pi^2\hbar c}{720a^3}.
\]

The corresponding ideal pressure is:

<!-- helix-doc-equation-action/v1 id=cdp-casimir-pressure -->
\[
P_C=-\frac{\pi^2\hbar c}{240a^4}.
\]

These are reference rows, not complete apparatus predictions. A reportable
measurement comparison must attach run-specific geometry, gap calibration,
dielectric response, temperature, roughness, patch-potential, vibration, and
force-response receipts. For shaped or finite structures, an ideal
parallel-plate result cannot substitute for a validated geometry/material
calculation.

Define the measurement residual only after those corrections are frozen:

<!-- helix-doc-equation-action/v1 id=cdp-casimir-force-residual -->
\[
R_F(a,T,\mathcal{G},\mathcal{M})=F_{obs}-F_{standard}.
\]

`R_F` is an observed-minus-model force residual in newtons. It is not an energy,
mass-density branch difference, gravitational self-energy, or collapse rate.

The ideal parallel-plate case is attractive. Casimir interactions are not
intrinsically "repulsion from negative density": their sign and spatial stress
depend on boundary conditions, geometry, material response, medium, and state.
Likewise, "virtual photons popping in and out" is a perturbative picture, not a
literal population with a measured birth, lifetime, and annihilation event.
The study therefore uses renormalized field observables and apparatus response,
not virtual-particle trajectories, as the QED lane.

## 4. Lane B — Diósi–Penrose diagnostic

The DP lane begins with two explicit mass-density branches:

\[
\Delta\rho(\mathbf{x})=\rho_A(\mathbf{x})-\rho_B(\mathbf{x}).
\]

The repository computes a regularized gravitational self-energy diagnostic
from those branches. Its conceptual form is:

<!-- helix-doc-equation-action/v1 id=cdp-dp-self-energy -->
\[
\Delta E_G\sim \frac{G}{2}\iint
\frac{\Delta\rho(\mathbf{x})\Delta\rho(\mathbf{y})}
{|\mathbf{x}-\mathbf{y}|}\,d^3x\,d^3y.
\]

This is field/runtime-owned. A scalar calculator cannot reconstruct it from a
Casimir force value. The scalar timescale may be replayed only after
`deltaE_G_J` has a documented branch, grid, cutoff, and provenance receipt:

<!-- helix-doc-equation-action/v1 id=cdp-dp-timescale -->
\[
\tau_{DP}=\frac{\hbar}{\Delta E_G}.
\]

Analytic or synthetic branch distributions are diagnostic. Measured-density
paths still require traceable branch construction and current experimental
bound comparison. DP collapse is a stochastic model modification, not a result
derived from standard Casimir theory.

### 4.1 Compton-frequency non-bridge

Mass-energy equivalence and Planck's relation permit frequency notation, but
they do not by themselves identify a physical oscillator, a spectral line, or
an apparatus coupling. Define the rest-energy and DP characteristic
frequencies separately:

<!-- helix-doc-equation-action/v1 id=cdp-compton-dp-frequency-identities -->
\[
\nu_C=\frac{mc^2}{h},\qquad
\nu_{DP}=\frac{\Delta E_G}{h}=\frac{1}{2\pi\tau_{DP}},\qquad
\omega_{DP}=\frac{\Delta E_G}{\hbar}=\tau_{DP}^{-1}.
\]

`\nu_C` is the Compton frequency associated with total rest energy. It becomes
operational only through a specified phase difference, reference, and readout;
the identity does not make the body vibrate at `\nu_C`. By contrast,
`\nu_{DP}` and `\omega_{DP}` are derived from the branch-dependent DP
self-energy. They express the inverse DP timescale in cyclic- and
angular-frequency notation, but the current DP model does not predict an
oscillatory line at either rate.

Equal dimensions do not establish a coupling to a Casimir-cavity mode. The
study therefore registers the following fail-closed gate:

<!-- helix-doc-equation-action/v1 id=cdp-frequency-cavity-bridge-gate -->
\[
\mathrm{Bridge}(\nu_C,\nu_{DP},\omega_{cavity})
=\mathrm{BLOCKED}:
\mathcal K_{cavity\rightarrow branch/coherence}\ \text{not registered}.
\]

Opening this gate requires a sourced transfer kernel `\mathcal K` that states:

- which boundary-conditioned field observable enters the model, such as a
  renormalized spectral density, stress tensor, or noise kernel;
- how that input modifies `\Delta\rho`, `\Delta E_G`, or a declared
  coherence/master-equation term without substituting one observable for
  another;
- the predicted differential output, including its gap, material, temperature,
  switching-state, and superposition-geometry dependence;
- units, normalization, covariance, validity domain, standard and DP limits,
  parameter priors, and an independently testable falsifier; and
- a source or derivation that supplies the dynamics, rather than an analogy
  based only on `E=mc^2=h\nu`.

Until those items exist, "beat frequency," "manifold ringing," and
"quantum-foam resonance" are explanatory metaphors, not registered
observables or predictions.

### 4.2 Scientific and runtime claim baseline

The following table fixes the interpretation baseline used by the paper,
sidecars, and Theory Badge graph. "Resolved" in the runtime column means that
the claim is classified and bounded; it does not mean that the proposed physics
has been experimentally demonstrated.

| Proposition | Scientific standing | Paper/runtime standing | Allowed use in this study |
|---|---|---|---|
| `E=mc^2=h\nu_C` supplies a collapse clock | The identity defines a Compton frequency but no collapse observable or cavity coupling by itself. | `blocked` by the Compton/DP/cavity frequency-separation gate. | Rest-energy bookkeeping and explicitly modeled phase differences only. |
| DP reduction is a beat between two manifolds | Penrose motivates an incompatibility between alternative mass geometries; the repository implements a nonrelativistic mass-density self-energy proxy, not an acoustic mode. | DP rate-only diagnostic; covariant manifold dynamics `blocked`. | Metaphor only; no resonance or spectral-line claim. |
| Conducting plates literally filter long-wavelength virtual particles | Mode and Green-function language can be useful, but a virtual-particle population is not the measured observable and Casimir forces do not select a unique vacuum ontology. | Resolved as a QED claim boundary. | Use Lifshitz/material response and measured apparatus observables. |
| A Casimir region has absolute negative energy | Ideal renormalized stress can be negative relative to a reference; real apparatus predictions require material, boundary, geometry, temperature, and renormalization receipts. | Ideal and reduced-order validation `pass`; apparatus-matched evidence `not_ready`. | Reference-subtracted stress/force statements with stated model domain. |
| Negative energy density means negative spacetime curvature | Curvature follows a tensor field equation; the sign of one stress component does not determine the solved geometry. | Semiclassical baseline registered; causal manifold response `blocked`. | Tensor-source hypothesis only, with no geometry-control claim. |
| Changing a cavity boundary changes the standard DP rate | Not when the material branch distributions and DP regularization are held fixed. | Conditional DP boundary null registered. | A nonzero effect requires a new sourced bridge or a documented branch change. |
| Sweeping cavity spacing maps virtual-photon or quantum-foam frequencies | No registered theory supplies a one-to-one spectral map; a gap sweep also changes ordinary electromagnetic and mechanical nuisances. | Primary proposal instead freezes geometry and switches a boundary state between shots. | Exploratory diagnostic only after an explicit transfer function and nuisance model exist. |
| A boundary-conditioned coherence residual proves objective collapse | A residual first identifies model inadequacy or unmodeled decoherence; nonunitary attribution requires discriminating dynamics and replication. | Coherence pipeline `pass`; measured evidence `not_ready`; collapse identification `blocked`. | Report as a residual until the preregistered identification gate closes. |

Penrose's motivation concerns the ill-defined identification of time evolution
between materially different spacetime geometries. The repository DP estimator
implements the nonrelativistic mass-density self-energy proxy above; it does not
compute a covariant superposition of manifolds. A virtual photon is also not a
prepared, persistent mass-density branch accepted by that estimator. Applying
`\tau_{DP}=\hbar/\Delta E_G` to an assigned virtual-particle "lifetime" would
therefore mix two different formalisms without a registered derivation.

For the current DP implementation, a useful null prediction is:

<!-- helix-doc-equation-action/v1 id=cdp-dp-boundary-null -->
\[
\Delta_b\Gamma_{DP}=0
\quad\text{when}\quad
\Delta\rho,\ell,\text{grid, and branch geometry are held fixed}.
\]

Here `b` labels the cavity boundary setting, not a DP branch. If a boundary
change moves, heats, polarizes, or strains the superposed body, then
`\Delta\rho` has not been held fixed and the null comparison is invalid.

## 5. Lane C — candidate quantum-foam model

### 5.1 Semiclassical curvature baseline

The conservative starting point is not a foam ontology but the renormalized
stress tensor in semiclassical gravity. In a simplified notation,

<!-- helix-doc-equation-action/v1 id=cdp-semiclassical-curvature-baseline -->
\[
G_{\mu\nu}+\Lambda g_{\mu\nu}
=\frac{8\pi G}{c^4}\left\langle\hat T_{\mu\nu}\right\rangle_{\rm ren}.
\]

A complete renormalized treatment may also require local curvature counterterms.
The equation is a tensor relation: a negative value of one energy-density
component does not by itself imply a globally or uniquely "negative-curved"
manifold. Pressures, momentum fluxes, the quantum state, boundary conditions,
and the solved geometry all matter.

For two controlled cavity settings `b_1` and `b_0`, define the QFT input as:

<!-- helix-doc-equation-action/v1 id=cdp-boundary-stress-difference -->
\[
\Delta_b\!\left\langle\hat T_{\mu\nu}\right\rangle_{\rm ren}
=\left\langle\hat T_{\mu\nu}\right\rangle_{\rm ren}^{b_1}
-\left\langle\hat T_{\mu\nu}\right\rangle_{\rm ren}^{b_0}.
\]

This boundary-setting difference is not the DP mass-density branch difference
`\Delta\rho`. It can become an input to a manifold-response model only after
its material, geometry, state, renormalization, and uncertainty contracts are
specified.

### 5.2 Mean response, fluctuations, and collapse are separate

The semiclassical equation uses the mean renormalized stress tensor. A
stochastic-gravity treatment adds stress-tensor correlations through a noise
kernel and can predict induced metric fluctuations. Neither framework, by
itself, is the DP objective-collapse rule. The study therefore distinguishes:

- mean Casimir stress and its semiclassical metric response;
- stress-tensor noise and ordinary open-system decoherence;
- a DP collapse term derived from stated material mass-density branches;
- a genuinely new manifold-response or quantum-foam term.

Environmental decoherence can suppress interference while the joint quantum
state remains unitary. Objective collapse changes the dynamics. Observing
visibility loss is not enough to distinguish them without a model comparison
and a complete noise budget.

### 5.3 Registered coherence observable

The proposed direct manipulation is to change a cavity boundary setting while
holding the prepared material superposition fixed, then measure its coherence
decay rate `\Gamma`. The residual observable is:

<!-- helix-doc-equation-action/v1 id=cdp-coherence-rate-residual -->
\[
\Delta\Gamma_{res}
=\left(\Gamma_{obs}^{b_1}-\Gamma_{obs}^{b_0}\right)
-\Delta\Gamma_{EM}-\Delta\Gamma_{thermal}
-\Delta\Gamma_{mech}-\Delta\Gamma_{readout}.
\]

Every subtraction term must be fixed from calibration or control data before
the blinded target comparison. The standard-null expectation is
`\Delta\Gamma_{res}=0` within the combined uncertainty.

### 5.4 Candidate manifold-response bridge

The prompt's core proposal is represented by a deliberately unregistered
functional:

<!-- helix-doc-equation-action/v1 id=cdp-manifold-response-slot -->
\[
\Delta\Gamma_{MR}
=\mathcal{F}_{MR}\!\left[
\Delta_b\!\left\langle\hat T_{\mu\nu}\right\rangle_{ren},
N_{\mu\nu\rho\sigma},\Delta\rho;\theta_{MR}\right],
\qquad \mathcal{F}_{MR}\ \text{not yet registered}.
\]

`N_{\mu\nu\rho\sigma}` denotes a stress-tensor noise kernel. A candidate model
must state whether it uses the mean source, the correlations, or both; how they
produce a branch-dependent metric response; how that response changes
coherence; and why the term is objective collapse rather than an unmodeled bath.
It must also recover the ordinary QED/open-system and DP limits when its new
coupling is set to zero.

### 5.5 Quantum-foam model requirements

"Quantum foam" is a model-family label until a study version supplies all of:

- state variables and dynamics;
- a response function mapping model parameters to a Casimir observable;
- dimensional and frame consistency;
- a validity domain and limiting behavior recovering the standard baseline;
- an uncertainty/error model;
- a falsifier that separates the signal from material and apparatus nuisance
  models;
- a separately justified map, if any, to DP mass-density branches or collapse
  parameters.

The current hypothesis slot is intentionally noncomputable:

<!-- helix-doc-equation-action/v1 id=cdp-quantum-foam-response-slot -->
\[
R_F^{foam}=\mathcal{R}_{foam}(a,T,\mathcal{G},\mathcal{M};\theta_{foam}),
\qquad \mathcal{R}_{foam}\ \text{not yet registered}.
\]

No parameter fit is permitted until `\mathcal{R}_{foam}` and the nuisance model
are frozen before exposure to the target residual dataset.

### 5.6 Direct-manipulation experiment packet

The preferred experiment is a differential coherence study, not a force-only
measurement:

1. prepare the same spatial or mechanical superposition under both cavity
   settings;
2. switch or modulate a boundary property without changing the branch mass
   distribution;
3. record force, displacement, temperature, charge/patch potential, vibration,
   photon occupation, material loss, and readout backaction as sidecars;
4. infer `\Gamma_{obs}` with the analysis blinded to the boundary label;
5. unblind only after the standard decoherence model and uncertainty budget are
   frozen;
6. test the pre-registered gap, material, temperature, modulation-frequency,
   and branch-separation scaling laws;
7. repeat with a matched-force or matched-heating control that changes the QED
   bath without the proposed manifold variable, where feasible.

Static and actively modulated boundary protocols must be separate campaigns.
Active modulation can create ordinary photons, heating, vibration, and
dynamical-Casimir-like excitations, all of which belong to `H4` unless a
quantitative residual survives their modeled contribution.

### 5.7 Role-separated experiment-design campaign

Campaign `boundary-coherence-platform-screen-v1` compares three complementary
roles. It does not declare one apparatus to be the physics winner:

| Role | Platform and actuator | Diagnostic result | Present use |
|---|---|---|---|
| Casimir calibration | Cryogenic nanomechanical resonator; superconducting transition | ideal-reference force SNR `1.30e6`; unmodeled phase `1.23e-7 rad`; DP branch unresolved | characterize boundary switching and force sidecars |
| Integrated development | Cryogenic levitated nanoparticle; symmetric gated 2D boundaries | force SNR `163`; visibility `0.807`; Gaussian-proxy `tau_DP=8.43e6 s` | develop the joint switching/coherence protocol |
| Spatial benchmark | Free-flight nanoparticle matter wave; photoexcited semiconductor | `133 nm` branch separation; visibility `0.242`; unmodeled phase `8.24e5 rad` | benchmark large separation while exposing the force-cancellation problem |

For the integrated levitated design, the registered proxy gives
`Gamma_DP=1.19e-7 s^-1` against an assumed ordinary-environment rate of
`Gamma_env=2.15 s^-1`. The accessible-rate ratio is therefore:

<!-- helix-doc-equation-action/v1 id=cdp-accessible-rate-ratio -->
\[
\mathcal R_{access}=\frac{\Gamma_{DP}}{\Gamma_{env}}
=5.52\times 10^{-8}.
\]

This nearly eight-order rate gap is the central quantitative design constraint,
not evidence of collapse. Closing it requires measured decoherence sidecars,
realistic mass-density branches, a publication-grade finite-material Casimir
calculation, and a dynamics-level discriminator. The nanomechanical candidate
ranks highest on the campaign's engineering index only because it is a strong
actuator/calibration platform; its femtometre-scale branch requires an
elastic-body DP model and is not currently a DP test result.

All current Casimir values in this campaign are ideal parallel-plate
references. All computed DP values are Gaussian branch proxies. The maintained
report preserves the full gate ledger and the meaning of each role.

### 5.8 Gated computations Stage 1

Campaign `casimir-dp-gated-computations-stage1-v1` advances all five open
calculation lanes without promoting any physical claim.

#### Equilibrium Lifshitz calculation

The new solver directly evaluates the equilibrium planar Lifshitz free energy
and pressure from Matsubara frequencies and TE/TM reflection coefficients:

<!-- helix-doc-equation-action/v1 id=cdp-stage1-lifshitz-free-energy -->
\[
\frac{\mathcal F(a,T)}{A}=\frac{k_B T}{2\pi}
\sum_{n=0}^{\infty}{}'\int_0^{\infty}k_\perp\,dk_\perp
\sum_{p\in\{TE,TM\}}\ln\!\left(1-r_p^{(1)}r_p^{(2)}e^{-2q_na}\right).
\]

At `300 K` and `100 nm`, the ideal-conductor validation row converges in 134
Matsubara terms to `-13.001258 Pa`, a ratio of `1.00000005` to the ideal
zero-temperature reference. A gold-like Drude sphere/plate PFA reference gives
`-5.631390 Pa` for the underlying plane-plane pressure, or `0.433142` of the
ideal reference. This second row remains literature-parameterized and PFA-only.
It does not close the measured-material or finite-geometry gates.

The actual gated-2D, superconducting-transition, and photoexcited-semiconductor
candidate boundaries remain `not_ready`; they require surface-conductivity or
transition-specific reflection operators and time-resolved material receipts.

#### Sidecars and DP branch convergence

The switching and decoherence schemas now require every measured datum to carry
a raw-artifact SHA-256. The current levitated sidecars intentionally retain
`design_assumption` status. Their combined rate is `2.15 +/- 0.48 s^-1` under a
diagonal covariance assumption, giving visibility `0.806541` over `0.1 s`.

Replacing the earlier Gaussian branch with a homogeneous rigid sphere gives the
following exact-grid diagnostic:

| Grid | `Delta E_G` (J) | `Gamma_DP` (`s^-1`) | Change from prior |
|---:|---:|---:|---:|
| `12^3` | `2.6549e-41` | `2.5175e-7` | n/a |
| `14^3` | `1.7919e-41` | `1.6992e-7` | `0.4816` |
| `16^3` | `1.5267e-41` | `1.4477e-7` | `0.1737` |

The final change passes the registered coarse `25%` Stage-1 numerical gate,
but density provenance remains `not_ready`: the sphere is a design model, not a
measured internal mass-density map.

#### Power and identifiability

Under an independent-binomial fringe approximation, two-sided `alpha=0.05`,
`90%` power, and variance inflation 2, detecting only the rigid-sphere DP rate
against the assumed `2.15 s^-1` background requires approximately
`1.08e17` shots per setting (`2.15e17` total). This makes the rate-only protocol
inaccessible under the present assumptions.

More importantly, rate-only visibility cannot identify collapse. The dynamics
signature gate remains blocked until a source-backed collapse model predicts a
secondary phase, heating, or cross-correlation observable that is linearly
independent of the switching/decoherence signature under measured uncertainty.
Phase and cross-correlation observables are therefore the next design priority.

The tensor-to-metric-to-coherence manifold slot remains blocked. The new
registration contract names the missing renormalized stress prescription,
stress-noise kernel, causal metric response, gauge contract, coherence dynamics,
consistency/recovery proofs, frozen parameters, and falsifiers; it supplies no
surrogate rate for any of them.

### 5.9 Data-readiness and blinded discriminator gate

Campaign `casimir-dp-data-readiness-stage1-v1` now makes the next experimental
inputs runnable without relabelling fixtures or external datasets as evidence
from this apparatus.

#### Optical response on the imaginary axis

The material pipeline accepts a real-axis loss table with a raw-artifact
SHA-256, calibration references, uncertainties, a frequency-coverage contract,
and registered low- and high-frequency tails. It evaluates

<!-- helix-doc-equation-action/v1 id=cdp-data-readiness-kramers-kronig -->
\[
\epsilon(i\xi)=1+\frac{2}{\pi}\int_0^\infty
\frac{\omega\epsilon''(\omega)}{\omega^2+\xi^2}\,d\omega.
\]

A hash-authenticated synthetic single-Lorentz fixture agrees with its analytic
imaginary-axis response to a maximum relative error below `1e-6` in the frozen
campaign. This is a numerical validation only. The measured-material gate
remains `not_ready` until an apparatus-specific loss table, calibration chain,
uncertainty/covariance model, coverage justification, and authentic raw hash are
provided. The converted synthetic fixture is deliberately emitted as a design
assumption, never as measured material.

#### Acquisition sidecars and covariance

Switching and decoherence sidecars now have a raw JSON ingestion path that
checks their SHA-256, calibration references, observable identities, covariance
dimensions, symmetry, and positive-semidefinite status. The supplied sidecars
pass those structural checks as `synthetic_fixture` artifacts. Their measured
evidence gates remain `not_ready`.

The blinded analysis freezes coherence decay as the primary observable and
phase, coupled heat, force mismatch, and switch cross-correlation as secondary
channels. Matched heating, a detuned boundary, an identical boundary, label
permutation, and switch-disabled runs are registered negative controls.
Unblinding is disallowed until hashes, calibrations, covariance, exclusions,
and analysis code are frozen.

For a correlation alternative, the diagnostic power approximation is

<!-- helix-doc-equation-action/v1 id=cdp-data-readiness-correlation-power -->
\[
N_{pair}=\left\lceil 3+
\left(\frac{z_{1-\alpha/(2m)}+z_{power}}
{\operatorname{atanh}(\rho_1)-\operatorname{atanh}(\rho_0)}\right)^2
\right\rceil.
\]

With four registered secondary tests, two-sided family alpha `0.05`, and `90%`
power, the frozen design requires `1,422` paired windows for correlation
`rho=0.10`, or `351` for `rho=0.20`. These counts size a switching-contamination
or dynamics-discriminator channel. They do not identify objective collapse.

#### Source-data access ledger

The access manifest registers, without importing them as this study's
measurements:

- the open Zenodo data/code package for the 2026 sodium-cluster interferometer,
  DOI `10.5281/zenodo.17502163`, including repository checksum metadata;
- the ETH source-data landing record for cryogenic nanoparticle control, DOI
  `10.3929/ethz-b-000480147`;
- the figure source-data spreadsheets for the Gran Sasso DP constraint study;
- the supplementary-information route for the 2026 superconducting nonlinear
  force measurement, whose raw machine-readable measurement package has not
  yet been authenticated for this campaign.

The collapse-identifiability gate remains `blocked`: no source-backed DP or
Penrose secondary-observable signature is registered. The manifold-response
gate likewise remains `blocked` pending a renormalized stress/noise-kernel,
causal metric-response, gauge, and metric-to-coherence dynamics contract.

### 5.10 Proposal closure and architecture correction

The proposal-closure campaign freezes
`transverse-branch-sample-hold-2d-boundary` as the single commissioning
architecture. This replaces the earlier reliance on symmetric cancellation of
large normal forces.

The particle is a nominal 75 nm-radius silica sphere at a 5 micrometre surface
distance, commissioned only across the registered 10-to-4 micrometre ladder.
Its 20 nm superposition separation is transverse to the surface normal. The
boundary state is randomized between shots, allowed to settle for at least 10
seconds, and held static during each 0.1 second coherent evolution. A separate
cofabricated nanomechanical calibrator must establish a five-sigma
gate-dependent force contrast before the coherence phases may start.

The literature-anchored retarded silica/silicon reference gives

\[
C_4=3.2062\times10^{-49}\ \mathrm{J\,m^4},\quad
U_{CP}=-5.1300\times10^{-28}\ \mathrm J,\quad
F_{CP}=-4.1040\times10^{-22}\ \mathrm N
\]

at the nominal distance. These values are reference scales, not the proposed
2D boundary-state contrast. Apparatus-specific optical response and
finite-geometry contrast remain `not_ready`.

The phase-stability contract exposes the central integration risk:

<!-- helix-doc-equation-action/v1 id=cdp-proposal-phase-force-bound -->
\[
\delta F_{max}=\frac{\hbar\,\delta\phi_{max}}{\Delta x\,t}
=5.2729\times10^{-27}\ \mathrm N.
\]

For one elementary charge this is equivalent to only
`3.2911e-8 V/m`. Zero measured net charge, field reversal, shielding,
surface-patch mapping, state-expansion alignment, and direct phase-nuisance
measurement are therefore hard commissioning gates.

The machine-readable proposal registers first-class signal,
finite-geometry/material, calibration, synchronization, blinding, covariance,
systematics-transfer, commissioning, and statistical-decision contracts. It
also registers twelve systematics families, six dependency-ordered
commissioning stages, at least 1,600 paired windows for the main run, and five
exhaustive outcome classes. Cross-field invariants make inconsistent clock,
window, blinding, alpha, power, or sample-count settings fail closed. Proposal
completeness is `pass`; commissioning entry is `conditional_pass`. Hardware
completion, measured evidence, finite-geometry contrast, collapse
identification, and manifold dynamics remain open for the exact artifacts that
can close them.

## 6. Observable-separation gate

The study currently fails closed at the cross-lane bridge:

<!-- helix-doc-equation-action/v1 id=cdp-observable-separation-gate -->
\[
\mathrm{Bridge}(R_F,\Delta E_G)=\mathrm{BLOCKED}:
\mathrm{missing\ registered\ observable\ bridge}.
\]

Matching subject words such as vacuum, gravity, fluctuation, or energy do not
make these observables identical. The bridge can be unblocked only by a
source-backed quantitative theory that names its transformation, assumptions,
validity domain, and error contract, followed by independent testing.

A second gate keeps visibility loss distinct from collapse:

<!-- helix-doc-equation-action/v1 id=cdp-decoherence-collapse-gate -->
\[
\mathrm{Identify}(\Delta\Gamma_{res},\Gamma_{collapse})
=\mathrm{BLOCKED}:\mathrm{ordinary\ decoherence\ alternatives\ remain}.
\]

This gate requires a registered dynamics-level discriminator, not merely a
correlation between cavity setting and reduced interference visibility.

## 7. Canonical run order

The machine-readable order in the config is normative:

1. `freeze_protocol`
2. `casimir_reference_baseline`
3. `casimir_material_and_metrology_gate`
4. `boundary_condition_coherence_protocol`
5. `standard_decoherence_budget_gate`
6. `dp_branch_provenance_gate`
7. `dp_self_energy_diagnostic`
8. `dp_experimental_bounds_gate`
9. `manifold_response_model_gate`
10. `observable_bridge_gate`
11. `sensitivity_and_negative_controls`
12. `cold_start_reproduction`
13. `paper_evidence_ledger_update`

This order prevents residual-fitting from becoming evidence for the mechanism
that was tuned to it. Stages may use internal parallelism, but a dependent
stage cannot acquire authority before its prerequisites close.

### 7.1 Cross-runtime authority order

The thirteen stages above govern the base study runner. The repository also
contains five maintained campaign runtimes. Their paper-level authority order
is:

1. **Base diagnostic scaffold** — freezes the separated observables, runs the
   ideal Casimir reference and synthetic DP smoke calculation, and emits the
   first blocked-gate receipt.
2. **Experiment-design screen** — compares candidate platforms using explicit
   design assumptions. It ranks engineering questions; it does not select the
   final apparatus or validate a mechanism.
3. **Stage-1 gated computations** — exercises the reduced-order Lifshitz,
   switching/decoherence, rigid-sphere DP convergence, rate-accessibility, and
   manifold-registration gates.
4. **Data-readiness campaign** — validates artifact hashes, Kramers–Kronig
   numerics, acquisition-sidecar structure, covariance, blinding, and
   secondary-channel power without admitting synthetic fixtures as measured
   evidence.
5. **Proposal closure** — freezes the transverse-branch sample-and-hold
   apparatus, preregistration contracts, commissioning ladder, model lanes,
   and decision table.
6. **Document synchronization** — regenerates equation actions, validates the
   theory-badge graph and paper actions, and then updates this ledger.

This is an **authority dependency rail**, not an assertion that every CLI
directly consumes the previous CLI's output file. Later campaigns may supersede
earlier design assumptions only by saying so explicitly. In particular, the
proposal-closure architecture supersedes the experiment screen's earlier
symmetric-normal-force candidate; the earlier row remains evidence of the
screening path and force-cancellation problem, not the current proposal.

## 8. Runnable diagnostic scaffold

Run the deterministic scaffold from the repository root:

```text
npx tsx scripts/research/run-casimir-dp-quantum-foam-study.ts --config configs/research/casimir-dp-quantum-foam-study.v1.json
```

Run the role-separated experiment-design campaign with:

```text
npx tsx scripts/research/run-casimir-dp-experiment-design.ts --config configs/research/casimir-dp-experiment-design.v1.json --report-doc docs/research/casimir-dp-experiment-design-report.md
```

Run the Stage-1 gated computations with:

```text
npx tsx scripts/research/run-casimir-dp-next-computations.ts --config configs/research/casimir-dp-next-computations.v1.json --report-doc docs/research/casimir-dp-next-computations-report.md
```

Run the data-readiness and blinded-discriminator campaign with:

```text
npx tsx scripts/research/run-casimir-dp-data-readiness.ts
```

Run the proposal-closure audit with:

```text
npx tsx scripts/research/run-casimir-dp-proposal-closure.ts
```

### 8.1 Runtime-to-artifact contract

| Runtime | Frozen input and SHA-256 | Outputs / sidecars | Current receipt or maintained evidence | Claim ceiling |
|---|---|---|---|---|
| Base diagnostic scaffold | `casimir-dp-quantum-foam-study.v1.json`; `56ab76ca85f4ef4da7ce1ac9da3e87d2eb4e898b02cbc09aca0ad301e0a3f2d2` | `casimir-reference-baseline.json`, `dp-collapse-diagnostic.json`, `study-run-receipt.json` in a timestamped run directory | receipt schema `casimir_dp_quantum_foam_study_receipt/1`; hashes both outputs and preserves every open gate | diagnostic smoke result only |
| Experiment-design screen | `casimir-dp-experiment-design.v1.json`; `bd5528824d70de65e8b181dc18a78c3a287b2fd9c2cdd66bb5a9a79a3c97fe84` | timestamped JSON/Markdown reports and `experiment-design-receipt.json`; maintained design report | `casimir_dp_experiment_design_receipt/1`; input and both output hashes | engineering screen only; frozen proposal supersedes its symmetric-force candidate |
| Stage-1 gated computations | `casimir-dp-next-computations.v1.json`; `9f19359ee6ab02930e1cba25045183ad8931fc3f62e88e1363028f8852fea420` | timestamped JSON/Markdown reports and `gated-computations-receipt.json`; maintained computations report | `casimir_dp_next_computations_receipt/1`; input and both output hashes | reduced-order diagnostic numerics only |
| Data readiness | `casimir-dp-data-readiness.v1.json`; `a95e7a22c20e29ed9c34f45ece90916748a9264a32be8315663819171b406475` | maintained data-readiness report plus authenticated optical, switching, and decoherence fixture checks | receipt `9e0f1e8aa01f8ff3e7faf0c070853e0cd4887a191115c51804fa5c71a7c2be5d` | synthetic-pipeline readiness; measured-evidence gate remains closed |
| Proposal closure | `casimir-dp-proposal-closure.v1.json`; `7b3b2673c95d4eebca060261385f3b0659365c1112c1d9d42bc1d8700686b8ba` | maintained closure report and experiment proposal | receipt `aae5cf37e01df022509bc9f997287719eafd5670c6156fdd626d24ce94dbb4c0` | proposal completeness only; commissioning conditional |
| Paper / workstation synchronization | paper plus `.equation-actions.source.json`; theory-badge module | generated `.equation-actions.json`, document-action tests, badge-graph tests | 20 equation markers = 20 source entries = 20 generated entries; 11 study badges and 28 edges | navigation and provenance only |

The input hashes identify the exact frozen configuration bytes in this
checkout. Timestamped receipts identify a particular execution. A maintained
Markdown report is a readable projection of its runtime result, not a
replacement for the hashed JSON/receipt family when a particular run is being
cited.

For a disposable verification run, supply `--out <directory>`. The runner
writes:

- `casimir-reference-baseline.json`;
- `dp-collapse-diagnostic.json`;
- `study-run-receipt.json`.

The receipt hashes the two outputs and preserves the blocked/not-ready gates.
Its `status=completed` means the code path completed; it does not mean the
scientific hypothesis passed.

The supplied config uses synthetic Gaussian DP branches solely to exercise the
existing solver. Those values must never enter a results or abstract claim as
apparatus measurements.

## 9. Runtime plan

| Stage | Class | Target | Current authority |
|---|---|---:|---|
| Ideal Casimir formulas | instant scalar | <1 s | reference |
| DP synthetic smoke case | small diagnostic | <30 s | diagnostic |
| Material/geometry model | small or sweep | config-dependent | not ready without receipts |
| Boundary-conditioned coherence fit | experiment/runtime | dataset-dependent | protocol only |
| Standard decoherence budget | analysis campaign | dataset-dependent | not ready |
| Semiclassical/stochastic metric response | field solve | model-dependent | Stage 0 / unregistered |
| Gap/material/temperature sweeps | sweep | request-manifest bounded | planned |
| Quantum-foam response | unregistered | none | blocked |
| Experimental-bound comparison | review/runtime | dataset-dependent | review |
| Cold-start reproduction | small/sweep | same campaign class | planned |
| Data-readiness artifact validation | small diagnostic | <30 s for registered fixtures | structural pipeline pass; measured evidence not ready |
| Proposal-closure audit | small diagnostic | <30 s | proposal package pass; commissioning conditional |
| Equation-sidecar synchronization | small document build | <30 s | 18/18/18 marker/source/generated parity |

Long sweeps must use a request manifest, bounded output directory, timeout,
freshness hashes, and explicit cancellation/failure state. A `latest` alias is
not independent evidence.

## 10. Required campaign matrix

Before any result is promoted, the campaign should include:

- gap, temperature, geometry, material, roughness, and patch-potential sweeps;
- boundary-setting coherence runs with the material branch distribution fixed;
- electromagnetic, thermal, gas-collision, vibrational, material-loss,
  radiation-pressure, readout-backaction, and active-modulation noise budgets;
- matched-force, matched-heating, cavity-detuned, identical-boundary, and
  boundary-label-shuffle controls;
- solver grid, cutoff `ell_m`, and downsampling convergence for DP;
- identical-branch, zero-mass-difference, shuffled-label, and injected-signal
  negative/positive controls;
- blinded residual analysis where practical;
- comparison against the 2021 Gran Sasso and 2026 XENONnT DP constraints;
- cold-start reproduction with output hashes;
- explicit contradiction ledger when summary and detailed artifacts disagree.

## 11. Results ledger

No physical result is claimed yet. This ledger records maintained campaigns or
runnable receipt families; `<timestamp>` denotes a per-execution identifier,
not a single maintained measurement run.

| Run id | Revision | Input hash | Stage | Status | Key result | Uncertainty | Artifact | Claim effect |
|---|---|---|---|---|---|---|---|---|
| `diagnostic-smoke-v1-<timestamp>` | local diagnostic | `56ab76ca85f4ef4da7ce1ac9da3e87d2eb4e898b02cbc09aca0ad301e0a3f2d2` | protocol scaffold | completed / downstream gates not ready or blocked | ideal Casimir reference plus synthetic DP solver smoke path | synthetic branches; material, metrology, and bridge absent | timestamped `study-run-receipt.json` and two hashed outputs | confirms runnable separation only |
| boundary-coherence-platform-screen-v1 | local diagnostic | `bd5528824d70de65e8b181dc18a78c3a287b2fd9c2cdd66bb5a9a79a3c97fe84` | experiment design | completed / promotion blocked | integrated proxy `Gamma_DP/Gamma_env=5.52e-8`; no candidate promoted | design assumptions dominate | maintained design report + hashed receipt | defines rate gap and next computations only |
| casimir-dp-gated-computations-stage1-v1 | local diagnostic | `9f19359ee6ab02930e1cba25045183ad8931fc3f62e88e1363028f8852fea420` | five gated computation lanes | completed / promotion blocked | Lifshitz ideal validation pass; exact-grid rigid-sphere DP coarse convergence pass; rate-only power not ready | material and sidecar receipts absent; manifold dynamics unregistered | gated-computations report + hashed receipt | advances numerical authority only; promotion remains blocked |
| casimir-dp-data-readiness-stage1-v1 | local diagnostic | `a95e7a22c20e29ed9c34f45ece90916748a9264a32be8315663819171b406475` | data and acquisition readiness | completed / measured gates not ready | Kramers–Kronig analytic error `7.0692e-7`; synthetic sidecar integrity and covariance checks pass | no apparatus-matched optical or acquisition sidecar | data-readiness report; receipt `9e0f1e8aa01f8ff3e7faf0c070853e0cd4887a191115c51804fa5c71a7c2be5d` | validates the data path, not measured physics |
| casimir-dp-transverse-branch-pilot-v1 | local proposal closure | `7b3b2673c95d4eebca060261385f3b0659365c1112c1d9d42bc1d8700686b8ba` | proposal and preregistration closure | proposal package pass / commissioning conditional | frozen transverse architecture; nine machine contracts pass; five model roles separated | integrated hardware, finite-geometry contrast, and dynamics signatures remain absent | proposal, closure report; receipt `aae5cf37e01df022509bc9f997287719eafd5670c6156fdd626d24ce94dbb4c0` | authorizes commissioning planning only |

## 12. Claim boundaries

This paper does not claim:

- that the Casimir effect proves zero-point energy as a unique ontology;
- that quantum foam is the accepted explanation of the Casimir effect;
- that measured Casimir force equals DP gravitational self-energy;
- that a Casimir apparatus creates the mass-density superposition required by
  the DP model;
- that virtual particles are literal short-lived objects whose annihilation
  supplies the Penrose collapse clock;
- that `mc^2/h`, `\Delta E_G/h`, or dimensional agreement supplies a physical
  Casimir-cavity resonance without a registered transfer kernel;
- that a negative renormalized energy-density component uniquely determines
  negative spacetime curvature;
- that boundary-conditioned decoherence is objective collapse;
- that the existing nonrelativistic DP estimator accepts vacuum stress,
  pressure, or a noise kernel as a substitute for material `\Delta\rho`;
- that DP collapse has been observed;
- that this study validates NHM2, propulsion, negative-energy engineering,
  gravity control, or physical viability.

## 13. Source register

- H. B. G. Casimir, “On the Attraction Between Two Perfectly Conducting
  Plates” (1948), original ideal-plate calculation.
- E. M. Lifshitz, finite-temperature/material-response formulation of
  dispersion forces (1956), required conceptual basis for real materials.
- R. L. Jaffe, “Casimir effect and the quantum vacuum,” *Physical Review D* 72,
  021301(R) (2005), DOI `10.1103/PhysRevD.72.021301`, useful for separating a
  measurable force from a unique vacuum ontology.
- L. Diósi, “A universal master equation for the gravitational violation of
  quantum mechanics,” *Physics Letters A* 120, 377–381 (1987), DOI
  `10.1016/0375-9601(87)90681-5`.
- R. Penrose, “On Gravity's Role in Quantum State Reduction,” *General
  Relativity and Gravitation* 28, 581–600 (1996), DOI
  `10.1007/BF02105068`.
- P. Wolf et al., “Does an atom interferometer test the gravitational redshift
  at the Compton frequency?,” *Classical and Quantum Gravity* 28, 145017
  (2011), DOI `10.1088/0264-9381/28/14/145017`; operational context for why
  assigning `mc^2/h` does not, without a specified differential phase and
  readout model, create an experimentally accessible clock or cavity resonance.
  This study does not rely on the paper's broader redshift conclusion.
- B. L. Hu and E. Verdaguer, “Stochastic Gravity: Theory and Applications,”
  *Living Reviews in Relativity* 11, 3 (2008), DOI
  `10.12942/lrr-2008-3`; source for the separation between semiclassical mean
  stress, the stress-tensor noise kernel, and induced metric fluctuations, not
  for an objective-collapse claim.
- G. L. Klimchitskaya, U. Mohideen, and V. M. Mostepanenko, “The Casimir force
  between real materials: Experiment and theory,” *Reviews of Modern Physics*
  81, 1827 (2009), DOI `10.1103/RevModPhys.81.1827`; material, temperature,
  roughness, and metrology authority needed beyond the ideal reference rows.
- F. Tebbenjohanns et al., “Quantum control of a nanoparticle optically
  levitated in cryogenic free space,” *Nature* 595, 378–382 (2021), DOI
  `10.1038/s41586-021-03617-w`; platform evidence for cryogenic levitation and
  measured decoherence control, not for the campaign's assumed rates.
- B. Melo et al., “Vacuum levitation and motion control on chip,”
  *Nature Nanotechnology* 19, 1270–1276 (2024), DOI
  `10.1038/s41565-024-01677-3`; demonstrates high-vacuum on-chip trapping and
  electrical feedback, but not the proposed near-surface cryogenic
  superposition integration.
- G. Winstone et al., “Direct measurement of the electrostatic image force of
  a levitated charged nanoparticle close to a surface,” *Physical Review A* 98,
  053831 (2018), DOI `10.1103/PhysRevA.98.053831`; supplies the silica/silicon
  retarded Casimir-Polder reference and direct evidence that surface
  electrostatics and trap anharmonicity are leading approach risks.
- G. P. Seta et al., “Shot-to-Shot Displacement Noise in State-Expansion
  Protocols with Inverted Potentials,” *Physical Review Letters* 136, 123602
  (2026), DOI `10.1103/y1q9-pnlc`; identifies stray electric fields and
  mechanical instability as state-expansion noise sources.
- P. Rodriguez-Lopez et al., “Casimir force phase transitions in the graphene
  family,” *Nature Communications* 8, 14699 (2017), DOI
  `10.1038/ncomms14699`; theoretical evidence for externally tunable 2D-material
  Casimir interactions, not a receipt for the proposed device.
- F. Chen et al., “Control of the Casimir force by the modification of
  dielectric properties with light,” *Physical Review B* 76, 035338 (2007),
  DOI `10.1103/PhysRevB.76.035338`; experimental precedent for optical
  modulation and a warning that pump-induced heat and carriers require
  explicit sidecars.
- S. Pedalino et al., “Probing quantum mechanics with nanoparticle matter-wave
  interferometry,” *Nature* 649, 866–870 (2026), DOI
  `10.1038/s41586-025-09917-9`; observed interference above 170 kDa supplies
  the spatial-superposition benchmark, not a Casimir-coupled apparatus.
- C. Martí Farràs et al., “Numerical evaluation of Casimir forces using the
  discontinuous Galerkin time-domain method,” arXiv:2603.03888 (2026); a current
  finite-temperature Maxwell-stress/finite-geometry method target. It is not
  represented by the present planar solver or PFA row.
- S. Kryhin and V. Sudhir, “Distinguishable Consequence of Classical Gravity on
  Quantum Matter,” *Physical Review Letters* 134, 061501 (2025), DOI
  `10.1103/PhysRevLett.134.061501`; motivates phase and cross-correlation
  observables that can distinguish dynamics from naive decoherence, without
  supplying a Casimir-to-DP bridge.
- S. Donadi et al., “Underground test of gravity-related wave function
  collapse,” *Nature Physics* 17, 74–78 (2021), DOI
  `10.1038/s41567-020-1008-4`.
- E. Aprile et al. (XENON Collaboration), “Challenging Spontaneous Quantum
  Collapse with the XENONnT Dark Matter Detector,” *Physical Review Letters*
  136, 120201 (2026), DOI `10.1103/2jm3-4976`.
- M. H. J. de Jong et al., “Measurement of a strong nonlinear force between
  superconductors compatible with the Casimir force,” *Nature Communications*
  (2026), DOI `10.1038/s41467-026-75261-9`; included as current experimental
  context, with the authors' “compatible with” qualification preserved.

## 14. Repository evidence map

- `docs/research/casimir-dp-quantum-foam-study.equation-actions.source.json`
- `docs/research/casimir-dp-quantum-foam-study.equation-actions.json`
- `shared/theory/casimir-dp-study-theory-badges.ts`
- `shared/theory/__tests__/casimir-dp-study-theory-badges.spec.ts`
- `client/src/lib/docs/__tests__/docEquationActions.spec.ts`
- `shared/theory/casimir-cavity-theory-badges.ts`
- `shared/theory/curvature-collapse-theory-badges.ts`
- `shared/dp-collapse.ts`
- `docs/DP_COLLAPSE_DERIVATION.md`
- `docs/knowledge/physics/casimir-force-energy.md`
- `docs/knowledge/physics/diosi-penrose-timescale.md`
- `docs/research/study-full-solve-template.md`
- `configs/research/casimir-dp-quantum-foam-study.v1.json`
- `scripts/research/run-casimir-dp-quantum-foam-study.ts`
- `shared/contracts/casimir-dp-experiment-design.v1.ts`
- `configs/research/casimir-dp-experiment-design.v1.json`
- `scripts/research/run-casimir-dp-experiment-design.ts`
- `docs/research/casimir-dp-experiment-design-report.md`
- `shared/casimir-lifshitz.ts`
- `shared/casimir-dp-inference.ts`
- `shared/contracts/casimir-dp-next-computations.v1.ts`
- `configs/research/casimir-dp-next-computations.v1.json`
- `scripts/research/run-casimir-dp-next-computations.ts`
- `docs/research/casimir-dp-next-computations-report.md`
- `shared/casimir-optical-response.ts`
- `shared/casimir-dp-data-readiness.ts`
- `shared/contracts/casimir-dp-data-readiness.v1.ts`
- `configs/research/casimir-dp-data-readiness.v1.json`
- `scripts/research/run-casimir-dp-data-readiness.ts`
- `docs/research/casimir-dp-data-readiness-report.md`
- `shared/casimir-dp-proposal-readiness.ts`
- `shared/contracts/casimir-dp-proposal-closure.v1.ts`
- `configs/research/casimir-dp-proposal-closure.v1.json`
- `scripts/research/run-casimir-dp-proposal-closure.ts`
- `docs/research/casimir-dp-experiment-proposal.md`
- `docs/research/casimir-dp-proposal-closure-report.md`
- `tests/casimir-dp-proposal-closure.spec.ts`

## Appendix A. Equation-to-artifact and equation-to-claim map

The equation-action source is hand-maintained; the generated sidecar binds the
exact equation text and section anchor from this paper. `calculator_ingest`
means scalar replay is permitted. `artifact_backed_theory_run` means the
workstation must open the named evidence/badge path rather than pretend that a
scalar calculator can reconstruct the required field, dataset, or provenance.

| Equation id | Workstation action | Runtime / evidence anchor | Maximum claim |
|---|---|---|---|
| `cdp-casimir-energy-per-area` | calculator ingest | base scaffold; `casimir.cavity.parallel_plate_energy_density` | ideal perfect-conductor reference only |
| `cdp-casimir-pressure` | calculator ingest | base scaffold; `casimir.cavity.parallel_plate_pressure` | ideal pressure reference only |
| `cdp-casimir-force-residual` | artifact-backed path | Lifshitz/material receipt, beyond-PFA gate, observable-separation badge | observed-minus-standard force residual; no DP identification |
| `cdp-dp-self-energy` | artifact-backed path | `shared/dp-collapse.ts`; mass-density branch and DP self-energy badges | branch-provenance-bounded DP diagnostic only |
| `cdp-dp-timescale` | calculator ingest | DP self-energy payload and `tau=hbar/Delta E_G` calculator path | rate/timescale replay only |
| `cdp-compton-dp-frequency-identities` | artifact-backed path | Compton/DP/cavity frequency-separation badge and DP timescale badge | unit-safe frequency bookkeeping; no oscillator or resonance claim |
| `cdp-frequency-cavity-bridge-gate` | artifact-backed path | Compton/DP/cavity frequency-separation, manifold-response, and claim-boundary badges | blocks frequency-to-cavity inference while the transfer kernel is absent |
| `cdp-dp-boundary-null` | artifact-backed path | fixed-branch DP null and manifold-response hypothesis badge | conditional baseline null, not a Casimir-to-DP bridge |
| `cdp-semiclassical-curvature-baseline` | artifact-backed path | manifold-response, decoherence gate, and claim-boundary badges | formal semiclassical baseline only |
| `cdp-boundary-stress-difference` | artifact-backed path | measured Lifshitz/material receipt plus observable-separation gate | candidate QFT input; not curvature or collapse by itself |
| `cdp-coherence-rate-residual` | artifact-backed path | data-readiness and decoherence-collapse gates | boundary-conditioned residual only |
| `cdp-manifold-response-slot` | artifact-backed path | manifold-response hypothesis and both bridge/identifiability gates | noncomputable placeholder while causal dynamics are missing |
| `cdp-quantum-foam-response-slot` | artifact-backed path | quantum-foam hypothesis, observable gate, claim boundary | unregistered hypothesis family only |
| `cdp-stage1-lifshitz-free-energy` | artifact-backed path | Stage-1 computations report and material receipt badge | reduced-order equilibrium planar diagnostic |
| `cdp-accessible-rate-ratio` | artifact-backed path | experiment-design report and decoherence gate | engineering/rate-gap screening only |
| `cdp-data-readiness-kramers-kronig` | artifact-backed path | optical-response module and data-readiness report | numerical-transform validation; no measured material response |
| `cdp-data-readiness-correlation-power` | artifact-backed path | data-readiness preregistration and covariance sidecars | nuisance/discriminator-channel sizing only |
| `cdp-proposal-phase-force-bound` | artifact-backed path | proposal-closure report and proposal badge | high-risk commissioning requirement only |
| `cdp-observable-separation-gate` | artifact-backed path | protocol, observable-separation, and claim-boundary badges | blocks any Casimir-residual-to-DP promotion |
| `cdp-decoherence-collapse-gate` | artifact-backed path | decoherence, manifold-response, and claim-boundary badges | blocks objective-collapse identification |

Sidecar parity is exact for this revision: 20 paper markers, 20 source entries,
and 20 generated entries. The graph layer exposes 11 study badges connected by
28 dependency, requirement, documentation, and blocking edges. Those counts
are navigation-integrity evidence; they are not physical evidence.

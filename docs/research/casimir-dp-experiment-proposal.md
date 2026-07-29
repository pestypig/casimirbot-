# Proposal: boundary-conditioned coherence near a tunable quantum-electrodynamic surface

## Project status

**Proposal id:** `casimir-dp-transverse-branch-pilot-v1`  
**Study:** `casimir-dp-quantum-foam-study`  
**Claim tier:** diagnostic protocol  
**Proposal package:** pass  
**Commissioning entry:** conditional pass  
**Apparatus-DP sensitivity forecast:** one bounded Stage-4.2C synthetic region passes design gates; physical pilot inputs absent; no DP exclusion<br>
**Measured evidence:** not ready  
**Collapse identification:** blocked pending a source-backed dynamics signature  
**Manifold dynamics:** blocked pending a complete causal model  
**Frozen config:** `configs/research/casimir-dp-proposal-closure.v1.json`  
**Runnable closure report:** `docs/research/casimir-dp-proposal-closure-report.md`
**OR/phase Stage-2 report:** `docs/research/casimir-dp-or-phase-stage2-report.md`
**Stage-3 evidence-map report:** `docs/research/casimir-dp-evidence-map-stage3-report.md`
**Stage-4 polarization/congruence report:** `docs/research/casimir-dp-polarization-congruence-stage4-report.md`
**Stage-4 verification receipt:** `docs/research/casimir-dp-polarization-congruence-stage4-verification-receipt.json`
**Stage-4.1 QED scale-hierarchy report:** `docs/research/casimir-dp-qed-scale-hierarchy-stage4-1-report.md`
**Stage-4.1 verification receipt:** `docs/research/casimir-dp-qed-scale-hierarchy-stage4-1-verification-receipt.json`
**Stage-4.2A electron-mass/Higgs-anchor implementation and standing:** `docs/research/casimir-dp-electron-mass-higgs-anchor-stage4-2a-plan.md`
**Implemented Stage-4.2A runtime sources:** `shared/casimir-dp-electron-mass-higgs-anchor-stage4-2a.ts`; `shared/casimir-dp-planck-solar-calibration-stage4-2a.ts` (diagnostic campaign and downstream software verification pass; measured DP evidence not ready)
**Stage-4.2A verification receipt:** `docs/research/casimir-dp-electron-mass-higgs-anchor-stage4-2a-verification-receipt.json`
**Stage-4.2B implementation plan:** `docs/research/casimir-dp-apparatus-coherence-residual-stage4-2b-plan.md`
**Stage-4.2B config/runner:** `configs/research/casimir-dp-apparatus-coherence-residual-stage4-2b.v1.json`; `scripts/research/run-casimir-dp-apparatus-coherence-residual-stage4-2b.ts`
**Stage-4.2B maintained report:** `docs/research/casimir-dp-apparatus-coherence-residual-stage4-2b-report.md`
**Stage-4.2B verification receipt:** `docs/research/casimir-dp-apparatus-coherence-residual-stage4-2b-verification-receipt.json`
**Stage-4.2B authoritative synthetic run:** `artifacts/research/casimir-dp-apparatus-coherence-residual-stage4-2b/casimir-dp-apparatus-coherence-residual-stage4-2b-v1-20260726T123523358Z/` (downstream software verification pass)
**Stage-4.2C plan/report:** `docs/research/casimir-dp-identifiability-redesign-stage4-2c-plan.md`; `docs/research/casimir-dp-identifiability-redesign-stage4-2c-report.md`
**Stage-4.2C config/runner:** `configs/research/casimir-dp-identifiability-redesign-stage4-2c.v1.json`; `scripts/research/run-casimir-dp-identifiability-redesign-stage4-2c.ts`
**Stage-4.2C verification receipt:** `docs/research/casimir-dp-identifiability-redesign-stage4-2c-verification-receipt.json`
**Stage-4.2C authoritative synthetic run:** `artifacts/research/casimir-dp-identifiability-redesign-stage4-2c/casimir-dp-identifiability-redesign-stage4-2c-v1-20260728T042510781Z/` (bounded redesign forecast; downstream software verification pass; physical pilot not ready)
**Stage-4.2D cross-scale/metrology plan/report:** `docs/research/casimir-dp-cross-scale-metrology-stage4-2d-plan.md`; `docs/research/casimir-dp-cross-scale-metrology-stage4-2d-report.md`
**Stage-4.2D config/runner:** `configs/research/casimir-dp-cross-scale-metrology-stage4-2d.v1.json`; `scripts/research/run-casimir-dp-cross-scale-metrology-stage4-2d.ts`
**Stage-4.2D verification receipt:** `docs/research/casimir-dp-cross-scale-metrology-stage4-2d-verification-receipt.json`
**Stage-4.2D authoritative synthetic run:** `artifacts/research/casimir-dp-cross-scale-metrology-stage4-2d/casimir-dp-cross-scale-metrology-stage4-2d-v1-20260728T193200000Z/` (calibration/recovery diagnostics only; spectroscopic response and physical pilot not ready)

## Executive summary

This project will test whether a controlled change in the electromagnetic
boundary condition near a separately prepared material superposition produces
a repeatable residual in coherence decay or interferometric phase after
measured thermal, electromagnetic, mechanical, surface, gas, optical, and
readout couplings are accounted for within the frozen model and uncertainty
budget. The primary result will be either an upper bound,
an ordinary-coupling explanation, or a replicated unexplained residual. The
experiment will not identify Diósi-Penrose (DP) collapse, Penrose objective
reduction, quantum foam, or a spacetime-manifold mechanism unless a
source-backed model predicts a distinct preregistered joint signature and the
data discriminate that model from its competitors.

The frozen architecture uses a silica nanoparticle whose spatial branches are
separated transverse to the normal of one electrically tunable two-dimensional
boundary. The boundary state is randomized between shots, allowed to settle,
and held static during coherent evolution. This removes the earlier dependence
on implausibly exact cancellation of two large normal forces. A separate
cofabricated nanomechanical reference must first establish a repeatable
gate-dependent force contrast. Only then does the project advance through
classical particle transfer functions, a boundary-free coherence pilot, a
blinded 400-window boundary pilot, and a powered main run of at least 1,600
paired windows.

The implemented Stage-4.2B forecast now qualifies that last sentence. The
1,600-window count remains a planned acquisition envelope, but the present
physical signature matrix is `signature_not_identifiable`; required windows
and DP power are not estimable until numerical control-response vectors and
their block covariance are calibrated. This is a redesign/commissioning gate,
not a DP exclusion.

Stage 4.2C resolves the corresponding synthetic redesign question. It compiles
numerical design-assumption control responses and block covariance, transports
a frozen candidate catalogue through the unchanged registered DP law, and
finds one bounded silica candidate that clears the preregistered numerical
gates with 542 required paired windows. That does not close commissioning:
measured response, covariance, and state-preparation receipts are absent, so
physical pilot readiness remains `not_ready`.

Stage 4.2D closes the remaining equation-language audit without promoting an
analogy into a mechanism. Stark, Zeeman, circular-polarization, and blackbody
dynamic-Stark relations define candidate electric, magnetic, polarization,
and thermal field witnesses. Schwarzschild compactness, material-yield
crossover, and Jeans instability recover conventional gravity in their own
domains. Penrose spinors remain a representation of fields and curvature, not
mass variables or collapse generators. These lanes can qualify calibration
and dimensional consistency, but they add no transfer edge into the frozen
DP rate.

## Scientific premise

Casimir and Casimir-Polder interactions are established consequences of
quantum electrodynamics and material response. Tunable graphene-family
boundary calculations predict strong dependence on conductivity, dissipation,
temperature, and externally controlled electronic phase, but the cited
graphene-family work is a theoretical materials proposal rather than a
demonstration of this experiment's boundary contrast
([Rodriguez-Lopez et al. 2017](https://doi.org/10.1038/ncomms14699)).

Relevant levitation capabilities have been demonstrated separately:

- cryogenic free-space nanoparticle motion has been feedback cooled into the
  quantum regime, with measurement backaction retained as a leading
  decoherence process
  ([Tebbenjohanns et al. 2021](https://doi.org/10.1038/s41586-021-03617-w));
- on-chip optical-electrical trapping, readout, and cold damping have been
  demonstrated in high vacuum, but with the particle about 203 micrometres
  above the chip, not in the proposed near-surface cryogenic superposition
  regime ([Melo et al. 2024](https://doi.org/10.1038/s41565-024-01677-3));
- levitated-particle surface-force measurements at 4-11 micrometres found that
  electrostatic image forces and surface-induced anharmonicity become dominant,
  with trap loss limiting closer approach
  ([Winstone et al. 2018](https://doi.org/10.1103/PhysRevA.98.053831));
- state-expansion experiments identify electric stray fields and mechanical
  instability as important sources of shot-to-shot displacement noise
  ([Seta et al. 2026](https://doi.org/10.1103/y1q9-pnlc)).

Together these results support a staged proposal, not an assertion that the
integrated apparatus already exists.

### OR motivation and the differential boundary test

This proposal is motivated by Penrose objective reduction (OR), but it is not
currently a direct differential test of the standard Penrose estimate. Penrose
uses a branch-relative gravitational self-energy scale `E_G` and the
order-of-magnitude relation `tau_OR~hbar/E_G`. The repository implements a
Plummer-regularized weak-field counterpart from explicit material
mass-density branches. At fixed branches, grid, and regularization, that
registered estimator predicts no change when only the boundary label changes.

The differential experiment therefore first tests ordinary boundary coupling
and, separately, a possible future boundary-conditioned extension. It must not
be described as a predicted modulation of the standard OR clock. An ambient
gravitational field can create a large ordinary matter-wave phase when the two
paths sample different potentials, but the shared field magnitude is not the
DP self-energy. Similarly, classical gravitational-wave observations motivate
precision phase instrumentation but do not establish quantum superposed
geometries or objective reduction.

Orch OR is outside the proposal scope. This apparatus has no microtubule,
neuronal, anesthetic, or consciousness observable and cannot validate or
falsify Orch OR as a complete biological theory.

## Central question and estimands

The central experimental question is:

> After conditioning on all registered transfer functions and negative
> controls, does the randomized boundary state leave a reproducible residual in
> the separately prepared particle's coherence decay or phase?

The primary estimand is the boundary-state coefficient in the coherence-decay
rate,

\[
\Delta\Gamma_{res}=\Gamma_{obs,B}-\Gamma_{obs,A}
-\Delta\Gamma_{thermal}-\Delta\Gamma_{EM}-\Delta\Gamma_{mech}
-\Delta\Gamma_{surface}-\Delta\Gamma_{gas}-\Delta\Gamma_{opt/readout}.
\]

This seven-term form is the expanded version of the paper and Theory Badge
four-bucket residual: `EM` aggregates electromagnetic, electrostatic, patch,
and surface terms; `thermal` aggregates thermal, blackbody, and residual-gas
terms; `mech` is unchanged; and `readout` includes optical readout and
backaction. The frozen analysis must retain the expanded terms and their
covariance even when a summary displays the four aggregate buckets.

Secondary estimands are the interferometric phase, independently calibrated
boundary-force contrast, coupled heat, and switching cross-correlation. The
boundary coefficient is not called a collapse rate unless a registered model
supplies the required observable map.

The phase/visibility readout is

\[
P_\pm(b,t)=\frac12\left[
1\pm V_b(t)\cos\!\left(\Delta\phi_b+\chi\right)\right],
\qquad
\Delta\phi_b=-\frac1\hbar\int
\left[U_{b,A}(t)-U_{b,B}(t)\right]dt .
\]

The confirmatory phase residual is

\[
\Delta\phi_{res}
=\Delta_b\phi_{obs}
-\Delta\phi_{QED}
-\Delta\phi_{electric}
-\Delta\phi_{thermal}
-\Delta\phi_{mechanical}
-\Delta\phi_{readout}
-\Delta\phi_{gravity}.
\]

A static boundary has a controlled state, not a phase with which the material
superposition becomes "in phase." Four analysis phases reconstruct the
quadratures, phase, and visibility. A phase shift and visibility decay are
reported separately; neither is identified with collapse from readout alone.

## Frozen apparatus architecture

| Element | Frozen proposal value |
|---|---|
| Particle | silica sphere, nominal radius 75 nm |
| Nominal mass | `3.8877e-18 kg` from spherical density model |
| Boundary | electrically tunable 2D material on a characterized substrate |
| Nominal particle-surface distance | 5 micrometres |
| Commissioning range | 10 to 4 micrometres; no closer approach without a new gate review |
| Superposition separation | 20 nm |
| Branch orientation | transverse to the surface normal |
| Coherent evolution | 0.1 s |
| Target environment | 4 K cryogenic vacuum |
| Boundary operation | randomized sample-and-hold between shots |
| Minimum settling time | 10 s |
| Force reference | independent cofabricated nanomechanical calibrator |
| Main acquisition | at least 1,600 paired windows |

The normal Casimir-Polder interaction is common-mode to first order because the
branches share the same surface distance. Lateral surface inhomogeneity,
cross-axis trap coupling, charge, and state-dependent motion can still produce
phase or decoherence and are measured rather than assumed absent.

The same transverse geometry must be demonstrated relative to local gravity.
For the nominal mass, separation, and observation time, a fully vertical branch
separation would accumulate approximately `7.23e8 rad` of ordinary
gravitational phase. Limiting a boundary-correlated contribution to `0.1 rad`
requires about `2.77e-18 m` vertical-projection stability, equivalent in the
small-angle limit to `1.38e-10 rad` of correlated tilt. Absolute common-mode
phase may cancel, but boundary-correlated orientation, vibration, or
state-expansion displacement must be measured with independent phase-reference
and acceleration sidecars. The existing general alignment target does not by
itself close this control.

Using the literature silica/silicon retarded reference at 5 micrometres gives
approximately

\[
C_4=3.2062\times10^{-49}\ \mathrm{J\,m^4},\qquad
U_{CP}=-5.1300\times10^{-28}\ \mathrm J,\qquad
F_{CP}=-4.1040\times10^{-22}\ \mathrm N.
\]

These values are scale references. They do not predict the gate-dependent
contrast of the proposed 2D boundary, which remains measurement- and
finite-geometry-gated.

## Machine-readable preregistration contracts

The proposal config promotes every named control to a first-class validated
object rather than leaving it only in prose.

| Contract | Frozen rule |
|---|---|
| Signal | paired boundary-on minus boundary-off coherence-decay residual; 0.1 s window; paired-block mixed-effects estimator; preprocessing frozen before unblinding |
| Finite geometry and materials | scattering or boundary-element calculation over 4, 5, 7.5, and 10 micrometres; proximity-force and retarded Casimir-Polder cross-checks; measured optical, cryogenic, thickness, topography, patch, contamination, and distance-zero receipts |
| Calibration | charge, distance, force, phase, and temperature calibration before and after each acquisition block with hashed, traceable sidecars |
| Synchronization | one disciplined clock, hardware trigger fanout with loopback, raw trigger edges, eight timestamped channels, and no more than 100 microseconds skew |
| Blinding | balanced permuted paired blocks; independent seed/key custodian; operators and analysts blinded; seven freeze hashes; label predictability no greater than 0.55 |
| Covariance | block-cluster-robust primary covariance; pilot-fitted prewhitened shrinkage nuisance covariance; ten mandatory channels; positive-semidefinite and conditioning checks; no primary imputation |
| Statistical decision | frequentist confirmatory model, two-sided `beta_boundary=0` test, Holm familywise correction over four comparisons, no sequential peeking, 90% power, 1,600-pair minimum, and binding to the five-outcome decision table |

Cross-field invariants force the signal window, clock tolerance, blinding key
custody, label-leakage limit, sample counts, alpha, and power to agree with the
frozen apparatus and acquisition manifest. Any mismatch makes the proposal gate
fail before data acquisition.

## Specific aims

### Aim 1: establish the tunable boundary as a calibrated physical actuator

Measure both boundary states using temperature-dependent optical response,
surface topography, patch-potential mapping, geometry metrology, gate leakage,
and dissipation. Convert the measured loss response to the imaginary axis with
the validated Kramers-Kronig pipeline. Use the independent reference resonator
to measure force-distance curves in both states.

Go criteria:

- raw artifacts, calibrations, and covariance pass integrity checks;
- the boundary contrast is detected at five standard deviations or better;
- sham electrical switching is null;
- distance scaling is reproduced;
- the finite-geometry/material model residual is at most 5% over the registered
  analysis range.

Failure to meet these criteria ends the coherence-coupling phase. A null
boundary contrast is still a valid instrument result.

### Aim 2: commission the particle and every boundary-to-sensor transfer path

Operate the particle first at 10 micrometres and approach in registered steps
to 4 micrometres. At each distance, record charge, trap loss, force gradient,
temperature, vibration, optical power, electromagnetic pickup, pressure,
position, and out-of-loop motion. Switching occurs outside coherent evolution
and is followed by at least 10 s settling.

Go criteria include zero measured net elementary charge, stable trapping,
complete transfer-matrix rank, clock skew below 100 microseconds, matched-heat
nulls, and successful electrical, mechanical, thermal, and optical injection
recoveries. No closer approach is permitted merely because the nominal
Casimir-Polder signal grows.

### Aim 3: demonstrate the transverse coherence protocol without boundary labels

Prepare a 20 nm transverse branch separation and demonstrate 0.1 s evolution
with a frozen branch-provenance receipt. Quantify visibility, phase, ordinary
decoherence, state-expansion displacement, and covariance without using the
boundary label in the fit.

The phase-noise target of 0.1 rad corresponds to differential-force noise below
`5.2729e-27 N`. For one elementary charge, that force is equivalent to only
`3.2911e-8 V/m`. This calculation makes charge neutrality, shielding, field
reversal, and direct nuisance measurement hard gates rather than descriptive
best practices.

The pilot must also acquire a boundary-correlated branch-orientation time
series, local acceleration/vibration transfer function, vertical
state-expansion calibration, and paired phase-reference drift sidecar. The
target is not merely a small average tilt: the on-minus-off vertical projection
must be bounded at the Stage-2 phase-equivalent level. This is an ordinary
gravity-phase requirement, not an OR prediction.

### Aim 4: conduct the blinded boundary pilot and powered main run

The independent custodian randomizes boundary labels. A 400-paired-window pilot
tests hashes, synchronization, covariance, exclusions, label leakage, and all
negative controls. It is not powered for the registered smallest correlation.
The main run uses at least 1,600 paired windows, exceeding the current
four-comparison Fisher-z requirement of 1,422 windows for an alternative
correlation of 0.10 at familywise alpha 0.05 and 90% power.

Unblinding occurs only after raw hashes, calibration certificates, clock audit,
exclusion mask, covariance model, frozen code hash, and negative-control gates
pass.

## Systematics and negative controls

The machine-readable protocol registers twelve mandatory families:

1. particle charge and stray electric field;
2. surface patch potential;
3. gate leakage and electromagnetic pickup;
4. switching heat;
5. vibration and acoustic coupling;
6. optical recoil and readout backaction;
7. trap alignment and state-expansion noise;
8. gas collisions;
9. blackbody exchange;
10. Casimir-Polder force and surface gradient;
11. lateral surface inhomogeneity;
12. analysis drift and label leakage.

Each family has a sensor, calibration injection, negative control, numerical
threshold, unit, and evidence status in the frozen config. A complete list is
rendered in `docs/research/casimir-dp-proposal-closure-report.md`.

## Statistical model

The confirmatory primary model is frozen as

\[
\Gamma_{bi}=\mu+\beta_B B_{bi}+\beta_O O_{bi}+\beta_z z_{bi}
+\boldsymbol{\beta}_x^{\mathsf T}\mathbf{x}_{bi}+u_b+\epsilon_{bi},
\]

where `beta_B` is the boundary-on minus boundary-off decay-rate contrast,
`O` is registered within-pair order, `z` is distance, `x` contains registered
nuisance channels, and `u_b` is the random block intercept. This is a
frequentist confirmatory analysis with no priors. The primary covariance is a
block-cluster-robust sandwich estimator. The 400-pair blinded pilot estimates
the prewhitening/shrinkage nuisance covariance, which is then frozen before the
main run. The primary analysis performs no imputation, does not peek
sequentially, uses a two-sided null of `beta_B=0`, and applies Holm familywise
correction across four registered comparisons at alpha 0.05.

Required robustness analyses include:

- label permutation preserving block structure;
- boundary-order reversal;
- branch-orientation reversal;
- distance and surface-sector replication;
- leave-one-systematic-family-out sensitivity;
- sham switching and matched heating;
- time-reversal and drift-spline alternatives fixed before unblinding;
- cold-start reproduction from raw artifacts.

The rate-only DP estimate is not used to power the experiment because the
corrected centered-grid Stage-1 design estimate requires approximately
`1.60e15` shots per boundary
setting and cannot identify collapse. The powered cross-correlation lane is a
systematics and dynamics discriminator, not a collapse detector.

## Model comparison and interpretation

Five model roles remain separate:

- ordinary open-system decoherence;
- standard Casimir-Polder/open-system response;
- rigid-sphere DP rate-only diagnostic;
- source-backed collapse dynamics, currently missing;
- boundary-conditioned manifold dynamics, currently missing.

For interpretation, these five roles reduce to three non-competing
plausibility lanes: the computable QED/open-system baseline, the diagnostic
OR/DP branch-instability model, and the blocked boundary-conditioned spacetime
extension. No numerical plausibility score is assigned. The third lane remains
blocked until a source-backed renormalized stress/noise prescription, causal
metric-response kernel, gauge contract, metric-to-coherence dynamics,
consistency/recovery proof, parameter manifest, and falsifiers are registered.
The repository's generic ability to convert signed scalar stress or energy
density into a DP input is not accepted as that bridge; it omits the required
tensor dynamics and observable transfer.

The registered outcomes are:

- **integrity failure:** no physical conclusion;
- **null-consistent:** apparatus-specific upper bounds;
- **environment-explained residual:** quantified ordinary coupling;
- **unexplained residual:** replication and expanded systematics required;
- **model-discriminating residual:** evidence may favor only a model that was
  quantitatively registered before unblinding and independently replicated.

An unexplained residual is not evidence of DP collapse, Penrose reduction,
quantum foam, or manifold manipulation.

### Stage-3 evidence map and confirmatory model hierarchy

The proposal's computational evidence layer is the
`casimir-dp-evidence-map-stage3-v1` campaign. It consumes the immutable
Stage-2 authority and compares nested models rather than treating the
scientific lanes as mutually exclusive:

\[
M_0=M_{\rm QED\ phase}+M_{\rm technical\ dephasing}
  +M_{\rm environmental\ decoherence}+M_{\rm ordinary\ GR},
\]

followed by a named \(M_0+M_{\rm DP,<variant>}\), and only after a successful
manifold-kernel preflight, \(M_0+M_{\rm bridge,<id>}\). Penrose's
\(\tau\sim\hbar/E_G\) prescription remains a lifetime envelope unless a
generative master equation and observation likelihood are registered.

Before unblinding, the Stage-3 config freezes model code and hashes, proper
priors, nuisance ranges and covariance, quantitative signature vectors,
decision thresholds, effect-size and power regions, identifiability rank and
correlation limits, confirmatory cells, and falsifiers. The custodian mapping
is not stored in the repository, and the runtime cannot unblind automatically.
Pilot cells may train nuisance structure; held-out cells may not be reused for
training or phase correction.

The fixed-\(\delta\rho\) boundary comparison requires measured wavepacket and
trajectory receipts demonstrating that the material branch-density
difference remains matched across boundary states. A boundary-induced change
in force, trap, trajectory, strain, temperature, polarization, or charge is an
ordinary confound, not evidence of a modified OR/DP rate.

The six scientific runtimes retain complex coherence and reversibility;
measurement-constrained QED mean/noise closure; one named regularized DP
coherence-plus-companion signature; a signed complete-apparatus gravitational
upper bound; blinded held-out joint comparison; and a fail-closed
manifold-kernel registry. Registry preflight occurs before a bridge can enter
model freezing or comparison. A blocked registry is an acceptable result and
returns no numerical bridge phase or rate.

Model states are `disfavored`,
`not_disfavored_within_powered_region`, `not_identifiable`, `not_ready`, or
`blocked`. The neutral state is not confirmation. A null excludes only the
powered preregistered region. Positive support for a named DP dynamics
requires a jointly predicted, applicable, powered companion observable and
independent replication. A reproducible boundary-dependent residual without a
registered bridge remains an unexplained anomaly.

Synthetic Stage-3 fixtures validate software recovery, limiting cases,
provenance, and fail-closed behavior only. Until real acquisition sidecars
close the gates, measured evidence remains `not_ready`, collapse
identification remains `blocked`, and manifold dynamics remain `blocked`.

The immutable diagnostic execution
`casimir-dp-evidence-map-stage3-v1-20260725T134544Z` completed with config
SHA-256
`231cb26e9c9bb523e2dda40a6178d8a484ec099f1868a74b995d8153337d29c2`
and receipt SHA-256
`5bcd2400bfeaa57a85c4b726224ac25dc8ab4c56bd59dad1b6e54f7f11ff0346`.
Its JSON and Markdown report hashes are
`feb799bcf93f1497673d58eac1a98a773ac1e1b0767082104af7b7d6c8e3508b`
and
`41aae6d542a19b6564f88ae7c8e7f2531abf90b08a7d02c11b043e5c691cc23a`.
All required upstream and six fixture hashes pass. The optional proposal
pre-freeze copy is `not_ready` because this live proposal had already changed;
it is not an evidence authority.

The registry result is specifically `registered_not_validated`: the bridge
schema is registered, registration is not empirical validation, and no frozen
bridge predictor enters the numerical comparison. The synthetic comparison's
`M0_ordinary_physics: disfavored` and
`M_dp_regularized_synthetic_v1:
not_disfavored_within_powered_region` states are recovery-test outputs, not
scientific preference. Ordinary-decoherence closure and measured evidence
remain `not_ready`; collapse identification and manifold dynamics remain
`blocked`. The receipt explicitly does not reuse the Stage-2 Casimir
certificate.

The downstream Stage-3 verification receipt, SHA-256
`2cf09b5c5f6d0a584a0c3fd56d8e53834b78f938814ac2ff5500651349930082`,
records a fresh adapter execution under trace
`casimir-dp-evidence-map-stage3-v1-20260725T134544Z` and run `2314`.
The verdict is `PASS`, first failure is null, deltas are empty, certificate
integrity is `true`, and status is `GREEN`. The certificate content hash is
`6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`,
the same value as Stage 2 because the verifier content-addresses the unchanged
passing `repo-convergence` payload. This is not reuse of the Stage-2
certificate artifact: the new trace, run id, timestamp, and exported training
trace establish the Stage-3 execution. Adapter certification establishes
repository constraint execution only and does not change any scientific gate.

### Stage-4 polarization and congruence control package

Stage 4 strengthens the proposal by expanding the ordinary-physics null before
the first apparatus residual is interpreted:

\[
M'_0=M_0+M_{\rm polarization\ QED}+M_{\rm thermal/FDT}.
\]

The photon-control package treats TE/TM and RCP/LCP as unitary bases of the
same two transverse field degrees of freedom. The apparatus sequence must add
matched RCP/LCP preparations, active mirror pairs, polarization-state
tomography, reflection-matrix calibration, and a registered propagation and
handedness convention. The primary polarization control is

\[
\Delta_{h,m}X=\frac12[
  (X_{+,R}-X_{+,L})-(X_{-,R}-X_{-,L})
].
\]

This double contrast may reveal ordinary reciprocal/nonreciprocal optical
response. It is not a DP or gravity observable. The unchanged
`M_dp_regularized_synthetic_v1` manifest remains polarization-blind when
`\delta\rho` and branch trajectories are fixed.

The thermal package must route every cell exclusively through either a
far-field Planck/Stefan-Boltzmann model or an apparatus-specific near-field
Green/FDT model. It requires thermometry, spectral emissivity, material loss,
geometry, heating, recoil, force-noise, decoherence, and covariance sidecars.
Zero-point mode energy is accounted separately and is not added to net heat
transfer. The nominal solar effective-temperature calculation is only a
normalization benchmark using supplied luminosity and radius.

The congruence package locks SI units, \(h=2\pi\hbar\),
\(\omega=2\pi\nu\), PSD sidedness and Jacobians, frames, bases, gauge,
tensor rank and symmetry, conservation, covariance, receipts, and recovery
limits. It explicitly returns `same_dimension_not_connected` for Compton,
DP, and cavity inverse-time quantities when no sourced transfer kernel exists.
Thus the proposal can use one consistent variable system without converting
dimensional similarity into a physical resonance claim.

#### Stage-4.1 source-backed QED scale calibration

The downstream Stage-4.1 package adds a constants-and-identities calibration;
it does not mutate or reinterpret authoritative Stage 4. The package keeps
full and reduced Compton wavelengths distinct,
\(\lambda_C=h/(m_ec)\) and
\(\bar\lambda_C=\hbar/(m_ec)=\lambda_C/(2\pi)\), and likewise keeps cyclic
and angular rest-energy frequencies distinct,
\(\nu_C=m_ec^2/h\) and
\(\omega_C=m_ec^2/\hbar=2\pi\nu_C\). These are conversion scales, not a
claim that the electron, nanoparticle, or cavity physically oscillates or acts
as a clock at a Compton frequency.

The package then checks the low-energy QED hierarchy

\[
a_0=\frac{\bar\lambda_C}{\alpha_{\rm fs}},\qquad
r_e=\alpha_{\rm fs}\bar\lambda_C,\qquad
cR_\infty=\frac12\alpha_{\rm fs}^2\nu_C,\qquad
\mathrm{Ry}=hcR_\infty,\qquad E_h=2\,\mathrm{Ry}.
\]

Here \(\alpha_{\rm fs}\) is a dimensionless electromagnetic coupling, not a
universal probability for photon emission or absorption. It is namespaced
separately from polarizability tensors and statistical alpha. The
[2022 CODATA adjustment](https://doi.org/10.1103/RevModPhys.97.025002)
provides adjusted values, uncertainties, and correlations; the
[BIPM SI definition](https://www.bipm.org/en/measurement-units/si-defining-constants)
provides exact \(h\) and \(c\). Derived-input uncertainty must use the supplied
covariance, \(u^2(f)=\mathbf J\mathbf C\mathbf J^{\mathsf T}\), or an explicitly
conservative envelope. Correlated CODATA outputs cannot be relabeled as
independent confirmations.

For hydrogen, Stage 4.1 checks only the leading reduced-mass boundary,
\(\mu_{ep}=m_em_p/(m_e+m_p)\),
\(R_H^{(0)}=(\mu_{ep}/m_e)R_\infty\), and
\(\nu_{1S\rightarrow2S}^{(0)}=(3/4)cR_H^{(0)}\). Precision comparison remains
out of scope until the transition definition and relativistic/fine-structure,
recoil, radiative/Lamb-shift, finite-size, hyperfine, centroid, and apparatus
corrections are carried in an explicit ledger.

The claim ceiling is `qed_scale_identity_calibration`. Passing this package
can establish source, namespace, algebra, uncertainty, and leading
reduced-mass consistency. It supplies no polarization or cavity prediction,
no Casimir force or energy evidence, no DP-rate or collapse evidence, and no
manifold, resonance, or transfer-kernel dynamics. Its bridge state remains
`same_dimension_not_connected`.

The authoritative Stage-4.1 source-backed execution is
`casimir-dp-qed-scale-hierarchy-stage4-1-v1-20260725T183020238Z`, with config
SHA-256
`e2625c86a5366258677c58cbe78e73b8fcc1893ecd417b48765d74488f953478`,
campaign-receipt SHA-256
`d835b56a87ed6f6d78edfb8e627bceecb931575348232ca0fd77795f5ffe24af`,
and downstream verification-receipt SHA-256
`a7f60aa9b12b7c1c143a7a1681048a61275495aaed33e1dfa6caa11e9e44b8db`.
Its fresh adapter trace records `PASS`, no first failure, no deltas, certificate
integrity `true`, and a 32-file/328-test combined replay. That software
certificate has scientific scope `none`; it is neither independent CODATA or
spectroscopy evidence nor support for a Casimir-to-DP bridge, collapse,
manifold dynamics, or physical viability.
Measured evidence, material response, ordinary-physics apparatus closure, and
precision spectroscopy remain `not_ready`; Casimir-to-atomic,
atomic-to-DP, Compton-to-collapse, collapse-identification, and manifold
transfers remain `blocked`; physical viability remains `not_evaluated`.

The authoritative synthetic execution is
`casimir-dp-polarization-congruence-stage4-v1-20260725T165932120Z`, config
SHA-256
`ade06cd7b95e27fe414614ad36512d5764d439c4fa6623f8499ad218ba07c3d7`,
and receipt SHA-256
`185a09ceb61b4f158afe16022783c8b184c1035f456cb341b5c90920b69b774a`.
It passes all three synthetic software lanes, preserves the named DP manifest
without mutation, and excludes the schema-only bridge from numerical
comparison. Measured polarization and thermal closure remain `not_ready`;
collapse identification and manifold dynamics remain `blocked`; physical
viability is `not_evaluated`.

This authority supersedes the provisional `20260725T153607Z` run after a
fail-closed audit. The campaign now verifies every internal polarization and
thermal gate at aggregation, rejects evidence-class relabeling, checks declared
Git tracking against the worktree, binds six runtime/contract sources by
SHA-256 plus Git-head context, and writes millisecond-identified immutable
outputs with exclusive creation.
The subsequent `20260725T161353353Z` hardening run is also superseded by the
authority above, which additionally pins the thermal constants dependency,
validates finite/PSD near-field thermal inputs and outputs, validates the
production PASS/certificate trace shape, freezes exact upstream/source role
tuples, and recomputes all nested thermal and congruence gates.
The `20260725T163307292Z` run is also superseded because it represented a
sealed custodian state with a sentinel mapping hash despite having no custody
receipt. The current authority is explicitly `synthetic_contract_only`:
reserved labels support contract tests, but no custodian receipt, mapping,
measured comparison, or unblinding exists or is authorized. Its passing
synthetic-blinding gate proves fail-closed nonpromotion, not execution of a
physical blind.

Fresh adapter trace
`casimir-dp-polarization-congruence-stage4-v1-20260725T165932120Z-final`
and isolated run `1` record verdict `PASS`, null first failure, empty deltas,
certificate integrity `true`, and certificate SHA-256
`38b2e69264ac9e846676fced5d7318a0ab6e35affcb572246bcae7bf6606fa34`.
Telemetry auto-merge is disabled. The content-addressed request supplies the
fresh production build, 5 files/73 Stage-4 tests, the targeted Stage-4
runtime-contract/schema gate, and a top-level dependency-coherence check.
Lint and full-repository typecheck proxies are omitted instead of inherited
from stale reports. The validated trace is one JSONL record, contains no NUL
bytes, and has SHA-256
`f40b4bdecb3f9e03f784e66c5b5db50d7e86571f31d0ae7547d110673d45bfd8`.
The certificate covers only the supplied repository-convergence inputs, not
the Stage-4 report bytes or scientific predictions. Downstream receipt SHA-256
`721b9f6aeab4b181ccc5ac21b4bc81c984d3b1fb72cdf76e55abedba11e38440`
hash-binds the exact campaign and a 27-file/301-test combined replay. This
verifies repository execution and provenance only and does not promote any
experimental claim.

### Implemented Stage-4.2A mass-anchor benchmark

Before the Stage-4.2B apparatus residual forecast, the implemented source-audit
campaign reconstructs a published Penning-trap/bound-electron mass
determination and then expresses the same rest-energy input as the conditional
tree-level Standard Model anchor
\(m_ec^2=y_e^{\rm tree}v_F/\sqrt2\). It carries trap and
bound-state-QED corrections, ion-mass dependence, source overlap, covariance,
SI/natural-unit conversion, and pole-versus-running scheme semantics. Its
collider lane treats the CMS \(H\rightarrow e^+e^-\) result as an upper
bound only.

This is a computational/source-audit benchmark, not a new apparatus work
package or evidence that the Higgs and Casimir vacua are the same physical
object. Its maximum claim is
`electron_mass_metrology_replay_and_conditional_sm_tree_mapping_only`. The
implementation contract and standing are recorded in
`docs/research/casimir-dp-electron-mass-higgs-anchor-stage4-2a-plan.md`.
Both diagnostic runtimes, their source-backed fixtures and focused tests, the
campaign/report receipt path, and two live non-promotable Theory Badges now
exist. They add no apparatus milestone, budget authority, calculator payload,
or observable bridge.

The implemented source boundaries are
`shared/casimir-dp-electron-mass-higgs-anchor-stage4-2a.ts` and
`shared/casimir-dp-planck-solar-calibration-stage4-2a.ts`. Fresh run
`casimir-dp-electron-mass-higgs-anchor-stage4-2a-v1-20260725T211750900Z`
produced JSON/Markdown report hashes
`a53a2f1cdc7e4b2d1c9957aaa0a73316d77037371002b7ced4a2978a630fe35d` and
`d7dbf59d6e284ef60ccae58f0f01076b453de1a81fcb2b6863bf44d969f7357a`;
its campaign-receipt SHA-256 is
`592a6245993411801672c6fa6ffa4cea4484e4fcf9164ad03f586a55333b17c3`.
Fresh adapter run `2324` passes with certificate integrity `true`; downstream
verification-receipt SHA-256
`debd651e7e500ee9b7011e7fa1c7a16ddcdcf56a6957ca0d2d91b28fe756b66a`
binds the 25-file/260-test replay. Its scientific scope is `none`.

The second source enforces a cross-scale calibration ladder:
Penning \(m_e\rightarrow m_ec^2\rightarrow\) Compton/Rydberg identities;
Planck-spectrum integration \(\rightarrow\) Stefan-Boltzmann normalization;
a content-addressed, frozen-window TSIS Wien-peak diagnostic
\(\rightarrow T_{\rm color}^{\rm Wien}\); and
supplied \(L_\odot,R_\odot\rightarrow T_{\rm eff,bol}\), with the IAU nominal
\(5772\ {\rm K}\) retained as a distinct exact conversion constant. The
preregistered DP target \(E_G[\Delta\rho;r_0]/\hbar\) is a separate final test,
not an output of the atomic or solar branches. Shared constants and dimensional
closure calibrate the implementation but do not evidence DP. The maximum
ladder claim is
`cross_scale_constant_unit_and_normalization_consistency_only`.

Evidence requires a different order: Level 1 is a replicated held-out residual
that survives complete ordinary-decoherence closure, discriminates registered
remaining unitary/environmental alternatives, and matches a frozen nonunitary
dynamical signature; Level 2 adds the
preregistered mass/branch/separation/hold-time dependence of
\(E_G/\hbar\) and is the first level that could support the tested DP rate;
Level 3 adds a fixed-material-branch boundary-conditioned residual matching a
frozen bridge kernel. Level 3 would support a laboratory extension beyond
standard DP, not cosmology by itself.

Any primordial-spectrum, expansion, dark-energy, or Planck-scale application
is a conditional future theory campaign with maximum claim
`counterfactual_cosmology_test_architecture_only`. It must inherit
laboratory-fixed kernel parameters, regularization, noise, dissipation/heating,
and uncertainties without cosmology-only retuning; provide a causal covariant
lift and conserved total stress; and pass independent CMB and expansion
likelihoods. Writing
\(\Gamma_{\rm DP}\sim\eta(c/L)(m/m_P)^2\) under the compact estimate
\(E_G\sim\eta Gm^2/L\) is a unit reparameterization, not evidence that the
experiment reaches Planck length or energy, discretizes spacetime, or explains
dark energy.

For commissioning, a polarization-correlated residual has this decision
order:

1. reject invalid hashes, convention, tomography, mirror, or matching cells;
2. test material/scattering and thermal/FDT closure under the expanded null;
3. reverify fixed `delta_rho`, trajectories, charge, trap, temperature, and
   readout;
4. report a replicated remainder as an unexplained anomaly;
5. compare it to a bridge only if a numerical kernel and independent companion
   were frozen before unblinding.

### Implemented Stage-4.2B apparatus-residual forecast and redesign gate

Stage 4.2B implements the next proposal calculation rather than merely
describing it. Six coupled runtimes transport:

1. the object, composition, hierarchy, and complete joint-system branch ledger;
2. response-corrected spectral thermometry;
3. sensor self-noise separation, ordinary phase/decoherence, and full
   cross-spectral covariance;
4. the frozen named regularized mass-density DP \(E_G/\hbar\) prediction;
5. a pilot-frozen raw-complex, coverage-qualified residual likelihood; and
6. nuisance-profiled signature identifiability, power, and acquisition.

The shared confirmatory registry contains 216 primary cells spanning three
metrology-planned silica objects, separations of 10/20/40 nm, holds of
0/25/50/100 ms, Ramsey/path-swap/echo sequences, and randomized blinded
active/reference boundary pairs. It is supplemented by 30 sham, detuned, and
one-axis-at-a-time controls plus 216 disjoint pilot and 216 independent
replication templates. These rows freeze what must be measured; they are not
the measurements.

The authoritative synthetic campaign passes its overall content/integrity
contract and Runtimes A–E. Runtime F correctly blocks with
`signature_not_identifiable`: rank 7, maximum absolute whitened cosine
\(0.9999771044199663\), worst pair `signature-intercept` /
`signature-thermal`, and normalized Gram condition number
\(179103.91134865975\). The 30 controls currently name axes and levels but do
not supply source-backed numerical response vectors and a block-bound control
covariance. Consequently:

- the planned 1,600 paired windows are not an achieved power claim;
- required windows and achieved power are
  `not_estimable_until_identifiable`;
- no preregistered region is currently powered;
- no region could be excluded by a future null under this forecast; and
- the separate `underpowered_null` fixture is a test of classification logic,
  not the baseline apparatus verdict.

This no-go does not prevent a boundary-correlated anomaly/systematics study.
It does prevent representing the current design as a powered test of the named
DP mass/separation/time law. The next commissioning deliverable is therefore a
numerical control-response/covariance pack in the exact frozen observable
space, followed by a fresh Stage-4.2B version and held-out power forecast.

The conditional DP boundary identity is also narrower than the experimental
question. It applies only to the registered nonrelativistic Markovian
mass-density DP generator when the exact parameter manifest, smearing,
trajectories, and complete joint-system branch densities are equivalent at
measured-preparation class. The synthetic numerical recovery passes, but the
experimental equivalence gate remains `not_ready`; the proposal cannot yet
claim that a physical boundary switch must leave the DP rate unchanged.

Authoritative run
`casimir-dp-apparatus-coherence-residual-stage4-2b-v1-20260726T123523358Z`
uses config, authority-manifest, and fixture SHA-256 values
`2abf8808fe73f6099d3e9e93e1bed2c8ca33d1094b6a93e9ad926f5fd900fa3e`,
`dd3e423c02fdb16481c91c7ff3ee8583aa740efc71e5a04902ce32cf10754d35`,
and
`ca89c5385bd55290b1cda8084b3d067cbd76420c810164fc958f310de11d1b8c`.
The immutable JSON, Markdown, 42-record/NUL-free trace, and campaign receipt
hashes are
`2ebd9971bacc393842dc71bfd80063d7b244231947074bc70b3be25bd7ad5b67`,
`e29564c6cedcace388233f6006b98683fab54f9326b96ab9bbaf3334f33adcbe`,
`727d78249462f0b4171532af37db97be5500a3a7a870cc56b2e533cae0ae0df7`,
and
`50632b32c4133fe3f0f5eee3cbbb157a983d0a9da69de6239d58563ca88f569c`.
All 19 fixtures execute and the focused Stage-4.2B suite passes 84/84 tests.
Fresh adapter run `2325` returns `PASS`, no first failure, no deltas, and
certificate integrity `OK`; downstream receipt SHA-256 is
`194a58bcfa4cc855c8a50a8a862fac391a01ee55c4dc9feeb1d6e98526b8bf3d`.
Its scientific scope is `none`: it certifies the explicitly supplied software,
test, schema, and dependency gates, not the experiment or DP.

### Implemented Stage-4.2C bounded redesign and empirical-input gate

Stage 4.2C consumes the complete content-addressed Stage-4.2B no-go without
modifying it. Seven numerical control axes—temperature, pressure, vibration,
charge, distance, polarization, and readout power—produce 30 complex response
rows and a full block covariance with shared-calibration ancestry. Sensor
self-noise remains covariance-only. These values are design assumptions whose
purpose is to test whether a physically parameterized control pack can rescue
identifiability; they are not apparatus measurements.

Every bounded candidate is then evaluated in the Stage-4.2B whitened
complex-coherence space through the unchanged Gaussian-regularized,
nonrelativistic mass-density DP generator. The frozen gates are:
maximum signature cosine \(\leq0.97\), augmented condition number \(\leq100\),
power \(\geq0.80\), false-positive rate \(\leq0.05\), and companion SNR
\(\geq5\). The selected synthetic candidate,
`silica_high_mass_identifiable`, has mass
\(1.94385\times10^{-16}\ {\rm kg}\), radius
\(2.76302362398029\times10^{-7}\ {\rm m}\), maximum whitened cosine
\(0.7177243227022941\), condition \(6.531693613125537\), power
\(0.9978580863455258\), and a forecast of 542 paired windows.

This is an identifiability-first commissioning target, not an experimental
result. The more powerful mass-scale-80 point is rejected because it exceeds
the frozen mass bound, and the diamond point is rejected because its material
response authority is not admitted. No authentic superposition-preparation
receipt exists. Before WP3 or WP4 can use the 542-window number, commissioning
must replace the numerical response and covariance assumptions with
provenance-bound empirical packets and demonstrate the selected branch
preparation.

Runtime L has already frozen the schemas for calibration, pilot, confirmatory,
and independent replication. Calibration and pilot may estimate response and
covariance; confirmatory and replication forbid response, covariance,
candidate, DP, or exclusion refitting and require separate custody and
authorized unblinding. The ordinary-physics null, named DP mass/separation law,
and any future Casimir-to-collapse transfer kernel remain separate hypotheses.

The authoritative run
`casimir-dp-identifiability-redesign-stage4-2c-v1-20260728T042510781Z`
executes 16/16 fixtures. Its report JSON, Markdown, trace, and receipt hashes
are
`d9237eeb9079e7fab84a86b3eda28b0f14bb83be1a340b3d6f9695dcffb5047c`,
`0f01cb550fed502fe8d5fa3920f4517d7931a89761cdb7a68af1b7d901b55f5f`,
`3ceeaddbdb0e8a78f1038bd3227f8b0ddbac4ac0af24ca7c37a6b026e5fe2b81`,
and
`59cca7ab7f6f6a3d27a83ad8b455fc63fc6db3ca7207cdeff350ed97d497865c`.
Fresh adapter run `2332` returns `PASS`, no first failure, no deltas,
certificate integrity `OK`, and certificate hash
`38b2e69264ac9e846676fced5d7318a0ab6e35affcb572246bcae7bf6606fa34`.
The validated one-record trace and downstream receipt hashes are
`3d454ba0cf3e778dc934cae1c0ee33996bb792caa06255a9dfe984a38138bdee`
and
`51c461db1fdaa29162b2c5287a31c01823e5bb23b16a25fe2914841239abba98`.
This certifies repository execution only. Scientific status remains: physical pilot
and measured evidence `not_ready`, collapse identification and manifold
dynamics `blocked`, and physical viability `not_evaluated`.

### Implemented Stage-4.2D cross-scale recovery and field-metrology gate

Stage 4.2D defines the final pre-pilot witness and equation-congruence
campaign. It keeps four relation classes separate:

1. sourced field-to-frequency calibration through Stark, Zeeman,
   circular-polarization, and blackbody dynamic-Stark responses;
2. classical-gravity recovery through compactness, material-strength
   crossover, and Jeans instability;
3. spinor/tensor representation equivalence, with explicit rejection of
   `mass_is_a_spinor` and `maxwell_spinor_is_collapse_generator`; and
4. the unchanged registered DP hypothesis
   \(\Delta\rho\rightarrow E_G/\hbar\).

The authoritative synthetic run
`casimir-dp-cross-scale-metrology-stage4-2d-v1-20260728T193200000Z`
passes 10/10 baseline and fail-closed fixtures. It recovers the conventional
limits, preserves the Stage-4.2C standing, and adds zero observable bridge
edges. Its maximum claim is
`spectroscopic_field_metrology_and_classical_gravity_recovery_only`.

This campaign improves the experiment by specifying what the pilot must
measure: selected witness transitions, response derivatives, polarization
convention, drift and sensor noise, full covariance, and the empirical
witness-to-complex-coherence response in sham, detuned, active, and reference
sequences. Until those packets exist, spectroscopic-response authority,
physical pilot readiness, and measured evidence remain `not_ready`; collapse
identification and manifold dynamics remain `blocked`; physical viability
remains `not_evaluated`.

Fresh adapter run `2338` returns `PASS`, no first failure, no deltas,
certificate integrity `OK`, and certificate SHA-256
`38b2e69264ac9e846676fced5d7318a0ab6e35affcb572246bcae7bf6606fa34`.
Validated trace SHA-256
`bb4f53cf48f7cf0726822e53dbacd369485c638636df1e6f5078027d36f91d38`
and downstream receipt SHA-256
`d96430684379dd5408d8099ae49a05ca0eaf4042a0ea64b09e23d0a4156a0556`
bind that software verification. Its scientific scope is `none`.

## Work plan and milestones

| Work package | Indicative interval | Exit artifact |
|---|---:|---|
| WP0 materials, surfaces, metrology | months 0-6 | measured optical/surface receipt pack |
| WP0P polarization and thermal sidecars | months 0-9 | Jones/Stokes, mirror, emissivity, thermometry, and Green/FDT receipt pack |
| WP1 force calibrator and finite geometry | months 4-12 | validated boundary-contrast report |
| WP2 classical particle integration | months 9-18 | transfer-function and distance-ladder pack |
| WP2C numerical control identifiability | months 12-22 | source-backed/measured control response vectors, block covariance, and passing rank/cosine/conditioning receipt |
| WP2D cross-scale field metrology | months 12-22 | selected Stark/Zeeman witness transitions, polarization convention, response/covariance calibration, conventional-gravity recovery receipt, and a measured witness-to-coherence transfer or explicit no-go |
| WP3 transverse coherence pilot | months 16-24 | branch-provenance and baseline-coherence receipt |
| WP4 blinded 400-window pilot | months 22-30 | frozen-analysis and pilot integrity report |
| WP5 powered main run, contingent on all gates and a fresh identifiable forecast | months 30-36 | reproduced decision-table result |

The schedule is a planning envelope, not an assertion that subsystem
integration will succeed. Each work package has a stop condition.

## Required capabilities and budget classes

The proposal requires cryogenic ultrahigh vacuum; nanoparticle loading,
neutralization, trapping, and out-of-loop readout; 2D material fabrication and
cryogenic optical/electrical characterization; nanomechanical force metrology;
Kelvin-probe and topographic surface mapping; low-noise gate electronics;
three-axis vibration monitoring; synchronized acquisition; and independent
blinding/data custody.

Budget development should therefore be organized by capability rather than a
single apparatus total: cryostat/vacuum, nanofabrication, optical trapping and
readout, force calibrator, low-noise electronics, surface metrology, data and
timing infrastructure, personnel, and independent replication. Vendor quotes
and host-facility contributions are still required before a monetary budget can
be represented as evidence.

## Data and reproducibility plan

Every raw file receives a SHA-256; calibration certificates and clock audits
are immutable sidecars; covariance matrices must pass dimension, symmetry,
diagonal-consistency, and positive-semidefinite checks; exclusions are frozen;
and the final result must reproduce from a clean checkout. External literature
datasets remain benchmarks and are never relabelled as measurements from this
apparatus.

## Proposal claim boundary

The proposal is ready for technical review and commissioning planning. It is
not evidence that the integrated experiment is feasible at its target
sensitivity. The Casimir verifier certifies repository constraint execution,
not the physical hypothesis. Measured evidence, finite-geometry boundary
contrast, collapse identification, and manifold dynamics remain open until the
artifacts named by their respective gates actually exist.

Stage 4.2B sharpens the integrated-apparatus standing: its content-addressed
synthetic campaign and cross-runtime identities pass, but the physical
signature matrix is `signature_not_identifiable`. Numerical
control-response/covariance authority is missing, so required acquisition and
power cannot be interpreted. The proposal is therefore ready for technical
review of the redesign/calibration program, not for a claim that WP5 is powered
against DP. Neither this baseline nor the isolated underpowered fixture
excludes DP. Measured evidence remains `not_ready`; collapse identification
and manifold dynamics remain `blocked`; physical viability remains
`not_evaluated`. Fresh adapter run `2325` closes only the repository software gate:
verdict `PASS`, first failure null, deltas empty, integrity `OK`, validated
one-record trace
`3894af959e1f3de8d28ede457727a97688c2fd64031c3512f941f5b89a889ffd`,
and downstream receipt
`194a58bcfa4cc855c8a50a8a862fac391a01ee55c4dc9feeb1d6e98526b8bf3d`.
It does not change any scientific status above.

Stage 4.2C narrows the remaining engineering question further: a bounded
synthetic candidate is numerically identifiable and powered under the frozen
design-assumption response/covariance model, but the response, covariance, and
branch preparation have not been measured. The 542-window forecast therefore
cannot authorize WP4/WP5 acquisition or a DP exclusion until empirical pilot
packets reproduce the preregistered gates without confirmatory refitting.

The OR/phase Stage-2 runtime passes its upstream-hash, DP algebra,
pairwise/potential equivalence, branch-sampling, fixed-branch null, and
phase/interference software checks. It also records that the Stage-1 sphere is
not the frozen proposal sphere, runs a proposal-specific resolution sweep, and
freezes the perturbation grid. Proposal convergence, branch provenance,
experimental bounds, sub-voxel perturbation sensitivity, the phase uncertainty
model, and measured phase/coherence are `not_ready`; collapse identification
and manifold dynamics remain `blocked`.

Stage 3 adds a runnable and hash-backed evidence map, not experimental
evidence. Its synthetic software diagnostics pass, its manifold-kernel schema
is registered without a validated or numerically compared bridge, its measured
and ordinary-decoherence gates remain `not_ready`, and its collapse/manifold
gates remain `blocked`. The fresh Stage-3 adapter execution passes with
certificate integrity `true`; because its deterministic certificate payload
matches Stage 2, the new trace and run id—not the repeated content hash
alone—establish its provenance. That combination is the current proposal
standing.

Stage 4 adds runnable polarization-QED, Planck/FDT thermal, and
tensor/dimensional/semantic congruence controls. Its synthetic predictions
pass, the named DP parameter manifest is unchanged, and no bridge enters
numerical comparison. The mirror-odd phase value in the fixture is a software
prediction example, not an apparatus forecast. Until measured polarization,
material, thermal, fixed-branch, and covariance receipts close, the proposal
may claim an expanded and falsifiable control plan only—not evidence for DP,
Penrose reduction, quantum foam, or manifold manipulation.

Stage 4.2A is an implemented calibration result, not an experimental-collapse
result. Its Penning, Compton/Rydberg, Planck/Stefan-Boltzmann, coarse
frozen-window TSIS Wien color diagnostic, and IAU bolometric-temperature
closures validate provenance, units, normalization, and vocabulary only. The
TSIS diagnostic is not a full response/covariance-aware spectral fit, whose
measured-significance gate remains `not_ready`. The campaign cannot promote
measured evidence or any collapse, manifold, cosmology, or
physical-viability gate; its downstream Casimir-verifier software receipt
passes. Level 1 additionally requires a replicated held-out residual
after ordinary-decoherence closure, discrimination against the remaining
registered unitary/environmental alternatives, and agreement with a frozen
nonunitary signature. Only a subsequent preregistered
mass/branch/separation/hold-time \(E_G/\hbar\) scaling test could support the
tested DP law at Level 2; any future cosmological comparison must use
laboratory-fixed parameters without retuning.

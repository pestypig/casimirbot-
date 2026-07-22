# Proposal: boundary-conditioned coherence near a tunable quantum-electrodynamic surface

## Project status

**Proposal id:** `casimir-dp-transverse-branch-pilot-v1`  
**Study:** `casimir-dp-quantum-foam-study`  
**Claim tier:** diagnostic protocol  
**Proposal package:** pass  
**Commissioning entry:** conditional pass  
**Measured evidence:** not ready  
**Collapse identification:** blocked pending a source-backed dynamics signature  
**Manifold dynamics:** blocked pending a complete causal model  
**Frozen config:** `configs/research/casimir-dp-proposal-closure.v1.json`  
**Runnable closure report:** `docs/research/casimir-dp-proposal-closure-report.md`

## Executive summary

This project will test whether a controlled change in the electromagnetic
boundary condition near a separately prepared material superposition produces
a repeatable residual in coherence decay or interferometric phase after
measured thermal, electromagnetic, mechanical, surface, gas, optical, and
readout couplings are removed. The primary result will be either an upper bound,
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

Secondary estimands are the interferometric phase, independently calibrated
boundary-force contrast, coupled heat, and switching cross-correlation. The
boundary coefficient is not called a collapse rate unless a registered model
supplies the required observable map.

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
current design estimate requires approximately `1e17` shots per boundary
setting and cannot identify collapse. The powered cross-correlation lane is a
systematics and dynamics discriminator, not a collapse detector.

## Model comparison and interpretation

Five model roles remain separate:

- ordinary open-system decoherence;
- standard Casimir-Polder/open-system response;
- rigid-sphere DP rate-only diagnostic;
- source-backed collapse dynamics, currently missing;
- boundary-conditioned manifold dynamics, currently missing.

The registered outcomes are:

- **integrity failure:** no physical conclusion;
- **null-consistent:** apparatus-specific upper bounds;
- **environment-explained residual:** quantified ordinary coupling;
- **unexplained residual:** replication and expanded systematics required;
- **model-discriminating residual:** evidence may favor only a model that was
  quantitatively registered before unblinding and independently replicated.

An unexplained residual is not evidence of DP collapse, Penrose reduction,
quantum foam, or manifold manipulation.

## Work plan and milestones

| Work package | Indicative interval | Exit artifact |
|---|---:|---|
| WP0 materials, surfaces, metrology | months 0-6 | measured optical/surface receipt pack |
| WP1 force calibrator and finite geometry | months 4-12 | validated boundary-contrast report |
| WP2 classical particle integration | months 9-18 | transfer-function and distance-ladder pack |
| WP3 transverse coherence pilot | months 16-24 | branch-provenance and baseline-coherence receipt |
| WP4 blinded 400-window pilot | months 22-30 | frozen-analysis and pilot integrity report |
| WP5 powered main run, contingent on all gates | months 30-36 | reproduced decision-table result |

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

# Casimir-DP Stage-3 Evidence Map: Codex Patch Instructions

## Purpose

Implement the next Casimir-Diósi-Penrose (Casimir-DP) study layer as a
fail-closed, blinded model-discrimination campaign. The patch must turn six
remaining computations into a rigorous map from experimental observations to
the claims those observations can and cannot support:

1. complex coherence, phase conditioning, echo, and non-exponential decay;
2. measurement-constrained electromagnetic Green-tensor and noise prediction;
3. a regularized dynamical DP companion-observable calculation;
4. a full-apparatus Casimir gravitational upper bound;
5. blinded joint model comparison across all registered experimental axes; and
6. a fail-closed manifold-kernel registry.

The central scientific question is not "manifold dynamics versus Hilbert
space." Hilbert space is also the probability framework used by QED,
open-system dynamics, OR heuristics, and DP master equations. The experiment
can distinguish a reversible Hamiltonian phase, conditionable dephasing,
ordinary irreversible decoherence, a specified intrinsic nonunitary model, and
a separately specified boundary-to-coherence extension. It cannot infer a
spacetime ontology from one unexplained visibility residual.

This is a Stage-3 extension. Do not rewrite the Stage-2 campaign, its config, or
its receipt. Stage 2 remains the immutable upstream record that presently
reports:

- runnable synthetic behavior;
- measured evidence `not_ready`;
- collapse identification `blocked`; and
- manifold dynamics `blocked`.

The new implementation must preserve those statuses unless new, hash-backed
measured artifacts actually satisfy the corresponding gates.

## Patch Objective

Create a runnable Stage-3 evidence-map campaign that answers, for every
registered observation:

- Which model predicted this pattern before unblinding?
- Which nuisance or ordinary-physics explanation was quantitatively tested?
- Which parameter region is disfavored?
- Which hypothesis remains merely compatible rather than supported?
- What is the maximum claim permitted by the available evidence?
- What additional independent observable is required for the next claim tier?

The runtime may report `not_disfavored_within_powered_region`, `disfavored`,
`not_identifiable`, `not_ready`, or `blocked`. It must never emit an automated verdict such as
`objective_collapse_proved`, `manifold_dynamics_proved`, or
`quantum_foam_detected`.

For implementation and human-facing output, replace the ambiguous
`consistent` label with
`not_disfavored_within_powered_region`. A compatibility state is not positive
support.

## Frozen Scientific Lanes

Keep these lanes separate in schemas, calculations, reports, and Theory
Badges:

| Lane | Registered prediction | Current maximum interpretation |
| --- | --- | --- |
| QED Hamiltonian | Boundary-conditioned energy and phase from material response and the electromagnetic Green tensor | Controlled QED phase |
| Technical dephasing | Phase dispersion correlated with measured apparatus variables and partly recoverable by conditioning or echo | Reversible/conditionable dephasing |
| QED/environmental decoherence | Visibility loss, force noise, heating, and loss from a common calibrated environmental model | Ordinary open-system decoherence |
| Penrose OR heuristic | Order-of-magnitude lifetime `tau_OR ~ hbar / E_G` for the prepared branch mass-density difference | Compatibility or exclusion of the tested lifetime prescription |
| Regularized dynamical DP | Coherence, diffusion/heating, and applicable radiation predictions from one named master equation and one frozen parameter set | Compatibility or exclusion of that DP implementation and parameter region |
| Ordinary GR response | A unitary gravitational potential/phase or weight scale from the complete apparatus energy or stress tensor | Ordinary gravitational coupling of the modeled apparatus energy |
| New Casimir-manifold bridge | A boundary-dependent phase or nonunitary rate from a registered causal tensor/noise transfer kernel | Support or exclusion of that specific extension only |

At fixed prepared branch mass-density difference `delta_rho`, standard
Penrose/DP has no Casimir-boundary variable. A boundary-dependent residual
therefore does not confirm unextended OR/DP. It either belongs to ordinary QED
or technical physics, remains unexplained, or tests a separately registered
bridge.

## Non-Negotiable Claim Boundaries

The patch must enforce the following rules in types, tests, report wording, and
badges:

- Casimir interaction energy is a reference-subtracted field/material
  quantity. It is not a macroscopic negative-mass object.
- A large internal Casimir plate force is not a gravitational weight. Force
  cannot be substituted for `Delta E / c^2`.
- Do not import the legacy NHM2 car-scale proxy into this experiment. That
  proxy depends on speculative amplification assumptions and is not a measured
  Casimir gravitational mass or curvature.
- Do not use "virtual-particle annihilation rate" as an experimental variable.
  Use material response, Green tensors, spectral densities, force
  correlations, renormalized stress tensors, or stress-noise kernels.
- Keep `nu_C = mc^2/h`, `E_G/h`, `Gamma_DP = E_G/hbar`, and cavity-mode
  frequencies distinct. Dimensional similarity or numerical coincidence is
  not a physical bridge.
- A static boundary has no drive phase. Echo pulses may operate on the
  prepared material state while the boundary remains static. Any boundary
  modulation is a separate driven experiment and a separate confound model.
- Mean stress can source a deterministic semiclassical metric response. It
  does not, by itself, define a stochastic collapse rate.
- "Positivity" in the manifold registry means a positive-semidefinite noise
  covariance and physically consistent quantum evolution. It does not mean
  that renormalized Casimir `T00` must be nonnegative.
- Synthetic data may validate software recovery only. It may not satisfy a
  measured-evidence gate.
- An unexplained residual is an anomaly, not collapse evidence.
- A null result excludes only the preregistered parameter region to which the
  campaign had demonstrated sensitivity.
- No runtime output may claim physical viability or certification unless the
  repository's HARD constraints and admissibility/certificate policies have
  independently been satisfied.

## Existing Code to Reuse Without Overclaiming

Reuse the following primitives where their domains match:

- `shared/casimir-dp-phase-coherence.ts` for action-phase integration,
  four-quadrature reconstruction primitives, static-force phase, and the
  existing Earth-gravity control;
- `shared/casimir-dp-or-phase-stage2.ts` as the immutable Stage-2 upstream
  result;
- `shared/casimir-dp-data-readiness.ts` for acquisition-sidecar hashes,
  calibration, covariance, and provenance validation;
- `shared/casimir-dp-inference.ts` for existing signature-separability and
  visibility-rate utilities;
- `shared/dp-collapse.ts` for the currently documented DP algebraic audit;
- `shared/casimir-optical-response.ts` for the existing material-response
  transformation; and
- `shared/casimir-lifshitz.ts` for its supported equilibrium mean-force domain.

Do not silently extend those capabilities:

- the existing phase runtime does not estimate shot/block complex coherence,
  phase-conditioned visibility, echo recovery, or non-exponential decay;
- the existing Lifshitz runtime is not a finite-geometry dyadic Green-tensor or
  fluctuation/noise solver;
- the current DP `side_effects` values are ingested, not jointly derived;
- the current `r_c_m` input is not, by itself, a verified regularized DP
  dynamics implementation; and
- the Stage-2 bridge object is intentionally null and blocked.

Prefer new Stage-3 modules over changing the numerical meaning of frozen
Stage-2 outputs.

## Required Artifact Layout

Add these primary artifacts, using repository naming conventions if a nearby
convention requires a minor rename:

```text
shared/casimir-dp-complex-coherence.ts
shared/casimir-dp-qed-green-noise.ts
shared/casimir-dp-dp-companion.ts
shared/casimir-dp-gravity-upper-bound.ts
shared/casimir-dp-model-comparison.ts
shared/casimir-dp-manifold-kernel-registry.ts
shared/casimir-dp-evidence-map-stage3.ts
shared/contracts/casimir-dp-evidence-map-stage3.v1.ts
configs/research/casimir-dp-evidence-map-stage3.v1.json
scripts/research/run-casimir-dp-evidence-map-stage3.ts
docs/research/casimir-dp-evidence-map-stage3-report.md
tests/casimir-dp-complex-coherence.spec.ts
tests/casimir-dp-qed-green-noise.spec.ts
tests/casimir-dp-dp-companion.spec.ts
tests/casimir-dp-gravity-upper-bound.spec.ts
tests/casimir-dp-model-comparison.spec.ts
tests/casimir-dp-manifold-kernel-registry.spec.ts
tests/casimir-dp-evidence-map-stage3.spec.ts
```

Also update:

- `docs/research/casimir-dp-quantum-foam-study.md`;
- `docs/research/casimir-dp-experiment-proposal.md`;
- the source equation-action sidecar, then regenerate the derived sidecar;
- `shared/theory/casimir-dp-study-theory-badges.ts` and its focused test;
- `shared/math-stage.ts`, `MATH_STATUS.md`, and `MATH_GRAPH.json`;
- `configs/physics-root-leaf-manifest.v1.json`;
- `docs/audits/root-to-leaf-theory-congruence-audit.md`; and
- any existing provenance test that freezes the paper's configs, runners,
  badges, edges, or evidence markers.

Do not create a second root-to-leaf bundle. Extend the existing
`casimir-dp.or-boundary-coherence` bundle and
`path_quantum_semiclassical_to_casimir_dp_or_test` path. Preserve the strict
reason `ROOT_LEAF_CASIMIR_DP_OR_BRIDGE_FAIL` and the diagnostic claim ceiling.
Add a separate ordinary-gravity control path, if the manifest schema permits
it, with the chain:

```text
Casimir measurement
  -> complete apparatus stress-energy source
  -> ordinary weak-field GR response
  -> interferometric or vacuum-weight control
```

Do not merge either path into `nhm2.curvature-collapse`.

## Configuration and Provenance Contract

The Stage-3 config must contain:

- schema and campaign versions;
- the Stage-2 config, report, and receipt hashes;
- experiment-proposal and data-readiness upstream hashes;
- a source registry with stable DOI or publisher URLs;
- unit, coordinate, Fourier-transform, angular-frequency/frequency, PSD
  sidedness, and sign conventions;
- hashes for every measured material, geometry, calibration, Green/noise,
  coherence, and companion-observable sidecar;
- blind labels and a separate custodian-held mapping receipt;
- a frozen model registry, likelihood registry, nuisance registry, prior
  registry, and falsifier registry;
- deterministic random seeds for synthetic and resampling tests;
- software/version identifiers; and
- a `claim_ceiling: "diagnostic"` field.

Pin the exact timestamped Stage-2 authority, not a mutable `current` alias. The
frozen authority for this implementation is
`casimir-dp-or-phase-stage2-v1-20260723T220236Z`, with config hash
`b517e8fbf002303258a5269e7f37c6b16d4bc3c45c609072bdb2a9e5184e596d`
and receipt hash
`64f0e1c95307829540d3c01ad7cb7e10b15d510cb31cf8e73f88a8990d2c25ab`.
Record any untracked local artifact as provenance, but put the immutable
authority statement and hashes in a tracked manifest.

Store measured data and synthetic fixtures under distinguishable evidence
classes. Require a raw-data hash, calibration hash, uncertainty/covariance
receipt, acquisition timestamp, apparatus state, and provenance reference for
every measured sidecar.

Mass and material scans are normally between-object hierarchical factors, not
within-pair covariates. Encode path swap, echo, hold time, and boundary state as
randomized sub-campaign cells. Do not pretend one object changed mass or bulk
material within a paired shot sequence.

## Required Run Order

The Stage-3 orchestrator must execute in this order and record a result for
every stage:

1. Freeze the source registry, claim ceiling, units, signs, PSD/Fourier
   conventions, model definitions, and upstream hashes.
2. Validate blind labels, raw hashes, calibration receipts, covariance
   receipts, randomization, and control-cell coverage.
3. Estimate complex coherence from all registered analysis phases.
4. Estimate phase-conditioned coherence, path-swap behavior, and echo
   recovery.
5. Evaluate non-exponential time dependence on a sufficiently populated
   hold-time grid.
6. Validate material-response, Green-tensor, force-noise, and technical-noise
   sidecars.
7. Predict QED energy/phase, force noise, heating, and environmental
   decoherence with propagated uncertainty.
8. Validate each named OR/DP model, mass-density prescription,
   regularization, parameter manifest, and external-bound receipt.
9. Predict DP coherence and, only for an applicable dynamical DP model, its
   diffusion, heating, and radiation companions.
10. Validate the complete apparatus energy/stress ledger for both boundary
    states.
11. Compute `Delta E/c^2`, vacuum-weight scale, weak-field upper bound, and
    ordinary gravitational phase.
12. Evaluate the manifold-kernel registry with deterministic first-failure
    behavior. Exclude every blocked bridge before model signatures are frozen.
13. Freeze all admitted model signatures, likelihoods, priors, exclusion
    criteria, and falsifiers before unblinding.
14. Run joint held-out model comparison across every registered experimental
    axis.
15. Populate the outcome-to-claim ledger and apply the maximum-claim rules.
16. Write the hash-backed receipt, maintained report, paper/proposal sections,
    and badge states.

If an earlier gate fails, later stages may run only in explicitly labeled
diagnostic/synthetic mode. They must not erase the earlier `not_ready` or
`blocked` reason.

## Runtime 1: Complex Coherence, Conditioning, Echo, and Decay Shape

### Scientific reason

Visibility alone conflates coherent phase rotation, shot-to-shot phase
dispersion, and irreversible loss. The primary estimator must therefore retain
the complex coherence

```math
C_b(t) = V_b(t)e^{i\phi_b(t)}
```

for each boundary state `b`, with port probability

```math
P_+(\theta \mid b,t)
  = \frac{1}{2}\left[1+\operatorname{Re}\left(C_b(t)e^{i\theta}\right)\right].
```

Echo and path-swap cells test reversibility and sign behavior. They are
discriminators, not unique collapse tests.

### Inputs

Require shot- or block-level records containing:

- blind boundary-state label;
- object/campaign identifier;
- mass, density-profile, and branch-separation receipts;
- hold time;
- analysis phase and phase-calibration uncertainty;
- plus/minus port counts or event outcomes;
- path orientation and path-swap flag;
- echo sequence identifier and pulse/toggling-function receipt;
- static-boundary confirmation during coherent evolution;
- surface distance, material, temperature, charge, pressure, vibration, laser
  phase, and other registered nuisance channels; and
- raw, calibration, and covariance hashes.

Four analysis quadratures are the preferred minimum for each principal cell.
The schema must explicitly mark incomplete phase coverage.

### Calculations

Implement:

- a binomial or event-appropriate joint estimator for
  `Re(C)`, `Im(C)`, `V`, and `phi`;
- covariance and registered confidence/credible intervals;
- raw visibility;
- phase-conditioned visibility using only independently measured or
  cross-validated phase predictors;
- a shot/block phase-distribution summary;
- path-swap phase sign and visibility response;
- echo recovery, with pulse/filter-function provenance;
- `chi(t) = -log[V(t)/V(0)]` with uncertainty;
- preregistered exponential, Gaussian/stretched-exponential, and minimally
  flexible non-exponential alternatives; and
- block/cluster bootstrap or the preregistered hierarchical covariance method.

Do not use the same held-out cell both to learn a phase correction and to
claim recovered visibility.

A non-exponential fit requires a hold-time grid. The existing single
`0.1 s` design point is insufficient. Mark decay-shape inference `not_ready`
unless the preregistered minimum number and placement of distinct hold times
pass an identifiability check. A minimum of three or four times may be used as
a software gate, but power and parameter-identifiability—not the count alone—
must determine scientific readiness.

### Outputs and gate

Emit:

- complex coherence and covariance by blinded cell;
- raw and phase-conditioned visibility;
- phase distribution;
- path-swap and echo recovery statistics;
- decay-shape comparison and held-out predictive score;
- nuisance correlations;
- an identifiability report; and
- an evidence class and maximum claim.

The runtime may identify `coherent_phase`, `conditionable_dephasing`,
`unrecovered_visibility_loss`, or `not_identifiable`. It must not label
unrecovered loss as collapse.

### Focused tests

Include deterministic fixtures proving:

- recovery of injected `V` and `phi` from four quadratures;
- phase drift lowers raw visibility and conditioning restores it;
- echo restores quasistatic dephasing but need not restore irreversible loss;
- path swap reverses a Hamiltonian phase without inventing visibility loss;
- exponential and Gaussian/stretched fixtures are distinguishable only when
  the time grid has adequate rank and sensitivity;
- incomplete quadrature coverage and one-time-point input fail closed; and
- synthetic recovery never promotes measured evidence.

## Runtime 2: Measurement-Constrained QED Green Tensor and Noise

### Scientific reason

The nearby boundary changes the electromagnetic Green tensor, material mode
structure, mean interaction energy, and fluctuation spectrum. These ordinary
QED effects can generate both phase and decoherence and therefore must be
predicted before any residual is assigned to collapse.

Call this runtime **measurement-constrained** unless the dyadic Green tensor
itself was experimentally reconstructed. Measured permittivity or impedance
constrains a computed Green tensor; it does not make the tensor a direct
measurement.

### Inputs

Require:

- finite-geometry dyadic Green-tensor tables or a named, source-backed solver
  receipt;
- measured complex permittivity/permeability or impedance over the required
  band, with extrapolation and Kramers-Kronig receipts;
- geometry, roughness, coatings, gap, alignment, and temperature;
- probe polarizability/response tensor and state;
- branch trajectories and interferometer toggling/filter function;
- electromagnetic, force, and technical-noise spectra with sidedness and
  normalization;
- frequency-grid resolution and interpolation error;
- covariance/material uncertainty; and
- hashes and source references.

Do not reuse NHM2 dyadic artifacts as if they described this apparatus. They
may be comparison-only inputs when explicitly labeled.

### Calculations

Compute, within the registered model domain:

```math
\Delta\phi_{\rm QED,b}
  = -\frac{1}{\hbar}\int
    \left[U_b(\mathbf{x}_A,t)-U_b(\mathbf{x}_B,t)\right]dt .
```

Propagate the same material/geometry receipt into:

- mean Casimir-Polder or applicable boundary potential;
- mean force and force gradient;
- energy-difference noise `S_DeltaU(omega)`;
- force-noise tensor `S_FF^{ij}(omega)`;
- coherence exponent through the frozen PSD convention, for example

```math
\chi_b(t)
  = \frac{1}{2\hbar^2}
    \int_{-\infty}^{\infty}\frac{d\omega}{2\pi}
    S_{\Delta U,b}(\omega)|Y_b(\omega,t)|^2
```

  for the declared two-sided convention; and
- motional heating/loss only through the exact, cited oscillator/coupling
  formula and noise convention applicable to the apparatus.

For a small, effectively constant branch displacement, the linearized check

```math
S_{\Delta U}(\omega)
  \simeq \Delta x_i S_{FF}^{ij}(\omega)\Delta x_j
```

may be used within a declared error bound. Do not use it outside its registered
linear-response domain.

The mean Lifshitz pressure is not a noise spectrum. No code path may infer
`S_FF` from mean pressure without an explicit fluctuation-dissipation model,
material loss, temperature, geometry, and convention.

### Outputs and gate

Emit:

- mean potential, force, and phase with uncertainty;
- Green-tensor/material validity and Kramers-Kronig diagnostics;
- force/energy noise PSDs;
- predicted QED decoherence and heating/loss;
- sensitivity to material, temperature, distance, and geometry;
- residual covariance supplied to joint inference; and
- measured/synthetic/readiness status.

The QED lane is `not_ready` for scientific comparison if required measured
material, geometry, calibration, or noise receipts are missing. A reduced-order
planar result remains diagnostic.

### Focused tests

Test:

- dimensions and PSD sidedness;
- Hermitian/reciprocal structure where the registered material model requires
  it;
- nonnegative physical noise covariance;
- zero-coupling and infinite-distance limits;
- temperature and material-loss fixtures;
- Kramers-Kronig tolerance propagation;
- uncertainty propagation;
- phase sign under path swap;
- filter-function suppression in an echo fixture; and
- rejection of mean-pressure-as-noise input.

## Runtime 3: Regularized DP Companion Observables

### Scientific reason

Penrose's OR argument motivates the lifetime scale

```math
\tau_{\rm OR} \sim \frac{\hbar}{E_G},
\qquad
\Gamma_{\rm OR} \sim \frac{E_G}{\hbar},
```

but it does not uniquely define a stochastic master equation, decay line
shape, heating rate, momentum diffusion, or radiation spectrum. Those
companion observables belong only to a named dynamical DP implementation.

For a registered branch mass-density difference, preserve the convention

```math
E_G
  = \frac{G}{2}\int d^3r\,d^3r'
    \frac{\delta\rho(\mathbf r)\delta\rho(\mathbf r')}
         {|\mathbf r-\mathbf r'|}
```

or its explicitly regularized equivalent. The numerical softening length used
for quadrature is not automatically the physical DP smearing/cutoff.

### Model registration

Each dynamical DP variant must freeze:

- model name, version, primary source, and equation identifiers;
- master equation or stochastic dynamics;
- mass-density operator and composition model;
- physical smearing/cutoff `R0` and its prior/range;
- any dissipative temperature, friction, or additional parameter;
- geometry and branch-density construction;
- numerical regularization separately from physical regularization;
- applicable coherence, diffusion, heating, and radiation equations;
- domain of validity;
- external bounds; and
- one immutable parameter-manifest hash.

The same physical cutoff, smearing, composition, and dissipation parameters
must propagate through every companion channel. Do not tune them separately
after inspecting coherence, heating, or radiation data.

### Calculations

Provide two visibly separate lanes:

1. `penrose_or_heuristic`: compute `E_G`, `tau_OR`, and `Gamma_OR` as a
   model-conditioned lifetime diagnostic only.
2. `named_dynamical_dp`: compute coherence decay and, where the cited model and
   apparatus mapping apply, momentum diffusion, heating, and spontaneous
   radiation from the same parameter receipt.

If a companion formula does not apply to the apparatus, output `blocked` with
the missing mapping. Do not substitute a dimensional proxy.

Include mass, branch-separation, density-profile/geometry, and hold-time scans.
At fixed `delta_rho`, changing the external static Casimir boundary is the
standard OR/DP null. Boundary dependence requires the separate bridge registry.

### Outputs and gate

Emit:

- `E_G` and independent numerical cross-check;
- lifetime/rate with convention;
- coherence curve;
- diffusion coefficient;
- heating prediction;
- radiation prediction and analysis band, when applicable;
- external exclusion/bound comparison;
- shared parameter-manifest hash; and
- separate OR-heuristic and dynamical-DP claim ceilings.

The natural parameter-free DP version must not be presented as unconstrained:
the cited radiation experiment reports it ruled out. Regularized or
dissipative variants remain model-dependent and must be named.

### Focused tests

Test:

- zero mass-difference and zero branch-separation limits;
- large-separation/saturation behavior for the registered density model;
- nonnegative rate and diffusion where required;
- dimensions;
- convergence of the two `E_G` evaluations;
- physical cutoff distinct from numerical softening;
- identical parameter hashes across coherence/diffusion/heating/radiation;
- fixed-branch boundary null;
- a fixture excluded by a companion bound; and
- blocked output when a radiation/heating mapping is absent.

## Runtime 4: Full-Apparatus Casimir Gravitational Upper Bound

### Scientific reason

Energy contributes to gravity, but a Casimir force is the derivative of a
typically small interaction energy over a small distance. The correct
gravitational bookkeeping begins with the difference between complete
apparatus states, not with plate pressure.

### Inputs

For both boundary states, require a signed ledger for:

- field/interaction energy;
- plates and coatings;
- supports and stresses;
- actuators and modulation work;
- electrostatic/patch contributions;
- elastic strain;
- thermal state and heat flow;
- trapped/probe state;
- control electronics or other state-dependent nearby mass-energy; and
- covariance, conservation, geometry, and provenance receipts.

Where a tensor-level result is attempted, require the complete modeled
`Delta T_munu`, basis/frame, gauge/coordinate contract, boundary/surface terms,
and conservation residual. An interaction-only scalar cannot satisfy the
tensor gate.

### Calculations

Tier 1 is a signed scalar upper-bound ledger:

```math
\Delta m_{\rm app} = \frac{\Delta E_{\rm app}}{c^2},
\qquad
\Delta F_{\rm weight} = g\frac{\Delta E_{\rm app}}{c^2}.
```

Report signed values and magnitudes separately.

Tier 2 may compute a weak-field response only after the tensor/source gate
passes. The ordinary probe phase is

```math
\Delta\phi_g
  = -\frac{m_{\rm probe}}{\hbar}
    \int\left[\Phi_A(t)-\Phi_B(t)\right]dt .
```

This boundary-state potential difference is distinct from the existing
ambient Earth-gravity tilt control.

An optional far-field estimate such as

```math
|\Delta h_{00}| \sim \frac{2G|\Delta E_{\rm app}|}{r c^4}
```

may be emitted for sensitivity triage only, with its far-field and
weak-field assumptions. It is not a measured curvature result.

### Outputs and gate

Emit:

- signed component ledger and net `Delta E_app`;
- `Delta E_app/c^2`;
- vacuum-weight scale;
- tensor completeness/conservation report;
- weak-field potential/metric upper bound when admitted;
- ordinary gravitational phase and detector sensitivity ratio; and
- a claim ceiling of `scalar_upper_bound`, `tensor_diagnostic`, or
  `measured_gravitational_response`.

The final status must remain `scalar_upper_bound` if the complete apparatus
tensor is absent. Never import NHM2 amplification factors into this ledger.

### Focused tests

Test:

- energy/mass/weight dimensions;
- sign and magnitude preservation;
- cancellation of internal energy transfers in a closed apparatus fixture;
- inclusion of supports/boundary terms;
- no use of plate pressure as weight;
- zero state-difference limit;
- distinction between the boundary-state phase and Earth-g tilt phase;
- far-field scaling; and
- tensor lane blocked by missing components or failed conservation.

## Runtime 5: Blinded Joint Model-Comparison Ledger

### Scientific reason

No single visibility residual identifies collapse. The inference must compare
full, preregistered signatures across independent controls and companion
channels.

### Design cube

Represent at least:

- object mass and density profile;
- branch separation;
- hold time;
- probe-to-boundary distance and cavity gap, when distinct;
- boundary material and loss response;
- boundary and environment temperature;
- boundary state;
- path swap/orientation;
- echo/control sequence;
- QED phase;
- raw and phase-conditioned visibility;
- force/field noise and heating;
- DP companion observables; and
- full-apparatus gravity controls.

Encode campaign hierarchy so mass/material differences between objects are not
treated as paired within-object changes.

### Models to freeze before unblinding

Register the additive ordinary-physics baseline

```math
M_0 =
  M_{\rm QED\ phase}
  + M_{\rm technical\ dephasing}
  + M_{\rm QED/environmental\ decoherence}
  + M_{\rm ordinary\ gravity}.
```

Compare nested additions `M_0 + M_dp_<variant>` and, only after registry
preflight, `M_0 + M_bridge_<id>`. Do not force these physically coexisting
components into a mutually exclusive model choice.

At minimum register:

- `M_qed_phase`;
- `M_technical_dephasing`;
- `M_qed_environmental_decoherence`;
- `M_penrose_or_heuristic`;
- each named `M_dp_<variant>`;
- `M_ordinary_gravity`; and
- each fully registered `M_bridge_<id>`.

Each model needs:

- source and equation identifiers;
- parameter domains and frozen priors, if Bayesian;
- nuisance terms and covariance;
- prediction vector over the full design cube;
- companion-observable prediction;
- zero/null limits;
- identifiability and power requirements;
- explicit falsifier;
- held-out scoring rule; and
- maximum permitted claim.

Do not create a generic free-form "collapse" model.

### Blinding and inference

Use a custodian-held boundary-label mapping. Freeze model code, hashes,
likelihoods, priors, exclusion thresholds, and confirmatory cells before
unblinding.

Pilot/training cells may fit nuisance structure. Confirmatory cells must be
held out. The inference must use the joint likelihood for complex coherence
and registered companion channels, not a residual-only score.

Before reporting Bayes factors, require a frozen proper-prior receipt and a
prior-sensitivity report. Otherwise mark the Bayes-factor lane `blocked`.
Preregister any alternative likelihood-ratio, predictive-log-score,
information-criterion, or exclusion-region rule.

Run:

- design-rank and identifiability checks;
- prior and nuisance sensitivity;
- posterior/predictive or residual checks;
- held-out prediction;
- simulation-based calibration where applicable;
- multiple-testing control for exploratory cells; and
- power/sensitivity coverage for every excluded parameter region.

No automatic unblinding is permitted. The runtime may prepare the sealed
confirmatory job and verify hashes, but the custodian action and receipt must
be explicit.

### Required output states

For each model and parameter region, emit one of:

- `not_disfavored_within_powered_region`: data do not disfavor the registered
  prediction within the demonstrated sensitivity region;
- `disfavored`: preregistered criterion passed within demonstrated
  sensitivity;
- `not_identifiable`: competing signatures are not separable in this design;
- `not_ready`: required measured evidence or power is absent; or
- `blocked`: model, prior, likelihood, kernel, or provenance is incomplete.

`not_disfavored_within_powered_region` is not synonymous with `confirmed` or
supported.

### Focused tests

Test:

- blinded labels never leak into feature construction or model fitting;
- model signatures are frozen before unblinding;
- prior-free Bayes factors remain blocked;
- held-out cells are not used for nuisance training;
- hierarchical mass/material factors are handled correctly;
- deliberately collinear signatures return `not_identifiable`;
- synthetic QED phase, dephasing, environmental loss, DP, and bridge fixtures
  recover only their allowed maximum claims;
- sensitivity-limited nulls exclude only covered regions; and
- the ledger contains no ontology/proof verdict.

## Runtime 6: Fail-Closed Manifold-Kernel Registry

### Scientific reason

A boundary-dependent collapse rate is not supplied by standard QED,
semiclassical gravity, Penrose's lifetime estimate, or the ordinary DP
mass-density functional. A new bridge must specify how a renormalized tensor
source and/or stress fluctuations produce a causal metric response and then a
phase or physically consistent nonunitary matter evolution.

Extract and version the existing Stage-2 bridge requirements; do not loosen or
overwrite the null Stage-2 object.

### Tagged-union contract

Implement a tagged union with:

```ts
type RegistryStatus = "blocked" | "registered" | "rejected";
```

A `blocked` entry contains identifiers, proposed scope, missing fields,
first-failure code, and no numerical rate.

A `registered` entry requires all of:

- model id, version, maturity, sources, and equation identifiers;
- quantum field/state and apparatus geometry;
- renormalized `T_munu` prescription, subtraction/reference state, frame, and
  boundary/surface terms;
- tensor stress-noise kernel/covariance and ordering convention;
- retarded causal tensor-to-metric response kernel;
- gauge/coordinate and constraint contract;
- Fourier/PSD conventions and units;
- metric-to-matter/coherence dynamics;
- distinction between deterministic phase and stochastic/nonunitary rate;
- dimensional closure;
- stress-energy conservation and required symmetry identities;
- positive-semidefinite noise covariance;
- complete positivity and trace preservation for a Markovian master equation,
  or the appropriate source-backed consistency analysis for a non-Markovian
  map;
- nonnegative physical rate where a rate is produced;
- zero-coupling, no-boundary-contrast, weak-field, standard-QED, ordinary-GR,
  and standard-OR/DP recovery limits;
- frozen parameter ranges/priors and manifest hash;
- domain of validity and uncertainty model;
- independent companion observable;
- at least one experiment-internal falsifier and one independent falsifier;
  and
- preregistration timestamp preceding unblinding.

A `rejected` entry preserves the failed model/version, tested evidence,
criterion, and immutable receipt. It must not be deleted and re-entered under
the same id with changed parameters.

### Computation policy

No numerical bridge phase or rate may be emitted unless every required field
passes. Return the deterministic first missing or invalid field.

The schematic response

```math
\delta h_{\mu\nu}(x)
  = \int d^4x'\,
    G^{\rm ret}_{\mu\nu\alpha\beta}(x,x')
    \delta\langle T^{\alpha\beta}(x')\rangle
```

can motivate a deterministic metric/phase calculation. A stochastic rate
requires the registered stress-noise covariance and metric-to-coherence
dynamics. Neither a scalar negative energy density nor Casimir pressure can
stand in for this tensor chain.

Schema completeness yields `registered`, not `validated`. Empirical support is
a separate model-comparison result.

### Focused tests

Test:

- deterministic first-failure ordering;
- no rate/phase returned from a blocked entry;
- rejection of a scalar pressure source;
- rejection of missing renormalization, causal response, gauge, dimensions,
  conservation, positivity/consistency, limits, or falsifier;
- acceptance of signed renormalized energy without requiring `T00 >= 0`;
- zero-coupling and no-boundary-contrast limits;
- invalid covariance and nonphysical dynamics fail closed;
- registration cannot occur after unblinding; and
- a registered schema is never labeled empirically validated.

## Outcome-to-Claim Map

The Stage-3 report and proposal must include this logic in machine-readable and
human-readable form.

| Experimental outcome | What it would establish | What it would disfavor or rule out | What it would not establish |
| --- | --- | --- | --- |
| Hash, calibration, randomization, or blind-integrity failure | The campaign cannot support confirmatory inference | No physics model; the run is invalid or exploratory | Any physical null or anomaly |
| Reversible boundary-conditioned phase with path-swap sign reversal and echo/conditioning recovery | A controlled boundary-dependent Hamiltonian/QED phase, if the material/Green model also closes | Models predicting a larger irreducible loss in the covered region | Collapse, manifold dynamics, or negative gravitational mass |
| Raw visibility loss removed by phase conditioning | Phase noise/dephasing rather than population-destroying coherence loss | Any model claiming that the removed component is irreducible collapse | Absence of all environmental decoherence |
| Unrecovered loss quantitatively tracked by calibrated QED force noise, heating, gas, blackbody, charge, vibration, or other nuisance channels | Ordinary open-system decoherence within uncertainty | Intrinsic models that predict an additional minimum excess in the covered region | A universal exclusion of OR/DP |
| Null residual after ordinary closure, with demonstrated sensitivity | An upper bound on the preregistered excess terms | Only the covered bridge/DP parameter region | Proof that objective collapse never occurs |
| Boundary-independent excess following preregistered `E_G(m, Delta x, rho)` scaling | Compatibility with the tested OR lifetime law | Standard-QED-only models if ordinary channels and integrity are closed | A unique DP dynamics or spacetime ontology |
| The same boundary-independent excess plus diffusion/heating/radiation companions from one frozen DP parameter set | Substantive support for that named dynamical DP implementation | Competing registered models that fail the joint held-out prediction | Every DP variant, Penrose's broader interpretation, or manifold ontology |
| `E_G`-like coherence scaling without the companion signal required by the tested dynamical DP model | Possible compatibility with the Penrose lifetime heuristic while that DP dynamics is disfavored | The tested DP parameter set if the companion channel had adequate sensitivity | Proof of Penrose OR |
| Boundary-dependent excess at fixed `delta_rho`, but no registered bridge | A reproducible unexplained boundary-correlated anomaly after replication | Unextended OR/DP if it predicts boundary invariance and the anomaly is real | Collapse, a gravitational mechanism, or quantum foam |
| Boundary-dependent excess matching a preregistered causal stress/noise kernel over held-out material, distance, temperature, echo, and mass cells | Evidence for that specific anomalous bridge | Registered alternatives failing the joint prediction | A generic proof of manifold dynamics |
| Independent vacuum-weight or multi-probe metric response consistent with the same complete-apparatus source and bridge parameters | Ordinary or model-specific gravitational coupling, depending on the registered prediction | Models predicting no such response in the covered region | Objective collapse unless the coherence channel also discriminates it |
| Frequency coincidence among `nu_C`, `E_G/h`, and a cavity mode | No physical correspondence by itself | Nothing | Resonance, energy transfer, collapse, or a causal bridge |
| Non-exponential visibility decay alone | A decay-shape observation requiring a mechanism comparison | Only preregistered line shapes disfavored with adequate power | Objective collapse |

## Cross-Axis Signature Matrix

The model-comparison runtime must evaluate at least these qualitative
dependencies, then replace them with quantitative registered predictions where
available:

| Lane | Mass/density geometry | Branch separation | Hold time | Boundary distance/material | Temperature/noise | Path swap | Echo | Companion channel |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| QED Hamiltonian | Probe response dependent | Through branch potential difference | Phase accumulation | Strong registered Green/material dependence | Thermal material response may matter | Phase sign reverses | Static phase may refocus | Mean force/force gradient |
| Technical dephasing | Apparatus dependent | Coupling dependent | Often non-Markovian or quasistatic | May correlate through controls | Often strong | Depends on nuisance coupling | Often partly recovers | Measured technical PSD |
| QED/environmental decoherence | Probe response dependent | Through which-path coupling/filter | Model-specific `chi(t)` | Green/loss/distance dependent | Strong model dependence | Rate usually does not become a Hamiltonian sign flip | Filter-dependent suppression, not universal recovery | Force noise, heating, loss |
| Penrose OR heuristic | Through `delta_rho` and `E_G` | Through `E_G` | `tau ~ hbar/E_G` only | Null at fixed `delta_rho` | No standard boundary-temperature term | Intrinsic rate invariant | No unique echo law supplied | None uniquely supplied |
| Named dynamical DP | Registered mass-density functional | Model-specific small/large separation behavior | Master-equation prediction | Null at fixed `delta_rho` unless extended | Variant-specific only | Intrinsic rate invariant | Model-specific | Diffusion/heating/radiation from same parameters |
| Ordinary Casimir gravity | Complete apparatus `Delta T_munu` | Probe potential difference | Unitary phase accumulation | Through complete state-energy difference | Through apparatus energy ledger | Gravitational phase sign follows geometry | Unitary phase can refocus | Vacuum weight/multi-probe metric |
| Registered bridge | Exactly as frozen in kernel | Exactly as frozen in kernel | Exactly as frozen in dynamics | Required held-out dependence | Required noise/FDT dependence | Required falsifier | Required falsifier | Independent registered observable |

Qualitative table entries are not executable predictions. A model remains
`blocked` in confirmatory comparison until its quantitative functions,
parameters, uncertainty, and falsifiers are frozen.

## Theory Badge Additions

Add Stage-3 badges with names consistent with the existing graph, for example:

- `study.casimir_dp.complex_coherence_discriminator`;
- `study.casimir_dp.qed_green_noise_budget`;
- `study.casimir_dp.dp_companion_signature`;
- `study.casimir_dp.casimir_gravity_upper_bound`;
- `study.casimir_dp.blinded_model_comparison`;
- `study.casimir_dp.manifold_kernel_registry`; and
- `study.casimir_dp.evidence_map_stage3`.

Each badge must expose:

- maturity;
- evidence class;
- current status;
- prerequisites/upstream hashes;
- primary observable;
- falsifier;
- blocked/not-ready reasons;
- maximum claim; and
- artifact/report references.

Required graph behavior:

- Stage 2 and proposal closure feed the Stage-3 aggregator;
- the complex-coherence, QED-noise, DP-companion, and gravity-bound badges feed
  joint model comparison;
- the manifold registry gates only the new bridge lane;
- the joint comparison and registry feed the existing claim-boundary badge;
  and
- no badge edge permits a blocked bridge to upgrade collapse/manifold claims.

Preserve the graph-wide badge boundary:

```ts
diagnosticOnly: true,
doesValidateNHM2: false,
validationClaimAllowed: false,
physicalMechanismClaimAllowed: false,
promotionAllowed: false
```

An unregistered bridge remains a `requires`/`blocks` relation. Do not add a
`validates` edge or an `observableBridge` merely because its schema exists. A
blocked hypothesis badge must not expose a calculator payload that makes the
missing dynamics look executable.

Update the badge test's frozen node/edge counts and provenance markers
intentionally.

## Math-Maturity and Root-to-Leaf Repair

The current executable math registry contains the Stage-2 phase/coherence and
OR/phase entries, but the human `MATH_STATUS.md` mirror and `MATH_GRAPH.json`
do not fully expose their dependency/maturity relationship.

The patch must:

1. add the existing Stage-2 entries to `MATH_STATUS.md`;
2. add every Stage-3 module to `shared/math-stage.ts` and `MATH_STATUS.md`;
3. add truthful dependency edges to `MATH_GRAPH.json`;
4. expose that the Stage-2/Stage-3 DP compositor depends on exploratory
   `shared/dp-collapse.ts`;
5. let the least-mature dependency constrain the affected claim, or split
   per-lane maturity so QED diagnostic work does not silently promote the DP
   lane;
6. never add an undocumented maturity waiver; and
7. regenerate math reports and pass math validation.

Use these initial maturity/claim ceilings unless the implementation supplies
stronger evidence and the repository's validators independently admit it:

| Addition | Initial math maturity | Maximum claim |
| --- | --- | --- |
| Complex coherence/echo | Stage 2 diagnostic when implemented as a tested extension of the existing phase module; otherwise Stage 1 reduced-order | Computational phase/dephasing/echo discrimination |
| Green-tensor/noise | Stage 1 reduced-order | Conditional QED/open-system budget; `not_ready` without measured material/noise closure |
| Regularized DP companion | Stage 1 reduced-order | Constraint or rejection of one named model and parameter set |
| Casimir gravitational bound | Stage 1 reduced-order until complete conserved source closure | Upper bound on `E/c^2`, vacuum weight, and ordinary phase |
| Blinded model comparison | Stage 2 diagnostic after preregistration, held-out, covariance, and stability checks | Comparison among specified models; unmatched residual remains unexplained |
| Manifold registry validator | Stage 2 diagnostic for contract validation; each candidate kernel remains Stage 0 exploratory until complete | Schema/consistency completeness, never mechanism validation |

Extend the existing root-to-leaf Casimir-DP path with:

- all six runtime artifacts;
- the Stage-3 integration test;
- the model-comparison falsifier;
- the manifold-registry first-fail rule;
- the measured-evidence prerequisite; and
- the retained maximum claim `diagnostic`.

## Paper and Proposal Edits

Add a section titled approximately:

> Stage-3 evidence map: what each result would and would not show

It must:

- explain the seven frozen lanes;
- include the outcome-to-claim table;
- distinguish OR's lifetime heuristic from dynamical DP;
- describe complex coherence and echo as dephasing controls;
- replace virtual-particle language with Green/noise observables;
- distinguish QED phase, ordinary gravitational phase, and nonunitary loss;
- explain why fixed-branch boundary dependence is not standard OR/DP;
- state that a registered bridge is a new hypothesis;
- state that independent gravitational/tensor evidence would be needed for a
  manifold claim; and
- retain `measured evidence not ready`, `collapse blocked`, and `manifold
  blocked` until real sidecars and registered dynamics pass.

Add a compact subsection correcting the NHM2 transfer:

- reusable: provenance discipline, sidecars, staged math, full apparatus
  bookkeeping, run order, tests, and certificate policy;
- not reusable as evidence: the car-scale amplified proxy, scalar pressure as
  weight, or NHM2 geometry/tensor receipts for a different apparatus.

## Source-to-Requirement Registry

Use primary sources for the scientific requirements and keep each claim within
the boundary below.

### Complex coherence and reversibility

- E. L. Hahn, "Spin Echoes,"
  [DOI 10.1103/PhysRev.80.580](https://doi.org/10.1103/PhysRev.80.580):
  supports echo recovery as a diagnostic for reversible phase dispersion; it
  does not make unrecovered loss unique to collapse.
- Z. Chen, P. J. Beierle, and H. Batelaan, "Spatial correlation in matter-wave
  interference as a measure of decoherence, dephasing, and entropy,"
  [DOI 10.1103/PhysRevA.97.043608](https://doi.org/10.1103/PhysRevA.97.043608):
  supports retaining correlation/reversibility information rather than
  visibility alone; it does not supply a Casimir or gravitational mechanism.
- K. Hornberger et al., "Collisional decoherence observed in matter wave
  interferometry,"
  [DOI 10.1103/PhysRevLett.90.160401](https://doi.org/10.1103/PhysRevLett.90.160401):
  supports quantitative environmental visibility loss and calibrated nuisance
  channels; it does not identify a fitted exponential with collapse.
- J. D. Perreault and A. D. Cronin, "Observation of Atom Wave Phase Shifts
  Induced by Van Der Waals Atom-Surface Interactions,"
  [DOI 10.1103/PhysRevLett.95.133201](https://doi.org/10.1103/PhysRevLett.95.133201):
  supports a measurable surface-induced matter-wave phase; it does not predict
  a boundary-dependent collapse rate.

These sources motivate complex coherence, phase conditioning, path/echo
controls, and quantitative environmental closure.

### Green tensors, material response, and noise

- H. T. Dung, L. Knöll, and D.-G. Welsch, "Three-dimensional quantization of
  the electromagnetic field in dispersive and absorbing inhomogeneous
  dielectrics,"
  [DOI 10.1103/PhysRevA.57.3931](https://doi.org/10.1103/PhysRevA.57.3931):
  supports the dyadic-Green-tensor/material-noise framework.
- S. Scheel and S. Y. Buhmann, "Macroscopic quantum electrodynamics—concepts
  and applications,"
  [DOI 10.2478/v10155-010-0092-x](https://doi.org/10.2478/v10155-010-0092-x):
  supports Green-tensor calculations of position-dependent shifts, dispersion
  forces, relaxation, and surface-assisted fluctuations.
- C. Henkel, S. Pötting, and M. Wilkens, "Loss and heating of particles in
  small and noisy traps,"
  [DOI 10.1007/s003400050823](https://doi.org/10.1007/s003400050823):
  supports deriving near-surface heating/loss from electromagnetic noise
  spectra.
- R. L. Jaffe, "Casimir effect and the quantum vacuum,"
  [DOI 10.1103/PhysRevD.72.021301](https://doi.org/10.1103/PhysRevD.72.021301):
  supports formulating Casimir observables through QED/material interactions
  without treating virtual-particle events as measured clocks.

These sources motivate a material- and measurement-constrained Green/noise
runtime. They do not support a gravitational or collapse interpretation of
ordinary QED effects.

### OR and regularized dynamical DP

- R. Penrose, "On Gravity's Role in Quantum State Reduction,"
  [DOI 10.1007/BF02105068](https://doi.org/10.1007/BF02105068):
  supports the gravitational self-energy lifetime heuristic; it does not
  provide a unique stochastic line shape, heating law, radiation law, or
  Casimir bridge.
- L. Diósi, "Models for universal reduction of macroscopic quantum
  fluctuations,"
  [DOI 10.1103/PhysRevA.40.1165](https://doi.org/10.1103/PhysRevA.40.1165):
  supports an explicit mass-density-based stochastic reduction dynamics.
- M. Bahrami, A. Smirne, and A. Bassi, "Role of gravity in the collapse of a
  wave function: A probe into the Diósi-Penrose model,"
  [DOI 10.1103/PhysRevA.90.062105](https://doi.org/10.1103/PhysRevA.90.062105):
  supports the physical importance of regularization and associated energy
  increase; it does not license choosing a cutoff after seeing the data.
- S. Donadi et al., "Underground test of gravity-related wave function
  collapse,"
  [DOI 10.1038/s41567-020-1008-4](https://doi.org/10.1038/s41567-020-1008-4):
  supports a radiation companion constraint and reports the natural
  parameter-free DP version ruled out; it does not exclude every regularized
  or dissipative variant or Penrose's heuristic as a whole.

These sources require separate OR and named dynamical-DP lanes and one frozen
parameter receipt across all DP companion channels.

### Full-apparatus gravitational accounting

- K. A. Milton et al., "How does Casimir energy fall? IV. Gravitational
  interaction of regularized quantum vacuum energy,"
  [DOI 10.1103/PhysRevD.89.064027](https://doi.org/10.1103/PhysRevD.89.064027):
  supports gravitational accounting that includes interaction and
  renormalized apparatus/surface contributions in the paper's model; it does
  not supply a universal number for a real multilayer apparatus.
- S. A. Fulling et al., "How Does Casimir Energy Fall?,"
  [DOI 10.1103/PhysRevD.76.025004](https://doi.org/10.1103/PhysRevD.76.025004):
  supports equivalence-principle bookkeeping for Casimir energy in the modeled
  apparatus and cautions against isolating a force from complete energy
  accounting.
- A. Allocca et al., "Weighing the vacuum with the Archimedes experiment,"
  [DOI 10.1142/S0217751X24430280](https://doi.org/10.1142/S0217751X24430280):
  supports vacuum-weight measurement as a concrete, noise-limited experimental
  program; it does not report that the vacuum has already been weighed.
- R. Colella, A. W. Overhauser, and S. A. Werner, "Observation of
  Gravitationally Induced Quantum Interference,"
  [DOI 10.1103/PhysRevLett.34.1472](https://doi.org/10.1103/PhysRevLett.34.1472):
  supports ordinary gravitational potential phase in matter-wave
  interferometry; it does not establish objective collapse.

These sources motivate complete apparatus `Delta E`/`Delta T_munu`, weight,
and ordinary phase as separate upper-bound outputs.

### Joint model comparison

- S. Laing and J. Bateman, "Bayesian inference for near-field interferometric
  tests of collapse models,"
  [DOI 10.1103/PhysRevA.110.012214](https://doi.org/10.1103/PhysRevA.110.012214):
  supports joint inference over collapse and ordinary-decoherence parameters
  and experimental controls; it does not support the proposed Casimir bridge
  or an ontological proof from a Bayes factor.
- M. Toroš and A. Bassi, "Bounds on quantum collapse models from matter-wave
  interferometry: calculational details,"
  [DOI 10.1088/1751-8121/aaabc6](https://doi.org/10.1088/1751-8121/aaabc6):
  supports mapping specified master equations into interferometric
  distributions and exclusion regions; it does not support an unnamed generic
  collapse score.
- S. Nimmrichter and K. Hornberger, "Macroscopicity of Mechanical Quantum
  Superposition States,"
  [DOI 10.1103/PhysRevLett.110.160403](https://doi.org/10.1103/PhysRevLett.110.160403):
  supports reporting the macrorealistic modifications an experiment excludes
  as a function of mass, separation, and time; it does not turn
  "macroscopicity" into evidence that collapse occurred.

These sources motivate model-specific likelihoods, exclusion regions,
controls, and sensitivity statements. The blind/custodian workflow is an
experiment-governance requirement inherited from the current proposal, not a
physics conclusion supplied by these papers.

### Manifold/stochastic-kernel registration

- R. Martín and E. Verdaguer, "Stochastic semiclassical gravity,"
  [DOI 10.1103/PhysRevD.60.084008](https://doi.org/10.1103/PhysRevD.60.084008):
  supports a causal Einstein-Langevin framework with stress-energy
  fluctuations and noise/dissipation kernels; it does not supply objective
  collapse or a Casimir-conditioned DP rate.
- N. G. Phillips and B. L. Hu, "Noise kernel in stochastic gravity and stress
  energy bitensor of quantum fields in curved spacetimes,"
  [DOI 10.1103/PhysRevD.63.104001](https://doi.org/10.1103/PhysRevD.63.104001):
  supports a tensor stress-energy two-point noise kernel; it does not permit a
  scalar vacuum frequency to replace that bitensor.
- G. Lindblad, "On the generators of quantum dynamical semigroups,"
  [DOI 10.1007/BF01608499](https://doi.org/10.1007/BF01608499):
  supports complete positivity for Markovian quantum dynamical semigroups; it
  does not prove that any proposed gravitational generator exists, and a
  non-Markovian kernel needs its own consistency analysis.

These sources motivate the registry fields and fail-closed behavior. They do
not provide the missing Casimir-to-collapse kernel.

## Definition of Done

The implementation is complete only when:

- all six modules and the Stage-3 orchestrator exist with versioned schemas;
- Stage-2 config/report/receipt hashes are consumed as immutable upstream
  authorities;
- every numerical output has units, uncertainty, provenance, evidence class,
  maturity, and maximum-claim fields;
- complex coherence, phase conditioning, echo, and decay-shape diagnostics
  recover deterministic fixtures;
- the QED lane derives mean and noise outputs from the same measurement-
  constrained material/geometry receipt;
- a named dynamical DP model uses one frozen parameter manifest across
  coherence and every applicable companion observable;
- the gravity runtime never substitutes force for energy or a partial source
  for a full apparatus;
- blind model definitions are frozen before the custodian unblinding action;
- the manifold registry returns no numerical bridge output while incomplete;
- the human and machine outcome maps agree;
- paper, proposal, equation sidecars, badges, math maturity, provenance, and
  root-to-leaf artifacts agree;
- synthetic runs pass while measured/collapse/manifold status remains
  `not_ready`/`blocked` unless actual evidence satisfies the gates; and
- all required verification below passes.

## Required Verification

First run the focused Stage-3 tests:

```bash
npx vitest run \
  tests/casimir-dp-complex-coherence.spec.ts \
  tests/casimir-dp-qed-green-noise.spec.ts \
  tests/casimir-dp-dp-companion.spec.ts \
  tests/casimir-dp-gravity-upper-bound.spec.ts \
  tests/casimir-dp-model-comparison.spec.ts \
  tests/casimir-dp-manifold-kernel-registry.spec.ts \
  tests/casimir-dp-evidence-map-stage3.spec.ts \
  tests/casimir-dp-phase-coherence.spec.ts \
  tests/casimir-dp-or-phase-stage2.spec.ts \
  shared/theory/__tests__/casimir-dp-study-theory-badges.spec.ts \
  tests/physics-root-leaf-manifest.spec.ts
```

Regenerate and validate documentation/math artifacts with the exact available
package scripts:

```bash
npm run docs:equation-actions:generate
npm run docs:equation-actions:check
npm run math:report
npm run math:validate
npm run math:congruence:check:strict
npm run validate:physics:root-leaf
npm run audit:toe:preflight
```

Because this implementation touches a GR upper-bound module, proof maturity,
and the root-to-leaf physics bridge, also run every test required by
`WARP_AGENTS.md`:

```bash
npx vitest run \
  tests/theory-checks.spec.ts \
  tests/stress-energy-brick.spec.ts \
  tests/york-time.spec.ts \
  tests/gr-agent-loop.spec.ts \
  tests/gr-agent-loop-baseline.spec.ts \
  tests/gr-constraint-gate.spec.ts \
  tests/gr-constraint-network.spec.ts \
  tests/stress-energy-matter.spec.ts \
  tests/helix-ask-graph-resolver.spec.ts \
  tests/natario-metric-t00.spec.ts \
  tests/warp-metric-adapter.spec.ts \
  tests/warp-viability.spec.ts \
  tests/proof-pack.spec.ts \
  tests/proof-pack-strict-parity.spec.ts \
  tests/pipeline-ts-qi-guard.spec.ts \
  tests/qi-guardrail.spec.ts \
  tests/lattice-probe-guardrails.spec.ts \
  client/src/components/__tests__/warp-proof-ts-strict.spec.tsx
```

Then run adapter verification and training-trace export according to the
current `verify-gr-math` workflow:

```bash
npm run casimir:verify -- --ci --trace-out artifacts/training-trace.jsonl --url <adapter-url>
```

If the adapter requires authentication, use the repository's configured bearer
token and tenant headers without recording secrets in artifacts or logs.

Do not claim full completion if:

- any required test fails;
- the physics root-to-leaf validator fails;
- the first HARD Casimir constraint fails;
- the verdict is not `PASS`;
- a required certificate hash is absent;
- certificate integrity is not `OK`; or
- adapter verification is unavailable.

When the adapter is unavailable, report the implementation and local test
results separately and state that Casimir verification/certificate status is
blocked. Never reuse the prior Stage-2 certificate as proof of the new patch.

## Final Handoff Format for the Implementing Codex

The implementation handoff must report:

1. files changed and the new Stage-3 receipt hash;
2. which outputs are synthetic, measured, `not_ready`, or `blocked`;
3. the outcome-to-claim rows exercised by tests or real data;
4. which DP variant and parameter-manifest hash were used;
5. the QED material/Green/noise receipt hashes;
6. the complete-apparatus ledger status;
7. the manifold-registry first failure, if still blocked;
8. math/root-to-leaf maturity and claim ceiling;
9. focused and WARP-required test results;
10. Casimir verifier verdict, first failure if any, certificate hash, and
    integrity status; and
11. a plain statement of what the patch still does not establish.

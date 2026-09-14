Program gate: Deferred G2/G5 supporting study; G1 remains the sole active gate
Workstream: StarSim three-dimensional convection and transport diagnostics
Capability or component: MESA background import, bounded convection experiment, and transport-to-observables comparison
Current maturity: reduced_order_diagnostic (parent program); proposed extension has no execution evidence
Target maturity: transport_solver_experiment, subject to the parent program gates
Required frozen inputs: Accepted G1 profile and hashes; solver release and equations; domain, units, boundary conditions, driving, diffusivities, rotation, numerical controls, and acceptance tolerances
Required evidence: Background compatibility residuals, solver logs, conservation budgets, convergence and uncertainty estimates, transport diagnostics, and parent-bound MESA/GYRE comparisons
Stop/fail criteria: Missing baseline provenance, incompatible equations or background, unresolved budgets or gradients, unconverged diagnostics, or unjustified transport mapping
Explicit non-goals: Whole-Sun simulation, proof of a singularity, actuator feasibility, lifetime-extension claims from flow alone, or NHM2/warp proof promotion
Downstream gate unlocked: None automatically; accepted diagnostics may inform a separately preregistered G2/G3 transport family and G5 comparison

# StarSim three-dimensional convection extension

Planning date: September 12, 2026.

Governing roadmap: [Controlled Stellar Composition Transport Work Program](./controlled-stellar-composition-transport-work-program.md).
This packet records the user-supplied proposal to connect stellar structure,
internal flows, measured transport, and observations. The supplied review cited
repository commit `0f25f35` and reported no executed benchmarks; its descriptions
are historical context, not fresh runtime evidence. The extension is deferred.
While G1 is active, only literature and interface inventory for this study may
proceed in parallel. Numerical execution requires an accepted G1 baseline and
explicit admission in the governing roadmap.

## Research question and placement

Can a bounded three-dimensional convection calculation produce converged heat,
composition, and angular-momentum transport diagnostics whose justified mapping
into a stellar-evolution model changes predicted structure and observables?

The reduced-order `structure_1d` lane does not evolve a velocity field. The
existing `structure_mesa` and `oscillation_gyre` worker paths provide integration
patterns described in [the worker documentation](../starsim/mesa-gyre-worker.md).
A convection lane would need its own validated domain and artifacts. No new
runtime lane or API contract is implemented by this packet.

Rayleigh is a candidate for the spherical convection solver. The supplied
proposal identifies a MESA reference-state import example and Boussinesq or
anelastic formulations. Before selecting it, record the exact official example,
documentation revision, supported equations, and executable release. Solver
selection remains open until that compatibility review is complete.

## Additional proposal intake and scope

The September 12 follow-up notes propose a Sun-first transport laboratory and
a filtered momentum-transport benchmark. Their repository review cites
`0ecb965`; this is supplied historical context, not a new code or solver audit.
The underlying lecture transcripts and cited papers were not supplied with
these notes. Their source-specific assertions remain inventory items requiring
primary-source verification, not accepted numerical inputs or proof results.

The first proposed physics campaign asks whether a MESA-derived rotating
convection shell can carry its specified heat flux and develop a compatible
differential-rotation pattern without imposing that pattern, and how magnetic
backreaction changes the answer. Heat, species, angular-momentum, and magnetic
energy transport are results to measure, not visual proxies. A prescribed
rotation profile may support an induction experiment but cannot count as an
independently predicted rotation result.

Keep one canonical StarSim interface with independently bounded solver
capabilities. The Sun is the first target, not a restriction on all later
targets. The broader laboratory is a deferred scope inventory, not a replacement
for the parent lifetime-extension objective or a new active program. Atmospheric
and dynamo studies do not become prerequisites for G1-G6. Only C0 source and
interface planning is currently admitted; new execution packets need explicit
roadmap admission, frozen acceptance criteria, and the required packet header.

### Requirements from lecture material

For each extracted claim record the exact source/location, date and version,
evidence type (observation, model, interpretation, or open hypothesis), units,
uncertainty, verification state, and intended role: model requirement,
observable, boundary condition, or testable hypothesis. Correct transcription
errors against primary sources before use; preserve the original and correction.

Preserve polarized spectra as possible observational targets without adopting
a condensed-matter or metallic-hydrogen interpretation as the default EOS.
Any alternative must supply quantitative material properties and forward
predictions and face the same data and uncertainty policy as the baseline.
Terrestrial fusion configurations are not solar nuclear inputs. Keep the
preregistered solar reaction network and neutrino accounting independent of
lecture analogies. Unverified interpretations must not alter frozen G1 inputs.

### Deferred capability allocation

| Capability | Intended role and admission boundary |
| --- | --- |
| MESA background and GYRE comparison | Reproducible interior foundation; retain G1 calibration and G5 acceptance authority, with fitted versus held-out measurements explicitly separated |
| Rotating convection and meridional circulation | First proposed new fluid capability after background compatibility and ordinary benchmark verification; measure transport and force balances |
| Induction and magnetic backreaction | Separately labeled nonmagnetic, prescribed-flow induction, and fully coupled MHD experiments; do not equate field amplification with a self-consistent dynamo |
| Granulation, photospheric cooling, polarized spectra | Separate atmospheric and radiation domains; evaluate MURaM and suitable polarized-transfer tools as candidates, not selected or installed backends |
| Coronal heating and wind | Later bounded open-flux-tube experiment with explicit supplied energy; keep closed-loop heating separate and compare competing density/wave assumptions under matched inputs |
| Vortex-to-observation study | Later controlled atmospheric experiment with energy-transfer budgets, detector sensitivity, non-vortical controls, and synthetic Doppler/polarization comparisons; distinct from the mathematical benchmark |
| Flares, jets, CMEs | Event association and retrospective tests first; no forecasting claim from replay or timestamp coincidence |
| Dust and F-corona | Optional environmental/measurement-contamination component, not a convection requirement |
| Cloud collapse, accretion, and formation | Separate future program, not implicit coverage from evolving an initial stellar model |

For every candidate backend, verify release, equations, supported domain,
licensing, data requirements, and resource envelope before selection. Evaluate
CHIANTI only for a documented appropriate spectral domain; do not assume an
optically thin tool supplies general polarized photospheric transfer. These
are source-review requirements rather than claims of verified compatibility.

## Planned stages and acceptance evidence

| Stage | Work | Required evidence before proceeding |
| --- | --- | --- |
| C0 — Source and interface inventory | Identify the Rayleigh MESA-import example, governing equations, benchmark cases, and resource requirements | Versioned primary references, equation comparison, and bounded domain proposal; permissible planning work during G1 |
| C1 — Background compatibility | Import a suitable spherical shell from the accepted G1 profile | Parent profile hash; radial coordinate and unit map; density, pressure, temperature, gravity, composition, and entropy-gradient treatment; hydrostatic and thermal residuals below frozen tolerances |
| C2 — Controlled convection | Verify an ordinary reference benchmark, then a nonmagnetic rotating shell; use a nonrotating control where informative; admit magnetic extensions separately | Frozen forcing, heating, viscosity, thermal/compositional diffusivities, initial conditions, boundaries, resolution, timestep policy, and compute/storage budget; thermal relaxation, reference benchmark, and energy/angular-momentum budget closure |
| C3 — Transport diagnostics | Measure radial heat and species fluxes, Reynolds stresses and angular-momentum transport; magnetic stresses only for a validated magnetic case | Time-averaging interval, statistical uncertainty, local gradient/vorticity diagnostics, independent spatial and timestep refinement, and forcing/boundary sensitivity |
| C4 — Stellar-model feedback | Derive and test a limited closure or mixing prescription from accepted diagnostics | Units, averaging and timescale assumptions, calibration domain, uncertainty, and zero-change recovery; mass/species/energy accounting; no inference of core replenishment from a convection-zone-only shell |
| C5 — Observable comparison | Evolve matched baseline and modified models and export parent-bound profiles to GYRE | Fixed comparison inputs, propagated closure uncertainty, structure and mode residuals against independent observations, and applicable G5 chemical/neutrino/stability checks |

Reconcile equations of state, entropy gradients, radiative transport, nuclear
heating, and background energy balance explicitly at C1. Density interpolation
alone is insufficient. Record interpolation errors and the validity of the
selected approximation, including stratification and Mach-number limits. A
shell calculation must state what it excludes at the center, surface, and
radiative interior.

At C3 retain kinetic, thermal, and (when applicable) magnetic energy budgets,
mass continuity, species conservation, momentum and angular-momentum budgets,
boundary fluxes, forcing work, and dissipation. Set residual tolerances before
results. Global averages must be accompanied by local extrema and resolution
diagnostics. A diagnostic that changes materially under refinement stops
admission even if total kinetic energy appears well behaved.

At C4 a measured correlation is not automatically a diffusion coefficient.
Justify any inferred `D_mix(r,t)` or circulation closure, including positivity
where required, domain of validity, and uncertainty. A changed closure requires
a new versioned campaign; it cannot silently alter frozen G1/G3 inputs. Separate
calibration data from held-out observations used to judge improvement. Lifetime
deltas still require G4 evolution and G5 acceptance.

## Controlled magnetic comparison and synthetic observatory

After hydrodynamic verification, preregister three distinct experiment labels:
nonmagnetic flow, induction with prescribed flow, and fully coupled MHD with
magnetic forces in the momentum balance. Retain matched controls, initial-field
sensitivity, growth/decay and saturation diagnostics, changed rotation and
transport, magnetic-energy exchanges, and conservation residuals. Mark each
quantity as imposed, fitted, assimilated, or predicted. Imposed active-region
emergence does not demonstrate a self-generated dynamo.

Plan measurement operators alongside each physics domain:

```text
simulated state -> physical measurement/radiation model -> instrument response
                -> sampled predicted data -> uncertainty-aware residuals
```

Freeze calibration versus independent-test partitions before optimization;
do not relabel fitted seismic or neutrino quantities as held-out tests. Keep
near-surface mode corrections explicit and separate from interior adjustments.
Atmospheric comparisons must declare line formation, thermal/nonthermal line
width contributions, polarization assumptions, viewing geometry, resolution,
cadence, and spatial/temporal averaging. No image-only acceptance. A deep-shell
calculation does not acquire photospheric or chromospheric validity by refinement.

Report a disagreement map with separate residuals and covariance treatment for
each observation group. Vary opacity, composition, nuclear inputs, and transport
in separately identified sensitivity tests; an aggregate score must not conceal
one dataset worsening while another improves. Alternative hypotheses use the
same comparison rules. Any surrogate must state its tested domain and reject or
flag extrapolation rather than supply an unsupported physics result.

## Proposed coupling and execution requirements

These are requirements for a later design packet, not changes to an adapter
contract or the current worker protocol. Each run must identify equations and
approximations, domain and resolved scales, material properties, initial and
boundary conditions, forcing, units/reference frames, numerical controls, and
resource limits. Each transfer must identify fields or fluxes, parent hashes,
averaging/interpolation operations and errors, and conservation residuals.

Begin with one-way MESA background supply. Returning averaged closures to
stellar evolution is C4 work with separate consistency tests, not simultaneous
whole-Sun coupling. Preserve distinct clocks for stellar age, turbulent averaging,
atmospheric transients, and observation epochs. Historical magnetograms cannot
silently become contemporaneous boundaries for unrelated simulated events.

Heavy jobs should have preregistered memory, runtime, storage and checkpoint
budgets, retention rules, and explicit resource/validity stop reasons. Record
estimates and measured use; UI interactivity is not a solver acceptance test.

The proposed **Solar Transport v1** deliverables are a retained reproducible
stellar background and mode comparison, a verified rotating-convection result
with transport budgets, and an observational report separating inputs from
predictions. A hydrodynamic milestone may precede the controlled magnetic
comparison, which is the next proposed campaign, not an implied completed
capability. These deliverables do not close the parent intervention gates.

## Optional Navier–Stokes benchmark

The supplied text describes an unspecified vortex construction with local
velocity concentration and bounded total kinetic energy. Its paper, authors,
version, forcing, and theorem assumptions have not been identified here. Treat
this as a source-discovery task, not an accepted theorem or executable benchmark.

After ordinary reference benchmarks pass, assess whether a finite, computable
test can faithfully represent the cited equations, initial/boundary conditions,
forcing regularity, and comparison interval. Retain local velocity gradients,
vorticity, resolution-loss indicators, forcing work, dissipation, and energy and
momentum residuals. Numerical concentration does not demonstrate a singularity.

Constant-density incompressible continuity, `div(u) = 0`, differs from the
anelastic constraint `div(rho_0(r) u) = 0`. Thermal and magnetic couplings add
further obligations. A benchmark may validate only numerical components whose
equations and assumptions match; it cannot certify a stratified stellar model.
This optional benchmark is not a prerequisite for the baseline or convection
campaign and supplies no Einstein–Klein–Gordon or NHM2 proof evidence.

### Filter-aware momentum-closure experiment

The follow-up notes attribute an organized pulse/vortex feedback construction
to OpenAI. No identified paper or audited proof is retained here. Verify that
attribution and the asserted angular-average and momentum-flux properties from
the exact primary source before defining a benchmark. Do not add a
"singularity heating" term to a stellar model.

If a faithful finite reference can be constructed, freeze a controlled interval
before the claimed singular time, including forcing, corrections, boundaries,
reference error estimates, and resolution-loss stop criteria. Do not omit terms
needed for the momentum balance merely to make the test executable.

Specify the averaging/filter operator, width, coordinates, boundary treatment,
and discrete implementation. The paper's angular average is not automatically
a grid filter. For a defined constant-density filter, compare the reference
stress `tau_ij = overline(u_i u_j) - overline(u_i) overline(u_j)` and its
momentum-flux divergence with closure estimates. Include filter/derivative
commutation errors where relevant. Zero averaged fluctuations need not imply
zero correlated flux; test the actual stress rather than only mean velocity.

Use two acceptance steps: a priori comparison against filtered reference data,
then a posteriori coarse evolution with the selected closure. Compare against
no-model and declared baseline closures at matched cost/resolution; retain
stress, angular-momentum transport where applicable, energy exchange, resolved
evolution, and numerical uncertainty. Vary filter width, resolution, shear,
rotation, and boundaries within the declared test family. A coefficient that
fits one case is not universally validated.

Transfer to stellar flow requires a new derivation consistent with stratified
continuity, the selected density weighting, and thermal/magnetic equations;
do not copy the constant-density stress definition without that check. Separate
three error assessments: governing-equation validity, unresolved closure error,
and discretization/implementation error. Grid refinement cannot restore acoustic
modes excluded by an anelastic formulation; use a suitable separate oscillation
or compressible domain for acoustic observables.

The deliverable is an accuracy/cost map: equation regime, filter, closure,
resolution, observable or transport quantity, uncertainty, and failure boundary.
An incompressible momentum result does not establish heat or magnetic-transport
accuracy. Scientific benefit requires either exposing a relevant failure or
improving independent stellar tests; a null transfer result is retained.

## Planned artifacts and decision

Preserve solver/runtime fingerprints, mock/live separation, canonical inputs,
source-profile and output hashes, execution logs, restart/checkpoint lineage,
budget tables, averaging metadata, convergence studies, transport profiles,
closure mapping, and MESA/GYRE parent relationships. A future integration must
define its own schema and supported domain before runtime admission.

Report one of: incompatible background, unresolved numerical transport,
validated diagnostics without an admissible stellar closure, or a justified
closure eligible for the parent campaign. Retain failures and null observational
improvements. Any actuator study remains subject to G6 survivor eligibility and
the separate G7 energy, momentum, entropy, and stability requirements.

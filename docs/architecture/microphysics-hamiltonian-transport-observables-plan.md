# Microphysics Hamiltonian Transport Observables Plan

Date: 2026-03-25

Execution context:

- This plan is a parent-backbone follow-on to:
  - [gravitating-matter-observables-overlap-implementation-plan.md](C:/Users/dan/Desktop/RESEARCH%201,0/research/Alcubierre%20drive/casimirbot.com/versions/CasimirBot%20(9-3-25)/CasimirBot%20(9-3-25)/CasimirBot/docs/architecture/gravitating-matter-observables-overlap-implementation-plan.md)
  - [gravitational-response-self-gravity-shape-plan.md](C:/Users/dan/Desktop/RESEARCH%201,0/research/Alcubierre%20drive/casimirbot.com/versions/CasimirBot%20(9-3-25)/CasimirBot%20(9-3-25)/CasimirBot/docs/architecture/gravitational-response-self-gravity-shape-plan.md)
  - [granular-tidal-sunquake-bridge-plan.md](C:/Users/dan/Desktop/RESEARCH%201,0/research/Alcubierre%20drive/casimirbot.com/versions/CasimirBot%20(9-3-25)/CasimirBot%20(9-3-25)/CasimirBot/docs/architecture/granular-tidal-sunquake-bridge-plan.md)
  - [orch-or-time-crystal-research-packet.md](C:/Users/dan/Desktop/RESEARCH%201,0/research/Alcubierre%20drive/casimirbot.com/versions/CasimirBot%20(9-3-25)/CasimirBot%20(9-3-25)/CasimirBot/docs/architecture/orch-or-time-crystal-research-packet.md)
- Use [gravitating-matter-astrochemistry-source-catalog-2026-03-25.md](C:/Users/dan/Desktop/RESEARCH%201,0/research/Alcubierre%20drive/casimirbot.com/versions/CasimirBot%20(9-3-25)/CasimirBot%20(9-3-25)/CasimirBot/docs/audits/research/gravitating-matter-astrochemistry-source-catalog-2026-03-25.md) as the normalized citation inventory.
- Use [stellar-consciousness-ii-method-review-2026-03-25.md](C:/Users/dan/Desktop/RESEARCH%201,0/research/Alcubierre%20drive/casimirbot.com/versions/CasimirBot%20(9-3-25)/CasimirBot%20(9-3-25)/CasimirBot/docs/audits/research/stellar-consciousness-ii-method-review-2026-03-25.md) for the admissibility boundary on stellar-observable methods.

## Goal

Add the missing shared parent lane between particle physics, many-body Hamiltonian formalisms, kinetic and transport closure, and the already-implemented granular-tidal and stellar flare-to-sunquake observable lanes.

The point is not to claim that all macroscopic observables are directly Hamiltonian in a closed-system sense.

The correct executable chain is:

- `particle physics -> effective microphysics -> effective interaction Hamiltonian -> many-body statistical or kinetic description -> transport or constitutive closure -> collective forcing and response -> observables`

This keeps the repo physically coherent when connecting:

- intermolecular or interatomic interactions
- density and pressure response
- granular contact dissipation and rubble-pile rheology
- tidal lag, `Q`, Love response, and spin evolution
- plasma transport, reconnection, nanoflares, and sunquakes

## Correct Parent Theory

Use this shared statement:

- conservative Hamiltonian microdynamics supplies the interaction backbone
- coarse-graining, kinetic theory, and transport closure supply dissipation and observable-scale response

That means:

- particle physics does matter
- Hamiltonians do matter
- but observables such as tidal lag, `Q`, flare heating, and sunquake forcing are not produced by conservative Hamiltonians alone

They require:

- statistical mechanics
- kinetic theory
- constitutive closure
- dissipative transport
- forcing geometry

## Non-Goals

Do not encode any of these as mature or certified claims:

- `hamiltonian_forces_alone_explain_tidal_dissipation`
- `closed_system_quantum_coherence_explains_sunquakes`
- `particle_physics_directly_solves_planetary_shape_without_material_closure`
- `plasma_reconnection_is_the_same_mechanism_as_gravitational_tide_response`

The mature statement is narrower:

- microphysical interactions determine effective material and plasma properties
- those effective properties determine how matter responds under gravity, rotation, tides, magnetic stressing, and flare forcing

## Shared Theory Map

### 1. Particle Physics To Effective Microphysics

Use this branch:

- electromagnetic interactions
  - bonding
  - elasticity
  - contact forces
  - conductivity and resistivity
- strong and weak interactions
  - composition and reaction channels
  - stellar reaction energetics where relevant
- effective microphysical outputs
  - interaction potentials
  - cross sections
  - collision rates
  - opacity
  - conductivity
  - elastic and frictional response

Repo consequence:

- particle physics should not connect directly to precession, potato radius, or sunquake nodes
- it should connect through effective microphysics and closure nodes

### 2. Effective Interaction Hamiltonian And Many-Body Description

Use this branch:

- effective interaction Hamiltonian
- many-body Hamiltonian
- partition function and free-energy formalisms
- kinetic distribution or hierarchy
- weakly perturbed external-potential response

Repo consequence:

- the existing thermodynamics lane is already the correct parent for:
  - many-body Hamiltonian
  - partition functions
  - free-energy response
  - external-potential minimization
- the missing layer is the explicit bridge from that lane to:
  - granular constitutive closure
  - plasma transport closure

### 3. Coarse-Grained Closure

Use this split:

- constitutive response closure
  - EOS
  - compressibility
  - yield strength
  - viscosity
  - friction and inelasticity
  - Love-number-style response
- kinetic and transport closure
  - collision frequency
  - conductivity or resistivity
  - opacity and transport
  - MHD or kinetic-to-fluid closure
  - source and damping terms

Repo consequence:

- this is the missing layer that lets Hamiltonian-based matter descriptions feed the already-built observable lanes without over-claiming

### 4. Collective Forcing And Observable Response

After closure, the existing regime-specific lanes remain valid:

- granular and self-gravitating body lane
  - tidal lag
  - `Q`
  - `k2`
  - shape response
  - spin evolution
  - angular-momentum redistribution
- stellar magnetized plasma lane
  - reconnection
  - nanoflare heating
  - pressure impulse
  - sunquake response
  - helioseismic observables

## Proposed Tree + DAG Additions

### A. Shared Parent Tree

Add a new shared tree:

- [docs/knowledge/physics/physics-microphysics-transport-tree.json](C:/Users/dan/Desktop/RESEARCH%201,0/research/Alcubierre%20drive/casimirbot.com/versions/CasimirBot%20(9-3-25)/CasimirBot%20(9-3-25)/CasimirBot/docs/knowledge/physics/physics-microphysics-transport-tree.json)

Add definition nodes:

- `physics-microphysics-transport-effective-microphysics-definition`
- `physics-microphysics-transport-effective-interaction-hamiltonian-definition`
- `physics-microphysics-transport-many-body-hamiltonian-definition`
- `physics-microphysics-transport-kinetic-theory-definition`
- `physics-microphysics-transport-kinetic-transport-closure-definition`
- `physics-microphysics-transport-constitutive-response-definition`
- `physics-microphysics-transport-plasma-transport-closure-definition`
- `physics-microphysics-transport-collective-observable-response-definition`

Add bridge edges:

- `effective_microphysics_definition -> effective_interaction_hamiltonian_definition`
- `effective_interaction_hamiltonian_definition -> many_body_hamiltonian_definition`
- `many_body_hamiltonian_definition -> kinetic_theory_definition`
- `many_body_hamiltonian_definition -> constitutive_response_definition`
- `kinetic_theory_definition -> kinetic_transport_closure_definition`
- `kinetic_transport_closure_definition -> plasma_transport_closure_definition`
- `constitutive_response_definition -> collective_observable_response_definition`
- `plasma_transport_closure_definition -> collective_observable_response_definition`

Why a separate tree:

- it prevents overloading the thermodynamics tree with granular and plasma transport semantics
- it provides one clean parent that both the granular and stellar runtime lanes can descend from

### B. Thermodynamics Bridge

Bridge the existing equilibrium-response lane into the new parent tree:

- [physics-thermodynamics-entropy-tree.json](C:/Users/dan/Desktop/RESEARCH%201,0/research/Alcubierre%20drive/casimirbot.com/versions/CasimirBot%20(9-3-25)/CasimirBot%20(9-3-25)/CasimirBot/docs/knowledge/physics/physics-thermodynamics-entropy-tree.json)

Add or upgrade bridge nodes:

- `bridge-effective-intermolecular-potential-to-many-body-hamiltonian`
- `bridge-many-body-hamiltonian-to-constitutive-response`
- `bridge-external-potential-response-to-collective-observable-response`

Bridge edges:

- `intermolecular_potential_definition -> effective_microphysics_definition`
- `many_body_statistical_mechanics_definition -> many_body_hamiltonian_definition`
- `classical_density_functional_theory_definition -> collective_observable_response_definition`

### C. Granular And Tidal Lane Bridge

Upgrade the self-gravity lane so it explicitly descends from the new parent:

- [physics-self-gravity-shape-tree.json](C:/Users/dan/Desktop/RESEARCH%201,0/research/Alcubierre%20drive/casimirbot.com/versions/CasimirBot%20(9-3-25)/CasimirBot%20(9-3-25)/CasimirBot/docs/knowledge/physics/physics-self-gravity-shape-tree.json)

Add bridge nodes:

- `bridge-effective-microphysics-to-granular-contact-dynamics`
- `bridge-constitutive-response-to-rubble-pile-rheology`

Bridge edges:

- `constitutive_response_definition -> granular_collision_dissipation_definition`
- `constitutive_response_definition -> porous_rubble_pile_rheology_definition`
- `kinetic_transport_closure_definition -> tidal_quality_factor_definition`
- `collective_observable_response_definition -> granular_tidal_response_diagnostic`

### D. Stellar Plasma Lane Bridge

Upgrade the stellar lane so it explicitly descends from the new parent:

- [physics-stellar-structure-nucleosynthesis-tree.json](C:/Users/dan/Desktop/RESEARCH%201,0/research/Alcubierre%20drive/casimirbot.com/versions/CasimirBot%20(9-3-25)/CasimirBot%20(9-3-25)/CasimirBot/docs/knowledge/physics/physics-stellar-structure-nucleosynthesis-tree.json)

Add bridge nodes:

- `bridge-effective-microphysics-to-plasma-equation-of-state`
- `bridge-kinetic-transport-closure-to-kinetic-mhd-closure`
- `bridge-plasma-transport-to-flare-sunquake-response`

Bridge edges:

- `effective_microphysics_definition -> stellar_equation_of_state_definition`
- `kinetic_transport_closure_definition -> plasma_transport_closure_definition`
- `plasma_transport_closure_definition -> nanoflare_heating_definition`
- `plasma_transport_closure_definition -> flare_particle_precipitation_definition`
- `collective_observable_response_definition -> stellar_flare_sunquake_diagnostic`
- `collective_observable_response_definition -> sunquake_timing_replay_diagnostic`

### E. Guardrail Boundary

Keep the exploratory branch isolated:

- [physics-quantum-semiclassical-tree.json](C:/Users/dan/Desktop/RESEARCH%201,0/research/Alcubierre%20drive/casimirbot.com/versions/CasimirBot%20(9-3-25)/CasimirBot%20(9-3-25)/CasimirBot/docs/knowledge/physics/physics-quantum-semiclassical-tree.json)
- [astrochemistry-prebiotic-neuro-consciousness-bridge-tree.json](C:/Users/dan/Desktop/RESEARCH%201,0/research/Alcubierre%20drive/casimirbot.com/versions/CasimirBot%20(9-3-25)/CasimirBot%20(9-3-25)/CasimirBot/docs/knowledge/bridges/astrochemistry-prebiotic-neuro-consciousness-bridge-tree.json)

Add or preserve guardrails:

- `sunquake_not_quantum_collapse`
- `stellar_plasma_observables_not_consciousness`
- `hamiltonian_microdynamics_not_sufficient_for_observable_dissipation`

## Math-Claims And Equation Backbone

### A. New Math-Claims File

Add:

- [docs/knowledge/math-claims/microphysics-transport.math-claims.json](C:/Users/dan/Desktop/RESEARCH%201,0/research/Alcubierre%20drive/casimirbot.com/versions/CasimirBot%20(9-3-25)/CasimirBot%20(9-3-25)/CasimirBot/docs/knowledge/math-claims/microphysics-transport.math-claims.json)

Add claims:

- `claim:microphysics.transport:effective_microphysics`
- `claim:microphysics.transport:effective_interaction_hamiltonian`
- `claim:microphysics.transport:many_body_hamiltonian`
- `claim:microphysics.transport:kinetic_theory`
- `claim:microphysics.transport:kinetic_transport_closure`
- `claim:microphysics.transport:constitutive_response`
- `claim:microphysics.transport:plasma_transport_closure`

### B. Equation Backbone

Update:

- [physics-equation-backbone.v1.json](C:/Users/dan/Desktop/RESEARCH%201,0/research/Alcubierre%20drive/casimirbot.com/versions/CasimirBot%20(9-3-25)/CasimirBot%20(9-3-25)/CasimirBot/configs/physics-equation-backbone.v1.json)

Add diagnostic or definition-level equations:

- `effective_interaction_hamiltonian_with_external_potential`
- `many_body_partition_function_definition`
- `kinetic_moment_closure_definition`
- `constitutive_response_closure`
- `effective_granular_dissipation_scaling`
- `plasma_transport_energy_closure`

Maturity rule:

- `effective_interaction_hamiltonian_with_external_potential`
- `many_body_partition_function_definition`
- `kinetic_moment_closure_definition`
  - may sit at definition or reduced-order maturity
- `effective_granular_dissipation_scaling`
- `plasma_transport_energy_closure`
  - should remain diagnostic

## Knowledge Anchors To Add

Add source-backed docs:

- [docs/knowledge/physics/effective-microphysics.md](C:/Users/dan/Desktop/RESEARCH%201,0/research/Alcubierre%20drive/casimirbot.com/versions/CasimirBot%20(9-3-25)/CasimirBot%20(9-3-25)/CasimirBot/docs/knowledge/physics/effective-microphysics.md)
- [docs/knowledge/physics/effective-interaction-hamiltonian.md](C:/Users/dan/Desktop/RESEARCH%201,0/research/Alcubierre%20drive/casimirbot.com/versions/CasimirBot%20(9-3-25)/CasimirBot%20(9-3-25)/CasimirBot/docs/knowledge/physics/effective-interaction-hamiltonian.md)
- [docs/knowledge/physics/kinetic-theory-closure.md](C:/Users/dan/Desktop/RESEARCH%201,0/research/Alcubierre%20drive/casimirbot.com/versions/CasimirBot%20(9-3-25)/CasimirBot%20(9-3-25)/CasimirBot/docs/knowledge/physics/kinetic-theory-closure.md)
- [docs/knowledge/physics/constitutive-response.md](C:/Users/dan/Desktop/RESEARCH%201,0/research/Alcubierre%20drive/casimirbot.com/versions/CasimirBot%20(9-3-25)/CasimirBot%20(9-3-25)/CasimirBot/docs/knowledge/physics/constitutive-response.md)
- [docs/knowledge/physics/plasma-transport-closure.md](C:/Users/dan/Desktop/RESEARCH%201,0/research/Alcubierre%20drive/casimirbot.com/versions/CasimirBot%20(9-3-25)/CasimirBot%20(9-3-25)/CasimirBot/docs/knowledge/physics/plasma-transport-closure.md)

These should become the stable paper-binding anchors for future overlap work.

## Runtime And Proof Surface Patch Set

### A. HaloBank Runtime

The runtime diagnostics already exist and should be re-parented through the new backbone, not re-written:

- [server/modules/halobank-solar/derived.ts](C:/Users/dan/Desktop/RESEARCH%201,0/research/Alcubierre%20drive/casimirbot.com/versions/CasimirBot%20(9-3-25)/CasimirBot%20(9-3-25)/CasimirBot/server/modules/halobank-solar/derived.ts)
- [server/routes/halobank-solar.ts](C:/Users/dan/Desktop/RESEARCH%201,0/research/Alcubierre%20drive/casimirbot.com/versions/CasimirBot%20(9-3-25)/CasimirBot%20(9-3-25)/CasimirBot/server/routes/halobank-solar.ts)
- [configs/halobank-solar-diagnostic-datasets.v1.json](C:/Users/dan/Desktop/RESEARCH%201,0/research/Alcubierre%20drive/casimirbot.com/versions/CasimirBot%20(9-3-25)/CasimirBot%20(9-3-25)/CasimirBot/configs/halobank-solar-diagnostic-datasets.v1.json)
- [configs/halobank-solar-thresholds.v1.json](C:/Users/dan/Desktop/RESEARCH%201,0/research/Alcubierre%20drive/casimirbot.com/versions/CasimirBot%20(9-3-25)/CasimirBot%20(9-3-25)/CasimirBot/configs/halobank-solar-thresholds.v1.json)

Add proof and claim bridge surfaces:

- [halobank-solar.math-claims.json](C:/Users/dan/Desktop/RESEARCH%201,0/research/Alcubierre%20drive/casimirbot.com/versions/CasimirBot%20(9-3-25)/CasimirBot%20(9-3-25)/CasimirBot/docs/knowledge/math-claims/halobank-solar.math-claims.json)
- [halobank-solar-proof-tree.json](C:/Users/dan/Desktop/RESEARCH%201,0/research/Alcubierre%20drive/casimirbot.com/versions/CasimirBot%20(9-3-25)/CasimirBot%20(9-3-25)/CasimirBot/docs/knowledge/halobank-solar-proof-tree.json)

New bridge claims:

- `claim:halobank.solar:granular_tidal_response_backbone_bridge`
- `claim:halobank.solar:stellar_flare_sunquake_backbone_bridge`

### B. Paper Ingestion And Atlas

Update:

- [scripts/paper-framework-binding.ts](C:/Users/dan/Desktop/RESEARCH%201,0/research/Alcubierre%20drive/casimirbot.com/versions/CasimirBot%20(9-3-25)/CasimirBot%20(9-3-25)/CasimirBot/scripts/paper-framework-binding.ts)
- [scripts/paper-gpt-pro-packet.ts](C:/Users/dan/Desktop/RESEARCH%201,0/research/Alcubierre%20drive/casimirbot.com/versions/CasimirBot%20(9-3-25)/CasimirBot%20(9-3-25)/CasimirBot/scripts/paper-gpt-pro-packet.ts)
- [configs/graph-resolvers.json](C:/Users/dan/Desktop/RESEARCH%201,0/research/Alcubierre%20drive/casimirbot.com/versions/CasimirBot%20(9-3-25)/CasimirBot%20(9-3-25)/CasimirBot/configs/graph-resolvers.json)
- [configs/resolver-owner-coverage-manifest.v1.json](C:/Users/dan/Desktop/RESEARCH%201,0/research/Alcubierre%20drive/casimirbot.com/versions/CasimirBot%20(9-3-25)/CasimirBot%20(9-3-25)/CasimirBot/configs/resolver-owner-coverage-manifest.v1.json)

Add canonical targets:

- effective microphysics
- effective interaction Hamiltonian
- kinetic theory
- constitutive response
- plasma transport closure

Purpose:

- make papers on Hamiltonians, transport closure, granular rheology, or plasma transport land on the correct parent lane instead of binding directly to downstream diagnostics

## Research Basis

### Effective Microphysics And Hamiltonian Backbone

1. Born and Oppenheimer, `Zur Quantentheorie der Molekeln`.
   - https://doi.org/10.1002/andp.19273892002
   - Use: electronic-structure-to-effective-potential logic.

2. McDaniels and Schmidt, `Next-Generation Force Fields from Symmetry-Adapted Perturbation Theory`.
   - https://doi.org/10.1146/annurev-physchem-040215-112047
   - Use: effective interaction decomposition and force-field construction from electronic structure.

3. Lecture notes on interacting classical systems and N-particle Hamiltonians.
   - https://home.uni-leipzig.de/~tet/wp-content/uploads/2016/02/datei.pdf
   - Use: many-body Hamiltonian with pair interactions and external potentials.

4. Evans, `The nature of the liquid-vapour interface and other topics in the statistical mechanics of non-uniform, classical fluids`.
   - https://doi.org/10.1080/00018737900101365
   - Use: free-energy and external-potential response as the equilibrium bridge.

These are already anchored locally in:

- [many-body-statistical-mechanics.md](C:/Users/dan/Desktop/RESEARCH%201,0/research/Alcubierre%20drive/casimirbot.com/versions/CasimirBot%20(9-3-25)/CasimirBot%20(9-3-25)/CasimirBot/docs/knowledge/physics/many-body-statistical-mechanics.md)
- [classical-density-functional-theory.md](C:/Users/dan/Desktop/RESEARCH%201,0/research/Alcubierre%20drive/casimirbot.com/versions/CasimirBot%20(9-3-25)/CasimirBot%20(9-3-25)/CasimirBot/docs/knowledge/physics/classical-density-functional-theory.md)
- [intermolecular-potentials.md](C:/Users/dan/Desktop/RESEARCH%201,0/research/Alcubierre%20drive/casimirbot.com/versions/CasimirBot%20(9-3-25)/CasimirBot%20(9-3-25)/CasimirBot/docs/knowledge/physics/intermolecular-potentials.md)

### Granular And Tidal Response

5. Tanga et al., gravitational re-accumulation and granular aggregate behavior.
   - https://doi.org/10.1016/j.pss.2008.06.016
   - Use: aggregate shape and spin outcomes from many-body granular evolution.

6. Goldreich and Sari, `Tidal Evolution of Rubble Piles`.
   - https://authors.library.caltech.edu/records/g58j7-9k734/latest
   - Use: dissipation and angular-momentum redistribution semantics.

7. Frouard et al., tidal dissipation in rubble-pile asteroids.
   - https://www.sciencedirect.com/science/article/abs/pii/S0019103518304500
   - Use: rubble-pile `Q` and damping semantics.

8. Efroimsky, tidal evolution and viscosity scaling.
   - https://arxiv.org/abs/1506.09157
   - Use: lag and viscosity scaling caution.

9. Holsapple, equilibrium figures of cohesionless bodies.
   - https://www.mindat.org/reference.php?id=6378284
   - Use: cohesionless-body closure and figure semantics.

### Stellar Plasma Transport And Sunquake Response

10. Goldreich, Murray, Kumar, `Excitation of solar p-modes`.
    - https://ntrs.nasa.gov/citations/19950034554
    - Use: granulation and convection as the physical p-mode driver.

11. NASA/MSFC, `Helioseismology`.
    - https://solarscience.msfc.nasa.gov/Helioseismology.shtml
    - Use: p-modes and helioseismic observables.

12. Klimchuk, `Nanoflare Heating of Solar and Stellar Coronae`.
    - https://ntrs.nasa.gov/citations/20100031085
    - Use: reconnection and nanoflare heating semantics.

13. Kosovichev, helioseismic response to solar flare.
    - https://arxiv.org/abs/1105.0953
    - Use: flare-driven photospheric impact and wave response.

14. Zharkov et al., flare-to-sunquake timing.
    - https://doi.org/10.1051/0004-6361/201936755
    - Use: timing replay and falsifiable event-window alignment.

15. PIC-to-MHD solar flare bridge.
    - https://www.aanda.org/articles/aa/full_html/2025/04/aa52117-24/aa52117-24.html
    - Use: kinetic-to-fluid closure bridge without invoking macroscopic quantum coherence.

### Admissibility Boundary

16. [stellar-consciousness-ii-method-review-2026-03-25.md](C:/Users/dan/Desktop/RESEARCH%201,0/research/Alcubierre%20drive/casimirbot.com/versions/CasimirBot%20(9-3-25)/CasimirBot%20(9-3-25)/CasimirBot/docs/audits/research/stellar-consciousness-ii-method-review-2026-03-25.md)
    - Use: method triage.
    - Keep: p-mode pumping, flare timing, quasi-periodic flare envelopes, magnetic morphology context.
    - Fence off: CSL, OR, time-crystal, and cat-state solar claims.

## Acceptance Criteria

The patch series defined by this plan is complete when all of the following are true:

- the repo has an explicit shared parent lane for effective microphysics, many-body Hamiltonian formalisms, and transport closure
- granular/tidal diagnostics descend through constitutive and dissipative closure, not directly from a generic gravity node
- stellar flare/sunquake diagnostics descend through plasma transport closure, not directly from consciousness or collapse nodes
- the thermodynamics lane binds Hamiltonian and free-energy papers to the correct parent surfaces
- packet, Atlas, math, and Casimir verification still pass after the ontology re-parenting

## Recommended Execution Order

1. Add the new shared tree and math-claims file.
2. Add equation-backbone entries for Hamiltonian and closure semantics.
3. Bridge the thermodynamics lane into the new parent.
4. Bridge the self-gravity granular lane into the new parent.
5. Bridge the stellar plasma lane into the new parent.
6. Add paper-binding, packet, and resolver coverage.
7. Re-anchor the existing HaloBank runtime claims and proof nodes to the new parent surfaces.

## Expected Patch Surface

Primary files to edit in the actual implementation:

- [docs/knowledge/physics/physics-microphysics-transport-tree.json](C:/Users/dan/Desktop/RESEARCH%201,0/research/Alcubierre%20drive/casimirbot.com/versions/CasimirBot%20(9-3-25)/CasimirBot%20(9-3-25)/CasimirBot/docs/knowledge/physics/physics-microphysics-transport-tree.json)
- [docs/knowledge/math-claims/microphysics-transport.math-claims.json](C:/Users/dan/Desktop/RESEARCH%201,0/research/Alcubierre%20drive/casimirbot.com/versions/CasimirBot%20(9-3-25)/CasimirBot%20(9-3-25)/CasimirBot/docs/knowledge/math-claims/microphysics-transport.math-claims.json)
- [docs/knowledge/physics/physics-thermodynamics-entropy-tree.json](C:/Users/dan/Desktop/RESEARCH%201,0/research/Alcubierre%20drive/casimirbot.com/versions/CasimirBot%20(9-3-25)/CasimirBot%20(9-3-25)/CasimirBot/docs/knowledge/physics/physics-thermodynamics-entropy-tree.json)
- [docs/knowledge/physics/physics-self-gravity-shape-tree.json](C:/Users/dan/Desktop/RESEARCH%201,0/research/Alcubierre%20drive/casimirbot.com/versions/CasimirBot%20(9-3-25)/CasimirBot%20(9-3-25)/CasimirBot/docs/knowledge/physics/physics-self-gravity-shape-tree.json)
- [docs/knowledge/physics/physics-stellar-structure-nucleosynthesis-tree.json](C:/Users/dan/Desktop/RESEARCH%201,0/research/Alcubierre%20drive/casimirbot.com/versions/CasimirBot%20(9-3-25)/CasimirBot%20(9-3-25)/CasimirBot/docs/knowledge/physics/physics-stellar-structure-nucleosynthesis-tree.json)
- [docs/knowledge/physics/physics-quantum-semiclassical-tree.json](C:/Users/dan/Desktop/RESEARCH%201,0/research/Alcubierre%20drive/casimirbot.com/versions/CasimirBot%20(9-3-25)/CasimirBot%20(9-3-25)/CasimirBot/docs/knowledge/physics/physics-quantum-semiclassical-tree.json)
- [configs/physics-equation-backbone.v1.json](C:/Users/dan/Desktop/RESEARCH%201,0/research/Alcubierre%20drive/casimirbot.com/versions/CasimirBot%20(9-3-25)/CasimirBot%20(9-3-25)/CasimirBot/configs/physics-equation-backbone.v1.json)
- [scripts/paper-framework-binding.ts](C:/Users/dan/Desktop/RESEARCH%201,0/research/Alcubierre%20drive/casimirbot.com/versions/CasimirBot%20(9-3-25)/CasimirBot%20(9-3-25)/CasimirBot/scripts/paper-framework-binding.ts)
- [scripts/paper-gpt-pro-packet.ts](C:/Users/dan/Desktop/RESEARCH%201,0/research/Alcubierre%20drive/casimirbot.com/versions/CasimirBot%20(9-3-25)/CasimirBot%20(9-3-25)/CasimirBot/scripts/paper-gpt-pro-packet.ts)
- [configs/graph-resolvers.json](C:/Users/dan/Desktop/RESEARCH%201,0/research/Alcubierre%20drive/casimirbot.com/versions/CasimirBot%20(9-3-25)/CasimirBot%20(9-3-25)/CasimirBot/configs/graph-resolvers.json)
- [configs/resolver-owner-coverage-manifest.v1.json](C:/Users/dan/Desktop/RESEARCH%201,0/research/Alcubierre%20drive/casimirbot.com/versions/CasimirBot%20(9-3-25)/CasimirBot%20(9-3-25)/CasimirBot/configs/resolver-owner-coverage-manifest.v1.json)
- [docs/knowledge/math-claims/halobank-solar.math-claims.json](C:/Users/dan/Desktop/RESEARCH%201,0/research/Alcubierre%20drive/casimirbot.com/versions/CasimirBot%20(9-3-25)/CasimirBot%20(9-3-25)/CasimirBot/docs/knowledge/math-claims/halobank-solar.math-claims.json)
- [docs/knowledge/halobank-solar-proof-tree.json](C:/Users/dan/Desktop/RESEARCH%201,0/research/Alcubierre%20drive/casimirbot.com/versions/CasimirBot%20(9-3-25)/CasimirBot%20(9-3-25)/CasimirBot/docs/knowledge/halobank-solar-proof-tree.json)

This keeps the next real patch bounded, source-backed, and compatible with the existing executable lanes.

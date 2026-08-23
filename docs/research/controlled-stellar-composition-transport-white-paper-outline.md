# Controlled Stellar Composition Transport White-Paper Outline

Working title:

> **Controlled Composition Transport for Delaying Post-Main-Sequence Expansion
> in Solar-Type Stars: A MESA-GYRE Feasibility and Helioseismic Closure Study**

Status: manuscript architecture only; no feasibility result is claimed.

Governing roadmap:
[`controlled-stellar-composition-transport-work-program.md`](./controlled-stellar-composition-transport-work-program.md).

## Central claim

We formulate solar restoration as a constrained inverse stellar-evolution
problem and test whether any conservative composition-transport profile can
delay terminal-age main-sequence evolution without violating structural,
seismic, neutrino, chemical, conservation, and stability constraints.

The paper must report a null search honestly. It may conclude that no admissible
profile exists in the preregistered family.

## Manuscript claim boundary

The manuscript will not claim:

- technological or engineering feasibility;
- present ability to refuel the Sun;
- validation of the repository's `+0.6 Gyr` preset;
- seismic oscillations as the transport mechanism;
- full-Sun closure from fixtures, imported shells, or mock workers; or
- support for NHM2, warp, ER=EPR, or propulsion.

## Proposed paper structure

### 1. Research question and falsifiable outcomes

State the existence problem, the model family, and three terminal outcomes:

1. `NO_ADMISSIBLE_PROFILE` within the chosen family and limits;
2. `NARROW_ADMISSIBLE_PROFILE` with unknown actuation feasibility; or
3. `ROBUST_ADMISSIBLE_FAMILY` eligible for a separate mechanism study.

### 2. Conceptual correction: quasi-static stellar evolution

Distinguish local hydrostatic balance from secular radius evolution. Explain
central hydrogen depletion, helium accumulation, core contraction, shell
burning, and envelope expansion as coupled structural/compositional evolution.

### 3. Repository hypothesis and reduced-order audit

Document the original graph chain and reproduce the starting numerical audit.
Separate nuclear consumption, surface mass loss, gross circulation, net
hydrogen delivery, and accessible fuel. Present the `alpha` versus `epsilon`
fracture as a reduced-order bookkeeping result, not as a solar prediction.

### 4. Calibrated solar baseline

Describe the MESA or equivalent configuration, solar-age objective, nuclear
network, diffusion/settling, EOS, opacity, atmosphere, resolution, timestep
controls, optimizer, and retained hashes. Report calibration residuals for
luminosity, radius, effective temperature, surface Z/X, surface helium,
convection-zone depth, sound speed, density, and neutrinos.

### 5. Conservative transport formulation

Define the composition equation and every boundary condition. Include
diffusive and advective/circulation families, radiative-interior penetration,
species closure, mass closure, energy/entropy coupling, and zero-intervention
baseline recovery.

### 6. Preregistered inverse problem

Declare transport families, bounds, objective function, constraint vector,
sampling or optimization method, compute budget, convergence tests, and
first-failure rules. Keep calibration variables separate from intervention
variables.

### 7. Evolutionary outcomes

Report central hydrogen exhaustion, TAMS, core contraction, shell ignition,
early-subgiant evolution, and the frozen radius threshold. The primary outputs
are `Delta t_TAMS` and `Delta t_R>R_star`; no arbitrary transition-hazard curve
appears in evidentiary results.

### 8. Helioseismic and observational closure

Bind each GYRE run to its parent stellar-profile hash. Report sound-speed and
density residuals, frequencies, mode separations/ratios, neutrino channels,
surface helium, convection-zone depth, lithium, beryllium, abundance drift,
Brunt-Vaisala structure, and Ledoux/Schwarzschild plus relevant transport
instability indicators.

### 9. Robustness and independent reproduction

Report spatial/time convergence, microphysics sensitivity, optimizer/search
coverage, uncertainty propagation, independent runtime/source reproduction,
artifact integrity, and all failed candidates required by the preregistration.

### 10. Discussion and mechanism boundary

Interpret only the result supported by the selected transport family. If a
candidate survives, describe actuator classes solely as future hypotheses and
list their required energy, momentum, angular-momentum, entropy, thermal, and
instability ledgers.

### 11. Limitations and conclusion

State model-systematic limitations, observational coverage, solar calibration
degeneracies, transport-family incompleteness, and the difference between an
idealized admissible field and a realizable intervention.

## Evidence-to-section map

| Paper section | Required closed gate | Minimum artifact set |
| --- | --- | --- |
| 1-3 | G0 | reduced-order equations, unit ledger, reproduced discrepancy table, frozen claim language |
| 4 | G1 | inlists, solver/runtime identities, logs, histories, profiles, calibration objective and residuals, hashes |
| 5 | G2 | transport source/configuration, conservation tests, zero-transport recovery, convergence evidence |
| 6 | G3 | preregistration, parameter bounds, search manifest, compute budget, candidate receipts |
| 7 | G4 | full evolution histories and milestone extractor outputs |
| 8 | G5 | parent-bound GYRE artifacts and the complete observational acceptance vector |
| 9 | G6 | independent reproduction, uncertainty/sensitivity results, terminal decision record |
| 10 | G7 only if eligible | separate mechanism equations and physical ledgers |

## Figures planned in advance

1. Program dependency graph and claim boundary.
2. Reduced-order mass/species ledger showing why `alpha != epsilon`.
3. Baseline solar calibration residual vector.
4. Preregistered transport families in mass or radius coordinates.
5. Baseline versus candidate `X_i(r,t)`, temperature, density, sound speed, and
   Brunt-Vaisala profiles.
6. Evolution tracks with TAMS, shell ignition, and radius-threshold markers.
7. Helioseismic separation-ratio and structural-residual comparisons.
8. Neutrino and chemical residual dashboard with uncertainty normalization.
9. Feasible/infeasible search map with explicit failure categories.
10. Energy-ledger placeholder labeled downstream and non-evidentiary unless G7
    is separately completed.

## Tables planned in advance

1. Symbols, units, reservoirs, and flux ledgers.
2. Solar calibration targets, uncertainties, covariance policy, and residuals.
3. Frozen microphysics and numerical configuration.
4. Transport families and parameter bounds.
5. Evolutionary milestone definitions.
6. Candidate acceptance vector and first failing constraint.
7. Convergence, sensitivity, and independent reproduction results.
8. Claim matrix distinguishing diagnostic, model, observational, and mechanism
   authority.

## Reproducibility supplement

The supplement should include:

- exact inlists and transport hooks;
- versioned reference-data manifests;
- solver, compiler, container/WSL, and library identities;
- hashes for inputs, logs, histories, profiles, photos, GYRE inputs, and modes;
- milestone-extraction and residual-analysis code;
- failed-run and first-failure receipts;
- search seeds and optimizer state where applicable;
- uncertainty and covariance definitions; and
- a machine-readable terminal decision record.

## Drafting rule

Sections may be drafted early as methods or preregistration text, but result
language can only be populated from closed-gate artifacts. A schema seal,
fixture, mock result, imported profile, or successful orchestration test cannot
be cited as solver execution or physical closure.


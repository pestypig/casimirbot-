# Casimir-DP Stage-4.2F Maxwell/macroscopic-QED closure report

**Run:** `casimir-dp-maxwell-macroscopic-qed-closure-stage4-2f-v1-20260730T023000000Z`  
**Evidence class:** `synthetic_maxwell_macroscopic_qed_closure_and_readiness_audit`  
**Claim ceiling:** `maxwell_macroscopic_qed_and_named_dp_model_definition_only`  
**Campaign gate:** `pass`  
**Observable bridge edges added:** `0`

## Result at a glance

Stage 4.2F closes the ordinary electromagnetic explanation as an explicit chain: covariant Maxwell equations plus causal constitutive response and boundary conditions define the Green tensor; fluctuation-dissipation correlations define mean and fluctuating field observables; renormalized electromagnetic stress defines force, while the same response model feeds phase, heating, and decoherence controls. The synthetic recovery passes. The apparatus-specific finite-geometry contract remains blocked because measured material, CAD/mesh, field, stress, convergence, covariance, and independent-solver receipts were intentionally not imported from NHM2.

## Maxwell and polarization recovery

- Gate: `pass`.
- Maximum normalized plane-wave residual: `2.1671346650480375e-14`.
- Constitutive light-speed relative error: `2.1671346650480375e-14`.
- Linear/circular basis invariance error: `2.220446049250313e-16`.
- Poynting/energy identity relative error: `1.633807298075028e-16`.

Circular polarization introduces no extra spacetime or DP degree of freedom. It is a state in the same two-dimensional transverse electromagnetic field space.

## Green tensor, FDT, and ideal Casimir recovery

- Green/FDT gate: `pass`.
- Passive imaginary Green trace: `1000000 m^-1`.
- Zero-temperature recovery error: `0`.
- Ideal Casimir energy density: `-4.333752574825845 J/m^3`.
- Ideal Casimir pressure: `-13.001257724477536 Pa`.
- Pressure/energy-density ratio: `3`.

The ideal result remains `analytic_limit_crosscheck_only`; it is not the finite apparatus authority.

## Finite-geometry readiness

- NHM2 Maxwell method reused: `true`.
- NHM2 evidence reused: `false`.
- Empty apparatus contract status: `blocked`.
- Contract checks: `0` pass, `11` blocked, `0` fail.
- Apparatus Maxwell authority: `not_ready`.

## Exact named DP model and R0 sensitivity

Registered model: `diosi_1989_gaussian_regularized_nondissipative`.

Master-equation convention: `dot(rho)=-i[H,rho]/hbar-(G/(2hbar)) integral d3x d3y [mu_R0(x),[mu_R0(y),rho]]/|x-y|`.

| R0 (m) | Selected | Gamma_DP (s^-1) | tau_DP (s) | Heating (W) | Cross-check |
|---:|---:|---:|---:|---:|---|
| 1e-8 | false | 1.199748303247864 | 0.8335081594138362 | 1.92978846424103e-37 | `pass` |
| 1e-7 | true | 0.02400420398374263 | 41.659369362019746 | 1.9297884642410306e-40 | `pass` |
| 0.000001 | false | 0.00002872800501289411 | 34809.2392615208 | 1.9297884642410305e-43 | `pass` |

The scan shows parameter sensitivity only. It does not declare an externally allowed R0 region and it does not insert a cavity or Maxwell frequency into the standard DP generator.

## Stage-4.2C transport-identity audit

- Declared candidate mass: `1.94385e-16 kg`.
- Declared-point Gamma_DP at the transported 160 nm separation: `0.02400420398374263 s^-1`.
- Strongest transported-grid mass: `4.60765e-16 kg`.
- Strongest transported-grid separation: `1.6e-7 m`.
- Recovered headline Gamma_DP: `0.13487168259863525 s^-1`.
- Single-mass apparatus identity demonstrated: `false`.
- Apparatus identity authority: `not_ready`.

The Stage-4.2C headline rate is recovered from the strongest transported grid cell, not from the separately declared candidate mass. A single physical apparatus identity must be frozen before confirmatory use.

## Companion observable audit

- Observable: `heating_W`.
- Predicted synthetic signal: `1.9855322830887474e-41 W`.
- Assumed one-shot standard uncertainty: `1e-43 W`.
- Planned independent samples: `100`.
- Reported synthetic SNR: `1985.5322830887471`.
- Selected-object model heating: `1.9297884642410306e-40 W`.
- Strongest-grid model heating: `4.574318912086933e-40 W`.
- Forecast matches selected-object model: `false`.
- Forecast matches strongest-grid model: `false`.
- Companion model-identity authority: `not_ready`.
- Independence receipt class: `synthetic`.
- Detector-noise receipt available: `false`.
- Measured companion authority: `not_ready`.

The large Stage-4.2B SNR is a synthetic heating forecast conditional on an assumed noise floor. Its signal is not reconciled to either the declared Stage-4.2C reference object or the strongest transported cell, so it is neither demonstrated apparatus sensitivity nor yet a companion prediction for the selected design.

## Remaining experiment gates

- State preparation: `not_ready`.
- Candidate transport identity: `not_ready`.
- Quasistatic/active-boundary response: `not_ready`.
- Complete conserved apparatus stress-energy: `not_ready`.
- Measured evidence: `not_ready`.
- Collapse identification: `blocked`.
- Manifold dynamics: `blocked`.
- Physical viability: `not_evaluated`.

## Claim boundary

A passing Stage-4.2F run establishes equation consistency, source and method provenance, one exact named DP convention, and explicit experiment-readiness blockers. It does not supply measured material response, a finite-geometry Green tensor or Maxwell stress field, a demonstrated superposition, an active-boundary transfer function, a measured heating companion, a complete semiclassical source tensor, collapse evidence, manifold dynamics, or physical viability.

## Sources and support boundaries

- [Scattering Theory Approach to Electrodynamic Casimir Forces](https://arxiv.org/abs/0908.2649)
  - Supports: Casimir calculations from classical electromagnetic scattering amplitudes for arbitrary shapes, material susceptibilities, media, and nonzero temperature.
  - Does not support: A Casimir-boundary modification of a DP generator or objective collapse.
- [Casimir forces in the time domain: Theory](https://arxiv.org/abs/0705.3661)
  - Supports: Casimir force evaluation from fluctuation-dissipation field correlations and the mean electromagnetic stress tensor using Green-function computational electrodynamics.
  - Does not support: Using mean Casimir pressure as a force-noise PSD or collapse rate.
- [Macroscopic quantum electrodynamics and duality](https://arxiv.org/abs/0806.2211)
  - Supports: Operator Maxwell equations, Green tensors, and macroscopic-QED observables including Casimir forces in causal material media.
  - Does not support: A gravitational transfer kernel from electromagnetic duality or polarization.
- [Maxwell equations in curved spacetime](https://arxiv.org/abs/2307.14555)
  - Supports: Observer-dependent electric and magnetic fields and frame-explicit Maxwell equations in curved spacetime.
  - Does not support: Treating a material phase or group velocity as a universal metric light cone.
- [Models for universal reduction of macroscopic quantum fluctuations](https://doi.org/10.1103/PhysRevA.40.1165)
  - Supports: A mass-density dynamical-reduction master-equation model distinct from Penrose's lifetime heuristic.
  - Does not support: A Casimir-boundary variable in the registered standard DP generator.
- [The Schroedinger-Newton equation and its foundations](https://doi.org/10.1103/PhysRevA.90.062105)
  - Supports: Regularization and energy-increase implications used by the registered nondissipative Gaussian DP companion.
  - Does not support: A demonstrated heating detector for the proposed Casimir-DP apparatus.
- [Underground test of gravity-related wave function collapse](https://doi.org/10.1038/s41567-020-1008-4)
  - Supports: Radiation constraints that rule out the natural parameter-free DP version under the registered mapping assumptions.
  - Does not support: Exclusion of every regularized or dissipative DP model, or a local apparatus heating sensitivity.


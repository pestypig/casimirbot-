# Casimir-DP Stage-4.2J Schrödinger, mass-density, and environment report

**Run:** `casimir-dp-schrodinger-mass-density-stage4-2j-v1-20260806T040000000Z`  
**Evidence class:** `synthetic_schrodinger_mass_density_and_environmental_screen_only`  
**Claim ceiling:** `schrodinger_open_system_mass_density_and_environmental_diagnostic_only`  
**Software campaign gate:** `pass`  
**Observable bridge edges added:** `0`

## Result at a glance

This synthetic diagnostic makes the Schrödinger-to-observable chain explicit. The Hamiltonian rotates complex coherence, ordinary open-system channels may rotate and contract it, and the registered nondissipative Diósi term adds a boundary-independent contraction. A measured contraction can be reported as a DP-equivalent energy only conditionally on that frozen model; it is not a calorimetric collection of gravitational energy.

The software calculation passes, but the declared ideal-gas screen is a no-go, three constituent-density representations remain unavailable, the apparatus mass is far above the cited cross-platform matter-wave benchmark, and the applicable external-bound mapping is not yet registered. Consequently no physical candidate, measured evidence, collapse identification, manifold dynamics, or Casimir-to-collapse bridge is claimed.

## Frozen effective-Gaussian point

- E_G: `2.5314157026284577e-36 J`.
- Gamma_DP: `0.02400420398374263 s^-1`.
- Hold-time exponent: `0.006001050995935658`.
- Conditional visibility loss at 250 ms: `0.005983080654355932`.
- Recovery gate: `pass`.

The tiny difference between the immutable report visibility and exp(-Gamma_DP t) is retained as a display-precision diagnostic rather than hidden. The recovery tolerance is 1e-8 relative; the observed mismatch is far below it.

## Schrödinger and open-system separation

```text
C(t) = C(0) exp[-i Delta_E_H t/hbar] exp[-chi_env(t)] exp[-E_G t/hbar]
E_DP,eq = -hbar ln(|Cobs|/|C0|)/t
```

The maintained zero-Hamiltonian-phase fixture recovers E_DP,eq with relative error `3.9593922295886207e-16`. This inversion is model-conditional and the full whitened complex-coherence analysis remains authoritative.

## Mass-density robustness

The homogeneous-sphere density convolved with the same Gaussian regularization gives E_G = `6.325895528313174e-37 J`, or `0.24989556325121845` of the single-effective-Gaussian value. Numerical convergence is `pass`. The complete envelope is `blocked` because layered, coarse-grained, and atomistic provenance-bound density maps are absent.

## Hydrogen and frequency non-bridge

The DP-to-Rydberg energy ratio is `1.1612678557691733e-18`. It is a scale comparison only. Schrödinger, Compton, QED, Higgs, and blackbody relations do not provide a transfer kernel into Gamma_DP or a cavity mode.

## Environmental and preparation screens

- `H2`: ideal-equilibrium geometric collision rate `17.802893501590642 s^-1`, gas/DP ratio `741.6573160954656`, screen `no_go`.
- `He4`: ideal-equilibrium geometric collision rate `12.634315917145742 s^-1`, gas/DP ratio `526.3376334288197`, screen `no_go`.
- Declared gas candidate gate: `no_go`.
- Apparatus-to-demonstrated-mass ratio: `688596.3708244892`; preparation receipt `not_ready`.

These gas values are conservative screening calculations, not a complete scattering kernel or a measured vacuum characterization. They show why acquisition power must not be quoted as physical feasibility yet.

## Adversarial cases

- `altered_registered_dp_reference_fails_closed`: `pass`; empirical authority `false`.
- `hamiltonian_energy_rotates_phase_not_dp_loss`: `pass`; empirical authority `false`.
- `gas_threshold_controls_candidate_gate`: `pass`; empirical authority `false`.
- `mass_representation_order_is_preregistered`: `pass`; empirical authority `false`.
- `no_boundary_to_collapse_edge_created`: `pass`; empirical authority `false`.

## Bounded scientific standing

- `software_contract`: `pass`.
- `schrodinger_dp_separation`: `pass`.
- `registered_gaussian_recovery`: `pass`.
- `homogeneous_convolved_representation`: `diagnostic_ready`.
- `complete_representation_robustness`: `blocked`.
- `declared_equilibrium_gas_screen`: `no_go`.
- `measured_environment_model`: `not_ready`.
- `state_preparation`: `not_ready`.
- `external_bound_mapping`: `not_ready`.
- `transfer_kernel`: `not_registered`.
- `measured_evidence`: `not_ready`.
- `collapse_identification`: `blocked`.
- `manifold_dynamics`: `blocked`.
- `physical_viability`: `not_evaluated`.


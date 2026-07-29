# Casimir-DP Stage-4.2E causal-cone and clock-congruence report

**Run:** `casimir-dp-causal-cone-clock-stage4-2e-v1-20260729T193000000Z`  
**Evidence class:** `synthetic_causal_geometry_recovery_and_screening_bound`  
**Claim ceiling:** `causal_geometry_consistency_and_propagation_control_only`  
**Campaign gate:** `pass`  
**Observable bridge edges added:** `0`

## Result at a glance

Stage 4.2E makes the causal-geometry distinction executable. Local null directions and timelike proper-clock rates are reconstructed from one ADM lapse, shift, and spatial metric. A bounded Schwarzschild radial-null benchmark recovers analytic light travel and radar-clock relations. The ideal Casimir interaction region supplies only a gravitational scale screen, while the Scharnhorst relation remains a separate QED effective-propagation control. No boundary-conditioned DP or metric-to-coherence edge is added.

## ADM cone and clock recovery

| Case | Gate | dτ/dt | Null roots along declared direction | + light time / L/c |
|---|---|---:|---|---:|
| `minkowski` | `pass` | 1 | -1, 1 | 1 |
| `nhm2_centerline_lapse_reference` | `pass` | 0.7 | -0.7, 0.7 | 1.4285714285714286 |
| `shifted_anisotropic_chart` | `pass` | 0.95 | -1.0401824640464072, 0.8405746209091525 | 1.1896623751481046 |

Maximum local-null constraint error: `1.1102230246251565e-16`.
Maximum clock identity error: `0`.

The NHM2 row demonstrates same-equation congruence: for the synthetic centerline lapse α=0.7 and vanishing shift, a stationary clock has dτ/dt=0.7 while the local coordinate-null roots are ±0.7. Its historical L/c schedule remains a reference parameterization; the metric-derived one-way light time is longer by 1/0.7.

## Bounded radial-null and radar-clock recovery

- Schwarzschild radius: `2953.3393820668784 m`.
- Emitter lapse / stationary clock rate: `0.9999978774309929`.
- Analytic one-way coordinate light time: `0.03335655011477055 s`.
- Numerical one-way coordinate light time: `0.03335655011477056 s`.
- Relative recovery error: `2.080219291273359e-16`.
- Coordinate Shapiro excess over flat L/c: `1.405949553445751e-7 s`.
- Emitter radar round-trip proper time: `0.06671295862638218 s`.

This is a conventional fixed-chart recovery test, not a Casimir apparatus prediction.

## Casimir semiclassical scale screen

- Ideal interaction energy density: `-4.333752574825845 J/m^3`.
- Ideal normal pressure: `-13.001257724477536 Pa`.
- Interaction mass equivalent: `-4.82195004530249e-32 kg`.
- Einstein curvature scale: `8.999676202434904e-43 m^-2`.
- Fractional light-time bound across the gap: `8.999676202434902e-57`.
- Light-time shift bound across the gap: `3.0019688495415394e-72 s`.
- Complete-apparatus metric authority: `not_ready`.

The sign of one interaction-energy component does not solve the geometry. Plates, supports, renormalized total stress, conservation, and metric boundary conditions remain required.

## QED, material, and polarization control

- Ideal low-frequency QED fractional phase-speed proxy: `4.761295902998836e-28`.
- QED-to-gravitational screening-scale ratio: `5.290519120799753e+28`.
- Ideal σ+/σ− split proxy: `0`.
- Material dispersion measured: `false`.
- Polarization response measured: `false`.
- Front-velocity claim allowed: `false`.

Frequency, material, directional, or polarization response remains in the QED/material control lane unless a universal metric observable survives the full control model.

## Causal signature and non-bridge matrix

| Signature | Lane | Frequency rule | Polarization rule | DP-rate admission |
|---|---|---|---|---:|
| `universal_adm_null_and_clock_response` | `ordinary_gr` | `none_in_minimally_coupled_classical_gr` | `none_in_minimally_coupled_classical_gr` | no |
| `ideal_qed_effective_index_response` | `ordinary_qed_control` | `low_frequency_effective_theory_domain` | `must_be_measured_and_budgeted` | no |
| `material_boundary_dispersion_response` | `ordinary_material_control` | `expected` | `allowed_and_measured` | no |
| `branch_density_difference_to_dp_rate` | `frozen_standard_dp` | `not_a_cavity_mode_transfer` | `none_registered` | yes, frozen branch-density lane only |
| `boundary_conditioned_branch_metric_to_coherence` | `speculative_registered_bridge_slot` | `kernel_missing` | `kernel_missing` | no |

## Fixture and scientific standing

- Fixtures passed: `10/10`.
- Null-geodesic apparatus authority: `not_ready`.
- Complete-apparatus metric response: `not_ready`.
- Physical pilot readiness: `not_ready`.
- Measured evidence: `not_ready`.
- Collapse identification: `blocked`.
- Manifold dynamics: `blocked`.
- Physical viability: `not_evaluated`.

## Sources and support boundaries

- [3+1 Formalism and Bases of Numerical Relativity](https://arxiv.org/abs/gr-qc/0703035)
  - Supports: ADM lapse, shift, spatial metric, observers, and causal decomposition used for local cone and proper-clock reconstruction.
  - Does not support: NHM2 physical viability, a Casimir metric response, or objective collapse.
- [The geometry of free fall and light propagation](https://doi.org/10.1007/s10714-012-1353-4)
  - Supports: Compatible light-ray and freely falling-particle structures as operational foundations for Lorentzian geometry and standard clocks.
  - Does not support: A quantum collapse mechanism or a cavity-to-metric transfer.
- [On the structure of causal spaces](https://doi.org/10.1017/S030500410004144X)
  - Supports: Causal and chronological order as geometric structure built from observer histories and signal relations.
  - Does not support: A DP master equation or measured manifold superposition.
- [A new topology for curved space-time which incorporates the causal, differential, and conformal structures](https://doi.org/10.1063/1.522874)
  - Supports: The relation between causal structure and the conformal spacetime geometry under stated causality assumptions.
  - Does not support: The conformal scale, a complete stress-energy solve, or collapse dynamics.
- [Black Holes, Cosmology, and Space-Time Singularities](https://www.nobelprize.org/uploads/2024/02/penrose-lecture.pdf)
  - Supports: The distinction between an individual photon history, local null cones, and null-geodesic causal structure in curved spacetime.
  - Does not support: A Casimir-conditioned collapse rate.
- [On Gravity's role in Quantum State Reduction](https://doi.org/10.1007/BF02105068)
  - Supports: The proposed lifetime of order hbar over branch-relative gravitational self-energy and its time-translation motivation.
  - Does not support: A standard-DP boundary modifier or a solved branch-dependent null cone.
- [How Does Casimir Energy Fall?](https://doi.org/10.1103/PhysRevD.76.025004)
  - Supports: Finite Casimir interaction energy contributes to inertial and gravitational mass within a complete apparatus treatment.
  - Does not support: Using negative interaction energy density alone as a solved spacetime geometry or collapse trigger.
- [On propagation of light in the vacuum between plates](https://doi.org/10.1016/0370-2693(90)90997-K)
  - Supports: An ideal low-frequency QED vacuum-polarization propagation correction between parallel conducting plates.
  - Does not support: A measurable gravitational cone shift, causal signalling beyond the relativistic front, or DP collapse.
- [Faster-than-c light between parallel mirrors: The Scharnhorst effect rederived](https://doi.org/10.1016/0370-2693(90)91224-Y)
  - Supports: The ideal QED effective-index correction and its extreme smallness as a propagation-control benchmark.
  - Does not support: A universal metric response or an experimentally accessible cavity-to-collapse transfer.

## Claim boundary

A successful Stage-4.2E run validates software, units, ADM cone/clock algebra, a bounded conventional radial-null recovery, an ideal Casimir gravitational scale screen, QED/control separation, and zero unsupported bridge edges. It does not integrate null rays through a measured apparatus metric, supply a complete conserved apparatus tensor, measure cavity propagation or polarization response, prepare a superposition, measure coherence, support or exclude DP, identify collapse or manifold dynamics, or establish physical viability.


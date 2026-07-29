# Casimir-DP Stage-4.2E causal-cone and clock-congruence campaign

## Goal

Stage 4.2E tests whether every geometric statement in the Casimir-DP study can
be expressed consistently through one declared Lorentzian metric before any
branch-dependent collapse interpretation is considered. It binds local null
directions, massive-particle worldlines, proper clocks, radar time, and a
bounded conventional curved-spacetime recovery to the same ADM lapse, shift,
and spatial metric.

The campaign is diagnostic and non-promotable. Its maximum claim is
`causal_geometry_consistency_and_propagation_control_only`.

## Immutable upstream

The content-addressed Stage-4.2D run
`casimir-dp-cross-scale-metrology-stage4-2d-v1-20260728T193200000Z` and its
downstream verification receipt are immutable upstream evidence. Stage 4.2E
must reproduce all six role/path/SHA-256 tuples before it evaluates any causal
geometry.

Stage 4.2E does not rewrite the frozen mass-density DP generator and does not
reuse the Stage-4.2D adapter certificate.

## Mathematical contract

In geometric units, the declared ADM line element is

\[
ds^2=-\alpha^2dt^2+
\gamma_{ij}(dx^i+\beta^i dt)(dx^j+\beta^jdt).
\]

For a coordinate velocity \(v^i=dx^i/dt\), a timelike clock satisfies

\[
\left(\frac{d\tau}{dt}\right)^2
=\alpha^2-\gamma_{ij}(v^i+\beta^i)(v^j+\beta^j)>0.
\]

The local null boundary is

\[
\gamma_{ij}(v_{\rm null}^i+\beta^i)
(v_{\rm null}^j+\beta^j)=\alpha^2.
\]

For a declared coordinate direction \(e^i\), Stage 4.2E solves the resulting
quadratic for both directional null roots and reports the null-constraint
residual. It also requires positive lapse, a symmetric positive-definite
spatial metric, a timelike clock path strictly inside the cone, and explicit SI
conversion at the light-time boundary.

## Recovery ladder

1. Minkowski recovery: null roots \(\pm1\), stationary clock rate \(1\), and
   one-way time \(L/c\).
2. NHM2 same-equation recovery: the synthetic centerline lapse
   \(\alpha=0.7\), zero shift, and Euclidean spatial metric give null roots
   \(\pm0.7\) and stationary clock rate \(0.7\). The historical \(L/c\)
   schedule remains a reference parameterization and is not relabeled as a
   null-geodesic solve.
3. Shifted anisotropic ADM recovery: both directional roots, clock rate, spatial
   metric minors, and constraint residual are checked in a nontrivial chart.
4. Schwarzschild radial-null recovery: numerical quadrature must reproduce the
   analytic fixed-chart one-way light time, stationary redshift, coordinate
   Shapiro excess, and emitter radar proper time.

## Casimir and optical controls

The ideal parallel-plate interaction energy density

\[
u_C=-\frac{\pi^2\hbar c}{720a^4}
\]

is used only to screen the scale

\[
\mathcal R_C\sim\frac{8\pi G|u_C|}{c^4},
\qquad
\epsilon_C\sim\mathcal R_Ca^2.
\]

This is not a geometry solve. Promotion is blocked until a complete apparatus
tensor includes plates, supports, renormalization, conserved total stress, and
registered metric boundary conditions.

The ideal low-frequency Scharnhorst scaling

\[
\frac{\Delta c_{\rm QED}}{c}
=\frac{11\pi^2}{2700}\alpha_{\rm fs}^2
\left(\frac{\bar\lambda_e}{a}\right)^4
\]

is a separate QED effective-propagation control. Material dispersion,
frequency response, direction, and polarization must be measured. Neither a
phase-speed proxy nor a polarization response is admitted as a universal GR
metric or front-velocity observation.

## Hypothesis separation

The runtime keeps five machine-readable signature rows:

1. universal ADM null-and-clock response under ordinary GR;
2. ideal QED effective-index response;
3. material and polarization dispersion;
4. the frozen branch-density-to-DP-rate relation;
5. an unregistered boundary-conditioned branch-metric-to-coherence slot.

Only row 4 is admitted to the existing DP-rate lane. The campaign adds zero
observable bridge edges.

## Fail-closed fixtures

Ten fixtures cover the passing baseline and reject:

- nonpositive lapse;
- non-positive-definite spatial metric;
- a purported massive clock path outside the cone;
- promotion of the flat \(L/c\) reference as solved null transport;
- promotion of scalar negative energy density as solved geometry;
- promotion of QED effective propagation as a GR metric;
- a boundary-label modifier of standard DP;
- a branch metric without a causal tensor-to-metric-to-coherence kernel;
- empirical promotion from synthetic recovery.

## Pilot implications

The empirical feasibility pilot must provide:

- a complete apparatus stress-energy and covariance authority;
- measured material, dispersion, polarization, and clock-response controls;
- an explicitly registered metric boundary-value problem;
- null-ray/radar-time observables with clock custody and calibration;
- the selected mesoscopic superposition and the Stage-4.2C coherence packet.

The direct gravitational light-time scale screen is expected to be far below
instrument reach. Its purpose is therefore a no-go and category-error check,
not a promised primary measurement. The coherence residual remains the
experiment's primary observable.

## Completion gates

Completion requires:

- deterministic runtime, report, trace, and receipt;
- all ten fixtures;
- focused Stage-4.2E tests;
- inherited Casimir-DP paper, graph, and root-to-leaf tests;
- GR/WARP regression replay;
- production build;
- math report and strict validation;
- root-to-leaf validation;
- a fresh Casimir adapter PASS with certificate integrity OK.

Even after those software gates pass, the following states remain fixed:

- `null_geodesic_apparatus_authority: not_ready`;
- `complete_apparatus_metric_response: not_ready`;
- `physical_pilot_readiness: not_ready`;
- `measured_evidence: not_ready`;
- `collapse_identification: blocked`;
- `manifold_dynamics: blocked`;
- `physical_viability: not_evaluated`.

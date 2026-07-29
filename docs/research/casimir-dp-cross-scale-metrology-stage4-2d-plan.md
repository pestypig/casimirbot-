# Casimir-DP Stage-4.2D cross-scale recovery and spectroscopic field-metrology plan

## Objective

Stage 4.2D strengthens the experimental presentation by classifying every
cross-scale equation according to what it can actually do:

1. a **sourced calibration transfer** may convert an apparatus field into a
   measured spectroscopic frequency;
2. a **classical-gravity recovery relation** may test constants, dimensions,
   limiting regimes, and implementation consistency;
3. a **representation equivalence** may change mathematical language without
   changing physical content;
4. a **frozen hypothesis transfer** may enter the DP prediction only when it is
   already part of the registered mass-density model; and
5. every other apparent connection remains `same_dimension_not_connected`
   until a separately sourced and preregistered transfer kernel exists.

The campaign is downstream of the immutable Stage-4.2C run
`casimir-dp-identifiability-redesign-stage4-2c-v1-20260728T042510781Z`.
It may not change that campaign's selected candidate, 542-window forecast,
registered DP generator, covariance gates, or scientific standing.

## Scientific hypothesis separation

### Ordinary apparatus model

The ordinary model includes measured electric, magnetic, polarization,
blackbody/thermal, gas, vibration, optical, and readout effects. Stark and
Zeeman witnesses are introduced here to turn important electromagnetic
nuisance variables into measured field estimates with covariance.

### Frozen mass-density DP model

The only collapse-rate relation admitted by this campaign is the unchanged
registered relation

\[
\Gamma_{\rm DP}=\frac{E_G[\Delta\rho;r_0]}{\hbar}.
\]

No Stark, Zeeman, blackbody, spinor, Schwarzschild, potato-radius, or Jeans
quantity is inserted into \(E_G\), \(r_0\), or \(\Gamma_{\rm DP}\).

### Boundary-conditioned extension

A Casimir-boundary modifier remains a separate hypothesis. Stage 4.2D supplies
no such kernel and adds zero observable bridge edges.

## Runtime A: spectroscopic field metrology

The weak-field Zeeman witness evaluates

\[
\Delta E_Z=g_Jm_J\mu_BB,\qquad
\Delta\nu_Z=\frac{\Delta E_Z}{h},\qquad
\frac{\partial\Delta\nu_Z}{\partial B}
=\frac{g_Jm_J\mu_B}{h}.
\]

The static Stark witness uses a transition-specific differential
polarizability expressed as a frequency response:

\[
\Delta\nu_S=-\frac12\alpha_\nu E^2,\qquad
\frac{\partial\Delta\nu_S}{\partial E}=-\alpha_\nu E.
\]

The blackbody dynamic-Stark fixture uses

\[
\Delta\nu_{\rm BBR}
=k_{\rm BBR}\left(T^4-T_{\rm ref}^4\right),\qquad
\frac{\partial\Delta\nu_{\rm BBR}}{\partial T}
=4k_{\rm BBR}T^3.
\]

These equations generate synthetic response and covariance forecasts. The
coefficients are design assumptions until an integrated calibration measures
the transition-specific response, drift, and covariance. Even after those
measurements, a distinct empirical transfer from witness frequency to complex
material coherence must be estimated in calibration/pilot data before the
witnesses populate Stage-4.2C response vectors.

Circular polarization is handled through a frozen propagation and handedness
convention. The \(\sigma^+\) and \(\sigma^-\) witness pair is an
electromagnetic polarization and magnetic-field diagnostic, not a new
gravitational degree of freedom.

## Runtime B: classical-gravity recovery ladder

### Schwarzschild compactness

\[
r_s=\frac{2GM}{c^2},\qquad
\mathcal C=\frac{r_s}{R}.
\]

This checks relativistic compactness. It does not provide the Penrose
objective-reduction threshold, which remains a weak-field branch-difference
self-energy hypothesis.

### Material-strength or potato-radius crossover

For a uniform-density order-of-magnitude recovery,

\[
P_G\simeq k_{\rm geom}G\rho^2R^2,\qquad
R_{\rm yield}\simeq
\sqrt{\frac{\sigma_y}{k_{\rm geom}G\rho^2}}.
\]

This is a competition between self-gravity and material yield strength. Its
composition and history dependence prevents it from being used as a universal
mass-density or collapse threshold.

### Jeans pressure-support crossover

\[
c_s=\sqrt{\frac{k_BT}{\mu m_u}},\qquad
\lambda_J=c_s\sqrt{\frac{\pi}{G\rho}},\qquad
t_{\rm ff}=\sqrt{\frac{3\pi}{32G\rho}}.
\]

This is a hydrodynamic stability scale. Turbulence, rotation, magnetic fields,
opacity, and geometry can change the outcome. It does not derive microscopic
objective reduction.

## Runtime C: spinor and equation-semantic gate

Penrose's spinor formulation is admitted as a representation of relativistic
fields and curvature. The campaign fails closed if:

- a spinor is identified with mass;
- a Maxwell spinor is treated as a collapse generator;
- the 1960 spinor paper is described as a quantization or objective-reduction
  derivation; or
- a spinor, helicity, polarization, or spectral frequency is connected to
  \(\Gamma_{\rm DP}\) without a registered dynamics kernel.

## Runtime D: congruence and claim matrix

Every equation edge is recorded as one of:

- `sourced_calibration_transfer`;
- `classical_gravity_recovery`;
- `representation_equivalence`;
- `frozen_hypothesis_transfer`; or
- `same_dimension_not_connected`.

Only `branch_density_difference_to_dp_rate` is admitted to the DP-rate lane.
Every other cross-scale relation has `admitted_to_dp_rate: false`.

## Empirical feasibility sequence

1. Refresh external collapse-model bounds.
2. Select actual Stark and Zeeman witness transitions and freeze their
   transition-specific calibration sources.
3. Measure electric field, magnetic field, polarization leakage, blackbody
   shift, drift, sensor self-noise, and full covariance in sham, detuned,
   active, and reference boundary sequences.
4. Demonstrate the selected mesoscopic superposition without confirmatory
   scoring.
5. Measure the witness-to-complex-coherence response during calibration and
   pilot acquisition.
6. Recompute the Stage-4.2C cosine, condition, power, false-positive, companion
   SNR, and required-window gates using empirical inputs.
7. Proceed to the blinded confirmatory campaign only if every gate remains
   satisfied.

## Evidence and claim ceiling

The maximum Stage-4.2D claim is:

`spectroscopic_field_metrology_and_classical_gravity_recovery_only`

The campaign must preserve:

- `spectroscopic_response_authority: not_ready`;
- `physical_pilot_readiness: not_ready`;
- `measured_evidence: not_ready`;
- `collapse_identification: blocked`;
- `manifold_dynamics: blocked`;
- `physical_viability: not_evaluated`; and
- `observable_bridge_edges_added: 0`.

## Completion contract

Stage 4.2D is complete only after:

- strict config, source, authority, fixture, and run-order validation;
- deterministic Stark, Zeeman, blackbody-Stark, compactness, potato, and Jeans
  recovery runtimes;
- fail-closed cross-scale and promotion fixtures;
- an authoritative content-addressed run and maintained report;
- non-promotable Theory Badge, paper, proposal, equation-sidecar, math-stage,
  and root-to-leaf integration;
- focused and inherited regression tests;
- production build;
- fresh Casimir adapter PASS with certificate integrity OK; and
- a downstream verification receipt that explicitly states what the
  certificate does not establish.


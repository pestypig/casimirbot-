# Finite rigid-sphere coherence envelope versus force allowance

Program gate: S1 — same-parameter force/scattering consistency.
Workstream: Conditional finite-source Yukawa envelope.
Capability or component: Exact separation/shape in the quadratic eikonal upper bound.
Current maturity: Homogeneous-vacuum rigid-sphere model bound.
Target maturity: Parameterized force allowance without inventing trap capability.
Required frozen inputs: Canonical mass, radius, separation and hold; authenticated matched alpha and plate-force identity.
Required evidence: Fourier normalization, finite-size factor, positive tail bounds and quadrature checks.
Stop/fail criteria: No vacuum envelope called a bound on arbitrary chamber propagation; no rigid elastic response called all material channels.
Explicit non-goals: Full halo, nonlinear apparatus, trap admission or measured coherence signal.
Downstream gate unlocked: Actual restoring-force input and common-halo integration; S1 remains open.

## Result

For the homogeneous-vacuum rigid-sphere model at the illustrative coupling, the quadratic eikonal upper envelope is D <= 0.0156170. It includes finite radius, the full 250 nm separation and all incoming impact parameters; it does not cut out near trajectories. Unlike the earlier dipole tail, it has no truncation in separation for this model.

Combining it with the separate weak-source thin-plate force relation makes the consequence of a possible force allowance explicit. At the 0.1 micrometre thickness, 2900 kg/m3 benchmark, an allowed scalar curvature corresponding to 10 kHz gives D <= 6.19e-8; at 100 kHz it gives D <= 6.19e-4. These are hypothetical constraints, not an asserted trap specification. The query about the intended hold remains unanswered.

This is a rigid elastic continuum response in homogeneous vacuum. It is not a full sphere excitation calculation, a universal bound on chamber-enhanced propagation, or a complete prediction for surviving shots. The force mapping is a separate first-order plate approximation and must not be described as an exact combined nonlinear apparatus bound.

## Finite-source and separation derivation

For a uniform sphere of radius R, the normalized form factor is

    F(q) = 3 j1(qR)/(qR).

In a straight-line static Yukawa eikonal model, the two-dimensional transform of the accumulated phase is

    chi_tilde(q) = (4 pi alpha B/v) F(q)/(q^2+m_light^2).

Here q is transverse momentum in inverse length units; the longitudinal transfer vanishes in this eikonal transform. The rigid source includes the full sphere potential, including its interior. For branches separated transversely by d, their phase difference acquires the exact factor exp(i q.d/2)-exp(-i q.d/2).

Using 1-cos(Delta chi) <= (Delta chi)^2/2 and Parseval's identity gives

    D <= flux * hold * (4 pi alpha B/v)^2/(2 pi)
         integral_0^infinity q dq [1-J0(qd)] F(q)^2/(q^2+m_light^2)^2.

This inequality is valid even when phases are large; it is not an approximation that replaces the true large-phase contrast by its quadratic value. Angular averaging accounts exactly for the branch factor. The reported calculation is for transverse separation relative to the mono-speed beam. It has not been promoted to an all-orientation halo average.

Use R = 0.2763023624 micrometres, d = 0.25 micrometres, hold 0.25 s, effective B = mass/u, mass_chi = 1000 GeV and speed 776 km/s. At mu = 0.001 eV, m_light = sqrt(2) mu. The inverse-length integrals use micrometres and the final area conversion is 1 micrometre squared = 1e-8 cm2. The coupling is alpha = 1.47090281748e-13 from the matched illustrative scalar point.

## Numerical tail accounting

The positive integral is evaluated on a logarithmic q grid from 1e-6 inverse micrometres to 200/R. Below the lower endpoint, use 1-J0(qd) <= (qd)^2/4, |F| <= 1 and denominator >= m_light^4, giving an omitted contribution no greater than d^2 q_low^4/(16 m_light^4).

Above the upper endpoint, |F| <= 6/(qR)^2 and 1-J0 <= 2 give a tail no greater than 12/(R^4 q_high^6). A second valid high-tail bound from the quadratic branch factor, 9d^2/(4R^4 q_high^4), is used when smaller; this also preserves exactly zero bound at zero separation.

The retained integral is 0.09532912771 micrometres squared; the combined omitted-tail ceiling is 1.4316e-14 micrometres squared. Doubling the momentum grid changes the result by 1.27e-13 relatively. These small numerical errors do not reduce the material, eikonal, transport or environmental modeling uncertainty.

## Parameterized force allowance

At fixed C, ychi and KSS in the [plate-force family](casimir-dp-portal-plate-force-invariant-2026-09-06.md), the leading plate curvature is proportional to alpha. If f_ref is the reference scalar instability scale and f_allow is the maximum scalar curvature an external confinement contract permits, then

    alpha <= alpha_ref (f_allow/f_ref)^2,
    D_envelope <= D_ref (f_allow/f_ref)^4.

The use of a frequency is a way to specify curvature; f_allow is not a claim that such a trap exists or preserves the superposition. It must refer to the appropriate three-dimensional confinement budget, not merely a laser modulation frequency. The weak-source scalar response and all other constraints must still apply after changing alpha.

For the thin 2900 kg/m3 benchmark, f_ref = 224118.5 Hz:

| Assumed allowed scalar-curvature scale | Alpha ceiling | Conditional rigid-vacuum D envelope |
|---:|---:|---:|
| 1 kHz | 2.9284e-18 | 6.1899e-12 |
| 10 kHz | 2.9284e-16 | 6.1899e-8 |
| 100 kHz | 2.9284e-14 | 6.1899e-4 |
| 1 MHz | 2.9284e-12 | 6.1899 |

The large last envelope is loose and does not predict a measured value. Scanning above the reference coupling does not certify collider, scalar-vacuum or other experimental consistency. The [JSON output](casimir-dp-portal-finite-sphere-force-envelope-2026-09-06.json) also maps all six plate benchmarks against these four illustrative force allowances.

## Scope and next evidence

The true sphere can have internal excitations, discrete nuclear/electronic channels and losses. The smooth rigid form factor alone does not bound those. The chamber can change the propagator, as already demonstrated; this vacuum calculation cannot replace it without a controlled comparison. Likewise the halo and shielding must be shared with the xenon calculation before presenting a joint prediction. The fixed heavy xenon coefficient still predicts the previously recorded small high-energy rate, not an event fit.

Four checks pass when running `C:\Python313\python.exe docs/research/casimir-dp-portal-finite-sphere-force-envelope-2026-09-06.py`: grid refinement, explicit tail bounds, direct angular validation of the Bessel branch factor and the exact zero-separation limit. The result makes a previously missing finite-source contribution calculable and exposes its force dependence without assuming hardware. S1 and the goal remain active.

# Plate force tensor and the orientation question

Program gate: S1 — same-parameter motion consistency.
Workstream: Three-dimensional scalar force screening.
Capability or component: Force-curvature tensor at the plate midpoint.
Current maturity: Weak-source numerical tensor and conditional nonlinear sign argument.
Target maturity: Resolve orientation before accepting fixed branch histories.
Required frozen inputs: Authenticated matched plate model and canonical side/gap.
Required evidence: Independent normal curvature, tensor trace and quadrature convergence.
Stop/fail criteria: No rotation of the branch direction treated as removal of all dynamical constraints.
Explicit non-goals: Full trapping protocol, exact nonlinear apparatus field, hardware feasibility or scalar exclusion.
Downstream gate unlocked: Actual three-dimensional confinement/trajectory contract; S1 remains open.

## Finding

For the tested symmetric plates, the scalar produces a saddle at the midpoint: the two directions parallel to the plates are restoring, and the normal direction is unstable. At density 2900 kg/m3 and thickness 0.1 micrometres, the scalar-induced parallel oscillation frequency is approximately 152 kHz while the normal instability corresponds to 224 kHz.

Orienting a superposition parallel to the plates therefore avoids the normal repulsion along its separation axis, but it does not give a fixed separation during a free hold. The branches instead move in a strong restoring potential, and normal motion still needs stabilization. The previous normal-axis thresholds were not orientation-independent branch growth rates; this packet makes that limitation quantitative.

## Independent tensor calculation

Retain the [matched force invariant](casimir-dp-portal-plate-force-invariant-2026-09-06.md), mu = 0.001 eV, two 80 micrometre square plates and a 10 micrometre gap. Thickness and density remain hypothetical. In the weak-source vacuum response, the acceleration-curvature matrix is proportional to the Hessian of the Yukawa source integral.

For R = |r-r_source| and m = sqrt(2) mu/(hbar c),

    partial_i partial_j [exp(-mR)/R] = exp(-mR)
      * [(m^2/R^3 + 3m/R^4 + 3/R^5) R_i R_j
         - (m/R^2 + 1/R^3) delta_ij].

Integrate this expression directly through both plate volumes using Cartesian Gaussian quadrature. The field point is outside the material, so there is no source singularity or delta contact term in the integral. Reflection and square symmetry give a diagonal tensor with Kxx = Kyy. Positive K means an outward acceleration along that eigenvector; negative K means restoring acceleration.

The normal component agrees with the previous, independently reduced surface/angular formula to 4.35e-14 relatively. The trace independently obeys the vacuum Helmholtz identity

    Kzz + 2 Kxx = common_prefactor * m^2 integral exp(-mR)/R dV > 0.

Thus the restoring parallel curvature cannot make all three directions restoring for these positive scalar sources in this weak-response model.

| Density (kg/m3) | Thickness (micrometres) | Normal instability scale | Parallel restoring frequency |
|---:|---:|---:|---:|
| 2900 | 0.1 | 224 kHz | 152 kHz |
| 2900 | 1 | 707 kHz | 481 kHz |
| 2900 | 10 | 2.167 MHz | 1.477 MHz |
| 8600 | 0.1 | 386 kHz | 262 kHz |
| 8600 | 1 | 1.218 MHz | 828 kHz |
| 8600 | 10 | 3.732 MHz | 2.543 MHz |

The restoring frequencies describe forces supplied by the hypothetical scalar model. They are not evidence of an available optical/electrical trap, nor an authorization to replace the canonical protocol. No branch orientation has been assigned to the actual apparatus.

## Conditional extension beyond the linear plate model

A useful sign constraint follows directly from the same nonlinear positive-field theory. For a weakly self-screened test object, write acceleration = -gamma phi gradient(phi), where gamma = c^2 aN/mN > 0. At a force-free point with phi > 0, gradient(phi) = 0. In empty space the static field equation gives

    Laplacian phi = mu^2 phi [(phi/phi_vac)^2 - 1]

in natural length units. Therefore at such a point,

    divergence(acceleration) = gamma mu^2 phi^2 [1-(phi/phi_vac)^2] > 0

whenever 0 < phi < phi_vac, with the positive unit conversion understood. The acceleration Jacobian then has at least one positive eigenvalue. Such a stationary point cannot be stable in all three directions under this scalar force alone.

This statement concerns the positive static branch, empty local space, positive mass coupling and the unscreened-test approximation. It is not a theorem about arbitrary dark sectors, time-dependent trapping, field nodes/domain walls, strongly screened extended objects or added electromagnetic confinement. It also does not provide the magnitudes of the nonlinear tensor eigenvalues; the table remains a linear-response result.

The scalar-field background's own fluctuation stability is a separate question. A stable field solution can create an unstable equilibrium for a moving material object, as already noted in the chamber-force audit.

## Consequence for coherence predictions

For an ideal harmonic restoring direction and branches initially at rest, their separation would evolve approximately as d(t) = d(0) cos(omega t), rather than remain 250 nm. Along an uncompensated unstable direction it instead grows as cosh(Omega t) while the local expansion applies. A scattering calculation must use the actual controlled branch histories and recombination operation. It cannot preserve the constant-separation hold simply by selecting the restoring direction.

Neither deterministic oscillation nor a static saddle is itself irreversible decoherence. Trap compensation can alter these trajectories, but its force, noise and preparation contract remain unspecified. The user question about free versus confined hold is still pending; no response or trap capability is assumed.

## Verification and next step

Run `C:\Python313\python.exe docs/research/casimir-dp-portal-plate-force-tensor-2026-09-06.py`. Four checks pass: independent normal-force normalization, Helmholtz trace, the eigenvalue signs in all six plate cases, and increased Cartesian quadrature order. Refinement changes the tested tensor components by at most 1.26e-13 relatively. The adjacent JSON records eigenvalues and trace residuals.

The required next input is a three-dimensional trajectory/confinement model or an explicit parameterized restoring-force bound; meanwhile, alternative coupling regions can be screened against these requirements. The percent-level fixed-branch result remains unadmitted. S1 and the overall goal remain active.

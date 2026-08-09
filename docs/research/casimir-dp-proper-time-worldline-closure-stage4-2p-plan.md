# Casimir-DP Stage-4.2P proper-time/worldline closure plan

## Purpose

Stage 4.2P closes an ordinary-physics omission in the leading Stage-4.2M phase budget. It derives the signed branch phase from frozen worldlines and weak-field metric inputs before any residual is compared with the unchanged regularized Diósi loss law.

The campaign tests the transfer chain

\[
\Delta\tau=\int_0^T\!\left[\frac{\Phi_A-\Phi_B}{c^2}-\frac{v_A^2-v_B^2}{2c^2}\right]dt,
\qquad
\Delta\phi_{\rm prop}=-\frac{mc^2}{\hbar}\Delta\tau,
\]

and the internal-energy visibility bound

\[
\left|C_{\rm int}(\Delta\tau)\right|\simeq
\exp\!\left[-\frac{\operatorname{Var}(H_{\rm int})\Delta\tau^2}{2\hbar^2}\right].
\]

These are ordinary unitary phase and reduced-state dephasing relations. They do not modify the Diósi generator and do not provide a Casimir-to-collapse or proper-time-to-collapse bridge.

## Frozen inputs

- Stage-4.2O campaign receipt and its upstream ancestry are immutable.
- The leading Stage-4.2M diamond apparatus remains fixed: mass \(3.0925052683774525\times10^{-16}\) kg, radius \(2.76302362398029\times10^{-7}\) m, separation \(2.5\times10^{-7}\) m, hold time 0.25 s, and 10 micrometre gap.
- The registered Diósi model, \(R_0=100\) nm, and its conservative and effective-Gaussian exponents remain unchanged.
- The registered total phase-sigma limit remains 0.03464404998245921 rad.

## Runtime contract

The runtime must:

1. Verify the immutable upstream receipt hash.
2. Recover Minkowski, equal-worldline, coordinate-potential-offset, and symmetric-gradient limits.
3. Evaluate Earth gravity, gravity gradients, balanced local apparatus masses, kinematic asymmetry, Earth rotation/Sagnac area, clock skew, control phase, and the transported electromagnetic phase term.
4. Propagate static tilt and spectral tilt bins through explicit echo/path-swap response factors.
5. Keep signed unitary phases separate from the positive Diósi attenuation exponent.
6. Return `not_ready` if the total phase covariance exceeds the frozen limit.
7. Preserve measured evidence as `not_ready`, collapse and manifold identification as `blocked`, and physical viability as `not_evaluated` for this synthetic run.

## Empirical closure still required

The numerical screen is not apparatus authority. A physical pilot still requires measured three-dimensional worldlines, a surveyed local gravity gradient, the as-built local-mass CAD, measured tilt spectra, measured frequency-dependent echo transfer, clock/control covariance, and a specimen internal-energy model. Until then, the pass means only that the declared synthetic covariance fits inside the frozen phase budget.

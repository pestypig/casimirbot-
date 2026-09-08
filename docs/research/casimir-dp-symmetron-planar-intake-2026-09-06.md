# Screened-scalar lead: explicit symmetron extension

September 6, 2026. Exploratory model intake and idealized background calculation. No common recoil/coherence fit, empirical validation, or baseline change.

## Why this lead is relevant

[Banks et al.](https://arxiv.org/html/2511.09750v1) study chameleon and symmetron fields sourced by laboratory matter and calculate interferometric phase shifts. Their symmetron has potential V=-mu² phi²/2+lambda phi⁴/4 and ordinary-matter coupling A=phi²/(2M²). Dense environments suppress the field; finite chamber geometry matters. These are force/phase forecasts, not a demonstration of dark-matter scattering causing visibility loss.

A [June 2026 neutron-interferometry study](https://arxiv.org/html/2606.03440v1) is an additional relevant experimental constraint source for symmetron phase effects. Its constraints have not been digitized or transferred to the particle extension below. A connection through density-dependent screening deserves a calculation, but these papers do not themselves supply an LZ explanation.

## One declared particle extension

Introduce a stable Dirac halo particle chi with even scalar-dependent mass

`m_chi(phi)=m_chi[1+phi²/(2M_chi²)]`,

alongside the ordinary-matter conformal coupling above. This is our explicit illustrative extension; it is not an imported fitted benchmark. Its parameter ledger is (m_chi, mu, lambda, M, M_chi), a halo distribution, and the material density/geometry in each experiment. Couplings cannot be independently retuned between targets.

For slowly varying nonrelativistic backgrounds,

`V_eff = 1/2[-mu²+rho_b/M²+rho_chi/M_chi²]phi² + lambda phi⁴/4`.

Where the quadratic coefficient is negative, the homogeneous minimum is nonzero. Expand phi=phi_bar+varphi. The linear particle/nucleon couplings are

`g_chi=m_chi phi_bar/M_chi²`, `g_N=m_N phi_bar/M²`.

In a homogeneous weak-fluctuation approximation, one-scalar exchange gives a potential proportional to `g_chi g_N/(q²+m_eff²)`. Its recoil rate and decoherence kernel would use the same parameters but the separately solved environmental phi_bar and response. The full inhomogeneous propagator obeys an operator with spatial potential `-mu²+3lambda phi_bar²+rho_b/M²+rho_chi/M_chi²`; replacing it everywhere by one vacuum mediator mass is generally invalid.

In a symmetry-restored xenon environment phi_bar=0, the **linear** vertices vanish. This does not prove zero scattering: quadratic phi² couplings remain, and two-scalar processes, finite geometry and quantum effects require separate analysis. Adding a free linear g_chi phi chi-bar chi term instead would alter the symmetry/background and would constitute a different model. A light screened mediator also does not itself supply the energy of a hard xenon recoil; the incident particle kinematics must do so unless an explicit additional energy-release mechanism is introduced.

## Reproducible one-plane limit

As a solver check and intuition builder, take an infinite perfectly screened plane at z=0, empty half-space z>0 and phi approaching v=mu/sqrt(lambda) at infinity. Ignore gas, halo backreaction and the test sphere. Then

`phi_bar(z)/v = tanh[mu z/(sqrt(2) hbar c)]`.

This follows directly from the static field equation and is independently recovered with a nonlinear boundary-value solver. It is not the frozen finite-plate solution. The evaluation distance 10 micrometers is illustrative, not an authenticated branch-center coordinate.

| mu (eV) | Vacuum fluctuation range (micrometers) | phi_bar/v at 10 micrometers | Squared local vertex-product ratio |
|---|---|---|---|
| 0.001 | 139.53 | 0.035819 | 1.646e-6 |
| 0.01 | 13.953 | 0.343753 | 0.013963 |
| 0.1 | 1.3953 | 0.998458 | 0.993845 |

Because both linear vertices scale with phi_bar, the squared vertex product scales as (phi_bar/v)^4. **These are not rate ratios**: the propagator, particle trajectory, target screening and environmental fluctuations have not been calculated. Nevertheless, the local-vertex effect in this limit is suppression near the wall, rather than an arbitrary enhancement. Vacuum range is also not the effective impact-support radius from the prior flux screen.

Run `python docs/research/casimir-dp-symmetron-planar-intake-2026-09-06.py`. Its companion JSON authenticates the frozen configuration and records four passing checks. The numerical profile differs from the analytic profile by at most 1.76e-12 on the sampled grid. These validate this ideal limit only; no choice of M, M_chi or lambda has been admitted by experiments.

## Connection to the actual coherence experiment

A deterministic static potential supplies a branch phase `-integral(U_L-U_R)dt/hbar`. By itself it does not contract the magnitude of a perfectly controlled pure-state coherence. Visibility loss needs a calculated stochastic/quantum environment, unresolved path dynamics or a scattering channel. A classical field-profile calculation must not be advertised as decoherence evidence.

The minimal coupling above responds to rest-mass density, not directly to optical reflectivity. If active and reference states have the same scalar sources, geometry, boundary conditions and preparation, they have the same stationary scalar solution in this approximation. Their scalar four-cell contribution cancels even if their electromagnetic response differs. Changes of material phase can change stress/energy density, but that effect must be explicitly computed; it cannot be inferred from a boundary label.

The canonical boundary material/Green-function packet is still absent. Before using this lead for a nonzero boundary prediction, identify a physically specified active/reference source difference or an additional declared coupling. Then solve the finite chamber and sphere in both settings, compute the fluctuation propagator/noise state, calculate xenon recoil amplitudes in its environment, and apply the actual screened-scalar constraints. This must preserve the frozen experiment rather than silently adding or removing a plate.

## Decision

Retain this as a specific exploratory extension capable in principle of environmental dependence, but do not rank it as an established rescue of the failed unscreened scalar case. Its immediate admission questions are whether the frozen boundary change couples to it at all, whether the xenon linear vertex survives environmental screening, and what creates decoherence rather than only phase. The one-plane background is now checked; a full common-parameter prediction is not yet available. S1 and the user goal remain active.

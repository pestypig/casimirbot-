# Short-pulse charge-generation screen for the ultralight field

Date: September 25, 2026. Narrow toy-mechanism calculation for the active bosonic dark-sector goal. It tests one proposed way to set the complex field's charge; it is not a UV completion or a general limit on charge generation.

## Toy mechanism and controlled limit

Write `phi=(x+i y)/sqrt(2)` and take a quadratic base potential `V0=m_phi^2(x^2+y^2)/2`. Start with a homogeneous real-field turning point `(x,y,xdot,ydot)=(X,0,0,0)`. During a finite pulse, add `delta_V=mu_xy^2(t)*x*y`; after the pulse, remove it and restore exact `U(1)_phi` symmetry.

During the pulse, the real-field mass matrix has eigenvalues `m_phi^2 +/- |mu_xy^2|`. Requiring a positive-definite quadratic potential gives `|mu_xy^2| < m_phi^2`. For a short pulse with duration `Delta_t`, define `tau=m_phi*Delta_t` and neglect the movement of `x` during the pulse. Then the generated imaginary velocity obeys `r=|delta_ydot|/(m_phi*|X|) <= tau`. Once the mixing is off, the free oscillator's charge-to-energy asymmetry is `epsilon=2r/(1+r^2)`.

The script evaluates this impulse relation for `tau<=0.1`; it also reports what longer pulses would require if the impulse formula were extrapolated, clearly marking those values outside the controlled domain. At the conservative edge `tau=0.1`, the supremum is `epsilon=0.198` (strictly below for a positive-definite pulse). A `epsilon=0.1` target is within the short-pulse domain and requires `r≈0.0501`, or at least that value of `tau` in the impulse bound. The sudden-kick relation for `epsilon=0.5` needs `r≈0.268`, already beyond the declared domain; `epsilon=0.9` would need `r≈0.627`, and `epsilon=1` needs `r=1`. Those latter figures diagnose where a full time-dependent integration is needed; they are not a bound on finite-duration dynamics.

At radiation-era onset `3H=m_phi`, expansion changes by `H*Delta_t=tau/3` during the pulse. Thus `tau=0.1` has only about 3.3% expansion over the pulse and a 0.1-radian oscillation phase; the screen still uses an impulse approximation and assigns no rigorous truncation error. For larger `tau`, integrate the coupled equations in the expanding background instead of extrapolating this result.

## What this changes in the population plan

The charge-budget screen's 10% `phi` fraction does not imply that `epsilon` must be near one. A high charge requirement can only be determined after calculating the stable boson-star charge-mass curve and the fraction of the cosmic charge captured into objects. This toy shows that a stable *short* off-diagonal mass pulse can supply small/moderate asymmetry, while a large asymmetry would require a longer, fully modeled pulse or another mechanism. It does not show that the field forms boson stars or that a pulse existed.

The immediate next calculation should implement the expanding-background equations for a finite pulse profile (including its phase and duration), calibrate pulse strength to a target `epsilon` and final `Omega_phi`, then test post-pulse conservation of comoving charge and energy. A physical scenario must further derive the pulse from a symmetry-breaking sector and verify the cold perturbation spectrum and nonlinear fragmentation. Reject this particular mechanism if the target charge cannot be produced without an unacceptable mass-matrix instability, energy injection, warm component, or incompatibility with the multicomponent abundance budget.

## Reproducibility and limits

Run `python -B docs/research/casimir-dp-ultralight-charge-kick-screen-2026-09-25.py`; the adjacent JSON reports the model, algebraic scan, validity domain, and falsification checks. Embedded assertions check the short-pulse bound and inversion of the asymmetry relation.

This is not a general no-go theorem. Tachyonic intervals, unequal diagonal masses, higher-dimensional torques, derivative couplings, or other production histories require their own field equations and stability analysis. The script does not model expansion during a long pulse, perturbations, fragmentation, star stability, a Galactic population, xenon recoils, gamma rays, or Casimir-DP response.

Status: controlled impulse-limit diagnostic for one temporary quadratic symmetry-breaking interaction; no microscopic pulse generator or star-formation prediction is selected.

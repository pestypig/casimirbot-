# Finite-pulse evolution for a charged ultralight condensate

Date: September 25, 2026. This packet advances the earlier impulse-limit diagnostic by numerically evolving one specified homogeneous-field toy pulse in radiation domination. It remains a prescribed symmetry-breaking profile, not a UV theory or a boson-star formation calculation.

## Model and integration

Write `phi=(x+i y)/sqrt(2)` and solve

`x'' + (3H/m_phi)x' + x + g(u)y = 0`

`y'' + (3H/m_phi)y' + y + g(u)x = 0`,

where primes use `u=m_phi*t`, radiation domination gives `H/m_phi=1/(2u)`, and

`g(u)=g0 exp[-(u-1.5)^2/(2 sigma^2)]`.

The pulse is centered where `3H=m_phi`; it starts from a homogeneous frozen real displacement (`x=1, y=x'=y'=0`) at `u=0.001`. After the pulse, `U(1)_phi` is restored. The instantaneous quadratic mass eigenvalues are `m_phi^2(1 +/- g)`, so the calculation requires `|g0|<1`. The ODE uses SciPy DOP853. The late charge is checked through the spread in `a^3(x y'-y x')` sampled well after the pulse; the late energy action is averaged over the final oscillation.

## Numerical result

A stable Gaussian pulse with `sigma=0.1` cannot reach `|epsilon|=0.5` even when `g0=0.999` (it reaches at most 0.426). A wider `sigma=0.2` pulse reaches `|epsilon|=0.5` at `g0=0.6149`; its minimum squared mass eigenvalue stays `0.3851 m_phi^2`. At `m_phi=1e-17 eV`, its full width at half maximum is about 31 seconds. The pulse raises the late comoving energy action by 6.8% relative to the no-pulse solution, so the initial field amplitude can be scaled by 0.968 to recover the same final `phi` abundance.

A `sigma=0.3` pulse reaches `|epsilon|=0.9` at `g0=0.9733`; the lower eigenvalue is only `0.0267 m_phi^2`, the comoving energy action rises by 32.1%, and the same-abundance initial amplitude factor is 0.870. This is close to the positive-definiteness boundary and noticeably changes the energy budget. These values are a numerical property of the specified Gaussian pulse and initial condition, not a universal charge-generation efficiency.

For each fitted profile, post-pulse comoving-charge variation is below `2e-13` in the reported solve. The late energy action varies within the final-period averaging window by under 2.0% in these cases. Fitting epsilon alone does not determine an absolute `Omega_phi`; the field amplitude must be normalized after accounting for the pulse's energy change. The JSON reports both the energy-action ratio to the no-pulse reference and the amplitude rescaling needed for a fixed final abundance.

## Implication and next gate

The impulse estimate was conservative only within its short-duration limit; the full radiation-era equations show that finite stable pulses can generate larger asymmetry without a tachyonic mass eigenvalue. The price is a pulse lasting a substantial fraction of an oscillation and, for `|epsilon|=0.9`, a near-soft mode and a sizable energy shift. This supports retaining the explicit charge-kick branch for further study, but does not select it: no known sector has yet produced this time profile or demonstrated that its perturbations remain cold and fragment into the desired stable objects.

Next derive `g(u)` from an explicit symmetry-breaking field or interaction, then replace the Gaussian prescription with that derived history and track perturbations, the cold fraction, and nonlinear fragmentation. Map the resulting charge onto the stable boson-star charge-mass curve and population. Only then can the joint multicomponent cosmology update the local unbound heavy-particle flux for xenon. A pulse that cannot produce the required abundance and population without instability or excessive warm excitations should be rejected.

## Reproducibility and limits

Run `python -B docs/research/casimir-dp-ultralight-charge-pulse-evolution-2026-09-25.py`; the adjacent JSON contains the ODE, constants, profile/target scans, charge-conservation checks, energy bookkeeping, and limits. The script includes assertions on reachability, positive eigenvalues, charge conservation and energy-window stability.

This is a homogeneous scalar on a fixed radiation-dominated background. It omits thermal degrees-of-freedom transitions, the sector that sources the pulse, inhomogeneous perturbations, self-interactions, nonlinear fragmentation, gravitational star stability, a Galactic population, relic coupling to the inert-doublet `H`, the xenon likelihood, gamma-ray yields and Casimir-DP response. It is therefore a charge-generation submodel only, not a compatibility-model prediction.

## Minimal dynamical-source budget

A possible renormalizable source is a real scalar `S` with a CP-phase choice that yields the trilinear mixing term `delta_V=mu*S*x*y`. A complete bounded potential needs stabilizing quartics; this packet does not solve that potential or evolve `S`. It does show why treating the Gaussian `g(u)` as an energetically free background is unsafe.

Let `F_phi` and `S0` denote characteristic field amplitudes near the pulse, and let `M_S` be the source mass. The source's quadratic energy fraction relative to the ultralight field is

`R_S = M_S^2 S0^2 / (m_phi^2 F_phi^2)`.

The source backreaction scale, comparing its coupling force at `x*y ~ F_phi^2` to its restoring force, is

`B = |mu| F_phi^2 / (M_S^2 |S0|)`.

The required pulse amplitude is `g0=|mu| |S0|/m_phi^2`, hence `R_S*B=g0` in this convention. Therefore at least one of these two characteristic scales must be at least `sqrt(g0)`. For the numerically fitted `epsilon=0.1` pulse with the lowest `g0` in the scanned profiles (`sigma=0.3`, `g0=0.0805`), the larger scale is at least 0.284. If the source energy is constrained to 1% of the phi energy, the corresponding backreaction scale is at least 8.05; if backreaction is kept below 0.1, the source energy fraction must be at least 0.805. For the `epsilon=0.5` and `0.9` fits, the tradeoff is more severe. This is an envelope-level diagnostic, with order-one dependence on the actual time-dependent `x*y`; it is not a cosmological exclusion.

The implication is concrete: a physical scalar `S` cannot simply be added as a negligible passive clock while preserving the prescribed pulse strength. It must either carry an appreciable transient energy budget or evolve strongly through energy/charge transfer with phi. The next adequate model must evolve `S`, `x`, and `y` together, include a bounded potential, track the radiation bath or any decay products, and verify charge/energy accounting across the pulse. Its coupling then feeds into the candidate's cosmology rather than serving as a free pulse knob.

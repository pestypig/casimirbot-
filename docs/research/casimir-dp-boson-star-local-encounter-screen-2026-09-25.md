# Local encounter screen for Sgr A*-scale ultralight boson stars

Date: September 25, 2026. Candidate-neutral translation of an astrophysical boson-star model into a conditional local encounter rate. It tests whether bound ultralight objects can serve as a recurring local laboratory population; it is not a Galactic abundance fit or a dark-matter detection claim.

## Frozen reference and assumptions

The stable Model B mini-boson-star in [Olivares et al., arXiv:1809.08682](https://arxiv.org/abs/1809.08682) is scaled to `M=4.02e6 Msun` and constituent mass about `1e-17 eV`; the paper reports `C99=M99/R99=0.075` for this stable configuration. This is a reference solution, not an identification of Sgr A* or a prediction that such objects form in the Milky Way. Taking `M99=0.99 M` gives `R99=0.524 AU`.

For a transparent local-population screen, take the review's total local density range `0.3-0.6 GeV/cm^3` and scan compact-object fractions `0.01, 0.1, 1`, assuming the objects co-trace that density. Use fixed relative speeds `150, 220, 300 km/s`, not a fitted velocity distribution. For each case, object number density is `n=f_obj*rho_local/M_star`; the 99%-mass mean spacing is derived from `n`.

The focused encounter proxy uses a Schwarzschild test-particle geodesic: for asymptotic speed `v`, mass `M`, and target periapsis `R99`, solve

`b^2/R99^2 = [gamma^2/(1-r_s/R99)-1]/(gamma^2-1)`,

with `r_s=2GM/c^2`. The object is extended and has no hard surface, and 1% of its mass lies outside `R99`; thus the result estimates a close passage into the dense region. A separate straight-line geometric rate is reported as a comparator.

## Result

At the central co-tracing scenario (`rho_local=0.4 GeV/cm^3`, `f_obj=0.10`, `v=220 km/s`):

- The compact-object number density is `2.62e-10 pc^-3`, with mean spacing `1.56 kpc`.
- Gravitational focusing raises the impact parameter for a trajectory reaching `R99` to about `302 AU`.
- The focused close-passage rate is `3.96e-19 per year`, or a mean interval of `2.52e18 years`; the probability during an illustrative ten-year exposure is `3.96e-18`.
- If every bit of local dark matter were in these objects, the rate would be ten times higher and the ten-year probability would still be only `4e-17`.

Across the full density, object-fraction, and speed grid, the focused mean interval remains above `1e15 years`. Focusing matters enormously relative to straight-line geometric crossing, but it does not turn this compact-object population into a recurring detector exposure. The local density range is based on the [de Salas-Widmark review](https://arxiv.org/abs/2012.11477); that is total dark matter density, not a measurement of compact objects.

## Compatibility implication

A stable ultralight boson-star population may remain relevant to gravity and astrophysical imaging, but bound objects at this mass scale do not supply continuous local particle flux for xenon recoils. A xenon explanation in the multicomponent branch needs an independently predicted diffuse heavy component (the IDM `H` candidate) or a quantitatively modeled particle-release mechanism. Counting boson stars as particles in the detector flux would violate the population/observable mapping. The same encounter rate also prevents assuming frequent local star passages as a Casimir-DP modulation source.

The result is conditional on equal masses, local co-tracing, and the chosen speed grid. It does not yet apply microlensing/dynamical exclusions to an inferred mass function, infer the local compact fraction, or calculate a continuous-field gravitational phase. Those remain distinct astrophysical and detector calculations.

## Reproducibility and decision rule

Run `python -B docs/research/casimir-dp-boson-star-local-encounter-screen-2026-09-25.py`; the adjacent JSON contains all 27 local-density/fraction/speed cases, cross-sections, rates, ten-year probabilities, assumptions and falsification criteria. The script asserts the reference radius scale, focusing enhancement and negligible-rate criterion.

The root-to-leaf manifest records this as a diagnostic cross-domain path and requires explicit population assumptions plus a diffuse or sourced-release model before any local xenon flux claim. The overall compatibility goal remains active.

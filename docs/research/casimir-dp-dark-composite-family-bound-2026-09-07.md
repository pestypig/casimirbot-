# Elastic composite family: conditional high-recoil bound

Program gate: S1. Analytic Born-family screen; no experimental exclusion or physical-maturity promotion.

## Scope and derivation

The [published saturated nugget approximation](https://arxiv.org/html/1812.07573v1), equations 6, 17 and 29, supplies M=N mbar, R=C N^(1/3)/mbar with C=(9 pi/4)^(1/3), uniform elastic F(x), and the approximate unscreened condition g_d <= kappa N^(-1/3). We expose its unknown order-one coefficient kappa; the calculation uses one, rather than treating it as an exact universal physical limit.

Our derived flux-weighted charge bound is

alpha^2/M <= g_N^2 kappa^2 R/(16 pi^2 C), where alpha=N g_d g_N/(4 pi).

For a normalized positive uniform density |F|<=1. Thus x F(x)^2<=4 for x<=4. For x>=4 the explicit spherical form factor gives x F(x)^2<=9(1+x)^2/x^5, which decreases and is already below 4 at x=4. Consequently R F(qR)^2<=4/q for every radius. This deliberately loose analytic envelope avoids numerical optimization and applies to the elastic Born term only.

Elastic nuclear scattering also requires v>=q/(2 mu)>=q/(2 m_A). For any normalized nonrelativistic incident speed law, its inverse-speed integral divided by q is therefore at most 2 m_A/q^2. Combining these inequalities removes constituent number, mean constituent mass, radius and the speed distribution from an upper envelope on the raw differential recoil rate. We additionally replace the ordinary nuclear form factor squared by one. All inequalities enlarge the elastic rate within this family; they do not assume parameters can simultaneously saturate them.

## Results

At density 0.3 GeV/cm^3, exposure 2.84 tonne-years, representative xenon A=131.293, kappa=1 and the inherited conservative ordinary-force coupling ceilings:

| Mediator | Raw elastic 200–269.9 keV upper envelope | Raw elastic 5.4–269.9 keV upper envelope |
|---|---:|---:|
| 0.001 eV | 6.93779e-12 | 2.10981e-8 |
| 0.01 eV | 6.93779e-5 | 0.210981 |

These values scale as kappa squared and linearly with density and exposure. The high-band envelope at 0.01 eV would require kappa about 120 merely to reach one raw event, far beyond an order-one adjustment; this is not an allowed parameter solution.

The source force ceilings are coarse conditional inputs, authenticated from the earlier force-screen JSON, not a new force likelihood. A mean xenon target is retained, rather than an exact isotope sum. These are true-energy elastic bounds, NOT upper bounds on accepted events: resolution can move events across the chosen boundaries. They are neither an official LZ exclusion nor a fit to its candidate.

## Consequence for the goal

Changing nugget size or constituent count within this unscreened scalar elastic family at these two mediator masses does not rescue a substantial high-recoil raw rate. That removes the motivation for an unrestricted size scan here. It does not exclude other mediator masses, screened internal dynamics, non-Born scattering, inelastic excitations or breakup; those require changed response calculations. In particular, once individual constituents are resolved, the elastic form-factor bound cannot be asserted for the inclusive rate.

No local coherence sensitivity is inferred from this result. The next substantive composite lead is a microscopic inelastic response that can supply high recoil while its elastic companion contributes soft scattering, with consistent state populations and survival. Alternatively, a different mediator range requires updated ordinary-force and stellar constraints before a joint calculation. Avoid repeating the now-bounded elastic size scan.

Verification: script hash-checks its force input and compares the numerical recoil integral with an independent massless-propagator analytic envelope. Assertions passed. Documentation validation is not physical validation; no certificate claim.

# Self-consistent depletion ceiling for the exothermic benchmark

Exploratory snapshot, September 7, 2026. The previous packet required a long lifetime at a fixed cross section. This calculation instead solves for cross section and surviving excited fraction together. It is conditional population dynamics, not a UV completion or experimental exclusion.

Let sigma0=1e-45 cm², x=sigma_b/sigma0, r=|Ce/Cb|, and F the electron-pair phase-space factor. With fixed r and the preceding approximate electron-vector lifetime normalization tau0, the lifetime is tau0/(x r² F). For an initial excited fraction f0 and elapsed time t, assuming constant decay rate and no replenishment,

`f_present=f0 exp(-b x)`, `b=t r² F/tau0`.

The present scattering strength relative to the previously chosen benchmark is `S=x f0 exp(-b x)`. Its derivative is `f0 exp(-b x)(1-b x)`, so the global maximum for positive x and b occurs at x=1/b, with `Smax=f0/(e b)`. Recovering S=1 is possible only when `r sqrt(F)<=sqrt(f0 tau0/(e t))`.

For the diagnostic t=4.35e17 s:

| Mass | Ceiling for f0=1 | Ceiling for f0=0.5 |
|---|---|---|
| 10 GeV | 1.69e-5 | 1.19e-5 |
| 15 GeV | 4.24e-5 | 3.00e-5 |

These are approximate requirements on r sqrt(F), not direct bounds on r alone. The lifetime normalization, F, mixing boundary and initial population remain uncertain or unspecified. Small numerical differences near the ceiling are not physical exclusion precision.

When b/f0<1/e there are two positive solutions, `x=-W_0(-b/f0)/b` and `x=-W_-1(-b/f0)/b`; at equality they merge. One uses a smaller cross section and larger surviving fraction, the other a larger cross section and more depletion. Neither is preferred without independent constraints. At r sqrt(F)=1e-5 and f0=1, the 15 GeV smaller-cross-section solution has x=1.02114 and f_present=0.97930. It reproduces the chosen present signal product, not an observed fitted rate.

The [script](casimir-dp-exothermic-depletion-ceiling-2026-09-07.py) authenticates the previous lifetime ledger, evaluates both roots where they exist, and independently integrates the population ODE. Root substitution and ODE agreement pass. Full cases are in [JSON](casimir-dp-exothermic-depletion-ceiling-2026-09-07.json).

This ceiling explains why increasing the scattering strength cannot always compensate for lost excited particles. Both xenon and independent-carbon rates scale with S at this order, so compensation cannot selectively increase the local signal. In the baryonic/photon-mixing completion the proton/neutron amplitude shift must also be applied; these results isolate the population factor while holding r fixed.

The assumptions exclude replenishment, time-dependent couplings, additional decay modes and changes in initial production. Daughter-mass corrections of order gap/mchi are neglected consistently with the NR benchmark. Closing electron-pair decay at the heavier points does not establish survival through other channels. Next determine r and F from a specified mediator, rather than selecting a favorable value to recover S=1. Frozen apparatus and active research goal remain unchanged.

Validation: analytic maximum, Lambert-root substitution and independent population ODE; root-leaf documentation check separately.

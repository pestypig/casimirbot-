# First shared neutrino up-scattering forecast

Exploratory model calculation, September 7, 2026. No fitted LZ normalization, exclusion claim or measured local residual is assumed.

## Explicit model and inputs

Use three degenerate orthogonal outgoing Dirac states chi_alpha with interaction y sum_alpha chi-bar_alpha PL nu_alpha phi + h.c., and equal physical scalar couplings yq to up/down quarks. Define each physical vertex once; do not double a real quark scalar coupling by adding its hermitian conjugate again. This flavor-inclusive extension differs from a single unspecified final state. Summing over outgoing states gives Y†Y=y²I, so unitary active-flavor propagation preserves the inclusive rate. We assume negligible absorptive/sterile losses over the contributing energy range and the same cross section for the corresponding antineutrino process. A full high-energy Earth-transport treatment is absent.

For both targets use y=yq=0.02 m_phi/GeV, with produced masses 1 and 2 GeV and mediator masses 1 and 10 GeV. Thus sqrt(y yq)/m_phi=0.02 GeV^-1 is fixed, and the separate mediator mass remains explicit. These are declared benchmarks, not selected after observing counts. Apply the pinned 2026 DUNE solar-minimum flux to both targets as a common-site diagnostic; the actual local experimental site is unknown.

The scalar up/down nucleon fractions and Klein–Nystrand prescription follow [the proposal's equations 2–5](https://arxiv.org/html/2609.04185v1). Quark masses 2.16 and 4.67 MeV are explicit benchmark inputs in a presumed common 2 GeV convention; their uncertainty and consistency with those scalar fractions are not assessed here. Xenon uses natural isotope abundances rather than one representative isotope. The microscopic cross section is not multiplied by a halo density or velocity: incident neutrino flux already carries the required rate units.

An independent spin-trace check gives the invariant numerator proportional to `(m_chi²+2MT)(4M²+2MT)` for the left-handed incident neutrino and spin-averaged target fermion. Dividing by `32pi M E_nu²` recovers the stated cross-section kinematic factor. Its nuclear extension is the stipulated coherent one-body prescription, not a derivation of a complete nuclear response.

The recoil fold uses the exact E_min(T) and integrates incident energy through 10 TeV. The resulting flux kernel is integral Phi(E)/E² dE. No few-GeV cutoff or one-event normalization is imposed. Flux beyond 10 TeV is outside this calculation and must be assessed separately.

## Conditional results

| Produced / mediator mass, GeV | Raw Xe 5.4–269.9 keV | Raw Xe 202–269.9 keV | Independent carbon D upper estimate |
|---|---:|---:|---:|
| 1 / 1 | 1.72200 | 0.0496095 | 9.64821e-23 |
| 1 / 10 | 1.79678 | 0.0550756 | 1.98084e-21 |
| 2 / 1 | 0.0283457 | 0.000930792 | 1.52797e-23 |
| 2 / 10 | 0.0296388 | 0.00103356 | 9.36763e-22 |

Xenon exposure is 2.84 tonne-years. These are true-recoil counts before efficiency, resolution, background fitting or outgoing-state survival requirements. Carbon uses the frozen sphere mass, isotope abundance and 0.25 s hold. We set its nuclear form factor to one and integrate all free-nucleus recoil energies allowed by the tabulated incident range. D<=2N then supplies a generous upper estimate within that independent point-nucleus prescription. It does not bound all solid-state, relativistic, nuclear-breakup or driven processes. In particular the scalar nucleon/point-nucleus cross section is extrapolated to high recoil in this upper estimate; no complete UV bound is claimed.

The source's broader 202–296 keV window yields raw counts 0.0910107, 0.102414, 0.00175107 and 0.00197149 in the same row order. The difference between this window and the archived analysis boundary is material. There is appreciable low-recoil weight in all four rows, consistent with the earlier exact kinematics when the incident flux extends beyond a few GeV. Whether any parameter set survives low-energy data requires detector folding and a likelihood; a hard cutoff cannot be supplied merely by declaring the high-energy flux small.

This lead changes the incident population and gives a reproducible common-target comparison, but the computed carbon effect still lies far below the frozen DP comparator. That comparator is theoretical, not a local measurement. Neither a raw count near one nor this local null prediction establishes the origin of the LZ event.

## Validation and next work

The [script](casimir-dp-neutrino-joint-2026-09-07.py) authenticates archived flux and apparatus dependencies and writes [four forecasts](casimir-dp-neutrino-joint-2026-09-07.json). Four checks pass: flux-kernel comparison with direct integration, carbon incident-grid refinement, nested xenon windows and fourth-power coupling scaling. The tested carbon refinement changes its result by 8.94e-6 relative; this is numerical convergence, not a physics uncertainty. Root/leaf validation passes.

Next priorities are the low/high spectral-ratio test over mediator and produced mass, independent detector normalization, outgoing-state lifetime/survival and applicable accelerator/meson constraints. A light mediator invalidates a heavy-mediator EFT limit in some regimes; it does not automatically remove all collider constraints. The flavor extension, shared-site assumption and high-energy truncation must stay visible in subsequent comparisons.

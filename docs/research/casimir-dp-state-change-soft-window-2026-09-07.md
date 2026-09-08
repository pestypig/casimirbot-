# State-changing scattering: signed splitting in the soft window

Date: 2026-09-07. Exploratory necessary kinematic condition, not a total rate bound.

The earlier mechanism-bridge packet already identified the large-endothermic-splitting obstruction. This extension includes exothermic transitions and quantifies the frozen whole-sphere soft window. It is a screening step for off-diagonal interactions, not a new fitted model.

For nonrelativistic two-body scattering from a stationary rigid target, energy conservation gives v dot q = delta + q squared/(2 mu), where delta is final minus initial dark-particle rest energy. Thus abs(delta + q squared/(2 mu)) <= v q. This is the signed form of the standard inelastic minimum-speed relation; see [Smith and Weiner](https://arxiv.org/abs/hep-ph/0101138). No internal target excitation or additional emitted particle is included.

For q <= hbar/R = 0.71417044 eV/c, v <= 776 km/s and a 100 GeV incident particle, the union of allowed splitting intervals is approximately -0.001848600 <= delta/eV <= +0.001848600. The script uses mu=m_dark, the infinite-sphere-mass limit. For the frozen sphere this is an excellent mass approximation. Both interval endpoints occur at the largest q because q is much less than mu v.

A large negative splitting does not permit arbitrarily soft rigid-target scattering: the released energy must appear in the final kinetic energies. Internal phonons, radiation or another final particle can change this conclusion, but require their own energy/momentum-resolved response and rate. The qR<=1 region is a fully coherent window, not a sharp cutoff of the actual sphere form factor. Harder recoils can still decohere; this calculation does not show zero total decoherence outside the window.

Research consequence: a state-changing mechanism with keV splitting cannot inherit the earlier fully coherent sphere enhancement. A nearly degenerate interaction below about 1.85 meV can pass this necessary condition, but that small splitting alone cannot be credited with reshaping a keV nuclear spectrum. Any off-diagonal dark interaction must also retain the ordinary-matter force audit: changing the dark vertex does not by itself remove force exchange between two ordinary bodies.

Next lead specification should explicitly distinguish direct state-changing scattering from virtual elastic scattering or radiative/inelastic target channels. Require one microscopic model to predict their relative rates, state populations and both target responses. Do not independently normalize them to achieve overlap.

Matching Python/JSON authenticate the frozen apparatus and compute the signed interval. No GR, apparatus or certificate values changed. The overall prediction-model goal remains open.

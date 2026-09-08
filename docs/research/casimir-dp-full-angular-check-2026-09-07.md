# Full angular independent check — 2026-09-07

Exploratory S1 numerical verification at 650 km/s for Xe131. The same extended
Helm potential, mass convention and coupling magnitude are used. This completes
a full-angular check at one speed; it does not complete isotope or speed coverage.

## Independent calculation

Adaptive DOP853 integration computes every phase shift l=0 through 202 for
both potential signs, with relative tolerance 1e-11 and outer radius
x=m_med*r=36. The regular central boundary condition and segmented amplitude
rescaling follow the prior independently checked adaptive method. Unlike the
Numerov result, the adaptive phases are used without free-phase subtraction.
Both methods share the physical potential and asymptotic matching formulas.

The script integrates the angular amplitude with 480 Gauss-Legendre nodes and
compares the high band with 240 nodes. It also checks the angular total against
the partial-wave sum, and retains truncations at l=142,172,202. The high band
is clipped at the Xe131 elastic endpoint, not assumed open up to 269.9 keV.

## Results

Relative differences (adaptive / Numerov - 1):

| Sign | Total | 5.4–10 keV band | 200–269.9 keV band |
| --- | --- | --- | --- |
| Attractive | 4.31e-8 | 3.21e-7 | -2.8743e-4 |
| Repulsive | 7.55e-8 | 3.07e-7 | -2.0051e-4 |

Thus the high-band differences are 0.0287% and 0.0201%. The independent
calculation preserves the previously observed sign-dependent high-recoil
correction. Increasing adaptive lmax from 172 to 202 changes the high band
by about 2.3e-6 relatively for attraction and 1.6e-6 for repulsion.
Angular quadrature refinement and angular-total consistency meet 1e-7 relative
checks. The predefined method-comparison criterion was 0.5% and cutoff criterion
0.1%; both pass without relaxing them after observing results.

This does not prove that the two methods are free of every shared error, or
supply a physical uncertainty interval. The small method difference should
remain in numerical error accounting rather than be rounded to exact agreement.
Potential parameters, charge-profile assumptions and isotope masses were not
varied by this check.

## Implication for the shared-model goal

The finite-speed sign dependence is supported by two integration methods for
a full recoil-band calculation at one speed, rather than only selected phases.
The large low/high imbalance of the exploratory elastic benchmark remains an
unresolved physical problem; numerical agreement does not make it a fit.

Next extend the matched differential calculation to the natural isotope mixture
and relevant speeds, preserving the common coupling and sign across targets.
Only then update transport and detector sample transfer. The local diamond
response and captured-population supply must remain part of the same model;
this check establishes neither a measurable local signal nor an allowed point.

No accepted-event prediction, LZ exclusion, proof certification or experimental
validation is claimed. Source hash, numerical method comparison, angular
quadrature and cutoff checks pass. Documentation validation is separate.

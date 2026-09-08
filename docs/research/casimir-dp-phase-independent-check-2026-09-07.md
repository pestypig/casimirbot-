# Independent selected-phase check — 2026-09-07

Exploratory numerical verification of the Xe131 finite-speed calculation,
without changing its interaction or charge profile.

The companion script independently integrates the second-order radial equation
using adaptive DOP853, beginning with a finite-central-potential regular series.
It rescales solutions between integration segments to avoid overflow. Unlike
the Numerov implementation, it does not subtract a computed free phase. Both
methods use the same potential and asymptotic spherical-wave matching, so this
is independence of integration method, not independent nuclear input.

At 650 km/s, compare l=0,1,2,5,10,20,40 for both attractive and repulsive signs.
All fourteen comparisons pass the predeclared 1e-6-radian absolute criterion.
The largest discrepancy is 1.50e-7 radians at l=0; the other checked waves
agree within 3.24e-9 radians. Tightening adaptive tolerance from 1e-10 to 1e-11
changes checked phases by less than 2.9e-9 radians. Free-potential controls
at l=0,10,40 pass a 1e-7-radian absolute criterion.

The larger s-wave difference is consistent with a residual finite-start error
in the Numerov calculation, but this check does not uniquely identify its
source. Preserve it as numerical uncertainty rather than claiming exact
agreement. The prior high-band refinement error was already about 0.2%.

This strengthens confidence that the previously observed sign dependence is
not a gross integration artifact. It does not independently verify every
partial wave, integrate the entire high-recoil tail with the second solver,
or establish an error bound for a cancellation-sensitive differential rate.
The full angular result and isotope/speed extension remain necessary before
using corrected cross sections in transport. No detector acceptance, local
coherence enhancement or experimental exclusion is established.

Source hash, adaptive refinement, phase comparison and free controls passed.
The numerical result retains exploratory status; documentation validation
is not proof certification or model validation.

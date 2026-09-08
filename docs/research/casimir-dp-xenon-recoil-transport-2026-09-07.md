# Energy-updating xenon slab pilot

Exploratory S1 calculation, September 7, 2026. This supplies collision
histories, not a detector-response simulation or admitted shared model.

Use the same 300 g/cm² diagnostic Xe slab and scale-3.9 microscopic
benchmark. Incident trajectories are normal to an infinite planar slab.
At each step, a point-charge total cross section supplies the free-path
proposal and isotope choice. The analytic Yukawa inverse recoil CDF supplies
the energy proposal. Accepting with Helm F² implements null-collision
thinning: a rejected proposal advances position but does not transfer energy.
An accepted collision updates particle energy and laboratory direction by
two-body kinematics and records the recoil. The process ends on exit or
kinetic energy below 0.001 keV. That numerical floor is not a capture label.

| Incident speed, km/s | Far exits / 5000 | Energy-floor histories | Mean deposited keV | Exactly one / at least two individual recoils above 5.4 keV |
| --- | --- | --- | --- | --- |
| 98.77 | 19 | 4947 | 5.416 | 0 / 0 |
| 150 | 2873 | 2113 | 7.742 | 728 / 1 |
| 250 | 4969 | 29 | 2.630 | 414 / 24 |
| 776 | 5000 | 0 | 0.2453 | 35 / 0 |

The remaining histories exit through the entrance. Recoil-threshold counts
cover all incident histories, not only far exits. At 98.77 km/s, incident
kinetic energy is 5.428 keV; multiple soft recoils transfer nearly all of it
without any individual recoil crossing the 5.4 keV diagnostic threshold.
Whether their light and charge combine into observable pulses is unresolved.

Energy conservation is checked per history: summed recoil energy plus final
kinetic energy reproduces the incident value, with maximum error below
1.8e-13 keV in these runs. All histories terminate within the 10,000-step
limit. A separate 20,000-history 30 g/cm² control gives 19,523 no-recoil
histories, consistent within six binomial standard errors with the integrated
Helm no-collision probability. This tests the null-collision total rate.

NPZ records terminal state, speed in units of c, direction cosine, deposited
energy and individual recoils (history id, normalized depth, keV, isotope A).
The JSON records the archive hash and source provenance. Positions are slab
coordinates, not LZ coordinates or calibrated pulse times.

Next: couple the supplied outgoing rock distribution to the Xe entry
distribution and determine recoil separability using detector geometry and
response. The Born approximation, stationary nuclei, ideal slab geometry,
absence of pulse selection, finite sample size and energy floor all remain
limitations. No accepted event counts, external exclusion, captured density
or measurable local coherence follow from this pilot.

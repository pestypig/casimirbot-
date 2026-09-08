# Natural-xenon threshold kernel — 2026-09-07

Exploratory S1 extension of the pinned finite-speed isotope calculation to
602 and 610 km/s. The same interaction magnitude, signs, nuclear mass
conversion and Helm profiles are retained. No parameter is adjusted after
observing the threshold behavior.

## Isotope thresholds for a 200-keV recoil

| Isotope | Minimum speed (km/s) |
| --- | --- |
| Xe124 | 601.12135 |
| Xe126 | 601.48429 |
| Xe128 | 601.87928 |
| Xe129 | 602.08861 |
| Xe130 | 602.30481 |
| Xe131 | 602.52887 |
| Xe132 | 602.75943 |
| Xe134 | 603.24177 |
| Xe136 | 603.75057 |

These follow directly from vmin=sqrt(m_A E_R/(2 mu_A^2)) in the elastic
stationary-nucleus model. At 602 km/s only the first three isotopes are open,
with combined number fraction 0.020944. This is a fraction of target atoms,
not a signal efficiency. Their relative contributions additionally depend
on cross section and the small available recoil interval.

## Corrected fixed-speed mixture

Low denotes 5.4–10 keV; high denotes 200–269.9 keV clipped at each endpoint.

| Speed (km/s) | Sign | Low / Born | High / Born | Low / high |
| --- | --- | --- | --- | --- |
| 602 | Attractive | 0.99559 | 0.79644 | 5.3953e8 |
| 602 | Repulsive | 1.00607 | 1.13930 | 3.8113e8 |
| 610 | Attractive | 0.99570 | 0.71741 | 432,777 |
| 610 | Repulsive | 1.00593 | 1.25792 | 249,356 |

These are cross-section ratios, not expected observed counts. Neither speed
can produce the central 248-keV candidate recoil in this elastic benchmark.
The calculation concerns entry into the high band near its 200-keV lower edge.
At 602 km/s, the six closed isotope channels remain zero in mixture sums;
their low-energy scattering is retained. Closed bands are recorded as null
in individual rows rather than represented by an invented small response.

## Checks and limits

The extension hashes its parent implementation and inherits the fine mesh,
charge-profile, angular-total and source checks. Sixty open-band Born
normalization comparisons pass against the independent recoil-energy kernel.
The output was also checked for closed high bands in every A>=129 row at
602 km/s. Natural mixtures sum weighted cross sections, not ratios.

The independent adaptive full-angular check remains at Xe131 and 650 km/s.
It is not repeated for these very narrow threshold bands, so no sub-percent
physical accuracy claim is made here. A dense speed interpolation must respect
each exact endpoint, be checked at additional direct evaluations, and avoid
creating nonzero rates below threshold. These two points alone do not bound
all intermediate behavior or refold a transported distribution.

## Search consequence

Near-threshold slowing worsens the low/high accompaniment in the sampled
cases. The nonperturbative correction does not provide a threshold loophole
for this elastic benchmark. Keep the branch as a constrained comparison;
any further detector fit must address the accompanying low-energy population,
not merely normalize an order-one high-band count.

The results do not establish an LZ exclusion or rule out every other particle
model. Actual transport, sample selection, finite-speed local target response,
population supply and external constraints remain required for the shared goal.
No experimental validation, certified proof or measurable common parameter
point is claimed.

# Raw lower-energy xenon spectrum from saved weighted histories

Exploratory S1 screen, September 7, 2026. No detector likelihood or accepted
counts are inferred. The shared microscopic/slab normalization is unchanged.

The saved NPZ is hash verified and loaded without pickle. For every far exit,
the code integrates the inherited isotope-weighted Helm response up to its
speed-dependent elastic endpoint. Separate cumulative tables for nine energy
bands avoid subtracting a large low-energy integral to obtain a tiny high
band. The planar crossing-to-volume factor 1/cos(exit) is retained, with the
same infinite uniform illumination and thin-target assumptions as before.
Direct recoil quadrature at five speeds checks table interpolation.

| Scale | Run | Raw 5.4–200 keV | Raw 200–269.9 keV |
| --- | --- | --- | --- |
| 1 | 0 | (3.306 +/- 0.024)e14 | (3.802 +/- 0.032)e8 |
| 1 | 1 | (3.255 +/- 0.037)e14 | (3.790 +/- 0.028)e8 |
| 3.9 | 2 | (4.59 +/- 0.96)e8 | 1.010 +/- 0.114 |
| 3.9 | 3 | (8.46 +/- 4.85)e8 | 0.878 +/- 0.104 |

Uncertainties are empirical Monte Carlo errors, not model uncertainties.
The two strong-run low-band effective sample sizes are 23.0 and 3.05; one
history contributes 13.4% and 56.8% respectively. Do not average these into
a precise normalization. High-band ESS values are 79.1 and 70.6, with
largest shares below 5%. The JSON retains per-bin and correlated band-sum
statistics rather than adding independent bin errors.

The near-one high-window count survives this pilot, but the previously
omitted lower spectrum introduces a major compatibility and validity issue.
These enormous raw low-energy integrals cannot be interpreted as predicted
selected single-scatter events: detector opacity, multiple-scatter rejection,
thresholds, reconstruction and response have not been included. A count
exceeding one does not itself demonstrate opacity; the relevant optical
depth must be calculated from cross sections and detector columns.

Disposition: suspend normalization claims for the strong root until its
low-energy detector transport is checked. A full detector calculation cannot
be replaced by multiplying all bins by one acceptance number. Conversely,
the raw excess is not an official exclusion. The remaining captured-cloud
supply and measurable local coherence requirements are still unresolved.
Prioritize a detector optical-depth/selection audit before another coupling
scan or precision fit to the high-energy candidate.

The script and JSON preserve archive provenance, energy bins, quadrature
checks and sampling diagnostics. The 1 keV capability cutoff still needs a
response-tail justification for a complete reconstructed-energy prediction.

# Shared-model low/high xenon spectrum screen — 2026-09-07

Exploratory S1 conditional calculation. Same 100-GeV particle, 10-MeV mediator,
chosen silica column, incident population and coupling (3.9 times the previous
strong uncollided root); no independent low-energy normalization is introduced.
Frozen local apparatus inputs remain unchanged.

## Method and checks

The companion script pins the bounded-mixture and xenon-spectrum source hashes.
It extends isotope/Helm recoil integration to 5.4–269.9 keV, keeping the original
200–269.9-keV reference normalization. A geometric low-energy quadrature grid
and linear high-energy grid are checked against direct integration at seven
speeds from 100 to 776 km/s. Checks use absolute error divided by max(1, direct
normalized response), below 1e-5. The inherited output field name says
`max_absolute_normalized_error`; in this packet the metric includes that
additional max(1, direct) scaling.

Each of two sampling choices uses 500,000 ordinary and 500,000 biased stopped
histories, with bounded mixture weights. Recoil-bin response includes outgoing
speed and the infinite uniformly illuminated slab's 1/cos(exit) factor. Errors
for summed low and high bands are computed from each history's summed response,
not by treating correlated bins as independent. Total normalization is
0.999799 +/- 0.000217 and 1.000127 +/- 0.000241.

## Results: raw thin-target interaction expectations

| True recoil band (keV) | Proposal 0.70/0.50 | Proposal 0.65/0.60 |
| --- | --- | --- |
| 5.4–10 | 3.388e8 | 4.504e8 |
| 10–20 | 1.169e8 | 1.894e8 |
| 20–50 | 2.372e7 | 3.469e7 |
| 50–100 | 3.324e5 | 4.263e5 |
| 100–150 | 1,620 | 1,898 |
| 150–200 | 172 | 204 |
| 200–220 | 0.9824 | 0.8962 |
| 220–240 | 0.05408 | 0.06143 |
| 240–260 | 0.000990 | 0.001201 |
| 260–269.9 | 0.00000409 | 0.00000379 |

Summed 5.4–200-keV predictions are (4.80 +/- 0.64)e8 and (6.75 +/- 1.48)e8.
Summed 200–269.9-keV predictions are 1.037 +/- 0.069 and 0.959 +/- 0.070.
All errors are empirical sampling standard errors; unresolved weight tails and
model uncertainties are not covered. The point ratios are about 4.6e8 and
7.0e8. No ratio confidence interval or converged rare-event claim is made.

## Decisive limitation and next model test

This is a major spectral tension for the conditional benchmark, not an LZ
exclusion: raw expected interactions cannot be substituted for selected events.
In particular, the thin-target extrapolation becomes inadequate for slower
particles. As an independent warning diagnostic, retain the previous chosen
300-g/cm2 point-Xe131 column: scaling its 776-km/s optical depth gives tau
0.257 at 776 km/s, 0.430 at 600, 1.71 at 300, 3.81 at 200, and 14.44 at
100 km/s. These use sigma(v) proportional to 1/(m_med^2+4 mu^2 v^2),
with m_Xe=131*0.93149410242 GeV. They are point-nucleus fixed-speed column
values, not a Helm detector simulation or selected-event probabilities.

A finite xenon volume can slow particles, produce multiple scatters, reject
tracks, and change the energy spectrum. Do not claim it supplies eight orders
of suppression without calculating those effects. Conversely, do not declare
exclusion from the large thin-target numbers alone. The next discriminating
calculation is finite-detector transport with explicit single-scatter criteria,
followed by authenticated response and acceptance. Quantify whether any
surviving high-energy selected signal necessarily accompanies a lower-energy
selected population or other observable activity.

Normalization checks pass, but the benchmark is not a satisfactory shared
prediction model. Born validity, actual overburden, local captured supply,
coherence response and experimental constraints remain open. A raw order-one
high-energy count must no longer be presented as the principal success metric.

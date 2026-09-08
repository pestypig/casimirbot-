# Angular support of the single-scatter bound — 2026-09-07

Exploratory S1 result for the existing elastic benchmark. No frozen apparatus
or interaction parameter is changed. The previous single-collision bound
applies only to high-capable rays with incidence cosine >=0.9; this packet
checks their contribution to the already computed high-energy spectrum.

## Executed calculation

The companion script pins the prior spectrum source and analytic bound receipt.
It replays the same two bounded-mixture runs (500,000 physical and 500,000
biased histories each) and partitions their high-energy response according to
exit cosine. The total high response exactly reproduces the saved same-seed
result to numerical tolerance. Near and oblique contributions sum to the total.
These are additional observables on replayed histories, not independent new
confirmation of the total rate.

| Quantity | Proposal 0.70/0.50 | Proposal 0.65/0.60 |
| --- | --- | --- |
| Raw high expectation | 1.03743 +/- 0.06935 | 0.95888 +/- 0.06981 |
| Raw high from cosine >=0.9 | 0.99174 +/- 0.06838 | 0.92261 +/- 0.06934 |
| Near-normal fraction, point estimate | 95.60% | 96.22% |
| Estimated low single-scatter lower-bound coefficient | 38,432 +/- 2,650 | 35,753 +/- 2,687 |

The lower-bound coefficient is the near-normal raw high expectation times
38751.8551, from the analytic 300-g/cm2 xenon-slab result. The derivation
bounds the low exactly-one probability directly against the high thin-target
contribution before weakening it to a ratio with high exactly-one probability;
therefore this multiplication does not assume that raw high interactions
already pass single-scatter selection. Uniform illumination and the same
exposure/target-mass convention are retained.

The exact conditional inequality is `N_low_exactly_one >= B`, where B is an
integral over the stipulated incident population. This packet estimates B
with Monte Carlo. The numbers and standard errors above are not statistical
lower confidence limits; rare-history uncertainty remains. A ratio confidence
interval for the angular fractions is not provided.

## Interpretation

The angular restriction does not isolate a negligible corner of this simulated
high-energy signal. Most of its raw high rate is covered, and exactly-one
physical-collision counting still leaves a large low-energy population in the
chosen slab. Rejecting physical multiple scatters alone is insufficient for
this conditional benchmark. The raw order-one high-energy result is not a
satisfactory model fit.

This is not an LZ exclusion. The chosen slab is infinite transversely, has a
normal xenon column of 300 g/cm2, and follows the chosen silica overburden.
Actual finite geometry, shielding, source angular distribution, other channels,
Born validity, pulse reconstruction and calibrated relative acceptance remain
unresolved. A physical single collision is not synonymous with an accepted
single-scatter event. There is no authenticated low-energy event budget here.

For a future authenticated low-event allowance Lmax and a demonstrated minimum
acceptance epsilon for this population, the relevant test is whether
`epsilon * B > Lmax`, with transport and response uncertainties propagated.
Neither epsilon nor Lmax may be fitted merely to retain this candidate.

## Search consequence

Do not spend further effort tuning this benchmark to the high count alone.
The next useful detector task is authenticating the low-energy response and
selection needed to test this large accompaniment. A competing interaction
must explicitly explain spectral selectivity while preserving measurable
local coherence, its population supply and common coupling normalization.
No shared measurable parameter point or experimental validation is established.

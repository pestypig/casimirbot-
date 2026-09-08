# Transport-aware coupling scan and rare-tail limit

Exploratory diagnostic in the same point-nucleus silica slab. This is not a site-specific exclusion, allowed model or detector prediction.

The companion script reuses the hashed repeated-collision transport definition and runs 30000 particles at each of seven coupling scales. The only adaptation permits empty quantile arrays when no particle exits; the sampling law is unchanged. The scale multiplies cross section, not the individual coupling itself.

At 0.5, 1 and 2 times the prior strong root, the above-650-km/s transmitted subset remains statistically resolved. At twice the root, 23 of 30000 particles reach that subset, implying a raw restricted-window coefficient around 1.48 million under the previous thin-target convention. This remains far above one even at the lower endpoint of its binomial sampling interval.

At 3, 4, 6 and 8 times the root, neither a capable exit nor the faster subset appears in these samples. This does not establish zero transmission. A zero count in 30000 trials gives a one-sided 95% upper fraction about 9.99e-5. At three times the root, the subset fraction corresponding to a coefficient of one is only 3.46e-10. About 8.65 billion all-zero ordinary trials would be needed just to push that one-sided sampling limit below the target, and that still would not validate the transport model or bound contributions outside the subset.

The JSON records exact binomial sampling intervals and explicitly labels the unsampled tail unresolved. It does not convert an upper interval on a subset coefficient into an upper bound on the full rate. No new normalized coupling has been found.

## Next method

Use importance sampling or splitting to resolve the transmitted tail while retaining energy and direction updates. For a biased collision rate lambda_b with unchanged conditional species/recoil law, each sampled free path contributes exp[-integral(lambda-lambda_b) ds] and each collision contributes lambda/lambda_b. A boundary escape has only the path factor. If species or recoil distributions are also biased, their likelihood ratios must be included. All probabilities must retain support on the target process.

Validate weighted estimates against ordinary Monte Carlo in the resolved region, independently check the analytic uncollided component, report weight variance/effective sample diagnostics and compare different bias settings. This avoids brute-force billions of histories and prevents zero observed survivors from masquerading as a predictive solution. It does not remove Born, material, source or detector uncertainties.

The measurable-in-both goal remains open. A candidate must still link the resolved xenon spectrum to terrestrial accumulation and local coherence with one allowed parameter set.

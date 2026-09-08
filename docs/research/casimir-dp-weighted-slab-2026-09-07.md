# Weighted rare-tail transport

Exploratory method and conditional slab results. No accepted-event normalization, capture distribution or allowed parameter point is established.

## Reweighting

The script reuses the hashed transport transitions, adding two proposal changes: collision rate lambda_b=bias*lambda and recoil scale b_proposal=energy_bias*b in the normalized recoil distribution. Both biases are positive, preserving support. Species selection remains conditional on the physical relative rates.

Each traveled segment, including the truncated path to a boundary, contributes log weight -(lambda-lambda_b)*length. Each collision adds -log(bias). Each recoil adds the log ratio of the normalized physical and proposal recoil densities. Position, direction, energy, termination and the physical velocity-dependent rates are otherwise unchanged. Weights are accumulated logarithmically.

The exact no-collision identity exp(-bias*tau)*exp[-(1-bias)*tau]=exp(-tau) is checked independently. The unbiased control and energy-biased control agree for both capable and above-650-km/s exits. Mean total weights are also reported; agreement with one is a diagnostic, not sufficient validation of rare outcomes.

## Results

Two 500000-history runs at each scale use different bias settings. Cross-section scales are relative to the earlier uncollided strong root.

| Scale | Capable transmitted fraction, two estimates | Raw above-650 subset coefficient, two estimates |
|---|---|---|
| 3 | 1.132e-6; 1.247e-6 | 364 +/- 57; 303 +/- 14 |
| 4 | 1.042e-10; 1.160e-10 | 0.0144 +/- 0.0023; 0.0206 +/- 0.0062 |

Plus/minus denotes estimated Monte Carlo standard error only. These are raw restricted-subset coefficients under the previous thin-target convention, not accepted counts. A subset below one cannot prove a full rate below one. The scale-three estimates are compatible within sampling errors and indicate a substantial nonzero population missed by ordinary sampling.

## Quality and limitations

The scale-three higher-quality subset estimate has weighted effective sample size about 477 and largest weight share 1.73%. The other setting has effective size about 40 and a 13.6% largest share. At scale four, subset effective sizes are only about 41 and 11, with largest shares 11.3% and 19.4%. Those estimates are preliminary; empirical standard errors can miss unsampled large weights. Exploratory rate-only biases performed worse and are not used to claim convergence.

The controls establish that the implemented likelihood correction works in the tested resolved region. They do not prove adequate rare-tail convergence or physical accuracy. Point nuclei, the Born law, ideal silica geometry, stationary targets and the diagnostic source remain assumptions. Below-capability histories are not followed to capture.

## Next calculation

Use the weighted outgoing energy and direction distribution to fold the full 200-269.9 keV xenon response, improving bias quality and comparing independent settings near the apparent transition. The subset results identify a region to investigate, not a bracket for a proven full-rate root. Reassess detector response and approximation validity before admitting any candidate. The common captured population and local coherence must still be computed, rather than chosen to fit.

The Python/JSON companions record seeds, sample counts, standard errors, effective sizes, maximum shares and source hash. Reproduce with `C:\Python313\python.exe docs/research/casimir-dp-weighted-slab-2026-09-07.py`.

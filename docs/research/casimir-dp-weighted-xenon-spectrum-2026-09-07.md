# Weighted high-window xenon spectrum

Exploratory raw spectrum in the existing slab model. This replaces the above-650-km/s subset approximation for the complete 200-269.9 keV recoil window, but does not predict accepted events or the lower-energy spectrum.

## Folding and checks

For each outgoing speed, integrate the recorded isotope-weighted Helm recoil response up to its elastic endpoint. The estimator is C*a times the proposal mean of W*far_exit*sigma_bin(v)/[sigma_high(v_initial)*cos_exit]. The angular denominator converts uniformly illuminated planar crossing flux to the thin-target volume-rate convention. It is not appropriate without revision for a finite beam, arbitrary geometry or detector multiple-scatter selection.

The script uses a cumulative recoil integral with 8001 energy points and tests it against independent direct quadrature at five speeds. Maximum absolute errors, normalized to the original high-window response, must be below 1e-6. The four bin means sum to the total mean, checked numerically; the total sampling error is evaluated on per-history summed contributions, preserving correlations between bins. Each coupling scale has two 500000-history runs with different collision/recoil biases.

## Raw results

Cross-section scale is relative to the earlier strong uncollided root, not an individual coupling multiplier. Plus/minus denotes empirical Monte Carlo standard error only.

| Scale | Total 200-269.9 keV, two runs | 240-260 keV, two runs |
|---|---|---|
| 3.8 | 2.687 +/- 0.167; 2.431 +/- 0.143 | 0.00296; 0.00326 |
| 3.9 | 1.391 +/- 0.496; 0.876 +/- 0.069 | 0.00108; 0.000933 |
| 4.0 | 0.298 +/- 0.020; 0.305 +/- 0.024 | 0.000293; 0.000394 |

The calculated spectra are dominated by 200-220 keV recoils. The scale-3.9 total is near one, while the true-recoil bin containing 248 keV has only about a thousandth of a raw event. This is a spectral diagnostic, not a likelihood or significance calculation: energy reconstruction, resolution, acceptance and nuisance parameters could move events across these bins. The published candidate energy cannot simply be treated as a perfectly measured true recoil.

## Statistical qualification

At scale 3.9 the first run has effective sample size only 7.87 and one history supplies 35.2% of the weighted total. Its near-one value is not a precision normalization. The second run has effective size 162 and maximum share 4.32%. At 3.8 and 4.0, total effective sizes are about 162-288 and maximum shares 1.65-3.84%. Agreement between biases and empirical errors are useful but do not guarantee that unseen high weights are negligible. Bin-specific errors and weight diagnostics are preserved in JSON.

Thus the scan identifies a raw-count transition, not an authenticated root or satisfactory prediction model. A fitted root is premature while rare-tail quality and detector response are unresolved. Increasing the coupling to obtain attenuation also retains the previously noted Born-validity and detector-scattering concerns.

## Next discrimination

Prioritize the reconstructed spectral comparison, including the candidate's energy uncertainty, and the omitted lower-energy flux. Improve tail sampling where the normalization is dominated by individual histories. A raw count near one alone is insufficient evidence of compatibility with the observed candidate, and it does not provide the captured population needed for the canonical coherence experiment. The shared measurable-in-both goal remains active.

The Python/JSON companions contain the complete high-window estimator, bin means/errors, interpolation checks, proposal parameters, seeds and source hash. No site geology, finite-temperature material response, external-constraint recast or captured density is supplied by this packet.

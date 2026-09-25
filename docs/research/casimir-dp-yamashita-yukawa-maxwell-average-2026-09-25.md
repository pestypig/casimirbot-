# Maxwell-proxy average of the p-wave Yukawa enhancement

Date: September 25, 2026. This is a controlled distribution proxy, not a reconstruction of the source paper's astrophysical averages.

## Method

For each environment, use an untruncated Maxwell relative-speed PDF `f(v)=4/sqrt(pi) v^2/a^3 exp(-v^2/a^2)` and set its mean to the paper's representative speed (`1e-3` for the Milky Way, `1e-4` for dwarfs). Average `v^2*S1(v)` using Gauss-Laguerre quadrature at orders 8, 16 and 24. Compare Cassel's Hulthen approximation with the direct Yukawa radial solver from the [pointwise cross-check](casimir-dp-yamashita-yukawa-pointwise-crosscheck-2026-09-25.md).

The order-24 exact Yukawa proxy gives dwarf/halo `sigma*v = 0.1363`; Cassel gives `0.03128`. The source's representative-speed rate ratio is `0.02407`. Anchoring only the exact proxy ratio to the paper's Milky-Way rate would imply a dwarf rate of `3.681e-25 cm^3/s`, about `5.7` times the quoted source dwarf rate. That anchoring is illustrative only; it does not preserve the source model's likelihood fit.

The exact-to-Cassel ratio of averages is `4.36`. Orders 16 and 24 agree to less than 0.1% for both implementations, an encouraging quadrature check. It does not prove narrow resonances between nodes have been fully resolved; the velocity grid and ODE tolerances need targeted refinement around peaks before treating this as a prediction.

## Interpretation

The finite-range p-wave hierarchy still favors the Milky Way over dwarfs in this proxy, but the exact Yukawa and Cassel averages differ materially. The previous unsaturated-Coulomb estimate remains a limiting scaling, not a substitute for this mediator-specific calculation. The original model's gamma interpretation is therefore unresolved until the source's distribution convention, resonance averaging, spectral likelihoods and uncertainty treatment are reproduced. This result does not create an LZ/Casimir-DP connection and does not promote the single-field branch.

Next refine the exact velocity grid adaptively around resonance structure, then fold the p-wave rates through the source gamma spectra and the dwarf likelihoods. Keep the separate ultralight star field plus the finite-range heavy particle as the stronger architecture unless that common-field candidate survives the averaged gamma test and yields an independently calculable detector response.

## Reproduction and sources

Run `python docs/research/casimir-dp-yamashita-yukawa-maxwell-average-2026-09-25.py`; this imports the adjacent pointwise solver. Requires NumPy and SciPy. The JSON records every order and convergence metric.

Sources: [Yamashita, arXiv:2609.02868v2](https://arxiv.org/html/2609.02868v2); [Cassel, arXiv:0903.5307](https://arxiv.org/html/0903.5307).

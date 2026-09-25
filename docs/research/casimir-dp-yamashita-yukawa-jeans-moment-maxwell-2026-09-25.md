# Jeans-moment-matched Maxwell proxy for the finite-range Yukawa rate

Date: September 25, 2026. This continues the pure-law comparison with a finite-mass mediator, but remains an explicit distribution proxy rather than a source likelihood calculation.

## Calculation

I took the release's NFW/Jeans Milky-Way second relative-speed moment `u_h=1.0099905e-06` and its packaged Boddy dwarf J-weighted moment `u_d=9.7111064e-09`. These correspond to RMS relative speeds of 301.3 km/s and 29.5 km/s. For each system I constructed an untruncated Maxwell relative-speed PDF with that same RMS moment, then averaged `v_rel^2*S1(v_rel)` using Gauss-Laguerre orders 24, 48, 96. This kernel is the p-wave short-distance rate multiplied by the exact attractive Yukawa l=1 enhancement, with the Cassel-Hulthen expression evaluated on the same nodes as a control.

At order 96, the exact Yukawa proxy gives a dwarf/halo rate ratio of **0.0889**, versus **0.0236** for Cassel-Hulthen. The paper's representative-speed ratio is **0.0241**. If only the exact proxy ratio is anchored to the paper's quoted halo rate (`2.7e-24 cm^3/s`), it implies `2.4e-25 cm^3/s` in dwarfs, about `3.7` times the paper's quoted dwarf rate. The 48-to-96 quadrature changes are below `1e-4` for all four averages.

## Interpretation

This adds evidence that the finite-range benchmark's dwarf prediction is sensitive to using the exact Yukawa solution: in this RMS-matched Maxwell proxy it is about 3.8 times the Cassel rate ratio. It does not show that the exact ratio is the astrophysical answer. The public numbers provide second moments, not the full joint distribution in radius, line of sight and velocity; untruncated Maxwell PDFs discard that structure. Narrow p-wave resonances also require dedicated adaptive velocity scans beyond a quadrature-order check.

The next model-quality step is to evaluate the Yukawa kernel against the release's full Jeans velocity field through the Milky-Way ROI and each dwarf's posterior samples, including adaptive resonance resolution, then refit the gamma spectra with a common normalization. Compare that result with thermal abundance before calling the gamma branch viable. The xenon event and Casimir-DP gravitational-residual experiment remain independent observables until the scattering/material response is derived; the ultralight boson star remains a separate component pending a portal and cosmological history.

## Reproduction

Run `python docs/research/casimir-dp-yamashita-yukawa-jeans-moment-maxwell-2026-09-25.py`. Requires NumPy and SciPy; imports the adjacent pointwise Yukawa solver. The JSON records inputs, quadrature values and convergence.

Sources: [Stenhouse et al., arXiv:2607.08552v1](https://arxiv.org/html/2607.08552v1), [public analysis release](https://github.com/trinitystenhouse/Totani-Reanalysis/tree/Public-Release), [Yamashita et al., arXiv:2609.02868v2](https://arxiv.org/abs/2609.02868).

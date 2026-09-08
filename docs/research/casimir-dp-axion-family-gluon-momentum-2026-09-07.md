# Momentum dependence of the selected family gluon terms

Exploratory snapshot, September 7, 2026. Tests the zero-momentum approximation for two specific gluon insertions; does not complete the momentum-dependent common amplitude.

The [script](casimir-dp-axion-family-gluon-momentum-2026-09-07.py) authenticates the preceding family calculation and loads definitions without executing its output driver. It replaces I(0) with I(q) for the aa-gluon triangle and restores the Higgs/radial propagator dependence in the Higgs-gluon insertion. For each xenon isotope and recoil energy q=sqrt(2 mA ER), both signed insertions enter the nuclear interference. Other scalar and box terms remain in their previous contact approximation.

For the Feynman-parameter denominator A+B u(1-u), the u integral is analytically reduced to `4 atanh(sqrt(B/(4A+B)))/sqrt(B(4A+B))`, with limit 1/A at B=0. Here A=x² mchi²+(1-x) ma² and B=(1-x)²q². Numerical comparison with the archived double integral at q=0, 0.05, 0.246 and 0.27 GeV agrees at returned floating precision. Integration over the full recoil window also agrees with a partition into three windows to the stated absolute tolerance.

Central halo, 5.4–269.9 keV, linear interference:

| yL | Change in raw xenon count | Relative change in total |
|---|---|---|
| 0.05 | +2.1433e-10 | +1.5667e-10 |
| 0.10 | +4.5826e-11 | +3.3496e-11 |
| 0.15 | +5.4315e-12 | +3.9701e-12 |
| 0.20 | -1.9558e-11 | -1.4295e-11 |

[JSON](casimir-dp-axion-family-gluon-momentum-2026-09-07.json) retains the high-window changes and validation results. The tiny shifts are diagnostic numerical outputs, not meaningful precision claims for the physical event prediction. The sign change reflects competition between the two insertions.

This checks that these two terms' contact approximation cannot materially change the preceding xenon result in this family. It does not bound momentum effects in uncomputed operators, nuclear/hadronic uncertainty, or acceptance corrections. The local solid-state response is not recalculated here. The preceding independent-nucleus null prediction remains conditional.

The next work should prioritize the omitted common amplitudes or experimental response rather than refining this already negligible correction. Frozen model and apparatus inputs, model-admission status and active goal are unchanged. Script checks pass; root-leaf documentation validation is separate.

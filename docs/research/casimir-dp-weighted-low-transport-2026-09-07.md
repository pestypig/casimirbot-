# Weighted transport below the high-window cutoff

Exploratory S1 pilot, September 7, 2026. Same archived slab and microscopic
parameters; the capability cutoff is lowered to 1 keV. No fitted root.

The hash-checked importance-sampling implementation retains its collision
distance and recoil likelihood ratios. Two 50,000-history control runs at
old-root scale give far-exit fractions 0.65830 +/- 0.00212 and
0.65477 +/- 0.00280. High-capable and lower-speed fractions also agree
within six combined empirical standard errors. The unbiased control has
unit weights; the biased control's mean total weight is 1.00077 +/- 0.00388.

At scale 3.9, two 100,000-history runs give:

| Collision / recoil bias | Far-exit fraction | High-capable fraction | Far-exit ESS | Maximum weight share of exits |
| --- | --- | --- | --- | --- |
| 0.7 / 0.5 | (8.95 +/- 1.03)e-8 | (3.67 +/- 0.48)e-10 | 75.9 | 5.81% |
| 0.65 / 0.6 | (1.67 +/- 0.56)e-7 | (2.51 +/- 0.29)e-10 | 8.73 | 30.6% |

Errors are empirical Monte Carlo standard errors only. The difference in
exit estimates and low effective sample size preclude a precision flux
claim. Mean total likelihood weights are 1.338 +/- 0.344 and 0.971 +/-
0.156; these broad diagnostics neither prove bias nor guarantee tail
coverage. In particular, apparent agreement within errors cannot establish
that unsampled high-weight histories are negligible.

The runs resolve nonzero low-energy exits where the preceding ordinary
20,000-history samples had none. Most weighted exits are below the original
200 keV capability threshold. This is an outgoing flux result, not a xenon
rate: folding requires speed-dependent recoil cross sections, the planar
crossing-to-volume angular conversion where applicable, and detector response.
These fractions must not simply multiply a cross section at the initial speed.

Compressed NPZ histories preserve weights, status, speeds in units of c,
direction cosines and collision counts. Run indices correspond to JSON row
order. Only status one denotes a far exit. The cutoff still omits lower
energies; the geometry, stationary point-nucleus/Born assumptions and missing
capture solution remain unchanged. The next calculation can fold the saved
weighted spectra, but must retain per-history weight diagnostics rather than
quote a single precise normalization. No measurable shared model is admitted.

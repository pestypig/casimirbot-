# Continuous visible-decay coupling screen

Date: 2026-09-07. Conditional laboratory exclusion, extending the four-point screen.

For the fixed 10 MeV mediator/gap and effective product, the loose Yukawa perturbativity condition gives epsilon>=4.63101536e-6. The union of E137, E141, NA64 and NA48/2 exclusion intervals covers this entire range through epsilon=0.01, assuming the standard predominantly electron-pair decay and production rates. Equivalently it covers alpha_D from 1.07231516e-7 through 0.5. The upper epsilon endpoint is a declared weak-mixing scope, not a claim about every mathematically possible coupling.

The pinned DarkCast release and E137/E141 provenance are given in the preceding laboratory-screen packet. Additional primary sources are [NA64, arXiv:1912.11389](https://arxiv.org/abs/1912.11389) and [NA48/2, arXiv:1504.00607](https://arxiv.org/html/1504.00607). NA48/2 searched for prompt electron-pair decays from neutral pions; its single boundary is an upper limit on mixing, unlike the bounded displaced-decay intervals.

The script records contour hashes and neighboring mass rows. It takes the intersection of linear and log-interpolated intervals as an interpolation check. At 10 MeV the exclusions overlap in sequence:

| Search | Excluded epsilon interval used |
| --- | --- |
| E137 | 2.87012e-8 to 4.08812e-5 |
| E141 | 2.43571e-5 to 4.78848e-4 |
| NA64 | 9.88495e-5 to 1.39169e-3 |
| NA48/2 | above 8.06749e-4, clipped here at 0.01 |

An interval-connectivity assertion proves continuous coverage; 10,001 sampled couplings independently check implementation. This does not assign a combined confidence level or quantify reinterpretation systematics. The intervals have overlapping interiors, so the result does not depend on equality at a contour boundary.

Applicability remains conditional on the preceding minimal completion with additional dark decay channels closed and negligible portal effects. In particular, a 10 MeV mediator cannot decay into the 100 GeV dark fermions. Adding a lighter channel, changing the mediator/gap, or changing the interaction is a new model requiring lifetime/branching and shared-rate recalculation. Invisible-decay limits are not used here.

Decision: demote the continuous visible-decay benchmark over the stated coupling domain. Further refinement of its electron loop is no longer the leading route to a measurable shared prediction. The next candidate must first pass laboratory screening and improve the xenon spectrum; the present normalization already gives a poor raw low/high ratio of about 15963 before acceptance. Preserve that result as conditional evidence rather than retuning this dated benchmark. This screen does not exclude all virtual mechanisms, establish a dark-matter signal, or modify the frozen coherence apparatus.

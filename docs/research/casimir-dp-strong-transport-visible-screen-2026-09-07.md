# Laboratory screen of the strong transport completion

Exploratory S1 disposition, September 7, 2026. Conditional exclusion of the
minimal visible mediator completion in a declared coupling domain.

The transport benchmark specifies a 100 GeV Dirac particle and a 10 MeV
kinetically mixed dark photon. Its potential product obeys
alpha_eff = epsilon sqrt(alpha_EM alpha_D). At the old strong root,
alpha_eff=1.49998e-6; at cross-section scale 3.9 it is 2.96223e-6.
Taking alpha_D<=1 gives epsilon>=1.75591e-5 and 3.46765e-5 respectively.
The screen stops at epsilon=0.01, the declared weak-mixing scope. It does
not import the different alpha_D cap of the earlier split-state model.

The existing authenticated 10 MeV exclusion intervals overlap continuously
over both domains. Their sources and interpolation are documented in the
earlier visible-contour packets: [Andreas et al.](https://arxiv.org/abs/1209.6083)
for E137/E141 recasts, [NA64](https://arxiv.org/abs/1912.11389), and
[NA48/2](https://arxiv.org/abs/1504.00607). This script rechecks the pinned
DarkCast commit and every contour file hash, then proves interval coverage
and independently tests 10,001 coupling points. It also reconstructs the
zero-momentum proton cross section from the inferred product.

Applicability requires ordinary electromagnetic production and predominantly
electron-pair mediator decay. A 10 MeV mediator cannot decay to the specified
100 GeV particles; this completion assumes no other open dark channels.
An asymmetric particle abundance and terrestrial attenuation do not remove
these laboratory production/decay constraints. The result is a union of
published/recast exclusions, not a combined confidence level or a quantified
reinterpretation-systematics band.

## Decision

Demote this visible 10 MeV completion before further detector-response
refinement. The recent recoil, timing and coupled-transport calculations
remain conditional method results, not a surviving candidate. Their
strong-Born and population-supply limitations are not cured by this audit.

Changed mediator mass, a new lighter decay product or non-electromagnetic
couplings require a separately defined completion. They cannot retain the
old scattering normalization, capture population or laboratory acceptance
without recalculation. Before detailed LZ folding, the next candidate must
pass its applicable laboratory screen and demonstrate a quantitative route
to measurable coherence with the frozen apparatus. No such point is
established by this packet, and the full shared-model goal remains active.

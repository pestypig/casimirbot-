# Visible-mediator laboratory screen

Date: 2026-09-07. Conditional exclusion screen of the four previously tabulated coupling splits.

The prior gauge-completion packet defined four splits of the same xenon-normalized product. All four are inside published visible dark-photon beam-dump exclusion contours at mediator mass 10 MeV, conditional on a predominantly electron-positron decay. Demote these splits before further electronic loop work. This does not exclude all possible splits or all virtual interactions.

## Source and interpretation

Use the author-maintained [DarkCast release](https://gitlab.com/darkcast/releases) at commit 5a2a53a8984827be06e2939e6c3705f79d180048. The limit metadata traces E137 and E141 to Figure 2 of [Andreas, Niebuhr and Ringwald, PRD 86, 095019](https://arxiv.org/abs/1209.6083). These are phenomenological reinterpretations of beam-dump searches, not a new experimental likelihood. The alternative E137_Bjorken2009mm contour provides a cross-check with different analysis assumptions. DarkCast's dark_photon model includes electromagnetic charge in its fermion couplings, so the tabulated multiplier is epsilon, not epsilon times e.

Log-log interpolation at 0.01 GeV yields the following excluded intervals:

| Contour | Lower epsilon | Upper epsilon |
| --- | ---: | ---: |
| E137, Andreas | 2.87012e-8 | 4.08812e-5 |
| E137, Bjorken | 8.45335e-8 | 3.99560e-5 |
| E141 | 2.43570e-5 | 4.78848e-4 |

The companion script authenticates the release commit, stores data hashes and bracketing rows, and checks classification with both linear and log interpolation. Their agreement tests interpolation sensitivity, not uncertainty in the experimental reinterpretation. No new confidence level is assigned to their union.

The alpha_D=0.01, 0.1 and 0.5 splits have epsilon=3.27462e-5, 1.03553e-5 and 4.63102e-6 and lie within both E137 contours. The alpha_D=0.001 split has epsilon=1.03553e-4 and lies within E141. These values are unchanged from the previous packet.

## Applicability and next decision

The 10 MeV mediator cannot decay into the roughly 100 GeV dark fermions. With other dark channels closed and negligible additional portal effects, the electron pair is its dominant decay channel. A sufficient scalar-sector restriction for this screen is m_h>=m_A; that restriction is compatible with the loose scalar ceilings tabulated previously, although the alpha_D=0.5 endpoint has no scalar-mass headroom under those criteria. We do not claim that all lighter-scalar completions have the same branching fractions or lifetimes.

Missing-energy limits assuming an invisible mediator are not substituted for these visible-decay contours. A model that opens extra decays must recompute the lifetime, branching fractions and search acceptance before claiming an escape. It must also recompute the common xenon and coherence predictions.

Decision: the four explicit visible-decay completions are demoted. The broad virtual-channel idea remains exploratory. Before further full electron matching, screen remaining coupling splits against visible searches and test whether changing mediator/gap masses can improve the poor raw xenon spectral shape while retaining a plausible coherence channel. Such variants require new labeled normalizations; the frozen benchmark is not silently retuned. No detectable shared signal or LZ dark-matter discovery is established.

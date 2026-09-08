# Virtual mediator mass scan with fresh raw xenon normalizations

Date: 2026-09-07. Exploratory scan, not a joint detector prediction or allowed region.

The continuous visible-decay screen demoted the original 10 MeV mediator benchmark. This new labeled scan changes mediator mass while retaining the 100 GeV dark particle, 10 MeV gap, incident population, exposure, uniform nuclear charge model and recoil windows. Each mass receives its own coupling product from one raw 200-269.9 keV xenon event. The previous benchmark and frozen coherence apparatus remain unchanged.

| Mediator (MeV) | New effective alpha | Raw low/high ratio | Optimistic epsilon floor |
| ---: | ---: | ---: | ---: |
| 3 | 2.61131e-7 | 22229.9 | 1.44102e-5 |
| 10 | 2.79733e-7 | 15962.8 | 4.63102e-6 |
| 30 | 3.41906e-7 | 5952.71 | 4.00243e-6 |
| 100 | 6.78977e-7 | 716.193 | 7.94827e-6 |
| 300 | 3.03645e-6 | 180.421 | 3.55454e-5 |
| 1000 | 3.22458e-5 | 207.775 | 3.77477e-4 |

The low window is 5.4-200 keV. These are pre-acceptance counts; none is an LZ likelihood or evidence for the candidate interpretation. The smaller ratio at 300 MeV is the best among these six discrete masses, not an optimized mass or an acceptable spectral fit.

The script reuses the previous nuclear kernel and records its hash. Radial 384/768-node comparisons and independent energy 80/160-node comparisons pass the 1e-5 relative criterion. These convergence checks do not bound finite-gap, nuclear-profile, halo or detector-response errors. In particular the local-gap approximation must be revisited as internal momentum increases with mediator mass.

## Limited laboratory screen

At each new normalization, alpha_D<=min(1,m_A^2/(2 delta^2)) gives the displayed optimistic mixing floor. The pinned DarkCast release from the preceding packet supplies E137, E141, NA64 and NA48/2 contours, used only within their mass domains. Primary sources include [Andreas et al.](https://arxiv.org/abs/1209.6083), [NA64](https://arxiv.org/abs/1912.11389) and [NA48/2](https://arxiv.org/html/1504.00607). Above additional Standard Model thresholds the release's ordinary dark-photon decay model applies; an electron branching fraction of one must not be assumed at every mass.

The four searches leave uncovered intervals at 30 MeV and above, including the lower mixing floor at 100 and 300 MeV. These are only gaps in this four-search screen. They are not allowed regions: other prompt/displaced searches, precision constraints, self-interactions and cosmology are absent. Scalar-sector closure must also be checked for any selected coupling split; the optimistic floor does not itself guarantee that the radial scalar can be decoupled perturbatively.

Decision: prioritize the 100-300 MeV mass range for a broader laboratory screen before calculating local coherence. It improves the raw xenon shape relative to the original benchmark and is not eliminated by the four searches alone. Retain 1 GeV only as a comparison: in this scan it needs a substantially larger coupling product without improving the ratio over 300 MeV. No measurable local coherence signal has been computed for these variants, and shortening the force range supplies no automatic coherence enhancement. Further refinement is justified only if a candidate survives the broader constraints and offers a concrete material-response mechanism.

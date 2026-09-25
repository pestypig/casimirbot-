# IDM excited-state depletion screen

The previous recommendation to pursue the IDM's off-diagonal inelastic Z interaction as the next shared xenon/Casimir-DP channel needs narrowing. The IDM benchmark has `m_H=1080 GeV` and `delta=m_A-m_H=369 keV`; its LZ process is `H+N -> A+N`, fixed by the `ZHA` derivative coupling. The source paper itself describes this endothermic transition and its velocity threshold ([Wang and Xiao, arXiv:2609.06571](https://arxiv.org/html/2609.06571v1)). On the frozen independent-carbon target, the ground-state upscatter threshold is about `2449 km/s`, above the adopted `798 km/s` halo cap.

One apparent escape is exothermic scattering by the excited state, `A+C -> H+C`. But with this splitting the `A` state can decay through the same off-shell Z into `H + nu nu-bar` for each of the three light neutrino flavors. Integrating the scalar-current three-body spectrum,

```text
dGamma/dq2 = G_F^2 |p_H(q2)|^3 / (24 pi^3),
```

over `0 <= q2 <= delta^2` gives `Gamma = 1.50e-30 GeV` and a rest-frame lifetime of `4.39e5 s`, or `5.08 days`. The small-splitting check `Gamma ~= 3 G_F^2 delta^5/(60 pi^3)` agrees to `7.6e-5`. A primordial excited population therefore has no appreciable survival to the present halo age without a specified late-time repopulation mechanism. That removes the simple IDM excited-fraction loophole; it does not rule out a model that explicitly sources `A` today.

This is a stronger and more specific result than saying “try an inelastic channel”: for this exact LZ point, the inelastic channel that gives the xenon recoil is closed on carbon in the stable ground state, while the exothermic inverse process requires a state depleted on a timescale of days. A new mechanism that continually repopulates `A` would need to be added to the cosmological model and checked against the same xenon rate before computing the apparatus response. Until then, retain IDM as a xenon comparator and the ultralight field as the separate candidate for boson-star structure; do not claim a shared measurable Casimir-DP signal.

Run `python docs/research/casimir-dp-idm-excited-state-lifetime-2026-09-25.py` to reproduce the exact phase-space integral, small-splitting check, and survival-timescale comparison. This is a tree-level decay screen from the IDM `ZHA` coupling, not a full radiative-width calculation, material-response model, gamma-ray fit, or global IDM exclusion. The arXiv LZ interpretation reports a `2.6 sigma` global significance and is not a dark-matter discovery.

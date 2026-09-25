# Ultralight versus inelastic-heavy LZ recoil kinematics

Date: September 25, 2026. This is a two-body kinematic screen against the 248 keV LZ event, not a signal-rate or likelihood fit.

## Experimental anchor

The LZ extended nuclear-recoil analysis reports one event at `248 ± 23(stat) ± 23(sys) keV` in a `2.84 tonne-year` sample. Its global background-only tension is `2.6 sigma` after the look-elsewhere correction, with model-dependent local maxima of `3.4 sigma`; LZ describes signal fits typically above 200 GeV. It is a candidate event, not a dark-matter discovery. The official analysis explores 5.4–270 keV nuclear recoils and both momentum-dependent and inelastic WIMP models [LZ collaboration analysis](https://lz.lbl.gov/wp-content/uploads/sites/6/2026/08/LZ_Preprint_260901_Dark_Matter_EFT_Nuclear_Recoil_Search_at_Higher_Energies.pdf).

## Reproducible kinematic comparison

The attached script uses a xenon-131 nuclear mass approximated as `131.293 u`, the central recoil energy, and a deliberately generous incident speed cap of `800 km/s`.

For a single `1e-17 eV` pNGB scattering elastically from xenon, `E_R,max=2 mu^2 v^2/M_Xe` is only `1.16e-50 eV`. The 248 keV event is `2.13e55` times above this ceiling. Even absorbing one pNGB quantum would supply only `1e-17 eV` of rest energy, `2.48e22` times below the event energy. Thus the ultralight star-forming field cannot be the incident particle in an ordinary single-particle elastic xenon nuclear recoil. A coherent many-body or nonstandard energy-transfer process would be a different model and must specify its coupling and event rate.

At the same 800 km/s cap, an elastic WIMP needs at least `74 GeV` to reach the central recoil purely kinematically; this is a permissive two-body minimum, not an LZ fit. For the repository's `m_H=1080 GeV`, endothermic `delta=369 keV` IDM benchmark, the central event requires `v_min=785.2 km/s`. Combining the two quoted energy uncertainties in quadrature gives `v_min=779.7–795.1 km/s` across the resulting energy interval. The maximum splitting that can reach the central recoil at 800 km/s is `381.2 keV`, only `12.2 keV` above the benchmark splitting. This point is kinematically allowed under the generous cap, but sits on the extreme halo-speed tail; the calculation does not establish that its rate is sufficient.

The repository's [published TNG50 Earth-frame screen](casimir-dp-idm-folsom-tng50-earth-frame-fold-2026-09-24.md) independently finds `v_min≈786 km/s` and broad halo-to-halo variation in the density-weighted high-speed integral. That gives useful uncertainty context, not a Milky Way posterior: the published Earth-frame sample is at a different epoch and does not supply LZ detector likelihoods.

## Branch disposition

This is a strong kinematic exclusion of the ultralight pNGB as the direct LZ nuclear-recoil particle under standard two-body scattering. In the multicomponent branch, the ultralight field may still be a separate gravitationally clustered component, while the heavy state supplies the recoil. The exact heavy candidate remains conditional on a proper halo velocity integral, its co-traced local density, exact splitting and detector-response likelihood. Neither route explains a Casimir-DP signal: no interaction has yet predicted a measurable interferometer response with the same parameters.

Reproduce using `python -B docs/research/casimir-dp-lz-ultralight-recoil-kinematic-screen-2026-09-25.py`; the adjacent JSON records inputs, equations, results and limitations.
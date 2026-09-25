# Ultralight-mediator swap in the LZ-plus-gamma dark-photon model

Date: September 25, 2026. This is an analytic, conditional velocity-scaling screen, not a full model calculation.

## The bridge being tested

Yamashita's LZ-plus-gamma benchmark uses a 420 GeV vector X and a 400 MeV scalar mediator with effective attractive strength 0.2. Its p-wave annihilation is enhanced by a finite-range Yukawa force: at representative relative speeds 10^-3 (Milky Way) and 10^-4 (dwarf), the paper quotes Sommerfeld factors 1.3e7 and 3.1e7, while the resulting rates are 2.7e-24 and 6.5e-26 cm^3/s. The finite-range force therefore gives a halo-to-dwarf rate ratio of about 41.5.

A tempting identification is that the 400 MeV Sommerfeld mediator is the repository's 1e-17 eV boson-star field. At fixed X mass and alpha_eff, this changes the mediator mass by 4.0e+25 and puts the interaction deep in the Coulomb limit.

## Conditional Coulomb-limit result

For an attractive massless mediator, the p-wave Sommerfeld factor scales as (alpha/v_rel)^3. Since the underlying annihilation is p-wave, sigma*v scales as v_rel^2*S1, hence approximately 1/v_rel at low speeds. With the paper's representative velocities, this gives a dwarf-to-halo rate ratio of 10, opposite to its finite-range benchmark's 0.0241. The relative hierarchy changes by about 415 times. If one merely anchors the halo rate to the paper's 2.7e-24 cm^3/s, the illustrative dwarf rate would be 2.70e-23 cm^3/s, about 415 times its quoted dwarf rate.

This is a strong warning against reusing the gamma-ray fit after making the star field the Sommerfeld mediator. It is not a dwarf-limit exclusion: the absolute Coulomb normalization, velocity averages, saturation and any resonances need a model-specific computation.

## What follows for the four-observable goal

The star field and particle mediator are not interchangeable by matching their masses. A viable common-field branch would need an explicit coupling and potential, radiative-stability mechanism, finite-density/halo profile, and a velocity-distribution-averaged solution of the p-wave Schrödinger problem. It must then preserve the gamma spectrum and independently derive xenon and Casimir-DP responses. The existing dark-photon transition still has no carbon-open channel, so this mediator substitution does not by itself bridge to the interferometer.

Recommendation: keep the two-component option open, with an ultralight star-forming field separate from the 420 GeV LZ/gamma particle, unless a coupled field-theory solve demonstrates the altered Sommerfeld hierarchy can fit both Milky Way and dwarf data. The next highest-value calculation is a velocity-averaged Yukawa solver scan over mediator mass, holding the short-distance p-wave amplitude fixed, and comparing the resulting halo/dwarf ratio to the paper benchmark before attempting any star coupling.

## Reproduction and sources

Run `python docs/research/casimir-dp-yamashita-ultralight-mediator-velocity-scaling-2026-09-25.py`; the adjacent JSON includes inputs, derived ratios, assumptions and validity limits.

Sources: [Yamashita, arXiv:2609.02868v2](https://arxiv.org/html/2609.02868v2) (model, velocity/rate table, and mediator roles); [Iengo, Coulomb Sommerfeld factors for partial waves](https://arxiv.org/abs/0902.0688); [Cassel, Yukawa Sommerfeld factors and Coulomb limit](https://arxiv.org/abs/0903.5307).

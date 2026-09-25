# H.E.S.S. applicability screen for the LZ IDM benchmark

Date: September 25, 2026. This compares published scan coverage and a conditional density rescaling. It is not a gamma-ray likelihood recast, an IDM annihilation calculation, or an exclusion of the LZ interpretation.

## Finding

The LZ IDM paper reports a profile point at `m_H=1080 GeV`, `m_A-m_H=369 keV`, and `m_H+-m_H=8.17 GeV`. It describes the recoil as the endothermic, electroweak `H N -> A N` transition. Its profile uses the full local dark-matter density when H accounts for the observed abundance.

The H.E.S.S. IDM study reports that its benchmark scans with a cuspy Einasto Milky Way profile exclude much of the model around 1–8 TeV. The LZ point's mass lies in that range and its charged gap lies within the study's broad 0.5–10 GeV scan. However, the H.E.S.S. neutral-gap scan starts at 0.5 GeV, whereas the LZ point has a 0.000369 GeV gap. The H.E.S.S. scan floor is about 1,355 times larger. Its mass-level exclusion therefore cannot be assigned directly to the exact LZ-fit point. The different neutral splitting can change coannihilation, present-day channel composition, and the response needed for the gamma likelihood.

The H.E.S.S. result is also profile-dependent: its paper notes that a kiloparsec-scale Burkert core may weaken the H.E.S.S. limit by up to two orders of magnitude. This is a conditional astrophysical systematic, not a reason to select a core without independent evidence.

This IDM benchmark also cannot be identified with the separate 0.5–0.8 TeV `b bbar` Galactic-halo excess interpretation simply because both involve gamma rays. The H.E.S.S. IDM study finds that the high-mass IDM gamma spectrum is generally driven by electroweak bosonic channels (`W+W-`, `ZZ`, `hh`); in its scanned samples the top-quark channel is at most about 1%. The LZ paper does not publish the exact best-fit point's present-day branching fractions as a numerical table. Until those are calculated at the exact splittings, the IDM/LZ candidate and the `b bbar` excess remain distinct hypotheses with different masses and spectra.

## Two-component normalization check

If a 10% ultralight component is added and the heavy IDM local density traces its cosmic fraction, then `rho_H/rho_DM=0.9`. At fixed present-day annihilation cross section and channel yields, the annihilation intensity scales as density squared, so the heavy-component gamma intensity is multiplied by `0.9^2=0.81`. This is only a normalization identity under the co-tracing assumption. The IDM profile's abundance must be recalculated, the local fraction may differ from the cosmic fraction, and the freeze-out rate change cannot be substituted for the present-day rate without calculating the model's velocity-dependent annihilation channels.

## Disposition and next gate

Treat the H.E.S.S. paper as a high-priority stress test of the IDM interpretation and the proposed gamma connection, not as a confirmed signal or a directly transferable exclusion. Before using its exclusion band against the LZ point:

1. Extend the IDM relic and annihilation calculation to `m_H=1080 GeV`, `delta_AH=369 keV`, and the LZ-profiled charged gap, retaining the allowed underabundant target if a separate ultralight fraction is present.
2. Calculate the present-day channel branching fractions and velocity-dependent cross section, including Sommerfeld effects where material at this mass.
3. Fold that spectrum through the H.E.S.S. response/likelihood for the stated Einasto profile and test defensible core alternatives; separately propagate local and Galactic-center component fractions.
4. Only then decide whether the same IDM point survives LZ and gamma observations. This still does not bridge IDM to boson-star formation or the Casimir-DP coherence observable; a common, explicit mediator/operator and its measurable interferometer prediction remain required.

## Reproduction

Run:

```powershell
python -B docs/research/casimir-dp-idm-hess-applicability-screen-2026-09-25.py
```

The script checks scan overlap, calculates the neutral-splitting coverage gap, and computes the conditional fixed-cross-section density-squared factor. Its adjacent JSON contains inputs, outputs, and assumptions.

Sources: [Wang & Xiao, IDM interpretation of the LZ high-recoil event](https://arxiv.org/html/2609.06571); [Justino, Siqueira & Viana, IDM constraints with very-high-energy gamma-ray observatories](https://arxiv.org/html/2411.05909). The latter links its analysis code and datasets at [IDM-indirect-detection](https://github.com/RadicceJustino/IDM-indirect-detection).

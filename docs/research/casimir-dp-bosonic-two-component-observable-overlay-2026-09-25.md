# Conditional two-component, four-observable overlay

This screen carries one shared fraction parameter through the existing ultralight-star, IDM recoil, annihilation, and Casimir-DP calculations. It overlays the frozen Folsom/TNG50 halo fold on the separate-production abundance table; it does not introduce a new microscopic interaction or combine likelihoods.

## Explicit branch and shared parameter

The branch has a cold complex ultralight field $\phi$ with $m_\phi=10^{-17}\,\mathrm{eV}$ and a heavy inert-doublet state $H$ with $m_H=1080\,\mathrm{GeV}$ and inelastic splitting $\delta=369\,\mathrm{keV}$. The single shared abundance parameter is $f_\phi$, with $f_H=1-f_\phi$. For this overlay only, both cosmic fractions are assumed to co-trace into the local halo and Galactic Center, and the whole $\phi$ fraction is assigned to identical $4.02\times10^6\,M_\odot$ reference stars. There is no dynamical conversion between $\phi$ and $H$.

## Results at a 10% ultralight fraction

At $f_\phi=0.10$, $f_H=0.90$ and the required heavy abundance is $\Omega_Hh^2=0.10782$, or 0.897 of the published IDM profile abundance. Applying this same $f_H$ to the Xe-131, 248 keV TNG50 factors gives the following differential-rate ratios relative to the IDM paper's Standard Halo Model profile, with the isotope and recoil bin held fixed:

| Halo sample | 16th percentile | Median | 84th percentile |
| --- | ---: | ---: | ---: |
| Phase-space-scaled, all 98 | 0.843 | 7.159 | 34.347 |
| Phase-space-scaled, 7 Milky-Way-like validation halos | 1.946 | 6.595 | 8.746 |
| Unscaled, all 98 | 0.000 | 0.000005 | 2.669 |
| Unscaled, 7 Milky-Way-like validation halos | 2.209 | 4.104 | 18.955 |

These are simulation-ensemble diagnostics, not probabilities for the Milky Way. The all-98 unscaled ensemble includes galaxies that fail Milky-Way circular-speed matching; the seven-object subset is a validation subset, not a posterior sample. Thus this calculation shows that the high-speed tail can dominate the nominal 10% density suppression, but it does not show that the LZ event is explained. It is one isotope and one recoil bin, before the detector response, isotope weak-response weights, background model, or likelihood.

The fixed IDM profile point cannot simply be added to this mixture. The paper's thermally computed $\Omega_Hh^2=0.12014$ already exceeds the adopted Planck central total $0.1198$ by $0.28\sigma$. If that exact relic is retained and an independent $\phi$ abundance is added, the 1$\sigma$ upper edge leaves room for at most $f_\phi=0.00718$; the 2$\sigma$ edge leaves at most $0.0172$. At $f_\phi=0.10$, leaving the IDM point unchanged gives total $\Omega h^2=0.13212$, about $10.27\sigma$ above the adopted central value. A standard-cosmology two-component model therefore needs an underabundant IDM point. For $f_\phi=0.10$, its target is $\Omega_Hh^2=0.10782$, 10.25% below the published point. The inverse-abundance rule $\Omega\propto1/\langle\sigma_{\rm eff}v\rangle$ gives a rough 1.114 multiplier for the effective freeze-out rate as a first estimate, not an IDM prediction: compressed-spectrum coannihilation must be recomputed at the adjusted scalar masses and couplings.

Under the same co-tracing assumption, the heavy-component annihilation density-squared factor is $f_H^2=0.81$; keeping a hypothetical same-channel gamma flux fixed would require a cross-section multiplier of 1.235. That is only a scaling identity: it is not a fit to the separate 43 GeV cluster-line claim, the 0.5--0.8 TeV continuum interpretation, or the Galactic Center source analysis. The conditional Casimir-DP exponent ceiling falls to $6.3\times10^{-19}$, still negligible in the previously screened material channel. If all $\phi$ forms the reference stars, the $10^{12}\,M_\odot$ halo would contain about 24,876 objects, while the local ten-year close-encounter probability is only $3.96\times10^{-18}$ under the fixed-speed, co-tracing encounter model.

The 1.114 freeze-out-rate factor must not be applied automatically to the present-day gamma rate. The gamma prediction needs its own annihilation calculation, including coannihilation's relevance today, final states, and halo fractions. The [coannihilation preflight](casimir-dp-idm-underabundance-coannihilation-preflight-2026-09-25.md) finds that the scanned charged-scalar splitting has meaningful population-weight leverage, but does not calculate an underabundant point. The published paper states that its LZ profile normalization takes $H$ to provide the local dark-matter density, and it explicitly says full likelihood reconstruction needs additional detector-level information that is not public. The existing shift-symmetric connector was not a successful bridge to cold $\phi$ production, and the minimal pNGB radial-mediator portal failed its naturalness screen.

## Reproduction and limits

Run:

```powershell
python -B docs/research/casimir-dp-bosonic-two-component-observable-overlay-2026-09-25.py
```

The script reads the adjacent frozen recoil-fold JSON, verifies the IDM mass/splitting, epoch, isotope, and recoil energy, then writes its own JSON with the full $f_\phi$ grid. It asserts the 10% fraction scalings and reproduces the seven-halo LZ overlay.

This is the strongest current *conditional multicomponent overlay*, not a selected prediction model. It specifies how the components divide observables but has no common microscopic coupling that links ultralight-star formation to $H$ scattering or annihilation. A viable prediction requires a resolved production model for both components, a Galactic model for $f_{H,\mathrm{local}}$, $f_{H,\mathrm{GC}}$, and the compact-$\phi$ fraction, an IDM freeze-out solution at the reduced abundance, the LZ detector likelihood inputs, and an apparatus-specific Casimir-DP response. Failure of the natural connector screens favors treating the sectors as separately produced, but then the claimed link is gravitational bookkeeping only.

# StarSim Fusion Microphysics Stage 1

## 1. Claim boundary

`STARSIM_FUSION_MICROPHYSICS_STAGE1` is a reduced-order astrophysical prior lane. It estimates plausible stellar fusion channels, fusion-zone structure, compact-object quantum-fluid context, and population graph priors from observable stellar parameters or imported profile metadata.

It does not directly support ER=EPR, wormhole density, spacetime metric equivalence, Needle Hull propulsion, stress-energy sourcing, or CL0-CL4 promotion. Every output remains `spacetimeCL: "proxy_only"` and `mayPromoteToCL4: false`.

## 2. Observable inputs

The Stage 1 input accepts spectral type, luminosity, radius, effective temperature, mass, metallicity, surface gravity, parallax, proper motion, and radial velocity. These are observational priors, not a complete stellar-structure solve.

Surface effective temperature is treated as a luminosity-radius consistency proxy:

```text
L = 4 pi R^2 sigma T_eff^4
```

This relation is not a direct core-temperature measurement.

## 3. Stellar-structure model hierarchy

The model modes are:

- `surface_observable_proxy`: surface and catalog fields only.
- `polytrope_hydrostatic_proxy`: reduced-order hydrostatic context.
- `mesa_profile_import`: externally generated or imported profile metadata.
- `compact_object_glitch_proxy`: compact-object quantum-fluid context, not fusion.

The relevant 1D structure equations are tracked as model metadata:

```text
dm/dr = 4 pi r^2 rho
dP/dr = -G m(r) rho / r^2
dL/dr = 4 pi r^2 rho epsilon_nuc
dT/dr = nabla_rad/conv
```

Future Stage 2 work should use an actual solver or imported MESA-backed profile rather than spectral class alone.

## 4. PP-chain and CNO microphysics

The Stage 1 classifier assigns `pp_chain` for Sun-like and lower-mass main-sequence stars unless mass, temperature, or spectral priors indicate a hotter CNO-dominated case. Hotter, higher-mass main-sequence inputs may classify as `cno_cycle`.

The pp-chain and CNO labels are microphysical rate-law priors with explicit uncertainty, not quantum-spacetime evidence.

## 5. Fusion-zone volume definition

Fusion volume is defined from integrated nuclear energy generation, not whole-star volume:

```text
L_nuc(<r) = integral_0^r 4 pi r'^2 rho(r') epsilon_nuc(r') dr'
```

Stage 1 reports `r10_Rstar`, `r50_Rstar`, `r90_Rstar`, and `activeVolumeFraction = r90_Rstar^3` when the channel is active. Red giants use `shell_fusion`; compact objects use `compact_object_not_applicable`.

## 6. Spectral h-fit calibration boundary

The spectral Planck-constant fit is named `hSpectralFit`, not `derivedPlanckConstant`. The SI value of `h` is exact, so this is calibration/inference bookkeeping only.

## 7. Molecular atmosphere guardrails

Blackbody-only spectral fitting is blocked for molecular-band dominated cool spectra when no stellar-atmosphere model support is declared. PHOENIX/MARCS-like atmosphere support is required before treating cool-star spectral inference as more than a surface proxy.

## 8. Star-map fusion graph

The StarMap fusion graph combines positions, optional velocities, fusion-channel labels, and quantum-process indices into pairwise structure weights and fusion-contrast weights.

Its QST role is `astrophysical_population_prior`. The required caveat is `star_map_structure_is_not_direct_er_epr_evidence`.

## 9. Compact-object extension: neutron stars and glitches

Neutron stars are classified as `compact_object_not_fusing`. Their relevant Stage 1 quantum context is dense-matter and glitch phenomenology, such as superfluid vortex pinning and crust/core coupling, not pp-chain fusion.

## 10. QST/ER=EPR relevance and non-relevance

This lane can improve astrophysical priors for entropy, stellar population structure, and quantum-process intensity. It cannot directly support ER=EPR. Direct ER=EPR support remains restricted to controlled holographic/toy-dual simulations under `ER_EPR_STAGE1_SIM`.

## 11. Research-backed claim matrix

| Claim | Safe support | Not supported |
| --- | --- | --- |
| PP-chain/CNO rates matter for stellar fusion | Solar fusion cross-section literature gives recommended pp-chain and CNO-cycle rates and uncertainties. | Does not prove ER=EPR. |
| Hydrostatic stellar profiles are needed for fusion zones | MESA solves coupled structure/composition equations and includes relevant stellar physics modules. | Spectral type alone is not enough to solve the core. |
| Effective temperature is a surface relation | Stefan-Boltzmann gives `L = 4 pi R^2 sigma T_eff^4`. | Does not directly give core temperature. |
| Spectral h-fit is calibration only | The Planck constant is exact in the revised SI. | Does not rediscover or vary `h`. |
| Molecular atmosphere models are needed for cool stars | PHOENIX-style synthetic atmospheres support spectral synthesis. | Blackbody-only fitting is not enough for molecular-band spectra. |
| Gaia-like star maps support structure priors | Gaia DR3 includes positions, parallax, proper motions, photometry, spectra, and radial velocities. | Astrometry is not direct quantum-gravity evidence. |
| Neutron star glitches are compact-object quantum-fluid proxies | Glitch studies connect pulsar spin-up events to superfluid vortex dynamics and crust/core coupling. | Neutron stars are not pp-chain fusion objects. |
| Entropy/QST relation can demote quantum visibility claims | High entropy can mask quantum effects in QST-style bookkeeping. | Does not provide a stellar proof of ER=EPR. |

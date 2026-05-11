# StarSim Fusion Profile Import Stage 2 Prep

## 1. Claim boundary

`STARSIM_FUSION_PROFILE_IMPORT_STAGE2_PREP` imports MESA-like or external shell profiles and validates them against the existing Stage 1 StarSim fusion proxy lane. It prepares for Stage 2 review but does not promote the lane to Stage 2.

The output remains an astrophysical microphysics and population prior. It is not direct ER=EPR evidence, not a physical bridge inventory, not a stress-energy source, not Needle Hull propulsion evidence, and not CL0-CL4 support. Every validation has `spacetimeCL: "proxy_only"` and `mayPromoteToCL4: false`.

## 2. Why profile import is needed

Surface observables and spectral type are useful priors, but fusion-zone volume depends on interior structure. A profile import lets StarSim compare reduced-order estimates against shell data for temperature, density, mass, luminosity, and nuclear energy-generation rates.

## 3. MESA-compatible shell schema

The import schema accepts shell radius, mass coordinates, shell mass, temperature, density, pressure, luminosity, and nuclear epsilon fields. The intended source family is MESA-compatible output, fixture-only profiles, or externally reproduced shell tables.

## 4. Nuclear luminosity integration

When shell mass is available, the validator computes:

```text
dL_shell = epsilon_nuc * shellMass
```

If shell mass is absent, it can use a radius-density shell-volume estimate when enough radius data exists.

## 5. Fusion-channel fractions

The validator integrates `epsPp`, `epsCno`, and `epsTripleAlpha` contributions and computes:

```text
ppFraction = integratedPpLuminosity / integratedNucLuminosity
cnoFraction = integratedCnoLuminosity / integratedNucLuminosity
tripleAlphaFraction = integratedTripleAlphaLuminosity / integratedNucLuminosity
```

The dominant channel comes from integrated luminosity contribution, not surface spectral type alone.

## 6. Fusion-zone radii

The validator computes `r10_Rstar`, `r50_Rstar`, and `r90_Rstar` from cumulative nuclear luminosity. Active volume fraction is reported as `r90_Rstar^3`.

## 7. Comparison to Stage 1 proxy estimates

If a Stage 1 proxy evaluation is supplied, the validator compares dominant channel, fusion-zone mode, and `r90_Rstar`. This comparison is diagnostic only and cannot promote QST, ER=EPR, Needle Hull, or warp claims.

## 8. Luminosity closure and uncertainty

The validator reports a luminosity closure relative error when integrated nuclear luminosity and surface luminosity are both available. A large mismatch emits a warning rather than hiding uncertainty.

## 9. Neutron-star compact-object branch

Neutron-star fixtures bypass PP/CNO fusion integration. They return `compact_object_not_fusing` and `compact_object_not_applicable`. Their relevance is dense-matter and glitch context, not stellar hydrogen burning.

## 10. Spectral h-fit calibration boundary

`hSpectralFit` remains calibration-only. The Planck constant is exact in the revised SI, so `new_measurement_of_h` and `varying_planck_constant` are blocked in profile artifacts.

## 11. Gaia/star-map population prior

Gaia-like astrometry and velocities can support population priors and graph context. They cannot be used as direct quantum-spacetime evidence.

## 12. Why this still does not support direct ER=EPR evidence

Profile import can strengthen ordinary stellar microphysics priors. It does not create a controlled holographic dual, a traversable-wormhole protocol, metric equivalence, stress-energy evidence, or CL0-CL4 support.

## 13. Stage 2 promotion requirements

Stage 2 promotion requires externally reproducible profile imports or solver-backed profiles, documented model inputs, profile hashes, uncertainty propagation, profile-to-observable closure checks, and independent comparison against known benchmark stellar models. It still does not promote ER=EPR or QST to CL0-CL4.

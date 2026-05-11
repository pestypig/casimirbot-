# StarSim Fusion External Reproduction Stage 2 Gate

## Claim boundary

`STARSIM_FUSION_EXTERNAL_REPRO_STAGE2_GATE` is a review gate for StarSim fusion profile evidence. It is an astrophysical microphysics and population-prior lane. It is not direct ER=EPR evidence, not a wormhole inventory, not a stress-energy source, and not Needle Hull or warp evidence.

All outputs preserve:

```ts
spacetimeCL = "proxy_only"
mayPromoteToCL4 = false
```

## What the Stage 2 gate does and does not mean

The gate asks whether a benchmark report has enough external-reproduction metadata and observational closure evidence to be reviewed as a Stage 2 candidate. A ready-for-review verdict is not certification. It means the report has retained enough hashes, metadata, uncertainty notes, and closure checks to be audited.

## External reproduction manifest

The reproduction manifest records the object, profile source, MESA metadata, optional GYRE metadata, artifact paths, and reproducibility status. MESA fields include profile hash, inlist hash, history hash, nuclear network, reaction-rate source, EOS, opacity, atmosphere, mass, composition, mixing length, and age when available.

## MESA metadata requirements

Ready-for-review requires at minimum:

- profile hash
- inlist hash
- nuclear network metadata
- reaction-rate metadata
- benchmark report
- uncertainty summary

MESA is used here as the profile-backed stellar-model anchor because it solves coupled stellar structure and composition equations with configurable physics modules.

## Solar anchor

The Sun is the calibration anchor because it connects interior profiles, surface observables, neutrino fluxes, and helioseismic constraints. Surface luminosity, radius, mass, and effective temperature are closure observables; they do not directly define the core fusion profile.

## Neutrino closure

Solar neutrino closure compares model fluxes against reference pp-chain fluxes. The output can pass, warn, fail, or remain not tested. A residual is a diagnostic, not a verdict that the entire fusion lane is true or false.

## Asteroseismic / helioseismic closure

GYRE or imported helioseismic summaries can compare large and small frequency separations, mode counts, and sound-speed profile availability. This is optional but gateable when requested.

## Luminosity and Teff closure

The benchmark report remains responsible for luminosity closure. Effective temperature remains a surface closure relation, not a core-temperature inference.

## hSpectralFit calibration boundary

`hSpectralFit` remains `calibration_only`. The Planck constant is exact in the revised SI, so spectral fitting cannot claim a new value of `h`.

## Neutron-star compact-object boundary

Neutron stars remain compact-object quantum-fluid context. They are not PP-chain, CNO-cycle, or shell-burning fusion objects.

## Gaia/star-map population-prior boundary

Gaia-like astrometry and photometry support population-prior context and benchmark selection. They are not direct quantum-spacetime or ER=EPR evidence.

## QST/ER=EPR non-promotion boundary

This gate does not promote QST, ER=EPR, Needle Hull, warp, stress-energy, or CL0-CL4 claims. ER=EPR remains bounded to controlled holographic or toy-dual simulation lanes.

## Gate verdict ladder

- `stage2_gate_not_tested`
- `stage2_gate_blocked`
- `stage2_gate_fixture_only`
- `stage2_gate_mesa_reproduced`
- `stage2_gate_observational_closure_partial`
- `stage2_gate_ready_for_review`
- `overclaim_blocked`

## Stage 2 promotion requirements beyond this patch

A Stage 2 promotion requires externally reproducible MESA/GYRE or equivalent solver-backed runs, documented input hashes, profile hashes, observational closure, uncertainty propagation, benchmark residuals, claim IDs, citations, and independent review. Even a Stage 2-ready StarSim fusion lane remains proxy-only for QST and does not promote ER=EPR, Needle Hull, or warp claims to CL0-CL4.

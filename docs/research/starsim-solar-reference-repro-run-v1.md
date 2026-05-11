# StarSim Solar Reference Reproduction Run V1

## Claim boundary

`STARSIM_SOLAR_REFERENCE_REPRO_RUN_V1` is a solar stellar-physics reference-run pipeline. It can improve StarSim stellar-microphysics fidelity, but it is not direct ER=EPR evidence, not Needle Hull evidence, not warp support, and not a stress-energy source.

All outputs preserve:

```ts
spacetimeCL = "proxy_only"
mayPromoteToCL4 = false
```

## Why the Sun is the first reference run

The Sun has profile, luminosity, neutrino, and seismic closure handles. That makes it the best first reference object for a reproducible StarSim fusion pipeline.

## Runtime modes

Runtime modes are `disabled`, `fixture_only`, `local`, `docker`, and `wsl`. CI uses `fixture_only` explicitly. External modes must fail if the solver is unavailable; they may not silently substitute fixtures.

## MESA metadata and profile hashes

Solver-backed claims require input and output fingerprints such as inlist hash, profile hash, history hash, nuclear network, reaction-rate source, EOS, opacity, atmosphere, composition, and target age metadata.

## Fusion profile validation

The runner converts the solar profile into the existing `STARSIM_FUSION_PROFILE_IMPORT_STAGE2_PREP` format, then validates shell-integrated luminosity, channel fractions, and fusion-zone radii.

## Benchmark report handoff

The runner creates a solar benchmark report using the existing `STARSIM_FUSION_BENCHMARK_STAGE2_CANDIDATE` contract.

## Stage 2 gate handoff

The runner feeds the benchmark report and solar closure summaries into `STARSIM_FUSION_EXTERNAL_REPRO_STAGE2_GATE`.

## Borexino neutrino closure

Borexino-style solar neutrino closure is used as a core-sensitive observational check. Residuals are diagnostic and inherit model-composition, opacity, reaction-rate, and neutrino-conversion assumptions.

## GYRE/helioseismic closure

GYRE-style summaries can provide optional large/small separation and mode-count closure. Fixture summaries do not certify a full pulsation run.

## hSpectralFit calibration boundary

`hSpectralFit` remains calibration-only. It cannot derive a new value of `h`.

## QST/ER=EPR non-promotion boundary

A solar reference run can strengthen StarSim stellar-microphysics fidelity. It cannot directly support ER=EPR. Direct ER=EPR support remains restricted to controlled holographic/toy-dual simulations under `ER_EPR_STAGE1_SIM`.

## Fixture-only versus solver-reproduced evidence

Fixture-only runs are deterministic regression artifacts. Solver-reproduced runs require external solver fingerprints and hashes. The runner refuses silent fixture fallback for external runtime modes.

## Future Stage 2 promotion requirements

Future promotion requires externally reproducible MESA/GYRE or equivalent solver-backed runs, retained input hashes, output hashes, profile-to-observable closure, uncertainty propagation, claim IDs, citations, and independent review. Even then, the solar reference lane remains proxy-only for QST.

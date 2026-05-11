# StarSim Solar MESA Docker Reproduction V1

## Claim boundary

`STARSIM_SOLAR_MESA_DOCKER_REPRO_V1` adds an external/import MESA path for the solar reference run. It is stellar microphysics infrastructure. It is not direct ER=EPR evidence, not a local bridge inventory, not Needle Hull or warp support, and not a stress-energy source.

## Why real solver hashes matter

External solver claims need retained input and output fingerprints. The patch requires hashes for inlists, profile output, history output, and run logs before a run can be treated as reproduced.

## Runtime modes

Supported runtime labels are `disabled`, `fixture_only`, `local`, `docker`, and `wsl`. The MESA repro tool rejects `fixture_only`; fixture mode belongs to the existing solar reference fixture runner.

## Docker/local/WSL policy

Docker, local, and WSL policies must declare working/output directories, inlist paths, output paths, and hash requirements. Docker policies can record image and digest metadata when available.

## No silent fixture fallback

The runtime policy uses `allowFixtureFallback: false`. Missing solver outputs cause clear failure.

## MESA inlist and output hashes

The adapter writes a run log and hashes the declared inlist, profile, history, photos, GYRE summary, and run log paths.

## MESA profile parser

The parser accepts MESA-like text tables, handles headers, checks numeric rows, and maps radius/mass/temperature/density/pressure/luminosity/epsilon/composition fields into the StarSim fusion profile schema.

## Profile validation handoff

Parsed profiles are validated with `STARSIM_FUSION_PROFILE_IMPORT_STAGE2_PREP`.

## Benchmark handoff

The parsed profile is passed to `STARSIM_FUSION_BENCHMARK_STAGE2_CANDIDATE`.

## Stage 2 gate handoff

Benchmark output is passed to `STARSIM_FUSION_EXTERNAL_REPRO_STAGE2_GATE`. The gate remains review-only.

## Optional GYRE summary import

GYRE summaries can be separately imported and hashed. They are optional and cannot certify the MESA run.

## Solar neutrino closure context

Borexino-style neutrino closure remains an observational residual check for solar-core fusion.

## QST/ER=EPR non-promotion boundary

A MESA-reproduced solar profile strengthens StarSim stellar-microphysics fidelity. It does not directly support ER=EPR. Direct ER=EPR support remains restricted to controlled holographic/toy-dual simulations under `ER_EPR_STAGE1_SIM`.

## Fixture-only versus imported versus reproduced

Fixture-only data is not accepted by this tool. Imported declared MESA-like outputs are labeled imported. Reproduced output requires complete hashes and runtime metadata.

## Future work: external independent reproduction

The next maturity step is running an actual MESA Docker/local/WSL profile outside fixtures, retaining solver logs, and comparing independent reproduction outputs.

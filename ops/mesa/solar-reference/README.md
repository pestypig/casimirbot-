# StarSim Solar MESA Reference

This directory contains the minimal policy and MESA-like fixtures used by the
`STARSIM_SOLAR_MESA_DOCKER_REPRO_V1` adapter tests. The default repo workflow
imports declared MESA-like outputs and labels them `mesa_imported`; it does not
claim external reproduction.

Real `local`, `docker`, or `wsl` runs must provide solver outputs, run logs, and
input/output hashes. Fixture fallback is not allowed for those modes.

# Theory Runtime Adapter Gap Report

Generated: 2026-05-29T21:00:39.981Z

This report inventories adapter coverage per Physics Atlas lane. It is metadata-only: it reads registered atlas blocks, runtime entrypoints, adapter declarations, static/reference trace declarations, and theory badges. It does not execute runtime commands.

## Summary

- Graph: `nhm2-theory-badge-graph`
- Badges in graph: 105
- Lanes: 9
- Static/reference trace coverage: 9
- Artifact reader coverage: 6
- Quick runtime coverage: 4
- Long runtime manifest coverage: 2
- Live runtime coverage: 0

## Lane Coverage

| Lane | Primary | Roots | Boundaries | Calculator examples | Runtime actions | Entrypoints | Adapters | Static | Artifact reader | Quick runtime | Long manifest | Live runtime | Missing | Next patch |
| --- | ---: | ---: | ---: | ---: | ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `stellar_evolution` | 5 | 2 | 1 | 1 | 1 | - | `starsim.artifact_reader` | yes | yes | no | no | no | `quick_runtime`, `long_job_manifest`, `live_runtime` | feat(theory): add quick runtime adapter for stellar_evolution |
| `cosmic_distance_ladder` | 5 | 2 | 1 | 1 | 0 | - | `static.cosmic_distance_reference` | yes | no | no | no | no | `artifact_reader`, `quick_runtime`, `long_job_manifest`, `live_runtime` | feat(theory): add artifact reader adapter for cosmic_distance_ladder |
| `solar_surface_spectrum` | 11 | 3 | 1 | 2 | 1 | `solar.pipeline`, `solar.manifest` | `static.solar_reference`, `theory.small_runtime_adapters`, `theory.evidence_artifact_resolver` | yes | yes | yes | no | no | `long_job_manifest`, `live_runtime` | feat(theory): add long runtime manifest support for solar_surface_spectrum |
| `casimir_cavity_modes` | 11 | 2 | 2 | 2 | 0 | `casimir.verify` | `static.casimir_reference`, `theory.small_runtime_adapters`, `theory.evidence_artifact_resolver` | yes | yes | yes | no | no | `long_job_manifest`, `live_runtime` | feat(theory): add long runtime manifest support for casimir_cavity_modes |
| `warp_gr_nhm2` | 9 | 2 | 1 | 2 | 1 | `gr.loop`, `physics.validate`, `warp.full_solve.campaign`, `nhm2.shift_lapse.alpha_sweep` | `static.gr_tensor_reference`, `static.cosmic_distance_reference`, `static.galactic_dynamics_reference`, `static.curvature_collapse_reference`, `theory.small_runtime_adapters`, `theory.evidence_artifact_resolver`, `warp_nhm2.artifact_adapters`, `theory.long_runtime_manifest` | yes | yes | yes | yes | no | `live_runtime` | feat(theory): add explicit live runtime adapter for warp_gr_nhm2 |
| `qei_stress_energy` | 7 | 2 | 1 | 2 | 0 | `gr.loop`, `physics.validate`, `warp.full_solve.campaign`, `nhm2.shift_lapse.alpha_sweep` | `static.gr_tensor_reference`, `static.cosmic_distance_reference`, `static.galactic_dynamics_reference`, `static.curvature_collapse_reference`, `theory.small_runtime_adapters`, `theory.evidence_artifact_resolver`, `warp_nhm2.artifact_adapters`, `theory.long_runtime_manifest` | yes | yes | yes | yes | no | `live_runtime` | feat(theory): add explicit live runtime adapter for qei_stress_energy |
| `tokamak_plasma` | 12 | 2 | 1 | 3 | 1 | - | `tokamak.artifact_reader` | yes | yes | no | no | no | `quick_runtime`, `long_job_manifest`, `live_runtime` | feat(theory): add quick runtime adapter for tokamak_plasma |
| `galactic_dynamics` | 11 | 2 | 2 | 4 | 1 | - | `static.galactic_dynamics_reference` | yes | no | no | no | no | `artifact_reader`, `quick_runtime`, `long_job_manifest`, `live_runtime` | feat(theory): add artifact reader adapter for galactic_dynamics |
| `curvature_collapse` | 10 | 2 | 1 | 4 | 1 | - | `static.curvature_collapse_reference` | yes | no | no | no | no | `artifact_reader`, `quick_runtime`, `long_job_manifest`, `live_runtime` | feat(theory): add artifact reader adapter for curvature_collapse |

## Guardrails

- `static_reference` means a reference/static shell trace exists. It is not backend tensor/runtime execution.
- `artifact_reader` means existing artifacts can be inspected. Missing or stale artifacts still fail closed.
- `quick_runtime` means an allowlisted small runtime adapter exists. This report does not run it.
- `long_job_manifest` means a manifest/status shell exists for a long job. It does not imply a worker ran.
- `live_runtime` is false unless an adapter explicitly declares live runtime coverage.
- Claim-boundary badge IDs are preserved per lane in the JSON artifact.

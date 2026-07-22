# Casimir–DP Manifold-Response Experiment Design Report

**Campaign:** `boundary-coherence-platform-screen-v1`  
**Generated:** 2026-07-21T14:47:19.164Z  
**Evidence cutoff:** 2026-07-21  
**Claim tier:** diagnostic  
**Promotion allowed:** false

This report compares engineering readiness only. It does not select a physically viable experiment or compute a manifold-induced collapse rate.

## Comparison

| Candidate | Engineering index | Ideal force SNR | Unmodeled phase (rad) | Environmental visibility | DP tau (s) | Open blockers |
|---|---:|---:|---:|---:|---:|---:|
| Cryogenic nanomechanical resonator with superconducting-transition boundary | 0.580 | 1.300e+6 | 1.233e-7 | 0.900 | unresolved | 7 |
| Cryogenic levitated nanoparticle with symmetric electrically gated 2D boundaries | 0.390 | 163.3786 | 0.3098 | 0.807 | 8.431e+6 | 8 |
| Free-flight nanoparticle matter wave with photoexcited semiconductor boundary | 0.288 | 6.5351 | 8.242e+5 | 0.242 | 3.058e+11 | 8 |

## Campaign gates

- `publication_grade_casimir_solver`: `not_ready`
- `measured_decoherence_budget`: `not_ready`
- `realistic_dp_branch_receipts`: `not_ready`
- `manifold_response_dynamics`: `blocked`
- `collapse_identifiability`: `blocked`

## Cryogenic levitated nanoparticle with symmetric electrically gated 2D boundaries

- Study role: `integrated_development_candidate`
- Platform: `levitated_nanoparticle`
- Boundary actuator: `electrically_gated_2d_material`
- Engineering screening index: `0.390332`
- Ideal-reference force: `-1.634e-16 N`
- Residual force phase: `0.3098 rad`
- Environmental visibility: `0.806541`
- DP status / tau: `computed_gaussian_proxy` / `8.431e+6 s`
- Promotion allowed: `false`

### Gates

- `casimir_reference_detectable`: `pass`
- `material_geometry_authority`: `not_ready`
- `branch_force_symmetry`: `review`
- `standard_decoherence_budget`: `review`
- `switching_disturbance`: `not_ready`
- `dp_branch_resolution`: `review`
- `dp_experimental_bounds`: `review`
- `manifold_response_model`: `blocked`
- `collapse_identifiability`: `blocked`

### Evidence anchors

- https://doi.org/10.1038/s41586-021-03617-w
- https://doi.org/10.1038/ncomms14699

## Cryogenic nanomechanical resonator with superconducting-transition boundary

- Study role: `casimir_calibration_candidate`
- Platform: `nanomechanical_resonator`
- Boundary actuator: `superconducting_transition`
- Engineering screening index: `0.580061`
- Ideal-reference force: `-1.300e-9 N`
- Residual force phase: `1.233e-7 rad`
- Environmental visibility: `0.900307`
- DP status / tau: `unresolved` / `unresolved s`
- Promotion allowed: `false`

### Gates

- `casimir_reference_detectable`: `pass`
- `material_geometry_authority`: `not_ready`
- `branch_force_symmetry`: `pass`
- `standard_decoherence_budget`: `review`
- `switching_disturbance`: `not_ready`
- `dp_branch_resolution`: `not_ready`
- `dp_experimental_bounds`: `review`
- `manifold_response_model`: `blocked`
- `collapse_identifiability`: `blocked`

### Evidence anchors

- https://doi.org/10.1038/s41378-020-00221-2
- https://doi.org/10.1038/s41467-026-75261-9

## Free-flight nanoparticle matter wave with photoexcited semiconductor boundary

- Study role: `spatial_superposition_benchmark`
- Platform: `free_flight_matter_wave`
- Boundary actuator: `photoexcited_semiconductor`
- Engineering screening index: `0.288343`
- Ideal-reference force: `-6.535e-20 N`
- Residual force phase: `8.242e+5 rad`
- Environmental visibility: `0.241714`
- DP status / tau: `computed_gaussian_proxy` / `3.058e+11 s`
- Promotion allowed: `false`

### Gates

- `casimir_reference_detectable`: `pass`
- `material_geometry_authority`: `not_ready`
- `branch_force_symmetry`: `review`
- `standard_decoherence_budget`: `not_ready`
- `switching_disturbance`: `review`
- `dp_branch_resolution`: `review`
- `dp_experimental_bounds`: `review`
- `manifold_response_model`: `blocked`
- `collapse_identifiability`: `blocked`

### Evidence anchors

- https://doi.org/10.1038/s41586-025-09917-9
- https://doi.org/10.1103/PhysRevB.76.035338

## Claim boundaries

- The engineering screening index is not a physics-evidence score or platform selection.
- Ideal parallel-plate Casimir rows are reference values, not finite-geometry apparatus predictions.
- Gaussian DP rows are diagnostic proxies and do not replace measured material-density branches.
- No manifold-response or boundary-conditioned objective-collapse rate is computed.
- Visibility loss cannot be identified with collapse without a dynamics-level secondary observable.
- No candidate is promoted above diagnostic design status.

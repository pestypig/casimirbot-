# Casimir-DP Stage-4.2L empirical-authority closure report

**Run:** `casimir-dp-empirical-authority-stage4-2l-v1-20260806T060000000Z`  
**Evidence:** synthetic and literature-bound diagnostic only  
**Claim ceiling:** apparatus redesign and empirical acquisition requirements only

## Result

The software diagnostic passes, but the frozen reference apparatus requires redesign before an empirical pilot. The 3D coordinate frame and tangential branch are now explicit; they are an engineering design authority, not as-built metrology. The finite rectangular-plate calculation is a solid-angle-weighted retarded Casimir-Polder surrogate and not a full Maxwell Green tensor.

## Geometry and phase screen

- Branch vector: `[1.6e-7,0,0] m`.
- Plate normal: `[0,0,1]`.
- Nominal analytic finite-surrogate phase: `0 rad`.
- Primary/secondary energy cross-check relative error: `0.0000011450042480639861`.
- Synthetic covariance phase sigma: `12826.003657187694 rad`.
- Registered maximum phase sigma: `0.03464404998245921 rad`.
- Lateral one-sigma requirement: `5.4998725219681355e-14 m`.
- Branch-angle one-sigma requirement: `4.3851794409044e-12 rad`.
- Design gate: `no_go`.

The zero nominal phase follows the centered tangential symmetry. It does not survive the stated design jitter. This is a redesign screen, not evidence that a real apparatus has zero phase or that the calculated tolerances have been achieved.

## Material authority

The ingestion schema is frozen as `frequency_hz_epsilon_real_epsilon_imaginary_covariance_v1`, but the specimen row count is `0`. The room-temperature literature proxy differs from the proposed apparatus temperature by `289.15 K`; specimen-specific cryogenic authority remains `not_ready`.

## Quantum-linear-Boltzmann screen

- Proxy gas decoherence rate: `17.28236105118056 s^-1`.
- Proxy gas/DP ratio: `719.9722624789147`.
- Pressure for one tenth of the registered DP rate: `2.7778847939417285e-15 Pa`.
- Proxy gate: `no_go`.
- Measured QLBE authority: `not_ready`.

The QLBE structure is now executable, but the isotropic total-cross-section proxy does not replace species-resolved differential-scattering measurements or confinement corrections.

## State preparation and external bound

The reference object is `688596.3708244892` times more massive and `69.07559059950724` times larger in diameter than the 2026 170 kDa matter-wave benchmark, although its 160 nm separation is only `1.2030075187969924` times the demonstrated 133 nm separation. The material and platform differ, so integrated state preparation remains `not_ready`.

The frozen `R0 = 1e-7 m` point is `204.08163265306123` times above the XENONnT 90% CL scalar lower bound and is not excluded by that scalar screen. This is not a full likelihood or composite-normalization recast.

## Mass-density sensitivity

At the registered cutoff, the four computed representations span `3.738617999271327e-37 J` to `2.5314140481630452e-36 J`, a factor of `6.770988768193029`. Internal-density and coating metrology remain absent, so this is a sensitivity envelope rather than complete mass-density authority.

## Standing

- `software_contract`: `pass`.
- `apparatus_design_manifest`: `frozen_reference_only`.
- `as_built_geometry`: `not_ready`.
- `full_finite_geometry_green_authority`: `not_ready`.
- `measured_material_spectrum`: `not_ready`.
- `empirical_phase_covariance`: `not_ready`.
- `measured_qlbe_environment`: `not_ready`.
- `state_preparation`: `not_ready`.
- `external_bound_mapping`: `partial_scalar_screen_only`.
- `complete_mass_density_authority`: `not_ready`.
- `residual_attribution`: `blocked`.
- `confirmatory_campaign`: `not_authorized`.
- `transfer_kernel`: `not_registered`.
- `measured_evidence`: `not_ready`.
- `collapse_identification`: `blocked`.
- `manifold_dynamics`: `blocked`.
- `physical_viability`: `not_evaluated`.

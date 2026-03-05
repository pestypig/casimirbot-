# Casimir Tile SEM + Ellipsometry Cross-Validation Protocol v1

"This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim."

## Purpose
Define a traceable, uncertainty-bounded cross-instrument workflow for dimensional claims using:
- SEM lateral metrology (calibrated magnification and edge localization),
- ellipsometry thickness/optical-model estimates,
- AFM-derived calibration priors where applicable.

## Scope
In scope:
- nm-scale dimension claims that require reconciliation across SEM and ellipsometry.
- uncertainty-propagated acceptance decisions for critical dimensions.

Out of scope:
- uncalibrated SEM/ellipsometry claims,
- any hard claim without documented uncertainty propagation.

## Required Inputs
- SEM calibration run against traceable reference material (`sem_ref_id`, `scale_factor_sem`, `u_scale_sem`).
- SEM measurement set (`d_sem_raw_nm`, `u_edge_sem_nm`, processing settings).
- Ellipsometry model run (`d_ellip_raw_nm`, model class, fit residuals, `u_model_ellip_nm`).
- Environmental and drift logs (`u_drift_sem_nm`, `u_temp_nm`, `u_repeat_nm`).
- Optional AFM prior lane (`d_afm_nm`, `u_afm_nm`) for deconvolution/edge sanity checks.

## Core Equations

1. SEM scale-corrected estimate:
`d_sem_corr = d_sem_raw * scale_factor_sem + b_sem`

2. SEM combined standard uncertainty:
`u_sem = sqrt((d_sem_raw*u_scale_sem)^2 + u_edge_sem^2 + u_drift_sem^2 + u_repeat_sem^2 + u_temp_sem^2)`

3. Ellipsometry combined standard uncertainty:
`u_ellip = sqrt(u_fit_ellip^2 + u_model_ellip^2 + u_refindex_ellip^2 + u_repeat_ellip^2 + u_temp_ellip^2)`

4. Cross-instrument residual:
`delta_se_nm = d_sem_corr - d_ellip_raw`

5. Inverse-variance fused estimate (independence assumption):
`d_fused = (d_sem_corr/u_sem^2 + d_ellip_raw/u_ellip^2) / (1/u_sem^2 + 1/u_ellip^2)`

6. Fused standard uncertainty:
`u_fused = sqrt(1 / (1/u_sem^2 + 1/u_ellip^2) + u_common^2)`

7. Expanded uncertainty:
`U_fused = k * u_fused` (default `k=2` unless contract specifies otherwise)

## Acceptance Profiles

### SE-STD-2
- `abs(delta_se_nm) <= 2.0`
- `U_fused <= 2.0 nm`
- SEM calibration traceability evidence present
- Ellipsometry model and fit residual evidence present

### SE-ADV-1
- `abs(delta_se_nm) <= 1.0`
- `U_fused <= 1.0 nm`
- Same evidentiary requirements as `SE-STD-2` with tighter bounds

## Monte Carlo Cross-Check
Required when nonlinearity or correlated terms are material.

Record:
- `mc_samples`
- `mc_delta_p95_nm`
- `mc_U_fused_nm`
- `rho_sem_ellip` (assumed/estimated correlation)

Fail closed if:
- Monte Carlo 95% interval for `delta_se_nm` crosses profile bound.

## Deterministic Falsifiers
1. Missing SEM calibration reference or uncertified scale chain.
2. Missing ellipsometry model assumptions or fit diagnostics.
3. Missing uncertainty components for either instrument.
4. `abs(delta_se_nm)` above profile bound.
5. `U_fused` above profile bound.
6. Any required source marked `non-admissible` for normative use.

## Required Reporting Block
- `profile_id`
- `d_sem_corr_nm`, `u_sem_nm`
- `d_ellip_nm`, `u_ellip_nm`
- `delta_se_nm`
- `d_fused_nm`, `u_fused_nm`, `U_fused_nm`
- `mc_delta_p95_nm` (if MC run)
- `source_ids` (primary/standard anchors)
- `recompute_status` (`pass`, `partial`, `blocked`)

## Source Anchors
- `SRC-040` ISO 19749:2021 (SEM image-based particle size/shape methods)
- `SRC-041` NIST SEM calibration standard uncertainty (SRM-484)
- `SRC-043` ISO 16700:2016 (SEM magnification calibration guidelines)
- `SRC-045` NIST publication page for SRM-484 SEM uncertainty methodology
- `SRC-046` NIST SEM magnification calibration procedure anchor
- `SRC-047` NIST high-accuracy SEM calibration procedure update
- `SRC-048` NIST TEM calibration linkage for CD-AFM tip-width workflows
- `SRC-035` NIST CD-AFM uncertainty anchor (optional AFM prior lane)
- `SRC-042` arXiv 1812.09157 (exploratory uncertainty modeling guidance)
- `SRC-050` BAM Reference Procedure 53 (ellipsometry uncertainty anchor with XRR linkage)

Outstanding closure gap:
- Cross-instrument raw datasets and covariance terms are still required to promote this lane from `partial` to replay-grade `pass`.

## Traceability
- `spec_version`: `casimir-tile-sem-ellipsometry-cross-validation-protocol-v1`
- `commit_pin`: `e240431948598a964a9042ed929a076f609b90d6`
- `owner`: `nanometrology-and-calibration`
- `status`: `draft_v2`
